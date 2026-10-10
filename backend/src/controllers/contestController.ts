import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import Contest, { IContest } from '../models/contestModel';
import ContestSubmission from '../models/contestSubmissionModel';
import User from '../models/userModel';
import rceService from '../services/rceService';

interface AuthUser {
  userId?: string;
  _id?: string;
  id?: string;
  role?: string;
  email?: string;
  name?: string;
}

const getUserId = (req: FastifyRequest): string => {
  const user = (req as any).user as AuthUser;
  return user?.userId || user?._id || user?.id || '';
};

// Normalize output for test comparison
function normalizeOutput(output: string): string {
  if (typeof output !== 'string') return '';
  return output
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

// 1. Get All Contests (Split by Status)
export const getContests = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = getUserId(req);
    const now = new Date();

    const contests = await Contest.find({ isPublished: true })
      .sort({ startTime: -1 })
      .lean();

    // Map dynamic status based on time
    const updatedContests = await Promise.all(
      contests.map(async (c) => {
        let dynamicStatus = c.status;
        if (now < new Date(c.startTime)) {
          dynamicStatus = 'UPCOMING';
        } else if (now >= new Date(c.startTime) && now <= new Date(c.endTime)) {
          dynamicStatus = 'LIVE';
        } else {
          dynamicStatus = 'ENDED';
        }

        // Check if current user has a submission
        let mySubmission: any = null;
        if (userId) {
          mySubmission = await ContestSubmission.findOne({
            contestId: c._id,
            userId,
          })
            .select('status totalScore startedAt submittedAt expiresAt')
            .lean();
        }

        return {
          ...c,
          status: dynamicStatus,
          mySubmission,
          mcqCount: c.mcqQuestions?.length || 0,
          codingCount: c.codingProblems?.length || 0,
          // Redact questions list in overview to save bandwidth
          mcqQuestions: undefined,
          codingProblems: undefined,
        };
      })
    );

    return reply.send({ success: true, count: updatedContests.length, data: updatedContests });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch contests' });
  }
};

// 2. Get Single Contest Details
export const getContestById = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const user = (req as any).user as AuthUser;
    const userId = getUserId(req);

    const contest = await Contest.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { slug: id.toLowerCase() }],
    }).lean();

    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const isPrivileged = user?.role === 'Admin' || user?.role === 'SuperAdmin' || user?.role === 'Faculty';
    const now = new Date();
    let dynamicStatus = contest.status;
    if (now < new Date(contest.startTime)) {
      dynamicStatus = 'UPCOMING';
    } else if (now >= new Date(contest.startTime) && now <= new Date(contest.endTime)) {
      dynamicStatus = 'LIVE';
    } else {
      dynamicStatus = 'ENDED';
    }

    // Check user submission
    let mySubmission = null;
    if (userId) {
      mySubmission = await ContestSubmission.findOne({
        contestId: contest._id,
        userId,
      }).lean();
    }

    // If student and contest not ended, redact correctOptionIndex and hidden test cases
    const shouldRedact = !isPrivileged && dynamicStatus !== 'ENDED';

    const mcqQuestions = (contest.mcqQuestions || []).map((q: any) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      points: q.points,
      correctOptionIndex: shouldRedact ? undefined : q.correctOptionIndex,
      explanation: shouldRedact ? undefined : q.explanation,
    }));

    const codingProblems = (contest.codingProblems || []).map((p: any) => ({
      _id: p._id,
      title: p.title,
      description: p.description,
      inputFormat: p.inputFormat,
      outputFormat: p.outputFormat,
      constraints: p.constraints,
      difficulty: p.difficulty,
      points: p.points,
      allowedLanguages: p.allowedLanguages,
      starterCode: p.starterCode,
      sampleInput: p.sampleInput,
      sampleOutput: p.sampleOutput,
      testCases: (p.testCases || [])
        .filter((tc: any) => (!shouldRedact ? true : !tc.isHidden))
        .map((tc: any) => ({
          _id: tc._id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
        })),
    }));

    return reply.send({
      success: true,
      data: {
        ...contest,
        status: dynamicStatus,
        mcqQuestions,
        codingProblems,
        mySubmission,
      },
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch contest' });
  }
};

