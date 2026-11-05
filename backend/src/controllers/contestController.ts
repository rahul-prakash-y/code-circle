import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import Contest, { IContest } from '../models/contestModel';
import ContestSubmission from '../models/contestSubmissionModel';
import User from '../models/userModel';
import Notification from '../models/notificationModel';
import rceService from '../services/rceService';
import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';

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

/**
 * Enriches a contest submission with question prompts, options, correct answers,
 * and coding problem details so students and administrators can review full solutions.
 */
export function enrichSubmissionWithContestDetails(submission: any, contest: any) {
  if (!submission) return null;

  const mcqQuestions = contest?.mcqQuestions || [];
  const codingProblems = contest?.codingProblems || [];

  const mcqDetails = (submission.mcqAnswers || []).map((ans: any) => {
    const q = mcqQuestions.find(
      (item: any) => item._id?.toString() === ans.questionId?.toString()
    );
    const selectedIdx = typeof ans.selectedOption === 'number' ? ans.selectedOption : -1;
    const correctIdx = typeof q?.correctOptionIndex === 'number' ? q.correctOptionIndex : -1;
    return {
      questionId: ans.questionId,
      questionText: q?.question || 'Question prompt not found',
      options: q?.options || [],
      correctOptionIndex: correctIdx,
      selectedOption: selectedIdx,
      selectedOptionText:
        selectedIdx >= 0 && q?.options?.[selectedIdx]
          ? q.options[selectedIdx]
          : selectedIdx >= 0
          ? `Option ${selectedIdx}`
          : 'Not answered',
      correctOptionText: correctIdx >= 0 && q?.options?.[correctIdx] ? q.options[correctIdx] : '',
      isCorrect: ans.isCorrect ?? (selectedIdx >= 0 && selectedIdx === correctIdx),
      pointsEarned: ans.pointsEarned ?? 0,
      maxPoints: q?.points || 10,
      explanation: q?.explanation || '',
    };
  });

  const codingDetails = (submission.codingSubmissions || []).map((cs: any) => {
    const prob = codingProblems.find(
      (item: any) => item._id?.toString() === cs.problemId?.toString()
    );
    return {
      problemId: cs.problemId,
      problemTitle: prob?.title || 'Coding Problem',
      problemDifficulty: prob?.difficulty || 'Medium',
      problemDescription: prob?.description || '',
      maxPoints: prob?.points || 30,
      code: cs.code || '',
      language: cs.language || 'python',
      passedTestCases: cs.passedTestCases || 0,
      totalTestCases: cs.totalTestCases || 0,
      status: cs.status || 'PENDING',
      pointsEarned: cs.pointsEarned || 0,
      submittedAt: cs.submittedAt,
    };
  });

  return {
    ...submission,
    mcqAnswers: mcqDetails,
    codingSubmissions: codingDetails,
  };
}

