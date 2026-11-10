import { test, describe, before, mock } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { server } from '../server';
import User from '../models/userModel';
import PointTransaction from '../models/pointTransactionModel';
import { getJwtSecret } from '../middleware/authMiddleware';
import { creditArenaRoundPoints } from '../controllers/eventArenaController';
import { gatherStudentPointsAudit } from '../controllers/pointsController';

describe('Event Arena Scoreboard Privacy & Student Points Crediting Suite', () => {
  const secret = getJwtSecret();
  const testStudentId = new mongoose.Types.ObjectId().toString();
  const testAdminId = new mongoose.Types.ObjectId().toString();
  const testEventId = new mongoose.Types.ObjectId().toString();
  const testAssessmentId = new mongoose.Types.ObjectId().toString();

  const studentToken = jwt.sign(
    { id: testStudentId, role: 'Student', sessionId: 'sess-stu-privacy-1' },
    secret,
    { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
    { id: testAdminId, role: 'Admin', sessionId: 'sess-adm-privacy-1' },
    secret,
    { expiresIn: '1h' }
  );

  before(async () => {
    await server.ready();

    mock.method(User, 'findById', (id: any) => {
      const idStr = String(id);
      if (idStr === testStudentId) {
        return Promise.resolve({
          _id: new mongoose.Types.ObjectId(testStudentId),
          id: testStudentId,
          role: 'Student',
          email: 'student@example.com',
          name: 'Student User',
          isBlocked: false,
          activeSessionId: 'sess-stu-privacy-1',
        });
      }
      if (idStr === testAdminId) {
        return Promise.resolve({
          _id: new mongoose.Types.ObjectId(testAdminId),
          id: testAdminId,
          role: 'Admin',
          email: 'admin@example.com',
          name: 'Admin User',
          isBlocked: false,
          activeSessionId: 'sess-adm-privacy-1',
        });
      }
      return Promise.resolve(null);
    });
  });

  test('1. Leaderboard Privacy: Student token is strictly rejected (HTTP 403) from all arena leaderboard endpoints', async () => {
    // a. Specific assessment leaderboard
    const resAssessment = await server.inject({
      method: 'GET',
      url: `/api/events/${testEventId}/arena/assessments/${testAssessmentId}/leaderboard`,
      headers: { authorization: `Bearer ${studentToken}` },
    });
    assert.equal(
      resAssessment.statusCode,
      403,
      `Expected HTTP 403 Forbidden for student accessing assessment leaderboard, got ${resAssessment.statusCode}`
    );

    // b. Overall tournament leaderboard
    const resOverall = await server.inject({
      method: 'GET',
      url: `/api/events/${testEventId}/arena/admin/overall-leaderboard`,
      headers: { authorization: `Bearer ${studentToken}` },
    });
    assert.equal(
      resOverall.statusCode,
      403,
      `Expected HTTP 403 Forbidden for student accessing overall arena leaderboard, got ${resOverall.statusCode}`
    );

    // c. Legacy arena leaderboard
    const resLegacy = await server.inject({
      method: 'GET',
      url: `/api/events/${testEventId}/arena/leaderboard`,
      headers: { authorization: `Bearer ${studentToken}` },
    });
    assert.equal(
      resLegacy.statusCode,
      403,
      `Expected HTTP 403 Forbidden for student accessing legacy arena leaderboard, got ${resLegacy.statusCode}`
    );
  });

  test('2. Points Crediting Helper: creditArenaRoundPoints updates User.points and creates PointTransaction ledger entry', async (t) => {
    const mockSubmissionId = new mongoose.Types.ObjectId();
    let updatedPoints = 0;
    let createdTx: any = null;

    t.mock.method(User, 'findByIdAndUpdate', async (_id: any, update: any) => {
      if (update?.$inc?.points) {
        updatedPoints += update.$inc.points;
      }
      return { _id, points: updatedPoints } as any;
    });

    t.mock.method(PointTransaction, 'create', async (doc: any) => {
      createdTx = doc;
      return doc as any;
    });

    // Credit 75 points for Round 1
    await creditArenaRoundPoints({
      userId: testStudentId,
      amount: 75,
      eventTitle: 'Hackathon 2026',
      roundTitle: 'Round 1: Rapid Algorithmic Coding',
      submissionId: mockSubmissionId,
    });

    assert.equal(updatedPoints, 75, 'User points should be incremented by 75');
    assert.ok(createdTx, 'A PointTransaction record should be created');
    assert.equal(createdTx.category, 'Contest');
    assert.equal(createdTx.amount, 75);
    assert.equal(createdTx.referenceId, mockSubmissionId.toString());
    assert.equal(createdTx.referenceModel, 'EventArenaSubmission');
    assert.match(createdTx.title, /Hackathon 2026 - Round: Round 1/);
    assert.equal(createdTx.balanceAfter, 75);

    // Delta of 0 does not create duplicate transaction
    const beforeTx = createdTx;
    await creditArenaRoundPoints({
      userId: testStudentId,
      amount: 0,
      eventTitle: 'Hackathon 2026',
      roundTitle: 'Round 1: Rapid Algorithmic Coding',
      submissionId: mockSubmissionId,
    });
    assert.equal(createdTx, beforeTx, 'Zero delta should be a no-op');
    assert.equal(updatedPoints, 75, 'User points should remain unchanged when delta is 0');
  });

  test('3. Points Crediting Reconciliation: Adjusts points cleanly on manual re-evaluation delta', async (t) => {
    const mockSubmissionId = new mongoose.Types.ObjectId();
    let currentPoints = 75;
    let createdTx: any = null;

    t.mock.method(User, 'findByIdAndUpdate', async (_id: any, update: any) => {
      if (update?.$inc?.points) {
        currentPoints += update.$inc.points;
      }
      return { _id, points: currentPoints } as any;
    });

    t.mock.method(PointTransaction, 'create', async (doc: any) => {
      createdTx = doc;
      return doc as any;
    });

    // Admin manually awards 15 extra points in design/code evaluation
    await creditArenaRoundPoints({
      userId: testStudentId,
      amount: 15,
      eventTitle: 'Hackathon 2026',
      roundTitle: 'Round 1: Rapid Algorithmic Coding',
      submissionId: mockSubmissionId,
      awardedBy: testAdminId,
      note: 'Earned 15 pts from code evaluation in Event Arena.',
    });

    assert.equal(currentPoints, 90, 'User points should now be 90');
    assert.equal(createdTx.amount, 15);
    assert.equal(createdTx.balanceAfter, 90);
    assert.equal(createdTx.note || createdTx.description, 'Earned 15 pts from code evaluation in Event Arena.');
  });
});
