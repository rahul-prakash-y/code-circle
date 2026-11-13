import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { syncDatabaseIndexes } from '../config/db';

dotenv.config();

export async function runIndexFix() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is not set in environment variables.');
    process.exit(1);
  }

  try {
    console.log('[Script: fixEventArenaIndexes] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[Script: fixEventArenaIndexes] Connected. Checking and dropping legacy indexes...');
    await syncDatabaseIndexes();
    console.log('[Script: fixEventArenaIndexes] Done! All indexes cleaned up.');
  } catch (err: any) {
    console.error('[Script: fixEventArenaIndexes] Error:', err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

if (require.main === module) {
  runIndexFix();
}
