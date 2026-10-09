import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import CodingChallenge, {
  ICodingChallenge,
  ITestCase,
  SupportedLanguage,
} from '../models/codingChallengeModel';
import CodingSubmission from '../models/codingSubmissionModel';
import Level, { getDefaultPointsForLevel } from '../models/levelModel';
import LevelAssessmentSession from '../models/levelAssessmentSessionModel';
import User from '../models/userModel';
import StudentProgress from '../models/studentProgressModel';
import DomainEnrollment from '../models/domainEnrollmentModel';
import rceService from '../services/rceService';
import { ApiError } from '../utils/ApiError';
import * as XLSX from 'xlsx';

// Maximum public test cases to execute on Run Code
const MAX_PUBLIC_TESTCASES_PER_REQUEST = 10;
// Maximum total test cases to execute on Submit
const MAX_TOTAL_TESTCASES_PER_REQUEST = 25;

// In-memory sliding rate limiter per user ID
interface RateLimitRecord {
  lastExecutionTime: number;
  recentTimestamps: number[];
}

const userRateLimits = new Map<string, RateLimitRecord>();

function checkExecutionRateLimit(userId: string) {
  const now = Date.now();
  const record = userRateLimits.get(userId) || { lastExecutionTime: 0, recentTimestamps: [] };

  // Enforce minimum 2 seconds between runs
  if (now - record.lastExecutionTime < 2000) {
    throw ApiError.badRequest('Rate limit exceeded. Please wait at least 2 seconds between executions.');
  }

  // Sliding window: max 20 requests per 2 minutes
  const windowMs = 2 * 60 * 1000;
  record.recentTimestamps = record.recentTimestamps.filter((t) => now - t < windowMs);

  if (record.recentTimestamps.length >= 20) {
    throw ApiError.badRequest('Execution quota reached. Please wait a minute before running code again.');
  }

  record.lastExecutionTime = now;
  record.recentTimestamps.push(now);
  userRateLimits.set(userId, record);
}

/**
 * Normalize stdout and expected output for fair string comparison.
 * Strips Windows CRLF differences and trailing whitespace on lines.
 */
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
 * Verify whether student has access to the coding challenge.
 * If challenge is mapped to any level, the student must have completed the MCQ quest
 * with at least 70% marks (present in completedQuests or unlockedCodingChallenges).
 */
async function checkCodingChallengeAccess(
  challengeId: mongoose.Types.ObjectId,
  user: any
) {
  if (!user || user.role !== 'Student') {
    return; // Privileged roles (Admin, Faculty, Committee) have unrestricted access
  }

  // Check if challenge is mapped to any level
  const mappedLevels = await Level.find({ codingChallengeId: challengeId }).lean();
  if (mappedLevels.length === 0) {
    return; // Standalone challenge without level mapping
  }

  const progress = await StudentProgress.findOne({ userId: user.id }).lean();
  const completedQuests = progress?.completedQuests?.map((q) => q.toString()) || [];
  const completedLevels = progress?.completedLevels?.map((l) => l.toString()) || [];
  const unlockedChallenges = progress?.unlockedCodingChallenges?.map((c) => c.toString()) || [];

  const isUnlocked = mappedLevels.some(
    (lvl) =>
      completedQuests.includes(lvl._id.toString()) ||
      completedLevels.includes(lvl._id.toString()) ||
      unlockedChallenges.includes(challengeId.toString())
  );

  if (!isUnlocked) {
    throw ApiError.forbidden(
      'This coding assessment is locked. You must complete the Level MCQ quest with at least 70% marks to open it.'
    );
  }
}

/**
 * GET /api/assessments/code/:problemId
 * Fetch problem details for the student workspace.
 * SECURITY: NEVER returns hidden test cases.
 */
export const getCodingChallenge = async (request: FastifyRequest, reply: FastifyReply) => {
  const { problemId } = request.params as { problemId: string };
  const user = request.user;

  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    throw ApiError.badRequest('Invalid problem ID format');
  }

  const challenge = await CodingChallenge.findById(problemId);
  if (!challenge || (!challenge.isPublished && user?.role === 'Student')) {
    throw ApiError.notFound('Coding challenge not found or not currently active');
  }

  // Verify access gating if challenge is mapped to a level
  await checkCodingChallengeAccess(challenge._id as mongoose.Types.ObjectId, user);

  // Check if student has already submitted
  let existingSubmission = null;
  if (user) {
    existingSubmission = await CodingSubmission.findOne({
      challenge: challenge._id,
      student: new mongoose.Types.ObjectId(user.id),
    }).sort({ createdAt: -1 });
  }

  // Filter test cases: ONLY return visible test cases
  const visibleTestCases = challenge.testCases
    .filter((tc) => !tc.isHidden)
    .map((tc, index) => ({
      testCaseIndex: index + 1,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
    }));

  const starterCodeObj: Record<string, string> = {};
  if (challenge.starterCode) {
    challenge.starterCode.forEach((val, key) => {
      starterCodeObj[key] = val;
    });
  }

  return reply.send({
    success: true,
    data: {
      id: challenge._id.toString(),
      title: challenge.title,
      description: challenge.description,
      inputFormat: challenge.inputFormat || '',
      outputFormat: challenge.outputFormat || '',
      constraints: challenge.constraints || '',
      sampleInput: challenge.sampleInput || '',
      sampleOutput: challenge.sampleOutput || '',
      difficulty: challenge.difficulty || 'Medium',
      allowedLanguages: challenge.allowedLanguages,
      starterCode: starterCodeObj,
      visibleTestCases,
      timeLimitMinutes: challenge.timeLimitMinutes || 45,
      singleSubmissionOnly: challenge.singleSubmissionOnly ?? true,
      hasSubmitted: Boolean(existingSubmission),
      isLocked: Boolean(existingSubmission && existingSubmission.isLocked),
      previousSubmission: existingSubmission
        ? {
            score: existingSubmission.score,
            status: existingSubmission.status,
            passed: existingSubmission.passed,
            total: existingSubmission.total,
            submittedAt: existingSubmission.submittedAt,
          }
        : null,
    },
  });
};

/**
 * Helper to fetch all coding challenge ObjectIds that are linked to any course level.
 * Used to ensure coding assessments linked with courses do not show in the assessment tab.
 */
async function getCourseLinkedChallengeIds(): Promise<mongoose.Types.ObjectId[]> {
  const levelsWithChallenges = await Level.find({
    $or: [
      { codingChallengeId: { $ne: null } },
      { codingChallengePool: { $exists: true, $ne: [] } },
    ],
  })
    .select('codingChallengeId codingChallengePool')
    .lean();

  const linkedChallengeIds = new Set<string>();
  levelsWithChallenges.forEach((lvl: any) => {
    if (lvl.codingChallengeId) linkedChallengeIds.add(lvl.codingChallengeId.toString());
    if (Array.isArray(lvl.codingChallengePool)) {
      lvl.codingChallengePool.forEach((cId: any) => {
        if (cId) linkedChallengeIds.add(cId.toString());
      });
    }
  });

  return Array.from(linkedChallengeIds).map((id) => new mongoose.Types.ObjectId(id));
}

/**
 * GET /api/assessments/code/challenges
 * List available coding challenges for students (STANDALONE only - excludes course-level challenges).
 */
export const listCodingChallenges = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user;
  const isPrivileged =
    user?.role === 'Admin' || user?.role === 'SuperAdmin' || user?.role === 'Faculty';

  const linkedChallengeIds = await getCourseLinkedChallengeIds();

  const filter: any = {
    isCourseChallenge: { $ne: true },
    _id: { $nin: linkedChallengeIds },
  };

  if (!isPrivileged) {
    filter.isPublished = true;
  }

  const challenges = await CodingChallenge.find(filter)
    .select('title description difficulty allowedLanguages timeLimitMinutes isPublished createdAt')
    .sort({ createdAt: -1 });

  // Attach student's own submission state if authenticated
  let userSubmissionsMap = new Map<string, any>();
  if (user?.id) {
    const subs = await CodingSubmission.find({
      student: new mongoose.Types.ObjectId(user.id),
    }).sort({ createdAt: -1 });

    for (const s of subs) {
      const cId = s.challenge.toString();
      if (!userSubmissionsMap.has(cId)) {
        userSubmissionsMap.set(cId, {
          score: s.score,
          passed: s.passed,
          total: s.total,
          status: s.status,
          submittedAt: s.submittedAt,
          isLocked: s.isLocked,
        });
      }
    }
  }

  const enrichedChallenges = challenges.map((c) => ({
    _id: c._id.toString(),
    title: c.title,
    description: c.description,
    difficulty: c.difficulty,
    allowedLanguages: c.allowedLanguages,
    timeLimitMinutes: c.timeLimitMinutes,
    isPublished: c.isPublished,
    createdAt: c.createdAt,
    submission: userSubmissionsMap.get(c._id.toString()) || null,
  }));

  return reply.send({
    success: true,
    data: enrichedChallenges,
  });
};


