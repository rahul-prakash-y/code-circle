import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import Event, {
  IEvent,
  IEventArenaAssessment,
  IEventArenaMcqQuestion,
  IEventArenaCodingProblem,
} from '../models/eventModel';
import EventArenaSubmission from '../models/eventArenaSubmissionModel';
import Enrollment from '../models/enrollmentModel';
import User from '../models/userModel';
import Team from '../models/teamModel';
import rceService from '../services/rceService';
import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// Authorization Helper: SuperAdmin OR Admins assigned to assessment / arena
// ---------------------------------------------------------------------------
export const canManageAssessmentQuestions = (
  user: any,
  event: any,
  assessment?: any
): boolean => {
  if (!user) return false;
  if (user.role === 'SuperAdmin') return true;

  // Check assessment-specific assigned admins
  if (assessment && Array.isArray(assessment.assignedAdmins)) {
    const isAssignedToAssessment = assessment.assignedAdmins.some((adminRef: any) => {
      const id = adminRef?._id ? adminRef._id.toString() : adminRef.toString();
      return id === user._id.toString();
    });
    if (isAssignedToAssessment) return true;
  }

  // Fallback to event-level arenaAdmins
  if (Array.isArray(event.arenaAdmins)) {
    return event.arenaAdmins.some((adminRef: any) => {
      const id = adminRef?._id ? adminRef._id.toString() : adminRef.toString();
      return id === user._id.toString();
    });
  }

  return false;
};

export const canManageEventArenaQuestions = (user: any, event: any): boolean => {
  return canManageAssessmentQuestions(user, event);
};

// ---------------------------------------------------------------------------
// Helper: Ensure an event has at least one assessment initialized from legacy fields
// ---------------------------------------------------------------------------
export const ensureEventAssessments = async (event: any): Promise<any[]> => {
  if (!event.arenaAssessments || event.arenaAssessments.length === 0) {
    const initialAssessment = {
      _id: new mongoose.Types.ObjectId(),
      title: `${event.title} - Main Assessment`,
      description: event.description || '',
      type: event.arenaType || 'HYBRID',
      status: event.arenaStatus || 'LIVE',
      durationMinutes: event.arenaDurationMinutes || 60,
      totalPoints: event.arenaTotalPoints || 100,
      passingPercentage: event.arenaPassingPercentage || 50,
      rules: event.arenaRules || [],
      startTime: event.arenaStartTime,
      endTime: event.arenaEndTime,
      assignedAdmins: event.arenaAdmins || [],
      questions: event.arenaQuestions || { mcqs: [], coding: [] },
    };
    event.arenaAssessments = [initialAssessment as any];
    await event.save();
  }
  return event.arenaAssessments;
};

// ---------------------------------------------------------------------------
// Helper: Parse MCQ Buffer from Excel or JSON
// ---------------------------------------------------------------------------
export const parseMcqsBuffer = (buffer: Buffer, fileName: string): IEventArenaMcqQuestion[] => {
  let parsedList: IEventArenaMcqQuestion[] = [];
  if (fileName.endsWith('.json')) {
    const jsonContent = JSON.parse(buffer.toString('utf-8'));
    parsedList = Array.isArray(jsonContent) ? jsonContent : jsonContent.questions || [];
  } else {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    for (const row of rows) {
      const questionText = row['Question'] || row['question'] || row['Question Text'];
      if (!questionText) continue;

      const options = [
        row['Option 1'] || row['option1'] || row['Option A'] || row['A'],
        row['Option 2'] || row['option2'] || row['Option B'] || row['B'],
        row['Option 3'] || row['option3'] || row['Option C'] || row['C'],
        row['Option 4'] || row['option4'] || row['Option D'] || row['D'],
      ]
        .filter(Boolean)
        .map(String);

      if (options.length < 2) continue;

      let correctIndex = 0;
      const rawCorrect =
        row['Correct Option Index'] ??
        row['correctOptionIndex'] ??
        row['Answer'] ??
        row['Correct Option'];

      if (typeof rawCorrect === 'number') {
        correctIndex = rawCorrect;
      } else if (typeof rawCorrect === 'string') {
        const upper = rawCorrect.trim().toUpperCase();
        if (upper === 'A' || upper === '1') correctIndex = 0;
        else if (upper === 'B' || upper === '2') correctIndex = 1;
        else if (upper === 'C' || upper === '3') correctIndex = 2;
        else if (upper === 'D' || upper === '4') correctIndex = 3;
        else {
          const matchIdx = options.findIndex(
            (opt) => opt.toLowerCase() === rawCorrect.toLowerCase().trim()
          );
          if (matchIdx !== -1) correctIndex = matchIdx;
        }
      }

      parsedList.push({
        question: String(questionText).trim(),
        options,
        correctOptionIndex: Math.max(0, Math.min(options.length - 1, correctIndex)),
        points: Number(row['Points'] || row['points']) || 10,
        explanation: String(row['Explanation'] || row['explanation'] || '').trim(),
      });
    }
  }
  return parsedList;
};

// ---------------------------------------------------------------------------
// Helper: Parse Coding Buffer from Excel or JSON
// ---------------------------------------------------------------------------
export const parseCodingBuffer = (buffer: Buffer, fileName: string): IEventArenaCodingProblem[] => {
  let parsedCoding: IEventArenaCodingProblem[] = [];
  if (fileName.endsWith('.json')) {
    const jsonContent = JSON.parse(buffer.toString('utf-8'));
    parsedCoding = Array.isArray(jsonContent) ? jsonContent : jsonContent.problems || [];
  } else {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    for (const row of rows) {
      const title = row['Title'] || row['title'];
      const description = row['Description'] || row['description'];
      if (!title || !description) continue;

      const sampleInput = String(row['Sample Input'] || row['sampleInput'] || '');
      const sampleOutput = String(row['Sample Output'] || row['sampleOutput'] || '');

      const testCases = [
        {
          input: sampleInput,
          expectedOutput: sampleOutput,
          isHidden: false,
        },
      ];

      const hiddenIn = row['Hidden Input 1'] || row['hiddenInput1'];
      const hiddenOut = row['Hidden Output 1'] || row['hiddenOutput1'];
      if (hiddenOut) {
        testCases.push({
          input: String(hiddenIn || ''),
          expectedOutput: String(hiddenOut),
          isHidden: true,
        });
      }

      parsedCoding.push({
        title: String(title).trim(),
        description: String(description).trim(),
        inputFormat: String(row['Input Format'] || row['inputFormat'] || ''),
        outputFormat: String(row['Output Format'] || row['outputFormat'] || ''),
        constraints: String(row['Constraints'] || row['constraints'] || ''),
        difficulty: (['Easy', 'Medium', 'Hard'].includes(row['Difficulty'])
          ? row['Difficulty']
          : 'Medium') as any,
        points: Number(row['Points'] || row['points']) || 30,
        allowedLanguages: ['python', 'javascript', 'cpp', 'java', 'c'],
        starterCode: {
          python: '# Write solution here\n',
          javascript: '// Write solution here\n',
          cpp: '#include <iostream>\nusing namespace std;\nint main() {\n  return 0;\n}\n',
          java: 'import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n  }\n}\n',
          c: '#include <stdio.h>\nint main() {\n  return 0;\n}\n',
        },
        sampleInput,
        sampleOutput,
        testCases,
      });
    }
  }
  return parsedCoding;
};

// ---------------------------------------------------------------------------
// 1. Get List of Admins / Faculty Available for Selection by SuperAdmin
// ---------------------------------------------------------------------------
export const getArenaAdminCandidates = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const candidates = await User.find(
      {
        role: { $in: ['Admin', 'SuperAdmin', 'Faculty', 'Committee'] },
        isBlocked: false,
      },
      'name email role rollNo profilePicUrl department'
    )
      .sort({ name: 1 })
      .lean();

    return reply.send({
      success: true,
      candidates,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch admin candidates for Event Arena',
    });
  }
};

// ---------------------------------------------------------------------------
// 2. Configure Event Arena (Enable/Disable, Settings, and Assign Arena Admins)
// ---------------------------------------------------------------------------
export const updateArenaConfig = async (
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      hasArena?: boolean;
      arenaType?: 'CODING' | 'MCQ' | 'HYBRID' | 'UI_UX';
      arenaStatus?: 'DRAFT' | 'UPCOMING' | 'LIVE' | 'ENDED';
      arenaDurationMinutes?: number;
      arenaTotalPoints?: number;
      arenaPassingPercentage?: number;
      arenaRules?: string[];
      arenaStartTime?: string | Date;
      arenaEndTime?: string | Date;
      arenaAdmins?: string[];
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid event ID' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    const isSuperAdmin = user.role === 'SuperAdmin';
    const isAssignedAdmin = canManageEventArenaQuestions(user, event);

    if (!isSuperAdmin && !isAssignedAdmin) {
      return reply.status(403).send({
        success: false,
        error:
          'Access denied: Only SuperAdmins and Admins selected by SuperAdmin can manage Event Arena configuration.',
      });
    }

    const body = request.body || {};

    // Only SuperAdmin is allowed to change the list of arenaAdmins
    if (body.arenaAdmins !== undefined) {
      if (!isSuperAdmin) {
        return reply.status(403).send({
          success: false,
          error: 'Only SuperAdmin has permission to assign or change authorized Arena Admins.',
        });
      }
      event.arenaAdmins = (body.arenaAdmins || []).map(
        (adminId) => new mongoose.Types.ObjectId(adminId)
      );
    }

    if (body.hasArena !== undefined) event.hasArena = Boolean(body.hasArena);
    if (body.arenaType) event.arenaType = body.arenaType;
    if (body.arenaStatus) event.arenaStatus = body.arenaStatus;
    if (body.arenaDurationMinutes) event.arenaDurationMinutes = Number(body.arenaDurationMinutes);
    if (body.arenaTotalPoints !== undefined) event.arenaTotalPoints = Number(body.arenaTotalPoints);
    if (body.arenaPassingPercentage !== undefined)
      event.arenaPassingPercentage = Number(body.arenaPassingPercentage);
    if (Array.isArray(body.arenaRules)) event.arenaRules = body.arenaRules;
    if (body.arenaStartTime) event.arenaStartTime = new Date(body.arenaStartTime);
    if (body.arenaEndTime) event.arenaEndTime = new Date(body.arenaEndTime);

    await event.save();

    const updatedEvent = await Event.findById(id).populate(
      'arenaAdmins',
      'name email role rollNo profilePicUrl'
    );

    return reply.send({
      success: true,
      message: 'Event Arena configuration updated successfully',
      event: updatedEvent,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to update Event Arena configuration',
    });
  }
};