// 1. Get All Contests (Split by Status) with Pagination & Batch Lookup
export const getContests = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = getUserId(req);
    const query = req.query as any;
    const now = new Date();

    const { page, limit, skip, sortBy, sortOrder } = parsePaginationParams(query, {
      defaultLimit: 20,
      maxLimit: 100,
      defaultSortBy: 'startTime',
      allowedSortFields: ['startTime', 'createdAt', 'title', 'totalPoints'],
    });

    const filter: any = { isPublished: true };
    if (query?.type && ['CODING', 'MCQ', 'HYBRID'].includes(query.type)) {
      filter.type = query.type;
    }
    if (query?.difficulty && ['Beginner', 'Intermediate', 'Advanced', 'All Levels'].includes(query.difficulty)) {
      filter.difficulty = query.difficulty;
    }
    if (query?.search && typeof query.search === 'string' && query.search.trim()) {
      filter.title = { $regex: query.search.trim(), $options: 'i' };
    }

    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    sortObj._id = -1;

    const [total, contests] = await Promise.all([
      Contest.countDocuments(filter),
      Contest.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Batch-fetch submissions for all contests in this page (eliminating N+1 queries)
    const contestIds = contests.map((c: any) => c._id);
    const submissionMap = new Map<string, any>();

    if (userId && contestIds.length > 0) {
      const userSubs = await ContestSubmission.find({
        contestId: { $in: contestIds },
        userId,
      })
        .select('contestId status totalScore startedAt submittedAt expiresAt timeTakenSeconds awardedClubPoints pointsAwarded')
        .lean();

      userSubs.forEach((sub: any) => {
        submissionMap.set(sub.contestId.toString(), sub);
      });
    }

    // Map dynamic status based on time
    const updatedContests = contests.map((c: any) => {
      let dynamicStatus = c.status;
      if (now < new Date(c.startTime)) {
        dynamicStatus = 'UPCOMING';
      } else if (now >= new Date(c.startTime) && now <= new Date(c.endTime)) {
        dynamicStatus = 'LIVE';
      } else {
        dynamicStatus = 'ENDED';
      }

      const mySubmission = submissionMap.get(c._id.toString()) || null;

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
    });

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      count: updatedContests.length,
      pagination,
      data: updatedContests,
    });
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
      if (mySubmission) {
        mySubmission = enrichSubmissionWithContestDetails(mySubmission, contest);
      }
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

    const now = new Date();
    if (now > new Date(contest.endTime)) {
      return reply.status(400).send({ success: false, error: 'This contest has already ended.' });
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
    const contestTargetPoints =
      typeof contest.totalPoints === 'number' && contest.totalPoints > 0 ? contest.totalPoints : 100;
    const maxQuestionsPoints =
      (contest.mcqQuestions || []).reduce((acc: number, q: any) => acc + (q.points || 0), 0) +
      (contest.codingProblems || []).reduce((acc: number, p: any) => acc + (p.points || 0), 0);

    let awardedClubPoints = 0;
    let pointsAwarded = false;

    if (pointMode === 'MANUAL') {
      // Submissions recorded, points will be allocated manually by instructors/admins
      awardedClubPoints = 0;
      pointsAwarded = false;
    } else {
      // AUTOMATIC or HYBRID: base points automatically credited
      // If questions point sum differs from contest target totalPoints, scale proportionally
      if (maxQuestionsPoints > 0 && maxQuestionsPoints !== contestTargetPoints) {
        awardedClubPoints = Math.round((totalScore / maxQuestionsPoints) * contestTargetPoints);
      } else {
        awardedClubPoints = Math.round(totalScore);
      }

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

// 7. Get Contest Leaderboard (Paginated with Global Ranks)
export const getContestLeaderboard = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const query = req.query as any;

    const contest = await Contest.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { slug: id.toLowerCase() }],
    }).lean();

    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const { page, limit, skip } = parsePaginationParams(query, {
      defaultLimit: 50,
      maxLimit: 100,
      defaultSortBy: 'totalScore',
      allowedSortFields: ['totalScore', 'timeTakenSeconds', 'submittedAt'],
    });

    const [total, submissions] = await Promise.all([
      ContestSubmission.countDocuments({ contestId: contest._id }),
      ContestSubmission.find({ contestId: contest._id })
        .sort({ totalScore: -1, timeTakenSeconds: 1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name rollNo email profilePicUrl avatar department points')
        .lean(),
    ]);

    const leaderboard = submissions.map((s: any, idx: number) => ({
      rank: skip + idx + 1,
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

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      contestTitle: contest.title,
      pointAllocationMode: contest.pointAllocationMode || 'AUTOMATIC',
      totalParticipants: total,
      pagination,
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

    // Compute totalPoints: respect admin specified points if > 0
    let totalPoints = typeof body.totalPoints === 'number' && body.totalPoints > 0 ? Number(body.totalPoints) : 0;
    if (!totalPoints) {
      const mcqPts = (body.mcqQuestions || []).reduce((acc: number, q: any) => acc + (Number(q.points) || 10), 0);
      const codingPts = (body.codingProblems || []).reduce((acc: number, p: any) => acc + (Number(p.points) || 30), 0);
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

    if (body.totalPoints !== undefined) {
      body.totalPoints = Math.max(1, Number(body.totalPoints));
    }

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

// 13. Admin: Get Detailed Contest Submissions for Evaluation (Paginated)
export const getContestSubmissionsForAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const query = req.query as any;

    const contest = await Contest.findById(id).lean();
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const { page, limit, skip, sortBy, sortOrder } = parsePaginationParams(query, {
      defaultLimit: 20,
      maxLimit: 100,
      defaultSortBy: 'totalScore',
      allowedSortFields: ['totalScore', 'timeTakenSeconds', 'submittedAt', 'createdAt'],
    });

    const filter: any = { contestId: contest._id };

    if (query?.filterMode === 'REENTRY_REQUESTS') {
      filter.reentryStatus = 'PENDING';
    } else if (query?.filterMode === 'ALLOCATED') {
      filter.pointsAwarded = true;
      filter.awardedClubPoints = { $gt: 0 };
    } else if (query?.filterMode === 'PENDING') {
      filter.$or = [{ pointsAwarded: false }, { awardedClubPoints: 0 }];
    }

    if (query?.search && typeof query.search === 'string' && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      const matchingUsers = await User.find({
        $or: [
          { name: searchRegex },
          { rollNo: searchRegex },
          { email: searchRegex },
        ],
      })
        .select('_id')
        .lean();
      filter.userId = { $in: matchingUsers.map((u) => u._id) };
    }

    const sortObj: any = {};
    if (sortBy === 'totalScore') {
      sortObj.totalScore = sortOrder === 'asc' ? 1 : -1;
      sortObj.timeTakenSeconds = 1;
    } else {
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }
    sortObj._id = 1;

    const [total, submissions] = await Promise.all([
      ContestSubmission.countDocuments(filter),
      ContestSubmission.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name rollNo email profilePicUrl avatar department points')
        .populate('manualAllocatedBy', 'name email')
        .populate('reentryApprovedBy', 'name email')
        .lean(),
    ]);

    // Enrich only the current page of submissions (drastic performance & memory saving)
    const enrichedSubmissions = submissions.map((s: any) =>
      enrichSubmissionWithContestDetails(s, contest)
    );

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      contest: {
        _id: contest._id,
        title: contest.title,
        type: contest.type,
        difficulty: contest.difficulty,
        totalPoints: contest.totalPoints,
        pointAllocationMode: contest.pointAllocationMode || 'AUTOMATIC',
        mcqCount: contest.mcqQuestions?.length || 0,
        codingCount: contest.codingProblems?.length || 0,
      },
      count: enrichedSubmissions.length,
      pagination,
      data: enrichedSubmissions,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch contest submissions' });
  }
};

// 13b. Admin: Get Single Student Contest Submission with Detailed Review
export const getSingleContestSubmissionForAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id, submissionId } = req.params as { id: string; submissionId: string };

    const contest = await Contest.findById(id).lean();
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const submission = await ContestSubmission.findById(submissionId)
      .populate('userId', 'name rollNo email profilePicUrl avatar department points')
      .populate('manualAllocatedBy', 'name email')
      .populate('reentryApprovedBy', 'name email')
      .lean();

    if (!submission) {
      return reply.status(404).send({ success: false, error: 'Contest submission not found' });
    }

    const enriched = enrichSubmissionWithContestDetails(submission, contest);

    return reply.send({
      success: true,
      contest: {
        _id: contest._id,
        title: contest.title,
        type: contest.type,
        difficulty: contest.difficulty,
        totalPoints: contest.totalPoints,
        durationMinutes: contest.durationMinutes,
      },
      data: enriched,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch contest submission details' });
  }
};

// 13c. Student: Get My Contest Submission with MCQ & Coding Breakdown
export const getMyContestSubmission = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const userId = getUserId(req);

    const contest = await Contest.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { slug: id.toLowerCase() }],
    }).lean();

    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const submission = await ContestSubmission.findOne({ contestId: contest._id, userId })
      .populate('userId', 'name rollNo email profilePicUrl avatar department points')
      .populate('manualAllocatedBy', 'name email')
      .lean();

    if (!submission) {
      return reply.status(404).send({ success: false, error: 'No submission found for this contest' });
    }

    const enriched = enrichSubmissionWithContestDetails(submission, contest);

    return reply.send({
      success: true,
      contest: {
        _id: contest._id,
        title: contest.title,
        type: contest.type,
        difficulty: contest.difficulty,
        totalPoints: contest.totalPoints,
        durationMinutes: contest.durationMinutes,
        status: contest.status,
      },
      data: enriched,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch your contest submission' });
  }
};

