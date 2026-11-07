import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import crypto from 'crypto';
import Assessment, { IAssessment, IAssessmentQuestion } from '../models/assessmentModel';
import AssessmentSubmission from '../models/assessmentSubmissionModel';
import User from '../models/userModel';
import PointTransaction from '../models/pointTransactionModel';
import AuditLog from '../models/auditLogModel';
import submissionQueue, { QueueOverflowError } from '../services/submissionQueueService';
import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';
import { shuffleQuestionsAndOptions } from '../utils/shuffle';
import { parseSpreadsheetBuffer } from '../utils/safeSpreadsheetParser';

export interface CreateAssessmentBody {
  title: string;
  description?: string;
  category?: string;
  eventId?: string | null;
  timeLimitMinutes?: number;
  passingScorePercentage?: number;
  customPoints?: number;
  serverCheckpointIntervalSeconds?: number;
  submissionGraceWindowSeconds?: number;
  deadline?: Date | string | null;
  startTime?: Date | string | null;
  questions: {
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
    points?: number;
  }[];
  isPublished?: boolean;
}

export interface SubmitAssessmentBody {
  submissionId?: string;
  clientTimestamp?: number | string;
  answers: {
    questionId?: string;
    selectedOptionId?: string;
    selectedOptionText?: string;
    questionIndex?: number;
    selectedOption?: number;
  }[];
  timeSpentSeconds?: number;
}

export const getAssessments = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const query = request.query as any;
    const { category, eventId, search } = query;
    const filter: any = {};

    const isAdmin =
      user.role === 'Admin' ||
      user.role === 'SuperAdmin' ||
      user.role === 'Faculty' ||
      user.role === 'Committee';

    // Students only see published assessments
    if (!isAdmin) {
      filter.isPublished = true;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (eventId) {
      filter.eventId = new mongoose.Types.ObjectId(eventId);
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const { page, limit, skip, sortBy, sortOrder } = parsePaginationParams(query, {
      defaultLimit: 20,
      maxLimit: 100,
      defaultSortBy: 'createdAt',
      allowedSortFields: ['createdAt', 'title', 'category'],
    });

    const sortObj: any = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    sortObj._id = -1;

    const [total, assessments] = await Promise.all([
      Assessment.countDocuments(filter),
      Assessment.find(filter)
        .populate('eventId', 'title date type status')
        .populate('createdBy', 'name email role')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Fetch student's own submissions only for the assessments on this page
    const pageAssessmentIds = assessments.map((a: any) => a._id);
    const submissionMap = new Map<string, any>();

    if (pageAssessmentIds.length > 0) {
      const userSubmissions = await AssessmentSubmission.find({
        assessment: { $in: pageAssessmentIds },
        user: user.id,
      })
        .sort({ createdAt: -1 })
        .lean();

      for (const sub of userSubmissions) {
        const aId = sub.assessment.toString();
        if (!submissionMap.has(aId)) {
          submissionMap.set(aId, sub);
        }
      }
    }

    const sanitizedAssessments = assessments.map((assessment: any) => {
      const mySub = submissionMap.get(assessment._id.toString());
      const totalPoints = assessment.questions.reduce(
        (acc: number, q: any) => acc + (q.points || 1),
        0
      );

      // If user is not admin, do not expose answer keys and explanations in list
      const sanitizedQuestions = isAdmin
        ? assessment.questions
        : assessment.questions.map((q: any) => ({
            _id: q._id,
            questionText: q.questionText,
            options: q.options,
            points: q.points || 1,
          }));

      return {
        ...assessment,
        questionsCount: assessment.questions.length,
        totalPoints,
        questions: sanitizedQuestions,
        mySubmission: mySub
          ? {
              _id: mySub._id,
              score: mySub.score,
              totalPoints: mySub.totalPoints,
              percentage: mySub.percentage,
              passed: mySub.passed,
              pointsAwarded: mySub.pointsAwarded || 0,
              timeSpentSeconds: mySub.timeSpentSeconds,
              createdAt: mySub.createdAt,
            }
          : null,
      };
    });

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      count: sanitizedAssessments.length,
      pagination,
      data: sanitizedAssessments,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to fetch assessments',
    });
  }
};

export const getAssessmentById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid assessment ID' });
    }

    const assessment = await Assessment.findById(id)
      .populate('eventId', 'title date type status')
      .populate('createdBy', 'name email role')
      .lean();

    if (!assessment) {
      return reply.status(404).send({ success: false, error: 'Assessment not found' });
    }

    const isAdmin =
      user.role === 'Admin' ||
      user.role === 'SuperAdmin' ||
      user.role === 'Faculty' ||
      user.role === 'Committee';

    if (!isAdmin && !assessment.isPublished) {
      return reply.status(403).send({ success: false, error: 'Assessment is not currently available' });
    }

    // Get user's previous submission if any
    const latestSubmission = await AssessmentSubmission.findOne({
      assessment: assessment._id,
      user: user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const totalPoints = assessment.questions.reduce(
      (acc: number, q: any) => acc + (q.points || 1),
      0
    );

    // ANTI-CHEAT SANITIZATION & NEIGHBOR COPYING PREVENTION FOR STUDENTS:
    // Securely shuffles question order AND shuffles options within each question (A/B/C/D).
    // Stably maps each option to an optionId ('opt_0', 'opt_1'...) so screens in the exam room are randomized.
    // Strip correctOptionIndex and explanation during test taking!
    const questions = isAdmin
      ? assessment.questions
      : shuffleQuestionsAndOptions(assessment.questions);

    return reply.send({
      success: true,
      data: {
        ...assessment,
        questions,
        questionsCount: assessment.questions.length,
        totalPoints,
        mySubmission: latestSubmission,
      },
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to fetch assessment',
    });
  }
};