// ---------------------------------------------------------------------------
// 3. Get Full Arena Question Bank (Admin View)
// ---------------------------------------------------------------------------
export const getAdminArenaQuestions = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid event ID' });
    }

    const event = await Event.findById(id).populate(
      'arenaAdmins',
      'name email role rollNo profilePicUrl'
    );

    if (!event) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    if (!canManageEventArenaQuestions(user, event)) {
      return reply.status(403).send({
        success: false,
        error:
          'Access denied: You are not authorized by SuperAdmin to view or manage questions for this Event Arena.',
      });
    }

    return reply.send({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        hasArena: event.hasArena,
        arenaType: event.arenaType,
        arenaStatus: event.arenaStatus,
        arenaDurationMinutes: event.arenaDurationMinutes,
        arenaTotalPoints: event.arenaTotalPoints,
        arenaPassingPercentage: event.arenaPassingPercentage,
        arenaRules: event.arenaRules,
        arenaAdmins: event.arenaAdmins,
      },
      mcqs: event.arenaQuestions?.mcqs || [],
      coding: event.arenaQuestions?.coding || [],
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch Event Arena questions',
    });
  }
};

// ---------------------------------------------------------------------------
// 4. Save/Update MCQ Questions
// ---------------------------------------------------------------------------
export const saveArenaMcqs = async (
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      questions: IEventArenaMcqQuestion[];
      mode?: 'append' | 'replace';
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    const { id } = request.params;
    const { questions, mode = 'replace' } = request.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid event ID' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    if (!canManageEventArenaQuestions(user, event)) {
      return reply.status(403).send({
        success: false,
        error:
          'Access denied: Only SuperAdmins and Admins selected by SuperAdmin can upload or manage questions for this Event Arena.',
      });
    }

    if (!Array.isArray(questions)) {
      return reply.status(400).send({ success: false, error: 'Questions must be an array' });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
        return reply.status(400).send({
          success: false,
          error: `Question #${i + 1} must have valid text and at least 2 options`,
        });
      }
      if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
        return reply.status(400).send({
          success: false,
          error: `Question #${i + 1} has an invalid correct option index`,
        });
      }
    }

    if (!event.arenaQuestions) {
      event.arenaQuestions = { mcqs: [], coding: [] };
    }

    if (mode === 'append') {
      event.arenaQuestions.mcqs = [...(event.arenaQuestions.mcqs || []), ...questions];
    } else {
      event.arenaQuestions.mcqs = questions;
    }

    // Recalculate total points
    const mcqPoints = event.arenaQuestions.mcqs.reduce((sum, q) => sum + (q.points || 10), 0);
    const codingPoints = (event.arenaQuestions.coding || []).reduce(
      (sum, p) => sum + (p.points || 30),
      0
    );
    event.arenaTotalPoints = mcqPoints + codingPoints;

    await event.save();

    return reply.send({
      success: true,
      message: `Successfully saved ${event.arenaQuestions.mcqs.length} MCQ questions`,
      mcqs: event.arenaQuestions.mcqs,
      totalPoints: event.arenaTotalPoints,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to save MCQ questions',
    });
  }
};

// ---------------------------------------------------------------------------
// 5. Save/Update Coding Problems
// ---------------------------------------------------------------------------
export const saveArenaCodingProblems = async (
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      problems: IEventArenaCodingProblem[];
      mode?: 'append' | 'replace';
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    const { id } = request.params;
    const { problems, mode = 'replace' } = request.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid event ID' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    if (!canManageEventArenaQuestions(user, event)) {
      return reply.status(403).send({
        success: false,
        error:
          'Access denied: Only SuperAdmins and Admins selected by SuperAdmin can upload or manage questions for this Event Arena.',
      });
    }

    if (!Array.isArray(problems)) {
      return reply.status(400).send({ success: false, error: 'Problems must be an array' });
    }

    // Validate coding problems
    for (let i = 0; i < problems.length; i++) {
      const p = problems[i];
      if (!p.title || !p.description) {
        return reply.status(400).send({
          success: false,
          error: `Coding problem #${i + 1} must have a title and description`,
        });
      }
      if (!Array.isArray(p.testCases) || p.testCases.length === 0) {
        return reply.status(400).send({
          success: false,
          error: `Coding problem #${i + 1} must have at least one test case`,
        });
      }
    }

    if (!event.arenaQuestions) {
      event.arenaQuestions = { mcqs: [], coding: [] };
    }

    if (mode === 'append') {
      event.arenaQuestions.coding = [...(event.arenaQuestions.coding || []), ...problems];
    } else {
      event.arenaQuestions.coding = problems;
    }

    const mcqPoints = (event.arenaQuestions.mcqs || []).reduce(
      (sum, q) => sum + (q.points || 10),
      0
    );
    const codingPoints = event.arenaQuestions.coding.reduce((sum, p) => sum + (p.points || 30), 0);
    event.arenaTotalPoints = mcqPoints + codingPoints;

    await event.save();

    return reply.send({
      success: true,
      message: `Successfully saved ${event.arenaQuestions.coding.length} coding challenges`,
      coding: event.arenaQuestions.coding,
      totalPoints: event.arenaTotalPoints,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to save coding problems',
    });
  }
};

// ---------------------------------------------------------------------------
// 6. Bulk Upload Questions (Excel / CSV / JSON)
// ---------------------------------------------------------------------------
export const bulkUploadArenaQuestions = async (
  request: FastifyRequest<{
    Params: { id: string };
    Querystring: { type?: 'mcq' | 'coding'; mode?: 'append' | 'replace' };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    const { id } = request.params;
    const uploadType = request.query.type || 'mcq';
    const mode = request.query.mode || 'append';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid event ID' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    if (!canManageEventArenaQuestions(user, event)) {
      return reply.status(403).send({
        success: false,
        error:
          'Access denied: Only SuperAdmins and Admins selected by SuperAdmin can upload questions for this Event Arena.',
      });
    }

    const file = await request.file();
    if (!file) {
      return reply.status(400).send({ success: false, error: 'No file uploaded' });
    }

    const buffer = await file.toBuffer();
    const fileName = file.filename.toLowerCase();

    if (!event.arenaQuestions) {
      event.arenaQuestions = { mcqs: [], coding: [] };
    }

    if (uploadType === 'mcq') {
      let parsedList: IEventArenaMcqQuestion[] = [];

      if (fileName.endsWith('.json')) {
        const jsonContent = JSON.parse(buffer.toString('utf-8'));
        parsedList = Array.isArray(jsonContent) ? jsonContent : jsonContent.questions || [];
      } else {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        for (const row of rows) {
          const questionText = row['Question'] || row['question'] || row['Question Text'];
          if (!questionText) continue;

          const options: string[] = [];
          for (let i = 1; i <= 6; i++) {
            const opt = row[`Option ${i}`] || row[`Option${i}`] || row[`option_${i}`] || row[`option${i}`];
            if (opt !== undefined && opt !== null && String(opt).trim()) {
              options.push(String(opt).trim());
            }
          }

          let correctIdx = 0;
          const rawCorrect =
            row['Correct Option Index'] ??
            row['Correct Option'] ??
            row['correctOptionIndex'] ??
            row['Answer'];

          if (typeof rawCorrect === 'number') {
            correctIdx = rawCorrect >= 1 && rawCorrect <= options.length ? rawCorrect - 1 : rawCorrect;
          } else if (typeof rawCorrect === 'string') {
            const letter = rawCorrect.trim().toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(letter)) {
              correctIdx = letter.charCodeAt(0) - 65;
            } else if (!isNaN(Number(letter))) {
              const num = Number(letter);
              correctIdx = num >= 1 && num <= options.length ? num - 1 : num;
            }
          }

          if (options.length >= 2) {
            parsedList.push({
              question: String(questionText).trim(),
              options,
              correctOptionIndex: correctIdx,
              points: Number(row['Points'] || row['points']) || 10,
              explanation: String(row['Explanation'] || row['explanation'] || '').trim(),
            });
          }
        }
      }

      if (parsedList.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'No valid MCQ questions found in uploaded file',
        });
      }

      if (mode === 'append') {
        event.arenaQuestions.mcqs = [...(event.arenaQuestions.mcqs || []), ...parsedList];
      } else {
        event.arenaQuestions.mcqs = parsedList;
      }

      await event.save();

      return reply.send({
        success: true,
        message: `Successfully uploaded ${parsedList.length} MCQ questions!`,
        count: parsedList.length,
        totalMcqs: event.arenaQuestions.mcqs.length,
      });
    } else {
      // Coding challenges upload
      let parsedCoding: IEventArenaCodingProblem[] = [];

      if (fileName.endsWith('.json')) {
        const jsonContent = JSON.parse(buffer.toString('utf-8'));
        parsedCoding = Array.isArray(jsonContent) ? jsonContent : jsonContent.problems || [];
      } else {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        for (const row of rows) {
          const title = row['Title'] || row['title'];
          const description = row['Description'] || row['description'];
          if (!title || !description) continue;

          const sampleInput = String(row['Sample Input'] || row['sampleInput'] || '');
          const sampleOutput = String(row['Sample Output'] || row['sampleOutput'] || '');

          const testCases = [
            {
              input: sampleInput,
              expectedOutput: sampleOutput,
              isHidden: false,
            },
          ];

          const hiddenIn = row['Hidden Input 1'] || row['hiddenInput1'];
          const hiddenOut = row['Hidden Output 1'] || row['hiddenOutput1'];
          if (hiddenOut) {
            testCases.push({
              input: String(hiddenIn || ''),
              expectedOutput: String(hiddenOut),
              isHidden: true,
            });
          }

          parsedCoding.push({
            title: String(title).trim(),
            description: String(description).trim(),
            inputFormat: String(row['Input Format'] || row['inputFormat'] || ''),
            outputFormat: String(row['Output Format'] || row['outputFormat'] || ''),
            constraints: String(row['Constraints'] || row['constraints'] || ''),
            difficulty: (['Easy', 'Medium', 'Hard'].includes(row['Difficulty'])
              ? row['Difficulty']
              : 'Medium') as any,
            points: Number(row['Points'] || row['points']) || 30,
            allowedLanguages: ['python', 'javascript', 'cpp', 'java', 'c'],
            starterCode: {
              python: '# Write solution here\n',
              javascript: '// Write solution here\n',
              cpp: '#include <iostream>\nusing namespace std;\nint main() {\n  return 0;\n}\n',
              java: 'import java.util.*;\npublic class Main {\n  public static void main(String[] args) {\n  }\n}\n',
              c: '#include <stdio.h>\nint main() {\n  return 0;\n}\n',
            },
            sampleInput,
            sampleOutput,
            testCases,
          });
        }
      }

      if (parsedCoding.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'No valid coding problems found in uploaded file',
        });
      }

      if (mode === 'append') {
        event.arenaQuestions.coding = [...(event.arenaQuestions.coding || []), ...parsedCoding];
      } else {
        event.arenaQuestions.coding = parsedCoding;
      }

      await event.save();

      return reply.send({
        success: true,
        message: `Successfully uploaded ${parsedCoding.length} coding problems!`,
        count: parsedCoding.length,
        totalCoding: event.arenaQuestions.coding.length,
      });
    }
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to bulk upload questions',
    });
  }
};