// 14. Admin: Download Sample Excel Template for Contest MCQ Questions
export const downloadContestMcqTemplate = async (_req: FastifyRequest, reply: FastifyReply) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Sample MCQ Questions
  const sampleData = [
    {
      'Question': 'What is the time complexity of searching in a balanced Binary Search Tree?',
      'OptionA': 'O(1)',
      'OptionB': 'O(n)',
      'OptionC': 'O(log n)',
      'OptionD': 'O(n log n)',
      'CorrectOption': 'C',
      'Points': 10,
      'Explanation': 'In a balanced BST, tree height is log2(n), giving O(log n) search operations.',
    },
    {
      'Question': 'Which data structure follows the First-In-First-Out (FIFO) principle?',
      'OptionA': 'Stack',
      'OptionB': 'Queue',
      'OptionC': 'Priority Queue',
      'OptionD': 'Binary Heap',
      'CorrectOption': 'B',
      'Points': 10,
      'Explanation': 'Queues process elements strictly in FIFO order.',
    },
    {
      'Question': 'What is the space complexity of an iterative binary search algorithm?',
      'OptionA': 'O(1)',
      'OptionB': 'O(log n)',
      'OptionC': 'O(n)',
      'OptionD': 'O(n^2)',
      'CorrectOption': 'A',
      'Points': 10,
      'Explanation': 'Iterative binary search uses constant additional memory.',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(wb, ws, 'MCQ Questions');

  // Sheet 2: Instructions
  const instructions = [
    { 'Column': 'Question', 'Required': 'YES', 'Description': 'The full text of the multiple choice question statement.' },
    { 'Column': 'OptionA', 'Required': 'YES', 'Description': 'Choice A text.' },
    { 'Column': 'OptionB', 'Required': 'YES', 'Description': 'Choice B text.' },
    { 'Column': 'OptionC', 'Required': 'NO', 'Description': 'Choice C text (optional if only 2 choices).' },
    { 'Column': 'OptionD', 'Required': 'NO', 'Description': 'Choice D text (optional).' },
    { 'Column': 'CorrectOption', 'Required': 'YES', 'Description': 'Correct answer key: A, B, C, D (or 1, 2, 3, 4, or exact option text).' },
    { 'Column': 'Points', 'Required': 'NO', 'Description': 'Points awarded for answering correctly (default: 10).' },
    { 'Column': 'Explanation', 'Required': 'NO', 'Description': 'Explanation shown to students in review after submission.' },
  ];
  const wsInstr = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return reply
    .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .header('Content-Disposition', 'attachment; filename="contest_mcq_sample_template.xlsx"')
    .send(buffer);
};

// 15. Admin: Download Sample Excel Template for Contest Coding Challenges
export const downloadContestCodingTemplate = async (_req: FastifyRequest, reply: FastifyReply) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Sample Coding Challenges
  const sampleData = [
    {
      'Title': 'Two Sum Variant',
      'Description': 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Output indices space-separated on a single line.',
      'Difficulty': 'Easy',
      'Points': 30,
      'AllowedLanguages': 'python, javascript, cpp, java, c',
      'InputFormat': 'First line contains integer N. Second line contains N integers. Third line contains target integer.',
      'OutputFormat': 'Output two space-separated 0-based indices.',
      'Constraints': '2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9',
      'SampleInput': '4\n2 7 11 15\n9',
      'SampleOutput': '0 1',
      'StarterCode_Python': '# Write your Python code here\n',
      'StarterCode_JavaScript': '// Write your JavaScript code here\n',
      'StarterCode_Cpp': '#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n',
      'StarterCode_Java': 'import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n    }\n}\n',
      'StarterCode_C': '#include <stdio.h>\n\nint main() {\n    return 0;\n}\n',
      'TestCase1_Input': '4\n2 7 11 15\n9',
      'TestCase1_ExpectedOutput': '0 1',
      'TestCase1_IsHidden': 'FALSE',
      'TestCase2_Input': '3\n3 2 4\n6',
      'TestCase2_ExpectedOutput': '1 2',
      'TestCase2_IsHidden': 'FALSE',
      'TestCase3_Input': '2\n3 3\n6',
      'TestCase3_ExpectedOutput': '0 1',
      'TestCase3_IsHidden': 'TRUE',
    },
    {
      'Title': 'Valid Palindrome',
      'Description': 'Determine if a given string is a palindrome considering only alphanumeric characters and ignoring cases. Output "true" or "false".',
      'Difficulty': 'Medium',
      'Points': 40,
      'AllowedLanguages': 'python, javascript, cpp, java, c',
      'InputFormat': 'A single line containing string S.',
      'OutputFormat': 'Output "true" if palindrome, else "false".',
      'Constraints': '1 <= S.length <= 2 * 10^5',
      'SampleInput': 'A man, a plan, a canal: Panama',
      'SampleOutput': 'true',
      'StarterCode_Python': '# Write your Python code here\n',
      'StarterCode_JavaScript': '// Write your JavaScript code here\n',
      'TestCase1_Input': 'A man, a plan, a canal: Panama',
      'TestCase1_ExpectedOutput': 'true',
      'TestCase1_IsHidden': 'FALSE',
      'TestCase2_Input': 'race a car',
      'TestCase2_ExpectedOutput': 'false',
      'TestCase2_IsHidden': 'TRUE',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(wb, ws, 'Coding Challenges');

  // Sheet 2: Instructions
  const instructions = [
    { 'Column': 'Title', 'Required': 'YES', 'Description': 'Problem headline/title.' },
    { 'Column': 'Description', 'Required': 'YES', 'Description': 'Full problem statement, objective and explanation.' },
    { 'Column': 'Difficulty', 'Required': 'NO', 'Description': 'Easy, Medium, or Hard (defaults to Medium).' },
    { 'Column': 'Points', 'Required': 'NO', 'Description': 'Points awarded for completing this challenge (defaults to 30).' },
    { 'Column': 'AllowedLanguages', 'Required': 'NO', 'Description': 'Comma-separated: python, javascript, cpp, java, c.' },
    { 'Column': 'InputFormat', 'Required': 'NO', 'Description': 'Input structure specification.' },
    { 'Column': 'OutputFormat', 'Required': 'NO', 'Description': 'Output structure specification.' },
    { 'Column': 'Constraints', 'Required': 'NO', 'Description': 'Time, space, and value bounds.' },
    { 'Column': 'SampleInput', 'Required': 'NO', 'Description': 'Example public input.' },
    { 'Column': 'SampleOutput', 'Required': 'NO', 'Description': 'Example public output.' },
    { 'Column': 'StarterCode_<Lang>', 'Required': 'NO', 'Description': 'Starter boilerplate for Python, JavaScript, Cpp, Java, C.' },
    { 'Column': 'TestCase{N}_Input', 'Required': 'YES (>= 1)', 'Description': 'Input data for test case N.' },
    { 'Column': 'TestCase{N}_ExpectedOutput', 'Required': 'YES (>= 1)', 'Description': 'Expected stdout for test case N.' },
    { 'Column': 'TestCase{N}_IsHidden', 'Required': 'NO', 'Description': 'TRUE for hidden anti-cheat grading test case, FALSE for public.' },
  ];
  const wsInstr = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return reply
    .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .header('Content-Disposition', 'attachment; filename="contest_coding_sample_template.xlsx"')
    .send(buffer);
};

// 16. Admin: Parse Uploaded Contest MCQ Questions (Excel or JSON)
export const parseContestMcqUpload = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    let fileBuffer: Buffer | null = null;
    let filename = '';

    // Check multipart file
    let fileData: any = null;
    try {
      fileData = await req.file();
    } catch (err: any) {
      // Ignore if not multipart
    }

    if (fileData) {
      filename = (fileData.filename || '').toLowerCase();
      const chunks: Buffer[] = [];
      for await (const chunk of fileData.file) {
        chunks.push(chunk);
      }
      fileBuffer = Buffer.concat(chunks);
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      // Check if sent in request body as JSON array
      const body = req.body as any;
      if (Array.isArray(body?.questions)) {
        return reply.send({
          success: true,
          count: body.questions.length,
          data: body.questions,
          errors: [],
        });
      }
      return reply.status(400).send({ success: false, error: 'No Excel or JSON file uploaded' });
    }

    const errors: string[] = [];
    const parsedQuestions: any[] = [];

    if (filename.endsWith('.json')) {
      try {
        const jsonContent = JSON.parse(fileBuffer.toString('utf-8'));
        const list = Array.isArray(jsonContent) ? jsonContent : jsonContent.questions || [];
        for (let i = 0; i < list.length; i++) {
          const item = list[i];
          if (!item.question || !Array.isArray(item.options) || item.options.length < 2) {
            errors.push(`Question #${i + 1} is missing valid question statement or at least 2 options.`);
            continue;
          }
          parsedQuestions.push({
            question: String(item.question).trim(),
            options: item.options.map((o: any) => String(o).trim()),
            correctOptionIndex: typeof item.correctOptionIndex === 'number' ? item.correctOptionIndex : 0,
            points: Number(item.points) > 0 ? Number(item.points) : 10,
            explanation: String(item.explanation || '').trim(),
          });
        }
      } catch (jsonErr: any) {
        return reply.status(400).send({ success: false, error: 'Invalid JSON file format: ' + jsonErr.message });
      }
    } else {
      // Parse with XLSX
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName =
        workbook.SheetNames.find(
          (s) =>
            s.toLowerCase().includes('mcq') ||
            s.toLowerCase().includes('question') ||
            s.toLowerCase().includes('contest')
        ) ||
        workbook.SheetNames.find((s) => !s.toLowerCase().includes('instruct')) ||
        workbook.SheetNames[0];

      if (!sheetName) {
        return reply.status(400).send({ success: false, error: 'Workbook contains no valid worksheets' });
      }

      const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
      if (!rows.length) {
        return reply.status(400).send({ success: false, error: 'The uploaded sheet contains no question rows' });
      }

      const getRowValue = (row: any, ...keys: string[]) => {
        for (const k of keys) {
          const direct = row[k];
          if (direct !== undefined && direct !== null && String(direct).trim() !== '') {
            return String(direct).trim();
          }
          const lowerKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const rowKey of Object.keys(row)) {
            if (rowKey.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerKey) {
              const val = row[rowKey];
              if (val !== undefined && val !== null && String(val).trim() !== '') {
                return String(val).trim();
              }
            }
          }
        }
        return '';
      };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;

        const question = getRowValue(row, 'Question', 'QuestionText', 'Statement', 'Title');
        if (!question) {
          // Skip completely empty spacer rows
          const hasAny = Object.values(row).some((v) => String(v).trim());
          if (hasAny) {
            errors.push(`Row #${rowNum}: Question statement is missing.`);
          }
          continue;
        }

        const optA = getRowValue(row, 'OptionA', 'Option1', 'ChoiceA', 'A');
        const optB = getRowValue(row, 'OptionB', 'Option2', 'ChoiceB', 'B');
        const optC = getRowValue(row, 'OptionC', 'Option3', 'ChoiceC', 'C');
        const optD = getRowValue(row, 'OptionD', 'Option4', 'ChoiceD', 'D');

        const rawOptions = [optA, optB, optC, optD].filter((opt) => opt !== '');
        if (rawOptions.length < 2) {
          errors.push(`Row #${rowNum} ("${question.slice(0, 30)}..."): Must have at least 2 valid options.`);
          continue;
        }

        const rawCorrect = getRowValue(row, 'CorrectOption', 'CorrectAnswer', 'Answer', 'Key');
        let correctOptionIndex = 0;
        const normalized = rawCorrect.toUpperCase();

        if (normalized === 'A' || normalized === '1' || normalized === '0') {
          correctOptionIndex = 0;
        } else if (normalized === 'B' || normalized === '2') {
          correctOptionIndex = 1;
        } else if (normalized === 'C' || normalized === '3') {
          correctOptionIndex = 2;
        } else if (normalized === 'D' || normalized === '4') {
          correctOptionIndex = 3;
        } else {
          // Direct text match
          const foundIdx = rawOptions.findIndex((o) => o.toLowerCase() === rawCorrect.toLowerCase());
          if (foundIdx >= 0) {
            correctOptionIndex = foundIdx;
          } else {
            const numVal = parseInt(rawCorrect, 10);
            if (!isNaN(numVal) && numVal >= 1 && numVal <= rawOptions.length) {
              correctOptionIndex = numVal - 1;
            } else if (!isNaN(numVal) && numVal >= 0 && numVal < rawOptions.length) {
              correctOptionIndex = numVal;
            }
          }
        }

        if (correctOptionIndex < 0 || correctOptionIndex >= rawOptions.length) {
          correctOptionIndex = 0;
        }

        const points = Math.max(1, parseInt(getRowValue(row, 'Points', 'Score', 'Marks'), 10) || 10);
        const explanation = getRowValue(row, 'Explanation', 'Reason', 'Description');

        parsedQuestions.push({
          question,
          options: rawOptions,
          correctOptionIndex,
          points,
          explanation,
        });
      }
    }

    if (parsedQuestions.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'No valid MCQ questions could be parsed from the file.',
        errors,
      });
    }

    return reply.send({
      success: true,
      count: parsedQuestions.length,
      data: parsedQuestions,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to parse MCQ file: ' + error.message });
  }
};

