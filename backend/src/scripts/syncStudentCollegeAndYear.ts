import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/userModel';

// Helper to derive student year accurately
const deriveStudentYear = (user: any): string => {
  if (!user) return '3rd Year';
  if (user.year) {
    const yStr = String(user.year).trim();
    if (/^[1-4]$/.test(yStr)) {
      const map: Record<string, string> = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
      return map[yStr] || `${yStr} Year`;
    }
    if (yStr.toLowerCase().includes('year')) return yStr;
    return `${yStr} Year`;
  }

  const roll = String(user.rollNo || '').toUpperCase().trim();
  const email = String(user.email || '').toLowerCase().trim();

  // Anna University register format: 7376YY... (e.g. 7376231CS272 -> admitted 2023)
  const auMatch = roll.match(/^7376(\d{2})/);
  if (auMatch) {
    const admitYear = 2000 + parseInt(auMatch[1], 10);
    const now = new Date();
    let diff = now.getFullYear() - admitYear;
    if (now.getMonth() >= 6) diff += 1;
    if (diff <= 1) return '1st Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '3rd Year';
    return '4th Year';
  }

  // BIT Roll format: 2026UAD1021 (Graduation year prefix)
  const bitPassMatch = roll.match(/^(20\d{2})[A-Z]/);
  if (bitPassMatch) {
    const passYear = parseInt(bitPassMatch[1], 10);
    const now = new Date();
    const admitYear = passYear - 4;
    let diff = now.getFullYear() - admitYear;
    if (now.getMonth() >= 6) diff += 1;
    if (diff <= 1) return '1st Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '3rd Year';
    return '4th Year';
  }

  // Institutional email format: .ad26@bitsathy.ac.in or .cs23@bitsathy.ac.in
  const emailMatch = email.match(/([a-z]+)(\d{2})@bitsathy\.ac\.in/);
  if (emailMatch) {
    const num = parseInt(emailMatch[2], 10);
    const admitYear = num >= 25 ? 2000 + num - 4 : 2000 + num;
    const now = new Date();
    let diff = now.getFullYear() - admitYear;
    if (now.getMonth() >= 6) diff += 1;
    if (diff <= 1) return '1st Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '3rd Year';
    return '4th Year';
  }

  // General 2-digit roll format: e.g. 23CS012
  const generalRollMatch = roll.match(/^(\d{2})[A-Z]/);
  if (generalRollMatch) {
    const admitYear = 2000 + parseInt(generalRollMatch[1], 10);
    const now = new Date();
    let diff = now.getFullYear() - admitYear;
    if (now.getMonth() >= 6) diff += 1;
    if (diff <= 1) return '1st Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '3rd Year';
    return '4th Year';
  }

  return '3rd Year';
};

const syncCollegeAndYear = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    await mongoose.connect(mongoUri);
    console.log('[Sync] Connected to MongoDB Atlas');

    const users = await User.find({});
    console.log(`[Sync] Found ${users.length} total users. Processing updates...`);

    let updatedCount = 0;
    const bulkOps: any[] = [];

    for (const u of users) {
      const derivedCollege = u.college || 'BIT';
      const derivedYear = deriveStudentYear(u);

      if (u.college !== derivedCollege || u.year !== derivedYear) {
        bulkOps.push({
          updateOne: {
            filter: { _id: u._id },
            update: {
              $set: {
                college: derivedCollege,
                year: derivedYear,
              },
            },
          },
        });
        updatedCount++;
      }
    }

    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps);
      console.log(`[Sync] Successfully updated ${updatedCount} users with college: 'BIT' and derived year!`);
    } else {
      console.log('[Sync] All users already have college and year populated.');
    }

    // Sample check
    const sample = await User.find({ role: 'Student' }).limit(3).lean();
    console.log('[Sync] Sample updated students:');
    sample.forEach((s: any) => {
      console.log(` - ${s.name} (${s.rollNo}): College = ${s.college}, Year = ${s.year}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Sync Error]', err);
    process.exit(1);
  }
};

syncCollegeAndYear();
