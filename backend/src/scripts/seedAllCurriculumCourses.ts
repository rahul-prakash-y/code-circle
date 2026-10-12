import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db';
import Domain from '../models/domainModel';
import Level from '../models/levelModel';
import CodingChallenge from '../models/codingChallengeModel';
import Assessment from '../models/assessmentModel';
import User from '../models/userModel';

// Import all 9 track datasets
import { track1C } from './curriculumData/track1C';
import { track2Cpp } from './curriculumData/track2Cpp';
import { track3Java } from './curriculumData/track3Java';
import { track4Js } from './curriculumData/track4Js';
import { track5Mern } from './curriculumData/track5Mern';
import { track6Mean } from './curriculumData/track6Mean';
import { track7AiMl } from './curriculumData/track7AiMl';
import { track8AiDs } from './curriculumData/track8AiDs';
import { track9Cyber } from './curriculumData/track9Cyber';
import { ISeedTrackData } from './curriculumData/types';

const ALL_TRACKS: ISeedTrackData[] = [
  track1C,
  track2Cpp,
  track3Java,
  track4Js,
  track5Mern,
  track6Mean,
  track7AiMl,
  track8AiDs,
  track9Cyber,
];

async function seedAllCurriculumCourses() {
  console.log('\n========================================================================');
  console.log(' CODE CIRCLE MASTER CURRICULUM SEEDER (9 TRACKS x 10 LEVELS = 90 LEVELS)');
  console.log('========================================================================\n');

  await connectDB();

  // Find system user or SuperAdmin for Assessment ownership
  let adminUser = await User.findOne({ role: 'SuperAdmin' });
  if (!adminUser) {
    adminUser = await User.findOne();
  }

  if (!adminUser) {
    console.warn('[Seed] Warning: No user found in database. Creating default system bot user...');
    adminUser = await User.create({
      name: 'System Curriculum Engine',
      email: 'curriculum@codecircle.com',
      rollNo: 'SYS001',
      role: 'SuperAdmin',
      password: 'SystemPassword2026!',
      department: 'Academic Committee',
    });
  }

  console.log(`[Seed] Using Administrator ID: ${adminUser._id} (${adminUser.email})\n`);

  let totalDomainsSeeded = 0;
  let totalLevelsSeeded = 0;
  let totalChallengesSeeded = 0;
  let totalAssessmentsSeeded = 0;

  for (const track of ALL_TRACKS) {
    console.log(`------------------------------------------------------------------------`);
    console.log(`[Track] Processing: "${track.name}"`);

    // 1. Create or Find Domain
    let domain = await Domain.findOne({ name: track.name });
    if (!domain) {
      domain = await Domain.create({
        name: track.name,
        description: track.description,
        coverImageUrl: track.coverImageUrl,
        isLocked: track.isLocked,
      });
      console.log(`  + Created Domain: "${domain.name}" (${domain._id})`);
    } else {
      domain.description = track.description;
      domain.coverImageUrl = track.coverImageUrl;
      domain.isLocked = track.isLocked;
      await domain.save();
      console.log(`  * Updated Existing Domain: "${domain.name}" (${domain._id})`);
    }
    totalDomainsSeeded++;

    // 2. Clear existing levels for this domain to ensure clean re-seeding
    const deletedLevels = await Level.deleteMany({ domainId: domain._id });
    if (deletedLevels.deletedCount > 0) {
      console.log(`  - Cleared ${deletedLevels.deletedCount} existing levels for domain.`);
    }

    // 3. Seed Levels for this Track
    for (const lvl of track.levels) {
      // 3a. Create or Find CodingChallenge
      let challenge = await CodingChallenge.findOne({ title: lvl.challenge.title });
      if (!challenge) {
        challenge = await CodingChallenge.create({
          title: lvl.challenge.title,
          description: lvl.challenge.description,
          inputFormat: lvl.challenge.inputFormat,
          outputFormat: lvl.challenge.outputFormat,
          constraints: lvl.challenge.constraints,
          sampleInput: lvl.challenge.sampleInput,
          sampleOutput: lvl.challenge.sampleOutput,
          difficulty: lvl.challenge.difficulty,
          allowedLanguages: lvl.challenge.allowedLanguages,
          starterCode: lvl.challenge.starterCode,
          testCases: lvl.challenge.testCases,
          timeLimitMinutes: 60,
          isPublished: true,
          isCourseChallenge: true,
          domainId: domain._id,
          createdBy: adminUser._id,
        });
        totalChallengesSeeded++;
      } else {
        // Update challenge details
        challenge.description = lvl.challenge.description;
        challenge.starterCode = lvl.challenge.starterCode as any;
        challenge.testCases = lvl.challenge.testCases as any;
        challenge.isPublished = true;
        challenge.isCourseChallenge = true;
        challenge.domainId = domain._id;
        await challenge.save();
      }

      // 3b. Create Assessment
      const assessmentTitle = `${track.name} - ${lvl.title} Final Assessment`;
      let assessment = await Assessment.findOne({ title: assessmentTitle });
      if (!assessment) {
        assessment = await Assessment.create({
          title: assessmentTitle,
          description: `Comprehensive evaluation for ${lvl.title}. Passing score: 70%.`,
          category: 'Technical',
          timeLimitMinutes: 20,
          passingScorePercentage: 70,
          questions: lvl.assessmentQuestions,
          isPublished: true,
          createdBy: adminUser._id,
        });
        totalAssessmentsSeeded++;
      }

      // 3c. Create Level Document
      const levelDoc = await Level.create({
        domainId: domain._id,
        levelNumber: lvl.levelNumber,
        title: lvl.title,
        points: lvl.points || (lvl.levelNumber <= 3 ? 25 : lvl.levelNumber <= 7 ? 50 : 100),
        youtubeVideoId: lvl.youtubeVideoId,
        youtubeVideoIds: lvl.youtubeVideoIds || [lvl.youtubeVideoId],
        videos: lvl.videos || [{ title: 'Main Lecture', youtubeVideoId: lvl.youtubeVideoId }],
        studyMaterials: lvl.studyMaterials,
        questQuestions: lvl.questQuestions,
        codingChallengeId: challenge._id,
        codingChallengePool: [challenge._id],
        codingTimeLimitMinutes: 60,
        assessmentId: assessment._id,
      });

      // Update challenge's levelId
      challenge.levelId = levelDoc._id;
      await challenge.save();

      totalLevelsSeeded++;
      console.log(
        `    -> Level ${levelDoc.levelNumber}: "${levelDoc.title}" [Challenge: ${challenge.difficulty}, Quests: ${levelDoc.questQuestions.length}]`
      );
    }
  }

  console.log('\n========================================================================');
  console.log(' ALL 9 CURRICULUM TRACKS SUCCESSFULLY SEEDED INTO MONGODB!');
  console.log('========================================================================');
  console.log(` Domains (Tracks) Seeded:  ${totalDomainsSeeded}`);
  console.log(` Levels Created:           ${totalLevelsSeeded}`);
  console.log(` Coding Challenges Linked: ${totalChallengesSeeded}`);
  console.log(` Assessments Linked:       ${totalAssessmentsSeeded}`);
  console.log('========================================================================\n');

  await mongoose.disconnect();
}

seedAllCurriculumCourses().catch((err) => {
  console.error('[Curriculum Seed Error]:', err);
  process.exit(1);
});
