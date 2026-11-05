import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assessment from '../models/assessmentModel';
import AssessmentSubmission from '../models/assessmentSubmissionModel';
import User from '../models/userModel';
import PointTransaction from '../models/pointTransactionModel';

dotenv.config();

export async function syncAssessmentPoints() {
  try {
    console.log('[SyncAssessmentPoints] Checking passing MCQ assessment submissions for missing points...');
    
    // Find all passing submissions
    const passingSubmissions = await AssessmentSubmission.find({ passed: true })
      .populate('assessment')
      .sort({ createdAt: 1 });

    console.log(`[SyncAssessmentPoints] Found ${passingSubmissions.length} passing assessment submissions`);

    let awardedCount = 0;
    let totalPointsAwarded = 0;

    for (const sub of passingSubmissions) {
      const assessment: any = sub.assessment;
      if (!assessment) continue;

      const userId = sub.user.toString();
      const assessmentId = assessment._id.toString();

      // Check if user already received a PointTransaction for this assessment
      const existingTx = await PointTransaction.findOne({
        user: sub.user,
        category: 'Assessment',
        referenceId: assessmentId,
      });

      if (!existingTx) {
        const pts =
          typeof assessment.customPoints === 'number' && assessment.customPoints > 0
            ? assessment.customPoints
            : 50;

        console.log(`[SyncAssessmentPoints] Awarding ${pts} pts to user ${userId} for assessment "${assessment.title}"`);

        // Award points to user
        await User.findByIdAndUpdate(userId, { $inc: { points: pts } });

        // Record in PointTransaction ledger
        await PointTransaction.create({
          user: sub.user,
          amount: pts,
          category: 'Assessment',
          title: `Assessment Completed: ${assessment.title}`,
          description: `Passed with score ${sub.score}/${sub.totalPoints} (${sub.percentage}%)`,
          referenceId: assessmentId,
          referenceModel: 'Assessment',
          timestamp: sub.createdAt || new Date(),
        });

        // Update submission document with pointsAwarded
        await AssessmentSubmission.findByIdAndUpdate(sub._id, { pointsAwarded: pts });

        awardedCount++;
        totalPointsAwarded += pts;
      } else {
        // If transaction already existed but submission didn't have pointsAwarded set
        if (!sub.pointsAwarded) {
          await AssessmentSubmission.findByIdAndUpdate(sub._id, { pointsAwarded: existingTx.amount });
        }
      }
    }

    // Ensure all assessments have customPoints set to default 50 if missing
    const updatedAssessments = await Assessment.updateMany(
      { $or: [{ customPoints: { $exists: false } }, { customPoints: null }] },
      { $set: { customPoints: 50 } }
    );
    if (updatedAssessments.modifiedCount > 0) {
      console.log(`[SyncAssessmentPoints] Updated ${updatedAssessments.modifiedCount} assessments to have customPoints: 50`);
    }

    console.log(`[SyncAssessmentPoints] Sync complete! Awarded points to ${awardedCount} submissions (${totalPointsAwarded} total points).`);
    return { awardedCount, totalPointsAwarded };
  } catch (err: any) {
    console.error('[SyncAssessmentPoints] Error:', err);
    throw err;
  }
}

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI!)
    .then(() => syncAssessmentPoints())
    .then(() => mongoose.disconnect())
    .then(() => console.log('Done!'))
    .catch((e) => console.error(e));
}