// ---------------------------------------------------------------------------
// 7. Download Sample Excel Template
// ---------------------------------------------------------------------------
export const downloadArenaSampleTemplate = async (
  request: FastifyRequest<{
    Params: { id: string; type: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const { type } = request.params;

    if (type === 'coding') {
      const sampleCoding = [
        {
          Title: 'Sum of Two Numbers',
          Description: 'Given two integers a and b, compute and print their sum.',
          'Input Format': 'Two space-separated integers a and b.',
          'Output Format': 'Single integer representing the sum.',
          Constraints: '1 <= a, b <= 10^5',
          Difficulty: 'Easy',
          Points: 20,
          'Sample Input': '3 5',
          'Sample Output': '8',
          'Hidden Input 1': '100 200',
          'Hidden Output 1': '300',
        },
        {
          Title: 'Reverse a String',
          Description: 'Given a string S, print the reversed string.',
          'Input Format': 'A single string S.',
          'Output Format': 'The reversed string.',
          Constraints: '1 <= length(S) <= 1000',
          Difficulty: 'Medium',
          Points: 30,
          'Sample Input': 'hello',
          'Sample Output': 'olleh',
          'Hidden Input 1': 'algorithm',
          'Hidden Output 1': 'mhtirogla',
        },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sampleCoding);
      XLSX.utils.book_append_sheet(wb, ws, 'Coding Challenges');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      reply.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      reply.header(
        'Content-Disposition',
        'attachment; filename="event_arena_coding_sample_template.xlsx"'
      );
      return reply.send(buffer);
    } else {
      const sampleMcqs = [
        {
          Question: 'What is the time complexity of searching an element in a balanced Binary Search Tree?',
          'Option 1': 'O(1)',
          'Option 2': 'O(log n)',
          'Option 3': 'O(n)',
          'Option 4': 'O(n log n)',
          'Correct Option Index': 1,
          Points: 10,
          Explanation: 'A balanced BST has a height of log n, providing O(log n) search time.',
        },
        {
          Question: 'Which data structure follows the Last-In-First-Out (LIFO) principle?',
          'Option 1': 'Queue',
          'Option 2': 'Stack',
          'Option 3': 'Linked List',
          'Option 4': 'Hash Map',
          'Correct Option Index': 1,
          Points: 10,
          Explanation: 'A Stack is a LIFO data structure.',
        },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sampleMcqs);
      XLSX.utils.book_append_sheet(wb, ws, 'MCQ Questions');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      reply.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      reply.header(
        'Content-Disposition',
        'attachment; filename="event_arena_mcq_sample_template.xlsx"'
      );
      return reply.send(buffer);
    }
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: 'Failed to download sample template',
    });
  }
};

// ---------------------------------------------------------------------------
// 8. Student Arena View (Public / Enrolled Participants)
// ---------------------------------------------------------------------------
export const getStudentArenaData = async (
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
      return reply.status(400).send({ success: false, error: 'Invalid event ID' });
    }

    const event = await Event.findById(id).lean();
    if (!event) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    if (!event.hasArena) {
      return reply.status(400).send({
        success: false,
        error: 'Event Arena is not enabled for this event.',
      });
    }

    // Check enrollment for students
    const isAdmin = ['Admin', 'SuperAdmin', 'Faculty', 'Committee'].includes(user.role);
    if (!isAdmin) {
      const enrollment = await Enrollment.findOne({
        event: event._id,
        $or: [{ enrolledBy: user._id }, { 'members.user': user._id }],
      });

      if (!enrollment) {
        return reply.status(403).send({
          success: false,
          error: 'You must be registered or enrolled in this event to enter the Event Arena.',
        });
      }
    }

    // Check existing student submission
    const existingSubmission = await EventArenaSubmission.findOne({
      eventId: event._id,
      userId: user._id,
    }).lean();

    // Sanitize MCQs (strip correctOptionIndex and explanation so student cannot cheat)
    const sanitizedMcqs = (event.arenaQuestions?.mcqs || []).map((q: any) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      points: q.points,
    }));

    // Sanitize Coding Challenges (strip hidden test cases)
    const sanitizedCoding = (event.arenaQuestions?.coding || []).map((p: any) => ({
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
      testCases: (p.testCases || []).filter((tc: any) => !tc.isHidden),
    }));

    return reply.send({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        hasArena: event.hasArena,
        arenaType: event.arenaType || 'HYBRID',
        arenaStatus: event.arenaStatus || 'LIVE',
        arenaDurationMinutes: event.arenaDurationMinutes || 60,
        arenaTotalPoints: event.arenaTotalPoints || 100,
        arenaPassingPercentage: event.arenaPassingPercentage || 50,
        arenaRules: event.arenaRules || [],
        arenaDesignChallenge: (event as any).arenaDesignChallenge || null,
      },
      mcqs: sanitizedMcqs,
      coding: sanitizedCoding,
      designChallenge: (event as any).arenaDesignChallenge || null,
      submission: existingSubmission || null,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch student Event Arena data',
    });
  }
};

// ---------------------------------------------------------------------------
// 9. Start Arena Session (Student)
// ---------------------------------------------------------------------------
export const startArenaSession = async (
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
      return reply.status(400).send({ success: false, error: 'Invalid event ID' });
    }

    const event = await Event.findById(id).lean();
    if (!event || !event.hasArena) {
      return reply.status(400).send({ success: false, error: 'Event Arena is not available' });
    }

    let submission = await EventArenaSubmission.findOne({
      eventId: event._id,
      userId: user._id,
    });

    if (!submission) {
      submission = await EventArenaSubmission.create({
        eventId: event._id,
        userId: user._id,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        maxPossibleScore: event.arenaTotalPoints || 100,
      });
    }

    return reply.send({
      success: true,
      message: 'Event Arena session active',
      submission,
      durationMinutes: event.arenaDurationMinutes || 60,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to start Event Arena session',
    });
  }
};

// ---------------------------------------------------------------------------
// 10. Run Arena Code (Visible Test Cases only)
// ---------------------------------------------------------------------------
export const runArenaCode = async (
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      problemId: string;
      language: string;
      code: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const { problemId, language, code } = request.body;

    const event = await Event.findById(id).lean();
    if (!event || !event.hasArena) {
      return reply.status(404).send({ success: false, error: 'Event Arena not found' });
    }

    const problem = (event.arenaQuestions?.coding || []).find(
      (p: any) => p._id.toString() === problemId
    );

    if (!problem) {
      return reply.status(404).send({ success: false, error: 'Coding problem not found' });
    }

    const visibleTestCases = (problem.testCases || []).filter((tc: any) => !tc.isHidden);
    const testCasesToRun =
      visibleTestCases.length > 0
        ? visibleTestCases
        : [
            {
              input: problem.sampleInput || '',
              expectedOutput: problem.sampleOutput || '',
              isHidden: false,
            },
          ];

    const results = [];
    let allPassed = true;

    for (let i = 0; i < testCasesToRun.length; i++) {
      const tc = testCasesToRun[i];
      try {
        const exec = await rceService.executeCode({
          language,
          sourceCode: code,
          stdin: tc.input || '',
          timeoutMs: 5000,
        });

        const actualOut = (exec.stdout || '').trim();
        const expectedOut = (tc.expectedOutput || '').trim();
        const passed = actualOut === expectedOut && exec.status === 'success';

        if (!passed) allPassed = false;

        results.push({
          testCaseIndex: i + 1,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: actualOut,
          status: exec.status,
          error: exec.stderr || exec.error || null,
          passed,
          executionTimeMs: exec.executionTimeMs,
        });
      } catch (e: any) {
        allPassed = false;
        results.push({
          testCaseIndex: i + 1,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: '',
          status: 'RUNTIME_ERROR',
          error: e.message || 'Execution failed',
          passed: false,
        });
      }
    }

    return reply.send({
      success: true,
      allPassed,
      results,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to execute code',
    });
  }
};

// ---------------------------------------------------------------------------
// 11. Submit Coding Problem (Evaluates Against ALL Test Cases)
// ---------------------------------------------------------------------------
export const submitArenaCodingProblem = async (
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      problemId: string;
      language: string;
      code: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }
    const { id } = request.params;
    const { problemId, language, code } = request.body;

    const event = await Event.findById(id).lean();
    if (!event || !event.hasArena) {
      return reply.status(404).send({ success: false, error: 'Event Arena not found' });
    }

    const problem = (event.arenaQuestions?.coding || []).find(
      (p: any) => p._id.toString() === problemId
    );

    if (!problem) {
      return reply.status(404).send({ success: false, error: 'Coding problem not found' });
    }

    const allTestCases = problem.testCases || [];
    let passedCount = 0;

    for (const tc of allTestCases) {
      try {
        const exec = await rceService.executeCode({
          language,
          sourceCode: code,
          stdin: tc.input || '',
          timeoutMs: 5000,
        });
        const actualOut = (exec.stdout || '').trim();
        const expectedOut = (tc.expectedOutput || '').trim();
        if (actualOut === expectedOut && exec.status === 'success') {
          passedCount++;
        }
      } catch {
        // failed test case
      }
    }

    const totalTestCases = allTestCases.length || 1;
    const pointsPossible = problem.points || 30;
    const pointsEarned = Math.round((passedCount / totalTestCases) * pointsPossible);
    const status =
      passedCount === totalTestCases
        ? 'ACCEPTED'
        : passedCount > 0
        ? 'WRONG_ANSWER'
        : 'WRONG_ANSWER';

    // Update session record
    const submission = await EventArenaSubmission.findOne({
      eventId: event._id,
      userId: user._id,
    });

    if (submission) {
      const existingIdx = submission.codingSubmissions.findIndex(
        (cs) => cs.problemId === problemId
      );

      const entry = {
        problemId,
        language,
        code,
        testCasesPassed: passedCount,
        totalTestCases,
        pointsEarned,
        status: status as any,
      };

      if (existingIdx >= 0) {
        submission.codingSubmissions[existingIdx] = entry;
      } else {
        submission.codingSubmissions.push(entry);
      }

      await submission.save();
    }

    return reply.send({
      success: true,
      problemId,
      status,
      passedCount,
      totalTestCases,
      pointsEarned,
      pointsPossible,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to submit problem solution',
    });
  }
};

