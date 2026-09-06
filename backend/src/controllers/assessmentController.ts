import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import Assessment, { IAssessment, IAssessmentQuestion } from '../models/assessmentModel';
import AssessmentSubmission from '../models/assessmentSubmissionModel';

export interface CreateAssessmentBody {
  title: string;
  description?: string;
  category?: string;
  eventId?: string | null;
  timeLimitMinutes?: number;
  passingScorePercentage?: number;
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
  answers: {
    questionIndex: number;
    selectedOption: number;
  }[];
  timeSpentSeconds?: number;
}

export const getAssessments = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { category, eventId, search } = request.query as any;
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

    const assessments = await Assessment.find(filter)
      .populate('eventId', 'title date type status')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch student's own submissions to attach their latest result
    const userSubmissions = await AssessmentSubmission.find({ user: user.id })
      .sort({ createdAt: -1 })
      .lean();

    const submissionMap = new Map<string, any>();
    for (const sub of userSubmissions) {
      const aId = sub.assessment.toString();
      if (!submissionMap.has(aId)) {
        submissionMap.set(aId, sub);
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
              timeSpentSeconds: mySub.timeSpentSeconds,
              createdAt: mySub.createdAt,
            }
          : null,
      };
    });

    return reply.send({
      success: true,
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

    // ANTI-CHEAT SANITIZATION FOR STUDENTS:
    // Strip correctOptionIndex and explanation during test taking!
    const questions = isAdmin
      ? assessment.questions
      : assessment.questions.map((q: any) => ({
          _id: q._id,
          questionText: q.questionText,
          options: q.options,
          points: q.points || 1,
        }));

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

    const assessment = await Assessment.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      eventId: eventId && mongoose.Types.ObjectId.isValid(eventId) ? new mongoose.Types.ObjectId(eventId) : null,
      timeLimitMinutes: Number(timeLimitMinutes) || 30,
      passingScorePercentage: Number(passingScorePercentage) || 60,
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

    // Create a map of student answers: questionIndex -> selectedOption
    const answerMap = new Map<number, number>();
    for (const ans of answers) {
      answerMap.set(ans.questionIndex, ans.selectedOption);
    }

    // SERVER-SIDE SCORING ENGINE
    let earnedPoints = 0;
    let totalPoints = 0;
    const detailedResults = [];

    for (let i = 0; i < assessment.questions.length; i++) {
      const q = assessment.questions[i];
      const qPoints = q.points || 1;
      totalPoints += qPoints;

      const selectedOption = answerMap.has(i) ? answerMap.get(i)! : -1;
      const isCorrect = selectedOption === q.correctOptionIndex;

      if (isCorrect) {
        earnedPoints += qPoints;
      }

      detailedResults.push({
        questionIndex: i,
        questionText: q.questionText,
        selectedOption,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation || '',
      });
    }

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 1000) / 10 : 0;
    const passed = percentage >= assessment.passingScorePercentage;

    // Save submission record
    const submission = await AssessmentSubmission.create({
      assessment: assessment._id,
      user: new mongoose.Types.ObjectId(user.id),
      answers: Array.from(answerMap.entries()).map(([questionIndex, selectedOption]) => ({
        questionIndex,
        selectedOption,
      })),
      score: earnedPoints,
      totalPoints,
      percentage,
      passed,
      timeSpentSeconds: Math.max(0, Number(timeSpentSeconds) || 0),
      detailedResults,
    });

    return reply.status(201).send({
      success: true,
      message: passed
        ? 'Congratulations! You passed the assessment.'
        : 'Assessment completed. Keep practicing to improve your score!',
      data: {
        submissionId: submission._id,
        assessmentId: assessment._id,
        title: assessment.title,
        score: earnedPoints,
        totalPoints,
        percentage,
        passed,
        passingScorePercentage: assessment.passingScorePercentage,
        timeSpentSeconds: submission.timeSpentSeconds,
        detailedResults,
        submittedAt: submission.createdAt,
      },
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to evaluate assessment submission',
    });
  }
};

export const getMySubmissions = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const submissions = await AssessmentSubmission.find({ user: user.id })
      .populate('assessment', 'title category timeLimitMinutes passingScorePercentage eventId')
      .sort({ createdAt: -1 })
      .lean();

    return reply.send({
      success: true,
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

    const submissions = await AssessmentSubmission.find({ assessment: id })
      .populate('user', 'name rollNo email department profilePicUrl')
      .sort({ score: -1, createdAt: -1 })
      .lean();

    return reply.send({
      success: true,
      data: submissions,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to fetch assessment submissions',
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
};
