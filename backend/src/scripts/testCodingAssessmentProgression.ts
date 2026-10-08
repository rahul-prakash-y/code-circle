import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import '../models/userModel';
import '../models/domainModel';
import '../models/levelModel';
import '../models/studentProgressModel';
import '../models/codingChallengeModel';
import '../models/codingSubmissionModel';
import '../models/domainEnrollmentModel';

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'stellar-minimalist-secret-key-2026';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTest() {
  console.log('===============================================================');
  console.log(' RUNNING CODING ASSESSMENT MAPPING & 70% PROGRESSION GATING TEST');
  console.log('===============================================================\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/code-circle';
  await mongoose.connect(mongoUri);

  const UserModel = mongoose.model('User');
  const DomainModel = mongoose.model('Domain');
  const LevelModel = mongoose.model('Level');
  const CodingChallengeModel = mongoose.model('CodingChallenge');
  const StudentProgressModel = mongoose.model('StudentProgress');
  const CodingSubmissionModel = mongoose.model('CodingSubmission');

  // 1. Create or retrieve test student
  let testUser = await UserModel.findOne({ email: 'coding-progression-tester@codecircle.edu' });
  if (!testUser) {
    testUser = await UserModel.create({
      name: 'Coding Progression Tester',
      email: 'coding-progression-tester@codecircle.edu',
      password: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890123456789012',
      rollNo: `TEST${Math.floor(Math.random() * 90000 + 10000)}`,
      role: 'Student',
      department: 'CSE',
      isBlocked: false,
    });
  }

  // Clear previous progress, submissions, and enrollments for student
  await StudentProgressModel.deleteOne({ userId: testUser._id });
  await CodingSubmissionModel.deleteMany({ student: testUser._id });
  const DomainEnrollmentModel = mongoose.model('DomainEnrollment');
  await DomainEnrollmentModel.deleteMany({ userId: testUser._id });

  const token = jwt.sign(
    {
      id: testUser._id.toString(),
      email: testUser.email,
      role: testUser.role,
      sessionId: testUser.activeSessionId || undefined,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // 2. Create a test Coding Challenge
  let testChallenge = await CodingChallengeModel.findOne({ title: 'Progression Test Challenge - Multiply By Two' });
  if (!testChallenge) {
    testChallenge = await CodingChallengeModel.create({
      title: 'Progression Test Challenge - Multiply By Two',
      description: 'Given an integer N on standard input, print N * 2.',
      allowedLanguages: ['python', 'javascript'],
      testCases: [
        {
          input: '5',
          expectedOutput: '10',
          isHidden: false,
        },
        {
          input: '12',
          expectedOutput: '24',
          isHidden: true,
        },
      ],
      timeLimitMinutes: 30,
      singleSubmissionOnly: false,
      isPublished: true,
    });
  }

  // 3. Create a test Domain with 2 Levels (Level 1 has coding challenge mapped, Level 2 does not)
  let testDomain = await DomainModel.findOne({ name: 'Progression Gating Test Domain' });
  if (!testDomain) {
    testDomain = await DomainModel.create({
      name: 'Progression Gating Test Domain',
      description: 'Domain verifying coding assessment progression',
      coverImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      isLocked: false,
    });
  }

  // Delete existing test levels for this domain to ensure clean state
  await LevelModel.deleteMany({ domainId: testDomain._id });

  const level1 = await LevelModel.create({
    domainId: testDomain._id,
    levelNumber: 1,
    title: 'Level 1 with Mapped Coding Assessment',
    youtubeVideoId: 'aircAruvnKk',
    codingChallengeId: testChallenge._id,
    questQuestions: [
      { question: 'Q1: 1+1=?', options: ['2', '3', '4'], correctOption: 0 },
      { question: 'Q2: 2+2=?', options: ['3', '4', '5'], correctOption: 1 },
      { question: 'Q3: 3+3=?', options: ['5', '6', '7'], correctOption: 1 },
      { question: 'Q4: 4+4=?', options: ['7', '8', '9'], correctOption: 1 },
      { question: 'Q5: 5+5=?', options: ['9', '10', '11'], correctOption: 1 },
    ],
  });

  const level2 = await LevelModel.create({
    domainId: testDomain._id,
    levelNumber: 2,
    title: 'Level 2 Milestone',
    youtubeVideoId: 'aircAruvnKk',
    questQuestions: [
      { question: 'Q1: Next level question', options: ['A', 'B'], correctOption: 0 },
    ],
  });

  console.log('--- Step 0: Register Student for Test Course ---');
  await axios.post(`${API_BASE}/domains/${testDomain._id}/register`, {}, { headers: authHeaders });

  console.log('--- Step 1: Check Initial Level States ---');
  const initialLevelsRes = await axios.get(`${API_BASE}/domains/${testDomain._id}/levels`, { headers: authHeaders });
  const levelsData = initialLevelsRes.data.data.levels;
  assert(levelsData[0].isUnlocked === true, 'Level 1 is unlocked initially after registration');
  assert(levelsData[0].isCompleted === false, 'Level 1 is not completed initially');
  assert(levelsData[0].isCodingChallengeUnlocked === false, 'Coding challenge for Level 1 is initially LOCKED');
  assert(levelsData[1].isUnlocked === false, 'Level 2 is initially LOCKED');

  console.log('\n--- Step 2: Student attempts to open Coding Challenge before passing Quest ---');
  let openChallengeBlocked = false;
  try {
    await axios.get(`${API_BASE}/assessments/code/${testChallenge._id}`, { headers: authHeaders });
  } catch (err: any) {
    if (err.response?.status === 403) {
      openChallengeBlocked = true;
    }
  }
  assert(openChallengeBlocked, 'Direct access to coding challenge is blocked (403) before quest');

  console.log('\n--- Step 3: Student submits failing MCQ quest (score 1/5 = 20% < 70%) ---');
  const failingAnswers = [0, 0, 0, 0, 0]; // Only Q1 is correct -> 1/5 = 20%
  const failQuestRes = await axios.post(
    `${API_BASE}/levels/${level1._id}/submit-quest`,
    { answers: failingAnswers },
    { headers: authHeaders }
  );
  assert(failQuestRes.data.data.passed === false, 'Quest rejected because score is 20% (< 70%)');
  assert(failQuestRes.data.data.passRate === 20, 'Reported passRate is 20%');

  // Verify challenge is still locked
  openChallengeBlocked = false;
  try {
    await axios.get(`${API_BASE}/assessments/code/${testChallenge._id}`, { headers: authHeaders });
  } catch (err: any) {
    if (err.response?.status === 403) openChallengeBlocked = true;
  }
  assert(openChallengeBlocked, 'Coding challenge remains locked after failing quest');

  console.log('\n--- Step 4: Student submits passing MCQ quest (score 4/5 = 80% >= 70%) ---');
  const passingAnswers = [0, 1, 1, 1, 0]; // Q1, Q2, Q3, Q4 correct -> 4/5 = 80%
  const passQuestRes = await axios.post(
    `${API_BASE}/levels/${level1._id}/submit-quest`,
    { answers: passingAnswers },
    { headers: authHeaders }
  );
  assert(passQuestRes.data.data.passed === true, 'Quest PASSED with 80% (>= 70%)');
  assert(passQuestRes.data.data.requiresCodingAssessment === true, 'Response flags requiresCodingAssessment = true');
  assert(passQuestRes.data.data.nextLevelId === null, 'Next level is NOT unlocked yet');

  console.log('\n--- Step 5: Verify Level 1 is NOT completed and Level 2 is STILL locked ---');
  const midLevelsRes = await axios.get(`${API_BASE}/domains/${testDomain._id}/levels`, { headers: authHeaders });
  const midLevels = midLevelsRes.data.data.levels;
  assert(midLevels[0].isCompleted === false, 'Level 1 is NOT completed yet (coding challenge pending)');
  assert(midLevels[0].isCodingChallengeUnlocked === true, 'Coding challenge is now UNLOCKED for student');
  assert(midLevels[1].isUnlocked === false, 'Level 2 remains LOCKED');

  console.log('\n--- Step 6: Verify Student cannot skip by directly submitting Level 2 quest ---');
  let level2Blocked = false;
  try {
    await axios.post(`${API_BASE}/levels/${level2._id}/submit-quest`, { answers: [0] }, { headers: authHeaders });
  } catch (err: any) {
    if (err.response?.status === 403) level2Blocked = true;
  }
  assert(level2Blocked, 'Direct attempt to complete Level 2 is forbidden (403)');

  console.log('\n--- Step 7: Access Coding Assessment Workspace now that Quest is passed ---');
  const challengeRes = await axios.get(`${API_BASE}/assessments/code/${testChallenge._id}`, { headers: authHeaders });
  assert(challengeRes.status === 200, 'Coding challenge workspace loads successfully (200 OK)');
  assert(challengeRes.data.data.title === testChallenge.title, 'Loaded challenge title matches');

  console.log('\n--- Step 8: Submit failing code to the Coding Assessment ---');
  const failSubmitRes = await axios.post(
    `${API_BASE}/assessments/code/submit`,
    {
      problemId: testChallenge._id.toString(),
      language: 'python',
      code: 'print("wrong output")',
    },
    { headers: authHeaders }
  );
  assert(failSubmitRes.data.status === 'failed', 'Coding submission status is "failed"');
  assert(failSubmitRes.data.levelCompleted === false, 'Level is not completed on failing code');

  // Verify Level 2 is still locked
  const midCheck2 = await axios.get(`${API_BASE}/domains/${testDomain._id}/levels`, { headers: authHeaders });
  assert(midCheck2.data.data.levels[1].isUnlocked === false, 'Level 2 still locked after failing code submission');

  console.log('\n--- Step 9: Submit passing code to the Coding Assessment ---');
  const passSubmitRes = await axios.post(
    `${API_BASE}/assessments/code/submit`,
    {
      problemId: testChallenge._id.toString(),
      language: 'python',
      code: 'x = int(input())\nprint(x * 2)',
    },
    { headers: authHeaders }
  );
  assert(passSubmitRes.data.status === 'passed', 'Coding submission status is "passed"');
  assert(passSubmitRes.data.levelCompleted === true, 'Submission flagged levelCompleted = true');
  assert(passSubmitRes.data.unlockedNextLevel === true, 'Submission flagged unlockedNextLevel = true');

  console.log('\n--- Step 10: Verify Progression - Level 1 is COMPLETED and Level 2 is UNLOCKED! ---');
  const finalLevelsRes = await axios.get(`${API_BASE}/domains/${testDomain._id}/levels`, { headers: authHeaders });
  const finalLevels = finalLevelsRes.data.data.levels;
  assert(finalLevels[0].isCompleted === true, 'Level 1 is now marked isCompleted = true');
  assert(finalLevels[0].isCodingChallengeCompleted === true, 'Level 1 coding assessment marked completed');
  assert(finalLevels[1].isUnlocked === true, 'Level 2 is now automatically UNLOCKED!');

  console.log('\n--- Step 11: Student can now complete Level 2 ---');
  const level2SubmitRes = await axios.post(
    `${API_BASE}/levels/${level2._id}/submit-quest`,
    { answers: [0] },
    { headers: authHeaders }
  );
  assert(level2SubmitRes.data.data.passed === true, 'Level 2 quest submitted successfully');

  // Cleanup test domain and levels
  await LevelModel.deleteMany({ domainId: testDomain._id });
  await DomainModel.deleteOne({ _id: testDomain._id });
  await CodingChallengeModel.deleteOne({ _id: testChallenge._id });
  await StudentProgressModel.deleteOne({ userId: testUser._id });

  await mongoose.disconnect();
  console.log('\n🎉 ALL CODING ASSESSMENT PROGRESSION & 70% GATING TESTS PASSED PERFECTLY!\n');
}

runTest().catch((err) => {
  console.error('Test execution error:', err.response?.data || err.message);
  process.exit(1);
});
