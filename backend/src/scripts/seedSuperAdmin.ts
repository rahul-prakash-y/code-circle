import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/userModel';

const seedSuperAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in .env');
    }

    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB');

    const superAdminEmail = 'superadmin@codecircle.com';
    const superAdminRollNo = 'SUPERADMIN01';
    const superAdminPassword = process.env.SUPERADMIN_DEFAULT_PASSWORD || 'SuperAdmin@2026!';

    let superAdmin = await User.findOne({ email: superAdminEmail });

    if (superAdmin) {
      console.log(`[Seed] SuperAdmin exists (${superAdmin.email}), updating role and permissions...`);
      superAdmin.role = 'SuperAdmin';
      superAdmin.isBlocked = false;
      superAdmin.password = superAdminPassword; // Pre-save hook will hash it
      await superAdmin.save();
      console.log('[Seed] SuperAdmin updated successfully');
    } else {
      console.log(`[Seed] Creating new SuperAdmin account (${superAdminEmail})...`);
      superAdmin = new User({
        name: 'System SuperAdmin',
        rollNo: superAdminRollNo,
        email: superAdminEmail,
        role: 'SuperAdmin',
        password: superAdminPassword, // Pre-save hook will hash it
        department: 'System Architecture',
        skills: ['Security', 'Cloud Operations', 'Fastify', 'Governance'],
        isBlocked: false,
      });
      await superAdmin.save();
      console.log('[Seed] SuperAdmin account created successfully');
    }

    console.log('\n=======================================');
    console.log('SuperAdmin Credentials:');
    console.log(`Email:    ${superAdminEmail}`);
    console.log(`Roll No:  ${superAdminRollNo}`);
    console.log(`Password: ${superAdminPassword}`);
    console.log('=======================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedSuperAdmin();