// ---------------------------------------------------------------------------
// 12. Final Submit Arena Assessment
// ---------------------------------------------------------------------------
export const submitArenaFinal = async (
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      mcqAnswers?: Array<{ questionId: string; selectedOptionIndex: number }>;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }
    const { id } = request.params;
    const { mcqAnswers = [] } = request.body || {};

    const event = await Event.findById(id).lean();
    if (!event || !event.hasArena) {
      return reply.status(404).send({ success: false, error: 'Event Arena not found' });
    }

    let submission = await EventArenaSubmission.findOne({
      eventId: event._id,
      userId: user._id,
    });

    if (!submission) {
      submission = new EventArenaSubmission({
        eventId: event._id,
        userId: user._id,
        startedAt: new Date(),
      });
    }

    // Grade MCQs
    let mcqScore = 0;
    const gradedMcqs = [];
    const questionBank = event.arenaQuestions?.mcqs || [];

    for (const ans of mcqAnswers) {
      const q = questionBank.find((item: any) => item._id.toString() === ans.questionId);
      if (q) {
        const isCorrect = q.correctOptionIndex === ans.selectedOptionIndex;
        const pts = isCorrect ? q.points || 10 : 0;
        mcqScore += pts;
        gradedMcqs.push({
          questionId: ans.questionId,
          selectedOptionIndex: ans.selectedOptionIndex,
          isCorrect,
          pointsEarned: pts,
        });
      }
    }

    submission.mcqAnswers = gradedMcqs;
    submission.mcqScore = mcqScore;

    // Sum coding scores
    const codingScore = (submission.codingSubmissions || []).reduce(
      (sum, item) => sum + (item.pointsEarned || 0),
      0
    );
    submission.codingScore = codingScore;

    const totalScore = mcqScore + codingScore;
    const maxPossible = event.arenaTotalPoints || 100;
    const scorePercentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
    const passingPercentage = event.arenaPassingPercentage ?? 50;
    const isPassed = scorePercentage >= passingPercentage;

    submission.totalScore = totalScore;
    submission.maxPossibleScore = maxPossible;
    submission.scorePercentage = scorePercentage;
    submission.isPassed = isPassed;
    submission.status = 'SUBMITTED';
    submission.submittedAt = new Date();

    await submission.save();

    return reply.send({
      success: true,
      message: 'Event Arena assessment submitted successfully!',
      results: {
        totalScore,
        maxPossibleScore: maxPossible,
        scorePercentage,
        isPassed,
        mcqScore,
        codingScore,
        status: submission.status,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to finalize Event Arena submission',
    });
  }
};

// ---------------------------------------------------------------------------
// 13. Event Arena Leaderboard
// ---------------------------------------------------------------------------
export const getArenaLeaderboard = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    const submissions = await EventArenaSubmission.find({
      eventId: id,
      status: { $in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
    })
      .populate('userId', 'name rollNo email profilePicUrl department')
      .sort({ totalScore: -1, submittedAt: 1 })
      .limit(100)
      .lean();

    const leaderboard = submissions.map((s: any, idx: number) => ({
      rank: idx + 1,
      student: s.userId,
      totalScore: s.totalScore,
      maxPossibleScore: s.maxPossibleScore,
      scorePercentage: s.scorePercentage,
      mcqScore: s.mcqScore,
      codingScore: s.codingScore,
      isPassed: s.isPassed,
      submittedAt: s.submittedAt,
    }));

    return reply.send({
      success: true,
      leaderboard,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch Event Arena leaderboard',
    });
  }
};

// ---------------------------------------------------------------------------
// 14. Admin All Submissions View
// ---------------------------------------------------------------------------
export const getAdminArenaSubmissions = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    const { id } = request.params;

    const event = await Event.findById(id).lean();
    if (!event) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    if (!canManageEventArenaQuestions(user, event)) {
      return reply.status(403).send({
        success: false,
        error:
          'Access denied: Only SuperAdmins and Admins selected by SuperAdmin can view assessment submissions for this event.',
      });
    }

    const submissions = await EventArenaSubmission.find({ eventId: id })
      .populate('userId', 'name rollNo email profilePicUrl department year college')
      .sort({ totalScore: -1, submittedAt: 1 })
      .lean();

    return reply.send({
      success: true,
      submissions,
      totalSubmissions: submissions.length,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch admin arena submissions',
    });
  }
};

// ===========================================================================
// MULTI-ASSESSMENT ENDPOINTS (Any number of assessments per event arena)
// ===========================================================================

// ---------------------------------------------------------------------------
// 15. Get List of Assessments for an Event Arena (Admin & Student)
// ---------------------------------------------------------------------------
export const getEventAssessmentsList = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ success: false, error: 'Unauthorized' });
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid event ID' });
    }

    const event = await Event.findById(id).populate(
      'arenaAssessments.assignedAdmins',
      'name email role rollNo profilePicUrl department'
    );
    if (!event) return reply.status(404).send({ success: false, error: 'Event not found' });

    if (!event.hasArena) {
      return reply.status(400).send({
        success: false,
        error: 'Event Arena is not enabled for this event.',
      });
    }

    await ensureEventAssessments(event);

    // Fetch user submissions for this event to show progress per assessment
    const userSubmissions = await EventArenaSubmission.find({
      eventId: event._id,
      userId: user._id,
    }).lean();

    const submissionsByAssessmentId = new Map();
    userSubmissions.forEach((sub) => {
      submissionsByAssessmentId.set(sub.assessmentId, sub);
    });

    const isPrivileged = ['Admin', 'SuperAdmin', 'Faculty', 'Committee'].includes(user.role);

    const assessments = (event.arenaAssessments || []).map((assessment: any) => {
      const userSub = submissionsByAssessmentId.get(assessment._id.toString()) || null;
      const isAssigned = canManageAssessmentQuestions(user, event, assessment);
      return {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        type: assessment.type,
        status: assessment.status,
        durationMinutes: assessment.durationMinutes,
        totalPoints: assessment.totalPoints,
        passingPercentage: assessment.passingPercentage,
        rules: assessment.rules,
        startTime: assessment.startTime,
        endTime: assessment.endTime,
        assignedAdmins: assessment.assignedAdmins || [],
        qualificationCutoffRank: assessment.qualificationCutoffRank || 0,
        isTeamMode: Boolean(assessment.isTeamMode),
        teamSize: assessment.teamSize || 2,
        mcqCount: (assessment.questions?.mcqs || []).length,
        codingCount: (assessment.questions?.coding || []).length,
        canManage: isAssigned,
        submission: userSub
          ? {
              status: userSub.status,
              totalScore: userSub.totalScore,
              maxPossibleScore: userSub.maxPossibleScore,
              scorePercentage: userSub.scorePercentage,
              isPassed: userSub.isPassed,
              submittedAt: userSub.submittedAt,
            }
          : null,
      };
    });

    return reply.send({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        hasArena: event.hasArena,
      },
      assessments,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({ success: false, error: 'Failed to fetch assessments' });
  }
};

// ---------------------------------------------------------------------------
// 16. Create a New Assessment under Event Arena
// ---------------------------------------------------------------------------
export const createEventAssessment = async (
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      title: string;
      description?: string;
      type?: 'CODING' | 'MCQ' | 'HYBRID' | 'UI_UX';
      status?: 'DRAFT' | 'UPCOMING' | 'LIVE' | 'ENDED';
      durationMinutes?: number;
      totalPoints?: number;
      passingPercentage?: number;
      rules?: string[];
      startTime?: string | Date;
      endTime?: string | Date;
      assignedAdmins?: string[];
      qualificationCutoffRank?: number;
      isTeamMode?: boolean;
      teamSize?: number;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ success: false, error: 'Unauthorized' });
    const { id } = request.params;
    const body = request.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid event ID' });
    }

    const event = await Event.findById(id);
    if (!event) return reply.status(404).send({ success: false, error: 'Event not found' });

    if (!canManageEventArenaQuestions(user, event)) {
      return reply.status(403).send({
        success: false,
        error: 'Access denied: Only SuperAdmin and authorized event admins can create assessments.',
      });
    }

    if (!body.title || !body.title.trim()) {
      return reply.status(400).send({ success: false, error: 'Assessment title is required' });
    }

    const assignedAdmins = (body.assignedAdmins || []).map(
      (adminId) => new mongoose.Types.ObjectId(adminId)
    );

    const newAssessment = {
      _id: new mongoose.Types.ObjectId(),
      title: body.title.trim(),
      description: body.description?.trim() || '',
      type: body.type || 'HYBRID',
      status: body.status || 'LIVE',
      durationMinutes: Number(body.durationMinutes) || 60,
      totalPoints: Number(body.totalPoints) || 100,
      passingPercentage: Number(body.passingPercentage) || 50,
      rules:
        Array.isArray(body.rules) && body.rules.length > 0
          ? body.rules
          : [
              'Read all instructions carefully before starting the assessment.',
              'For coding challenges, your code will be executed against test cases.',
              'Submitting or running out of time will automatically record your final answers.',
            ],
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      assignedAdmins,
      qualificationCutoffRank: Number(body.qualificationCutoffRank) || 0,
      isTeamMode: Boolean(body.isTeamMode),
      teamSize: Number(body.teamSize) || 2,
      questions: { mcqs: [], coding: [] },
    };

    if (!event.arenaAssessments) {
      event.arenaAssessments = [];
    }
    event.arenaAssessments.push(newAssessment as any);
    event.hasArena = true;
    await event.save();

    const updatedEvent = await Event.findById(id).populate(
      'arenaAssessments.assignedAdmins',
      'name email role rollNo profilePicUrl department'
    );
    const created = updatedEvent?.arenaAssessments?.find(
      (a: any) => a._id.toString() === newAssessment._id.toString()
    );

    return reply.send({
      success: true,
      message: 'Assessment created successfully',
      assessment: created,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to create assessment',
    });
  }
};

