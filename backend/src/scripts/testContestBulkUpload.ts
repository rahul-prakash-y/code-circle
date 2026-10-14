import * as XLSX from 'xlsx';
import {
  downloadContestMcqTemplate,
  downloadContestCodingTemplate,
} from '../controllers/contestController';

async function testContestBulkUpload() {
  console.log('--- Testing Contest Bulk Upload Templates & Parsers ---');

  // 1. Test MCQ Template Generation
  let mcqBuffer: any = null;
  const mockReplyMcq: any = {
    header: function (name: string, val: string) {
      return this;
    },
    send: function (buf: Buffer) {
      mcqBuffer = buf;
      return this;
    },
  };

  await downloadContestMcqTemplate({} as any, mockReplyMcq);
  if (!mcqBuffer || mcqBuffer.length === 0) {
    throw new Error('MCQ template generation failed: buffer is empty');
  }

  const mcqWorkbook = XLSX.read(mcqBuffer, { type: 'buffer' });
  console.log('MCQ Workbook Sheet Names:', mcqWorkbook.SheetNames);
  if (!mcqWorkbook.SheetNames.includes('MCQ Questions') || !mcqWorkbook.SheetNames.includes('Instructions')) {
    throw new Error('MCQ template is missing required sheets');
  }

  const mcqRows: any[] = XLSX.utils.sheet_to_json(mcqWorkbook.Sheets['MCQ Questions']);
  console.log(`MCQ Template contains ${mcqRows.length} sample rows:`);
  mcqRows.forEach((r, idx) => {
    console.log(`  [Q${idx + 1}] ${r.Question?.slice(0, 45)}... (Correct: ${r.CorrectOption}, Pts: ${r.Points})`);
  });

  if (mcqRows.length < 2) {
    throw new Error('Expected at least 2 sample MCQ rows');
  }

  // 2. Test Coding Template Generation
  let codingBuffer: any = null;
  const mockReplyCoding: any = {
    header: function (name: string, val: string) {
      return this;
    },
    send: function (buf: Buffer) {
      codingBuffer = buf;
      return this;
    },
  };

  await downloadContestCodingTemplate({} as any, mockReplyCoding);
  if (!codingBuffer || codingBuffer.length === 0) {
    throw new Error('Coding template generation failed: buffer is empty');
  }

  const codingWorkbook = XLSX.read(codingBuffer, { type: 'buffer' });
  console.log('Coding Workbook Sheet Names:', codingWorkbook.SheetNames);
  if (!codingWorkbook.SheetNames.includes('Coding Challenges') || !codingWorkbook.SheetNames.includes('Instructions')) {
    throw new Error('Coding template is missing required sheets');
  }

  const codingRows: any[] = XLSX.utils.sheet_to_json(codingWorkbook.Sheets['Coding Challenges']);
  console.log(`Coding Template contains ${codingRows.length} sample rows:`);
  codingRows.forEach((r, idx) => {
    console.log(`  [C${idx + 1}] "${r.Title}" (${r.Difficulty}, ${r.Points} pts) - TC1 hidden: ${r.TestCase1_IsHidden}`);
  });

  if (codingRows.length < 2) {
    throw new Error('Expected at least 2 sample Coding rows');
  }

  // 3. Test MCQ Parser with the generated template
  let parsedMcqResult: any = null;
  const mockReqMcq: any = {
    file: async () => ({
      filename: 'contest_mcq_sample_template.xlsx',
      file: [mcqBuffer],
    }),
    body: {},
    log: console,
  };
  const mockReplyParseMcq: any = {
    status: function (code: number) {
      this.statusCode = code;
      return this;
    },
    send: function (payload: any) {
      parsedMcqResult = payload;
      return this;
    },
  };

  const { parseContestMcqUpload } = await import('../controllers/contestController');
  await parseContestMcqUpload(mockReqMcq, mockReplyParseMcq);

  console.log('MCQ Parser Output:', {
    success: parsedMcqResult?.success,
    count: parsedMcqResult?.count,
    errors: parsedMcqResult?.errors,
  });

  if (!parsedMcqResult?.success || parsedMcqResult.count !== mcqRows.length) {
    throw new Error(`MCQ Parser failed: expected ${mcqRows.length} questions, got ${parsedMcqResult?.count}`);
  }

  // Verify first question structure
  const firstQ = parsedMcqResult.data[0];
  console.log('Sample parsed MCQ:', {
    question: firstQ.question,
    optionsCount: firstQ.options.length,
    correctOptionIndex: firstQ.correctOptionIndex,
    points: firstQ.points,
  });

  if (firstQ.correctOptionIndex !== 2) { // 'C' is index 2
    throw new Error(`Expected correctOptionIndex to be 2 for Option 'C', got ${firstQ.correctOptionIndex}`);
  }

  // 4. Test Coding Parser with the generated template
  let parsedCodingResult: any = null;
  const mockReqCoding: any = {
    file: async () => ({
      filename: 'contest_coding_sample_template.xlsx',
      file: [codingBuffer],
    }),
    body: {},
    log: console,
  };
  const mockReplyParseCoding: any = {
    status: function (code: number) {
      this.statusCode = code;
      return this;
    },
    send: function (payload: any) {
      parsedCodingResult = payload;
      return this;
    },
  };

  const { parseContestCodingUpload } = await import('../controllers/contestController');
  await parseContestCodingUpload(mockReqCoding, mockReplyParseCoding);

  console.log('Coding Parser Output:', {
    success: parsedCodingResult?.success,
    count: parsedCodingResult?.count,
    errors: parsedCodingResult?.errors,
  });

  if (!parsedCodingResult?.success || parsedCodingResult.count !== codingRows.length) {
    throw new Error(`Coding Parser failed: expected ${codingRows.length} challenges, got ${parsedCodingResult?.count}`);
  }

  // Verify first challenge test cases
  const firstChallenge = parsedCodingResult.data[0];
  console.log('Sample parsed Coding Challenge:', {
    title: firstChallenge.title,
    difficulty: firstChallenge.difficulty,
    points: firstChallenge.points,
    testCasesCount: firstChallenge.testCases.length,
    hasStarterCode: Boolean(firstChallenge.starterCode.python),
  });

  if (firstChallenge.testCases.length < 3) {
    throw new Error(`Expected at least 3 test cases, got ${firstChallenge.testCases.length}`);
  }

  const hiddenCases = firstChallenge.testCases.filter((tc: any) => tc.isHidden);
  const publicCases = firstChallenge.testCases.filter((tc: any) => !tc.isHidden);
  console.log(`Test cases breakdown: ${publicCases.length} public, ${hiddenCases.length} hidden`);

  if (hiddenCases.length === 0 || publicCases.length === 0) {
    throw new Error('Expected both public and hidden test cases to be parsed correctly');
  }

  console.log('--- ALL CONTEST BULK UPLOAD TESTS PASSED SUCCESSFULLY! ---');
}

testContestBulkUpload().catch((e) => {
  console.error('Test execution failed:', e);
  process.exitCode = 1;
});