/**
 * POST /api/assessments/code/execute
 * Run code against PUBLIC/VISIBLE test cases only.
 */
export const executeCode = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user;
  if (!user) {
    throw ApiError.unauthorized('Authentication required to execute code');
  }

  // 1. Rate limiting check
  checkExecutionRateLimit(user.id);

  const { problemId, language, code } = request.body as {
    problemId?: string;
    language?: string;
    code?: string;
  };

  // 2. Validate request input
  if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
    throw ApiError.badRequest('A valid problemId is required');
  }

  if (!code || typeof code !== 'string') {
    throw ApiError.badRequest('Source code must be provided');
  }

  // 3. Fetch challenge
  const challenge = await CodingChallenge.findById(problemId);
  if (!challenge) {
    throw ApiError.notFound('Coding challenge not found');
  }

  // Verify access gating if challenge is mapped to a level
  await checkCodingChallengeAccess(challenge._id as mongoose.Types.ObjectId, user);

  // 4. Validate language against challenge allowlist & system supported languages
  const normalizedLanguage = rceService.normalizeAndValidateLanguage(language);
  if (!challenge.allowedLanguages.includes(normalizedLanguage)) {
    throw ApiError.badRequest(
      `Language "${normalizedLanguage}" is not permitted for this challenge. Allowed: ${challenge.allowedLanguages.join(
        ', '
      )}`
    );
  }

  // 5. Select ONLY public/visible test cases
  const visibleTestCases = challenge.testCases
    .filter((tc) => !tc.isHidden)
    .slice(0, MAX_PUBLIC_TESTCASES_PER_REQUEST);

  if (visibleTestCases.length === 0) {
    throw ApiError.badRequest('No visible test cases configured for this challenge');
  }

  // 6. Execute each visible test case sequentially through RCE service
  const results = [];
  let passedCount = 0;

  for (let i = 0; i < visibleTestCases.length; i++) {
    const tc = visibleTestCases[i];
    const execRes = await rceService.executeCode({
      language: normalizedLanguage,
      sourceCode: code,
      stdin: tc.input,
    });

    // If compilation fails, stop and return the compile error immediately
    if (execRes.status === 'compilation_error') {
      return reply.send({
        success: false,
        compilationError: true,
        error: execRes.stderr || 'Compilation failed',
        results: [
          {
            testCase: i + 1,
            passed: false,
            stdout: '',
            stderr: execRes.stderr,
          },
        ],
        passed: 0,
        total: visibleTestCases.length,
      });
    }

    const normalizedActual = normalizeOutput(execRes.stdout);
    const normalizedExpected = normalizeOutput(tc.expectedOutput);
    const isPassed =
      execRes.status === 'success' && normalizedActual === normalizedExpected;

    if (isPassed) {
      passedCount++;
    }

    results.push({
      testCase: i + 1,
      passed: isPassed,
      stdout: execRes.stdout,
      stderr: execRes.stderr,
    });
  }

  return reply.send({
    success: true,
    results,
    passed: passedCount,
    total: visibleTestCases.length,
  });
};

/**
 * POST /api/assessments/code/submit
 * Final assessment submission executing against ALL test cases (visible + hidden).
 * SECURITY: NEVER exposes hidden test cases or expected outputs.
 */
export const submitAssessmentCode = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user;
  if (!user) {
    throw ApiError.unauthorized('Authentication required to submit assessment');
  }

  const { problemId, language, code, integrityEvents } = request.body as {
    problemId?: string;
    language?: string;
    code?: string;
    integrityEvents?: Array<{
      type: string;
      timestamp: string | Date;
      warningNumber: number;
      details?: any;
    }>;
  };

  // 1. Validate problemId & code
  if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
    throw ApiError.badRequest('A valid problemId is required');
  }

  if (!code || typeof code !== 'string') {
    throw ApiError.badRequest('Source code must be provided');
  }

  // 2. Fetch challenge
  const challenge = await CodingChallenge.findById(problemId);
  if (!challenge) {
    throw ApiError.notFound('Coding challenge not found');
  }

  // Verify access gating if challenge is mapped to a level
  await checkCodingChallengeAccess(challenge._id as mongoose.Types.ObjectId, user);

  // 3. Verify single submission restriction
  if (challenge.singleSubmissionOnly) {
    const existingSubmission = await CodingSubmission.findOne({
      challenge: challenge._id,
      student: new mongoose.Types.ObjectId(user.id),
      isLocked: true,
    });

    if (existingSubmission) {
      return reply.status(403).send({
        success: false,
        submitted: false,
        error: 'Assessment is already submitted and locked. Resubmissions are not permitted.',
      });
    }
  }

  // 4. Verify language
  const normalizedLanguage = rceService.normalizeAndValidateLanguage(language);
  if (!challenge.allowedLanguages.includes(normalizedLanguage)) {
    throw ApiError.badRequest(
      `Language "${normalizedLanguage}" is not permitted for this challenge. Allowed: ${challenge.allowedLanguages.join(
        ', '
      )}`
    );
  }

  // 5. Execute against BOTH visible and hidden test cases
  const allTestCases = challenge.testCases.slice(0, MAX_TOTAL_TESTCASES_PER_REQUEST);
  if (allTestCases.length === 0) {
    throw ApiError.badRequest('No test cases configured for this challenge');
  }

  let passedCount = 0;
  const detailedResults = [];
  let finalStatus: 'passed' | 'failed' | 'compilation_error' | 'runtime_error' | 'timeout' = 'passed';

  for (let i = 0; i < allTestCases.length; i++) {
    const tc = allTestCases[i];
    const execRes = await rceService.executeCode({
      language: normalizedLanguage,
      sourceCode: code,
      stdin: tc.input,
    });

    if (execRes.status === 'compilation_error') {
      finalStatus = 'compilation_error';
      detailedResults.push({
        testCaseIndex: i + 1,
        passed: false,
        stdout: '',
        stderr: execRes.stderr,
        isHidden: tc.isHidden,
        executionTimeMs: execRes.executionTimeMs,
      });
      break;
    }

    const normalizedActual = normalizeOutput(execRes.stdout);
    const normalizedExpected = normalizeOutput(tc.expectedOutput);
    const isPassed =
      execRes.status === 'success' && normalizedActual === normalizedExpected;

    if (isPassed) {
      passedCount++;
    } else if (finalStatus === 'passed') {
      finalStatus = execRes.status === 'timeout' ? 'timeout' : 'failed';
    }

    detailedResults.push({
      testCaseIndex: i + 1,
      passed: isPassed,
      stdout: tc.isHidden ? '[HIDDEN]' : execRes.stdout,
      stderr: tc.isHidden ? '' : execRes.stderr,
      isHidden: tc.isHidden,
      executionTimeMs: execRes.executionTimeMs,
    });
  }

  const total = allTestCases.length;
  const score = total > 0 ? Math.round((passedCount / total) * 100) : 0;
  const submissionStatus = passedCount === total ? 'passed' : 'failed';

  // Format integrity logs
  const formattedIntegrityEvents = Array.isArray(integrityEvents)
    ? integrityEvents.map((evt) => ({
        type: evt.type || 'VISIBILITY_CHANGE',
        timestamp: evt.timestamp ? new Date(evt.timestamp) : new Date(),
        warningNumber: Number(evt.warningNumber) || 1,
        details: evt.details || {},
      }))
    : [];

  // 6. Store and lock submission
  const submission = new CodingSubmission({
    student: new mongoose.Types.ObjectId(user.id),
    challenge: challenge._id,
    language: normalizedLanguage,
    code,
    score,
    passed: passedCount,
    total,
    status: submissionStatus,
    isLocked: true,
    results: detailedResults,
    integrityEvents: formattedIntegrityEvents,
    submittedAt: new Date(),
  });

  await submission.save();

  // If passed all test cases, handle progression unlock for mapped levels
  let levelCompleted = false;
  let unlockedNextLevel = false;
  let nextLevelId: string | null = null;
  let domainId: string | null = null;
  let pointsAwarded = 0;

  if (submissionStatus === 'passed') {
    // 1. Mark coding challenge as completed in student progress
    await StudentProgress.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(user.id) },
      { $addToSet: { completedCodingChallenges: challenge._id } },
      { upsert: true }
    );

    // 2. Find any domain levels where this challenge is mapped
    const linkedLevels = await Level.find({ codingChallengeId: challenge._id }).lean();
    if (linkedLevels.length > 0) {
      levelCompleted = true;
      const linkedLevelIds = linkedLevels.map((lvl) => lvl._id);
      const assessmentIdsToUnlock = linkedLevels
        .filter((lvl) => lvl.assessmentId)
        .map((lvl) => lvl.assessmentId);

      // Check which levels are newly completed to award points
      const existingProgress = await StudentProgress.findOne({
        userId: new mongoose.Types.ObjectId(user.id),
      }).lean();
      const existingCompleted = new Set(
        (existingProgress?.completedLevels || []).map((id) => id.toString())
      );

      for (const lvl of linkedLevels) {
        if (!existingCompleted.has(lvl._id.toString())) {
          const pts =
            typeof lvl.points === 'number' && lvl.points >= 0
              ? lvl.points
              : getDefaultPointsForLevel(lvl.levelNumber);
          pointsAwarded += pts;
        }
      }

      if (pointsAwarded > 0) {
        await User.findByIdAndUpdate(user.id, { $inc: { points: pointsAwarded } });
      }

      const updateOp: any = {
        $addToSet: {
          completedLevels: { $each: linkedLevelIds },
        },
      };

      if (assessmentIdsToUnlock.length > 0) {
        updateOp.$addToSet.unlockedAssessments = { $each: assessmentIdsToUnlock };
      }

      await StudentProgress.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(user.id) },
        updateOp,
        { upsert: true }
      );

      // Check next level in the domain
      const firstLinked = linkedLevels[0];
      domainId = firstLinked.domainId.toString();
      const allLevels = await Level.find({ domainId: firstLinked.domainId })
        .sort({ levelNumber: 1 })
        .lean();
      const currentIdx = allLevels.findIndex(
        (lvl) => lvl._id.toString() === firstLinked._id.toString()
      );
      if (currentIdx !== -1 && currentIdx + 1 < allLevels.length) {
        unlockedNextLevel = true;
        nextLevelId = allLevels[currentIdx + 1]._id.toString();
      }

      // Update student's course enrollment status
      const domainEnrollment = await DomainEnrollment.findOne({
        userId: user.id,
        domainId: firstLinked.domainId,
      });
      if (domainEnrollment) {
        if (domainEnrollment.status === 'enrolled') {
          domainEnrollment.status = 'in_progress';
        }
        const updatedProgress = await StudentProgress.findOne({ userId: user.id }).lean();
        const doneSet = new Set((updatedProgress?.completedLevels || []).map((id) => id.toString()));
        if (allLevels.length > 0 && allLevels.every((l) => doneSet.has(l._id.toString()))) {
          domainEnrollment.status = 'completed';
          domainEnrollment.completedAt = new Date();
        }
        await domainEnrollment.save();
      }
    }
  }

  // 7. Return submission response format with progression feedback
  return reply.send({
    submitted: true,
    score,
    passed: passedCount,
    total,
    status: submissionStatus,
    levelCompleted,
    pointsAwarded,
    unlockedNextLevel,
    nextLevelId,
    domainId,
  });
};

