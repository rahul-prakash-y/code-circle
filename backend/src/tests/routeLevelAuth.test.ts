import { test, describe, before, mock } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { server } from '../server';
import User from '../models/userModel';
import Assessment from '../models/assessmentModel';
import AssessmentSubmission from '../models/assessmentSubmissionModel';
import AuditLog from '../models/auditLogModel';
import attendanceBuffer from '../services/attendanceBuffer';
import { getJwtSecret } from '../middleware/authMiddleware';

describe('Route-Level HTTP Handler Authorization & Security Test Suite', () => {
  const secret = getJwtSecret();

  const studentId = '507f1f77bcf86cd799439011';
  const facultyId = '507f1f77bcf86cd799439012';
  const adminId = '507f1f77bcf86cd799439013';
  const otherStudentId = '507f1f77bcf86cd799439099';
  const assessmentId = '507f1f77bcf86cd799439020';

  const validStudentToken = jwt.sign(
    { id: studentId, sessionId: 'sess-student-1' },
    secret,
    { expiresIn: '1h' }
  );

  const validFacultyToken = jwt.sign(
    { id: facultyId, sessionId: 'sess-faculty-1' },
    secret,
    { expiresIn: '1h' }
  );

  const validAdminToken = jwt.sign(
    { id: adminId, sessionId: 'sess-admin-1' },
    secret,
    { expiresIn: '1h' }
  );

  const expiredToken = jwt.sign(
    { id: studentId, sessionId: 'sess-student-1' },
    secret,
    { expiresIn: '-10s' }
  );

  const tamperedToken = jwt.sign(
    { id: studentId, sessionId: 'sess-student-1' },
    'attacker-tampered-secret-key-67890',
    { expiresIn: '1h' }
  );

  before(async () => {
    // Ensure Fastify plugins and hooks are fully initialized
    await server.ready();

    // Mock database find calls so route tests execute deterministically without mutating production state
    mock.method(User, 'findById', (id: any) => {
      const idStr = String(id);
      if (idStr === studentId) {
        return Promise.resolve({
          _id: new mongoose.Types.ObjectId(studentId),
          id: studentId,
          role: 'Student',
          email: 'student@example.com',
          name: 'Student User',
          isBlocked: false,
          activeSessionId: 'sess-student-1',
        });
      }
      if (idStr === facultyId) {
        return Promise.resolve({
          _id: new mongoose.Types.ObjectId(facultyId),
          id: facultyId,
          role: 'Faculty',
          email: 'faculty@example.com',
          name: 'Faculty User',
          isBlocked: false,
          activeSessionId: 'sess-faculty-1',
        });
      }
      if (idStr === adminId) {
        return Promise.resolve({
          _id: new mongoose.Types.ObjectId(adminId),
          id: adminId,
          role: 'Admin',
          email: 'admin@example.com',
          name: 'Admin User',
          isBlocked: false,
          activeSessionId: 'sess-admin-1',
        });
      }
      return Promise.resolve(null);
    });

    mock.method(Assessment, 'findById', (id: any) => {
      if (String(id) === assessmentId) {
        return Promise.resolve({
          _id: new mongoose.Types.ObjectId(assessmentId),
          title: 'Formal Graded Exam',
          isPublished: true,
          customPoints: 50,
        });
      }
      return Promise.resolve(null);
    });

    mock.method(AssessmentSubmission, 'deleteMany', () => {
      return Promise.resolve({ deletedCount: 1 });
    });

    mock.method(AuditLog, 'create', () => {
      return Promise.resolve({});
    });
  });

  // ==========================================
  // 1. ATTENDANCE ROUTE-LEVEL TESTS
  // ==========================================
  describe('Attendance Route Authorization (POST /api/attendance/submit)', () => {
    const testEventId = 'event-route-auth-001';
    const testOtp = '4321';

    before(() => {
      attendanceBuffer.resetBuffer();
      attendanceBuffer.setEventOTP(testEventId, testOtp, 1, 30);
    });

    test('Rejects request with NO token (401 Unauthorized)', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/attendance/submit',
        payload: { eventId: testEventId, otp: testOtp, userId: studentId },
      });
      assert.equal(res.statusCode, 401);
      assert.match(res.json().error, /Unauthorized: No token provided/i);
    });

    test('Rejects request with EXPIRED token (401 Token Expired)', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/attendance/submit',
        headers: { authorization: `Bearer ${expiredToken}` },
        payload: { eventId: testEventId, otp: testOtp, userId: studentId },
      });
      assert.equal(res.statusCode, 401);
      assert.match(res.json().error, /Token expired/i);
    });

    test('Rejects request with TAMPERED token (401 Invalid Token)', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/attendance/submit',
        headers: { authorization: `Bearer ${tamperedToken}` },
        payload: { eventId: testEventId, otp: testOtp, userId: studentId },
      });
      assert.equal(res.statusCode, 401);
      assert.match(res.json().error, /Invalid token/i);
    });

    test('Student token: Can submit for own student account (200 OK)', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/attendance/submit',
        headers: { authorization: `Bearer ${validStudentToken}` },
        payload: { eventId: testEventId, otp: testOtp, userId: studentId },
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.json().success, true);
    });

    test('Student token: BLOCKED from proxy submitting for another student (403 Forbidden)', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/attendance/submit',
        headers: { authorization: `Bearer ${validStudentToken}` },
        payload: { eventId: testEventId, otp: testOtp, userId: otherStudentId },
      });
      assert.equal(res.statusCode, 403);
      assert.match(res.json().error, /You can only submit attendance for your own account/i);
    });

    test('Faculty token: Allowed to mark proxy attendance for another student', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/attendance/submit',
        headers: { authorization: `Bearer ${validFacultyToken}` },
        payload: { eventId: testEventId, otp: testOtp, userId: otherStudentId },
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.json().success, true);
    });

    test('Admin token: Allowed to mark proxy attendance for another student', async () => {
      const anotherStudent = '507f1f77bcf86cd799439098';
      const res = await server.inject({
        method: 'POST',
        url: '/api/attendance/submit',
        headers: { authorization: `Bearer ${validAdminToken}` },
        payload: { eventId: testEventId, otp: testOtp, userId: anotherStudent },
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.json().success, true);
    });

    test('Rate Limiter: Route-level rate limiter actively attached and enforces 429 after burst', async () => {
      // Config on /api/attendance/submit is max 15 requests per minute
      // Use unique remote IP to isolate test window
      const testIp = '198.51.100.88';
      let hit429 = false;

      for (let i = 0; i < 18; i++) {
        const res = await server.inject({
          method: 'POST',
          url: '/api/attendance/submit',
          remoteAddress: testIp,
          headers: { authorization: `Bearer ${validStudentToken}` },
          payload: { eventId: testEventId, otp: testOtp, userId: studentId },
        });

        if (res.statusCode === 429) {
          hit429 = true;
          assert.equal(res.headers['x-ratelimit-limit'], '15');
          assert.match(
            res.json().error || res.json().message || '',
            /rate limit exceeded|Too Many Requests/i
          );
          break;
        }
      }

      assert.equal(hit429, true, 'Attendance route rate limiter must trigger 429 after 15 requests');
    });
  });

  // ==========================================
  // 2. EVENT REPORT ROUTE-LEVEL TESTS
  // ==========================================
  describe('Event Reports Route Authorization (POST & DELETE /api/reports)', () => {
    const reportId = '507f1f77bcf86cd799439033';

    test('DELETE /api/reports/:id with NO token -> 401', async () => {
      const res = await server.inject({
        method: 'DELETE',
        url: `/api/reports/${reportId}`,
      });
      assert.equal(res.statusCode, 401);
    });

    test('DELETE /api/reports/:id with EXPIRED token -> 401', async () => {
      const res = await server.inject({
        method: 'DELETE',
        url: `/api/reports/${reportId}`,
        headers: { authorization: `Bearer ${expiredToken}` },
      });
      assert.equal(res.statusCode, 401);
    });

    test('DELETE /api/reports/:id with TAMPERED token -> 401', async () => {
      const res = await server.inject({
        method: 'DELETE',
        url: `/api/reports/${reportId}`,
        headers: { authorization: `Bearer ${tamperedToken}` },
      });
      assert.equal(res.statusCode, 401);
    });

    test('DELETE /api/reports/:id with Student token -> 403 Forbidden', async () => {
      const res = await server.inject({
        method: 'DELETE',
        url: `/api/reports/${reportId}`,
        headers: { authorization: `Bearer ${validStudentToken}` },
      });
      assert.equal(res.statusCode, 403);
      assert.match(res.json().error, /Forbidden: Requires elevated/i);
    });

    test('POST /api/reports with Student token -> 403 Forbidden', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/reports',
        headers: { authorization: `Bearer ${validStudentToken}` },
        payload: { eventId: '507f1f77bcf86cd799439044' },
      });
      assert.equal(res.statusCode, 403);
      assert.match(res.json().error, /Forbidden: Requires elevated/i);
    });
  });

  // ==========================================
  // 3. UPLOADS ROUTE-LEVEL TESTS
  // ==========================================
  describe('Uploads Route Authorization (POST /api/upload/profile-pic)', () => {
    test('POST /api/upload/profile-pic with NO token -> 401', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/upload/profile-pic',
      });
      assert.equal(res.statusCode, 401);
    });

    test('POST /api/upload/profile-pic with EXPIRED token -> 401', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/upload/profile-pic',
        headers: { authorization: `Bearer ${expiredToken}` },
      });
      assert.equal(res.statusCode, 401);
    });

    test('POST /api/upload/profile-pic with TAMPERED token -> 401', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/upload/profile-pic',
        headers: { authorization: `Bearer ${tamperedToken}` },
      });
      assert.equal(res.statusCode, 401);
    });

    test('POST /api/upload/profile-pic with valid token passes auth (fails on missing multipart file)', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/upload/profile-pic',
        headers: { authorization: `Bearer ${validStudentToken}` },
      });
      // Should successfully pass verifyToken auth hook (must not return 401 or 403)
      assert.notEqual(res.statusCode, 401, 'Must not fail with 401 Unauthorized');
      assert.notEqual(res.statusCode, 403, 'Must not fail with 403 Forbidden');
    });
  });

  // ==========================================
  // 4. ASSESSMENTS REAPPEAR & SELF-RESET ROUTE TESTS
  // ==========================================
  describe('Assessment Reappear & Self-Reset Route Authorization', () => {
    test('DELETE /api/assessments/:id/my-submission with NO token -> 401', async () => {
      const res = await server.inject({
        method: 'DELETE',
        url: `/api/assessments/${assessmentId}/my-submission`,
      });
      assert.equal(res.statusCode, 401);
    });

    test('DELETE /api/assessments/:id/my-submission with EXPIRED token -> 401', async () => {
      const res = await server.inject({
        method: 'DELETE',
        url: `/api/assessments/${assessmentId}/my-submission`,
        headers: { authorization: `Bearer ${expiredToken}` },
      });
      assert.equal(res.statusCode, 401);
    });

    test('DELETE /api/assessments/:id/my-submission with TAMPERED token -> 401', async () => {
      const res = await server.inject({
        method: 'DELETE',
        url: `/api/assessments/${assessmentId}/my-submission`,
        headers: { authorization: `Bearer ${tamperedToken}` },
      });
      assert.equal(res.statusCode, 401);
    });

    test('Student token: BLOCKED from self-resetting graded assessment (403 Forbidden)', async () => {
      const res = await server.inject({
        method: 'DELETE',
        url: `/api/assessments/${assessmentId}/my-submission`,
        headers: { authorization: `Bearer ${validStudentToken}` },
      });
      assert.equal(res.statusCode, 403);
      assert.match(res.json().error, /Self-service reset is disabled for graded assessments/i);
    });

    test('Faculty reappearance: Rejects if reason is missing or <5 chars (400 Bad Request)', async () => {
      const res = await server.inject({
        method: 'POST',
        url: `/api/assessments/${assessmentId}/reappear/${studentId}`,
        headers: { authorization: `Bearer ${validFacultyToken}` },
        payload: { reason: '' },
      });
      assert.equal(res.statusCode, 400);
      assert.match(res.json().error, /A valid reason/i);
    });

    test('Faculty reappearance: Grants reappearance with valid reason and audit log (200 OK)', async () => {
      const res = await server.inject({
        method: 'POST',
        url: `/api/assessments/${assessmentId}/reappear/${studentId}`,
        headers: { authorization: `Bearer ${validFacultyToken}` },
        payload: { reason: 'Student suffered lab workstation network disconnect during exam' },
      });
      assert.equal(res.statusCode, 200);
      assert.equal(res.json().success, true);
      assert.match(res.json().message, /The student is now permitted to reappear/i);
    });
  });
});
