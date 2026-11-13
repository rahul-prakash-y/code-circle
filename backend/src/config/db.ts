import mongoose from 'mongoose';

export const syncDatabaseIndexes = async (): Promise<void> => {
  try {
    if (!mongoose.connection.db) return;

    // Check if eventarenasubmissions collection exists
    const collections = await mongoose.connection.db
      .listCollections({ name: 'eventarenasubmissions' })
      .toArray();

    if (collections.length > 0) {
      const col = mongoose.connection.db.collection('eventarenasubmissions');
      const indexes = await col.indexes();

      for (const idx of indexes) {
        // Drop any legacy unique index on { eventId: 1, userId: 1 } that lacks assessmentId
        const keyProps = Object.keys(idx.key || {});
        const isLegacyEventUser =
          keyProps.length === 2 && idx.key.eventId === 1 && idx.key.userId === 1;

        if ((idx.name === 'eventId_1_userId_1' || isLegacyEventUser) && idx.name) {
          console.log(`[Database Migration] Dropping conflicting legacy index '${idx.name}' on 'eventarenasubmissions'...`);
          try {
            await col.dropIndex(idx.name);
            console.log(`[Database Migration] Successfully dropped legacy index '${idx.name}'!`);
          } catch (dropErr: any) {
            console.error(`[Database Migration] Failed to drop legacy index '${idx.name}':`, dropErr?.message);
          }
        }
      }

      // Ensure proper compound unique index exists for (eventId, assessmentId, userId)
      try {
        await col.createIndex(
          { eventId: 1, assessmentId: 1, userId: 1 },
          { unique: true, background: true }
        );
        console.log(`[Database Migration] Verified compound index { eventId: 1, assessmentId: 1, userId: 1 } on 'eventarenasubmissions'.`);
      } catch (createErr: any) {
        console.warn(`[Database Migration] Note on creating compound index:`, createErr?.message);
      }
    }
  } catch (err: any) {
    console.error(`[Database Migration] Index cleanup error:`, err?.message || err);
  }
};

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: process.env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50,
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

    // Automatically clean up legacy indexes and ensure compound indexes
    await syncDatabaseIndexes();

    mongoose.connection.on('error', (err) => {
      console.error(`[Database] MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB connection disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[Database] MongoDB connection closed through app termination');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      console.log('[Database] MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error: any) {
    console.error(`[Database Migration] MongoDB connection failure: ${error?.message || error}`);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
};

export default connectDB;
