import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/db';
import Domain from '../models/domainModel';
import Level from '../models/levelModel';
import User from '../models/userModel';

async function main() {
  await connectDB();
  const domains = await Domain.find();
  console.log(`DOMAINS COUNT: ${domains.length}`);
  domains.forEach((d) => {
    console.log(` - ${d.name} (${d._id}) [locked: ${d.isLocked}]`);
  });
  const levelsCount = await Level.countDocuments();
  console.log(`TOTAL LEVELS COUNT: ${levelsCount}`);

  let adminUser = await User.findOne({ role: 'SuperAdmin' });
  if (!adminUser) {
    adminUser = await User.findOne();
  }
  console.log(`FOUND USER ID: ${adminUser?._id || 'none'}, Email: ${adminUser?.email || 'none'}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
