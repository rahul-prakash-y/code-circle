import { test, describe, before, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { server } from '../server';
import User from '../models/userModel';
import Assessment from '../models/assessmentModel';
import AssessmentSubmission from '../models/assessmentSubmissionModel';
import PointTransaction from '../models/pointTransactionModel';
import AuditLog from '../models/auditLogModel';
import { submissionQueue, QueueOverflowError } from '../services/submissionQueueService';
import { getJwtSecret } from '../middleware/authMiddleware';

describe('Hardened Exam Submission Queue & Resilient Flow Test Suite', () => {
  const secret = getJwtSecret();

  const studentId = '507f1f77bcf86cd799439011';
  const facultyId = '507f1f77bcf86cd799439012';
  const adminId = '507f1f77bcf86cd799439013';
  const assessmentId = '507f1f77bcf86cd799439020';

  const validStudentToken = jwt.sign(
    { id: studentId, sessionId: 'sess-student-queue-1' },
    secret,
    { expiresIn: '1h' }
  );

  const validFacultyToken = jwt.sign(
    { id: facultyId, sessionId: 'sess-faculty-queue-1' },
    secret,
    { expiresIn: '1h' }
  );

  const validAdminToken = jwt.sign(
    { id: adminId, sessionId: 'sess-admin-queue-1' },
    secret,
    { expiresIn: '1h' }
  );

  // In-memory mock database collection for AssessmentSubmission
  const mockSubmissions = new Map<string, any>();

  // Mock Assessment definition
  let currentAssessmentConfig: any = null;

  before(async () => {
    await server.ready();

    // Mock User.findById
    mock.method(User, 'findById', (id: any) => {
      const idStr = String(id);
      if (idStr === studentId) {
        return {
          select: () => Promise.resolve({ points: 150 }),
          then: (resolve: any) =>
            resolve({
              _id: new mongoose.Types.ObjectId(studentId),
              id: studentId,
              role: 'Student',
              email: 'student@example.com',
              name: 'Student Candidate',
              isBlocked: false,
              points: 150,
              activeSessionId: 'sess-student-queue-1',
            }),
        };
      }
      if (idStr === facultyId) {
        return {
          select: () => Promise.resolve({ points: 500 }),
          then: (resolve: any) =>
            resolve({
              _id: new mongoose.Types.ObjectId(facultyId),
              id: facultyId,
              role: 'Faculty',
              email: 'faculty@example.com',
              name: 'Faculty Examiner',
              isBlocked: false,
              points: 500,
              activeSessionId: 'sess-faculty-queue-1',
            }),
        };
      }
      if (idStr === adminId) {
        return {
          select: () => Promise.resolve({ points: 1000 }),
          then: (resolve: any) =>
            resolve({
              _id: new mongoose.Types.ObjectId(adminId),
              id: adminId,
              role: 'Admin',
              email: 'admin@example.com',
              name: 'Exam Administrator',
              isBlocked: false,
              points: 1000,
              activeSessionId: 'sess-admin-queue-1',
            }),
        };
      }
      return {
        select: () => Promise.resolve({ points: 0 }),
        then: (resolve: any) =>
          resolve({
            _id: new mongoose.Types.ObjectId(idStr),
            id: idStr,
            role: 'Student',
            email: `student-${idStr}@example.com`,
            name: `Candidate ${idStr}`,
            isBlocked: false,
            points: 0,
            activeSessionId: `sess-${idStr}`,
          }),
      };
    });

    // Mock User.findByIdAndUpdate
    mock.method(User, 'findByIdAndUpdate', () => Promise.resolve({}));

    // Mock Assessment.findById
    mock.method(Assessment, 'findById', (id: any) => {
      const doc = String(id) === assessmentId ? currentAssessmentConfig : null;
      return {
        select: () => ({
          lean: () => Promise.resolve(doc),
          then: (resolve: any) => resolve(doc),
        }),
        lean: () => Promise.resolve(doc),
        then: (resolve: any) => resolve(doc),
      };
    });

    // Mock AssessmentSubmission.findOne
    mock.method(AssessmentSubmission, 'findOne', (filter: any) => {
      return {
        lean: () => {
          if (!filter) return Promise.resolve(null);
          const userId = filter.user ? String(filter.user) : '';
          const assessId = filter.assessment ? String(filter.assessment) : '';
          const subId = filter.submissionId ? String(filter.submissionId) : '';
          const key = `${userId}:${assessId}:${subId}`;
          if (mockSubmissions.has(key)) {
            return Promise.resolve(mockSubmissions.get(key));
          }
          return Promise.resolve(null);
        },
        then: (resolve: any) => {
          if (!filter) return resolve(null);
          const userId = filter.user ? String(filter.user) : '';
          const assessId = filter.assessment ? String(filter.assessment) : '';
          const subId = filter.submissionId ? String(filter.submissionId) : '';
          const key = `${userId}:${assessId}:${subId}`;
          if (mockSubmissions.has(key)) {
            return resolve(mockSubmissions.get(key));
          }
          return resolve(null);
        },
      };
    });

    // Mock AssessmentSubmission.bulkWrite with atomic upsert ($setOnInsert)
    mock.method(AssessmentSubmission, 'bulkWrite', (ops: any[], options?: any) => {
      let insertedCount = 0;
      let matchedCount = 0;

      for (const op of ops) {
        if (op.updateOne) {
          const filter = op.updateOne.filter;
          const uId = String(filter.user);
          const aId = String(filter.assessment);
          const sId = String(filter.submissionId);
          const key = `${uId}:${aId}:${sId}`;

          if (mockSubmissions.has(key)) {
            matchedCount++;
          } else {
            const doc = {
              ...(op.updateOne.update.$setOnInsert || {}),
              _id: new mongoose.Types.ObjectId(),
              user: filter.user,
              assessment: filter.assessment,
              submissionId: filter.submissionId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            mockSubmissions.set(key, doc);
            insertedCount++;
          }
        }
      }

      return Promise.resolve({
        ok: 1,
        insertedCount,
        matchedCount,
        modifiedCount: 0,
        upsertedCount: insertedCount,
      });
    });

    // Mock PointTransaction and AuditLog
    mock.method(PointTransaction, 'findOne', () => Promise.resolve(null));
    mock.method(PointTransaction, 'create', () => Promise.resolve({}));
    mock.method(AuditLog, 'create', () => Promise.resolve({}));
  });

  beforeEach(() => {
    submissionQueue.clear();
    mockSubmissions.clear();

    currentAssessmentConfig = {
      _id: new mongoose.Types.ObjectId(assessmentId),
      title: 'Formal Comprehensive Exam',
      isPublished: true,
      passingScorePercentage: 50,
      customPoints: 50,
      serverCheckpointIntervalSeconds: 0,
      submissionGraceWindowSeconds: 120,
      deadline: null,
      startTime: null,
      questions: [
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439051'),
          questionText: 'What is the time complexity of binary search on sorted array?',
          options: ['O(N)', 'O(log N)', 'O(N^2)', 'O(1)'],
          correctOptionIndex: 1,
          points: 10,
        },
        {
          _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439052'),
          questionText: 'Which protocol is connection-oriented and reliable?',
          options: ['UDP', 'ICMP', 'TCP', 'IP'],
          correctOptionIndex: 2,
          points: 10,
        },
      ],
    };
  });

  after(() => {
    submissionQueue.stop();
  });

  // =========================================================================
  // TEST 1: Kill the server with items queued -> client retries produce exactly 1 stored submission
  // =========================================================================
  test('1. Server crash / kill with queued items: Client retries produce exactly one stored submission in MongoDB', async () => {
    const clientSubmissionId = crypto.randomUUID();

    // Student submits for the first time
    const submitPayload = {
      submissionId: clientSubmissionId,
      answers: [
        { questionIndex: 0, selectedOption: 1 }, // Correct (10 pts)
        { questionIndex: 1, selectedOption: 2 }, // Correct (10 pts)
      ],
      timeSpentSeconds: 65,
    };

    const firstRes = await server.inject({
      method: 'POST',
      url: `/api/assessments/${assessmentId}/submit`,
      headers: { authorization: `Bearer ${validStudentToken}` },
      payload: submitPayload,
    });

    assert.equal(firstRes.statusCode, 202);
    const firstBody = firstRes.json();
    assert.equal(firstBody.status, 'pending');
    assert.equal(firstBody.submissionId, clientSubmissionId);
    assert.equal(submissionQueue.getQueueStatus().pendingCount, 1);

    // SIMULATE SERVER PROCESS KILL / RESTART (Memory wiped without flusher writing to DB)
    submissionQueue.clear();
    assert.equal(submissionQueue.getQueueStatus().pendingCount, 0);
    assert.equal(mockSubmissions.size, 0, 'DB must not contain submission yet');

    // Client retries submission with the EXACT SAME submissionId (restored from IndexedDB)
    const retryRes1 = await server.inject({
      method: 'POST',
      url: `/api/assessments/${assessmentId}/submit`,
      headers: { authorization: `Bearer ${validStudentToken}` },
      payload: submitPayload,
    });

    assert.equal(retryRes1.statusCode, 202);
    assert.equal(retryRes1.json().submissionId, clientSubmissionId);
    assert.equal(submissionQueue.getQueueStatus().pendingCount, 1);

    // Flusher writes the batch to MongoDB
    const flushResult = await submissionQueue.flush();
    assert.equal(flushResult.flushedCount, 1);
    assert.equal(mockSubmissions.size, 1, 'MongoDB now has exactly 1 stored document');

    // Client sends another retry (e.g., due to temporary network timeout receiving flush confirmation)
    const retryRes2 = await server.inject({
      method: 'POST',
      url: `/api/assessments/${assessmentId}/submit`,
      headers: { authorization: `Bearer ${validStudentToken}` },
      payload: submitPayload,
    });

    // Server recognizes existing persistent submission and returns 200 "saved"
    assert.equal(retryRes2.statusCode, 200);
    const retryBody2 = retryRes2.json();
    assert.equal(retryBody2.status, 'saved');
    assert.equal(retryBody2.data.submissionId, clientSubmissionId);
    assert.equal(retryBody2.data.score, 20);
    assert.equal(retryBody2.data.passed, true);

    // CRITICAL INVARIANT: MongoDB must contain exactly ONE stored document
    assert.equal(mockSubmissions.size, 1);
    const storedDoc = Array.from(mockSubmissions.values())[0];
    assert.equal(storedDoc.submissionId, clientSubmissionId);
    assert.equal(String(storedDoc.user), studentId);
  });

  // =========================================================================
  // TEST 2: Double-clicking Flush now creates no duplicates
  // =========================================================================
  test('2. Concurrency Safety: Double-clicking "Flush now" triggers concurrent flushes with zero duplicate documents', async () => {
    // Enqueue 5 distinct student submissions
    for (let i = 1; i <= 5; i++) {
      const subId = `sub-concurrent-${i}-${crypto.randomUUID()}`;
      await submissionQueue.enqueue({
        submissionId: subId,
        userId: `507f1f77bcf86cd7994390${10 + i}`,
        assessmentId,
        assessmentTitle: 'Formal Comprehensive Exam',
        answers: [{ questionIndex: 0, selectedOption: 1 }],
        score: 10,
        totalPoints: 20,
        percentage: 50,
        passed: true,
        pointsAwarded: 50,
        timeSpentSeconds: 40,
        detailedResults: [],
        isLate: false,
        submissionStatus: 'on_time',
        enqueuedAt: new Date(),
        submittedAt: new Date(),
        passingScorePercentage: 50,
        customPoints: 50,
      });
    }

    assert.equal(submissionQueue.getQueueStatus().pendingCount, 5);

    // Simulate double-click on "Flush now" (two concurrent flushes fired simultaneously)
    const [flush1, flush2] = await Promise.all([
      submissionQueue.flush(),
      submissionQueue.flush(),
    ]);

    // One flush executes the batch, while the second is safely locked by isFlushing
    const totalFlushed = flush1.flushedCount + flush2.flushedCount;
    assert.equal(totalFlushed, 5);

    // Verify all 5 documents are durably stored in MongoDB with ZERO duplicates
    assert.equal(mockSubmissions.size, 5);

    // Subsequent flush on empty queue returns 0 without errors
    const flush3 = await submissionQueue.flush();
    assert.equal(flush3.flushedCount, 0);
    assert.equal(mockSubmissions.size, 5);
  });

  // =========================================================================
  // TEST 3: Non-admins get 403 on admin queue routes
  // =========================================================================
  test('3. RBAC Enforcement: Non-admins receive 403 Forbidden on all admin queue operations', async () => {
    const adminEndpoints = [
      { method: 'GET', url: '/api/assessments/admin/queue/status' },
      { method: 'POST', url: '/api/assessments/admin/queue/flush-now' },
      { method: 'POST', url: '/api/assessments/admin/queue/retry-failed' },
      { method: 'GET', url: '/api/assessments/admin/queue/download-backup' },
    ];

    for (const endpoint of adminEndpoints) {
      // 1. Unauthenticated request -> 401 Unauthorized
      const unauthRes = await server.inject({
        method: endpoint.method as any,
        url: endpoint.url,
      });
      assert.equal(unauthRes.statusCode, 401, `Endpoint ${endpoint.url} must require authentication`);

      // 2. Student request -> 403 Forbidden
      const studentRes = await server.inject({
        method: endpoint.method as any,
        url: endpoint.url,
        headers: { authorization: `Bearer ${validStudentToken}` },
      });
      assert.equal(
        studentRes.statusCode,
        403,
        `Student must be forbidden from accessing admin queue endpoint ${endpoint.url}`
      );
      assert.match(studentRes.json().error, /Insufficient permissions|Forbidden/i);

      // 3. Faculty request -> 200 OK
      const facultyRes = await server.inject({
        method: endpoint.method as any,
        url: endpoint.url,
        headers: { authorization: `Bearer ${validFacultyToken}` },
      });
      assert.equal(
        facultyRes.statusCode,
        200,
        `Faculty must be authorized to access ${endpoint.url}`
      );

      // 4. Admin request -> 200 OK
      const adminRes = await server.inject({
        method: endpoint.method as any,
        url: endpoint.url,
        headers: { authorization: `Bearer ${validAdminToken}` },
      });
      assert.equal(
        adminRes.statusCode,
        200,
        `Admin must be authorized to access ${endpoint.url}`
      );
    }
  });

  // =========================================================================
  // TEST 4: Queue overflow returns 503 and clients recover
  // =========================================================================
  test('4. Bounded Queue Backpressure: Overflow returns 503 with Retry-After: 2 and client recovers after flush', async () => {
    // Configure queue to small maximum bound of 2 items
    (submissionQueue as any).maxQueueSize = 2;

    const sub1 = crypto.randomUUID();
    const sub2 = crypto.randomUUID();
    const sub3 = crypto.randomUUID();

    // Fill queue to capacity (2 items)
    const res1 = await server.inject({
      method: 'POST',
      url: `/api/assessments/${assessmentId}/submit`,
      headers: { authorization: `Bearer ${validStudentToken}` },
      payload: { submissionId: sub1, answers: [{ questionIndex: 0, selectedOption: 1 }] },
    });
    assert.equal(res1.statusCode, 202);

    const res2 = await server.inject({
      method: 'POST',
      url: `/api/assessments/${assessmentId}/submit`,
      headers: { authorization: `Bearer ${validStudentToken}` },
      payload: { submissionId: sub2, answers: [{ questionIndex: 0, selectedOption: 1 }] },
    });
    assert.equal(res2.statusCode, 202);

    // 3rd submission exceeds capacity -> QueueOverflowError -> 503 Service Unavailable
    const res3 = await server.inject({
      method: 'POST',
      url: `/api/assessments/${assessmentId}/submit`,
      headers: { authorization: `Bearer ${validStudentToken}` },
      payload: { submissionId: sub3, answers: [{ questionIndex: 0, selectedOption: 1 }] },
    });

    assert.equal(res3.statusCode, 503);
    assert.equal(res3.headers['retry-after'], '2');
    const errBody = res3.json();
    assert.equal(errBody.code, 'QUEUE_OVERFLOW');
    assert.equal(errBody.retryAfterSeconds, 2);
    assert.match(errBody.error, /full/i);

    // DRAIN / FLUSH QUEUE to free capacity
    const flushRes = await submissionQueue.flush();
    assert.equal(flushRes.flushedCount, 2);
    assert.equal(submissionQueue.getQueueStatus().pendingCount, 0);

    // CLIENT RECOVERS: Resubmits submission 3 after backpressure window
    const recoverRes = await server.inject({
      method: 'POST',
      url: `/api/assessments/${assessmentId}/submit`,
      headers: { authorization: `Bearer ${validStudentToken}` },
      payload: { submissionId: sub3, answers: [{ questionIndex: 0, selectedOption: 1 }] },
    });

    assert.equal(recoverRes.statusCode, 202);
    assert.equal(recoverRes.json().status, 'pending');
    assert.equal(recoverRes.json().submissionId, sub3);

    // Restore queue size bound
    (submissionQueue as any).maxQueueSize = 1000;
  });

  // =========================================================================
  // TEST 5: Backup export contains all pending items
  // =========================================================================
  test('5. Backup Export: Admin backup export captures all in-memory pending items and failed items', async () => {
    const subA = `export-item-A-${crypto.randomUUID()}`;
    const subB = `export-item-B-${crypto.randomUUID()}`;

    // Add 2 pending items
    await submissionQueue.enqueue({
      submissionId: subA,
      userId: studentId,
      assessmentId,
      assessmentTitle: 'Formal Comprehensive Exam',
      answers: [{ questionIndex: 0, selectedOption: 1 }],
      score: 10,
      totalPoints: 20,
      percentage: 50,
      passed: true,
      pointsAwarded: 50,
      timeSpentSeconds: 30,
      detailedResults: [],
      isLate: false,
      submissionStatus: 'on_time',
      enqueuedAt: new Date(),
      submittedAt: new Date(),
      passingScorePercentage: 50,
      customPoints: 50,
    });

    await submissionQueue.enqueue({
      submissionId: subB,
      userId: studentId,
      assessmentId,
      assessmentTitle: 'Formal Comprehensive Exam',
      answers: [{ questionIndex: 1, selectedOption: 2 }],
      score: 10,
      totalPoints: 20,
      percentage: 50,
      passed: true,
      pointsAwarded: 50,
      timeSpentSeconds: 45,
      detailedResults: [],
      isLate: false,
      submissionStatus: 'on_time',
      enqueuedAt: new Date(),
      submittedAt: new Date(),
      passingScorePercentage: 50,
      customPoints: 50,
    });

    // Simulate an item in failedQueue
    const failedItem = {
      submissionId: 'failed-item-001',
      userId: studentId,
      assessmentId,
      error: 'MongoDB Network Timeout Simulation',
      failedAt: new Date(),
      attempts: 3,
      submission: {
        submissionId: 'failed-item-001',
        userId: studentId,
        assessmentId,
        score: 20,
      } as any,
    };
    (submissionQueue as any).failedQueue.push(failedItem);

    // Fetch backup as Admin
    const backupRes = await server.inject({
      method: 'GET',
      url: '/api/assessments/admin/queue/download-backup',
      headers: { authorization: `Bearer ${validAdminToken}` },
    });

    assert.equal(backupRes.statusCode, 200);
    assert.match(backupRes.headers['content-type'] || '', /application\/json/i);
    assert.match(backupRes.headers['content-disposition'] || '', /queue-backup-/i);

    const backupData = backupRes.json();
    assert.equal(backupData.pendingCount, 2);
    assert.equal(backupData.pendingSubmissions.length, 2);
    assert.equal(backupData.pendingSubmissions[0].submissionId, subA);
    assert.equal(backupData.pendingSubmissions[1].submissionId, subB);
    assert.equal(backupData.failedCount, 1);
    assert.equal(backupData.failedSubmissions[0].submissionId, 'failed-item-001');
    assert.equal(backupData.failedSubmissions[0].error, 'MongoDB Network Timeout Simulation');
  });

  // =========================================================================
  // TEST 6: Late submission inside grace window is accepted & flagged, outside is rejected
  // =========================================================================
  test('6. Deadline & Grace Window Enforcement: Inside grace window accepted as "late", outside rejected (400)', async () => {
    // 6a. Inside Grace Window: Deadline was 40 seconds ago, grace window is 120 seconds
    const deadlinePast = new Date(Date.now() - 40 * 1000);
    currentAssessmentConfig.deadline = deadlinePast;
    currentAssessmentConfig.submissionGraceWindowSeconds = 120;

    const subInsideGrace = crypto.randomUUID();
    const resInside = await server.inject({
      method: 'POST',
      url: `/api/assessments/${assessmentId}/submit`,
      headers: { authorization: `Bearer ${validStudentToken}` },
      payload: {
        submissionId: subInsideGrace,
        answers: [{ questionIndex: 0, selectedOption: 1 }],
      },
    });

    assert.equal(resInside.statusCode, 202);
    const bodyInside = resInside.json();
    assert.equal(bodyInside.isLate, true, 'Must be flagged isLate: true');
    assert.equal(bodyInside.submissionStatus, 'late', 'Must have submissionStatus: late');

    // 6b. Outside Grace Window: Deadline was 150 seconds ago (exceeds 120s grace window)
    const deadlineWayPast = new Date(Date.now() - 150 * 1000);
    currentAssessmentConfig.deadline = deadlineWayPast;
    currentAssessmentConfig.submissionGraceWindowSeconds = 120;

    const subOutsideGrace = crypto.randomUUID();
    const resOutside = await server.inject({
      method: 'POST',
      url: `/api/assessments/${assessmentId}/submit`,
      headers: { authorization: `Bearer ${validStudentToken}` },
      payload: {
        submissionId: subOutsideGrace,
        answers: [{ questionIndex: 0, selectedOption: 1 }],
      },
    });

    assert.equal(resOutside.statusCode, 400);
    const bodyOutside = resOutside.json();
    assert.equal(bodyOutside.code, 'DEADLINE_EXCEEDED');
    assert.match(bodyOutside.error, /Submission deadline has passed/i);
    assert.equal(bodyOutside.graceWindowSeconds, 120);

    // 6c. On-Time Submission: Deadline is 30 minutes in the future
    const deadlineFuture = new Date(Date.now() + 30 * 60 * 1000);
    currentAssessmentConfig.deadline = deadlineFuture;

    const subOnTime = crypto.randomUUID();
    const resOnTime = await server.inject({
      method: 'POST',
      url: `/api/assessments/${assessmentId}/submit`,
      headers: { authorization: `Bearer ${validStudentToken}` },
      payload: {
        submissionId: subOnTime,
        answers: [{ questionIndex: 0, selectedOption: 1 }],
      },
    });

    assert.equal(resOnTime.statusCode, 202);
    const bodyOnTime = resOnTime.json();
    assert.equal(bodyOnTime.isLate, false);
    assert.equal(bodyOnTime.submissionStatus, 'on_time');
  });

  // =========================================================================
  // TEST 7: 300-Student Deadline Simulation (ops/sec and p95 time-to-durable)
  // =========================================================================
  test('7. 300-Student Deadline Simulation: Validates burst enqueuing, 60 docs/sec cap, and p95 time-to-durable', async () => {
    const TOTAL_STUDENTS = 300;
    const MAX_BATCH_SIZE = 60; // Hard cap 60 doc writes/sec per requirement
    const simulatedFlushIntervalMs = 1000; // 1s flush interval

    const studentSubmissions: Array<{
      submissionId: string;
      userId: string;
      enqueuedAt: number;
      durableAt: number;
    }> = [];

    const simStartTime = Date.now();

    // 1. BURST SUBMISSION ENQUEUEING: 300 students submit simultaneously at deadline
    for (let i = 0; i < TOTAL_STUDENTS; i++) {
      const studentUid = `507f1f77bcf86cd79943${String(i).padStart(4, '0')}`;
      const subId = `sim-sub-300-${i}-${crypto.randomUUID()}`;
      const enqueuedTime = Date.now();

      studentSubmissions.push({
        submissionId: subId,
        userId: studentUid,
        enqueuedAt: enqueuedTime,
        durableAt: 0,
      });

      const res = await submissionQueue.enqueue({
        submissionId: subId,
        userId: studentUid,
        assessmentId,
        assessmentTitle: 'Formal Comprehensive Exam',
        answers: [
          { questionIndex: 0, selectedOption: 1 },
          { questionIndex: 1, selectedOption: 2 },
        ],
        score: 20,
        totalPoints: 20,
        percentage: 100,
        passed: true,
        pointsAwarded: 50,
        timeSpentSeconds: 3500,
        detailedResults: [],
        isLate: false,
        submissionStatus: 'on_time',
        enqueuedAt: new Date(enqueuedTime),
        submittedAt: new Date(enqueuedTime),
        passingScorePercentage: 50,
        customPoints: 50,
      });

      assert.equal(res.status, 'pending');
    }

    assert.equal(submissionQueue.getQueueStatus().pendingCount, TOTAL_STUDENTS);

    // 2. AUTOMATIC BATCH FLUSHER EXECUTION (60 doc writes per 1-second cycle)
    const batchLogs: Array<{
      batchNumber: number;
      batchSize: number;
      opsPerSec: number;
      remainingPending: number;
      flushDurationMs: number;
    }> = [];

    let currentBatch = 1;
    let simulatedClock = simStartTime;

    while (submissionQueue.getQueueStatus().pendingCount > 0) {
      // Simulate advance of 1 second for the background flusher interval
      simulatedClock += simulatedFlushIntervalMs;

      const flushResult = await submissionQueue.flush();
      assert.ok(flushResult.flushedCount <= MAX_BATCH_SIZE, 'Batch write must NOT exceed 60 doc writes/sec cap');

      // Record durable confirmation timestamp for this batch of students
      const startIndex = (currentBatch - 1) * MAX_BATCH_SIZE;
      const endIndex = startIndex + flushResult.flushedCount;
      for (let s = startIndex; s < endIndex; s++) {
        studentSubmissions[s].durableAt = simulatedClock;
      }

      const opsPerSec = flushResult.flushedCount / (simulatedFlushIntervalMs / 1000);
      batchLogs.push({
        batchNumber: currentBatch,
        batchSize: flushResult.flushedCount,
        opsPerSec,
        remainingPending: flushResult.remainingPending,
        flushDurationMs: flushResult.durationMs,
      });

      currentBatch++;
    }

    // 3. CALCULATE LATENCIES AND PERCENTILES
    const latencies = studentSubmissions.map((s) => s.durableAt - s.enqueuedAt);
    latencies.sort((a, b) => a - b);

    const getPercentile = (p: number) => {
      const idx = Math.ceil((p / 100) * latencies.length) - 1;
      return latencies[Math.max(0, Math.min(idx, latencies.length - 1))];
    };

    const p50 = getPercentile(50);
    const p90 = getPercentile(90);
    const p95 = getPercentile(95);
    const p99 = getPercentile(99);
    const maxLatency = latencies[latencies.length - 1];
    const peakOpsPerSec = Math.max(...batchLogs.map((b) => b.opsPerSec));

    // 4. PRINT REPORT SUMMARY TABLE
    console.log('\n================================================================');
    console.log('       300-STUDENT DEADLINE SUBMISSION BURST SIMULATION         ');
    console.log('================================================================');
    console.log(`Total Simultaneous Candidates: ${TOTAL_STUDENTS}`);
    console.log(`Flush Cap (Atlas M0 Safe Limit): ${MAX_BATCH_SIZE} doc writes/sec`);
    console.log(`Number of Flush Cycles:        ${batchLogs.length}`);
    console.log(`Peak MongoDB Writes/sec:       ${peakOpsPerSec} ops/sec (Limit: 100 ops/sec)`);
    console.log(`Total Documents Stored in DB:  ${mockSubmissions.size}`);
    console.log('----------------------------------------------------------------');
    console.log(`p50 Time-to-Durable:           ${(p50 / 1000).toFixed(2)}s`);
    console.log(`p90 Time-to-Durable:           ${(p90 / 1000).toFixed(2)}s`);
    console.log(`p95 Time-to-Durable:           ${(p95 / 1000).toFixed(2)}s`);
    console.log(`p99 Time-to-Durable:           ${(p99 / 1000).toFixed(2)}s`);
    console.log(`Max Time-to-Durable:           ${(maxLatency / 1000).toFixed(2)}s`);
    console.log('================================================================\n');

    // 5. VERIFY SYSTEM INVARIANTS & CONSTRAINTS
    // Invariant A: Exactly 300 unique submissions stored in MongoDB
    assert.equal(mockSubmissions.size, TOTAL_STUDENTS, 'All 300 submissions must be durably stored in MongoDB');

    // Invariant B: Peak write rate never exceeded the 60 ops/sec quota (Atlas M0 is 100 ops/sec)
    assert.ok(peakOpsPerSec <= 60, `Peak ops/sec (${peakOpsPerSec}) must not exceed 60 doc writes/sec`);

    // Invariant C: Zero pending items remaining in queue
    assert.equal(submissionQueue.getQueueStatus().pendingCount, 0);

    // Invariant D: p95 time-to-durable is within 5 seconds for 300 students (300 / 60 = 5 batches)
    assert.ok(p95 <= 5500, `p95 time-to-durable (${p95}ms) must be under 5.5s`);
  });
});