// 17. Admin: Parse Uploaded Contest Coding Challenges (Excel or JSON)
export const parseContestCodingUpload = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    let fileBuffer: Buffer | null = null;
    let filename = '';

    let fileData: any = null;
    try {
      fileData = await req.file();
    } catch (err: any) {
      // Ignore if not multipart
    }

    if (fileData) {
      filename = (fileData.filename || '').toLowerCase();
      const chunks: Buffer[] = [];
      for await (const chunk of fileData.file) {
        chunks.push(chunk);
      }
      fileBuffer = Buffer.concat(chunks);
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      const body = req.body as any;
      if (Array.isArray(body?.problems)) {
        return reply.send({
          success: true,
          count: body.problems.length,
          data: body.problems,
          errors: [],
        });
      }
      return reply.status(400).send({ success: false, error: 'No Excel or JSON file uploaded' });
    }

    const errors: string[] = [];
    const parsedProblems: any[] = [];

    const defaultStarterCode = {
      python: '# Write your code here\n',
      javascript: '// Write your code here\n',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n',
      java: 'import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}\n',
      c: '#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}\n',
    };

    if (filename.endsWith('.json')) {
      try {
        const jsonContent = JSON.parse(fileBuffer.toString('utf-8'));
        const list = Array.isArray(jsonContent) ? jsonContent : jsonContent.problems || [];
        for (let i = 0; i < list.length; i++) {
          const item = list[i];
          if (!item.title || !item.description) {
            errors.push(`Problem #${i + 1} is missing title or description.`);
            continue;
          }
          const testCases = Array.isArray(item.testCases) ? item.testCases : [];
          if (testCases.length === 0 && (item.sampleInput || item.sampleOutput)) {
            testCases.push({ input: item.sampleInput || '', expectedOutput: item.sampleOutput || '', isHidden: false });
          }
          parsedProblems.push({
            title: String(item.title).trim(),
            description: String(item.description).trim(),
            difficulty: ['Easy', 'Medium', 'Hard'].includes(item.difficulty) ? item.difficulty : 'Medium',
            points: Number(item.points) > 0 ? Number(item.points) : 30,
            allowedLanguages: Array.isArray(item.allowedLanguages) && item.allowedLanguages.length > 0
              ? item.allowedLanguages
              : ['python', 'javascript', 'cpp', 'java', 'c'],
            starterCode: item.starterCode || defaultStarterCode,
            inputFormat: String(item.inputFormat || '').trim(),
            outputFormat: String(item.outputFormat || '').trim(),
            constraints: String(item.constraints || '').trim(),
            sampleInput: String(item.sampleInput || '').trim(),
            sampleOutput: String(item.sampleOutput || '').trim(),
            testCases: testCases.map((tc: any) => ({
              input: String(tc.input ?? ''),
              expectedOutput: String(tc.expectedOutput ?? ''),
              isHidden: Boolean(tc.isHidden),
            })),
          });
        }
      } catch (jsonErr: any) {
        return reply.status(400).send({ success: false, error: 'Invalid JSON file: ' + jsonErr.message });
      }
    } else {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName =
        workbook.SheetNames.find(
          (s) =>
            s.toLowerCase().includes('coding') ||
            s.toLowerCase().includes('problem') ||
            s.toLowerCase().includes('challenge')
        ) ||
        workbook.SheetNames.find((s) => !s.toLowerCase().includes('instruct')) ||
        workbook.SheetNames[0];

      if (!sheetName) {
        return reply.status(400).send({ success: false, error: 'Workbook contains no valid worksheets' });
      }

      const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
      if (!rows.length) {
        return reply.status(400).send({ success: false, error: 'The uploaded sheet contains no problem rows' });
      }

      const getRowValue = (row: any, ...keys: string[]) => {
        for (const k of keys) {
          const direct = row[k];
          if (direct !== undefined && direct !== null && String(direct).trim() !== '') {
            return String(direct).trim();
          }
          const lowerKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const rowKey of Object.keys(row)) {
            if (rowKey.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerKey) {
              const val = row[rowKey];
              if (val !== undefined && val !== null && String(val).trim() !== '') {
                return String(val).trim();
              }
            }
          }
        }
        return '';
      };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;

        const title = getRowValue(row, 'Title', 'ProblemTitle', 'Name');
        const description = getRowValue(row, 'Description', 'Statement', 'ProblemDescription');

        if (!title && !description) {
          continue; // Empty spacer row
        }

        if (!title) {
          errors.push(`Row #${rowNum}: Problem title is required.`);
          continue;
        }

        if (!description) {
          errors.push(`Row #${rowNum} ("${title}"): Problem description is required.`);
          continue;
        }

        const rawDiff = getRowValue(row, 'Difficulty', 'Level');
        let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
        if (rawDiff.toLowerCase().includes('easy')) difficulty = 'Easy';
        else if (rawDiff.toLowerCase().includes('hard')) difficulty = 'Hard';

        const points = Math.max(1, parseInt(getRowValue(row, 'Points', 'CustomPoints', 'Score'), 10) || 30);

        const rawLangs = getRowValue(row, 'AllowedLanguages', 'Languages');
        const allowedLanguages = rawLangs
          ? rawLangs
              .toLowerCase()
              .split(/[,|\s]+/)
              .map((l) => l.trim())
              .filter(Boolean)
          : ['python', 'javascript', 'cpp', 'java', 'c'];

        const inputFormat = getRowValue(row, 'InputFormat', 'Input Format');
        const outputFormat = getRowValue(row, 'OutputFormat', 'Output Format');
        const constraints = getRowValue(row, 'Constraints');
        const sampleInput = getRowValue(row, 'SampleInput', 'Sample Input');
        const sampleOutput = getRowValue(row, 'SampleOutput', 'Sample Output');

        const starterCode = {
          python: getRowValue(row, 'StarterCode_Python', 'StarterCode_python') || defaultStarterCode.python,
          javascript: getRowValue(row, 'StarterCode_JavaScript', 'StarterCode_javascript') || defaultStarterCode.javascript,
          cpp: getRowValue(row, 'StarterCode_Cpp', 'StarterCode_cpp') || defaultStarterCode.cpp,
          java: getRowValue(row, 'StarterCode_Java', 'StarterCode_java') || defaultStarterCode.java,
          c: getRowValue(row, 'StarterCode_C', 'StarterCode_c') || defaultStarterCode.c,
        };

        // Extract test cases up to 20
        const testCases: any[] = [];
        for (let tcIdx = 1; tcIdx <= 20; tcIdx++) {
          const input = getRowValue(row, `TestCase${tcIdx}_Input`, `TC${tcIdx}_Input`);
          const expectedOutput = getRowValue(row, `TestCase${tcIdx}_ExpectedOutput`, `TC${tcIdx}_ExpectedOutput`, `TestCase${tcIdx}_Output`);
          const rawHidden = getRowValue(row, `TestCase${tcIdx}_IsHidden`, `TC${tcIdx}_IsHidden`, `TestCase${tcIdx}_Hidden`);

          if (expectedOutput) {
            testCases.push({
              input,
              expectedOutput,
              isHidden: rawHidden.toUpperCase() === 'TRUE' || rawHidden === '1',
            });
          }
        }

        // Fallback: If no explicit test cases column, check if SampleInput/SampleOutput provided
        if (testCases.length === 0) {
          if (sampleInput || sampleOutput) {
            testCases.push({
              input: sampleInput || '',
              expectedOutput: sampleOutput || '',
              isHidden: false,
            });
            testCases.push({
              input: sampleInput || '',
              expectedOutput: sampleOutput || '',
              isHidden: true,
            });
          } else {
            errors.push(`Row #${rowNum} ("${title}"): No test cases or sample output found. At least 1 test case with Expected Output is required.`);
            continue;
          }
        }

        parsedProblems.push({
          title,
          description,
          difficulty,
          points,
          allowedLanguages,
          starterCode,
          inputFormat,
          outputFormat,
          constraints,
          sampleInput,
          sampleOutput,
          testCases,
        });
      }
    }

    if (parsedProblems.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'No valid coding challenges could be parsed from the file.',
        errors,
      });
    }

    return reply.send({
      success: true,
      count: parsedProblems.length,
      data: parsedProblems,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to parse coding file: ' + error.message });
  }
};

