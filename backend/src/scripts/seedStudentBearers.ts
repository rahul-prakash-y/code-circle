import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import StudentBearer from '../models/studentBearerModel';

const sampleBearers = [
  {
    name: 'Aarav Sharma',
    position: 'President',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    linkedinUrl: 'https://www.linkedin.com/in/aarav-sharma-lead',
    bio: 'Leading club vision, industry collaborations, and university-wide hackathons.',
  },
  {
    name: 'Diya Nair',
    position: 'Vice President',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    linkedinUrl: 'https://www.linkedin.com/in/diya-nair-vp',
    bio: 'Spearheading student relations, tech symposiums, and community outreach.',
  },
  {
    name: 'Vikram Sengupta',
    position: 'Technical Head',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    linkedinUrl: 'https://www.linkedin.com/in/vikram-sengupta-tech',
    bio: 'Directing club software architecture, open source projects, and coding assessments.',
  },
  {
    name: 'Ananya Iyer',
    position: 'Executive Secretary',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
    linkedinUrl: 'https://www.linkedin.com/in/ananya-iyer-ops',
    bio: 'Managing club governance, operational workflows, and official campus communications.',
  },
];

const seedBearers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB');

    const count = await StudentBearer.countDocuments();
    if (count === 0) {
      console.log('[Seed] No student bearers found. Seeding initial executive team...');
      await StudentBearer.insertMany(sampleBearers);
      console.log(`[Seed] Seeded ${sampleBearers.length} student bearers successfully.`);
    } else {
      console.log(`[Seed] Database already has ${count} student bearers. Keeping existing data.`);
    }

    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seedBearers();