export const createAssessment = async (
  request: FastifyRequest<{ Body: CreateAssessmentBody }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const {
      title,
      description = '',
      category = 'Technical',
      eventId = null,
      timeLimitMinutes = 30,
      passingScorePercentage = 60,
      customPoints = 50,
      questions = [],
      isPublished = true,
    } = request.body;

    if (!title || !title.trim()) {
      return reply.status(400).send({ success: false, error: 'Assessment title is required' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'Assessment must contain at least one question',
      });
    }

    // Validate dynamic MCQs
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || !q.questionText.trim()) {
        return reply.status(400).send({
          success: false,
          error: `Question #${i + 1} is missing question text`,
        });
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return reply.status(400).send({
          success: false,
          error: `Question #${i + 1} must have at least 2 options`,
        });
      }
      if (
        typeof q.correctOptionIndex !== 'number' ||
        q.correctOptionIndex < 0 ||
        q.correctOptionIndex >= q.options.length
      ) {
        return reply.status(400).send({
          success: false,
          error: `Question #${i + 1} has an invalid correct option index`,
        });
      }
    }

    const parsedCustomPoints =
      typeof customPoints === 'number' && !isNaN(customPoints) && customPoints >= 0
        ? customPoints
        : 50;

    const assessment = await Assessment.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      eventId: eventId && mongoose.Types.ObjectId.isValid(eventId) ? new mongoose.Types.ObjectId(eventId) : null,
      timeLimitMinutes: Number(timeLimitMinutes) || 30,
      passingScorePercentage: Number(passingScorePercentage) || 60,
      customPoints: parsedCustomPoints,
      questions: questions.map((q) => ({
        questionText: q.questionText.trim(),
        options: q.options.map((opt) => opt.trim()),
        correctOptionIndex: Number(q.correctOptionIndex),
        explanation: (q.explanation || '').trim(),
        points: Number(q.points) || 1,
      })),
      isPublished: Boolean(isPublished),
      createdBy: new mongoose.Types.ObjectId(user.id),
    });

    return reply.status(201).send({
      success: true,
      message: 'Assessment created successfully',
      data: assessment,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to create assessment',
    });
  }
};

export const updateAssessment = async (
  request: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateAssessmentBody> }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid assessment ID' });
    }

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return reply.status(404).send({ success: false, error: 'Assessment not found' });
    }

    const updates = request.body;

    if (updates.questions) {
      if (!Array.isArray(updates.questions) || updates.questions.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Assessment must contain at least one question',
        });
      }

      for (let i = 0; i < updates.questions.length; i++) {
        const q = updates.questions[i];
        if (!q.questionText || !q.questionText.trim()) {
          return reply.status(400).send({
            success: false,
            error: `Question #${i + 1} is missing question text`,
          });
        }
        if (!Array.isArray(q.options) || q.options.length < 2) {
          return reply.status(400).send({
            success: false,
            error: `Question #${i + 1} must have at least 2 options`,
          });
        }
        if (
          typeof q.correctOptionIndex !== 'number' ||
          q.correctOptionIndex < 0 ||
          q.correctOptionIndex >= q.options.length
        ) {
          return reply.status(400).send({
            success: false,
            error: `Question #${i + 1} has an invalid correct option index`,
          });
        }
      }
      assessment.questions = updates.questions as any;
    }

    if (updates.title !== undefined) assessment.title = updates.title.trim();
    if (updates.description !== undefined) assessment.description = updates.description.trim();
    if (updates.category !== undefined) assessment.category = updates.category.trim();
    if (updates.eventId !== undefined) {
      assessment.eventId =
        updates.eventId && mongoose.Types.ObjectId.isValid(updates.eventId)
          ? new mongoose.Types.ObjectId(updates.eventId)
          : null;
    }
    if (updates.timeLimitMinutes !== undefined) {
      assessment.timeLimitMinutes = Number(updates.timeLimitMinutes);
    }
    if (updates.passingScorePercentage !== undefined) {
      assessment.passingScorePercentage = Number(updates.passingScorePercentage);
    }
    if (updates.customPoints !== undefined) {
      assessment.customPoints = Math.max(0, Number(updates.customPoints) || 0);
    }
    if (updates.isPublished !== undefined) {
      assessment.isPublished = Boolean(updates.isPublished);
    }

    await assessment.save();

    return reply.send({
      success: true,
      message: 'Assessment updated successfully',
      data: assessment,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to update assessment',
    });
  }
};

export const deleteAssessment = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid assessment ID' });
    }

    const assessment = await Assessment.findByIdAndDelete(id);
    if (!assessment) {
      return reply.status(404).send({ success: false, error: 'Assessment not found' });
    }

    // Clean up associated submissions
    await AssessmentSubmission.deleteMany({ assessment: id });

    return reply.send({
      success: true,
      message: 'Assessment and related submissions deleted successfully',
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to delete assessment',
    });
  }
};