/**
 * POST /api/assessments/code/integrity-event
 * Record anti-cheating audit trail events (e.g. window blur, tab switch)
 */
export const recordIntegrityEvent = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user;
  if (!user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const { problemId, type, warningNumber, timestamp } = request.body as {
    problemId?: string;
    type?: string;
    warningNumber?: number;
    timestamp?: string;
  };

  request.log.warn(
    {
      studentId: user.id,
      problemId,
      type: type || 'VISIBILITY_CHANGE',
      warningNumber,
      timestamp: timestamp || new Date().toISOString(),
    },
    'Assessment integrity event logged'
  );

  return reply.send({
    success: true,
    logged: true,
  });
};

/**
 * GET /api/assessments/code/my-submissions
 * Get authenticated student's previous coding assessment submissions.
 */
export const getMySubmissions = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user;
  if (!user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const submissions = await CodingSubmission.find({
    student: new mongoose.Types.ObjectId(user.id),
  })
    .populate('challenge', 'title difficulty allowedLanguages timeLimitMinutes')
    .sort({ createdAt: -1 });

  return reply.send({
    success: true,
    data: submissions,
  });
};

/**
 * GET /api/assessments/code/admin/challenges
 * Admin view of standalone coding challenges with submission metrics.
 * Excludes coding challenges linked to course levels.
 */
export const listAdminCodingChallenges = async (request: FastifyRequest, reply: FastifyReply) => {
  const linkedChallengeIds = await getCourseLinkedChallengeIds();

  const filter: any = {
    isCourseChallenge: { $ne: true },
    _id: { $nin: linkedChallengeIds },
  };

  const challenges = await CodingChallenge.find(filter).sort({ createdAt: -1 });

  // Compute submission statistics per challenge
  const metrics = await CodingSubmission.aggregate([
    {
      $group: {
        _id: '$challenge',
        totalSubmissions: { $sum: 1 },
        passedSubmissions: {
          $sum: { $cond: [{ $eq: ['$status', 'passed'] }, 1, 0] },
        },
        avgScore: { $avg: '$score' },
      },
    },
  ]);

  const metricsMap = new Map<string, any>();
  metrics.forEach((m) => {
    metricsMap.set(m._id.toString(), m);
  });

  const data = challenges.map((c) => {
    const m = metricsMap.get(c._id.toString()) || {
      totalSubmissions: 0,
      passedSubmissions: 0,
      avgScore: 0,
    };

    return {
      _id: c._id.toString(),
      title: c.title,
      description: c.description,
      difficulty: c.difficulty,
      allowedLanguages: c.allowedLanguages,
      timeLimitMinutes: c.timeLimitMinutes,
      isPublished: c.isPublished,
      singleSubmissionOnly: c.singleSubmissionOnly,
      testCasesCount: c.testCases.length,
      visibleTestCasesCount: c.testCases.filter((t) => !t.isHidden).length,
      hiddenTestCasesCount: c.testCases.filter((t) => t.isHidden).length,
      createdAt: c.createdAt,
      totalSubmissions: m.totalSubmissions,
      passedSubmissions: m.passedSubmissions,
      passRate:
        m.totalSubmissions > 0
          ? Math.round((m.passedSubmissions / m.totalSubmissions) * 100)
          : 0,
      avgScore: Math.round(m.avgScore || 0),
    };
  });

  return reply.send({
    success: true,
    data,
  });
};

/**
 * GET /api/assessments/code/admin/challenges/:id
 * Admin details view of a challenge INCLUDING hidden test cases and starter codes.
 */
export const getAdminChallengeDetails = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid challenge ID');
  }

  const challenge = await CodingChallenge.findById(id);
  if (!challenge) {
    throw ApiError.notFound('Coding challenge not found');
  }

  const starterCodeObj: Record<string, string> = {};
  if (challenge.starterCode) {
    challenge.starterCode.forEach((val, key) => {
      starterCodeObj[key] = val;
    });
  }

  return reply.send({
    success: true,
    data: {
      ...challenge.toObject(),
      starterCode: starterCodeObj,
    },
  });
};

/**
 * POST /api/assessments/code/admin/challenges (Admin / Faculty)
 * Create new challenge.
 */
export const createCodingChallenge = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user;
  const body = request.body as any;

  if (!body.title || !body.description || !body.allowedLanguages || !body.testCases) {
    throw ApiError.badRequest('Missing required challenge fields');
  }

  const challenge = new CodingChallenge({
    ...body,
    createdBy: user?.id ? new mongoose.Types.ObjectId(user.id) : null,
  });

  await challenge.save();

  return reply.status(201).send({
    success: true,
    data: challenge,
  });
};

/**
 * PUT /api/assessments/code/admin/challenges/:id (Admin / Faculty)
 * Update existing challenge.
 */
