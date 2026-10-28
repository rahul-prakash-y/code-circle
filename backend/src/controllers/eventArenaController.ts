import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import Event, { IEvent, IEventArenaMcqQuestion, IEventArenaCodingProblem } from '../models/eventModel';
import EventArenaSubmission from '../models/eventArenaSubmissionModel';
import Enrollment from '../models/enrollmentModel';
import User from '../models/userModel';
import rceService from '../services/rceService';
import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// Authorization Helper: SuperAdmin OR Admins selected by SuperAdmin
// ---------------------------------------------------------------------------
export const canManageEventArenaQuestions = (user: any, event: any): boolean => {
  if (!user) return false;
  if (user.role === 'SuperAdmin') return true;

  if (Array.isArray(event.arenaAdmins)) {
    return event.arenaAdmins.some((adminRef: any) => {
      const id = adminRef?._id ? adminRef._id.toString() : adminRef.toString();
      return id === user._id.toString();
    });
  }
  return false;
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
      arenaType?: 'CODING' | 'MCQ' | 'HYBRID';
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
      },
      mcqs: sanitizedMcqs,
      coding: sanitizedCoding,
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