export const submitAssessment = async (
  request: FastifyRequest<{ Params: { id: string }; Body: SubmitAssessmentBody }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid assessment ID' });
    }

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return reply.status(404).send({ success: false, error: 'Assessment not found' });
    }

    const { answers = [], timeSpentSeconds = 0 } = request.body;

    // 1. Validate / retrieve submissionId (UUID from client for idempotency)
    const submissionId =
      typeof request.body?.submissionId === 'string' && request.body.submissionId.trim().length > 0
        ? request.body.submissionId.trim()
        : crypto.randomUUID();

    // 2. Validate deadline server-side (never trusting client time)
    const now = Date.now();
    let isLate = false;
    let submissionStatus: 'on_time' | 'late' | 'review' = 'on_time';

    const graceWindowSeconds =
      typeof assessment.submissionGraceWindowSeconds === 'number'
        ? assessment.submissionGraceWindowSeconds
        : 120;
    const graceWindowMs = graceWindowSeconds * 1000;

    if (assessment.deadline) {
      const deadlineMs = new Date(assessment.deadline).getTime();
      if (!isNaN(deadlineMs)) {
        if (now > deadlineMs + graceWindowMs) {
          return reply.status(400).send({
            success: false,
            error: 'Submission deadline has passed. Late submissions outside grace window are rejected.',
            code: 'DEADLINE_EXCEEDED',
            deadline: assessment.deadline,
            graceWindowSeconds,
          });
        } else if (now > deadlineMs) {
          isLate = true;
          submissionStatus = 'late';
        }
      }
    }

    // SERVER-SIDE SCORING ENGINE (Resistant to Question and Option Order Randomization)
    // Supports lookup by questionId (ObjectId string) or fallback to questionIndex.
    // Supports evaluation by optionId (e.g., 'opt_0'), optionText, or fallback index.
    const answerByQuestionId = new Map<string, any>();
    const answerByIndex = new Map<number, any>();

    for (const ans of answers) {
      if (ans.questionId) {
        answerByQuestionId.set(String(ans.questionId), ans);
      }
      if (typeof ans.questionIndex === 'number') {
        answerByIndex.set(ans.questionIndex, ans);
      }
    }

    let earnedPoints = 0;
    let totalPoints = 0;
    const detailedResults = [];

    for (let i = 0; i < assessment.questions.length; i++) {
      const q = assessment.questions[i];
      const qIdStr = q._id ? q._id.toString() : '';
      const qPoints = q.points || 1;
      totalPoints += qPoints;

      // Find answer for this canonical question
      const studentAns = (qIdStr && answerByQuestionId.get(qIdStr)) || answerByIndex.get(i);

      let isCorrect = false;
      let selectedOptionIndex = -1;
      let selectedOptionId = '';
      let selectedOptionText = '';

      const correctOptionText = Array.isArray(q.options) && q.options[q.correctOptionIndex]
        ? String(q.options[q.correctOptionIndex])
        : '';
      const correctOptionId = `opt_${q.correctOptionIndex}`;

      if (studentAns) {
        selectedOptionId = studentAns.selectedOptionId || '';
        selectedOptionText = studentAns.selectedOptionText || '';

        // 1. Evaluate by optionId ('opt_0', 'opt_1', ...)
        if (selectedOptionId) {
          isCorrect = selectedOptionId.toLowerCase() === correctOptionId.toLowerCase();
          const matchIndex = parseInt(selectedOptionId.replace(/^opt_/i, ''), 10);
          if (!isNaN(matchIndex) && matchIndex >= 0 && matchIndex < q.options.length) {
            selectedOptionIndex = matchIndex;
            if (!selectedOptionText) {
              selectedOptionText = q.options[matchIndex];
            }
          }
        }
        // 2. Evaluate by option text value comparison
        else if (selectedOptionText && typeof selectedOptionText === 'string') {
          isCorrect = selectedOptionText.trim().toLowerCase() === correctOptionText.trim().toLowerCase();
          selectedOptionIndex = q.options.findIndex(
            (opt: string) => opt.trim().toLowerCase() === selectedOptionText.trim().toLowerCase()
          );
        }
        // 3. Fallback to legacy selectedOption index
        else if (typeof studentAns.selectedOption === 'number' && studentAns.selectedOption >= 0) {
          selectedOptionIndex = studentAns.selectedOption;
          isCorrect = selectedOptionIndex === q.correctOptionIndex;
          if (Array.isArray(q.options) && q.options[selectedOptionIndex]) {
            selectedOptionText = q.options[selectedOptionIndex];
          }
        }
      }

      if (isCorrect) {
        earnedPoints += qPoints;
      }

      detailedResults.push({
        questionId: q._id,
        questionIndex: i,
        questionText: q.questionText,
        selectedOption: selectedOptionIndex,
        selectedOptionId,
        selectedOptionText,
        correctOptionIndex: q.correctOptionIndex,
        correctOptionId,
        correctOptionText,
        isCorrect,
        points: qPoints,
        explanation: q.explanation || '',
      });
    }

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 1000) / 10 : 0;
    const passed = percentage >= assessment.passingScorePercentage;

    const customPts =
      typeof assessment.customPoints === 'number' && assessment.customPoints > 0
        ? assessment.customPoints
        : 50;

    let pointsAwarded = 0;
    if (passed) {
      // Check if user previously had points awarded for this assessment
      const priorTx = await PointTransaction.findOne({
        user: new mongoose.Types.ObjectId(user.id),
        category: 'Assessment',
        referenceId: assessment._id.toString(),
      });

      const priorPassingAward = await AssessmentSubmission.findOne({
        assessment: assessment._id,
        user: new mongoose.Types.ObjectId(user.id),
        pointsAwarded: { $gt: 0 },
      });

      if (!priorTx && !priorPassingAward) {
        pointsAwarded = customPts;
      }
    }

    const queuedPayload = {
      submissionId,
      userId: user.id,
      assessmentId: assessment._id.toString(),
      assessmentTitle: assessment.title,
      answers: answers.map((ans, idx) => ({
        questionId:
          ans.questionId && mongoose.Types.ObjectId.isValid(ans.questionId)
            ? new mongoose.Types.ObjectId(ans.questionId)
            : undefined,
        selectedOptionId: ans.selectedOptionId,
        selectedOptionText: ans.selectedOptionText,
        questionIndex: ans.questionIndex !== undefined ? ans.questionIndex : idx,
        selectedOption: ans.selectedOption !== undefined ? ans.selectedOption : -1,
      })),
      score: earnedPoints,
      totalPoints,
      percentage,
      passed,
      pointsAwarded,
      timeSpentSeconds: Math.max(0, Number(timeSpentSeconds) || 0),
      detailedResults,
      isLate,
      submissionStatus,
      enqueuedAt: new Date(),
      submittedAt: new Date(),
      passingScorePercentage: assessment.passingScorePercentage,
      customPoints: assessment.customPoints ?? 50,
    };

    // Enqueue into in-memory bounded queue
    const enqueueResult = await submissionQueue.enqueue(queuedPayload);

    if (enqueueResult.status === 'saved') {
      const updatedUser = await User.findById(user.id).select('points');
      return reply.status(200).send({
        success: true,
        status: 'saved',
        message: passed
          ? (pointsAwarded > 0
              ? `Congratulations! You passed the assessment and earned ${pointsAwarded} points!`
              : 'Congratulations! You passed the assessment.')
          : 'Assessment completed.',
        data: enqueueResult.data || {
          submissionId,
          assessmentId: assessment._id,
          title: assessment.title,
          score: earnedPoints,
          totalPoints,
          percentage,
          passed,
          pointsAwarded,
          userTotalPoints: updatedUser?.points ?? 0,
          customPoints: assessment.customPoints ?? 50,
          passingScorePercentage: assessment.passingScorePercentage,
          timeSpentSeconds: queuedPayload.timeSpentSeconds,
          detailedResults,
          isLate,
          submissionStatus,
          submittedAt: queuedPayload.submittedAt,
        },
      });
    }

    // Response when enqueued and waiting for MongoDB batch flush confirmation
    return reply.status(202).send({
      success: true,
      status: 'pending',
      submissionId,
      message: 'Submission enqueued for durable storage. Awaiting batch flusher confirmation.',
      isLate,
      submissionStatus,
    });
  } catch (error: any) {
    if (error instanceof QueueOverflowError) {
      reply.header('Retry-After', String(error.retryAfterSeconds));
      return reply.status(503).send({
        success: false,
        status: 'rejected',
        code: error.code,
        error: error.message,
        retryAfterSeconds: error.retryAfterSeconds,
      });
    }
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to evaluate assessment submission',
    });
  }
};