// 3. Start Contest Session
export const startContestSession = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const userId = getUserId(req);

    const contest = await Contest.findById(id);
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const now = new Date();
    if (now > new Date(contest.endTime)) {
      return reply.status(400).send({ success: false, error: 'This contest has already ended.' });
    }

    // Existing session check
    let submission = await ContestSubmission.findOne({ contestId: contest._id, userId });
    if (submission) {
      if (submission.status === 'SUBMITTED') {
        return reply.status(400).send({
          success: false,
          error: 'You have already submitted this contest.',
          submission,
        });
      }
      return reply.send({ success: true, message: 'Resuming active session', submission });
    }

    // Initialize session with strict duration
    const expiresAt = new Date(
      Math.min(now.getTime() + contest.durationMinutes * 60000, new Date(contest.endTime).getTime())
    );

    submission = await ContestSubmission.create({
      contestId: contest._id,
      userId,
      startedAt: now,
      expiresAt,
      status: 'IN_PROGRESS',
      mcqAnswers: [],
      codingSubmissions: [],
      totalScore: 0,
      timeTakenSeconds: 0,
    });

    await Contest.findByIdAndUpdate(contest._id, { $inc: { participantsCount: 1 } });

    return reply.status(201).send({
      success: true,
      message: 'Contest session started!',
      submission,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to start contest session' });
  }
};

// 4. Run Coding Problem Code (Against Sample Test Cases)
export const runContestCode = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const { problemId, code, language = 'python', customInput } = req.body as any;

    if (!code || !problemId) {
      return reply.status(400).send({ success: false, error: 'Code and problemId are required' });
    }

    const contest = await Contest.findById(id);
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const problem = contest.codingProblems.find((p: any) => p._id.toString() === problemId);
    if (!problem) {
      return reply.status(404).send({ success: false, error: 'Coding problem not found in contest' });
    }

    // Standardize input
    const stdin = customInput !== undefined ? customInput : problem.sampleInput || '';

    const executionResult = await rceService.executeCode({
      sourceCode: code,
      language: language as any,
      stdin,
      timeoutMs: 10000,
    });

    const normalizedActual = normalizeOutput(executionResult.stdout || '');
    const normalizedExpected = normalizeOutput(problem.sampleOutput || '');
    const isSamplePassed = !executionResult.stderr && normalizedActual === normalizedExpected;

    return reply.send({
      success: true,
      data: {
        stdout: executionResult.stdout,
        stderr: executionResult.stderr,
        executionTimeMs: executionResult.executionTimeMs,
        isSamplePassed,
        expectedOutput: problem.sampleOutput,
      },
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: error.message || 'Execution failed' });
  }
};

// 5. Submit Coding Problem (Evaluates All Public + Hidden Test Cases)
export const submitContestProblemCode = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const userId = getUserId(req);
    const { problemId, code, language = 'python' } = req.body as any;

    const contest = await Contest.findById(id);
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const submission = await ContestSubmission.findOne({ contestId: contest._id, userId });
    if (!submission || submission.status === 'SUBMITTED') {
      return reply.status(400).send({ success: false, error: 'No active contest session found' });
    }

    const problem = contest.codingProblems.find((p: any) => p._id.toString() === problemId);
    if (!problem) {
      return reply.status(404).send({ success: false, error: 'Coding problem not found' });
    }

    const testCases = problem.testCases || [];
    if (testCases.length === 0) {
      // Default sample test case
      testCases.push({
        input: problem.sampleInput || '',
        expectedOutput: problem.sampleOutput || '',
        isHidden: false,
      } as any);
    }

    let passedCount = 0;
    const testCaseResults: any[] = [];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      try {
        const res = await rceService.executeCode({
          sourceCode: code,
          language: language as any,
          stdin: tc.input || '',
          timeoutMs: 8000,
        });

        const actual = normalizeOutput(res.stdout || '');
        const expected = normalizeOutput(tc.expectedOutput || '');
        const passed = !res.stderr && actual === expected;

        if (passed) passedCount++;

        testCaseResults.push({
          testCaseNumber: i + 1,
          passed,
          isHidden: tc.isHidden,
          executionTimeMs: res.executionTimeMs,
          // Hide actual/expected output if hidden
          actualOutput: tc.isHidden ? (passed ? 'Hidden' : 'Output Mismatch') : res.stdout,
          expectedOutput: tc.isHidden ? 'Hidden' : tc.expectedOutput,
          error: res.stderr || null,
        });
      } catch (err: any) {
        testCaseResults.push({
          testCaseNumber: i + 1,
          passed: false,
          isHidden: tc.isHidden,
          error: err.message,
        });
      }
    }

    const totalTests = testCases.length;
    const pointsEarned = Math.round((passedCount / totalTests) * problem.points);
    const status =
      passedCount === totalTests
        ? 'ACCEPTED'
        : passedCount > 0
        ? 'WRONG_ANSWER'
        : 'COMPILATION_ERROR';

    // Update submission record
    const existingIndex = submission.codingSubmissions.findIndex(
      (c) => c.problemId.toString() === problemId
    );

    const codingRecord = {
      problemId: new mongoose.Types.ObjectId(problemId),
      code,
      language,
      passedTestCases: passedCount,
      totalTestCases: totalTests,
      status: status as any,
      pointsEarned,
      submittedAt: new Date(),
    };

    if (existingIndex >= 0) {
      submission.codingSubmissions[existingIndex] = codingRecord;
    } else {
      submission.codingSubmissions.push(codingRecord);
    }

    await submission.save();

    return reply.send({
      success: true,
      data: {
        problemId,
        passedCount,
        totalTests,
        pointsEarned,
        maxPoints: problem.points,
        status,
        testCaseResults,
      },
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to evaluate challenge submission' });
  }
};