// ---------------------------------------------------------------------------
// 17. Update Assessment Configuration & Assigned Admins
// ---------------------------------------------------------------------------
export const updateEventAssessment = async (
  request: FastifyRequest<{
    Params: { id: string; assessmentId: string };
    Body: {
      title?: string;
      description?: string;
      type?: 'CODING' | 'MCQ' | 'HYBRID' | 'UI_UX';
      status?: 'DRAFT' | 'UPCOMING' | 'LIVE' | 'ENDED';
      durationMinutes?: number;
      totalPoints?: number;
      passingPercentage?: number;
      rules?: string[];
      startTime?: string | Date;
      endTime?: string | Date;
      assignedAdmins?: string[];
      qualificationCutoffRank?: number;
      isTeamMode?: boolean;
      teamSize?: number;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ success: false, error: 'Unauthorized' });
    const { id, assessmentId } = request.params;
    const body = request.body || {};

    const event = await Event.findById(id);
    if (!event) return reply.status(404).send({ success: false, error: 'Event not found' });

    const assessment = (event.arenaAssessments || []).find(
      (a: any) => a._id.toString() === assessmentId
    );
    if (!assessment) return reply.status(404).send({ success: false, error: 'Assessment not found' });

    if (!canManageAssessmentQuestions(user, event, assessment)) {
      return reply.status(403).send({
        success: false,
        error: 'Access denied: You are not authorized to update this assessment.',
      });
    }

    if (body.assignedAdmins !== undefined) {
      if (user.role !== 'SuperAdmin') {
        return reply.status(403).send({
          success: false,
          error: 'Only SuperAdmin can assign or change admins for this assessment.',
        });
      }
      assessment.assignedAdmins = (body.assignedAdmins || []).map(
        (adminId) => new mongoose.Types.ObjectId(adminId)
      );
    }

    if (body.title !== undefined) assessment.title = body.title.trim();
    if (body.description !== undefined) assessment.description = body.description.trim();
    if (body.type !== undefined) assessment.type = body.type;
    if (body.status !== undefined) assessment.status = body.status;
    if (body.durationMinutes !== undefined) assessment.durationMinutes = Number(body.durationMinutes);
    if (body.totalPoints !== undefined) assessment.totalPoints = Number(body.totalPoints);
    if (body.passingPercentage !== undefined)
      assessment.passingPercentage = Number(body.passingPercentage);
    if (Array.isArray(body.rules)) assessment.rules = body.rules;
    if (body.startTime !== undefined)
      assessment.startTime = body.startTime ? new Date(body.startTime) : undefined;
    if (body.endTime !== undefined)
      assessment.endTime = body.endTime ? new Date(body.endTime) : undefined;
    if (body.qualificationCutoffRank !== undefined)
      assessment.qualificationCutoffRank = Number(body.qualificationCutoffRank) || 0;
    if (body.isTeamMode !== undefined)
      assessment.isTeamMode = Boolean(body.isTeamMode);
    if (body.teamSize !== undefined)
      assessment.teamSize = Number(body.teamSize) || 2;

    await event.save();

    const updatedEvent = await Event.findById(id).populate(
      'arenaAssessments.assignedAdmins',
      'name email role rollNo profilePicUrl department'
    );
    const updated = updatedEvent?.arenaAssessments?.find(
      (a: any) => a._id.toString() === assessmentId
    );

    return reply.send({
      success: true,
      message: 'Assessment updated successfully',
      assessment: updated,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to update assessment',
    });
  }
};

// ---------------------------------------------------------------------------
// 18. Delete an Assessment under Event Arena
// ---------------------------------------------------------------------------
export const deleteEventAssessment = async (
  request: FastifyRequest<{ Params: { id: string; assessmentId: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ success: false, error: 'Unauthorized' });
    const { id, assessmentId } = request.params;

    const event = await Event.findById(id);
    if (!event) return reply.status(404).send({ success: false, error: 'Event not found' });

    if (user.role !== 'SuperAdmin') {
      return reply.status(403).send({
        success: false,
        error: 'Only SuperAdmin can delete an assessment.',
      });
    }

    event.arenaAssessments = (event.arenaAssessments || []).filter(
      (a: any) => a._id.toString() !== assessmentId
    );
    await event.save();

    // Clean up submissions for this assessment
    await EventArenaSubmission.deleteMany({ eventId: id, assessmentId });

    return reply.send({
      success: true,
      message: 'Assessment deleted successfully',
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to delete assessment',
    });
  }
};

// ---------------------------------------------------------------------------
// 19. Get Assessment Questions for Admin (Protected per assigned admins)
// ---------------------------------------------------------------------------
export const getAdminAssessmentQuestions = async (
  request: FastifyRequest<{ Params: { id: string; assessmentId: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    const { id, assessmentId } = request.params;

    const event = await Event.findById(id).populate(
      'arenaAssessments.assignedAdmins',
      'name email role rollNo profilePicUrl department'
    );
    if (!event) return reply.status(404).send({ success: false, error: 'Event not found' });

    const assessment = (event.arenaAssessments || []).find(
      (a: any) => a._id.toString() === assessmentId
    );
    if (!assessment) return reply.status(404).send({ success: false, error: 'Assessment not found' });

    if (!canManageAssessmentQuestions(user, event, assessment)) {
      return reply.status(403).send({
        success: false,
        error:
          'Access denied: You are not authorized by SuperAdmin to manage questions for this assessment.',
      });
    }

    return reply.send({
      success: true,
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        type: assessment.type,
        status: assessment.status,
        durationMinutes: assessment.durationMinutes,
        totalPoints: assessment.totalPoints,
        passingPercentage: assessment.passingPercentage,
        rules: assessment.rules,
        assignedAdmins: assessment.assignedAdmins,
        designChallenge: assessment.designChallenge || null,
      },
      mcqs: assessment.questions?.mcqs || [],
      coding: assessment.questions?.coding || [],
      designChallenge: assessment.designChallenge || null,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch assessment questions',
    });
  }
};

// ---------------------------------------------------------------------------
// 20. Save MCQ Questions for a Specific Assessment
// ---------------------------------------------------------------------------
export const saveAssessmentMcqs = async (
  request: FastifyRequest<{
    Params: { id: string; assessmentId: string };
    Body: {
      questions: IEventArenaMcqQuestion[];
      mode?: 'append' | 'replace';
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    const { id, assessmentId } = request.params;
    const { questions, mode = 'replace' } = request.body;

    const event = await Event.findById(id);
    if (!event) return reply.status(404).send({ success: false, error: 'Event not found' });

    const assessment = (event.arenaAssessments || []).find(
      (a: any) => a._id.toString() === assessmentId
    );
    if (!assessment) return reply.status(404).send({ success: false, error: 'Assessment not found' });

    if (!canManageAssessmentQuestions(user, event, assessment)) {
      return reply.status(403).send({
        success: false,
        error: 'Access denied: You are not an assigned admin for this assessment.',
      });
    }

    if (!Array.isArray(questions)) {
      return reply.status(400).send({ success: false, error: 'Questions must be an array' });
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
        return reply.status(400).send({
          success: false,
          error: `Question #${i + 1} must have valid text and at least 2 options`,
        });
      }
      if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
        return reply.status(400).send({
          success: false,
          error: `Question #${i + 1} has an invalid correct option index`,
        });
      }
    }

    if (!assessment.questions) {
      assessment.questions = { mcqs: [], coding: [] };
    }

    if (mode === 'append') {
      assessment.questions.mcqs = [...(assessment.questions.mcqs || []), ...questions];
    } else {
      assessment.questions.mcqs = questions;
    }

    const mcqPoints = assessment.questions.mcqs.reduce((sum, q) => sum + (q.points || 10), 0);
    const codingPoints = (assessment.questions.coding || []).reduce(
      (sum, p) => sum + (p.points || 30),
      0
    );
    assessment.totalPoints = mcqPoints + codingPoints;

    await event.save();

    return reply.send({
      success: true,
      message: `Successfully saved ${assessment.questions.mcqs.length} MCQ questions for assessment`,
      mcqs: assessment.questions.mcqs,
      totalPoints: assessment.totalPoints,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to save MCQ questions',
    });
  }
};

// ---------------------------------------------------------------------------
// 21. Save Coding Problems for a Specific Assessment
// ---------------------------------------------------------------------------
export const saveAssessmentCodingProblems = async (
  request: FastifyRequest<{
    Params: { id: string; assessmentId: string };
    Body: {
      problems: IEventArenaCodingProblem[];
      mode?: 'append' | 'replace';
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    const { id, assessmentId } = request.params;
    const { problems, mode = 'replace' } = request.body;

    const event = await Event.findById(id);
    if (!event) return reply.status(404).send({ success: false, error: 'Event not found' });

    const assessment = (event.arenaAssessments || []).find(
      (a: any) => a._id.toString() === assessmentId
    );
    if (!assessment) return reply.status(404).send({ success: false, error: 'Assessment not found' });

    if (!canManageAssessmentQuestions(user, event, assessment)) {
      return reply.status(403).send({
        success: false,
        error: 'Access denied: You are not an assigned admin for this assessment.',
      });
    }

    if (!Array.isArray(problems)) {
      return reply.status(400).send({ success: false, error: 'Problems must be an array' });
    }

    for (let i = 0; i < problems.length; i++) {
      const p = problems[i];
      if (!p.title || !p.description) {
        return reply.status(400).send({
          success: false,
          error: `Coding problem #${i + 1} must have a title and description`,
        });
      }
    }

    if (!assessment.questions) {
      assessment.questions = { mcqs: [], coding: [] };
    }

    if (mode === 'append') {
      assessment.questions.coding = [...(assessment.questions.coding || []), ...problems];
    } else {
      assessment.questions.coding = problems;
    }

    const mcqPoints = (assessment.questions.mcqs || []).reduce((sum, q) => sum + (q.points || 10), 0);
    const codingPoints = assessment.questions.coding.reduce((sum, p) => sum + (p.points || 30), 0);
    assessment.totalPoints = mcqPoints + codingPoints;

    await event.save();

    return reply.send({
      success: true,
      message: `Successfully saved ${assessment.questions.coding.length} coding problems`,
      coding: assessment.questions.coding,
      totalPoints: assessment.totalPoints,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to save coding problems',
    });
  }
};

// ---------------------------------------------------------------------------
// 22. Bulk Upload Questions for a Specific Assessment
// ---------------------------------------------------------------------------
export const bulkUploadAssessmentQuestions = async (
  request: FastifyRequest<{
    Params: { id: string; assessmentId: string };
    Querystring: { type?: 'mcq' | 'coding'; mode?: 'append' | 'replace' };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    const { id, assessmentId } = request.params;
    const uploadType = request.query.type || 'mcq';
    const mode = request.query.mode || 'append';

    const event = await Event.findById(id);
    if (!event) return reply.status(404).send({ success: false, error: 'Event not found' });

    const assessment = (event.arenaAssessments || []).find(
      (a: any) => a._id.toString() === assessmentId
    );
    if (!assessment) return reply.status(404).send({ success: false, error: 'Assessment not found' });

    if (!canManageAssessmentQuestions(user, event, assessment)) {
      return reply.status(403).send({
        success: false,
        error: 'Access denied: You are not an assigned admin for this assessment.',
      });
    }

    const file = await request.file();
    if (!file) return reply.status(400).send({ success: false, error: 'No file uploaded' });

    const buffer = await file.toBuffer();
    const fileName = file.filename.toLowerCase();

    if (!assessment.questions) {
      assessment.questions = { mcqs: [], coding: [] };
    }

    if (uploadType === 'mcq') {
      const parsedList = parseMcqsBuffer(buffer, fileName);
      if (parsedList.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'No valid MCQ questions found in file',
        });
      }
      if (mode === 'append') {
        assessment.questions.mcqs = [...(assessment.questions.mcqs || []), ...parsedList];
      } else {
        assessment.questions.mcqs = parsedList;
      }
      const mcqPoints = assessment.questions.mcqs.reduce((s, q) => s + (q.points || 10), 0);
      const codingPoints = (assessment.questions.coding || []).reduce(
        (s, p) => s + (p.points || 30),
        0
      );
      assessment.totalPoints = mcqPoints + codingPoints;
      await event.save();
      return reply.send({
        success: true,
        message: `Successfully uploaded ${parsedList.length} MCQ questions for assessment!`,
        count: parsedList.length,
        totalMcqs: assessment.questions.mcqs.length,
      });
    } else {
      const parsedCoding = parseCodingBuffer(buffer, fileName);
      if (parsedCoding.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'No valid coding problems found in file',
        });
      }
      if (mode === 'append') {
        assessment.questions.coding = [...(assessment.questions.coding || []), ...parsedCoding];
      } else {
        assessment.questions.coding = parsedCoding;
      }
      const mcqPoints = (assessment.questions.mcqs || []).reduce((s, q) => s + (q.points || 10), 0);
      const codingPoints = assessment.questions.coding.reduce((s, p) => s + (p.points || 30), 0);
      assessment.totalPoints = mcqPoints + codingPoints;
      await event.save();
      return reply.send({
        success: true,
        message: `Successfully uploaded ${parsedCoding.length} coding problems for assessment!`,
        count: parsedCoding.length,
        totalCoding: assessment.questions.coding.length,
      });
    }
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to bulk upload questions',
    });
  }
};