export const updateCodingChallenge = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const body = request.body as any;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid challenge ID');
  }

  const challenge = await CodingChallenge.findById(id);
  if (!challenge) {
    throw ApiError.notFound('Coding challenge not found');
  }

  if (body.title) challenge.title = body.title;
  if (body.description) challenge.description = body.description;
  if (body.inputFormat !== undefined) challenge.inputFormat = body.inputFormat;
  if (body.outputFormat !== undefined) challenge.outputFormat = body.outputFormat;
  if (body.constraints !== undefined) challenge.constraints = body.constraints;
  if (body.sampleInput !== undefined) challenge.sampleInput = body.sampleInput;
  if (body.sampleOutput !== undefined) challenge.sampleOutput = body.sampleOutput;
  if (body.difficulty) challenge.difficulty = body.difficulty;
  if (body.allowedLanguages) challenge.allowedLanguages = body.allowedLanguages;
  if (body.timeLimitMinutes) challenge.timeLimitMinutes = body.timeLimitMinutes;
  if (body.singleSubmissionOnly !== undefined) challenge.singleSubmissionOnly = body.singleSubmissionOnly;
  if (body.isPublished !== undefined) challenge.isPublished = body.isPublished;

  if (body.starterCode && typeof body.starterCode === 'object') {
    challenge.starterCode = new Map(Object.entries(body.starterCode));
  }

  if (body.testCases && Array.isArray(body.testCases)) {
    challenge.testCases = body.testCases;
  }

  await challenge.save();

  return reply.send({
    success: true,
    data: challenge,
  });
};

/**
 * DELETE /api/assessments/code/admin/challenges/:id (Admin / Faculty)
 * Delete challenge and its associated submissions.
 */
export const deleteCodingChallenge = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid challenge ID');
  }

  const challenge = await CodingChallenge.findByIdAndDelete(id);
  if (!challenge) {
    throw ApiError.notFound('Coding challenge not found');
  }

  // Delete all submissions for this challenge
  await CodingSubmission.deleteMany({ challenge: challenge._id });

  return reply.send({
    success: true,
    message: 'Coding challenge and submissions deleted successfully',
  });
};

/**
 * GET /api/assessments/code/admin/challenges/:id/submissions
 * Get student submissions roster and evaluation analytics for a challenge.
 */
export const getCodingChallengeSubmissions = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = request.params as { id: string };

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid challenge ID');
  }

  const submissions = await CodingSubmission.find({
    challenge: new mongoose.Types.ObjectId(id),
  })
    .populate('student', 'name email rollNo department profilePicUrl')
    .sort({ createdAt: -1 });

  return reply.send({
    success: true,
    data: submissions,
  });
};

/**
 * Generate binary buffer for sample Excel template with 2 sheets:
 * 1) Coding Questions (3 working sample problems)
 * 2) Instructions
 */