// 18. Student: Request Re-entry to Contest
export const requestContestReentry = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const userId = getUserId(req);
    const { reason = '' } = (req.body || {}) as { reason?: string };

    const contest = await Contest.findById(id);
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const submission = await ContestSubmission.findOne({ contestId: contest._id, userId });
    if (!submission) {
      return reply.status(400).send({
        success: false,
        error: 'No active or past contest session found to request re-entry for.',
      });
    }

    if (submission.reentryStatus === 'PENDING') {
      return reply.status(400).send({
        success: false,
        error: 'A re-entry request is already pending review by an administrator.',
        submission,
      });
    }

    submission.reentryRequested = true;
    submission.reentryReason = reason.trim() || 'Student requested re-entry to contest';
    submission.reentryStatus = 'PENDING';
    submission.reentryRequestedAt = new Date();

    await submission.save();

    return reply.send({
      success: true,
      message: 'Re-entry request submitted successfully. An administrator will review your request.',
      submission,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to request contest re-entry' });
  }
};

// 19. Admin: Approve Contest Re-entry
export const approveContestReentry = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id, submissionId } = req.params as { id: string; submissionId: string };
    const adminUserId = getUserId(req);
    const { durationMinutes, note = '' } = (req.body || {}) as {
      durationMinutes?: number;
      note?: string;
    };

    const contest = await Contest.findById(id);
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const submission = await ContestSubmission.findById(submissionId);
    if (!submission || submission.contestId.toString() !== contest._id.toString()) {
      return reply.status(404).send({ success: false, error: 'Contest submission not found' });
    }

    // Revert awarded points if points were already credited to prevent double allocation
    if (submission.pointsAwarded && (submission.awardedClubPoints || 0) > 0) {
      const pointsToDeduct = submission.awardedClubPoints;
      await User.findByIdAndUpdate(submission.userId, { $inc: { points: -pointsToDeduct } });
      submission.pointsAwarded = false;
      submission.awardedClubPoints = 0;
      submission.manualPointsAdjustment = (submission.manualPointsAdjustment || 0) - pointsToDeduct;
    }

    // Determine additional duration
    const additionalMins =
      typeof durationMinutes === 'number' && durationMinutes > 0
        ? durationMinutes
        : contest.durationMinutes || 60;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + additionalMins * 60000);

    submission.status = 'IN_PROGRESS';
    submission.submittedAt = null as any;
    submission.expiresAt = expiresAt;
    submission.reentryRequested = false;
    submission.reentryStatus = 'APPROVED';
    submission.reentryApprovedAt = now;
    if (adminUserId && mongoose.isValidObjectId(adminUserId)) {
      submission.reentryApprovedBy = new mongoose.Types.ObjectId(adminUserId);
    }
    submission.reentryReviewNote = note.trim() || 'Admin approved re-entry';
    submission.reentryCount = (submission.reentryCount || 0) + 1;

    await submission.save();

    // Check student account and remove 'contests' restriction if restricted
    const studentUser = await User.findById(submission.userId);
    if (studentUser) {
      if (studentUser.restrictedFeatures && studentUser.restrictedFeatures.includes('contests')) {
        const remainingFeatures = studentUser.restrictedFeatures.filter((f: string) => f !== 'contests');
        studentUser.restrictedFeatures = remainingFeatures as any;
        if (remainingFeatures.length === 0) {
          studentUser.isRestricted = false;
          studentUser.restrictionReason = '';
        }
        await studentUser.save();
      }
    }

    // Notify student
    try {
      if (adminUserId && mongoose.isValidObjectId(adminUserId)) {
        await Notification.create({
          title: 'Contest Re-entry Approved! 🚀',
          message: `Your re-entry for contest "${contest.title}" has been approved! You have ${additionalMins} minutes to complete your session.`,
          type: 'success',
          targetRole: 'Student',
          link: `/contests/${contest._id}/arena`,
          createdBy: new mongoose.Types.ObjectId(adminUserId),
        });
      }
    } catch (notifErr) {
      req.log.warn(notifErr, 'Failed to create notification for contest re-entry approval');
    }

    return reply.send({
      success: true,
      message: `Re-entry approved! Student granted ${additionalMins} minutes to resume contest.`,
      submission,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to approve contest re-entry' });
  }
};