// ---------------------------------------------------------------------------
// 23. Get Assessment Submissions for Admin
// ---------------------------------------------------------------------------
export const getAdminAssessmentSubmissions = async (
  request: FastifyRequest<{ Params: { id: string; assessmentId: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    const { id, assessmentId } = request.params;

    const event = await Event.findById(id).lean();
    if (!event) return reply.status(404).send({ success: false, error: 'Event not found' });

    const assessment = (event.arenaAssessments || []).find(
      (a: any) => a._id.toString() === assessmentId
    );
    if (!assessment) return reply.status(404).send({ success: false, error: 'Assessment not found' });

    if (!canManageAssessmentQuestions(user, event, assessment)) {
      return reply.status(403).send({
        success: false,
        error: 'Access denied: You are not authorized to view submissions for this assessment.',
      });
    }

    const submissions = await EventArenaSubmission.find({ eventId: id, assessmentId })
      .populate('userId', 'name rollNo email profilePicUrl department year college residenceType')
      .populate('teamId', 'name')
      .populate('designSubmission.evaluatedBy', 'name email role')
      .sort({ totalScore: -1, timeTakenSeconds: 1, submittedAt: 1 })
      .lean();

    return reply.send({
      success: true,
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        type: assessment.type,
        totalPoints: assessment.totalPoints,
        designChallenge: assessment.designChallenge || null,
      },
      submissions,
      totalSubmissions: submissions.length,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch assessment submissions',
    });
  }
};

// ---------------------------------------------------------------------------
// Helper: Check if a student is qualified for an assessment round
// ---------------------------------------------------------------------------
export const checkAssessmentQualification = async (
  event: any,
  assessmentIndex: number,
  userId: any
): Promise<{ isQualified: boolean; reason?: string; requiredRank?: number; previousRoundTitle?: string }> => {
  // Round 0 (first round): anyone enrolled is eligible
  if (assessmentIndex <= 0) {
    return { isQualified: true };
  }

  const currentAssessment = event.arenaAssessments[assessmentIndex];
  const cutoffRank = currentAssessment?.qualificationCutoffRank || 0;

  // If cutoffRank is 0 or undefined, no qualification limit is enforced
  if (!cutoffRank || cutoffRank <= 0) {
    return { isQualified: true };
  }

  // Previous round
  const prevAssessment = event.arenaAssessments[assessmentIndex - 1];
  if (!prevAssessment) {
    return { isQualified: true };
  }

  // Find top N on the previous round's leaderboard
  const topSubmissions = await EventArenaSubmission.find({
    eventId: event._id,
    assessmentId: prevAssessment._id.toString(),
    status: { $in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
  })
    .sort({ totalScore: -1, timeTakenSeconds: 1, submittedAt: 1 })
    .limit(cutoffRank)
    .lean();

  const isUserQualified = topSubmissions.some(
    (sub: any) => sub.userId.toString() === userId.toString()
  );

  if (!isUserQualified) {
    return {
      isQualified: false,
      reason: `Only top ${cutoffRank} participants from ${prevAssessment.title} qualify for this round.`,
      requiredRank: cutoffRank,
      previousRoundTitle: prevAssessment.title,
    };
  }

  return { isQualified: true };
};

// ---------------------------------------------------------------------------
// 24. Student View for a Specific Assessment
// ---------------------------------------------------------------------------
export const getStudentAssessmentData = async (
  request: FastifyRequest<{ Params: { id: string; assessmentId: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ success: false, error: 'Unauthorized' });
    const { id, assessmentId } = request.params;

    const event = await Event.findById(id).lean();
    if (!event || !event.hasArena) {
      return reply.status(404).send({ success: false, error: 'Event Arena not found' });
    }

    const isAdminRole = ['Admin', 'SuperAdmin', 'Faculty', 'Committee'].includes(user.role);
    if (!isAdminRole) {
      const enrollment = await Enrollment.findOne({
        event: event._id,
        $or: [{ enrolledBy: user._id }, { 'members.user': user._id }],
      });
      if (!enrollment) {
        return reply.status(403).send({
          success: false,
          error: 'You must be registered or enrolled in this event to enter the assessment arena.',
        });
      }
    }

    const assessmentIndex = (event.arenaAssessments || []).findIndex(
      (a: any) => a._id.toString() === assessmentId
    );
    if (assessmentIndex === -1 || !event.arenaAssessments) return reply.status(404).send({ success: false, error: 'Assessment not found' });
    const assessment = event.arenaAssessments[assessmentIndex];

    // Check qualification for non-admin students
    if (!isAdminRole) {
      if (assessment.status !== 'LIVE') {
        return reply.status(403).send({
          success: false,
          error: assessment.status === 'UPCOMING'
            ? 'This assessment has not started yet. Please wait for the admin to start the round.'
            : 'This assessment is not currently active.',
        });
      }

      const qualCheck = await checkAssessmentQualification(event, assessmentIndex, user._id);
      if (!qualCheck.isQualified) {
        return reply.status(403).send({
          success: false,
          error: qualCheck.reason,
          isDisqualifiedByRank: true,
          qualification: qualCheck,
        });
      }
    }

    // If round has team mode, locate student's team
    let teamInfo: any = null;
    if (assessment.isTeamMode) {
      const assignedTeam = await Team.findOne({
        event: event._id,
        members: user._id,
        status: 'Active',
      })
        .populate('members', 'name rollNo email profilePicUrl department')
        .populate('leader', 'name rollNo email')
        .lean();

      if (assignedTeam) {
        teamInfo = {
          _id: assignedTeam._id,
          name: assignedTeam.name,
          leader: assignedTeam.leader,
          members: assignedTeam.members,
        };
      }
    }

    const submission = await EventArenaSubmission.findOne({
      eventId: event._id,
      assessmentId,
      userId: user._id,
    }).lean();

    const sanitizedMcqs = (assessment.questions?.mcqs || []).map((q: any) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      points: q.points,
    }));

    const sanitizedCoding = (assessment.questions?.coding || []).map((p: any) => ({
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
      testCases: (p.testCases || []).filter((tc: any) => !tc.isHidden),
    }));

    return reply.send({
      success: true,
      event: { _id: event._id, title: event.title },
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        type: assessment.type,
        status: assessment.status,
        durationMinutes: assessment.durationMinutes,
        totalPoints: assessment.totalPoints,
        passingPercentage: assessment.passingPercentage,
        rules: assessment.rules,
        qualificationCutoffRank: assessment.qualificationCutoffRank || 0,
        isTeamMode: Boolean(assessment.isTeamMode),
        teamSize: assessment.teamSize || 2,
        designChallenge: assessment.designChallenge || null,
      },
      team: teamInfo,
      mcqs: sanitizedMcqs,
      coding: sanitizedCoding,
      designChallenge: assessment.designChallenge || null,
      submission: submission || null,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch assessment data',
    });
  }
};

// ---------------------------------------------------------------------------
// 25. Start Assessment Session for Student
// ---------------------------------------------------------------------------
export const startAssessmentSession = async (
  request: FastifyRequest<{ Params: { id: string; assessmentId: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ success: false, error: 'Unauthorized' });
    const { id, assessmentId } = request.params;

    const event = await Event.findById(id).lean();
    if (!event || !event.hasArena) {
      return reply.status(400).send({ success: false, error: 'Event Arena is not available' });
    }

    const assessmentIndex = (event.arenaAssessments || []).findIndex(
      (a: any) => a._id.toString() === assessmentId
    );
    if (assessmentIndex === -1 || !event.arenaAssessments) return reply.status(404).send({ success: false, error: 'Assessment not found' });
    const assessment = event.arenaAssessments[assessmentIndex];

    const isAdminRole = ['Admin', 'SuperAdmin', 'Faculty', 'Committee'].includes(user.role);
    if (!isAdminRole) {
      if (assessment.status !== 'LIVE') {
        return reply.status(403).send({
          success: false,
          error: assessment.status === 'UPCOMING'
            ? 'This assessment has not started yet. Please wait for the admin to start the round.'
            : 'This assessment is not currently active.',
        });
      }

      const qualCheck = await checkAssessmentQualification(event, assessmentIndex, user._id);
      if (!qualCheck.isQualified) {
        return reply.status(403).send({
          success: false,
          error: qualCheck.reason,
        });
      }
    }

    // Check team info if team mode
    let userTeamId: any = undefined;
    let userTeamName = '';
    if (assessment.isTeamMode) {
      const assignedTeam = await Team.findOne({
        event: event._id,
        members: user._id,
        status: 'Active',
      }).lean();
      if (assignedTeam) {
        userTeamId = assignedTeam._id;
        userTeamName = assignedTeam.name;
      }
    }

    let submission = await EventArenaSubmission.findOne({
      eventId: event._id,
      assessmentId,
      userId: user._id,
    });

    if (!submission) {
      submission = await EventArenaSubmission.create({
        eventId: event._id,
        assessmentId,
        userId: user._id,
        teamId: userTeamId,
        teamName: userTeamName,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        maxPossibleScore: assessment.totalPoints || 100,
      });
    }

    return reply.send({
      success: true,
      message: 'Assessment session active',
      submission,
      durationMinutes: assessment.durationMinutes || 60,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to start assessment session',
    });
  }
};

