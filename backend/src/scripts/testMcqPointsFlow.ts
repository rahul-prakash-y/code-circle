import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assessment from '../models/assessmentModel';
import AssessmentSubmission from '../models/assessmentSubmissionModel';
import User from '../models/userModel';
import PointTransaction from '../models/pointTransactionModel';

dotenv.config();

async function runTest() {
  console.log('--- Starting MCQ Assessment Points Integration Test ---');
  await mongoose.connect(process.env.MONGO_URI!);

  try {
    // 1. Create a dummy test user
    const testEmail = `test_student_${Date.now()}@test.com`;
    const user = await User.create({
      name: 'Test MCQ Student',
      email: testEmail,
      rollNo: `TEST_${Date.now()}`,
      password: 'password123',
      role: 'Student',
      points: 100,
    });
    console.log(`Created test user: ${user.name} (${user._id}), initial points: ${user.points}`);

    // 2. Create a temporary test assessment
    const testAssessment = await Assessment.create({
      title: 'Unit Test MCQ Assessment',
      description: 'Verifying point award mechanism',
      category: 'Python',
      createdBy: user._id,
      passingScorePercentage: 50,
      customPoints: 75,
      questions: [
        {
          questionText: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctOptionIndex: 1,
          points: 1,
        },
        {
          questionText: 'What is 5 * 5?',
          options: ['20', '25', '30'],
          correctOptionIndex: 1,
          points: 1,
        },
      ],
    });
    console.log(`Created test assessment: ${testAssessment.title} (${testAssessment._id}) with customPoints: ${testAssessment.customPoints}`);

    // 3. Simulate first submission (Passing: 2/2 = 100%)
    // Let's test the scoring & point awarding logic directly matching assessmentController.ts
    const assessment = await Assessment.findById(testAssessment._id);
    const answers = [
      { questionIndex: 0, selectedOption: 1 },
      { questionIndex: 1, selectedOption: 1 },
    ];

    const answerMap = new Map<number, number>();
    for (const ans of answers) {
      answerMap.set(ans.questionIndex, ans.selectedOption);
    }

    let earnedPoints = 0;
    let totalPoints = 0;
    const detailedResults = [];

    for (let i = 0; i < assessment!.questions.length; i++) {
      const q = assessment!.questions[i];
      const qPoints = q.points || 1;
      totalPoints += qPoints;
      const selectedOption = answerMap.has(i) ? answerMap.get(i)! : -1;
      const isCorrect = selectedOption === q.correctOptionIndex;
      if (isCorrect) earnedPoints += qPoints;
      detailedResults.push({
        questionIndex: i,
        questionText: q.questionText,
        selectedOption,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        points: qPoints,
      });
    }

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 1000) / 10 : 0;
    const passed = percentage >= assessment!.passingScorePercentage;

    const customPts =
      typeof assessment!.customPoints === 'number' && assessment!.customPoints > 0
        ? assessment!.customPoints
        : 50;

    let pointsAwarded = 0;
    if (passed) {
      const priorTx = await PointTransaction.findOne({
        user: user._id,
        category: 'Assessment',
        referenceId: assessment!._id.toString(),
      });
      const priorPassingAward = await AssessmentSubmission.findOne({
        assessment: assessment!._id,
        user: user._id,
        pointsAwarded: { $gt: 0 },
      });

      if (!priorTx && !priorPassingAward) {
        pointsAwarded = customPts;
        if (pointsAwarded > 0) {
          await User.findByIdAndUpdate(user._id, { $inc: { points: pointsAwarded } });
          await PointTransaction.create({
            user: user._id,
            amount: pointsAwarded,
            category: 'Assessment',
            title: `Assessment Completed: ${assessment!.title}`,
            description: `Passed with score ${earnedPoints}/${totalPoints} (${percentage}%)`,
            referenceId: assessment!._id.toString(),
            referenceModel: 'Assessment',
            timestamp: new Date(),
          });
        }
      }
    }

    const submission1 = await AssessmentSubmission.create({
      assessment: assessment!._id,
      user: user._id,
      answers,
      score: earnedPoints,
      totalPoints,
      percentage,
      passed,
      pointsAwarded,
      detailedResults,
    });

    console.log('Submission 1 created:', {
      score: `${submission1.score}/${submission1.totalPoints}`,
      percentage: `${submission1.percentage}%`,
      passed: submission1.passed,
      pointsAwarded: submission1.pointsAwarded,
    });

    const userAfterSub1 = await User.findById(user._id);
    console.log(`User points after first pass: ${userAfterSub1?.points} (expected: 175)`);
    if (userAfterSub1?.points !== 175) {
      throw new Error(`Expected 175 points, got ${userAfterSub1?.points}`);
    }

    const txRecord = await PointTransaction.findOne({
      user: user._id,
      category: 'Assessment',
      referenceId: assessment!._id.toString(),
    });
    console.log(`PointTransaction recorded: amount=${txRecord?.amount}, category=${txRecord?.category}`);
    if (!txRecord || txRecord.amount !== 75) {
      throw new Error('PointTransaction was not properly recorded!');
    }

    // 4. Simulate a retry / second passing submission to verify idempotency
    let retryPointsAwarded = 0;
    const priorTxRetry = await PointTransaction.findOne({
      user: user._id,
      category: 'Assessment',
      referenceId: assessment!._id.toString(),
    });
    const priorPassingAwardRetry = await AssessmentSubmission.findOne({
      assessment: assessment!._id,
      user: user._id,
      pointsAwarded: { $gt: 0 },
    });

    if (!priorTxRetry && !priorPassingAwardRetry) {
      retryPointsAwarded = customPts;
      await User.findByIdAndUpdate(user._id, { $inc: { points: retryPointsAwarded } });
    }

    const submission2 = await AssessmentSubmission.create({
      assessment: assessment!._id,
      user: user._id,
      answers,
      score: earnedPoints,
      totalPoints,
      percentage,
      passed,
      pointsAwarded: retryPointsAwarded,
      detailedResults,
    });

    console.log('Submission 2 (Retry) created:', {
      pointsAwarded: submission2.pointsAwarded,
    });

    const userAfterRetry = await User.findById(user._id);
    console.log(`User points after retry: ${userAfterRetry?.points} (expected: 175, no duplicate)`);
    if (userAfterRetry?.points !== 175 || submission2.pointsAwarded !== 0) {
      throw new Error(`Duplicate points awarded on retry! Points: ${userAfterRetry?.points}`);
    }

    // 5. Cleanup test artifacts
    await User.findByIdAndDelete(user._id);
    await Assessment.findByIdAndDelete(testAssessment._id);
    await AssessmentSubmission.deleteMany({ assessment: testAssessment._id });
    await PointTransaction.deleteMany({ referenceId: testAssessment._id.toString() });
    console.log('Cleaned up all temporary test records successfully.');

    console.log('--- ALL MCQ POINT AWARD TESTS PASSED! ---');
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

runTest();