// 6. Submit Full Contest & Award Points
export const submitContest = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const userId = getUserId(req);
    const { mcqAnswers = [] } = req.body as any;

    const contest = await Contest.findById(id);
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const submission = await ContestSubmission.findOne({ contestId: contest._id, userId });
    if (!submission) {
      return reply.status(400).send({ success: false, error: 'No contest session found' });
    }

    if (submission.status === 'SUBMITTED') {
      return reply.send({ success: true, message: 'Already submitted', submission });
    }

    const now = new Date();
    const timeTakenSeconds = Math.max(0, Math.floor((now.getTime() - submission.startedAt.getTime()) / 1000));

    // Grade MCQ answers
    let mcqScore = 0;
    const gradedMcqRecords: any[] = [];

    for (const ans of mcqAnswers) {
      const question = contest.mcqQuestions.find(
        (q: any) => q._id.toString() === ans.questionId?.toString()
      );
      if (question) {
        const isCorrect = Number(ans.selectedOption) === Number(question.correctOptionIndex);
        const pointsEarned = isCorrect ? question.points : 0;
        mcqScore += pointsEarned;

        gradedMcqRecords.push({
          questionId: question._id,
          selectedOption: ans.selectedOption,
          isCorrect,
          pointsEarned,
        });
      }
    }

    // Sum coding score
    const codingScore = (submission.codingSubmissions || []).reduce(
      (sum, c) => sum + (c.pointsEarned || 0),
      0
    );

    const totalScore = mcqScore + codingScore;

    // Check contest point allocation mode (AUTOMATIC, MANUAL, HYBRID)
    const pointMode = contest.pointAllocationMode || 'AUTOMATIC';
    let awardedClubPoints = 0;
    let pointsAwarded = false;

    if (pointMode === 'MANUAL') {
      // Submissions recorded, points will be allocated manually by instructors/admins
      awardedClubPoints = 0;
      pointsAwarded = false;
    } else {
      // AUTOMATIC or HYBRID: base points automatically credited
      awardedClubPoints = Math.round(totalScore);
      if (!submission.pointsAwarded && awardedClubPoints > 0) {
        await User.findByIdAndUpdate(userId, { $inc: { points: awardedClubPoints } });
        pointsAwarded = true;
      }
    }

    submission.mcqAnswers = gradedMcqRecords;
    submission.totalScore = totalScore;
    submission.timeTakenSeconds = timeTakenSeconds;
    submission.submittedAt = now;
    submission.status = 'SUBMITTED';
    submission.pointsAwarded = pointsAwarded;
    submission.awardedClubPoints = awardedClubPoints;

    await submission.save();

    return reply.send({
      success: true,
      message:
        pointMode === 'MANUAL'
          ? 'Contest successfully submitted! Points will be allocated after instructor evaluation.'
          : 'Contest successfully submitted! Points credited to your profile.',
      data: {
        totalScore,
        mcqScore,
        codingScore,
        awardedClubPoints,
        pointAllocationMode: pointMode,
        timeTakenSeconds,
        submission,
      },
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to submit contest' });
  }
};