// ---------------------------------------------------------------------------
// 26. Run Assessment Code (Visible Test Cases)
// ---------------------------------------------------------------------------
export const runAssessmentCode = async (
  request: FastifyRequest<{
    Params: { id: string; assessmentId: string };
    Body: { problemId: string; language: string; code: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const { id, assessmentId } = request.params;
    const { problemId, language, code } = request.body;

    const event = await Event.findById(id).lean();
    if (!event || !event.hasArena) {
      return reply.status(404).send({ success: false, error: 'Event Arena not found' });
    }

    const assessment = (event.arenaAssessments || []).find(
      (a: any) => a._id.toString() === assessmentId
    );
    if (!assessment) return reply.status(404).send({ success: false, error: 'Assessment not found' });

    const problem = (assessment.questions?.coding || []).find(
      (p: any) => p._id.toString() === problemId
    );
    if (!problem) return reply.status(404).send({ success: false, error: 'Coding problem not found' });

    const visibleTestCases = (problem.testCases || []).filter((tc: any) => !tc.isHidden);
    const testCasesToRun =
      visibleTestCases.length > 0
        ? visibleTestCases
        : [
            {
              input: problem.sampleInput || '',
              expectedOutput: problem.sampleOutput || '',
              isHidden: false,
            },
          ];

    const results = [];
    let allPassed = true;

    for (let i = 0; i < testCasesToRun.length; i++) {
      const tc = testCasesToRun[i];
      try {
        const exec = await rceService.executeCode({
          language,
          sourceCode: code,
          stdin: tc.input || '',
          timeoutMs: 5000,
        });

        const actualOut = (exec.stdout || '').trim();
        const expectedOut = (tc.expectedOutput || '').trim();
        const passed = actualOut === expectedOut && exec.status === 'success';
        if (!passed) allPassed = false;

        results.push({
          testCaseNumber: i + 1,
          input: tc.input,
          expectedOutput: expectedOut,
          actualOutput: actualOut,
          passed,
          executionTimeMs: exec.executionTimeMs,
          error: exec.stderr || exec.error || null,
        });
      } catch (e: any) {
        allPassed = false;
        results.push({
          testCaseNumber: i + 1,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: '',
          passed: false,
          error: e.message || 'Execution error',
        });
      }
    }

    return reply.send({ success: true, allPassed, results });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to execute code',
    });
  }
};

// ---------------------------------------------------------------------------
// 27. Submit Coding Problem Solution for a Specific Assessment
// ---------------------------------------------------------------------------
export const submitAssessmentCodingProblem = async (
  request: FastifyRequest<{
    Params: { id: string; assessmentId: string };
    Body: { problemId: string; language: string; code: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ success: false, error: 'Unauthorized' });
    const { id, assessmentId } = request.params;
    const { problemId, language, code } = request.body;

    const event = await Event.findById(id).lean();
    if (!event || !event.hasArena) {
      return reply.status(404).send({ success: false, error: 'Event Arena not found' });
    }

    const assessment = (event.arenaAssessments || []).find(
      (a: any) => a._id.toString() === assessmentId
    );
    if (!assessment) return reply.status(404).send({ success: false, error: 'Assessment not found' });

    const problem = (assessment.questions?.coding || []).find(
      (p: any) => p._id.toString() === problemId
    );
    if (!problem) return reply.status(404).send({ success: false, error: 'Coding problem not found' });

    const allTestCases = problem.testCases || [];
    let passedCount = 0;

    for (const tc of allTestCases) {
      try {
        const exec = await rceService.executeCode({
          language,
          sourceCode: code,
          stdin: tc.input || '',
          timeoutMs: 5000,
        });
        const actualOut = (exec.stdout || '').trim();
        const expectedOut = (tc.expectedOutput || '').trim();
        if (actualOut === expectedOut && exec.status === 'success') {
          passedCount++;
        }
      } catch {
        // failed test case
      }
    }

    const totalTestCases = allTestCases.length || 1;
    const pointsPossible = problem.points || 30;
    const pointsEarned = Math.round((passedCount / totalTestCases) * pointsPossible);
    const status = passedCount === totalTestCases ? 'ACCEPTED' : 'WRONG_ANSWER';

    const submission = await EventArenaSubmission.findOne({
      eventId: event._id,
      assessmentId,
      userId: user._id,
    });

    if (submission) {
      const existingIdx = submission.codingSubmissions.findIndex(
        (cs) => cs.problemId === problemId
      );
      const entry = {
        problemId,
        language,
        code,
        testCasesPassed: passedCount,
        totalTestCases,
        pointsEarned,
        status: status as any,
      };

      if (existingIdx >= 0) {
        submission.codingSubmissions[existingIdx] = entry;
      } else {
        submission.codingSubmissions.push(entry);
      }
      await submission.save();
    }

    return reply.send({
      success: true,
      problemId,
      status,
      passedCount,
      totalTestCases,
      pointsEarned,
      pointsPossible,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to submit problem solution',
    });
  }
};

// ---------------------------------------------------------------------------
// 28. Final Submit for a Specific Assessment
// ---------------------------------------------------------------------------
export const submitAssessmentFinal = async (
  request: FastifyRequest<{
    Params: { id: string; assessmentId: string };
    Body: {
      mcqAnswers?: Array<{ questionId: string; selectedOptionIndex: number }>;
      tabSwitchCount?: number;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ success: false, error: 'Unauthorized' });
    const { id, assessmentId } = request.params;
    const { mcqAnswers = [], tabSwitchCount = 0 } = request.body || {};

    const event = await Event.findById(id).lean();
    if (!event || !event.hasArena) {
      return reply.status(404).send({ success: false, error: 'Event Arena not found' });
    }

    const assessment = (event.arenaAssessments || []).find(
      (a: any) => a._id.toString() === assessmentId
    );
    if (!assessment) return reply.status(404).send({ success: false, error: 'Assessment not found' });

    let submission = await EventArenaSubmission.findOne({
      eventId: event._id,
      assessmentId,
      userId: user._id,
    });

    if (!submission) {
      submission = new EventArenaSubmission({
        eventId: event._id,
        assessmentId,
        userId: user._id,
        startedAt: new Date(),
      });
    }

    let mcqScore = 0;
    const gradedMcqs = [];
    const questionBank = assessment.questions?.mcqs || [];

    for (const ans of mcqAnswers) {
      const q = questionBank.find((item: any) => item._id.toString() === ans.questionId);
      if (q) {
        const isCorrect = q.correctOptionIndex === ans.selectedOptionIndex;
        const pts = isCorrect ? q.points || 10 : 0;
        mcqScore += pts;
        gradedMcqs.push({
          questionId: ans.questionId,
          selectedOptionIndex: ans.selectedOptionIndex,
          isCorrect,
          pointsEarned: pts,
        });
      }
    }

    submission.mcqAnswers = gradedMcqs;
    submission.mcqScore = mcqScore;

    const codingScore = (submission.codingSubmissions || []).reduce(
      (sum, item) => sum + (item.pointsEarned || 0),
      0
    );
    submission.codingScore = codingScore;

    const rawTotalScore = mcqScore + codingScore;
    const maxPossible = assessment.totalPoints || 100;

    // 5% mark reduction on every tab switch
    const safeTabSwitchCount = Math.max(0, Number(tabSwitchCount) || submission.tabSwitchCount || 0);
    const penaltyPercent = Math.min(100, safeTabSwitchCount * 5); // 5% per switch, capped at 100%
    const penaltyDeduction = (rawTotalScore * penaltyPercent) / 100;
    const adjustedTotalScore = Math.max(0, Math.round((rawTotalScore - penaltyDeduction) * 10) / 10);

    const scorePercentage = maxPossible > 0 ? Math.round((adjustedTotalScore / maxPossible) * 100) : 0;
    const passingPercentage = assessment.passingPercentage ?? 50;
    const isPassed = scorePercentage >= passingPercentage;

    const now = new Date();
    const started = submission.startedAt ? new Date(submission.startedAt) : now;
    const timeTakenSeconds = Math.max(0, Math.floor((now.getTime() - started.getTime()) / 1000));

    submission.rawTotalScore = rawTotalScore;
    submission.tabSwitchCount = safeTabSwitchCount;
    submission.tabSwitchPenaltyPercentage = penaltyPercent;
    submission.totalScore = adjustedTotalScore;
    submission.maxPossibleScore = maxPossible;
    submission.scorePercentage = scorePercentage;
    submission.isPassed = isPassed;
    submission.status = 'SUBMITTED';
    submission.submittedAt = now;
    submission.timeTakenSeconds = timeTakenSeconds;

    await submission.save();

    return reply.send({
      success: true,
      message: 'Assessment submitted successfully!',
      results: {
        rawTotalScore,
        tabSwitchCount: safeTabSwitchCount,
        tabSwitchPenaltyPercentage: penaltyPercent,
        totalScore: adjustedTotalScore,
        maxPossibleScore: maxPossible,
        scorePercentage,
        isPassed,
        mcqScore,
        codingScore,
        timeTakenSeconds,
        status: submission.status,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to finalize assessment submission',
    });
  }
};

// ---------------------------------------------------------------------------
// 29. Leaderboard for a Specific Assessment
// ---------------------------------------------------------------------------
export const getAssessmentLeaderboard = async (
  request: FastifyRequest<{ Params: { id: string; assessmentId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id, assessmentId } = request.params;

    const submissions = await EventArenaSubmission.find({
      eventId: id,
      assessmentId,
      status: { $in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
    })
      .populate('userId', 'name rollNo email profilePicUrl department residenceType')
      .populate('teamId', 'name')
      .sort({ totalScore: -1, timeTakenSeconds: 1, submittedAt: 1 })
      .limit(100)
      .lean();

    const leaderboard = submissions.map((s: any, idx: number) => ({
      rank: idx + 1,
      student: s.userId,
      teamName: s.teamName || s.teamId?.name || null,
      rawTotalScore: s.rawTotalScore ?? s.totalScore,
      tabSwitchCount: s.tabSwitchCount || 0,
      tabSwitchPenaltyPercentage: s.tabSwitchPenaltyPercentage || 0,
      totalScore: s.totalScore,
      maxPossibleScore: s.maxPossibleScore,
      scorePercentage: s.scorePercentage,
      mcqScore: s.mcqScore,
      codingScore: s.codingScore,
      designScore: s.designScore || s.designSubmission?.pointsEarned || 0,
      hasDesignSubmission: !!s.designSubmission?.figmaLink,
      timeTakenSeconds: s.timeTakenSeconds || 0,
      isPassed: s.isPassed,
      submittedAt: s.submittedAt,
    }));

    return reply.send({ success: true, leaderboard });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch assessment leaderboard',
    });
  }
};