/**
 * GET /api/assessments/:id/submission-status/:submissionId
 * Check durable persistence confirmation for an enqueued submission.
 */
export const getSubmissionStatus = async (
  request: FastifyRequest<{ Params: { id: string; submissionId: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id, submissionId } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !submissionId) {
      return reply.status(400).send({ success: false, error: 'Invalid parameters' });
    }

    const statusResult = await submissionQueue.getStatus(user.id, id, submissionId);

    if (statusResult.status === 'not_found') {
      return reply.status(404).send({
        success: false,
        status: 'not_found',
        error: 'Submission not found',
      });
    }

    return reply.status(200).send({
      success: true,
      status: statusResult.status,
      submissionId,
      data: statusResult.data,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to check submission status',
    });
  }
};

/**
 * POST /api/assessments/:id/checkpoint
 * Server-side checkpointing / draft save (Disabled by default: serverCheckpointIntervalSeconds = 0).
 */
export const saveCheckpoint = async (
  request: FastifyRequest<{ Params: { id: string }; Body: { answers?: any[] } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid assessment ID' });
    }

    const assessment = await Assessment.findById(id).select('serverCheckpointIntervalSeconds title');
    if (!assessment) {
      return reply.status(404).send({ success: false, error: 'Assessment not found' });
    }

    const intervalSeconds = assessment.serverCheckpointIntervalSeconds ?? 0;
    if (intervalSeconds <= 0) {
      return reply.status(403).send({
        success: false,
        disabled: true,
        message: 'Server checkpointing is disabled by default for this assessment. Answers are persisted locally.',
      });
    }

    return reply.status(200).send({
      success: true,
      checkpointSaved: true,
      timestamp: new Date(),
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to record server checkpoint',
    });
  }
};

/**
 * Admin Panel Endpoints for In-Memory Submission Queue Monitoring & Management
 */
export const getQueueStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const status = submissionQueue.getQueueStatus();
    return reply.send({
      success: true,
      data: status,
    });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

export const flushQueueNow = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }
    const result = await submissionQueue.flush();

    // Audit log
    await AuditLog.create({
      action: 'SUBMISSION_QUEUE_FLUSH_NOW',
      actorId: new mongoose.Types.ObjectId(user.id),
      actorRole: user.role,
      targetModel: 'SubmissionQueue',
      details: {
        flushedCount: result.flushedCount,
        remainingPending: result.remainingPending,
        failedCount: result.failedCount,
        durationMs: result.durationMs,
      },
      timestamp: new Date(),
    });

    return reply.send({
      success: true,
      message: `Flushed ${result.flushedCount} submission(s) to MongoDB`,
      ...result,
    });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

export const retryFailedQueueItems = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }
    const result = submissionQueue.retryFailed();

    // Audit log
    await AuditLog.create({
      action: 'SUBMISSION_QUEUE_RETRY_FAILED',
      actorId: new mongoose.Types.ObjectId(user.id),
      actorRole: user.role,
      targetModel: 'SubmissionQueue',
      details: result,
      timestamp: new Date(),
    });

    return reply.send({
      success: true,
      message: `Retried ${result.retriedCount} failed submission(s)`,
      ...result,
    });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

export const downloadQueueBackup = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }
    const backup = submissionQueue.exportBackup();

    // Audit log
    await AuditLog.create({
      action: 'SUBMISSION_QUEUE_DOWNLOAD_BACKUP',
      actorId: new mongoose.Types.ObjectId(user.id),
      actorRole: user.role,
      targetModel: 'SubmissionQueue',
      details: {
        nodeId: backup.nodeId,
        pendingCount: backup.pendingCount,
        failedCount: backup.failedCount,
      },
      timestamp: new Date(),
    });

    const filename = `submission-queue-backup-${backup.nodeId}-${Date.now()}.json`;
    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);
    return reply.send(backup);
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

export const getMySubmissions = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { page, limit, skip } = parsePaginationParams(request.query, {
      defaultLimit: 20,
      maxLimit: 100,
      defaultSortBy: 'createdAt',
      allowedSortFields: ['createdAt', 'score', 'percentage'],
    });

    const filter = { user: user.id };

    const [total, submissions] = await Promise.all([
      AssessmentSubmission.countDocuments(filter),
      AssessmentSubmission.find(filter)
        .populate('assessment', 'title category timeLimitMinutes passingScorePercentage eventId')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      count: submissions.length,
      pagination,
      data: submissions,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to fetch submissions',
    });
  }
};

export const getAssessmentSubmissions = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid assessment ID' });
    }

    const assessment = await Assessment.findById(id).lean();
    if (!assessment) {
      return reply.status(404).send({ success: false, error: 'Assessment not found' });
    }

    const { page, limit, skip, sortBy, sortOrder } = parsePaginationParams(request.query, {
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: 'score',
      allowedSortFields: ['score', 'createdAt', 'percentage'],
    });

    const filter = { assessment: id };

    const sortObj: any = {};
    if (sortBy === 'score') {
      sortObj.score = sortOrder === 'asc' ? 1 : -1;
      sortObj.createdAt = -1;
    } else {
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }
    sortObj._id = -1;

    const [total, submissions] = await Promise.all([
      AssessmentSubmission.countDocuments(filter),
      AssessmentSubmission.find(filter)
        .populate('user', 'name rollNo email department profilePicUrl')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const enrichedSubmissions = submissions.map((sub: any) => {
      let detailed = sub.detailedResults || [];
      if (!detailed || detailed.length === 0) {
        const ansMap = new Map<number, number>();
        (sub.answers || []).forEach((a: any) => ansMap.set(a.questionIndex, a.selectedOption));
        detailed = assessment.questions.map((q: any, idx: number) => {
          const selectedOption = ansMap.has(idx) ? ansMap.get(idx)! : -1;
          const isCorrect = selectedOption === q.correctOptionIndex && selectedOption !== -1;
          return {
            questionIndex: idx,
            questionText: q.questionText,
            selectedOption,
            correctOptionIndex: q.correctOptionIndex,
            isCorrect,
            points: q.points || 1,
            explanation: q.explanation || '',
          };
        });
      }
      return {
        ...sub,
        detailedResults: detailed,
      };
    });

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        category: assessment.category,
        timeLimitMinutes: assessment.timeLimitMinutes,
        passingScorePercentage: assessment.passingScorePercentage,
        customPoints: assessment.customPoints,
        questions: assessment.questions,
      },
      count: enrichedSubmissions.length,
      pagination,
      data: enrichedSubmissions,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to fetch assessment submissions',
    });
  }
};