// 7. Get Contest Leaderboard
export const getContestLeaderboard = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };

    const contest = await Contest.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { slug: id.toLowerCase() }],
    });

    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const submissions = await ContestSubmission.find({ contestId: contest._id })
      .sort({ totalScore: -1, timeTakenSeconds: 1 })
      .populate('userId', 'name rollNo email profilePicUrl avatar department points')
      .lean();

    const leaderboard = submissions.map((s: any, idx: number) => ({
      rank: idx + 1,
      submissionId: s._id,
      user: s.userId,
      totalScore: s.totalScore,
      mcqScore: (s.mcqAnswers || []).reduce((acc: number, a: any) => acc + (a.pointsEarned || 0), 0),
      codingScore: (s.codingSubmissions || []).reduce((acc: number, c: any) => acc + (c.pointsEarned || 0), 0),
      timeTakenSeconds: s.timeTakenSeconds,
      status: s.status,
      awardedClubPoints: s.awardedClubPoints || 0,
      pointsAwarded: s.pointsAwarded || false,
      manualPointsAdjustment: s.manualPointsAdjustment || 0,
      manualPointsReason: s.manualPointsReason || '',
      manualAllocatedAt: s.manualAllocatedAt || null,
      submittedAt: s.submittedAt,
    }));

    return reply.send({
      success: true,
      contestTitle: contest.title,
      pointAllocationMode: contest.pointAllocationMode || 'AUTOMATIC',
      totalParticipants: leaderboard.length,
      data: leaderboard,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch leaderboard' });
  }
};

// 8. Admin: Create Contest
export const createContest = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = getUserId(req);
    const body = req.body as any;

    if (!body.title || !body.startTime || !body.endTime) {
      return reply.status(400).send({ success: false, error: 'Title, startTime, and endTime are required' });
    }

    // Auto generate slug
    const baseSlug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const slug = `${baseSlug}-${randomSuffix}`;

    // Compute totalPoints from questions
    let totalPoints = body.totalPoints || 0;
    if (!body.totalPoints) {
      const mcqPts = (body.mcqQuestions || []).reduce((acc: number, q: any) => acc + (q.points || 10), 0);
      const codingPts = (body.codingProblems || []).reduce((acc: number, p: any) => acc + (p.points || 30), 0);
      totalPoints = mcqPts + codingPts || 100;
    }

    const contest = await Contest.create({
      ...body,
      slug,
      totalPoints,
      createdBy: userId,
    });

    return reply.status(201).send({ success: true, data: contest });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: error.message || 'Failed to create contest' });
  }
};

// 9. Admin: Update Contest
export const updateContest = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as any;

    const contest = await Contest.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    return reply.send({ success: true, data: contest });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to update contest' });
  }
};

// 10. Admin: Delete Contest
export const deleteContest = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const contest = await Contest.findByIdAndDelete(id);
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    await ContestSubmission.deleteMany({ contestId: id });

    return reply.send({ success: true, message: 'Contest and submissions removed' });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to delete contest' });
  }
};

// 11. Admin: Allocate Points Manually for a Specific Submission
export const allocateContestPoints = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id, submissionId } = req.params as { id: string; submissionId: string };
    const adminUserId = getUserId(req);
    const { awardedClubPoints, reason = '', bonusPoints = 0 } = req.body as any;

    if (typeof awardedClubPoints !== 'number' && typeof bonusPoints !== 'number') {
      return reply.status(400).send({ success: false, error: 'Valid points value or bonus is required' });
    }

    const contest = await Contest.findById(id);
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const submission = await ContestSubmission.findById(submissionId);
    if (!submission) {
      return reply.status(404).send({ success: false, error: 'Contest submission not found' });
    }

    const currentAwarded = submission.awardedClubPoints || 0;
    let targetPoints = currentAwarded;

    if (typeof awardedClubPoints === 'number') {
      targetPoints = Math.max(0, Math.round(awardedClubPoints));
    } else if (bonusPoints) {
      targetPoints = Math.max(0, currentAwarded + Math.round(bonusPoints));
    }

    const diff = targetPoints - currentAwarded;

    // Synchronize difference with student's profile club points balance
    if (diff !== 0) {
      await User.findByIdAndUpdate(submission.userId, { $inc: { points: diff } });
    }

    submission.awardedClubPoints = targetPoints;
    submission.pointsAwarded = targetPoints > 0;
    submission.manualPointsAdjustment = (submission.manualPointsAdjustment || 0) + diff;
    submission.manualPointsReason = reason || 'Admin manual point allocation';
    if (adminUserId && mongoose.isValidObjectId(adminUserId)) {
      submission.manualAllocatedBy = new mongoose.Types.ObjectId(adminUserId);
    }
    submission.manualAllocatedAt = new Date();

    await submission.save();

    return reply.send({
      success: true,
      message: `Successfully allocated ${targetPoints} points (${diff >= 0 ? `+${diff}` : diff} delta).`,
      data: {
        submissionId: submission._id,
        awardedClubPoints: targetPoints,
        pointsDelta: diff,
        manualPointsAdjustment: submission.manualPointsAdjustment,
        manualPointsReason: submission.manualPointsReason,
        manualAllocatedAt: submission.manualAllocatedAt,
      },
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to allocate points' });
  }
};

