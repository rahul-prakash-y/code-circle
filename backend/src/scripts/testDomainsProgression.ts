import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import '../models/userModel';
import '../models/levelModel';
import '../models/studentProgressModel';

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

async function runTests() {
  console.log('====================================================');
  console.log(' RUNNING DOMAINS & QUEST PROGRESSION INTEGRATION TEST');
  console.log('====================================================\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/code-circle';
  await mongoose.connect(mongoUri);

  // Find or create test user
  const UserModel = mongoose.model('User');
  let testUser = await UserModel.findOne({ role: 'Student', isBlocked: { $ne: true } });
  if (!testUser) {
    testUser = await UserModel.create({
      name: 'Test Domain Student',
      email: `domain-tester-${Date.now()}@codecircle.edu`,
      rollNo: `TEST${Math.floor(Math.random() * 90000 + 10000)}`,
      role: 'Student',
      department: 'CSE',
      isBlocked: false,
    });
  }

  // Clear previous progress for reproducible test run
  const StudentProgressModel = mongoose.model('StudentProgress');
  await StudentProgressModel.deleteOne({ userId: testUser._id });

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

  // Test 1: GET /api/domains
  console.log('--- Test 1: GET /api/domains ---');
  const domainsRes = await axios.get(`${API_BASE}/domains`, { headers: authHeaders });
  assert(domainsRes.status === 200, 'GET /api/domains returns status 200');
  assert(Array.isArray(domainsRes.data.data), 'GET /api/domains returns data array');
  assert(domainsRes.data.data.length > 0, `Returned ${domainsRes.data.data.length} domains`);

  const firstDomain = domainsRes.data.data[0];
  console.log(`Selected domain: "${firstDomain.name}" (ID: ${firstDomain._id})`);
  assert(typeof firstDomain.totalLevels === 'number', 'Domain contains totalLevels count');

  // Test 2: GET /api/domains/:id/levels
  console.log('\n--- Test 2: GET /api/domains/:id/levels ---');
  const levelsRes = await axios.get(`${API_BASE}/domains/${firstDomain._id}/levels`, { headers: authHeaders });
  assert(levelsRes.status === 200, 'GET /api/domains/:id/levels returns 200');
  assert(Array.isArray(levelsRes.data.data.levels), 'Levels array returned');
  const levels = levelsRes.data.data.levels;
  assert(levels.length > 0, `Found ${levels.length} levels for domain`);

  const level1 = levels[0];
  assert(level1.levelNumber === 1, 'First level has levelNumber 1');
  assert(level1.isUnlocked === true, 'Level 1 is unlocked by default');
  assert(level1.isCompleted === false, 'Level 1 is initially not completed');
  assert(level1.questQuestions.length === 5, 'Level 1 contains 5 quest questions');
  assert(level1.questQuestions[0].correctOption === undefined, 'Anti-cheat: correctOption is hidden from student');

  // Test 3: POST /api/levels/:id/submit-quest with failing answers
  console.log('\n--- Test 3: Submit Failing Answers (pass rate < 100%) ---');
  const failingAnswers = [0, 999, 999, 999, 999]; // 1 correct, 4 wrong
  const failSubmitRes = await axios.post(
    `${API_BASE}/levels/${level1._id}/submit-quest`,
    { answers: failingAnswers },
    { headers: authHeaders }
  );
  assert(failSubmitRes.status === 200, 'Submit returns 200 with result payload');
  assert(failSubmitRes.data.data.passed === false, 'Quest marked as NOT passed');
  assert(failSubmitRes.data.data.score < 5, `Score is ${failSubmitRes.data.data.score}/5`);

  // Verify level 1 is still incomplete
  const recheckRes1 = await axios.get(`${API_BASE}/domains/${firstDomain._id}/levels`, { headers: authHeaders });
  assert(recheckRes1.data.data.levels[0].isCompleted === false, 'Level 1 remains incomplete after failing');

  // Test 4: Submit 100% Passing Answers
  console.log('\n--- Test 4: Submit 100% Passing Answers ---');
  // For domain 1 (or 2), inspect seeded answers to ensure 100% pass:
  const LevelModel = mongoose.model('Level');
  const fullLevel1 = await LevelModel.findById(level1._id);
  const correctAnswers = fullLevel1.questQuestions.map((q: any) => q.correctOption);

  console.log(`Submitting 5/5 correct answers for Level 1: [${correctAnswers.join(', ')}]`);
  const passSubmitRes = await axios.post(
    `${API_BASE}/levels/${level1._id}/submit-quest`,
    { answers: correctAnswers },
    { headers: authHeaders }
  );
  assert(passSubmitRes.status === 200, 'Submit returns 200');
  assert(passSubmitRes.data.data.passed === true, 'Quest marked as PASSED (100%)');
  assert(passSubmitRes.data.data.score === 5, 'Score is 5/5');

  // Test 5: Verify Level Progression State in GET /api/domains/:id/levels
  console.log('\n--- Test 5: Verify Progression Updated ---');
  const recheckRes2 = await axios.get(`${API_BASE}/domains/${firstDomain._id}/levels`, { headers: authHeaders });
  const updatedLevels = recheckRes2.data.data.levels;
  assert(updatedLevels[0].isCompleted === true, 'Level 1 is now marked isCompleted = true');
  if (updatedLevels.length > 1) {
    assert(updatedLevels[1].isUnlocked === true, 'Level 2 is now automatically unlocked!');
  }

  // Test 6: Check Final Level with linked Assessment
  const finalLevelWithAssessment = levels.find((l: any) => l.assessmentId);
  if (finalLevelWithAssessment) {
    console.log(`\n--- Test 6: Test Assessment Unlocking for Level ${finalLevelWithAssessment.levelNumber} ---`);

    // Complete intermediate levels between Level 1 and finalLevelWithAssessment
    for (const interLvl of levels) {
      if (interLvl.levelNumber > 1 && interLvl.levelNumber < finalLevelWithAssessment.levelNumber) {
        const fullInter = await LevelModel.findById(interLvl._id);
        const interAnswers = fullInter.questQuestions.map((q: any) => q.correctOption);
        await axios.post(
          `${API_BASE}/levels/${interLvl._id}/submit-quest`,
          { answers: interAnswers },
          { headers: authHeaders }
        );
      }
    }

    const fullFinalLevel = await LevelModel.findById(finalLevelWithAssessment._id);
    const finalAnswers = fullFinalLevel.questQuestions.map((q: any) => q.correctOption);
    const finalSubmitRes = await axios.post(
      `${API_BASE}/levels/${finalLevelWithAssessment._id}/submit-quest`,
      { answers: finalAnswers },
      { headers: authHeaders }
    );
    assert(finalSubmitRes.data.data.passed === true, 'Final Level passed 100%');
    assert(!!finalSubmitRes.data.data.unlockedAssessmentId, 'Assessment ID was returned as unlocked');

    const progressCheck = await axios.get(`${API_BASE}/domains/${firstDomain._id}/levels`, { headers: authHeaders });
    assert(
      progressCheck.data.data.userProgress.unlockedAssessments.includes(
        finalLevelWithAssessment.assessmentId._id || finalLevelWithAssessment.assessmentId
      ),
      'Assessment ID is present in userProgress.unlockedAssessments'
    );
  }

  await mongoose.disconnect();
  console.log('\n🎉 ALL DOMAIN & QUEST PROGRESSION TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch((err) => {
  console.error('Test execution error:', err.response?.data || err.message);
  process.exit(1);
});