export const getSingleAssessmentSubmissionReport = async (
  request: FastifyRequest<{ Params: { id: string; submissionId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id, submissionId } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(submissionId)) {
      return reply.status(400).send({ success: false, error: 'Invalid ID parameters' });
    }

    const [assessment, submission] = await Promise.all([
      Assessment.findById(id).lean(),
      AssessmentSubmission.findOne({ _id: submissionId, assessment: id })
        .populate('user', 'name rollNo email department profilePicUrl')
        .lean(),
    ]);

    if (!assessment) {
      return reply.status(404).send({ success: false, error: 'Assessment not found' });
    }
    if (!submission) {
      return reply.status(404).send({ success: false, error: 'Submission not found' });
    }

    const studentAnsMap = new Map<number, number>();
    (submission.answers || []).forEach((a: any) => studentAnsMap.set(a.questionIndex, a.selectedOption));

    const questionsReport = assessment.questions.map((q: any, idx: number) => {
      const selectedOption = studentAnsMap.has(idx) ? studentAnsMap.get(idx)! : -1;
      const isCorrect = selectedOption === q.correctOptionIndex && selectedOption !== -1;
      return {
        questionIndex: idx,
        questionText: q.questionText,
        options: q.options || [],
        selectedOption,
        selectedOptionText: selectedOption >= 0 && q.options ? q.options[selectedOption] || '' : 'Unanswered',
        correctOptionIndex: q.correctOptionIndex,
        correctOptionText: q.options ? q.options[q.correctOptionIndex] || '' : '',
        isCorrect,
        points: q.points || 1,
        earnedPoints: isCorrect ? (q.points || 1) : 0,
        explanation: q.explanation || '',
      };
    });

    return reply.send({
      success: true,
      report: {
        assessment: {
          _id: assessment._id,
          title: assessment.title,
          category: assessment.category,
          timeLimitMinutes: assessment.timeLimitMinutes,
          passingScorePercentage: assessment.passingScorePercentage,
        },
        student: submission.user,
        submission: {
          _id: submission._id,
          score: submission.score,
          totalPoints: submission.totalPoints,
          percentage: submission.percentage,
          passed: submission.passed,
          pointsAwarded: submission.pointsAwarded || 0,
          timeSpentSeconds: submission.timeSpentSeconds || 0,
          submittedAt: (submission as any).createdAt,
        },
        questions: questionsReport,
      },
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to fetch submission report',
    });
  }
};

