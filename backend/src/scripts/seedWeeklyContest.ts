import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db';
import Contest from '../models/contestModel';
import User from '../models/userModel';

async function seed() {
  await connectDB();

  let admin = await User.findOne({ role: { $in: ['Admin', 'SuperAdmin'] } });
  if (!admin) {
    admin = await User.findOne();
  }

  const adminId = admin?._id || new mongoose.Types.ObjectId();

  const existing = await Contest.findOne({ slug: 'weekly-algo-battle-01' });
  if (existing) {
    console.log('[Seed] Weekly Contest already exists.');
    process.exit(0);
  }

  const now = new Date();
  const startTime = new Date(now.getTime() - 2 * 3600 * 1000); // Started 2 hours ago
  const endTime = new Date(now.getTime() + 6 * 24 * 3600 * 1000); // Ends in 6 days

  const contest = await Contest.create({
    title: 'Weekly Algorithm Arena #1: Core Algorithms & Data Structures',
    slug: 'weekly-algo-battle-01',
    description:
      'Compete in our premier campus weekly battle! Features algorithmic challenges and core computer science knowledge checks. Points are permanently added to your student profile leaderboard.',
    type: 'HYBRID',
    difficulty: 'All Levels',
    startTime,
    endTime,
    durationMinutes: 60,
    totalPoints: 100,
    status: 'LIVE',
    tags: ['Algorithms', 'Data Structures', 'Weekly Contest', 'Code Circle'],
    rules: [
      'Timer starts when you click Enter Arena and runs continuously for 60 minutes.',
      'MCQ questions test core CS concepts (DSA, time complexity, and memory).',
      'Coding problems are compiled in isolated sandboxes and tested against sample and hidden test cases.',
      'Achieve top scores to earn permanent Club Points & Badges.',
    ],
    mcqQuestions: [
      {
        question: 'What is the worst-case time complexity of lookup in an unbalanced Binary Search Tree?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
        correctOptionIndex: 2,
        points: 10,
        explanation: 'In the worst case (a degenerate/skewed tree), a BST behaves like a linked list with O(n) search time.',
      },
      {
        question: 'Which data structure is primarily used to implement Breadth-First Search (BFS)?',
        options: ['Stack', 'Queue', 'Priority Queue', 'Binary Heap'],
        correctOptionIndex: 1,
        points: 10,
        explanation: 'BFS explores vertices level-by-level using a FIFO Queue.',
      },
      {
        question: 'In Python, what is the average time complexity of checking membership `x in set_obj`?',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
        correctOptionIndex: 2,
        points: 10,
        explanation: 'Python sets are implemented using hash tables with average O(1) membership lookup.',
      },
    ],
    codingProblems: [
      {
        title: 'Sum of Array Elements',
        description:
          'Write a program that reads an integer `n`, followed by `n` space-separated integers, and prints their total sum.\n\n### Input Format\n- First line: integer `n`\n- Second line: `n` space-separated integers\n\n### Output Format\n- Single integer representing the sum',
        difficulty: 'Easy',
        points: 30,
        allowedLanguages: ['python', 'javascript', 'cpp', 'java', 'c'],
        starterCode: {
          python: '# Read input and compute sum\nimport sys\n\ninput_data = sys.stdin.read().split()\nif input_data:\n    n = int(input_data[0])\n    nums = [int(x) for x in input_data[1:n+1]]\n    print(sum(nums))\n',
          javascript: 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf-8").trim().split(/\\s+/);\nif (input.length > 1) {\n  const n = parseInt(input[0]);\n  const sum = input.slice(1, n + 1).reduce((acc, v) => acc + parseInt(v), 0);\n  console.log(sum);\n}\n',
        },
        sampleInput: '5\n1 2 3 4 5',
        sampleOutput: '15',
        testCases: [
          { input: '5\n1 2 3 4 5', expectedOutput: '15', isHidden: false },
          { input: '3\n10 20 30', expectedOutput: '60', isHidden: true },
          { input: '1\n99', expectedOutput: '99', isHidden: true },
        ],
      },
      {
        title: 'Palindrome String Validator',
        description:
          'Given a string `s`, determine if it is a palindrome considering only alphanumeric characters and ignoring cases. Output `YES` if it is a palindrome, otherwise `NO`.\n\n### Example\n`racecar` -> `YES`\n`codecircle` -> `NO`',
        difficulty: 'Medium',
        points: 40,
        allowedLanguages: ['python', 'javascript', 'cpp', 'java', 'c'],
        starterCode: {
          python: 'import sys\nimport re\n\ns = sys.stdin.read().strip()\nclean = re.sub(r"[^a-zA-Z0-9]", "", s).lower()\nif clean == clean[::-1]:\n    print("YES")\nelse:\n    print("NO")\n',
        },
        sampleInput: 'racecar',
        sampleOutput: 'YES',
        testCases: [
          { input: 'racecar', expectedOutput: 'YES', isHidden: false },
          { input: 'codecircle', expectedOutput: 'NO', isHidden: false },
          { input: 'A man, a plan, a canal: Panama', expectedOutput: 'YES', isHidden: true },
        ],
      },
    ],
    isPublished: true,
    participantsCount: 0,
    createdBy: adminId,
  });

  console.log(`[Seed] Weekly Contest created successfully with ID: ${contest._id}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