export const generateSampleExcelTemplate = (): Buffer => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Coding Questions
  const sampleData = [
    {
      'Title': 'Two Sum Target Indices',
      'Description': 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Each input has exactly one solution.',
      'Difficulty': 'Easy',
      'TimeLimitMinutes': 60,
      'AllowedLanguages': 'c, cpp, python, java, javascript',
      'InputFormat': 'First line contains N. Second line contains N integers. Third line contains target integer.',
      'OutputFormat': 'Output the two 0-based indices separated by a space.',
      'Constraints': '2 <= N <= 10^4, -10^9 <= nums[i] <= 10^9',
      'SampleInput': '4\n2 7 11 15\n9',
      'SampleOutput': '0 1',
      'StarterCode_Python': 'import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if not lines: return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    target = int(lines[n+1])\n    \n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            print(f"{seen[diff]} {i}")\n            return\n        seen[num] = i\n\nif __name__ == "__main__":\n    main()\n',
      'StarterCode_C': '#include <stdio.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) != 1) return 0;\n    int nums[n];\n    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);\n    int target;\n    scanf("%d", &target);\n    \n    for (int i = 0; i < n; i++) {\n        for (int j = i + 1; j < n; j++) {\n            if (nums[i] + nums[j] == target) {\n                printf("%d %d\\n", i, j);\n                return 0;\n            }\n        }\n    }\n    return 0;\n}\n',
      'StarterCode_Cpp': '#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    int target;\n    cin >> target;\n    \n    unordered_map<int, int> seen;\n    for (int i = 0; i < n; i++) {\n        int comp = target - nums[i];\n        if (seen.find(comp) != seen.end()) {\n            cout << seen[comp] << " " << i << endl;\n            return 0;\n        }\n        seen[nums[i]] = i;\n    }\n    return 0;\n}\n',
      'StarterCode_Java': 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        int target = sc.nextInt();\n        \n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < n; i++) {\n            int comp = target - nums[i];\n            if (map.containsKey(comp)) {\n                System.out.println(map.get(comp) + " " + i);\n                return;\n            }\n            map.put(nums[i], i);\n        }\n    }\n}\n',
      'StarterCode_JavaScript': 'const fs = require("fs");\n\nfunction main() {\n    const input = fs.readFileSync("/dev/stdin", "utf-8").trim().split(/\\s+/);\n    if (input.length < 3) return;\n    const n = parseInt(input[0], 10);\n    const nums = input.slice(1, n + 1).map(Number);\n    const target = Number(input[n + 1]);\n    \n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const comp = target - nums[i];\n        if (map.has(comp)) {\n            console.log(`${map.get(comp)} ${i}`);\n            return;\n        }\n        map.set(nums[i], i);\n    }\n}\nmain();\n',
      'TestCase1_Input': '4\n2 7 11 15\n9',
      'TestCase1_ExpectedOutput': '0 1',
      'TestCase1_IsHidden': 'FALSE',
      'TestCase2_Input': '3\n3 2 4\n6',
      'TestCase2_ExpectedOutput': '1 2',
      'TestCase2_IsHidden': 'FALSE',
      'TestCase3_Input': '2\n3 3\n6',
      'TestCase3_ExpectedOutput': '0 1',
      'TestCase3_IsHidden': 'TRUE',
      'TestCase4_Input': '5\n10 20 30 40 50\n90',
      'TestCase4_ExpectedOutput': '3 4',
      'TestCase4_IsHidden': 'TRUE',
    },
    {
      'Title': 'Valid Palindrome String',
      'Description': 'Determine if a given string s is a palindrome after converting all letters to lowercase and removing all non-alphanumeric characters.',
      'Difficulty': 'Easy',
      'TimeLimitMinutes': 60,
      'AllowedLanguages': 'c, cpp, python, java, javascript',
      'InputFormat': 'A single line containing the string s.',
      'OutputFormat': 'Print "true" if palindrome, otherwise "false".',
      'Constraints': '1 <= s.length <= 10^5',
      'SampleInput': 'A man, a plan, a canal: Panama',
      'SampleOutput': 'true',
      'StarterCode_Python': 'import sys, re\n\ndef main():\n    s = sys.stdin.read().strip()\n    cleaned = re.sub(r"[^a-zA-Z0-9]", "", s).lower()\n    if cleaned == cleaned[::-1]:\n        print("true")\n    else:\n        print("false")\n\nif __name__ == "__main__":\n    main()\n',
      'StarterCode_C': '#include <stdio.h>\n#include <ctype.h>\n#include <string.h>\n\nint main() {\n    char s[10000];\n    if (!fgets(s, sizeof(s), stdin)) return 0;\n    char clean[10000];\n    int len = 0;\n    for (int i = 0; s[i]; i++) {\n        if (isalnum(s[i])) clean[len++] = tolower(s[i]);\n    }\n    int isPal = 1;\n    for (int i = 0; i < len / 2; i++) {\n        if (clean[i] != clean[len - 1 - i]) { isPal = 0; break; }\n    }\n    printf(isPal ? "true\\n" : "false\\n");\n    return 0;\n}\n',
      'StarterCode_Cpp': '#include <iostream>\n#include <string>\n#include <cctype>\nusing namespace std;\n\nint main() {\n    string s;\n    if (!getline(cin, s)) return 0;\n    string clean = "";\n    for (char c : s) if (isalnum(c)) clean += tolower(c);\n    int l = 0, r = clean.size() - 1;\n    bool ok = true;\n    while (l < r) {\n        if (clean[l++] != clean[r--]) { ok = false; break; }\n    }\n    cout << (ok ? "true" : "false") << endl;\n    return 0;\n}\n',
      'StarterCode_Java': 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String s = sc.nextLine();\n        String clean = s.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();\n        String rev = new StringBuilder(clean).reverse().toString();\n        System.out.println(clean.equals(rev) ? "true" : "false");\n    }\n}\n',
      'StarterCode_JavaScript': 'const fs = require("fs");\nconst input = fs.readFileSync("/dev/stdin", "utf-8").trim();\nconst clean = input.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();\nconst rev = clean.split("").reverse().join("");\nconsole.log(clean === rev ? "true" : "false");\n',
      'TestCase1_Input': 'A man, a plan, a canal: Panama',
      'TestCase1_ExpectedOutput': 'true',
      'TestCase1_IsHidden': 'FALSE',
      'TestCase2_Input': 'race a car',
      'TestCase2_ExpectedOutput': 'false',
      'TestCase2_IsHidden': 'FALSE',
      'TestCase3_Input': '0P',
      'TestCase3_ExpectedOutput': 'false',
      'TestCase3_IsHidden': 'TRUE',
      'TestCase4_Input': 'No lemon, no melon',
      'TestCase4_ExpectedOutput': 'true',
      'TestCase4_IsHidden': 'TRUE',
    },
    {
      'Title': 'Maximum Subarray Sum',
      'Description': 'Find the subarray within an array of integers with the largest sum and output that sum (Kadane Algorithm).',
      'Difficulty': 'Medium',
      'TimeLimitMinutes': 60,
      'AllowedLanguages': 'c, cpp, python, java, javascript',
      'InputFormat': 'First line contains integer N. Second line contains N integers.',
      'OutputFormat': 'Output a single integer representing the maximum subarray sum.',
      'Constraints': '1 <= N <= 10^5, -10^4 <= nums[i] <= 10^4',
      'SampleInput': '9\n-2 1 -3 4 -1 2 1 -5 4',
      'SampleOutput': '6',
      'StarterCode_Python': 'import sys\n\ndef main():\n    tokens = sys.stdin.read().split()\n    if not tokens: return\n    n = int(tokens[0])\n    nums = [int(x) for x in tokens[1:n+1]]\n    max_sum = cur_sum = nums[0]\n    for x in nums[1:]:\n        cur_sum = max(x, cur_sum + x)\n        max_sum = max(max_sum, cur_sum)\n    print(max_sum)\n\nif __name__ == "__main__":\n    main()\n',
      'StarterCode_C': '#include <stdio.h>\n\nint main() {\n    int n;\n    if (scanf("%d", &n) != 1) return 0;\n    int first;\n    scanf("%d", &first);\n    int max_s = first, cur_s = first;\n    for (int i = 1; i < n; i++) {\n        int x;\n        scanf("%d", &x);\n        cur_s = (x > cur_s + x) ? x : cur_s + x;\n        if (cur_s > max_s) max_s = cur_s;\n    }\n    printf("%d\\n", max_s);\n    return 0;\n}\n',
      'StarterCode_Cpp': '#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    int x;\n    cin >> x;\n    int max_s = x, cur_s = x;\n    for (int i = 1; i < n; i++) {\n        cin >> x;\n        cur_s = max(x, cur_s + x);\n        max_s = max(max_s, cur_s);\n    }\n    cout << max_s << endl;\n    return 0;\n}\n',
      'StarterCode_Java': 'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int first = sc.nextInt();\n        int maxS = first, curS = first;\n        for (int i = 1; i < n; i++) {\n            int x = sc.nextInt();\n            curS = Math.max(x, curS + x);\n            maxS = Math.max(maxS, curS);\n        }\n        System.out.println(maxS);\n    }\n}\n',
      'StarterCode_JavaScript': 'const fs = require("fs");\nconst nums = fs.readFileSync("/dev/stdin", "utf-8").trim().split(/\\s+/).slice(1).map(Number);\nlet maxS = nums[0], curS = nums[0];\nfor (let i = 1; i < nums.length; i++) {\n    curS = Math.max(nums[i], curS + nums[i]);\n    maxS = Math.max(maxS, curS);\n}\nconsole.log(maxS);\n',
      'TestCase1_Input': '9\n-2 1 -3 4 -1 2 1 -5 4',
      'TestCase1_ExpectedOutput': '6',
      'TestCase1_IsHidden': 'FALSE',
      'TestCase2_Input': '1\n1',
      'TestCase2_ExpectedOutput': '1',
      'TestCase2_IsHidden': 'FALSE',
      'TestCase3_Input': '5\n5 4 -1 7 8',
      'TestCase3_ExpectedOutput': '23',
      'TestCase3_IsHidden': 'TRUE',
      'TestCase4_Input': '3\n-3 -2 -1',
      'TestCase4_ExpectedOutput': '-1',
      'TestCase4_IsHidden': 'TRUE',
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(wb, ws, 'Coding Questions');

  // Sheet 2: Instructions
  const instructions = [
    { 'Column': 'Title', 'Required': 'YES', 'Description': 'Problem headline / name' },
    { 'Column': 'Description', 'Required': 'YES', 'Description': 'Full problem description and requirements' },
    { 'Column': 'Difficulty', 'Required': 'NO', 'Description': 'Easy, Medium, or Hard (defaults to Medium)' },
    { 'Column': 'TimeLimitMinutes', 'Required': 'NO', 'Description': 'Time limit in minutes (default: 60)' },
    { 'Column': 'AllowedLanguages', 'Required': 'NO', 'Description': 'Comma-separated: c, cpp, python, java, javascript' },
    { 'Column': 'InputFormat', 'Required': 'NO', 'Description': 'Input format description' },
    { 'Column': 'OutputFormat', 'Required': 'NO', 'Description': 'Expected output specification' },
    { 'Column': 'Constraints', 'Required': 'NO', 'Description': 'Numerical & length constraints' },
    { 'Column': 'SampleInput', 'Required': 'NO', 'Description': 'Example input string' },
    { 'Column': 'SampleOutput', 'Required': 'NO', 'Description': 'Example output string' },
    { 'Column': 'StarterCode_<Lang>', 'Required': 'NO', 'Description': 'Starter code template for Python, C, Cpp, Java, JavaScript' },
    { 'Column': 'TestCase{N}_Input', 'Required': 'YES (at least 1)', 'Description': 'Input data for test case N' },
    { 'Column': 'TestCase{N}_ExpectedOutput', 'Required': 'YES (at least 1)', 'Description': 'Expected stdout for test case N' },
    { 'Column': 'TestCase{N}_IsHidden', 'Required': 'NO', 'Description': 'TRUE for hidden evaluation test cases, FALSE for visible ones' },
  ];
  const wsInstr = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * GET /api/assessments/code/admin/template
 * Download sample Excel sheet template for coding questions bulk upload.
 */
export const downloadSampleTemplate = async (request: FastifyRequest, reply: FastifyReply) => {
  const buffer = generateSampleExcelTemplate();
  return reply
    .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .header('Content-Disposition', 'attachment; filename="coding_questions_sample_template.xlsx"')
    .send(buffer);
};

/**
 * POST /api/assessments/code/admin/bulk-upload
 * Bulk upload coding questions from Excel (.xlsx/.xls).
 * Supports destination: specific Course Level (adds to level question pool) OR Standalone (assessment tab).
 */
export const bulkUploadCodingChallenges = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = request.user;
  let fileBuffer: Buffer | null = null;
  let filename = '';
  let levelId: string | null = null;
  let domainId: string | null = null;

  // Query fallbacks
  const query = request.query as any;
  if (query?.levelId) levelId = String(query.levelId).trim();
  if (query?.domainId) domainId = String(query.domainId).trim();

  // Parse multipart stream
  const parts = request.parts();
  for await (const part of parts) {
    if (part.type === 'file') {
      filename = (part.filename || '').toLowerCase();
      const chunks: Buffer[] = [];
      for await (const chunk of part.file) {
        chunks.push(chunk);
      }
      fileBuffer = Buffer.concat(chunks);
    } else {
      if (part.fieldname === 'levelId') {
        const val = String(part.value || '').trim();
        if (val) levelId = val;
      }
      if (part.fieldname === 'domainId') {
        const val = String(part.value || '').trim();
        if (val) domainId = val;
      }
    }
  }

  if (!fileBuffer) {
    throw ApiError.badRequest('No Excel file uploaded');
  }

  if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls')) {
    throw ApiError.badRequest('Only .xlsx and .xls Excel files are supported');
  }

  // Parse workbook
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw ApiError.badRequest('The Excel workbook contains no sheets');
  }

  const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  if (rawRows.length === 0) {
    throw ApiError.badRequest('The uploaded Excel sheet contains no data rows');
  }

  let targetLevel: any = null;
  if (levelId && mongoose.Types.ObjectId.isValid(levelId)) {
    targetLevel = await Level.findById(levelId);
    if (!targetLevel) {
      throw ApiError.notFound('Target course level not found');
    }
    if (!domainId && targetLevel.domainId) {
      domainId = targetLevel.domainId.toString();
    }
  }

  const createdChallenges: any[] = [];
  const errors: string[] = [];

  for (let rowIndex = 0; rowIndex < rawRows.length; rowIndex++) {
    const row = rawRows[rowIndex];

    // Normalize keys (lowercase, strip underscores and spaces)
    const normalizedRow: Record<string, any> = {};
    Object.keys(row).forEach((k) => {
      const cleanKey = k.toLowerCase().replace(/[\s_-]+/g, '');
      normalizedRow[cleanKey] = row[k];
    });

    const title = String(normalizedRow['title'] || '').trim();
    const description = String(normalizedRow['description'] || '').trim();

    if (!title || !description) {
      errors.push(`Row ${rowIndex + 2}: skipped because Title or Description is empty`);
      continue;
    }

    // Difficulty
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
    const diffRaw = String(normalizedRow['difficulty'] || '').toLowerCase();
    if (diffRaw === 'easy') difficulty = 'Easy';
    else if (diffRaw === 'hard') difficulty = 'Hard';

    // Time Limit
    const timeLimitMinutes = Number(normalizedRow['timelimitminutes']) || (targetLevel ? 60 : 45);

    // Allowed Languages
    let allowedLanguages: SupportedLanguage[] = ['c', 'cpp', 'python', 'java', 'javascript'];
    const langsRaw = String(normalizedRow['allowedlanguages'] || '').toLowerCase();
    if (langsRaw) {
      const splitLangs = langsRaw
        .split(/[,;\s]+/)
        .map((l) => l.trim() as SupportedLanguage)
        .filter((l) => ['c', 'cpp', 'python', 'java', 'javascript'].includes(l));
      if (splitLangs.length > 0) {
        allowedLanguages = splitLangs;
      }
    }

    const inputFormat = String(normalizedRow['inputformat'] || '').trim();
    const outputFormat = String(normalizedRow['outputformat'] || '').trim();
    const constraints = String(normalizedRow['constraints'] || '').trim();
    const sampleInput = String(normalizedRow['sampleinput'] || '').trim();
    const sampleOutput = String(normalizedRow['sampleoutput'] || '').trim();

    // Starter code map
    const starterCodeMap = new Map<string, string>();
    ['python', 'c', 'cpp', 'java', 'javascript'].forEach((lang) => {
      const val =
        normalizedRow[`startercode${lang}`] ||
        normalizedRow[`startercode_${lang}`] ||
        normalizedRow[lang];
      if (val && typeof val === 'string' && val.trim()) {
        starterCodeMap.set(lang, val.replace(/\\n/g, '\n'));
      }
    });

    // Test cases extraction
    const testCases: ITestCase[] = [];

    // Scan for TestCase1..N
    for (let tcIdx = 1; tcIdx <= 20; tcIdx++) {
      const inVal =
        normalizedRow[`testcase${tcIdx}input`] ??
        normalizedRow[`testcase${tcIdx}in`] ??
        normalizedRow[`input${tcIdx}`];
      const outVal =
        normalizedRow[`testcase${tcIdx}expectedoutput`] ??
        normalizedRow[`testcase${tcIdx}output`] ??
        normalizedRow[`testcase${tcIdx}out`] ??
        normalizedRow[`output${tcIdx}`];
      const hiddenVal =
        normalizedRow[`testcase${tcIdx}ishidden`] ??
        normalizedRow[`testcase${tcIdx}hidden`] ??
        normalizedRow[`hidden${tcIdx}`];

      if (outVal !== undefined && String(outVal).trim() !== '') {
        const isHidden =
          String(hiddenVal).trim().toLowerCase() === 'true' ||
          String(hiddenVal).trim() === '1';
        testCases.push({
          input: String(inVal ?? '').replace(/\\n/g, '\n'),
          expectedOutput: String(outVal).replace(/\\n/g, '\n').trim(),
          isHidden,
        });
      }
    }

    // Fallback: If no test cases parsed, use SampleInput/SampleOutput as test case 1 (visible) and testcase 2 (hidden)
    if (testCases.length === 0) {
      if (sampleOutput) {
        testCases.push({
          input: sampleInput.replace(/\\n/g, '\n'),
          expectedOutput: sampleOutput.replace(/\\n/g, '\n').trim(),
          isHidden: false,
        });
        testCases.push({
          input: sampleInput.replace(/\\n/g, '\n'),
          expectedOutput: sampleOutput.replace(/\\n/g, '\n').trim(),
          isHidden: true,
        });
      } else {
        errors.push(`Row ${rowIndex + 2}: skipped because no test cases or sample output provided`);
        continue;
      }
    }

    // Create challenge document
    const challengeData: any = {
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      sampleInput,
      sampleOutput,
      difficulty,
      allowedLanguages,
      starterCode: starterCodeMap,
      testCases,
      timeLimitMinutes,
      singleSubmissionOnly: true,
      isPublished: true,
      createdBy: user?.id ? new mongoose.Types.ObjectId(user.id) : null,
      isCourseChallenge: Boolean(targetLevel),
      domainId: targetLevel && domainId ? new mongoose.Types.ObjectId(domainId) : null,
      levelId: targetLevel ? targetLevel._id : null,
    };

    const newChallenge = new CodingChallenge(challengeData);
    await newChallenge.save();
    createdChallenges.push(newChallenge);

    // If levelId specified, link challenge to the level's pool
    if (targetLevel) {
      if (!Array.isArray(targetLevel.codingChallengePool)) {
        targetLevel.codingChallengePool = [];
      }
      targetLevel.codingChallengePool.push(newChallenge._id);
      if (!targetLevel.codingChallengeId) {
        targetLevel.codingChallengeId = newChallenge._id;
      }
    }
  }

  if (targetLevel && createdChallenges.length > 0) {
    await targetLevel.save();
  }

  return reply.send({
    success: true,
    count: createdChallenges.length,
    errors,
    data: createdChallenges.map((c) => ({
      _id: c._id.toString(),
      title: c.title,
      difficulty: c.difficulty,
      testCasesCount: c.testCases.length,
      isCourseChallenge: c.isCourseChallenge,
    })),
    message: `Successfully uploaded ${createdChallenges.length} coding question(s)${
      targetLevel ? ` for ${targetLevel.title}` : ''
    }.`,
  });
};

