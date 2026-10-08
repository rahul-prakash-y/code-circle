import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import CodingChallenge, {
  ICodingChallenge,
  ITestCase,
  SupportedLanguage,
} from '../models/codingChallengeModel';
import CodingSubmission from '../models/codingSubmissionModel';
import Level, { getDefaultPointsForLevel } from '../models/levelModel';
import User from '../models/userModel';
import StudentProgress from '../models/studentProgressModel';
import DomainEnrollment from '../models/domainEnrollmentModel';
import rceService from '../services/rceService';
import { ApiError } from '../utils/ApiError';

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
 * GET /api/assessments/code/challenges
 * List available coding challenges for students.
 */
export const listCodingChallenges = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = request.user;
  const isPrivileged =
    user?.role === 'Admin' || user?.role === 'SuperAdmin' || user?.role === 'Faculty';

  const filter = isPrivileged ? {} : { isPublished: true };

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
 * Admin view of all coding challenges with submission metrics.
 */
export const listAdminCodingChallenges = async (request: FastifyRequest, reply: FastifyReply) => {
  const challenges = await CodingChallenge.find().sort({ createdAt: -1 });

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
};