export const exportAssessmentSubmissionsCsv = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid assessment ID' });
    }

    const [assessment, submissions] = await Promise.all([
      Assessment.findById(id).lean(),
      AssessmentSubmission.find({ assessment: id })
        .populate('user', 'name rollNo email department')
        .sort({ score: -1, createdAt: -1 })
        .lean(),
    ]);

    if (!assessment) {
      return reply.status(404).send({ success: false, error: 'Assessment not found' });
    }

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Student Name',
      'Roll Number',
      'Email',
      'Department',
      'Score',
      'Total Points',
      'Percentage',
      'Verdict',
      'Time Spent (seconds)',
      'Submitted At',
      'Question Number',
      'Question Text',
      'Selected Option Index',
      'Selected Option Text',
      'Correct Option Index',
      'Correct Option Text',
      'Question Verdict',
      'Points Earned',
    ];

    const rows: string[] = [headers.join(',')];

    for (const sub of submissions) {
      const student = (sub.user as any) || {};
      const studentName = student.name || 'Anonymous';
      const rollNo = student.rollNo || '';
      const email = student.email || '';
      const dept = student.department || '';
      const score = sub.score;
      const totalPoints = sub.totalPoints;
      const percentage = `${sub.percentage}%`;
      const verdict = sub.passed ? 'PASSED' : 'FAILED';
      const timeSpent = sub.timeSpentSeconds || 0;
      const submittedAt = (sub as any).createdAt ? new Date((sub as any).createdAt).toISOString() : '';

      const ansMap = new Map<number, number>();
      (sub.answers || []).forEach((a: any) => ansMap.set(a.questionIndex, a.selectedOption));

      if (assessment.questions && assessment.questions.length > 0) {
        assessment.questions.forEach((q: any, idx: number) => {
          const selectedOption = ansMap.has(idx) ? ansMap.get(idx)! : -1;
          const isCorrect = selectedOption === q.correctOptionIndex && selectedOption !== -1;
          const selectedText = selectedOption >= 0 && q.options ? q.options[selectedOption] || '' : 'Unanswered';
          const correctText = q.options ? q.options[q.correctOptionIndex] || '' : '';
          const pointsEarned = isCorrect ? (q.points || 1) : 0;

          rows.push(
            [
              escapeCsv(studentName),
              escapeCsv(rollNo),
              escapeCsv(email),
              escapeCsv(dept),
              score,
              totalPoints,
              escapeCsv(percentage),
              escapeCsv(verdict),
              timeSpent,
              escapeCsv(submittedAt),
              idx + 1,
              escapeCsv(q.questionText),
              selectedOption,
              escapeCsv(selectedText),
              q.correctOptionIndex,
              escapeCsv(correctText),
              escapeCsv(isCorrect ? 'CORRECT' : 'INCORRECT'),
              pointsEarned,
            ].join(',')
          );
        });
      } else {
        rows.push(
          [
            escapeCsv(studentName),
            escapeCsv(rollNo),
            escapeCsv(email),
            escapeCsv(dept),
            score,
            totalPoints,
            escapeCsv(percentage),
            escapeCsv(verdict),
            timeSpent,
            escapeCsv(submittedAt),
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
          ].join(',')
        );
      }
    }

    const csvContent = rows.join('\r\n');
    const safeTitle = (assessment.title || 'assessment').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTitle}_submissions_report_${new Date().toISOString().slice(0, 10)}.csv`;

    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csvContent);
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to export assessment submissions',
    });
  }
};

export const deleteAssessmentSubmission = async (
  request: FastifyRequest<{ Params: { id: string; submissionId: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id, submissionId } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(submissionId)) {
      return reply.status(400).send({ success: false, error: 'Invalid ID parameters' });
    }

    const submission = await AssessmentSubmission.findOne({
      _id: submissionId,
      assessment: id,
    });

    if (!submission) {
      return reply.status(404).send({ success: false, error: 'Submission not found' });
    }

    const isAdmin =
      user.role === 'Admin' ||
      user.role === 'SuperAdmin' ||
      user.role === 'Faculty' ||
      user.role === 'Committee';

    // If not admin, verify ownership
    if (!isAdmin && submission.user.toString() !== user.id) {
      return reply.status(403).send({ success: false, error: 'Permission denied to delete this retry' });
    }

    await AssessmentSubmission.findByIdAndDelete(submissionId);

    return reply.send({
      success: true,
      message: 'Assessment retry submission deleted successfully',
      deletedSubmissionId: submissionId,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to delete assessment submission',
    });
  }
};

export const allowStudentReappear = async (
  request: FastifyRequest<{ Params: { id: string; studentId: string }; Body: { reason?: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id, studentId } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return reply.status(400).send({ success: false, error: 'Invalid ID parameters' });
    }

    const { reason } = (request.body || {}) as { reason?: string };
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return reply.status(400).send({
        success: false,
        error: 'A valid reason (minimum 5 characters) is required to grant student reappearance',
      });
    }

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return reply.status(404).send({ success: false, error: 'Assessment not found' });
    }

    // Delete all submissions for this student on this assessment so student can reappear
    const deleteResult = await AssessmentSubmission.deleteMany({
      assessment: id,
      user: studentId,
    });

    // Record audit log entry
    try {
      const AuditLog = (await import('../models/auditLogModel')).default;
      await AuditLog.create({
        action: 'ASSESSMENT_REAPPEAR_GRANTED',
        actorId: new mongoose.Types.ObjectId(user.id),
        actorRole: user.role,
        targetId: new mongoose.Types.ObjectId(studentId),
        targetModel: 'User',
        reason: reason.trim(),
        details: {
          assessmentId: id,
          assessmentTitle: assessment.title,
          deletedSubmissionsCount: deleteResult.deletedCount,
        },
        timestamp: new Date(),
      });
    } catch (auditErr) {
      request.log.warn({ err: auditErr }, '[AssessmentController] Could not write audit log for reappearance');
    }

    return reply.send({
      success: true,
      message: 'Student attempt has been reset. The student is now permitted to reappear for this assessment.',
      deletedCount: deleteResult.deletedCount,
      reason: reason.trim(),
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to reset student assessment attempt',
    });
  }
};

export const resetMyAssessmentSubmission = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid assessment ID' });
    }

    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return reply.status(404).send({ success: false, error: 'Assessment not found' });
    }

    const isPrivileged =
      user.role === 'Admin' ||
      user.role === 'SuperAdmin' ||
      user.role === 'Faculty' ||
      user.role === 'Committee';

    // Graded assessments (any published assessment, or assessment awarding custom points) cannot be self-reset by students
    if (!isPrivileged && (assessment.isPublished || (assessment.customPoints && assessment.customPoints > 0))) {
      return reply.status(403).send({
        success: false,
        error: 'Self-service reset is disabled for graded assessments. Reappearance requires faculty authorization.',
      });
    }

    // Delete student's own submissions for this assessment
    const deleteResult = await AssessmentSubmission.deleteMany({
      assessment: id,
      user: user.id,
    });

    return reply.send({
      success: true,
      message: 'Assessment retry reset successfully. You can now reappear.',
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to reset assessment retry',
    });
  }
};

/**
 * GET /api/assessments/admin/template
 * Download sample Excel template for MCQ questions bulk upload.
 */
export const downloadSampleTemplate = async (request: FastifyRequest, reply: FastifyReply) => {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('MCQ Assessments');

  ws.columns = [
    { header: 'AssessmentTitle', key: 'AssessmentTitle', width: 35 },
    { header: 'Category', key: 'Category', width: 20 },
    { header: 'TimeLimitMinutes', key: 'TimeLimitMinutes', width: 18 },
    { header: 'PassingScorePercentage', key: 'PassingScorePercentage', width: 22 },
    { header: 'CustomPoints', key: 'CustomPoints', width: 15 },
    { header: 'QuestionText', key: 'QuestionText', width: 45 },
    { header: 'OptionA', key: 'OptionA', width: 25 },
    { header: 'OptionB', key: 'OptionB', width: 25 },
    { header: 'OptionC', key: 'OptionC', width: 25 },
    { header: 'OptionD', key: 'OptionD', width: 25 },
    { header: 'CorrectOption', key: 'CorrectOption', width: 15 },
    { header: 'Points', key: 'Points', width: 10 },
    { header: 'Explanation', key: 'Explanation', width: 40 },
  ];

  const sampleData = [
    {
      AssessmentTitle: 'Data Structures & Algorithms MCQ Exam',
      Category: 'Algorithms',
      TimeLimitMinutes: 30,
      PassingScorePercentage: 60,
      CustomPoints: 50,
      QuestionText: 'What is the average time complexity of searching in a Hash Table?',
      OptionA: 'O(1)',
      OptionB: 'O(n)',
      OptionC: 'O(log n)',
      OptionD: 'O(n^2)',
      CorrectOption: 'A',
      Points: 1,
      Explanation: 'Average lookup time in a hash table with good hash distribution is constant O(1).',
    },
    {
      AssessmentTitle: 'Data Structures & Algorithms MCQ Exam',
      Category: 'Algorithms',
      TimeLimitMinutes: 30,
      PassingScorePercentage: 60,
      CustomPoints: 50,
      QuestionText: 'Which data structure operates on a Last In, First Out (LIFO) basis?',
      OptionA: 'Queue',
      OptionB: 'Stack',
      OptionC: 'Binary Tree',
      OptionD: 'Linked List',
      CorrectOption: 'B',
      Points: 1,
      Explanation: 'A Stack operates strictly using LIFO (Last-In First-Out) operations.',
    },
    {
      AssessmentTitle: 'Data Structures & Algorithms MCQ Exam',
      Category: 'Algorithms',
      TimeLimitMinutes: 30,
      PassingScorePercentage: 60,
      CustomPoints: 50,
      QuestionText: 'What is the worst-case time complexity of QuickSort?',
      OptionA: 'O(n log n)',
      OptionB: 'O(n)',
      OptionC: 'O(n^2)',
      OptionD: 'O(log n)',
      CorrectOption: 'C',
      Points: 1,
      Explanation: 'When pivot selection is unbalanced, QuickSort can degrade to O(n^2).',
    },
    {
      AssessmentTitle: 'Modern Web Development & React Architecture',
      Category: 'Web Development',
      TimeLimitMinutes: 25,
      PassingScorePercentage: 70,
      CustomPoints: 75,
      QuestionText: 'Which React hook is used to perform side effects in functional components?',
      OptionA: 'useState',
      OptionB: 'useEffect',
      OptionC: 'useContext',
      OptionD: 'useMemo',
      CorrectOption: 'B',
      Points: 1,
      Explanation: 'useEffect manages lifecycle side-effects such as subscriptions, network requests, and timers.',
    },
    {
      AssessmentTitle: 'Modern Web Development & React Architecture',
      Category: 'Web Development',
      TimeLimitMinutes: 25,
      PassingScorePercentage: 70,
      CustomPoints: 75,
      QuestionText: 'What does the acronym DOM represent in browser engineering?',
      OptionA: 'Document Object Model',
      OptionB: 'Direct Oriented Module',
      OptionC: 'Data Operation Mode',
      OptionD: 'Display Object Management',
      CorrectOption: 'A',
      Points: 1,
      Explanation: 'DOM stands for Document Object Model, representing the living document tree structure in browser memory.',
    },
  ];

  sampleData.forEach((row) => ws.addRow(row));

  const instructions = [
    {
      Column: 'AssessmentTitle',
      Required: 'YES (when creating new)',
      Description: 'Name of the assessment. Rows sharing the same AssessmentTitle are automatically grouped into the same assessment!',
    },
    {
      Column: 'Category',
      Required: 'NO',
      Description: 'Technical, Web Development, Algorithms, System Design, or General (defaults to Technical)',
    },
    {
      Column: 'TimeLimitMinutes',
      Required: 'NO',
      Description: 'Duration limit in minutes (e.g. 30)',
    },
    {
      Column: 'PassingScorePercentage',
      Required: 'NO',
      Description: 'Passing threshold score percentage (e.g. 60)',
    },
    {
      Column: 'CustomPoints',
      Required: 'NO',
      Description: 'Points awarded directly to student upon passing this assessment (defaults to 50)',
    },
    {
      Column: 'QuestionText',
      Required: 'YES',
      Description: 'The full question prompt or problem statement',
    },
    {
      Column: 'OptionA',
      Required: 'YES',
      Description: 'Choice A text',
    },
    {
      Column: 'OptionB',
      Required: 'YES',
      Description: 'Choice B text',
    },
    {
      Column: 'OptionC',
      Required: 'NO',
      Description: 'Choice C text (optional)',
    },
    {
      Column: 'OptionD',
      Required: 'NO',
      Description: 'Choice D text (optional)',
    },
    {
      Column: 'CorrectOption',
      Required: 'YES',
      Description: 'Correct answer. Enter A, B, C, or D (or 1, 2, 3, 4, or the exact option text)',
    },
    {
      Column: 'Points',
      Required: 'NO',
      Description: 'Points awarded for answering correctly (defaults to 1)',
    },
    {
      Column: 'Explanation',
      Required: 'NO',
      Description: 'Explanation revealed to students during result review',
    },
  ];

  const wsInstr = workbook.addWorksheet('Instructions');
  wsInstr.columns = [
    { header: 'Column', key: 'Column', width: 25 },
    { header: 'Required', key: 'Required', width: 25 },
    { header: 'Description', key: 'Description', width: 60 },
  ];
  instructions.forEach((instr) => wsInstr.addRow(instr));

  const buffer = await workbook.xlsx.writeBuffer();

  return reply
    .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .header('Content-Disposition', 'attachment; filename="mcq_assessment_sample_template.xlsx"')
    .send(Buffer.from(buffer));
};

/**
 * POST /api/assessments/admin/bulk-upload
 * Bulk upload MCQ questions from an Excel (.xlsx) or CSV (.csv) file.
 * Supports:
 * - Appending to an existing assessment (if targetAssessmentId is specified)
 * - Creating new assessments grouped by AssessmentTitle in the sheet
 * Enforces 5MB max file size and 500 rows limit.
 */
export const bulkUploadMCQAssessments = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const query = request.query as any;
    let targetAssessmentId: string | null = query?.assessmentId ? String(query.assessmentId).trim() : null;

    let data: any = null;
    try {
      data = await request.file();
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: 'Failed to read upload file stream: ' + (err.message || 'Stream error'),
      });
    }

    if (!data) {
      return reply.status(400).send({ success: false, error: 'No spreadsheet file uploaded' });
    }

    const filename = (data.filename || '').toLowerCase();
    if (!filename.endsWith('.xlsx') && !filename.endsWith('.csv')) {
      return reply.status(400).send({
        success: false,
        error: 'Only .xlsx and .csv spreadsheet files are supported',
      });
    }

    if (data.fields?.assessmentId) {
      const val =
        typeof data.fields.assessmentId === 'object' && 'value' in data.fields.assessmentId
          ? (data.fields.assessmentId as any).value
          : data.fields.assessmentId;
      if (val && String(val).trim()) targetAssessmentId = String(val).trim();
    }

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    let rawRows: any[] = [];
    try {
      rawRows = await parseSpreadsheetBuffer(buffer, filename);
    } catch (parseErr: any) {
      return reply.status(400).send({
        success: false,
        error: parseErr.message || 'Malformed or invalid spreadsheet file',
      });
    }

    if (!rawRows.length) {
      return reply.status(400).send({ success: false, error: 'The uploaded spreadsheet contains no data rows' });
    }

    // Helper to find value from row case-insensitively
    const getVal = (row: any, ...keys: string[]): string => {
      const rowKeys = Object.keys(row);
      for (const k of keys) {
        const target = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedKey = rowKeys.find(
          (rk) => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === target
        );
        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
          return String(row[matchedKey]).trim();
        }
      }
      return '';
    };

    const errors: string[] = [];
    const parsedQuestions: Array<{
      assessmentTitle: string;
      category: string;
      timeLimitMinutes: number;
      passingScorePercentage: number;
      customPoints: number;
      question: IAssessmentQuestion;
      rowNumber: number;
    }> = [];

    rawRows.forEach((row, idx) => {
      const rowNumber = idx + 2; // header is row 1
      const questionText = getVal(row, 'QuestionText', 'Question', 'QuestionPrompt', 'Prompt');
      if (!questionText) {
        // Skip totally empty rows
        const hasAnyData = Object.values(row).some((v) => String(v).trim().length > 0);
        if (hasAnyData) {
          errors.push(`Row #${rowNumber}: Missing question text`);
        }
        return;
      }

      // Collect options
      const optA = getVal(row, 'OptionA', 'Option1', 'A');
      const optB = getVal(row, 'OptionB', 'Option2', 'B');
      const optC = getVal(row, 'OptionC', 'Option3', 'C');
      const optD = getVal(row, 'OptionD', 'Option4', 'D');

      const options = [optA, optB, optC, optD].filter((opt) => opt.length > 0);
      if (options.length < 2) {
        errors.push(
          `Row #${rowNumber} ("${questionText.slice(0, 30)}..."): At least 2 options (OptionA and OptionB) are required`
        );
        return;
      }

      // Parse Correct Option
      const rawCorrect = getVal(row, 'CorrectOption', 'CorrectAnswer', 'Answer', 'Correct');
      if (!rawCorrect) {
        errors.push(`Row #${rowNumber}: Missing CorrectOption (expected A, B, C, or D)`);
        return;
      }

      let correctIndex = -1;
      const upper = rawCorrect.toUpperCase();
      if (upper === 'A' || upper === 'OPTION A' || upper === 'OPTION 1' || upper === '1') {
        correctIndex = 0;
      } else if (upper === 'B' || upper === 'OPTION B' || upper === 'OPTION 2' || upper === '2') {
        correctIndex = 1;
      } else if (upper === 'C' || upper === 'OPTION C' || upper === 'OPTION 3' || upper === '3') {
        correctIndex = 2;
      } else if (upper === 'D' || upper === 'OPTION D' || upper === 'OPTION 4' || upper === '4') {
        correctIndex = 3;
      } else if (upper === '0') {
        correctIndex = 0;
      } else {
        // Match exact text of one of the options
        const matchIdx = options.findIndex((o) => o.toLowerCase() === rawCorrect.toLowerCase());
        if (matchIdx !== -1) {
          correctIndex = matchIdx;
        }
      }

      if (correctIndex === -1 || correctIndex >= options.length) {
        errors.push(
          `Row #${rowNumber}: Invalid CorrectOption "${rawCorrect}". Must be A, B, C, or D (or 1, 2, 3, 4) corresponding to an available option`
        );
        return;
      }

      const pointsVal = Number(getVal(row, 'Points', 'Score', 'Point')) || 1;
      const explanation = getVal(row, 'Explanation', 'Reason', 'Notes');
      const assessmentTitle =
        getVal(row, 'AssessmentTitle', 'Title', 'Assessment') || 'Bulk Imported Assessment';
      const category = getVal(row, 'Category', 'Domain') || 'Technical';
      const timeLimitMinutes = Number(getVal(row, 'TimeLimitMinutes', 'TimeLimit', 'Duration')) || 30;
      const passingScorePercentage =
        Number(getVal(row, 'PassingScorePercentage', 'PassingScore', 'PassScore')) || 60;
      const customPointsVal =
        Number(getVal(row, 'CustomPoints', 'PointsReward', 'AssessmentPoints', 'AwardPoints', 'PassingPoints')) || 50;

      parsedQuestions.push({
        assessmentTitle,
        category,
        timeLimitMinutes: Math.max(1, timeLimitMinutes),
        passingScorePercentage: Math.min(100, Math.max(1, passingScorePercentage)),
        customPoints: Math.max(0, customPointsVal),
        question: {
          questionText,
          options,
          correctOptionIndex: correctIndex,
          explanation,
          points: Math.max(1, pointsVal),
        },
        rowNumber,
      });
    });

    if (parsedQuestions.length === 0) {
      return reply.status(400).send({
        success: false,
        error:
          errors.length > 0 ? errors.slice(0, 5).join(' | ') : 'No valid MCQ questions found in Excel file',
        errors,
      });
    }

    let assessmentsCreated = 0;
    let assessmentsUpdated = 0;

    // Mode 1: Append to specific existing assessment
    if (targetAssessmentId && mongoose.Types.ObjectId.isValid(targetAssessmentId)) {
      const existing = await Assessment.findById(targetAssessmentId);
      if (!existing) {
        return reply.status(404).send({ success: false, error: 'Target assessment not found' });
      }

      existing.questions.push(...parsedQuestions.map((pq) => pq.question));
      await existing.save();
      assessmentsUpdated++;

      return reply.send({
        success: true,
        message: `Successfully appended ${parsedQuestions.length} MCQ questions to "${existing.title}"`,
        count: parsedQuestions.length,
        assessmentsCreated: 0,
        assessmentsUpdated: 1,
        errors: errors.length ? errors : undefined,
      });
    }

    // Mode 2: Group by AssessmentTitle and create assessments
    const groups = new Map<string, typeof parsedQuestions>();
    parsedQuestions.forEach((pq) => {
      const titleKey = pq.assessmentTitle;
      if (!groups.has(titleKey)) {
        groups.set(titleKey, []);
      }
      groups.get(titleKey)!.push(pq);
    });

    for (const [title, groupItems] of groups.entries()) {
      const first = groupItems[0];
      const newAssessment = new Assessment({
        title,
        description: `Imported via bulk upload on ${new Date().toLocaleDateString()}`,
        category: first.category || 'Technical',
        timeLimitMinutes: first.timeLimitMinutes || 30,
        passingScorePercentage: first.passingScorePercentage || 60,
        customPoints: first.customPoints ?? 50,
        questions: groupItems.map((gi) => gi.question),
        isPublished: true,
        createdBy: user.id,
      });

      await newAssessment.save();
      assessmentsCreated++;
    }

    return reply.send({
      success: true,
      message: `Successfully created ${assessmentsCreated} assessment(s) with ${parsedQuestions.length} total questions!`,
      count: parsedQuestions.length,
      assessmentsCreated,
      assessmentsUpdated,
      errors: errors.length ? errors : undefined,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to bulk upload assessments',
    });
  }
};

export default {
  getAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  submitAssessment,
  getMySubmissions,
  getAssessmentSubmissions,
  getSingleAssessmentSubmissionReport,
  exportAssessmentSubmissionsCsv,
  deleteAssessmentSubmission,
  allowStudentReappear,
  resetMyAssessmentSubmission,
  downloadSampleTemplate,
  bulkUploadMCQAssessments,
  getSubmissionStatus,
  saveCheckpoint,
  getQueueStatus,
  flushQueueNow,
  retryFailedQueueItems,
  downloadQueueBackup,
};
