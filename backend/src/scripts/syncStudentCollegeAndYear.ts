import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/userModel';

// Helper to derive student year accurately
// Helper to derive year label from prefix number (2-digit or 4-digit)
// Rule: starts with 2023 / 23 -> 4th Year, 2024 / 24 -> 3rd Year, 2025 / 25 -> 2nd Year, 2026+ / 26+ -> 1st Year
const deriveYearFromPrefix = (prefixNum: number): string => {
  const y = prefixNum < 100 ? 2000 + prefixNum : prefixNum;
  if (y <= 2023) return '4th Year';
  if (y === 2024) return '3rd Year';
  if (y === 2025) return '2nd Year';
  if (y >= 2026) return '1st Year';
  return '1st Year';
};

// Helper to derive student year accurately
const deriveStudentYear = (user: any): string => {
  if (!user) return '1st Year';

  const roll = String(user.rollNo || '').toUpperCase().trim();
  const email = String(user.email || '').toLowerCase().trim();

  // 1. 4-digit Year Prefix (e.g. 2023..., 2026..., 2026UAD1021, 2023CS101)
  const fourDigitMatch = roll.match(/^(20\d{2})/);
  if (fourDigitMatch) {
    return deriveYearFromPrefix(parseInt(fourDigitMatch[1], 10));
  }

  // 2. Anna University register format: 7376YY... (e.g. 7376231CS272 -> 23 -> 4th Year, 7376261CS101 -> 26 -> 1st Year)
  const auMatch = roll.match(/^7376(\d{2})/);
  if (auMatch) {
    return deriveYearFromPrefix(parseInt(auMatch[1], 10));
  }

  // 3. 2-digit roll format: e.g. 23CS012 -> 4th Year, 241CS222 -> 3rd Year, 26AD105 -> 1st Year
  const twoDigitRollMatch = roll.match(/^(\d{2})/);
  if (twoDigitRollMatch) {
    const val = parseInt(twoDigitRollMatch[1], 10);
    if (val >= 18 && val <= 30) {
      return deriveYearFromPrefix(val);
    }
  }

  // 4. Institutional email format: .ad26@bitsathy.ac.in (26 -> 1st Year) or .cs23@bitsathy.ac.in (23 -> 4th Year)
  const emailMatch = email.match(/([a-z]+)(\d{2})@bitsathy\.ac\.in/);
  if (emailMatch) {
    return deriveYearFromPrefix(parseInt(emailMatch[2], 10));
  }

  // 5. Fallback to explicitly stored user.year if roll/email didn't match
  if (user.year) {
    const yStr = String(user.year).trim();
    if (/^[1-4]$/.test(yStr)) {
      const map: Record<string, string> = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
      return map[yStr] || `${yStr} Year`;
    }
    if (yStr.toLowerCase().includes('year')) return yStr;
    return `${yStr} Year`;
  }

  return '1st Year';
};

const DEPT_MAP: Record<string, string> = {
  UCS: 'CSE',
  UIT: 'IT',
  UAD: 'AIDS',
  UAL: 'AIML',
  UEC: 'ECE',
  UEI: 'EIE',
  UEE: 'EEE',
  UCE: 'CIVIL',
  UME: 'MECH',
  UBT: 'BIOTECH',
  UFT: 'FOOD TECH',

  CS: 'CSE',
  IT: 'IT',
  AD: 'AIDS',
  AL: 'AIML',
  EC: 'ECE',
  EI: 'EIE',
  EE: 'EEE',
  CE: 'CIVIL',
  ME: 'MECH',
  BT: 'BIOTECH',
  FT: 'FOOD TECH',
};

const deriveStudentDepartment = (user: any): string => {
  if (!user) return 'CSE';

  const roll = String(user.rollNo || '').toUpperCase().trim();
  const email = String(user.email || '').toLowerCase().trim();

  // 1. BIT Roll format with 3-letter UG code: e.g. 2026UAD1214 -> AIDS, 2026UCS1001 -> CSE
  const bitMatch = roll.match(/(U[A-Z]{2})/);
  if (bitMatch && DEPT_MAP[bitMatch[1]]) {
    return DEPT_MAP[bitMatch[1]];
  }

  // 2. Anna University format: 7376YY(D)XX... e.g. 7376231CS272 -> CS -> CSE
  const auMatch = roll.match(/7376\d{2,3}([A-Z]{2})/);
  if (auMatch && DEPT_MAP[auMatch[1]]) {
    return DEPT_MAP[auMatch[1]];
  }

  // 3. 2-digit roll format: e.g. 23CS012, 241CS222, 26AD105
  const rollCodeMatch = roll.match(/^\d{2,3}([A-Z]{2})/);
  if (rollCodeMatch && DEPT_MAP[rollCodeMatch[1]]) {
    return DEPT_MAP[rollCodeMatch[1]];
  }

  // 4. Institutional email: e.g. name.ad26@bitsathy.ac.in, bhavana.cs22@bitsathy.ac.in
  const emailMatch = email.match(/\.([a-z]{2,3})\d{2}@bitsathy\.ac\.in/);
  if (emailMatch) {
    const code = emailMatch[1].toUpperCase();
    if (DEPT_MAP[code]) return DEPT_MAP[code];
  }

  // 5. Normalization of existing user.department string
  if (user.department) {
    const d = String(user.department).toUpperCase().trim();
    if (DEPT_MAP[d]) return DEPT_MAP[d];
    if (d.includes('COMPUTER') || d === 'CSE') return 'CSE';
    if (d.includes('INFORMATION') || d === 'IT') return 'IT';
    if (d.includes('DATA SCIENCE') || d.includes('AIDS') || d.includes('AI & DS') || d.includes('AI&DS')) return 'AIDS';
    if (d.includes('MACHINE LEARNING') || d.includes('AIML')) return 'AIML';
    if (d.includes('COMMUNICATION') || d === 'ECE') return 'ECE';
    if (d.includes('INSTRUMENTATION') || d === 'EIE') return 'EIE';
    if (d.includes('ELECTRICAL') || d === 'EEE') return 'EEE';
    if (d.includes('CIVIL') || d === 'UCE') return 'CIVIL';
    if (d.includes('MECH') || d === 'UME') return 'MECH';
    if (d.includes('BIOTECH') || d === 'UBT') return 'BIOTECH';
    if (d.includes('FOOD') || d === 'UFT') return 'FOOD TECH';
    return String(user.department).trim();
  }

  return 'CSE';
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
      const derivedDepartment = deriveStudentDepartment(u);

      if (u.college !== derivedCollege || u.year !== derivedYear || u.department !== derivedDepartment) {
        bulkOps.push({
          updateOne: {
            filter: { _id: u._id },
            update: {
              $set: {
                college: derivedCollege,
                year: derivedYear,
                department: derivedDepartment,
              },
            },
          },
        });
        updatedCount++;
      }
    }

    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps);
      console.log(`[Sync] Successfully updated ${updatedCount} users with college, year, and department!`);
    } else {
      console.log('[Sync] All users already have college, year, and department up to date.');
    }

    // Sample check
    const sample = await User.find({ role: 'Student' }).limit(5).lean();
    console.log('[Sync] Sample updated students:');
    sample.forEach((s: any) => {
      console.log(` - ${s.name} (${s.rollNo}): College = ${s.college}, Year = ${s.year}, Dept = ${s.department}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Sync Error]', err);
    process.exit(1);
  }
};

syncCollegeAndYear();

