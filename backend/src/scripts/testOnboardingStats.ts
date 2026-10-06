process.env.NODE_ENV = 'test';
import dotenv from 'dotenv';
dotenv.config();

import jwt from 'jsonwebtoken';
import { server } from '../server';
import User from '../models/userModel';
import connectDB from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'stellar-minimalist-secret-key-2026';

async function runTests() {
  console.log('=== Testing Student Onboarding Statistics API ===');
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

  try {
    await connectDB();
    await server.ready();

    // 1. Test unauthenticated request is blocked
    const unauthRes = await server.inject({
      method: 'GET',
      url: '/api/admin/onboarding-stats',
    });
    assert(unauthRes.statusCode === 401, 'Unauthenticated request receives 401 Unauthorized');

    // 2. Prepare or find student user
    let student = await User.findOne({ role: 'Student' });
    if (!student) {
      student = await User.create({
        name: 'Sample Student For Test',
        email: `student_test_${Date.now()}@bitsathy.ac.in`,
        rollNo: `STU${Date.now().toString().slice(-5)}`,
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'Student',
        department: 'CSE',
        isOnboarded: false,
      });
    }

    const studentToken = jwt.sign(
      { id: student._id.toString(), role: 'Student', email: student.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Test non-admin access is blocked
    const studentRes = await server.inject({
      method: 'GET',
      url: '/api/admin/onboarding-stats',
      headers: {
        authorization: `Bearer ${studentToken}`,
      },
    });
    assert(studentRes.statusCode === 403, 'Student access is blocked with 403 Forbidden');

    // 3. Prepare or find Admin/SuperAdmin user
    let admin = await User.findOne({ role: { $in: ['Admin', 'SuperAdmin'] } });
    if (!admin) {
      admin = await User.create({
        name: 'Admin Test User',
        email: `admintest_${Date.now()}@codecircle.com`,
        rollNo: `ADM${Date.now().toString().slice(-5)}`,
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'Admin',
        department: 'AdminDept',
        isOnboarded: true,
      });
    }

    const adminToken = jwt.sign(
      { id: admin._id.toString(), role: admin.role, email: admin.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Ensure we have at least one onboarded and one non-onboarded student in DB
    let onboardedStudent = await User.findOne({ role: 'Student', isOnboarded: true });
    if (!onboardedStudent) {
      onboardedStudent = await User.create({
        name: 'Onboarded Student Test',
        email: `onboarded_${Date.now()}@bitsathy.ac.in`,
        rollNo: `ONB${Date.now().toString().slice(-5)}`,
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'Student',
        department: 'IT',
        isOnboarded: true,
      });
    }

    let pendingStudent = await User.findOne({
      role: 'Student',
      $or: [{ isOnboarded: false }, { isOnboarded: { $exists: false } }],
    });
    if (!pendingStudent) {
      pendingStudent = await User.create({
        name: 'Pending Student Test',
        email: `pending_${Date.now()}@bitsathy.ac.in`,
        rollNo: `PND${Date.now().toString().slice(-5)}`,
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'Student',
        department: 'ECE',
        isOnboarded: false,
      });
    }

    // 4. Test GET /api/admin/onboarding-stats with admin token
    const statsRes = await server.inject({
      method: 'GET',
      url: '/api/admin/onboarding-stats',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    assert(statsRes.statusCode === 200, 'Admin request receives 200 OK');
    const body = JSON.parse(statsRes.payload);
    assert(body.success === true, 'Response payload has success: true');
    assert(typeof body.stats === 'object', 'Response includes stats object');
    assert(typeof body.stats.total === 'number' && body.stats.total >= 2, `Total students counted correctly: ${body.stats.total}`);
    assert(typeof body.stats.onboarded === 'number' && body.stats.onboarded >= 1, `Onboarded students counted correctly: ${body.stats.onboarded}`);
    assert(typeof body.stats.notOnboarded === 'number' && body.stats.notOnboarded >= 1, `Not onboarded students counted correctly: ${body.stats.notOnboarded}`);
    assert(Array.isArray(body.stats.breakdown), 'Stats includes breakdown array for visualization');
    assert(Array.isArray(body.students), 'Response includes students array for data table');
    assert(body.students.length > 0, `Returned ${body.students.length} students`);

    console.log('\nSample aggregation response stats:', JSON.stringify(body.stats, null, 2));

    // 5. Test Quick Action: send onboarding reminder
    const reminderRes = await server.inject({
      method: 'POST',
      url: '/api/admin/onboarding-reminder',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        studentId: pendingStudent._id.toString(),
        customMessage: 'Reminder: please finish onboarding!',
      },
    });
    assert(reminderRes.statusCode === 200, 'POST /api/admin/onboarding-reminder returns 200');
    const reminderBody = JSON.parse(reminderRes.payload);
    assert(reminderBody.sentCount === 1, 'Reminder sent to 1 targeted student');

    // 6. Test Toggle status PATCH /api/admin/students/:id/onboarding
    const toggleRes = await server.inject({
      method: 'PATCH',
      url: `/api/admin/students/${pendingStudent._id.toString()}/onboarding`,
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
      payload: {
        isOnboarded: true,
      },
    });
    assert(toggleRes.statusCode === 200, 'PATCH /api/admin/students/:id/onboarding returns 200');
    const toggleBody = JSON.parse(toggleRes.payload);
    assert(toggleBody.student.isOnboarded === true, 'Student isOnboarded successfully updated to true');

    // Revert back so student remains not onboarded for tests
    await User.findByIdAndUpdate(pendingStudent._id, { isOnboarded: false });

    console.log(`\n=== Test Suite Complete: ${passed} passed, ${failed} failed ===`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
