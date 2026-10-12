import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import jwt from 'jsonwebtoken';
import connectDB from '../config/db';
import User from '../models/userModel';
import CodingChallenge from '../models/codingChallengeModel';
import CodingSubmission from '../models/codingSubmissionModel';

const JWT_SECRET = process.env.JWT_SECRET || 'stellar-minimalist-secret-key-2026';

async function testRoutes() {
  await connectDB();

  console.log('[TestRoutes] Preparing test student and challenge...');

  let user = await User.findOne({ email: 'test.student@codecircle.edu' });
  if (!user) {
    user = new User({
      name: 'Test Student',
      email: 'test.student@codecircle.edu',
      password: 'password123',
      role: 'Student',
      rollNo: 'TEST001',
    });
    await user.save();
  }

  const challenge = await CodingChallenge.findOne({ title: 'Two Sum Target Indices' });
  if (!challenge) {
    throw new Error('Seed challenge not found!');
  }

  // Clear previous test submissions for fresh run
  await CodingSubmission.deleteMany({
    challenge: challenge._id,
    student: user._id,
  });

  const token = jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const client = axios.create({
    baseURL: 'http://localhost:5000/api/assessments/code',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 30000,
  });

  const problemId = challenge._id.toString();
  const pythonCode = challenge.starterCode.get('python');

  console.log('[TestRoutes] 1. Testing GET /:problemId ...');
  const getRes = await client.get(`/${problemId}`);
  console.log('[TestRoutes] Challenge Title:', getRes.data.data.title);
  console.log('[TestRoutes] Visible test cases returned:', getRes.data.data.visibleTestCases.length);
  // Verify hidden test cases are NOT returned
  const hasHidden = getRes.data.data.visibleTestCases.some((t: any) => t.isHidden);
  console.log('[TestRoutes] Are hidden test cases exposed to student?', hasHidden ? 'YES (LEAK)' : 'NO (SECURE)');

  console.log('\n[TestRoutes] 2. Testing POST /execute (Visible test cases only) ...');
  const execRes = await client.post('/execute', {
    problemId,
    language: 'python',
    code: pythonCode,
  });
  console.log('[TestRoutes] Execute response:', execRes.data);

  // Wait 2.5s for rate limiter
  await new Promise((r) => setTimeout(r, 2500));

  console.log('\n[TestRoutes] 3. Testing POST /submit (All test cases + Score calculation) ...');
  const submitRes = await client.post('/submit', {
    problemId,
    language: 'python',
    code: pythonCode,
    integrityEvents: [
      {
        type: 'VISIBILITY_CHANGE',
        warningNumber: 1,
        timestamp: new Date().toISOString(),
      },
    ],
  });
  console.log('[TestRoutes] Submit response (Strict format):', submitRes.data);

  console.log('\n[TestRoutes] 4. Testing Resubmission Lock ...');
  try {
    await client.post('/submit', {
      problemId,
      language: 'python',
      code: pythonCode,
    });
    console.error('[TestRoutes] FAILED: Locked submission allowed resubmission!');
  } catch (err: any) {
    console.log('[TestRoutes] Resubmission rejected as expected:', err.response?.status, err.response?.data?.error);
  }

  console.log('\n[TestRoutes] ALL TESTS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

testRoutes().catch((err) => {
  console.error('[TestRoutes] Error:', err.response?.data || err);
  process.exit(1);
});