// 12. Admin: Bulk Allocate Points (e.g. Match Total Score or Uniform Bonus)
export const bulkAllocateContestPoints = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const adminUserId = getUserId(req);
    const { allocations, preset, bonusPoints = 0, reason = '' } = req.body as any;

    const contest = await Contest.findById(id);
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const results: any[] = [];

    if (preset === 'MATCH_SCORE_ALL') {
      // Allocate each student points equal to their total earned contest score
      const submissions = await ContestSubmission.find({ contestId: contest._id });
      for (const s of submissions) {
        const currentAwarded = s.awardedClubPoints || 0;
        const targetPoints = Math.max(0, s.totalScore);
        const diff = targetPoints - currentAwarded;

        if (diff !== 0) {
          await User.findByIdAndUpdate(s.userId, { $inc: { points: diff } });
        }

        s.awardedClubPoints = targetPoints;
        s.pointsAwarded = targetPoints > 0;
        s.manualPointsAdjustment = (s.manualPointsAdjustment || 0) + diff;
        s.manualPointsReason = reason || 'Bulk match total score';
        if (adminUserId && mongoose.isValidObjectId(adminUserId)) {
          s.manualAllocatedBy = new mongoose.Types.ObjectId(adminUserId);
        }
        s.manualAllocatedAt = new Date();
        await s.save();
        results.push({ submissionId: s._id, awardedClubPoints: targetPoints, delta: diff });
      }
    } else if (preset === 'ADD_BONUS_ALL' && bonusPoints > 0) {
      // Award flat bonus points to all participants who submitted
      const submissions = await ContestSubmission.find({ contestId: contest._id, status: 'SUBMITTED' });
      for (const s of submissions) {
        const currentAwarded = s.awardedClubPoints || 0;
        const targetPoints = currentAwarded + bonusPoints;
        const diff = bonusPoints;

        await User.findByIdAndUpdate(s.userId, { $inc: { points: diff } });

        s.awardedClubPoints = targetPoints;
        s.pointsAwarded = true;
        s.manualPointsAdjustment = (s.manualPointsAdjustment || 0) + diff;
        s.manualPointsReason = reason || `Bulk bonus (+${bonusPoints} pts)`;
        if (adminUserId && mongoose.isValidObjectId(adminUserId)) {
          s.manualAllocatedBy = new mongoose.Types.ObjectId(adminUserId);
        }
        s.manualAllocatedAt = new Date();
        await s.save();
        results.push({ submissionId: s._id, awardedClubPoints: targetPoints, delta: diff });
      }
    } else if (Array.isArray(allocations)) {
      // Granular per-submission allocation array
      for (const item of allocations) {
        const s = await ContestSubmission.findById(item.submissionId);
        if (!s) continue;

        const currentAwarded = s.awardedClubPoints || 0;
        const targetPoints = Math.max(0, Math.round(item.awardedClubPoints));
        const diff = targetPoints - currentAwarded;

        if (diff !== 0) {
          await User.findByIdAndUpdate(s.userId, { $inc: { points: diff } });
        }

        s.awardedClubPoints = targetPoints;
        s.pointsAwarded = targetPoints > 0;
        s.manualPointsAdjustment = (s.manualPointsAdjustment || 0) + diff;
        s.manualPointsReason = item.reason || reason || 'Admin bulk manual point allocation';
        if (adminUserId && mongoose.isValidObjectId(adminUserId)) {
          s.manualAllocatedBy = new mongoose.Types.ObjectId(adminUserId);
        }
        s.manualAllocatedAt = new Date();
        await s.save();
        results.push({ submissionId: s._id, awardedClubPoints: targetPoints, delta: diff });
      }
    }

    return reply.send({
      success: true,
      message: `Successfully processed point allocation for ${results.length} submissions.`,
      data: results,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to bulk allocate points' });
  }
};

// 13. Admin: Get Detailed Contest Submissions for Evaluation
export const getContestSubmissionsForAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };

    const contest = await Contest.findById(id).lean();
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const submissions = await ContestSubmission.find({ contestId: contest._id })
      .sort({ totalScore: -1, timeTakenSeconds: 1 })
      .populate('userId', 'name rollNo email profilePicUrl avatar department points')
      .populate('manualAllocatedBy', 'name email')
      .lean();

    return reply.send({
      success: true,
      contest: {
        _id: contest._id,
        title: contest.title,
        type: contest.type,
        totalPoints: contest.totalPoints,
        pointAllocationMode: contest.pointAllocationMode || 'AUTOMATIC',
      },
      count: submissions.length,
      data: submissions,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch contest submissions' });
  }
};