/**
 * GET /api/assessments/code/level/:levelId/session
 * Starts or retrieves the 1-hour 2-random-question coding assessment session for a course level.
 */
export const getLevelAssessmentSession = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { levelId } = request.params as { levelId: string };
  const user = request.user;
  const { retry } = request.query as { retry?: string };

  if (!user) {
    throw ApiError.unauthorized('Authentication required');
  }

  if (!mongoose.Types.ObjectId.isValid(levelId)) {
    throw ApiError.badRequest('Invalid level ID');
  }

  const level = await Level.findById(levelId);
  if (!level) {
    throw ApiError.notFound('Level not found');
  }

  // Access gating: Student must have completed MCQ quest with >= 70%
  if (user && user.role === 'Student') {
    const progress = await StudentProgress.findOne({ userId: user.id }).lean();
    const completedQuests = (progress?.completedQuests || []).map((q) => q.toString());
    const completedLevels = (progress?.completedLevels || []).map((l) => l.toString());
    const unlockedChallenges = (progress?.unlockedCodingChallenges || []).map((c) => c.toString());

    const isUnlocked =
      completedQuests.includes(level._id.toString()) ||
      completedLevels.includes(level._id.toString()) ||
      (level.codingChallengeId && unlockedChallenges.includes(level.codingChallengeId.toString()));

    if (!isUnlocked) {
      throw ApiError.forbidden(
        'This coding assessment is locked. You must complete the Level MCQ quest with at least 70% marks to open it.'
      );
    }
  }

  const userId = new mongoose.Types.ObjectId(user.id);

  // Look for existing session
  let session = await LevelAssessmentSession.findOne({
    student: userId,
    level: level._id,
  }).sort({ createdAt: -1 });

  const now = Date.now();

  // If existing session is expired and not completed, mark expired
  if (session && !session.isCompleted && now > session.expiresAt.getTime()) {
    session.verdict = 'expired';
    await session.save();
  }

  const canStartNewSession =
    !session ||
    (retry === 'true' && (session.isCompleted === false || session.verdict === 'expired' || session.verdict === 'failed'));

  if (canStartNewSession) {
    // Collect all available coding challenges in this level's question pool
    const poolIds: string[] = [];
    if (Array.isArray(level.codingChallengePool)) {
      level.codingChallengePool.forEach((id: any) => id && poolIds.push(id.toString()));
    }
    if (level.codingChallengeId) {
      poolIds.push(level.codingChallengeId.toString());
    }

    // Also include any challenges where levelId = level._id
    const explicitChallenges = await CodingChallenge.find({ levelId: level._id })
      .select('_id')
      .lean();
    explicitChallenges.forEach((c) => poolIds.push(c._id.toString()));

    const uniquePool = Array.from(new Set(poolIds));
    if (uniquePool.length === 0) {
      throw ApiError.badRequest(
        'No coding questions have been uploaded for this level yet. Please ask your administrator to upload questions.'
      );
    }

    // Assign 2 RANDOM questions (or 1 if only 1 exists)
    let assignedIds: mongoose.Types.ObjectId[] = [];
    if (uniquePool.length >= 2) {
      const shuffled = [...uniquePool].sort(() => 0.5 - Math.random());
      assignedIds = [
        new mongoose.Types.ObjectId(shuffled[0]),
        new mongoose.Types.ObjectId(shuffled[1]),
      ];
    } else {
      assignedIds = [new mongoose.Types.ObjectId(uniquePool[0])];
    }

    const durationMinutes = level.codingTimeLimitMinutes || 60; // 1 hour timing
    const startTime = new Date();
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    session = new LevelAssessmentSession({
      student: userId,
      level: level._id,
      domain: level.domainId,
      assignedQuestions: assignedIds,
      timeLimitMinutes: durationMinutes,
      startTime,
      expiresAt,
      isCompleted: false,
      verdict: 'in_progress',
      submissions: assignedIds.map((id) => ({
        challengeId: id,
        language: 'python',
        code: '',
        status: 'unattempted',
        score: 0,
        passed: 0,
        total: 0,
        submittedAt: null,
      })),
    });

    await session.save();
  }

  if (!session) {
    throw ApiError.badRequest('Failed to initialize assessment session');
  }

  // Populate assigned questions (SAFE: only visible test cases)
  const challengeDocs = await CodingChallenge.find({
    _id: { $in: session.assignedQuestions },
  });

  const challengesMap = new Map<string, any>();
  challengeDocs.forEach((c) => {
    const starterCodeObj: Record<string, string> = {};
    if (c.starterCode) {
      c.starterCode.forEach((val, key) => {
        starterCodeObj[key] = val;
      });
    }

    const visibleTestCases = c.testCases
      .filter((tc) => !tc.isHidden)
      .map((tc, index) => ({
        testCaseIndex: index + 1,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
      }));

    challengesMap.set(c._id.toString(), {
      id: c._id.toString(),
      title: c.title,
      description: c.description,
      inputFormat: c.inputFormat || '',
      outputFormat: c.outputFormat || '',
      constraints: c.constraints || '',
      sampleInput: c.sampleInput || '',
      sampleOutput: c.sampleOutput || '',
      difficulty: c.difficulty || 'Medium',
      allowedLanguages: c.allowedLanguages,
      starterCode: starterCodeObj,
      visibleTestCases,
      timeLimitMinutes: session.timeLimitMinutes,
    });
  });

  // Preserve order of assigned questions
  const populatedQuestions = session.assignedQuestions.map((qId) => {
    const cData = challengesMap.get(qId.toString());
    const subInfo = session.submissions.find(
      (s) => s.challengeId.toString() === qId.toString()
    );

    return {
      ...(cData || { id: qId.toString(), title: 'Problem', allowedLanguages: ['python'], starterCode: {}, visibleTestCases: [] }),
      submission: subInfo
        ? {
            status: subInfo.status,
            score: subInfo.score,
            passed: subInfo.passed,
            total: subInfo.total,
            language: subInfo.language,
            code: subInfo.code,
            submittedAt: subInfo.submittedAt,
          }
        : null,
    };
  });

  const remainingSeconds = Math.max(
    0,
    Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
  );

  return reply.send({
    success: true,
    data: {
      sessionId: session._id.toString(),
      levelId: level._id.toString(),
      levelTitle: level.title,
      levelNumber: level.levelNumber,
      domainId: level.domainId.toString(),
      timeLimitMinutes: session.timeLimitMinutes,
      startTime: session.startTime,
      expiresAt: session.expiresAt,
      remainingSeconds,
      isCompleted: session.isCompleted,
      verdict: session.verdict,
      completedAt: session.completedAt,
      questions: populatedQuestions,
    },
  });
};

