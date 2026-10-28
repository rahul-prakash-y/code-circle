import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/userModel';
import Level from '../models/levelModel';
import StudentProgress from '../models/studentProgressModel';
import PointTransaction from '../models/pointTransactionModel';
import CodingChallenge from '../models/codingChallengeModel';
import CodingSubmission from '../models/codingSubmissionModel';
import DomainEnrollment from '../models/domainEnrollmentModel';

export async function syncCourseAndQuestPoints() {
  await mongoose.connect(process.env.MONGO_URI || '');
  console.log('Connected to MongoDB. Starting points synchronization...');

  // 1. Ensure Python Level 1 points is 150 (50 quest + 100 coding, matching 50 pts/coding question)
  const pythonLvl1 = await Level.findOne({
    title: { $regex: /Python Basics/i },
    levelNumber: 1,
  });
  if (pythonLvl1 && pythonLvl1.points !== 150) {
    console.log(`Updating Python Level 1 points from ${pythonLvl1.points} to 150`);
    await Level.findByIdAndUpdate(pythonLvl1._id, { $set: { points: 150 } });
  }

  // Fetch all necessary data in batch
  const [levels, challenges, allProgress, allUsers, allTxs, allPassedSubs] = await Promise.all([
    Level.find({}).lean(),
    CodingChallenge.find({}).lean(),
    StudentProgress.find({}).lean(),
    User.find({}).lean(),
    PointTransaction.find({}).lean(),
    CodingSubmission.find({ status: 'passed' }).select('student challenge').lean(),
  ]);

  const levelMap = new Map<string, any>(levels.map((l) => [l._id.toString(), l]));
  const challengeMap = new Map<string, any>(challenges.map((c) => [c._id.toString(), c]));
  const userMap = new Map<string, any>(allUsers.map((u) => [u._id.toString(), u]));

  // Build mapping from challengeId -> level
  const challengeToLevelMap = new Map<string, any>();
  for (const l of levels) {
    if (l.codingChallengeId) {
      challengeToLevelMap.set(l.codingChallengeId.toString(), l);
    }
    if (Array.isArray(l.codingChallengePool)) {
      for (const poolId of l.codingChallengePool) {
        if (poolId) challengeToLevelMap.set(poolId.toString(), l);
      }
    }
  }
  for (const c of challenges) {
    if (c.levelId && !challengeToLevelMap.has(c._id.toString())) {
      const lvl = levelMap.get(c.levelId.toString());
      if (lvl) challengeToLevelMap.set(c._id.toString(), lvl);
    }
  }

  // Group existing transactions by student userId
  const txsByUser = new Map<string, any[]>();
  for (const tx of allTxs) {
    if (!tx.user) continue;
    const uId = tx.user.toString();
    if (!txsByUser.has(uId)) txsByUser.set(uId, []);
    txsByUser.get(uId)!.push(tx);
  }

  // Group passed submissions by student userId
  const passedSubsByUser = new Map<string, Set<string>>();
  for (const s of allPassedSubs) {
    if (!s.student || !s.challenge) continue;
    const uId = s.student.toString();
    if (!passedSubsByUser.has(uId)) passedSubsByUser.set(uId, new Set<string>());
    passedSubsByUser.get(uId)!.add(s.challenge.toString());
  }

  let totalQuestsAwarded = 0;
  let totalQuestPointsAwarded = 0;
  let totalCodingAwarded = 0;
  let totalCodingPointsAwarded = 0;
  let studentsUpdatedCount = 0;

  const updateReports: string[] = [];

  for (const p of allProgress) {
    const studentIdStr = p.userId.toString();
    const user = userMap.get(studentIdStr);
    if (!user) continue;

    const existingTxs = txsByUser.get(studentIdStr) || [];

    const existingQuestLevelIds = new Set<string>();
    const existingCodingChallengeIds = new Set<string>();
    const existingLevelAssessmentLevelIds = new Set<string>();

    for (const tx of existingTxs) {
      if (tx.category === 'Course' || (tx.title && tx.title.toLowerCase().includes('quest'))) {
        if (tx.referenceId) existingQuestLevelIds.add(tx.referenceId.toString());
      }
      if (tx.title && tx.title.toLowerCase().includes('level assessment')) {
        if (tx.referenceId) existingLevelAssessmentLevelIds.add(tx.referenceId.toString());
      }
      if (tx.category === 'Coding' && tx.referenceModel === 'CodingChallenge') {
        if (tx.referenceId) existingCodingChallengeIds.add(tx.referenceId.toString());
      }
    }

    let studentPointsAdded = 0;
    const newTxsToInsert: any[] = [];

    // 1. Quests: 50 points per completed quest
    for (const qId of (p.completedQuests || [])) {
      const qIdStr = qId.toString();
      if (!existingQuestLevelIds.has(qIdStr)) {
        const lvl = levelMap.get(qIdStr);
        const questPts = 50;
        studentPointsAdded += questPts;
        totalQuestsAwarded++;
        totalQuestPointsAwarded += questPts;

        newTxsToInsert.push({
          user: new mongoose.Types.ObjectId(studentIdStr),
          amount: questPts,
          category: 'Course',
          title: `Completed Quest: Level ${lvl?.levelNumber || ''} - ${lvl?.title || 'Verification Quest'}`,
          description: `Successfully cleared Level ${lvl?.levelNumber || ''} verification quest`,
          referenceId: qIdStr,
          referenceModel: 'Level',
          timestamp: new Date(),
        });

        // Mark as recorded so duplicate quest id in student's array isn't processed twice
        existingQuestLevelIds.add(qIdStr);
      }
    }

    // 2. Coding Challenges: award points per passed challenge if not previously credited
    const userPassedSubs = passedSubsByUser.get(studentIdStr) || new Set<string>();
    const allPassedChallenges = new Set<string>([
      ...(p.completedCodingChallenges || []).map((id: any) => id.toString()),
      ...Array.from(userPassedSubs),
    ]);

    for (const chIdStr of allPassedChallenges) {
      if (existingCodingChallengeIds.has(chIdStr)) continue;

      const linkedLevel = challengeToLevelMap.get(chIdStr);
      // Skip if covered by an existing legacy level-wide transaction
      if (linkedLevel && existingLevelAssessmentLevelIds.has(linkedLevel._id.toString())) {
        continue;
      }

      const ch = challengeMap.get(chIdStr);
      let pts = 50;
      if (linkedLevel) {
        pts = linkedLevel.levelNumber === 3 ? 100 : 50;
      } else if (ch?.customPoints && ch.customPoints > 0) {
        pts = ch.customPoints;
      }

      studentPointsAdded += pts;
      totalCodingAwarded++;
      totalCodingPointsAwarded += pts;

      newTxsToInsert.push({
        user: new mongoose.Types.ObjectId(studentIdStr),
        amount: pts,
        category: 'Coding',
        title: `Completed Coding Assessment: ${ch?.title || 'Coding Challenge'}`,
        description: `Passed all test cases for coding challenge "${ch?.title || ''}" in Level ${linkedLevel?.levelNumber || 'standalone'}`,
        referenceId: chIdStr,
        referenceModel: 'CodingChallenge',
        timestamp: new Date(),
      });

      existingCodingChallengeIds.add(chIdStr);
    }

    if (newTxsToInsert.length > 0) {
      studentsUpdatedCount++;
      await PointTransaction.insertMany(newTxsToInsert);
      await User.findByIdAndUpdate(studentIdStr, { $inc: { points: studentPointsAdded } });

      const oldPts = user.points || 0;
      const newPts = oldPts + studentPointsAdded;
      updateReports.push(
        `Student: ${user.name} (${user.email}) | ${oldPts} -> ${newPts} pts (+${studentPointsAdded} pts across ${newTxsToInsert.length} items)`
      );
    }
  }

  // 3. Ensure course completion status is up-to-date for students who completed all levels
  const pythonLevels = levels.filter((l) => l.domainId && l.domainId.toString() === '6ac76e488f2a966b08d5ce08');
  if (pythonLevels.length > 0) {
    const pythonLevelIds = pythonLevels.map((l) => l._id.toString());
    for (const p of allProgress) {
      const doneSet = new Set((p.completedLevels || []).map((id: any) => id.toString()));
      const allDone = pythonLevelIds.every((id) => doneSet.has(id));
      if (allDone) {
        await DomainEnrollment.findOneAndUpdate(
          { userId: p.userId, domainId: pythonLevels[0].domainId },
          { status: 'completed', completedAt: new Date() },
          { upsert: true }
        );
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`SYNCHRONIZATION COMPLETED SUCCESSFULLY`);
  console.log(`======================================================`);
  console.log(`Total students updated: ${studentsUpdatedCount}`);
  console.log(`Quest transactions created: ${totalQuestsAwarded} (+${totalQuestPointsAwarded} pts)`);
  console.log(`Coding transactions created: ${totalCodingAwarded} (+${totalCodingPointsAwarded} pts)`);
  console.log(`Total points credited across all students: ${totalQuestPointsAwarded + totalCodingPointsAwarded}`);
  console.log(`\nDetailed student update log:`);
  for (const r of updateReports) {
    console.log(`  ${r}`);
  }

  await mongoose.disconnect();
}

if (require.main === module) {
  syncCourseAndQuestPoints()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error during synchronization:', err);
      process.exit(1);
    });
}
