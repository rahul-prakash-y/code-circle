process.env.NODE_ENV = 'test';
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB, { disconnectDB } from '../config/db';
import { AttendanceBuffer, attendanceBuffer } from '../services/attendanceBuffer';
import AttendanceModel from '../models/attendanceModel';
import { server } from '../server';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';

const JWT_SECRET = process.env.JWT_SECRET || 'stellar-minimalist-secret-key-2026';

let passed = 0;
let failed = 0;

const assert = (condition: boolean, testName: string, extra = '') => {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName} ${extra}`);
    failed++;
  }
};

async function runTests() {
  console.log('===============================================================');
  console.log('  STARTING IN-MEMORY ATTENDANCE BUFFER VERIFICATION SUITE       ');
  console.log('===============================================================');

  try {
    // 1. Connect to MongoDB
    await connectDB();
    console.log('[Test] Connected to MongoDB Atlas');

    // Clean up test attendance records
    await AttendanceModel.deleteMany({ eventId: { $regex: /^test-event-/ } });

    // -------------------------------------------------------------
    // UNIT TESTS: AttendanceBuffer Class
    // -------------------------------------------------------------
    console.log('\n--- Section 1: In-Memory AttendanceBuffer Unit Tests ---');
    const buffer = new AttendanceBuffer();
    buffer.clear();

    const testEventId = 'test-event-101';
    const testOtp = '123456';
    const testUserId = 'test-user-001';

    // Test 1: setEventOTP & getEventOTP
    buffer.setEventOTP(testEventId, testOtp);
    assert(buffer.getEventOTP(testEventId) === testOtp, 'setEventOTP saves active OTP in memory');
    assert(buffer.activeOTPs.get(testEventId) === testOtp, 'activeOTPs map holds correct entry');

    // Test 2: Invalid OTP rejection
    const invalidOtpRes = buffer.verifyAndQueue(testUserId, testEventId, '999999');
    assert(invalidOtpRes.success === false, 'verifyAndQueue rejects incorrect OTP');
    assert(invalidOtpRes.error?.includes('Invalid') === true, 'Error message indicates invalid OTP');
    assert(buffer.writeQueue.length === 0, 'writeQueue remains empty on invalid OTP');

    // Test 3: Valid OTP acceptance & queuing
    const t0 = performance.now();
    const validRes = buffer.verifyAndQueue(testUserId, testEventId, testOtp);
    const duration = performance.now() - t0;
    assert(validRes.success === true, 'verifyAndQueue accepts valid OTP');
    assert(duration < 5, `verifyAndQueue executes in under 5ms (${duration.toFixed(3)}ms)`);
    assert(buffer.writeQueue.length === 1, 'writeQueue contains queued attendance item');
    assert(buffer.markedSet.has(`${testUserId}:${testEventId}`), 'markedSet contains "userId:eventId"');

    // Test 4: Duplicate submission rejection in memory
    const dupRes = buffer.verifyAndQueue(testUserId, testEventId, testOtp);
    assert(dupRes.success === false, 'Duplicate attendance is rejected immediately from markedSet');
    assert(dupRes.error?.includes('already been marked') === true, 'Duplicate error message returned');
    assert(buffer.writeQueue.length === 1, 'Duplicate did not increase writeQueue length');

    // Test 5: Simulating 50+ concurrent items triggering threshold flush
    console.log('\n--- Section 2: Threshold Auto-Flush & bulkWrite Batching ---');
    buffer.clear();
    buffer.setEventOTP(testEventId, testOtp);

    // Enqueue 49 items
    for (let i = 1; i <= 49; i++) {
      buffer.verifyAndQueue(`test-user-${i}`, testEventId, testOtp);
    }
    assert(buffer.writeQueue.length === 49, 'Queue length is 49 before threshold');

    // 50th item triggers flush
    buffer.verifyAndQueue('test-user-50', testEventId, testOtp);
    assert(buffer.writeQueue.length === 0, 'writeQueue is emptied after threshold flush');

    // Wait for the asynchronous bulkWrite to MongoDB Atlas cloud cluster to finish
    let waitCount = 0;
    while (
      (buffer.isFlushing || (await AttendanceModel.countDocuments({ eventId: testEventId })) < 50) &&
      waitCount < 50
    ) {
      await new Promise((r) => setTimeout(r, 100));
      waitCount++;
    }

    // Verify 50 records in MongoDB Atlas
    const countInDb = await AttendanceModel.countDocuments({ eventId: testEventId });
    assert(countInDb === 50, `MongoDB Atlas contains exactly 50 records via bulkWrite (got ${countInDb})`);

    // Test 6: Idempotency with upsert: true
    console.log('\n--- Section 3: Idempotency & Concurrency Lock ---');
    while (buffer.isFlushing) {
      await new Promise((r) => setTimeout(r, 50));
    }
    buffer.writeQueue.push({
      userId: 'test-user-1',
      eventId: testEventId,
      timestamp: new Date(),
    });
    const flushRes = await buffer.flush();
    assert(flushRes.flushedCount === 1, 'flush() flushes 1 queued item');
    const countAfterUpsert = await AttendanceModel.countDocuments({ eventId: testEventId });
    assert(countAfterUpsert === 50, 'upsert: true prevented duplicate insertion in database');

    // Test 7: isFlushing Mutex Lock
    buffer.writeQueue.push({
      userId: 'test-user-lock',
      eventId: testEventId,
      timestamp: new Date(),
    });
    buffer.isFlushing = true;
    const lockedFlush = await buffer.flush();
    assert(lockedFlush.flushedCount === 0, 'isFlushing lock prevents concurrent flush execution');
    buffer.isFlushing = false;
    await buffer.flush(); // Clean it up

    buffer.stop();

    // -------------------------------------------------------------
    // FASTIFY HTTP ROUTES INTEGRATION TESTS
    // -------------------------------------------------------------
    console.log('\n--- Section 4: Fastify HTTP Routes Integration Tests ---');
    await server.ready();

    // Setup attendanceBuffer singleton
    attendanceBuffer.clear();
    const routeEventId = 'test-event-routes-200';
    const routeOtp = '654321';
    attendanceBuffer.setEventOTP(routeEventId, routeOtp);

    // Warm-up calls to initialize Fastify JIT schema serializers and V8 optimizer
    for (let w = 0; w < 3; w++) {
      await server.inject({
        method: 'POST',
        url: '/api/attendance/submit',
        payload: {
          eventId: routeEventId,
          otp: routeOtp,
          userId: `warmup-user-${w}`,
        },
      });
      attendanceBuffer.markedSet.delete(`warmup-user-${w}:${routeEventId}`);
    }
    attendanceBuffer.writeQueue = attendanceBuffer.writeQueue.filter((i) => !i.userId.startsWith('warmup-user-'));

    // Test 8: POST /api/attendance/submit response latency < 5ms
    const submitStart = performance.now();
    const submitResponse = await server.inject({
      method: 'POST',
      url: '/api/attendance/submit',
      payload: {
        eventId: routeEventId,
        otp: routeOtp,
        userId: 'route-user-1',
      },
    });
    const submitLatency = performance.now() - submitStart;

    assert(submitResponse.statusCode === 200, 'POST /api/attendance/submit returns HTTP 200');
    assert(submitLatency < 5, `Route latency is strictly under 5ms (${submitLatency.toFixed(3)}ms)`);
    const submitJson = JSON.parse(submitResponse.body);
    assert(submitJson.success === true, 'Submission response indicates success');
    assert(attendanceBuffer.writeQueue.length >= 1, 'attendanceBuffer queue has item pending');

    // Test 9: Duplicate submission via HTTP returns 400
    const dupHttpRes = await server.inject({
      method: 'POST',
      url: '/api/attendance/submit',
      payload: {
        eventId: routeEventId,
        otp: routeOtp,
        userId: 'route-user-1',
      },
    });
    assert(dupHttpRes.statusCode === 400, 'Duplicate submission returns HTTP 400');
    const dupHttpJson = JSON.parse(dupHttpRes.body);
    assert(dupHttpJson.success === false, 'Duplicate response indicates failure');

    // Test 10: Invalid OTP via HTTP returns 400
    const invHttpRes = await server.inject({
      method: 'POST',
      url: '/api/attendance/submit',
      payload: {
        eventId: routeEventId,
        otp: '000000',
        userId: 'route-user-2',
      },
    });
    assert(invHttpRes.statusCode === 400, 'Invalid OTP returns HTTP 400');

    // Test 11: POST /api/admin/sync-db without token is rejected
    const unauthSyncRes = await server.inject({
      method: 'POST',
      url: '/api/admin/sync-db',
    });
    assert(unauthSyncRes.statusCode === 401, 'POST /api/admin/sync-db rejects unauthenticated request with 401');

    // Find or create a SuperAdmin user for token test
    let superAdmin = await User.findOne({ role: 'SuperAdmin' });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'Super Admin Test',
        email: `superadmin-test-${Date.now()}@codecircle.com`,
        password: 'Password123!',
        role: 'SuperAdmin',
        rollNo: `SA${Date.now()}`,
      });
    }

    const superAdminToken = jwt.sign(
      {
        id: superAdmin._id.toString(),
        role: 'SuperAdmin',
        email: superAdmin.email,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Find or create a Student user for 403 test
    let studentUser = await User.findOne({ role: 'Student' });
    if (!studentUser) {
      studentUser = await User.create({
        name: 'Student Test',
        email: `student-test-${Date.now()}@codecircle.com`,
        password: 'Password123!',
        role: 'Student',
        rollNo: `ST${Date.now()}`,
      });
    }

    const studentToken = jwt.sign(
      {
        id: studentUser._id.toString(),
        role: 'Student',
        email: studentUser.email,
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Test 12: Non-superadmin is rejected (403)
    const studentSyncRes = await server.inject({
      method: 'POST',
      url: '/api/admin/sync-db',
      headers: {
        authorization: `Bearer ${studentToken}`,
      },
    });
    assert(studentSyncRes.statusCode === 403, 'POST /api/admin/sync-db rejects non-SuperAdmin with 403');

    // Ensure item in writeQueue to verify flush count
    attendanceBuffer.writeQueue.push({
      userId: 'route-user-1',
      eventId: routeEventId,
      timestamp: new Date(),
    });

    // Test 13: Superadmin forceful sync-db
    const superAdminSyncRes = await server.inject({
      method: 'POST',
      url: '/api/admin/sync-db',
      headers: {
        authorization: `Bearer ${superAdminToken}`,
      },
    });
    assert(superAdminSyncRes.statusCode === 200, 'Superadmin POST /api/admin/sync-db returns HTTP 200');
    const syncJson = JSON.parse(superAdminSyncRes.body);
    assert(syncJson.success === true, 'sync-db confirms success');
    assert(syncJson.remaining === 0, 'sync-db returns remaining items in queue (0)');
    assert(syncJson.flushedCount >= 1, `sync-db reports flushed count (${syncJson.flushedCount})`);

    // Verify written to database
    const routeRecord = await AttendanceModel.findOne({
      userId: 'route-user-1',
      eventId: routeEventId,
    });
    assert(!!routeRecord, 'Route submission was successfully persisted to MongoDB Atlas via sync-db');

    // Cleanup
    await AttendanceModel.deleteMany({ eventId: { $regex: /^test-event-/ } });
    attendanceBuffer.stop();

    console.log('\n===============================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED               `);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error in tests:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
    await server.close();
  }
}

runTests();