/**
 * POST /api/assessments/code/level/:levelId/submit
 * Submits solution for one of the assigned questions in a level assessment session.
 * Evaluates all test cases, records progress, and if all assigned questions pass, completes level and unlocks next level!
 */
export const submitLevelAssessmentCode = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { levelId } = request.params as { levelId: string };
  const user = request.user;
  if (!user) {
    throw ApiError.unauthorized('Authentication required');
  }

  checkExecutionRateLimit(user.id);

  const { problemId, language, code, integrityEvents } = request.body as {
    problemId?: string;
    language?: string;
    code?: string;
    integrityEvents?: any[];
  };

  if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
    throw ApiError.badRequest('Valid problemId is required');
  }
  if (!code || typeof code !== 'string') {
    throw ApiError.badRequest('Source code must be provided');
  }

  const userId = new mongoose.Types.ObjectId(user.id);
  const session = await LevelAssessmentSession.findOne({
    student: userId,
    level: new mongoose.Types.ObjectId(levelId),
  }).sort({ createdAt: -1 });

  if (!session) {
    throw ApiError.badRequest('No active assessment session found for this level');
  }

  if (session.isCompleted) {
    throw ApiError.badRequest('This assessment session has already been completed');
  }

  const isAssigned = session.assignedQuestions.some(
    (id) => id.toString() === problemId
  );
  if (!isAssigned) {
    throw ApiError.badRequest('This question is not part of your assigned assessment session');
  }

  // Grace period of 15 seconds after expiry
  if (Date.now() > session.expiresAt.getTime() + 15000) {
    session.verdict = 'expired';
    await session.save();
    throw ApiError.badRequest('Time limit for this coding assessment has expired');
  }

  const challenge = await CodingChallenge.findById(problemId);
  if (!challenge) {
    throw ApiError.notFound('Coding challenge not found');
  }

  const normalizedLanguage = rceService.normalizeAndValidateLanguage(language);
  if (!challenge.allowedLanguages.includes(normalizedLanguage)) {
    throw ApiError.badRequest(`Language "${normalizedLanguage}" is not permitted`);
  }

  const allTestCases = challenge.testCases.slice(0, MAX_TOTAL_TESTCASES_PER_REQUEST);
  const detailedResults = [];
  let passedCount = 0;
  let finalStatus: any = 'passed';

  for (let i = 0; i < allTestCases.length; i++) {
    const tc = allTestCases[i];
    const execRes = await rceService.executeCode({
      language: normalizedLanguage,
      sourceCode: code,
      stdin: tc.input,
      timeoutMs: 6000,
    });

    if (execRes.status === 'compilation_error') {
      finalStatus = 'compilation_error';
      detailedResults.push({
        testCaseIndex: i + 1,
        passed: false,
        stdout: '',
        stderr: execRes.error || execRes.stderr,
        isHidden: tc.isHidden,
        executionTimeMs: execRes.executionTimeMs,
      });
      break;
    }

    if (execRes.status === 'runtime_error') {
      if (finalStatus === 'passed') finalStatus = 'runtime_error';
      detailedResults.push({
        testCaseIndex: i + 1,
        passed: false,
        stdout: tc.isHidden ? '[HIDDEN]' : execRes.stdout,
        stderr: tc.isHidden ? '' : execRes.stderr,
        isHidden: tc.isHidden,
        executionTimeMs: execRes.executionTimeMs,
      });
      continue;
    }

    const normalizedActual = normalizeOutput(execRes.stdout);
    const normalizedExpected = normalizeOutput(tc.expectedOutput);
    const isPassed = execRes.status === 'success' && normalizedActual === normalizedExpected;

    if (isPassed) {
      passedCount++;
    } else if (finalStatus === 'passed') {
      finalStatus = execRes.status === 'timeout' ? 'timeout' : 'failed';
    }

    detailedResults.push({
      testCaseIndex: i + 1,
      passed: isPassed,
      stdout: tc.isHidden ? '[HIDDEN]' : execRes.stdout,
      stderr: tc.isHidden ? '' : execRes.stderr,
      isHidden: tc.isHidden,
      executionTimeMs: execRes.executionTimeMs,
    });
  }

  const total = allTestCases.length;
  const score = total > 0 ? Math.round((passedCount / total) * 100) : 0;
  const submissionStatus = passedCount === total ? 'passed' : finalStatus;

  // Save CodingSubmission
  const submission = new CodingSubmission({
    student: userId,
    challenge: challenge._id,
    language: normalizedLanguage,
    code,
    score,
    passed: passedCount,
    total,
    status: submissionStatus,
    isLocked: true,
    results: detailedResults,
    submittedAt: new Date(),
  });
  await submission.save();

  // Update session submissions array
  let subIndex = session.submissions.findIndex(
    (s) => s.challengeId.toString() === problemId
  );
  const subRecord: any = {
    challengeId: challenge._id,
    submissionId: submission._id,
    language: normalizedLanguage,
    code,
    status: submissionStatus,
    score,
    passed: passedCount,
    total,
    submittedAt: new Date(),
  };

  if (subIndex >= 0) {
    session.submissions[subIndex] = subRecord;
  } else {
    session.submissions.push(subRecord);
  }

  // Check if all assigned questions are passed
  const allPassed =
    session.assignedQuestions.length > 0 &&
    session.assignedQuestions.every((qId) => {
      const sub = session.submissions.find(
        (s) => s.challengeId.toString() === qId.toString()
      );
      return sub && sub.status === 'passed';
    });

  let levelCompleted = false;
  let unlockedNextLevel = false;
  let nextLevelId: string | null = null;
  let pointsAwarded = 0;

  if (allPassed) {
    session.isCompleted = true;
    session.verdict = 'passed';
    session.completedAt = new Date();
    levelCompleted = true;

    const levelDoc = await Level.findById(levelId);
    if (levelDoc) {
      // 1. Mark completed in student progress
      const existingProgress = await StudentProgress.findOne({ userId }).lean();
      const existingCompleted = new Set(
        (existingProgress?.completedLevels || []).map((id) => id.toString())
      );

      if (!existingCompleted.has(levelDoc._id.toString())) {
        pointsAwarded =
          typeof levelDoc.points === 'number' && levelDoc.points >= 0
            ? levelDoc.points
            : getDefaultPointsForLevel(levelDoc.levelNumber);

        if (pointsAwarded > 0) {
          await User.findByIdAndUpdate(user.id, { $inc: { points: pointsAwarded } });
        }
      }

      const updateOp: any = {
        $addToSet: {
          completedLevels: levelDoc._id,
          completedCodingChallenges: { $each: session.assignedQuestions },
        },
      };

      if (levelDoc.assessmentId) {
        updateOp.$addToSet.unlockedAssessments = levelDoc.assessmentId;
      }

      await StudentProgress.findOneAndUpdate({ userId }, updateOp, { upsert: true });

      // Unlock next level in domain
      const nextLevel = await Level.findOne({
        domainId: levelDoc.domainId,
        levelNumber: levelDoc.levelNumber + 1,
      }).lean();

      if (nextLevel) {
        unlockedNextLevel = true;
        nextLevelId = nextLevel._id.toString();
      }

      // Update enrollment
      await DomainEnrollment.findOneAndUpdate(
        { userId, domainId: levelDoc.domainId },
        { status: 'in_progress', updatedAt: new Date() },
        { upsert: true }
      );
    }
  }

  await session.save();

  return reply.send({
    success: true,
    submitted: true,
    problemResult: {
      problemId: challenge._id.toString(),
      status: submissionStatus,
      score,
      passed: passedCount,
      total,
      results: detailedResults,
    },
    allPassed,
    levelCompleted,
    unlockedNextLevel,
    nextLevelId,
    pointsAwarded,
  });
};

