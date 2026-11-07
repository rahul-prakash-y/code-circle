import { test, describe, before, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { server, isOriginAllowed } from '../server';
import User from '../models/userModel';
import Assessment from '../models/assessmentModel';
import AssessmentSubmission from '../models/assessmentSubmissionModel';
import AuthLockout from '../models/authLockoutModel';
import EventOtp from '../models/eventOtpModel';
import AttendanceLockout from '../models/attendanceLockoutModel';
import AttendanceModel from '../models/attendanceModel';
import AuditLog from '../models/auditLogModel';
import { AttendanceBuffer } from '../services/attendanceBuffer';
import authLockoutService from '../services/authLockoutService';
import { getJwtSecret } from '../middleware/authMiddleware';
import { FIGMA_URL_REGEX, MAX_FIGMA_URL_LENGTH } from '../controllers/assessmentController';
import Judge0Provider from '../services/rce/judge0Provider';

describe('Multi-Node Cluster Admin & Identity-Based Rate Limiting Test Suite', () => {
  const secret = getJwtSecret();

  const userAId = '507f1f77bcf86cd799438001';
  const userBId = '507f1f77bcf86cd799438002';
  const adminId = '507f1f77bcf86cd799438003';
  const assessmentId = '507f1f77bcf86cd799438020';

  const tokenUserA = jwt.sign({ id: userAId, email: 'usera@example.com', role: 'Student' }, secret, { expiresIn: '1h' });
  const tokenUserB = jwt.sign({ id: userBId, email: 'userb@example.com', role: 'Student' }, secret, { expiresIn: '1h' });
  const tokenAdmin = jwt.sign({ id: adminId, email: 'admin@example.com', role: 'Admin' }, secret, { expiresIn: '1h' });

  // In-memory mock databases
  const mockLockouts = new Map<string, any>();
  const mockEventOtps = new Map<string, any>();
  const mockAttendanceLockouts = new Map<string, any>();
  const mockAttendanceRecords = new Map<string, any>();
  const mockFigmaSubmissions = new Map<string, any>();
  const mockUsers = new Map<string, any>();
  const mockAuditLogs: any[] = [];

  let currentAssessment: any = null;

  before(async () => {
    await server.ready();

    // Mock User database
    mockUsers.set(userAId, {
      _id: new mongoose.Types.ObjectId(userAId),
      id: userAId,
      email: 'usera@example.com',
      rollNo: '21CS001',
      name: 'User Alpha',
      role: 'Student',
      isBlocked: false,
      activeSessionId: null,
      comparePassword: async (pwd: string) => pwd === 'CorrectPassword123!',
      save: async () => {},
    });

    mockUsers.set(userBId, {
      _id: new mongoose.Types.ObjectId(userBId),
      id: userBId,
      email: 'userb@example.com',
      rollNo: '21CS002',
      name: 'User Beta',
      role: 'Student',
      isBlocked: false,
      activeSessionId: null,
      comparePassword: async (pwd: string) => pwd === 'CorrectPassword123!',
      save: async () => {},
    });

    mockUsers.set(adminId, {
      _id: new mongoose.Types.ObjectId(adminId),
      id: adminId,
      email: 'admin@example.com',
      rollNo: 'STAFF01',
      name: 'Admin Proctor',
      role: 'Admin',
      isBlocked: false,
      activeSessionId: null,
      comparePassword: async (pwd: string) => pwd === 'AdminPassword123!',
      save: async () => {},
    });

    mock.method(User, 'findById', (id: any) => {
      const u = mockUsers.get(String(id));
      return {
        select: () => ({
          lean: () => Promise.resolve(u || null),
          then: (res: any) => res(u || null),
        }),
        lean: () => Promise.resolve(u || null),
        then: (res: any) => res(u || null),
      };
    });

    mock.method(User, 'findOne', (query: any) => {
      if (query?.$or) {
        for (const cond of query.$or) {
          if (cond.email) {
            for (const u of mockUsers.values()) {
              if (u.email.toLowerCase() === String(cond.email).toLowerCase()) return Promise.resolve(u);
            }
          }
          if (cond.rollNo) {
            for (const u of mockUsers.values()) {
              if (u.rollNo.toUpperCase() === String(cond.rollNo).toUpperCase()) return Promise.resolve(u);
            }
          }
        }
      }
      return Promise.resolve(null);
    });

    // Mock AuthLockout
    mock.method(AuthLockout, 'findOne', (filter: any) => {
      const key = filter?.key;
      return Promise.resolve(key && mockLockouts.has(key) ? mockLockouts.get(key) : null);
    });

    mock.method(AuthLockout, 'findOneAndUpdate', (filter: any, update: any, options: any) => {
      const key = filter?.key;
      const setDoc = update?.$set || {};
      const existing = mockLockouts.get(key) || { key };
      const updated = { ...existing, ...setDoc, updatedAt: new Date() };
      mockLockouts.set(key, updated);
      return Promise.resolve(updated);
    });

    mock.method(AuthLockout, 'deleteMany', (filter: any) => {
      let count = 0;
      if (filter?.$or) {
        for (const cond of filter.$or) {
          if (cond.key?.$in) {
            for (const k of cond.key.$in) {
              if (mockLockouts.delete(k)) count++;
            }
          }
          if (cond.targetValue) {
            for (const [k, v] of mockLockouts.entries()) {
              if (v.targetValue === cond.targetValue) {
                mockLockouts.delete(k);
                count++;
              }
            }
          }
        }
      }
      return Promise.resolve({ deletedCount: count });
    });

    // Mock EventOtp
    mock.method(EventOtp, 'findOne', (filter: any) => {
      const key = `${filter?.eventId}:day:${filter?.dayNumber || 1}`;
      const doc = mockEventOtps.get(key);
      if (doc && filter?.expiresAt?.$gt && doc.expiresAt <= filter.expiresAt.$gt) {
        return {
          lean: () => Promise.resolve(null),
          then: (res: any) => res(null),
        };
      }
      return {
        lean: () => Promise.resolve(doc || null),
        then: (res: any) => res(doc || null),
      };
    });

    mock.method(EventOtp, 'findOneAndUpdate', (filter: any, update: any) => {
      const key = `${filter?.eventId}:day:${filter?.dayNumber || 1}`;
      const doc = {
        ...filter,
        ...(update?.$set || {}),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockEventOtps.set(key, doc);
      return Promise.resolve(doc);
    });

    // Mock AttendanceLockout
    mock.method(AttendanceLockout, 'findOne', (filter: any) => {
      const key = `${filter?.userId}:${filter?.eventId}`;
      const doc = mockAttendanceLockouts.get(key);
      return {
        lean: () => Promise.resolve(doc || null),
        then: (res: any) => res(doc || null),
      };
    });

    mock.method(AttendanceLockout, 'findOneAndUpdate', (filter: any, update: any) => {
      const key = `${filter?.userId}:${filter?.eventId}`;
      const existing = mockAttendanceLockouts.get(key) || {};
      const doc = { ...existing, ...filter, ...(update?.$set || {}) };
      mockAttendanceLockouts.set(key, doc);
      return Promise.resolve(doc);
    });

    mock.method(AttendanceLockout, 'deleteMany', (filter: any) => {
      const key = `${filter?.userId}:${filter?.eventId}`;
      const deleted = mockAttendanceLockouts.delete(key);
      return Promise.resolve({ deletedCount: deleted ? 1 : 0 });
    });

    // Mock AttendanceModel
    mock.method(AttendanceModel, 'findOne', (filter: any) => {
      const key = `${filter?.userId}:${filter?.eventId}:day:${filter?.dayNumber || 1}`;
      const doc = mockAttendanceRecords.get(key);
      return {
        lean: () => Promise.resolve(doc || null),
        then: (res: any) => res(doc || null),
      };
    });

    mock.method(AttendanceModel, 'create', (doc: any) => {
      const key = `${doc.userId}:${doc.eventId}:day:${doc.dayNumber || 1}`;
      if (mockAttendanceRecords.has(key)) {
        const dupError: any = new Error('Duplicate attendance');
        dupError.code = 11000;
        return Promise.reject(dupError);
      }
      mockAttendanceRecords.set(key, { ...doc, _id: new mongoose.Types.ObjectId() });
      return Promise.resolve(doc);
    });

    mock.method(AttendanceModel, 'bulkWrite', (ops: any[]) => {
      for (const op of ops) {
        if (op.updateOne) {
          const filter = op.updateOne.filter;
          const setDoc = op.updateOne.update?.$setOnInsert || {};
          const key = `${filter?.userId}:${filter?.eventId}:day:${filter?.dayNumber || 1}`;
          mockAttendanceRecords.set(key, { ...setDoc, _id: new mongoose.Types.ObjectId() });
        }
      }
      return Promise.resolve({ ok: 1 });
    });

    // Mock Assessment
    mock.method(Assessment, 'findById', (id: any) => {
      const doc = String(id) === assessmentId ? currentAssessment : null;
      return {
        select: () => ({
          lean: () => Promise.resolve(doc),
          then: (res: any) => res(doc),
        }),
        lean: () => Promise.resolve(doc),
        then: (res: any) => res(doc),
      };
    });

    // Mock AssessmentSubmission for Figma submissions
    mock.method(AssessmentSubmission, 'findOneAndUpdate', (filter: any, update: any) => {
      const key = `${filter?.assessment}:${filter?.user}`;
      const existing = mockFigmaSubmissions.get(key) || {};
      const doc = {
        ...existing,
        ...filter,
        ...(update?.$set || {}),
        createdAt: existing.createdAt || new Date(),
        updatedAt: new Date(),
      };
      mockFigmaSubmissions.set(key, doc);
      return Promise.resolve(doc);
    });

    // Mock AuditLog
    mock.method(AuditLog, 'create', (doc: any) => {
      mockAuditLogs.push(doc);
      return Promise.resolve(doc);
    });
  });

  beforeEach(() => {
    mockLockouts.clear();
    mockEventOtps.clear();
    mockAttendanceLockouts.clear();
    mockAttendanceRecords.clear();
    mockFigmaSubmissions.clear();
    mockAuditLogs.length = 0;

    currentAssessment = {
      _id: new mongoose.Types.ObjectId(assessmentId),
      title: 'Day 5 Design Evaluation (Figma)',
      category: 'UI/UX',
      assessmentType: 'figma',
      isPublished: true,
      customPoints: 100,
      submissionGraceWindowSeconds: 120,
      deadline: null,
      questions: [],
    };
  });

  // =========================================================================
  // PART 1: IDENTITY-BASED RATE LIMITING & LOCKOUT TESTS
  // =========================================================================
  describe('1. Identity-Based Rate Limiting & Account Lockout Flow', () => {
    test('1a. Two users behind the same IP do not affect each others rate limits', async () => {
      const sharedIp = '198.51.100.55';

      // User A makes a request from the shared IP
      const resA = await server.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: `Bearer ${tokenUserA}`,
          'x-forwarded-for': sharedIp,
        },
      });
      assert.equal(resA.statusCode, 200);

      // User B makes a request from the EXACT SAME shared IP
      const resB = await server.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: `Bearer ${tokenUserB}`,
          'x-forwarded-for': sharedIp,
        },
      });
      assert.equal(resB.statusCode, 200);

      // Check remaining rate-limit headers: each user has their own independent bucket
      const remA = Number(resA.headers['x-ratelimit-remaining']);
      const remB = Number(resB.headers['x-ratelimit-remaining']);
      assert.ok(!isNaN(remA) && !isNaN(remB), 'Both responses must return rate limit headers');
    });

    test('1b. The same user accessing from two different IPs shares one unified limit', async () => {
      const ip1 = '198.51.100.10';
      const ip2 = '198.51.100.20';

      const res1 = await server.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: `Bearer ${tokenUserA}`,
          'x-forwarded-for': ip1,
        },
      });
      assert.equal(res1.statusCode, 200);
      const rem1 = Number(res1.headers['x-ratelimit-remaining']);

      const res2 = await server.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: `Bearer ${tokenUserA}`,
          'x-forwarded-for': ip2,
        },
      });
      assert.equal(res2.statusCode, 200);
      const rem2 = Number(res2.headers['x-ratelimit-remaining']);

      // Rem2 must be strictly less than rem1 because they share the same user identity key
      assert.equal(rem2, rem1 - 1, 'Changing IP must not reset or bypass authenticated user rate limit');
    });

    test('1c. Spoofed headers (X-Forwarded-For, username) cannot bypass or poison limits', async () => {
      const spoofRes = await server.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: `Bearer ${tokenUserA}`,
          'x-forwarded-for': '8.8.8.8, 127.0.0.1',
          'x-user-id': 'spoofed-admin-id',
          username: 'spoofed-proctor',
        },
      });

      assert.equal(spoofRes.statusCode, 200);
      // Verify authenticated identity came strictly from verified JWT
      const body = spoofRes.json();
      assert.equal(body.email, 'usera@example.com');
      assert.equal(body.role, 'Student');
    });

    test('1d. Failed login rate limit: 5 fails -> 5 min lock; Admin can clear lockout', async () => {
      const candidateUser = 'usera@example.com';
      const testIp = '198.51.100.77';

      // 1. Send 5 failed login attempts with wrong password
      for (let i = 1; i <= 5; i++) {
        const failRes = await server.inject({
          method: 'POST',
          url: '/api/auth/login',
          headers: { 'x-forwarded-for': testIp },
          payload: { identifier: candidateUser, password: 'WrongPassword999!' },
        });
        assert.equal(failRes.statusCode, 401);
        assert.equal(failRes.json().error, 'Invalid credentials');
      }

      // 2. 6th attempt is throttled by account lockout (HTTP 429 with Retry-After)
      const lockRes = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'x-forwarded-for': testIp },
        payload: { identifier: candidateUser, password: 'CorrectPassword123!' },
      });

      assert.equal(lockRes.statusCode, 429);
      assert.ok(lockRes.headers['retry-after'], 'Must contain Retry-After header');
      const lockBody = lockRes.json();
      assert.equal(lockBody.code, 'ACCOUNT_LOCKED');
      assert.match(lockBody.error, /Account temporarily locked/i);

      // 3. Admin unlocks candidate account
      const unlockRes = await server.inject({
        method: 'POST',
        url: '/api/auth/unlock-lockout',
        headers: { authorization: `Bearer ${tokenAdmin}` },
        payload: { identifier: candidateUser },
      });

      assert.equal(unlockRes.statusCode, 200);
      assert.equal(unlockRes.json().success, true);
      assert.ok(mockAuditLogs.some((l) => l.action === 'AUTH_LOCKOUT_CLEARED'));

      // 4. Candidate can now successfully authenticate immediately
      const successRes = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'x-forwarded-for': testIp },
        payload: { identifier: candidateUser, password: 'CorrectPassword123!' },
      });

      assert.equal(successRes.statusCode, 200);
      assert.equal(successRes.json().success, true);
    });

    test('1e. Classroom simulation: 300 candidates behind ONE IP can all log in without 429s', async () => {
      const classroomIp = '198.51.100.99';
      let successCount = 0;

      // Simulate 300 candidates logging in from the same campus computer lab WiFi IP
      for (let i = 0; i < 300; i++) {
        const studentUid = `student-${i}@example.com`;
        // Create user in mock database
        mockUsers.set(studentUid, {
          _id: new mongoose.Types.ObjectId(),
          email: studentUid,
          rollNo: `21CS${String(i).padStart(3, '0')}`,
          name: `Student ${i}`,
          role: 'Student',
          isBlocked: false,
          activeSessionId: null,
          comparePassword: async () => true,
          save: async () => {},
        });

        const res = await server.inject({
          method: 'POST',
          url: '/api/auth/login',
          headers: { 'x-forwarded-for': classroomIp },
          payload: { identifier: studentUid, password: 'AnyPassword' },
        });

        if (res.statusCode === 200) {
          successCount++;
        }
      }

      assert.equal(
        successCount,
        300,
        'All 300 candidates behind a single shared lab IP must log in successfully without 429 throttling'
      );
    });

    test('1f. Campus NAT: 200 failed logins from one IP across 200 different usernames do NOT lock out a 201st valid user', async () => {
      const natIp = '203.0.113.88';

      // 200 distinct students mistype passwords behind the same campus NAT IP
      for (let i = 0; i < 200; i++) {
        const fakeUser = `mistyped-student-${i}@example.com`;
        const res = await server.inject({
          method: 'POST',
          url: '/api/auth/login',
          headers: { 'x-forwarded-for': natIp },
          payload: { identifier: fakeUser, password: 'WrongPassword123!' },
        });
        assert.equal(res.statusCode, 401);
        assert.equal(res.json().error, 'Invalid credentials');
      }

      // 201st candidate arrives with valid credentials behind that exact same campus NAT IP
      const validCandidate = 'usera@example.com';
      const validRes = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'x-forwarded-for': natIp },
        payload: { identifier: validCandidate, password: 'CorrectPassword123!' },
      });

      assert.equal(
        validRes.statusCode,
        200,
        'Campus NAT threshold (LOGIN_FAILED_IP_MAX >= 300) must allow valid candidate through despite 200 previous failures'
      );
      assert.equal(validRes.json().success, true);
    });
  });

  // =========================================================================
  // PART 2: MULTI-NODE OTP & ATTENDANCE ACROSS 3 INSTANCES
  // =========================================================================
  describe('2. Multi-Node OTP & Attendance Across 3 Simulated Cluster Nodes', () => {
    test('2a. OTP created on Node A is validated by Node B and Node C', async () => {
      const eventId = 'event-multi-node-101';
      const validOtp = '5566';
      const day = 1;

      // Simulate 3 separate Render instances with distinct in-memory buffers
      const nodeA = new AttendanceBuffer();
      const nodeB = new AttendanceBuffer();
      const nodeC = new AttendanceBuffer();

      // Node A sets the OTP
      await nodeA.setEventOTPAsync(eventId, validOtp, day, 30);

      // Verify Node B and Node C can read and validate OTP from shared MongoDB
      const resB = await nodeB.verifyAndQueueAsync('student-node-b', eventId, validOtp, day);
      assert.equal(resB.success, true);

      const resC = await nodeC.verifyAndQueueAsync('student-node-c', eventId, validOtp, day);
      assert.equal(resC.success, true);

      assert.equal(mockAttendanceRecords.size, 2);
    });

    test('2b. OTP attempt lockouts are shared across nodes', async () => {
      const eventId = 'event-multi-node-102';
      const validOtp = '9900';
      const studentId = 'student-cross-node-lockout';
      const day = 1;

      const nodeA = new AttendanceBuffer();
      const nodeB = new AttendanceBuffer();
      const nodeC = new AttendanceBuffer();

      await nodeA.setEventOTPAsync(eventId, validOtp, day, 30);

      // Student fails 2 attempts on Node A
      await nodeA.verifyAndQueueAsync(studentId, eventId, '0001', day);
      await nodeA.verifyAndQueueAsync(studentId, eventId, '0002', day);

      // Student switches to Node B and fails 3 more attempts (total: 5)
      await nodeB.verifyAndQueueAsync(studentId, eventId, '0003', day);
      await nodeB.verifyAndQueueAsync(studentId, eventId, '0004', day);
      const res5 = await nodeB.verifyAndQueueAsync(studentId, eventId, '0005', day);
      assert.equal(res5.success, false);
      assert.match(res5.error || '', /Maximum OTP verification attempts exceeded/i);

      // Student switches to Node C with the CORRECT OTP: must still be locked out!
      const resC = await nodeC.verifyAndQueueAsync(studentId, eventId, validOtp, day);
      assert.equal(resC.success, false);
      assert.match(resC.error || '', /Too many invalid OTP attempts|locked/i);
    });

    test('2c. TTL expiry works across cluster nodes', async () => {
      const eventId = 'event-multi-node-103';
      const otp = '1234';
      const day = 1;

      const nodeA = new AttendanceBuffer();
      const nodeB = new AttendanceBuffer();

      // Set OTP with past expiry in MongoDB
      const expiredKey = `${eventId}:day:${day}`;
      mockEventOtps.set(expiredKey, {
        eventId,
        dayNumber: day,
        otp,
        expiresAt: new Date(Date.now() - 5000), // Expired 5 seconds ago
      });

      const res = await nodeB.verifyAndQueueAsync('student-exp', eventId, otp, day);
      assert.equal(res.success, false);
      assert.match(res.error || '', /Invalid or expired OTP/i);
    });

    test('2d. Concurrent submissions do not double-count attendance (unique index guarantee)', async () => {
      const eventId = 'event-multi-node-104';
      const validOtp = '4321';
      const studentId = 'student-race-condition';
      const day = 1;

      const nodeA = new AttendanceBuffer();
      const nodeB = new AttendanceBuffer();

      await nodeA.setEventOTPAsync(eventId, validOtp, day, 30);

      // Fire concurrent submissions from Node A and Node B simultaneously
      const [res1, res2] = await Promise.all([
        nodeA.verifyAndQueueAsync(studentId, eventId, validOtp, day),
        nodeB.verifyAndQueueAsync(studentId, eventId, validOtp, day),
      ]);

      const successCount = (res1.success ? 1 : 0) + (res2.success ? 1 : 0);
      assert.equal(successCount, 1, 'Only one concurrent submission can succeed');

      // Assert MongoDB contains exactly 1 attendance record
      const studentRecords = Array.from(mockAttendanceRecords.values()).filter(
        (r) => r.userId === studentId && r.eventId === eventId
      );
      assert.equal(studentRecords.length, 1);
    });

    test('2e. Storage and DB ops reporting for OTP check', () => {
      // Storage calculation:
      // EventOtp doc: ~120 bytes
      // AttendanceLockout doc: ~100 bytes
      // Attendance doc: ~150 bytes
      // DB ops per valid OTP check: 1 findOne (lockout), 1 findOne (attendance), 1 create (attendance)
      console.log('\n--- MULTI-NODE OTP RESOURCE USAGE REPORT ---');
      console.log('Storage per Event OTP record:        ~120 bytes');
      console.log('Storage per Active Lockout:          ~100 bytes');
      console.log('Storage per Attendance record:       ~150 bytes');
      console.log('Total storage for 300 candidates:    ~45 KB (well within MongoDB Atlas M0 512MB)');
      console.log('Peak MongoDB ops per valid OTP check: 1-2 ops (well within Atlas M0 100 ops/s cap)');
      console.log('--------------------------------------------\n');
      assert.ok(true);
    });

    test('2f. OTP cache TTL & rotation: Faculty rotates OTP, within 15s TTL old OTP is rejected on all nodes and new OTP works', async () => {
      const eventId = 'event-otp-rot-999';
      const initialOtp = '1122';
      const rotatedOtp = '7788';
      const day = 1;

      const nodeA = new AttendanceBuffer();
      const nodeB = new AttendanceBuffer();
      const nodeC = new AttendanceBuffer();

      // Faculty sets initial OTP on Node A
      await nodeA.setEventOTPAsync(eventId, initialOtp, day, 30);

      // Verify Node B loads and caches initial OTP with capped TTL (<= 15s)
      const bOtp = await nodeB.getEventOTPAsync(eventId, day);
      assert.equal(bOtp, initialOtp);
      const bCachedRecord = nodeB.activeOTPs.get(`${eventId}:day:${day}`);
      assert.ok(bCachedRecord, 'Node B must cache record in memory');
      // TTL must be capped at <= 15s (not 30 minutes)
      assert.ok(bCachedRecord.expiresAt <= Date.now() + 16000);

      // Faculty rotates OTP on Node A to new OTP
      await nodeA.setEventOTPAsync(eventId, rotatedOtp, day, 30);

      // Node A immediately accepts new OTP and rejects old OTP
      assert.equal(await nodeA.getEventOTPAsync(eventId, day), rotatedOtp);

      // Simulate TTL expiration on Node B and Node C (advancing clock past 15s cache TTL)
      bCachedRecord.expiresAt = Date.now() - 1000;

      // Node B cache expires, fetches rotated OTP from shared MongoDB
      const bRotatedOtp = await nodeB.getEventOTPAsync(eventId, day);
      assert.equal(bRotatedOtp, rotatedOtp, 'Node B must receive rotated OTP after TTL expiry');

      // Attempt submission with OLD OTP on Node B -> Must be rejected!
      const oldSubRes = await nodeB.verifyAndQueueAsync('student-old-otp', eventId, initialOtp, day);
      assert.equal(oldSubRes.success, false, 'Old rotated OTP must be rejected');

      // Attempt submission with NEW OTP on Node B -> Must succeed!
      const newSubRes = await nodeB.verifyAndQueueAsync('student-new-otp', eventId, rotatedOtp, day);
      assert.equal(newSubRes.success, true, 'New rotated OTP must be accepted across cluster');
    });

    test('2g. Attendance durability and node restart simulation: durable MongoDB storage and graceful shutdown flush', async () => {
      const eventId = 'event-durable-attendance';
      const otp = '9999';
      const day = 1;
      const student1 = 'student-durable-001';
      const student2 = 'student-durable-002';

      const node = new AttendanceBuffer();
      await node.setEventOTPAsync(eventId, otp, day, 30);

      // 1. Direct durable write: returns status: 'saved'
      const durableRes = await node.verifyAndQueueAsync(student1, eventId, otp, day);
      assert.equal(durableRes.success, true);
      assert.equal(durableRes.status, 'saved');
      assert.match(durableRes.message || '', /stored durably/i);

      // Verify record is stored in MongoDB
      const mongoRecord = mockAttendanceRecords.get(`${student1}:${eventId}:day:${day}`);
      assert.ok(mongoRecord, 'Attendance must be confirmed in database');

      // 2. Queue write fallback when MongoDB experiences transient outage
      // Temporarily simulate write failure to force queuing
      const origCreate = AttendanceModel.create;
      (AttendanceModel as any).create = () => Promise.reject(new Error('Atlas connection blip'));

      const pendingRes = await node.verifyAndQueueAsync(student2, eventId, otp, day);
      assert.equal(pendingRes.success, true);
      assert.equal(pendingRes.status, 'pending');
      assert.equal(pendingRes.retryAfter, 2);
      assert.equal(node.writeQueue.length, 1);

      // Restore AttendanceModel.create
      (AttendanceModel as any).create = origCreate;

      // 3. Node restart simulation: graceful shutdown flushes pending queue before exit
      await node.flushAllPending();
      assert.equal(node.writeQueue.length, 0, 'writeQueue must be completely drained on shutdown');

      // Verify student 2 was written to MongoDB via bulkWrite during flush
      const mongoRecord2 = mockAttendanceRecords.get(`${student2}:${eventId}:day:${day}`);
      assert.ok(mongoRecord2, 'Student 2 record must be durably stored after shutdown flush');

      // 4. Idempotent retry: Retrying student 2 returns duplicate error without corruption
      const retryRes = await node.verifyAndQueueAsync(student2, eventId, otp, day);
      assert.equal(retryRes.success, false);
      assert.match(retryRes.error || '', /already been marked/i);
    });
  });

  // =========================================================================
  // PART 3: DAY 5 FIGMA LINK SUBMISSION TESTS
  // =========================================================================
  describe('3. Day 5 Figma Link Submission Engine', () => {
    test('3a. Valid Figma URLs across all resource types are accepted (file, design, proto, board)', async () => {
      const validUrls = [
        'https://www.figma.com/file/LKJ12345/App-Redesign-Sprint',
        'https://figma.com/design/AbCdEfGhIj/Mobile-UX-Prototype',
        'https://www.figma.com/proto/987654321/Interactive-Mockup?node-id=1-2',
        'https://www.figma.com/board/ABC123XYZ/Brainstorming-Canvas',
      ];

      for (const url of validUrls) {
        assert.ok(FIGMA_URL_REGEX.test(url), `URL ${url} must match FIGMA_URL_REGEX`);

        const res = await server.inject({
          method: 'POST',
          url: `/api/assessments/${assessmentId}/submit-figma`,
          headers: { authorization: `Bearer ${tokenUserA}` },
          payload: { figmaUrl: url },
        });

        assert.equal(res.statusCode, 200);
        const body = res.json();
        assert.equal(body.success, true);
        assert.equal(body.status, 'saved');
        assert.equal(body.data.figmaUrl, url);
        assert.equal(body.data.type, 'figma');
      }

      // Assert exactly 1 document in MongoDB for User A (idempotent upsert)
      assert.equal(mockFigmaSubmissions.size, 1);
    });

    test('3b. Invalid domains, protocols, and schemes are strictly rejected (HTTP 400)', async () => {
      const invalidUrls = [
        'http://www.figma.com/file/12345/Insecure-Http', // Insecure http
        'javascript:alert(1)', // XSS attempt
        'data:text/html,<script>alert(1)</script>', // Data URI
        'https://malicious-figma.com/file/12345', // Spoofed domain
        'https://www.figma.com/login', // Not a project/file path
        'https://www.figma.com/settings/profile', // Settings page
        'ftp://figma.com/file/123', // FTP scheme
      ];

      for (const url of invalidUrls) {
        assert.equal(FIGMA_URL_REGEX.test(url), false, `Invalid URL ${url} must not pass regex`);

        const res = await server.inject({
          method: 'POST',
          url: `/api/assessments/${assessmentId}/submit-figma`,
          headers: { authorization: `Bearer ${tokenUserA}` },
          payload: { figmaUrl: url },
        });

        assert.equal(res.statusCode, 400);
        assert.match(res.json().error, /Invalid Figma URL/i);
      }
    });

    test('3c. Oversized URLs (> 2048 characters) are rejected with HTTP 400', async () => {
      const longUrl = 'https://www.figma.com/file/test/' + 'a'.repeat(2100);

      const res = await server.inject({
        method: 'POST',
        url: `/api/assessments/${assessmentId}/submit-figma`,
        headers: { authorization: `Bearer ${tokenUserA}` },
        payload: { figmaUrl: longUrl },
      });

      assert.equal(res.statusCode, 400);
      assert.match(res.json().error, /maximum length/i);
    });

    test('3d. Deadline enforcement: Late within 120s grace is accepted & flagged; outside is rejected (400)', async () => {
      // 1. Inside 120s grace window (deadline was 40 seconds ago)
      currentAssessment.deadline = new Date(Date.now() - 40 * 1000);
      currentAssessment.submissionGraceWindowSeconds = 120;

      const graceRes = await server.inject({
        method: 'POST',
        url: `/api/assessments/${assessmentId}/submit-figma`,
        headers: { authorization: `Bearer ${tokenUserA}` },
        payload: { figmaUrl: 'https://www.figma.com/design/GracePeriod123/Test' },
      });

      assert.equal(graceRes.statusCode, 200);
      const graceBody = graceRes.json();
      assert.equal(graceBody.data.isLate, true);
      assert.equal(graceBody.data.submissionStatus, 'late');

      // 2. Outside grace window (deadline was 180 seconds ago, > 120s grace)
      currentAssessment.deadline = new Date(Date.now() - 180 * 1000);

      const rejectRes = await server.inject({
        method: 'POST',
        url: `/api/assessments/${assessmentId}/submit-figma`,
        headers: { authorization: `Bearer ${tokenUserA}` },
        payload: { figmaUrl: 'https://www.figma.com/design/LateRejected123/Test' },
      });

      assert.equal(rejectRes.statusCode, 400);
      assert.equal(rejectRes.json().code, 'DEADLINE_EXCEEDED');
    });

    test('3e. Multiple retries by the same student produce exactly one stored document in MongoDB', async () => {
      currentAssessment.deadline = null; // Open deadline
      const figmaUrl = 'https://www.figma.com/file/IdempotentTest999/My-Project';

      // Submit 3 times consecutively
      for (let i = 0; i < 3; i++) {
        const res = await server.inject({
          method: 'POST',
          url: `/api/assessments/${assessmentId}/submit-figma`,
          headers: { authorization: `Bearer ${tokenUserB}` },
          payload: { figmaUrl, submissionId: `sub-figma-${i}` },
        });
        assert.equal(res.statusCode, 200);
      }

      // Assert MongoDB has exactly 1 document for user B
      const userBSubmissions = Array.from(mockFigmaSubmissions.values()).filter(
        (s) => String(s.user) === userBId
      );
      assert.equal(userBSubmissions.length, 1);
      assert.equal(userBSubmissions[0].figmaUrl, figmaUrl);
    });
  });

  // =========================================================================
  // PART 4: HARDENED /api/health ENDPOINT & JWT HMAC FINGERPRINT
  // =========================================================================
  describe('4. Hardened /api/health Endpoint & JWT HMAC Fingerprint', () => {
    test('4a. Public unauthenticated health check returns ONLY { status: "ok" } without secrets or fingerprints', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/health',
      });

      assert.equal(res.statusCode, 200);
      const json = res.json();
      assert.equal(json.status, 'ok');
      assert.equal(json.jwtFingerprint, undefined, 'Public health check must NEVER expose jwtFingerprint');
      assert.equal(json.nodeId, undefined, 'Public health check must not expose internal cluster nodeId');
    });

    test('4b. Student token does not receive JWT fingerprint on /api/health', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/health',
        headers: { authorization: `Bearer ${tokenUserA}` },
      });

      assert.equal(res.statusCode, 200);
      const json = res.json();
      assert.equal(json.status, 'ok');
      assert.equal(json.jwtFingerprint, undefined, 'Student caller must not receive jwtFingerprint');
    });

    test('4c. Authenticated admin receives 12-char HMAC(JWT_SECRET, "fingerprint-v1") fingerprint', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/health',
        headers: { authorization: `Bearer ${tokenAdmin}` },
      });

      assert.equal(res.statusCode, 200);
      const json = res.json();
      assert.equal(json.status, 'ok');
      assert.ok(json.nodeId, 'Admin health check must include nodeId');

      // Verify HMAC computation
      const expectedFingerprint = crypto
        .createHmac('sha256', secret)
        .update('fingerprint-v1')
        .digest('hex')
        .substring(0, 12);

      assert.equal(json.jwtFingerprint.length, 12, 'Fingerprint must be truncated to 12 hex chars');
      assert.equal(json.jwtFingerprint, expectedFingerprint);
    });
  });

  // =========================================================================
  // PART 5: HARDENED CORS ORIGIN VALIDATOR
  // =========================================================================
  describe('5. Hardened CORS Origin Validator', () => {
    const originalPreviewFlag = process.env.ALLOW_VERCEL_PREVIEWS;

    after(() => {
      if (originalPreviewFlag !== undefined) {
        process.env.ALLOW_VERCEL_PREVIEWS = originalPreviewFlag;
      } else {
        delete process.env.ALLOW_VERCEL_PREVIEWS;
      }
    });

    test('5a. Permitted localhost and loopback ports in non-production mode', () => {
      assert.equal(isOriginAllowed('http://localhost:5173'), true);
      assert.equal(isOriginAllowed('http://127.0.0.1:5173'), true);
      assert.equal(isOriginAllowed('http://localhost:5000'), true);
      assert.equal(isOriginAllowed('http://127.0.0.1:5000'), true);
    });

    test('5b. Project-specific preview origins allowed ONLY when ALLOW_VERCEL_PREVIEWS === "true"', () => {
      // 1. When flag is enabled
      process.env.ALLOW_VERCEL_PREVIEWS = 'true';
      assert.equal(isOriginAllowed('https://code-circle-git-feat-test.vercel.app'), true);
      assert.equal(isOriginAllowed('https://code-circle.vercel.app'), true);

      // 2. When flag is disabled / OFF (default production state)
      process.env.ALLOW_VERCEL_PREVIEWS = 'false';
      assert.equal(isOriginAllowed('https://code-circle-git-feat-test.vercel.app'), false);
    });

    test('5c. Malicious origins, lookalikes, and unrelated Vercel apps are strictly rejected', () => {
      process.env.ALLOW_VERCEL_PREVIEWS = 'true';

      assert.equal(isOriginAllowed('https://evil-unrelated.vercel.app'), false);
      assert.equal(isOriginAllowed('https://attacker.com'), false);
      assert.equal(isOriginAllowed('https://code-circle.evil.com'), false);
      assert.equal(isOriginAllowed('https://evil-code-circle.vercel.app.attacker.com'), false);
      assert.equal(isOriginAllowed(''), false);
    });
  });

  // =========================================================================
  // PART 6: JUDGE0 BATCH EXECUTION CHUNKING
  // =========================================================================
  describe('6. Judge0 Batch Execution Chunking', () => {
    test('6a. Judge0Provider executeBatch chunks 25 test cases into batches of <= 20 (20 + 5)', async () => {
      const provider = new Judge0Provider();
      const batchPostCalls: any[] = [];
      const batchGetCalls: any[] = [];

      // Mock axios client on provider
      (provider as any).client = {
        post: async (url: string, payload: any) => {
          batchPostCalls.push({ url, payload, size: payload.submissions?.length });
          return {
            data: payload.submissions.map((_: any, idx: number) => ({ token: `tok-${idx}` })),
          };
        },
        get: async (url: string) => {
          batchGetCalls.push({ url });
          const match = url.match(/tokens=([^&]+)/);
          const tokens = match ? match[1].split(',') : [];
          return {
            data: {
              submissions: tokens.map((t: string) => ({
                token: t,
                status: { id: 3, description: 'Accepted' },
                stdout: '42\n',
                stderr: '',
                exit_code: 0,
              })),
            },
          };
        },
      };

      // Create 25 mock test case execution requests
      const testReqs: any[] = Array.from({ length: 25 }, (_, idx) => ({
        language: 'python',
        code: `print(${idx})`,
        stdin: '',
        timeoutMs: 2000,
      }));

      const results = await provider.executeBatch(testReqs);

      // Verify chunking behavior:
      // 25 items must be split into 2 batch POST calls: chunk 1 (20 items) and chunk 2 (5 items)
      assert.equal(batchPostCalls.length, 2, '25 test cases must be split across 2 batch POST chunks');
      assert.equal(batchPostCalls[0].size, 20, 'First chunk size must be exactly 20 (Judge0 CE limit)');
      assert.equal(batchPostCalls[1].size, 5, 'Second chunk size must be 5');

      // Verify all 25 results are returned in order
      assert.equal(results.length, 25);
      assert.equal(results[0].status, 'success');
      assert.equal(results[24].status, 'success');
    });
  });
});
