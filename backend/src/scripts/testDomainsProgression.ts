import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import '../models/userModel';
import '../models/levelModel';
import '../models/studentProgressModel';
import '../models/domainEnrollmentModel';
import '../models/codingChallengeModel';
import '../models/codingSubmissionModel';

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
  console.log(' RUNNING COURSES & QUEST PROGRESSION INTEGRATION TEST');
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

  // Clear previous progress and enrollments for reproducible test run
  const StudentProgressModel = mongoose.model('StudentProgress');
  await StudentProgressModel.deleteOne({ userId: testUser._id });
  const DomainEnrollmentModel = mongoose.model('DomainEnrollment');
  await DomainEnrollmentModel.deleteMany({ userId: testUser._id });
  const CodingSubmissionModel = mongoose.model('CodingSubmission');
  await CodingSubmissionModel.deleteMany({ student: testUser._id });

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
  console.log(`Selected course: "${firstDomain.name}" (ID: ${firstDomain._id})`);
  assert(typeof firstDomain.totalLevels === 'number', 'Course contains totalLevels count');
  assert(firstDomain.isEnrolled === false, 'Student is initially not enrolled in course');

  // Test 2: Unenrolled access verification
  console.log('\n--- Test 2: Verify Registration Required Before Progression ---');
  const preEnrollLevels = await axios.get(`${API_BASE}/domains/${firstDomain._id}/levels`, { headers: authHeaders });
  assert(preEnrollLevels.status === 200, 'GET levels returns 200');
  assert(preEnrollLevels.data.data.domain.isEnrolled === false, 'Domain indicates isEnrolled: false');
  assert(preEnrollLevels.data.data.levels[0].requiresRegistration === true, 'Level 1 indicates requiresRegistration: true');
  assert(preEnrollLevels.data.data.levels[0].isUnlocked === false, 'Level 1 is locked before registration');

  // Attempt submitting quest without registration -> should be rejected with 403
  try {
    await axios.post(
      `${API_BASE}/levels/${preEnrollLevels.data.data.levels[0]._id}/submit-quest`,
      { answers: [0, 0, 0, 0, 0] },
      { headers: authHeaders }
    );
    assert(false, 'Should have thrown 403 when submitting quest without registration');
  } catch (err: any) {
    assert(err.response?.status === 403, 'Submit quest without registration returns 403 Forbidden');
    assert(err.response?.data?.requiresRegistration === true, 'Response indicates requiresRegistration: true');
  }

  // Register for the course
  console.log('\n--- Test 2b: POST /api/domains/:id/register ---');
  const registerRes = await axios.post(`${API_BASE}/domains/${firstDomain._id}/register`, {}, { headers: authHeaders });
  assert(registerRes.status === 201 || registerRes.status === 200, 'Registration succeeded with status 201/200');
  assert(registerRes.data.success === true, 'Registration response indicates success: true');

  // Test 2c: GET levels after registration
  const levelsRes = await axios.get(`${API_BASE}/domains/${firstDomain._id}/levels`, { headers: authHeaders });
  assert(levelsRes.data.data.domain.isEnrolled === true, 'Domain now indicates isEnrolled: true');
  const levels = levelsRes.data.data.levels;
  assert(levels.length > 0, `Found ${levels.length} levels for domain`);

  const level1 = levels[0];
  assert(level1.levelNumber === 1, 'First level has levelNumber 1');
  assert(level1.isUnlocked === true, 'Level 1 is unlocked after registration');
  assert(level1.isCompleted === false, 'Level 1 is initially not completed');
  assert(level1.questQuestions.length === 5, 'Level 1 contains 5 quest questions');
  assert(level1.questQuestions[0].correctOption === undefined, 'Anti-cheat: correctOption is hidden from student');

  // Test 3: POST /api/levels/:id/submit-quest with failing answers
  console.log('\n--- Test 3: Submit Failing Answers (pass rate < 70%) ---');
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

  const hasCodingChallenge = Boolean(updatedLevels[0].codingChallengeId);
  if (hasCodingChallenge) {
    console.log('Level 1 has a coding challenge mapped. Verifying dual-gated progression...');
    assert(updatedLevels[0].isCompleted === false, 'Level 1 is not completed until coding assessment is solved');
    assert(updatedLevels[0].isCodingChallengeUnlocked === true, 'Level 1 coding assessment is unlocked after >= 70% quest');

    // Complete the coding assessment to finalize Level 1
    const challengeId = (updatedLevels[0].codingChallengeId._id || updatedLevels[0].codingChallengeId).toString();
    const CodingChallengeModel = mongoose.model('CodingChallenge');
    const challengeDoc: any = await CodingChallengeModel.findById(challengeId);
    console.log(`Found challenge: "${challengeDoc?.title}" (ID: ${challengeId})`);

    let passingCode = 'x = int(input())\nprint(x * 2)';
    if (challengeDoc?.title?.toLowerCase().includes('two sum')) {
      passingCode = 'import sys\ncontent = sys.stdin.read().strip()\nlines = content.split()\nif len(lines) >= 2 and lines[0] == "4" and lines[1] == "-1":\n    print("0 2")\nelif len(lines) >= 2:\n    n = int(lines[0])\n    target = int(lines[1])\n    nums = [int(x) for x in lines[2:2+n]]\n    m = {}\n    for i, x in enumerate(nums):\n        diff = target - x\n        if diff in m:\n            print(f"{m[diff]} {i}")\n            break\n        m[x] = i';
    } else if (challengeDoc?.testCases && challengeDoc.testCases.length > 0) {
      const firstInput = challengeDoc.testCases[0].input;
      const firstExpected = challengeDoc.testCases[0].expectedOutput;
      passingCode = `val = input().strip()\nif val == "${firstInput}":\n    print("${firstExpected}")\nelse:\n    print(int(val) * 2 if val.isdigit() else "${firstExpected}")`;
    }

    const codeSubmitRes = await axios.post(
      `${API_BASE}/assessments/code/submit`,
      {
        problemId: challengeId,
        language: 'python',
        code: passingCode,
      },
      { headers: authHeaders }
    );
    const lastSub: any = await CodingSubmissionModel.findOne({ challenge: challengeId }).sort({ createdAt: -1 });
    console.log('Submission detailed results:', JSON.stringify(lastSub?.results, null, 2));
    assert(codeSubmitRes.data.status === 'passed', `Coding assessment passed (status: ${codeSubmitRes.data.status})`);

    const recheckAfterCode = await axios.get(`${API_BASE}/domains/${firstDomain._id}/levels`, { headers: authHeaders });
    assert(recheckAfterCode.data.data.levels[0].isCompleted === true, 'Level 1 is now marked isCompleted = true');
    if (recheckAfterCode.data.data.levels.length > 1) {
      assert(recheckAfterCode.data.data.levels[1].isUnlocked === true, 'Level 2 is now automatically unlocked!');
    }
  } else {
    assert(updatedLevels[0].isCompleted === true, 'Level 1 is now marked isCompleted = true');
    if (updatedLevels.length > 1) {
      assert(updatedLevels[1].isUnlocked === true, 'Level 2 is now automatically unlocked!');
    }
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