/**
 * GET /api/assessments/code/level/:levelId/pool (Admin / Faculty)
 * View question pool of a specific course level.
 */
export const getLevelPool = async (request: FastifyRequest, reply: FastifyReply) => {
  const { levelId } = request.params as { levelId: string };
  if (!mongoose.Types.ObjectId.isValid(levelId)) {
    throw ApiError.badRequest('Invalid level ID');
  }

  const level = await Level.findById(levelId).lean();
  if (!level) {
    throw ApiError.notFound('Level not found');
  }

  const poolIds: string[] = [];
  if (Array.isArray(level.codingChallengePool)) {
    level.codingChallengePool.forEach((id: any) => id && poolIds.push(id.toString()));
  }
  if (level.codingChallengeId) {
    poolIds.push(level.codingChallengeId.toString());
  }

  const explicitChallenges = await CodingChallenge.find({ levelId: level._id })
    .select('_id')
    .lean();
  explicitChallenges.forEach((c) => poolIds.push(c._id.toString()));

  const uniquePool = Array.from(new Set(poolIds));
  const challenges = await CodingChallenge.find({
    _id: { $in: uniquePool },
  }).sort({ createdAt: -1 });

  return reply.send({
    success: true,
    data: {
      levelId: level._id.toString(),
      levelTitle: level.title,
      levelNumber: level.levelNumber,
      poolCount: challenges.length,
      challenges,
    },
  });
};

/**
 * POST /api/assessments/code/level/:levelId/pool (Admin / Faculty)
 * Add or remove questions from a level's pool.
 */
export const updateLevelPool = async (request: FastifyRequest, reply: FastifyReply) => {
  const { levelId } = request.params as { levelId: string };
  const { challengeId, action } = request.body as {
    challengeId: string;
    action: 'add' | 'remove';
  };

  if (!mongoose.Types.ObjectId.isValid(levelId) || !mongoose.Types.ObjectId.isValid(challengeId)) {
    throw ApiError.badRequest('Invalid IDs provided');
  }

  const level = await Level.findById(levelId);
  if (!level) {
    throw ApiError.notFound('Level not found');
  }

  if (action === 'add') {
    if (!Array.isArray(level.codingChallengePool)) {
      level.codingChallengePool = [];
    }
    const cObjId = new mongoose.Types.ObjectId(challengeId);
    if (!level.codingChallengePool.some((id) => id.toString() === challengeId)) {
      level.codingChallengePool.push(cObjId);
    }
    if (!level.codingChallengeId) {
      level.codingChallengeId = cObjId;
    }
    await level.save();
    await CodingChallenge.findByIdAndUpdate(challengeId, {
      isCourseChallenge: true,
      levelId: level._id,
      domainId: level.domainId,
    });
  } else if (action === 'remove') {
    if (Array.isArray(level.codingChallengePool)) {
      level.codingChallengePool = level.codingChallengePool.filter(
        (id) => id.toString() !== challengeId
      );
    }
    if (level.codingChallengeId && level.codingChallengeId.toString() === challengeId) {
      level.codingChallengeId = (level.codingChallengePool && level.codingChallengePool[0]) || null;
    }
    await level.save();
  } else {
    throw ApiError.badRequest('Action must be "add" or "remove"');
  }

  return reply.send({
    success: true,
    message: `Question pool successfully updated for Level ${level.levelNumber}`,
    poolCount: level.codingChallengePool?.length || 0,
  });
};

export default {
  getCodingChallenge,
  listCodingChallenges,
  getMySubmissions,
  executeCode,
  submitAssessmentCode,
  recordIntegrityEvent,
  createCodingChallenge,
  listAdminCodingChallenges,
  getAdminChallengeDetails,
  updateCodingChallenge,
  deleteCodingChallenge,
  getCodingChallengeSubmissions,
  downloadSampleTemplate,
  bulkUploadCodingChallenges,
  getLevelAssessmentSession,
  submitLevelAssessmentCode,
  getLevelPool,
  updateLevelPool,
};


