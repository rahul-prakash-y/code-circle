import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Notification from '../models/notificationModel';
import User from '../models/userModel';

const seedNotifications = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI is missing');

    await mongoose.connect(mongoUri);
    console.log('[Seed Notifications] Connected to MongoDB');

    // Find any admin or superadmin to be the creator
    let admin = await User.findOne({ role: { $in: ['SuperAdmin', 'Admin'] } });
    if (!admin) {
      admin = await User.findOne();
    }

    if (!admin) {
      console.log('[Seed Notifications] No users found. Skipping.');
      await mongoose.disconnect();
      return;
    }

    const count = await Notification.countDocuments();
    if (count > 0) {
      console.log(`[Seed Notifications] Already have ${count} notifications. Skipping seed.`);
      await mongoose.disconnect();
      return;
    }

    const sampleNotifications = [
      {
        title: 'Nebula Hackathon 2026 Announced',
        message: 'The annual flagship hackathon registrations are now open. Form teams of 2 to 4 members.',
        type: 'info',
        targetRole: 'All',
        link: '/events',
        createdBy: admin._id,
      },
      {
        title: 'System Feature: Student Bearers Portal',
        message: 'Meet the executive student bearers of Code Circle club driving all club operations and events.',
        type: 'success',
        targetRole: 'All',
        link: '/bearers',
        createdBy: admin._id,
      },
      {
        title: 'Weekly Algorithmic Assessment Live',
        message: 'A new timed coding assessment tier is active on the platform. Verify your skills on the leaderboard!',
        type: 'warning',
        targetRole: 'Student',
        link: '/assessments',
        createdBy: admin._id,
      },
    ];

    await Notification.insertMany(sampleNotifications);
    console.log('[Seed Notifications] Seeded initial admin notifications successfully.');

    await mongoose.disconnect();
  } catch (err) {
    console.error('[Seed Notifications] Error:', err);
  }
};

seedNotifications();
