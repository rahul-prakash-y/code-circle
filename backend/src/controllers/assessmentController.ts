import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import Assessment, { IAssessment, IAssessmentQuestion } from '../models/assessmentModel';
import AssessmentSubmission from '../models/assessmentSubmissionModel';
import User from '../models/userModel';
import PointTransaction from '../models/pointTransactionModel';

export interface CreateAssessmentBody {
  title: string;
  description?: string;
  category?: string;
  eventId?: string | null;
  timeLimitMinutes?: number;
  passingScorePercentage?: number;
  customPoints?: number;
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

    let pointsAwarded = 0;
    if (passed) {
      // Prevent duplicate awards: check if user previously had a passing submission
      const priorPassing = await AssessmentSubmission.findOne({
        assessment: assessment._id,
        user: new mongoose.Types.ObjectId(user.id),
        passed: true,
        _id: { $ne: submission._id },
      });

      if (!priorPassing) {
        const customPts =
          typeof assessment.customPoints === 'number' && assessment.customPoints >= 0
            ? assessment.customPoints
            : 50;
        pointsAwarded = customPts;

        if (pointsAwarded > 0) {
          await User.findByIdAndUpdate(user.id, { $inc: { points: pointsAwarded } });
          try {
            await PointTransaction.create({
              user: new mongoose.Types.ObjectId(user.id),
              amount: pointsAwarded,
              category: 'Assessment',
              title: `Assessment Completed: ${assessment.title}`,
              description: `Passed with score ${earnedPoints}/${totalPoints} (${percentage}%)`,
              referenceId: assessment._id.toString(),
              referenceModel: 'Assessment',
              timestamp: new Date(),
            });
          } catch (txErr) {
            console.warn('[AssessmentController] Could not record PointTransaction:', txErr);
          }
        }
      }
    }

    return reply.status(201).send({
      success: true,
      message: passed
        ? (pointsAwarded > 0
            ? `Congratulations! You passed the assessment and earned ${pointsAwarded} points!`
            : 'Congratulations! You passed the assessment.')
        : 'Assessment completed. Keep practicing to improve your score!',
      data: {
        submissionId: submission._id,
        assessmentId: assessment._id,
        title: assessment.title,
        score: earnedPoints,
        totalPoints,
        percentage,
        passed,
        pointsAwarded,
        customPoints: assessment.customPoints ?? 50,
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
  request: FastifyRequest<{ Params: { id: string; studentId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id, studentId } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return reply.status(400).send({ success: false, error: 'Invalid ID parameters' });
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

    return reply.send({
      success: true,
      message: 'Student attempt has been reset. The student is now permitted to reappear for this assessment.',
      deletedCount: deleteResult.deletedCount,
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
  const wb = XLSX.utils.book_new();

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

  const ws = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(wb, ws, 'MCQ Assessments');

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

  const wsInstr = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return reply
    .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .header('Content-Disposition', 'attachment; filename="mcq_assessment_sample_template.xlsx"')
    .send(buffer);
};

/**
 * POST /api/assessments/admin/bulk-upload
 * Bulk upload MCQ questions from an Excel sheet (.xlsx / .xls).
 * Supports:
 * - Appending to an existing assessment (if targetAssessmentId is specified)
 * - Creating new assessments grouped by AssessmentTitle in the sheet
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
      return reply.status(400).send({ success: false, error: 'No Excel file uploaded' });
    }

    const filename = (data.filename || '').toLowerCase();
    if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls')) {
      return reply.status(400).send({
        success: false,
        error: 'Only .xlsx and .xls files are supported',
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

    if (buffer.length === 0) {
      return reply.status(400).send({ success: false, error: 'Uploaded Excel file is empty' });
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName =
      workbook.SheetNames.find(
        (s) =>
          s.toLowerCase().includes('mcq') ||
          s.toLowerCase().includes('assessment') ||
          s.toLowerCase().includes('question')
      ) ||
      workbook.SheetNames.find((s) => !s.toLowerCase().includes('instruct')) ||
      workbook.SheetNames[0];

    if (!sheetName) {
      return reply.status(400).send({ success: false, error: 'Excel file has no valid sheets' });
    }

    const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    if (!rawRows.length) {
      return reply.status(400).send({ success: false, error: 'The uploaded Excel sheet contains no data rows' });
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
  deleteAssessmentSubmission,
  allowStudentReappear,
  resetMyAssessmentSubmission,
  downloadSampleTemplate,
  bulkUploadMCQAssessments,
};