// 20. Admin: Reject Contest Re-entry
export const rejectContestReentry = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id, submissionId } = req.params as { id: string; submissionId: string };
    const adminUserId = getUserId(req);
    const { note = '' } = (req.body || {}) as { note?: string };

    const contest = await Contest.findById(id);
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const submission = await ContestSubmission.findById(submissionId);
    if (!submission || submission.contestId.toString() !== contest._id.toString()) {
      return reply.status(404).send({ success: false, error: 'Contest submission not found' });
    }

    submission.reentryRequested = false;
    submission.reentryStatus = 'REJECTED';
    submission.reentryReviewNote = note.trim() || 'Re-entry request declined by administrator';
    submission.reentryApprovedAt = new Date();
    if (adminUserId && mongoose.isValidObjectId(adminUserId)) {
      submission.reentryApprovedBy = new mongoose.Types.ObjectId(adminUserId);
    }

    await submission.save();

    try {
      if (adminUserId && mongoose.isValidObjectId(adminUserId)) {
        await Notification.create({
          title: 'Contest Re-entry Declined',
          message: `Your re-entry request for contest "${contest.title}" was declined. Note: ${submission.reentryReviewNote}`,
          type: 'warning',
          targetRole: 'Student',
          link: `/contests/${contest._id}`,
          createdBy: new mongoose.Types.ObjectId(adminUserId),
        });
      }
    } catch (notifErr) {
      req.log.warn(notifErr, 'Failed to create notification for contest re-entry decline');
    }

    return reply.send({
      success: true,
      message: 'Re-entry request has been rejected.',
      submission,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to reject contest re-entry' });
  }
};