// ---------------------------------------------------------------------------
// 30. Save UI/UX Design Challenge for an Assessment
// ---------------------------------------------------------------------------
export const saveAssessmentDesignChallenge = async (
  request: FastifyRequest<{
    Params: { id: string; assessmentId: string };
    Body: {
      title?: string;
      description?: string;
      problemStatement?: string;
      designImageUrl?: string;
      additionalImages?: string[];
      referenceFigmaUrl?: string;
      deliverables?: string[];
      guidelines?: string[];
      points?: number;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    const { id, assessmentId } = request.params;
    const {
      title,
      description,
      problemStatement,
      designImageUrl,
      additionalImages,
      referenceFigmaUrl,
      deliverables,
      guidelines,
      points = 100,
    } = request.body;

    const event = await Event.findById(id);
    if (!event) return reply.status(404).send({ success: false, error: 'Event not found' });

    const assessment = (event.arenaAssessments || []).find(
      (a: any) => a._id.toString() === assessmentId
    );
    if (!assessment) return reply.status(404).send({ success: false, error: 'Assessment not found' });

    if (!canManageAssessmentQuestions(user, event, assessment)) {
      return reply.status(403).send({
        success: false,
        error: 'Access denied: You are not authorized to manage this assessment.',
      });
    }

    assessment.designChallenge = {
      title: title || assessment.title || 'UI/UX Design Challenge',
      description: description || assessment.description || '',
      problemStatement: problemStatement || '',
      designImageUrl: designImageUrl || '',
      additionalImages: Array.isArray(additionalImages) ? additionalImages : [],
      referenceFigmaUrl: referenceFigmaUrl || '',
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      guidelines: Array.isArray(guidelines) ? guidelines : [],
      points: Number(points) || 100,
    };

    if (assessment.type === 'UI_UX') {
      assessment.totalPoints = Number(points) || 100;
    }

    // Sync to event.arenaDesignChallenge if first/main assessment
    if (event.arenaAssessments?.[0]?._id?.toString() === assessmentId) {
      (event as any).arenaDesignChallenge = assessment.designChallenge;
    }

    await event.save();

    return reply.send({
      success: true,
      message: 'UI/UX design challenge configured successfully',
      designChallenge: assessment.designChallenge,
      totalPoints: assessment.totalPoints,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to save UI/UX design challenge',
    });
  }
};

// ---------------------------------------------------------------------------
// 31. Student Submit Figma Link & Notes for UI/UX Assessment
// ---------------------------------------------------------------------------
export const submitAssessmentDesign = async (
  request: FastifyRequest<{
    Params: { id: string; assessmentId: string };
    Body: {
      figmaLink: string;
      notes?: string;
      previewImageUrl?: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ success: false, error: 'Unauthorized' });
    const { id, assessmentId } = request.params;
    const { figmaLink, notes, previewImageUrl } = request.body;

    if (!figmaLink || typeof figmaLink !== 'string' || !figmaLink.trim()) {
      return reply.status(400).send({
        success: false,
        error: 'Please provide a valid Figma design or prototype link.',
      });
    }

    const trimmedLink = figmaLink.trim();
    if (!trimmedLink.includes('figma.com/')) {
      return reply.status(400).send({
        success: false,
        error: 'The link must be a valid Figma URL (e.g., https://www.figma.com/file/... or /proto/...)',
      });
    }

    const event = await Event.findById(id).lean();
    if (!event || !event.hasArena) {
      return reply.status(404).send({ success: false, error: 'Event Arena not found' });
    }

    const assessment = (event.arenaAssessments || []).find(
      (a: any) => a._id.toString() === assessmentId
    );
    if (!assessment) return reply.status(404).send({ success: false, error: 'Assessment not found' });

    let submission = await EventArenaSubmission.findOne({
      eventId: event._id,
      assessmentId,
      userId: user._id,
    });

    if (!submission) {
      submission = new EventArenaSubmission({
        eventId: event._id,
        assessmentId,
        userId: user._id,
        startedAt: new Date(),
        maxPossibleScore: assessment.totalPoints || 100,
      });
    }

    // Preserve points and evaluation if previously reviewed, or keep default
    submission.designSubmission = {
      figmaLink: trimmedLink,
      notes: notes || '',
      previewImageUrl: previewImageUrl || '',
      submittedAt: new Date(),
      pointsEarned: submission.designSubmission?.pointsEarned || 0,
      feedback: submission.designSubmission?.feedback || '',
      isEvaluated: submission.designSubmission?.isEvaluated || false,
      evaluatedBy: submission.designSubmission?.evaluatedBy,
      evaluatedAt: submission.designSubmission?.evaluatedAt,
    };

    submission.status = 'SUBMITTED';
    submission.submittedAt = new Date();
    submission.maxPossibleScore = assessment.totalPoints || 100;

    await submission.save();

    return reply.send({
      success: true,
      message: 'Figma design submission received successfully!',
      submission,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to submit Figma design',
    });
  }
};

// ---------------------------------------------------------------------------
// 32. Admin Evaluate Figma Design Submission (Score & Feedback)
// ---------------------------------------------------------------------------
export const evaluateAssessmentDesign = async (
  request: FastifyRequest<{
    Params: { id: string; assessmentId: string; submissionId: string };
    Body: {
      pointsEarned: number;
      feedback?: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ success: false, error: 'Unauthorized' });
    const { id, assessmentId, submissionId } = request.params;
    const { pointsEarned, feedback } = request.body;

    const event = await Event.findById(id).lean();
    if (!event) return reply.status(404).send({ success: false, error: 'Event not found' });

    const assessment = (event.arenaAssessments || []).find(
      (a: any) => a._id.toString() === assessmentId
    );
    if (!assessment) return reply.status(404).send({ success: false, error: 'Assessment not found' });

    if (!canManageAssessmentQuestions(user, event, assessment)) {
      return reply.status(403).send({
        success: false,
        error: 'Access denied: You are not authorized to evaluate this assessment.',
      });
    }

    const submission = await EventArenaSubmission.findById(submissionId);
    if (!submission) {
      return reply.status(404).send({ success: false, error: 'Submission not found' });
    }

    if (!submission.designSubmission) {
      return reply.status(400).send({
        success: false,
        error: 'This submission does not contain any Figma design submission to evaluate.',
      });
    }

    const maxScore = assessment.totalPoints || 100;
    const awarded = Math.max(0, Math.min(Number(pointsEarned) || 0, maxScore));

    submission.designSubmission.pointsEarned = awarded;
    submission.designSubmission.feedback = feedback || '';
    submission.designSubmission.isEvaluated = true;
    submission.designSubmission.evaluatedBy = new mongoose.Types.ObjectId(user._id);
    submission.designSubmission.evaluatedAt = new Date();

    submission.designScore = awarded;
    const totalScore = (submission.mcqScore || 0) + (submission.codingScore || 0) + awarded;
    const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const isPassed = scorePercentage >= (assessment.passingPercentage || 50);

    submission.totalScore = totalScore;
    submission.scorePercentage = scorePercentage;
    submission.isPassed = isPassed;

    await submission.save();

    return reply.send({
      success: true,
      message: 'Design submission evaluated successfully!',
      submission,
    });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Failed to evaluate design submission',
    });
  }
};

// ---------------------------------------------------------------------------
// 33. Arena Teams Management (Create Team & Assign Members for Event Arena)
// ---------------------------------------------------------------------------
export const getArenaTeams = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const teams = await Team.find({ event: id, status: 'Active' })
      .populate('members', 'name rollNo email profilePicUrl department year')
      .populate('leader', 'name rollNo email')
      .sort({ createdAt: -1 })
      .lean();

    return reply.send({ success: true, teams });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({ success: false, error: 'Failed to fetch teams' });
  }
};

export const createArenaTeam = async (
  request: FastifyRequest<{
    Params: { id: string };
    Body: { name: string; memberUserIds?: string[]; leaderUserId?: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ success: false, error: 'Unauthorized' });
    const { id } = request.params;
    const { name, memberUserIds = [], leaderUserId } = request.body || {};

    if (!name || !name.trim()) {
      return reply.status(400).send({ success: false, error: 'Team name is required' });
    }

    const event = await Event.findById(id);
    if (!event) return reply.status(404).send({ success: false, error: 'Event not found' });

    if (!canManageEventArenaQuestions(user, event)) {
      return reply.status(403).send({ success: false, error: 'Unauthorized to manage teams' });
    }

    const existingTeam = await Team.findOne({ name: name.trim(), event: id });
    if (existingTeam) {
      return reply.status(400).send({ success: false, error: 'Team with this name already exists in this event' });
    }

    const memberObjectIds = memberUserIds.map((m) => new mongoose.Types.ObjectId(m));
    const leaderObjectId = leaderUserId ? new mongoose.Types.ObjectId(leaderUserId) : memberObjectIds[0];

    const team = await Team.create({
      name: name.trim(),
      event: event._id,
      members: memberObjectIds,
      leader: leaderObjectId,
      status: 'Active',
      isActive: true,
      createdBy: user._id,
    });

    const populated = await Team.findById(team._id)
      .populate('members', 'name rollNo email profilePicUrl department year')
      .populate('leader', 'name rollNo email');

    return reply.status(201).send({ success: true, message: 'Team created successfully', team: populated });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({ success: false, error: err.message || 'Failed to create team' });
  }
};

export const assignArenaTeamMembers = async (
  request: FastifyRequest<{
    Params: { id: string; teamId: string };
    Body: { memberUserIds: string[]; leaderUserId?: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    const { id, teamId } = request.params;
    const { memberUserIds = [], leaderUserId } = request.body || {};

    const event = await Event.findById(id);
    if (!event) return reply.status(404).send({ success: false, error: 'Event not found' });

    if (!canManageEventArenaQuestions(user, event)) {
      return reply.status(403).send({ success: false, error: 'Unauthorized to manage teams' });
    }

    const team = await Team.findOne({ _id: teamId, event: id });
    if (!team) return reply.status(404).send({ success: false, error: 'Team not found' });

    const memberObjectIds = memberUserIds.map((m) => new mongoose.Types.ObjectId(m));
    team.members = memberObjectIds;
    if (leaderUserId) {
      team.leader = new mongoose.Types.ObjectId(leaderUserId);
    } else if (memberObjectIds.length > 0 && !team.leader) {
      team.leader = memberObjectIds[0];
    }

    await team.save();

    const populated = await Team.findById(team._id)
      .populate('members', 'name rollNo email profilePicUrl department year')
      .populate('leader', 'name rollNo email');

    return reply.send({ success: true, message: 'Team members updated successfully', team: populated });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({ success: false, error: err.message || 'Failed to assign team members' });
  }
};

export const deleteArenaTeam = async (
  request: FastifyRequest<{ Params: { id: string; teamId: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    const { id, teamId } = request.params;

    const event = await Event.findById(id);
    if (!event) return reply.status(404).send({ success: false, error: 'Event not found' });

    if (!canManageEventArenaQuestions(user, event)) {
      return reply.status(403).send({ success: false, error: 'Unauthorized to manage teams' });
    }

    await Team.deleteOne({ _id: teamId, event: id });
    return reply.send({ success: true, message: 'Team removed successfully' });
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({ success: false, error: 'Failed to delete team' });
  }
};


