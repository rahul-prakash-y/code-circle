import { test, describe, before, mock } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { server } from '../server';
import User from '../models/userModel';
import CodingChallenge from '../models/codingChallengeModel';
import CodingSubmission from '../models/codingSubmissionModel';
import Level from '../models/levelModel';
import StudentProgress from '../models/studentProgressModel';
import PointTransaction from '../models/pointTransactionModel';
import DomainEnrollment from '../models/domainEnrollmentModel';
import { getJwtSecret } from '../middleware/authMiddleware';
import rceService from '../services/rceService';
import { Judge0Provider, JUDGE0_SANDBOX_CONSTRAINTS } from '../services/rce/judge0Provider';
import {
  globalUserExecutionLocks,
  ConcurrencyLimiter,
} from '../services/rce/concurrencyLimiter';
import {
  userRunRateLimits,
  userSubmitRateLimits,
  checkRunRateLimit,
  rollbackRunRateLimit,
  checkSubmitRateLimit,
  rollbackSubmitRateLimit,
} from '../controllers/codingAssessmentController';

describe('Code Execution Hardening & Sandboxing Test Suite (SEC-03 Hardening)', () => {
  const secret = getJwtSecret();
  const studentId = '507f1f77bcf86cd799439011';
  const otherStudentId = '507f1f77bcf86cd799439012';
  const challengeId = '507f1f77bcf86cd799439033';

  const validStudentToken = jwt.sign(
    { id: studentId, sessionId: 'sess-code-student-1' },
    secret,
    { expiresIn: '1h' }
  );

  const mockChallenge = {
    _id: new mongoose.Types.ObjectId(challengeId),
    title: 'Two Sum Algorithmic Challenge',
    description: 'Find indices of two numbers that add up to target',
    allowedLanguages: ['python', 'javascript', 'cpp', 'c', 'java'],
    singleSubmissionOnly: false,
    testCases: [
      {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439041'),
        input: '4\n2 7 11 15\n9',
        expectedOutput: '0 1',
        isHidden: false,
      },
      {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439042'),
        input: '3\n3 2 4\n6',
        expectedOutput: '1 2',
        isHidden: true,
      },
      {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439043'),
        input: '2\n3 3\n6',
        expectedOutput: '0 1',
        isHidden: true,
      },
    ],
  };

  before(async () => {
    await server.ready();

    const createMockUserQuery = (userObj: any) => ({
      select: () => createMockUserQuery(userObj),
      lean: () => Promise.resolve(userObj),
      then: (resolve: any, reject: any) => Promise.resolve(userObj).then(resolve, reject),
      ...userObj,
    });

    // Mock User lookups with chainable .select() query
    mock.method(User, 'findById', (id: any) => {
      const idStr = String(id);
      if (idStr === studentId || idStr === otherStudentId) {
        return createMockUserQuery({
          _id: new mongoose.Types.ObjectId(idStr),
          id: idStr,
          role: 'Student',
          email: `${idStr}@example.edu`,
          name: 'Student Coder',
          isBlocked: false,
          activeSessionId: 'sess-code-student-1',
          isRestricted: false,
          restrictedFeatures: [],
        });
      }
      return createMockUserQuery(null);
    });

    // Mock CodingChallenge lookups
    mock.method(CodingChallenge, 'findById', (id: any) => {
      if (String(id) === challengeId) {
        return Promise.resolve(mockChallenge);
      }
      return Promise.resolve(null);
    });

    const createMockQuery = (data: any) => ({
      select: () => createMockQuery(data),
      lean: () => Promise.resolve(data),
      sort: () => createMockQuery(data),
      then: (resolve: any, reject: any) => Promise.resolve(data).then(resolve, reject),
      ...data,
    });

    // Mock Level, StudentProgress, DomainEnrollment, PointTransaction for challenge access gating & completion
    mock.method(Level, 'find', () => createMockQuery([]));
    mock.method(Level, 'findById', () => createMockQuery(null));
    mock.method(StudentProgress, 'findOne', () => createMockQuery(null));
    mock.method(StudentProgress, 'findOneAndUpdate', () => Promise.resolve(null));
    mock.method(CodingSubmission, 'findOne', () => createMockQuery(null));
    mock.method(User, 'findByIdAndUpdate', () => Promise.resolve(null));
    mock.method(DomainEnrollment, 'findOne', () => Promise.resolve(null));
    mock.method(DomainEnrollment, 'findOneAndUpdate', () => Promise.resolve(null));
    mock.method(PointTransaction, 'findOne', () => Promise.resolve(null));
    mock.method(PointTransaction, 'create', () => Promise.resolve(null));
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Language allowlist & Size Caps (Sub-item b)
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Parameter Validation & Language Allowlist Enforcement', () => {
    test('Rejects unsupported language (e.g. php / bash) with HTTP 400', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/assessments/code/execute',
        headers: {
          authorization: `Bearer ${validStudentToken}`,
          'content-type': 'application/json',
        },
        payload: {
          problemId: challengeId,
          language: 'bash',
          code: 'echo "hello"',
        },
      });

      assert.equal(res.statusCode, 400);
      const json = JSON.parse(res.payload);
      assert.match(json.error || json.message, /Language "bash" is not supported/i);
    });

    test('Rejects oversized source code (> 64 KB) with HTTP 400', async () => {
      const hugeCode = 'x = 1\n'.repeat(12000); // ~72 KB > 64 KB limit
      const res = await server.inject({
        method: 'POST',
        url: '/api/assessments/code/execute',
        headers: {
          authorization: `Bearer ${validStudentToken}`,
          'content-type': 'application/json',
        },
        payload: {
          problemId: challengeId,
          language: 'python',
          code: hugeCode,
        },
      });

      assert.equal(res.statusCode, 400);
      const json = JSON.parse(res.payload);
      assert.match(json.message || json.error, /characters|exceeds|validation/i);
    });

    test('Rejects oversized stdin (> 32 KB) via rceService normalizeRequest', () => {
      const hugeStdin = 'a'.repeat(33 * 1024);
      assert.throws(
        () => {
          rceService.normalizeRequest({
            language: 'python',
            sourceCode: 'print(1)',
            stdin: hugeStdin,
          });
        },
        /stdin exceeds maximum allowed size of 32 KB/i
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Sandbox Parameters & Validation Error Handling (Sub-item b)
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Hardened Sandbox Parameters & Validation Resilience', () => {
    test('buildSubmissionPayload enforces enable_network:false and resource bounds', () => {
      const provider = new Judge0Provider();
      const payload = provider.buildSubmissionPayload({
        language: 'python',
        sourceCode: 'print(42)',
        stdin: 'test input',
        timeoutMs: 8000,
      });

      assert.equal(payload.enable_network, false, 'Sandbox must strictly block outbound network');
      assert.equal(payload.memory_limit, 256000, 'Sandbox must bound memory to 256 MB');
      assert.equal(payload.max_file_size, 1024, 'Sandbox must cap file size to 1 MB');
      assert.equal(payload.cpu_time_limit, 8, 'CPU limit matches request');
      assert(payload.wall_time_limit >= payload.cpu_time_limit, 'Wall time must be >= cpu_time_limit');
    });

    test('Gracefully handles Judge0 HTTP 422 provider parameter errors without crashing', async () => {
      const provider = new Judge0Provider();
      // Inject mock client throwing 422
      const mock422Error: any = new Error('Request failed with status code 422');
      mock422Error.response = {
        status: 422,
        data: { memory_limit: ['must be less than or equal to 2048000'] },
      };

      mock.method((provider as any).client, 'post', () => Promise.reject(mock422Error));

      const result = await provider.execute({
        language: 'python',
        sourceCode: 'print(1)',
        stdin: '',
        timeoutMs: 5000,
      });

      assert.equal(result.status, 'error');
      assert.equal(result.exitCode, -1);
      assert.match(result.stderr, /Judge0 parameter validation error/i);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Hidden Test Cases & Server Scoring (Sub-item c)
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Hidden Test Case Sanitization & Server-Side Scoring', () => {
    test('submitAssessmentCode masks hidden test case stdout/stderr as [HIDDEN]', async () => {
      // Clear rate limit and locks for fresh test
      userSubmitRateLimits.delete(studentId);
      globalUserExecutionLocks.release(studentId);

      // Mock rceService.executeBatchCode to return successful execution
      mock.method(rceService, 'executeBatchCode', () => {
        return Promise.resolve([
          { status: 'success', stdout: '0 1', stderr: '', exitCode: 0, executionTimeMs: 15 },
          { status: 'success', stdout: '1 2', stderr: '', exitCode: 0, executionTimeMs: 20 },
          { status: 'success', stdout: '0 1', stderr: '', exitCode: 0, executionTimeMs: 18 },
        ]);
      });

      // Mock CodingSubmission.prototype.save
      let savedDoc: any = null;
      mock.method(CodingSubmission.prototype, 'save', function (this: any) {
        savedDoc = this;
        return Promise.resolve(this);
      });

      const res = await server.inject({
        method: 'POST',
        url: '/api/assessments/code/submit',
        headers: {
          authorization: `Bearer ${validStudentToken}`,
          'content-type': 'application/json',
        },
        payload: {
          problemId: challengeId,
          language: 'python',
          code: 'print("solution")',
          // Attempt client injection of tampered score
          score: 100,
        },
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.submitted, true);
      assert.equal(json.score, 100); // 3 out of 3 passed

      // Verify stored results mask hidden test cases
      assert(savedDoc, 'Submission should be saved in DB');
      const results = savedDoc.results;
      assert.equal(results.length, 3);

      // Case 1 is visible
      assert.equal(results[0].isHidden, false);
      assert.equal(results[0].stdout, '0 1');

      // Cases 2 & 3 are hidden
      assert.equal(results[1].isHidden, true);
      assert.equal(results[1].stdout, '[HIDDEN]', 'Hidden test case stdout must be masked');
      assert.equal(results[1].stderr, '', 'Hidden test case stderr must be masked');

      assert.equal(results[2].isHidden, true);
      assert.equal(results[2].stdout, '[HIDDEN]');
      assert.equal(results[2].stderr, '');
    });

    test('Server computes score strictly from passed test cases; ignores client payload', async () => {
      userSubmitRateLimits.delete(studentId);
      globalUserExecutionLocks.release(studentId);

      // Mock rceService.executeBatchCode where only 1 of 3 passes
      mock.method(rceService, 'executeBatchCode', () => {
        return Promise.resolve([
          { status: 'success', stdout: '0 1', stderr: '', exitCode: 0, executionTimeMs: 10 }, // match
          { status: 'success', stdout: 'WRONG', stderr: '', exitCode: 0, executionTimeMs: 10 }, // fail
          { status: 'success', stdout: 'WRONG', stderr: '', exitCode: 0, executionTimeMs: 10 }, // fail
        ]);
      });

      const res = await server.inject({
        method: 'POST',
        url: '/api/assessments/code/submit',
        headers: {
          authorization: `Bearer ${validStudentToken}`,
          'content-type': 'application/json',
        },
        payload: {
          problemId: challengeId,
          language: 'python',
          code: 'print("partial solution")',
          score: 999, // Tampered score attempt
        },
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.passed, 1);
      assert.equal(json.total, 3);
      assert.equal(json.score, 33); // 1 / 3 = 33%, NOT 999!
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. User Binding & IDOR Prevention (Sub-item d)
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. User Binding & IDOR Elimination', () => {
    test('Submission record binds strictly to request.user.id and cannot be forged', async () => {
      userSubmitRateLimits.delete(studentId);
      globalUserExecutionLocks.release(studentId);

      let savedStudentId: string | null = null;
      mock.method(CodingSubmission.prototype, 'save', function (this: any) {
        savedStudentId = this.student.toString();
        return Promise.resolve(this);
      });

      const res = await server.inject({
        method: 'POST',
        url: '/api/assessments/code/submit',
        headers: {
          authorization: `Bearer ${validStudentToken}`,
          'content-type': 'application/json',
        },
        payload: {
          problemId: challengeId,
          language: 'python',
          code: 'print(42)',
          student: otherStudentId, // Attacker tries to submit on behalf of otherStudentId
          studentId: otherStudentId,
          userId: otherStudentId,
        },
      });

      assert.equal(res.statusCode, 200);
      assert.equal(savedStudentId, studentId, 'Submission must be saved strictly under authenticated JWT user ID');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Per-User Concurrency & Queueing (Sub-item e)
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. Per-User Concurrency Lock & Queue Timeout', () => {
    test('Rejects simultaneous execution for the same user with HTTP 429', async () => {
      globalUserExecutionLocks.release(studentId);

      // Acquire lock simulating active execution in progress
      globalUserExecutionLocks.acquire(studentId);

      try {
        const res = await server.inject({
          method: 'POST',
          url: '/api/assessments/code/execute',
          headers: {
            authorization: `Bearer ${validStudentToken}`,
            'content-type': 'application/json',
          },
          payload: {
            problemId: challengeId,
            language: 'python',
            code: 'print(1)',
          },
        });

        assert.equal(res.statusCode, 429);
        const json = JSON.parse(res.payload);
        assert.match(json.error || json.message, /execution is already in progress/i);
      } finally {
        globalUserExecutionLocks.release(studentId);
      }
    });

    test('Queue status endpoint returns worker metrics and user execution state', async () => {
      globalUserExecutionLocks.release(studentId);

      const res = await server.inject({
        method: 'GET',
        url: '/api/assessments/code/queue-status',
        headers: {
          authorization: `Bearer ${validStudentToken}`,
        },
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.payload);
      assert.equal(json.success, true);
      assert.equal(typeof json.active, 'number');
      assert.equal(typeof json.queued, 'number');
      assert.equal(json.userIsExecuting, false);
    });

    test('Bounded FIFO queue times out after maxWaitMs with HTTP 503 and Retry-After', async () => {
      // Create test limiter with 1 concurrency, queue size 5, and 100ms max wait
      const testLimiter = new ConcurrencyLimiter(1, 5, 100);

      // Occupy slot 1
      await testLimiter.acquire();

      // Slot 2 enters queue and should timeout after 100ms
      await assert.rejects(
        async () => {
          await testLimiter.acquire();
        },
        (err: any) => {
          assert.equal(err.statusCode, 503);
          assert.equal(err.retryAfter, 5);
          assert.match(err.message, /wait limit exceeded/i);
          return true;
        }
      );

      testLimiter.release();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Separate Rate Limits & Failure Rollback (Sub-item e)
  // ──────────────────────────────────────────────────────────────────────────
  describe('6. Separate Run vs Submit Rate Limits & Refund on Failure', () => {
    test('Run cooldown enforces 2-second delay between runs', () => {
      const testUser = 'user-run-cooldown-test';
      userRunRateLimits.delete(testUser);

      // First run succeeds
      checkRunRateLimit(testUser);

      // Immediate second run fails with cooldown error
      assert.throws(
        () => checkRunRateLimit(testUser),
        /Rate limit exceeded. Please wait at least 2 seconds/i
      );
    });

    test('Submit cooldown enforces 5-second delay between submissions', () => {
      const testUser = 'user-submit-cooldown-test';
      userSubmitRateLimits.delete(testUser);

      // First submit succeeds
      checkSubmitRateLimit(testUser);

      // Immediate second submit fails with cooldown error
      assert.throws(
        () => checkSubmitRateLimit(testUser),
        /Submission cooldown in effect. Please wait at least 5 seconds/i
      );
    });

    test('Provider failure rolls back recorded rate limit timestamp', () => {
      const testUser = 'user-rollback-test';
      userRunRateLimits.delete(testUser);

      const ts = checkRunRateLimit(testUser);
      assert.equal(userRunRateLimits.get(testUser)?.recentTimestamps.length, 1);

      // Simulate provider network failure and rollback
      rollbackRunRateLimit(testUser, ts);
      assert.equal(userRunRateLimits.get(testUser)?.recentTimestamps.length, 0);

      // After rollback, student can run immediately without being penalized
      assert.doesNotThrow(() => checkRunRateLimit(testUser));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Legacy Route Deprecation (Sub-item 4)
  // ──────────────────────────────────────────────────────────────────────────
  describe('7. Legacy Route Deprecation (Option B)', () => {
    test('POST /api/problems/:id/submit returns HTTP 410 Gone', async () => {
      const res = await server.inject({
        method: 'POST',
        url: `/api/problems/${challengeId}/submit`,
        headers: {
          authorization: `Bearer ${validStudentToken}`,
          'content-type': 'application/json',
        },
        payload: {
          code: 'print(1)',
          languageId: 71,
        },
      });

      assert.equal(res.statusCode, 410);
      const json = JSON.parse(res.payload);
      assert.equal(json.code, 'ENDPOINT_DEPRECATED');
      assert.match(json.error, /deprecated/i);
    });
  });
});