// 21. Admin: Delete Student Contest Submission / Participation Entry
export const deleteContestSubmission = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id, submissionId } = req.params as { id: string; submissionId: string };

    const contest = await Contest.findById(id);
    if (!contest) {
      return reply.status(404).send({ success: false, error: 'Contest not found' });
    }

    const submission = await ContestSubmission.findById(submissionId);
    if (!submission || submission.contestId.toString() !== contest._id.toString()) {
      return reply.status(404).send({ success: false, error: 'Contest submission not found' });
    }

    // Revert awarded points if any
    if (submission.pointsAwarded && (submission.awardedClubPoints || 0) > 0) {
      await User.findByIdAndUpdate(submission.userId, {
        $inc: { points: -submission.awardedClubPoints },
      });
    }

    // Remove contest restriction if student was restricted from contests
    const studentUser = await User.findById(submission.userId);
    if (studentUser && studentUser.restrictedFeatures && studentUser.restrictedFeatures.includes('contests')) {
      const remainingFeatures = studentUser.restrictedFeatures.filter((f: string) => f !== 'contests');
      studentUser.restrictedFeatures = remainingFeatures as any;
      if (remainingFeatures.length === 0) {
        studentUser.isRestricted = false;
        studentUser.restrictionReason = '';
      }
      await studentUser.save();
    }

    // Decrement contest participants count
    if ((contest.participantsCount || 0) > 0) {
      await Contest.findByIdAndUpdate(contest._id, { $inc: { participantsCount: -1 } });
    }

    // Delete submission
    await ContestSubmission.findByIdAndDelete(submissionId);

    return reply.send({
      success: true,
      message: 'Student contest submission successfully deleted and entry removed.',
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to delete contest submission' });
  }
};


