import mongoose from 'mongoose';
import AttendanceModel from '../models/attendanceModel';
import EventOtp from '../models/eventOtpModel';
import AttendanceLockout from '../models/attendanceLockoutModel';

export interface AttendanceEntry {
  userId: string;
  eventId: string;
  dayNumber: number;
  dateAttended?: Date;
  timestamp: Date;
}

export interface EventOtpRecord {
  otp: string;
  expiresAt: number;
}

export interface FailedAttemptRecord {
  attempts: number;
  lockedUntil: number;
}

export interface VerifyAndQueueResult {
  success: boolean;
  status?: 'saved' | 'pending';
  retryAfter?: number;
  message?: string;
  error?: string;
  queueLength?: number;
  dayNumber?: number;
}

export interface FlushResult {
  flushedCount: number;
  remainingCount: number;
}

export class AttendanceBuffer {
  // In-memory key-value stores for sub-millisecond lookups
  // Key format for activeOTPs: `${eventId}:day:${dayNumber}` (with fallback `${eventId}`)
  public activeOTPs: Map<string, EventOtpRecord> = new Map();
  // Key format for markedSet: `${userId}:${eventId}:day:${dayNumber}`
  public markedSet: Set<string> = new Set();
  // Key format for failedAttempts: `${userId}:${eventId}`
  public failedAttempts: Map<string, FailedAttemptRecord> = new Map();
  public writeQueue: AttendanceEntry[] = [];
  public isFlushing: boolean = false;
  private flushInterval: NodeJS.Timeout;

  constructor() {
    // Automatically trigger flush every 4000ms
    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => {
        console.error('[AttendanceBuffer] Auto-flush error:', err);
      });
    }, 4000);

    // unref allows Node to exit cleanly when other tasks finish
    if (this.flushInterval && typeof this.flushInterval.unref === 'function') {
      this.flushInterval.unref();
    }

    this.registerShutdownHooks();
  }

  public getOtpCacheTtlMs(): number {
    return (Number(process.env.OTP_CACHE_TTL_SECONDS) || 15) * 1000;
  }

  /**
   * Helper to construct composite key for multi-day events
   */
  private makeOtpKey(eventId: string, dayNumber: number = 1): string {
    return `${String(eventId).trim()}:day:${dayNumber}`;
  }

  /**
   * Helper to construct student marked attendance key for a specific event day
   */
  private makeMarkedKey(userId: string, eventId: string, dayNumber: number = 1): string {
    return `${String(userId).trim()}:${String(eventId).trim()}:day:${dayNumber}`;
  }

  /**
   * Helper to construct attempt lock key per user and event
   */
  private makeAttemptKey(userId: string, eventId: string): string {
    return `${String(userId).trim()}:${String(eventId).trim()}`;
  }

  /**
   * Saves the active OTP for an event and specific day to in-memory cache with expiry TTL
   * @param eventId The event identifier
   * @param otp The active OTP string
   * @param dayNumber Event day number (default: 1)
   * @param ttlMinutes Expiry time-to-live in minutes (default: 30 minutes)
   */
  public setEventOTP(
    eventId: string,
    otp: string,
    dayNumber: number = 1,
    ttlMinutes: number = 30
  ): void {
    if (!eventId || !otp) return;
    const cleanEventId = String(eventId).trim();
    const cleanOtp = String(otp).trim();
    const parsedDay = Math.max(1, Number(dayNumber) || 1);
    const ttlMs = Math.max(1, Number(ttlMinutes) || 30) * 60 * 1000;
    const expiresAt = Date.now() + ttlMs;

    const record: EventOtpRecord = { otp: cleanOtp, expiresAt };

    // Store day-specific key as well as default event key for backward compatibility
    this.activeOTPs.set(this.makeOtpKey(cleanEventId, parsedDay), record);
    if (parsedDay === 1) {
      this.activeOTPs.set(cleanEventId, record);
    }

    // Asynchronously synchronize with shared MongoDB collection if connected or mocked
    if (mongoose.connection.readyState === 1 || (EventOtp.findOneAndUpdate as any).mock) {
      void EventOtp.findOneAndUpdate(
        { eventId: cleanEventId, dayNumber: parsedDay },
        {
          $set: {
            eventId: cleanEventId,
            dayNumber: parsedDay,
            otp: cleanOtp,
            expiresAt: new Date(expiresAt),
          },
        },
        { upsert: true, new: true }
      ).catch((err) => {
        console.warn('[AttendanceBuffer] Error syncing EventOTP to MongoDB:', err);
      });
    }
  }

  /**
   * Asynchronously saves active OTP to memory and shared MongoDB collection across all nodes.
   */
  public async setEventOTPAsync(
    eventId: string,
    otp: string,
    dayNumber: number = 1,
    ttlMinutes: number = 30
  ): Promise<void> {
    if (!eventId || !otp) return;
    const cleanEventId = String(eventId).trim();
    const cleanOtp = String(otp).trim();
    const parsedDay = Math.max(1, Number(dayNumber) || 1);
    const ttlMs = Math.max(1, Number(ttlMinutes) || 30) * 60 * 1000;
    const expiresAt = Date.now() + ttlMs;

    const record: EventOtpRecord = { otp: cleanOtp, expiresAt };
    this.activeOTPs.set(this.makeOtpKey(cleanEventId, parsedDay), record);
    if (parsedDay === 1) {
      this.activeOTPs.set(cleanEventId, record);
    }

    if (mongoose.connection.readyState !== 1 && !(EventOtp.findOneAndUpdate as any).mock) {
      return;
    }

    await EventOtp.findOneAndUpdate(
      { eventId: cleanEventId, dayNumber: parsedDay },
      {
        $set: {
          eventId: cleanEventId,
          dayNumber: parsedDay,
          otp: cleanOtp,
          expiresAt: new Date(expiresAt),
        },
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Retrieves active OTP across nodes: checks local memory first, then queries shared MongoDB collection.
   */
  public async getEventOTPAsync(eventId: string, dayNumber: number = 1): Promise<string | undefined> {
    const memoryOtp = this.getEventOTP(eventId, dayNumber);
    if (memoryOtp) return memoryOtp;

    if (mongoose.connection.readyState !== 1 && !(EventOtp.findOne as any).mock) {
      return memoryOtp;
    }

    const cleanEventId = String(eventId).trim();
    const parsedDay = Math.max(1, Number(dayNumber) || 1);

    try {
      const doc = await EventOtp.findOne({
        eventId: cleanEventId,
        dayNumber: parsedDay,
        expiresAt: { $gt: new Date() },
      }).lean();

      if (doc && doc.otp) {
        const docExpiresAt = doc.expiresAt ? new Date(doc.expiresAt).getTime() : Date.now() + 30 * 60 * 1000;
        const cacheTtlCap = Date.now() + this.getOtpCacheTtlMs();
        const exp = Math.min(docExpiresAt, cacheTtlCap);
        this.activeOTPs.set(this.makeOtpKey(cleanEventId, parsedDay), { otp: doc.otp, expiresAt: exp });
        return doc.otp;
      }
    } catch (err) {
      console.warn('[AttendanceBuffer] Error querying EventOTP from MongoDB:', err);
    }

    return undefined;
  }

  /**
   * Retrieves the active OTP for an event day from memory, verifying expiry
   */
  public getEventOTP(eventId: string, dayNumber: number = 1): string | undefined {
    const cleanEventId = String(eventId).trim();
    const parsedDay = Math.max(1, Number(dayNumber) || 1);
    const dayKey = this.makeOtpKey(cleanEventId, parsedDay);
    
    let record = this.activeOTPs.get(dayKey);
    if (!record) {
      record = this.activeOTPs.get(cleanEventId);
    }

    if (!record) return undefined;

    // Check TTL expiry
    if (record.expiresAt && Date.now() > record.expiresAt) {
      this.activeOTPs.delete(dayKey);
      this.activeOTPs.delete(cleanEventId);
      return undefined;
    }

    return record.otp;
  }

  /**
   * Removes active OTP from memory for an event day
   */
  public clearEventOTP(eventId: string, dayNumber?: number): void {
    const cleanEventId = String(eventId).trim();
    if (dayNumber !== undefined) {
      this.activeOTPs.delete(this.makeOtpKey(cleanEventId, dayNumber));
    } else {
      this.activeOTPs.delete(cleanEventId);
      for (let d = 1; d <= 10; d++) {
        this.activeOTPs.delete(this.makeOtpKey(cleanEventId, d));
      }
    }
  }

  /**
   * Revokes an active OTP immediately from local memory and from the shared MongoDB collection.
   * Other cluster nodes will stop accepting the revoked OTP within their capped cache TTL (default 15s).
   */
  public async revokeEventOTPAsync(eventId: string, dayNumber: number = 1): Promise<void> {
    const cleanEventId = String(eventId).trim();
    const parsedDay = Math.max(1, Number(dayNumber) || 1);

    this.clearEventOTP(cleanEventId, parsedDay);

    if (mongoose.connection.readyState !== 1 && !(EventOtp.deleteMany as any).mock) {
      return;
    }

    try {
      await EventOtp.deleteMany({ eventId: cleanEventId, dayNumber: parsedDay });
    } catch (err) {
      console.warn('[AttendanceBuffer] Error revoking EventOTP in MongoDB:', err);
    }
  }

  /**
   * Resets in-memory caches and queues (useful for isolated unit testing)
   */
  public resetBuffer(): void {
    this.activeOTPs.clear();
    this.markedSet.clear();
    this.failedAttempts.clear();
    this.writeQueue = [];
    this.isFlushing = false;
  }

  /**
   * Validates the OTP against the activeOTPs map for the specified event day.
   * If valid and student hasn't marked for that day in markedSet, pushes to writeQueue.
   * If the queue hits 50 items, triggers a batch flush.
   * Responds in sub-millisecond time without awaiting database calls.
   */
  public verifyAndQueue(
    userId: string,
    eventId: string,
    otp: string,
    dayNumber: number = 1,
    dateAttended?: Date
  ): VerifyAndQueueResult {
    if (!userId || !eventId || !otp) {
      return {
        success: false,
        error: 'Missing required parameters: userId, eventId, and otp are required',
      };
    }

    const cleanUserId = String(userId).trim();
    const cleanEventId = String(eventId).trim();
    const cleanOtp = String(otp).trim();
    const parsedDay = Math.max(1, Number(dayNumber) || 1);
    const attemptKey = this.makeAttemptKey(cleanUserId, cleanEventId);

    // 1. Check if user is currently locked out from OTP attempts for this event
    const attemptRecord = this.failedAttempts.get(attemptKey);
    if (attemptRecord && attemptRecord.lockedUntil > Date.now()) {
      const remainingSec = Math.ceil((attemptRecord.lockedUntil - Date.now()) / 1000);
      return {
        success: false,
        error: `Too many invalid OTP attempts for this event. Account locked for ${remainingSec} seconds.`,
      };
    }

    // 2. Instant O(1) in-memory OTP validation for the specific event day
    const activeOtp = this.getEventOTP(cleanEventId, parsedDay);
    if (!activeOtp || activeOtp !== cleanOtp) {
      const currentAttempts = (attemptRecord?.attempts || 0) + 1;
      const isLocked = currentAttempts >= 5;
      const lockedUntil = isLocked ? Date.now() + 15 * 60 * 1000 : 0;
      this.failedAttempts.set(attemptKey, { attempts: currentAttempts, lockedUntil });

      if (isLocked) {
        return {
          success: false,
          error: 'Maximum OTP verification attempts exceeded (5). Account locked for this event for 15 minutes.',
        };
      }

      return {
        success: false,
        error: `Invalid or expired OTP for Day ${parsedDay} of this event. Attempts remaining: ${5 - currentAttempts}`,
      };
    }

    // 3. Instant O(1) duplicate submission check for that specific day
    const markKey = this.makeMarkedKey(cleanUserId, cleanEventId, parsedDay);
    if (this.markedSet.has(markKey)) {
      return {
        success: false,
        error: `Attendance has already been marked for Day ${parsedDay} of this event`,
      };
    }

    // 4. Successful verification: reset failed attempt counter and mark duplicate guard
    this.failedAttempts.delete(attemptKey);
    this.markedSet.add(markKey);

    // 5. Push to batched write queue
    this.writeQueue.push({
      userId: cleanUserId,
      eventId: cleanEventId,
      dayNumber: parsedDay,
      dateAttended: dateAttended ? new Date(dateAttended) : new Date(),
      timestamp: new Date(),
    });

    // 5. If queue reaches or exceeds 50 items, trigger a flush without awaiting
    if (this.writeQueue.length >= 50) {
      void this.flush().catch((err) => {
        console.error('[AttendanceBuffer] Error during threshold-triggered flush:', err);
      });
    }

    return {
      success: true,
      message: `Attendance for Day ${parsedDay} recorded and queued successfully`,
      dayNumber: parsedDay,
      queueLength: this.writeQueue.length,
    };
  }

  /**
   * Multi-Node Asynchronous Attendance Verification:
   * Validates OTP across cluster nodes (via EventOtp shared MongoDB collection),
   * enforces cluster-wide attempt limits (via AttendanceLockout shared MongoDB collection),
   * and prevents duplicate attendance via AttendanceModel unique compound index.
   */
  public async verifyAndQueueAsync(
    userId: string,
    eventId: string,
    otp: string,
    dayNumber: number = 1,
    dateAttended?: Date
  ): Promise<VerifyAndQueueResult> {
    if (!userId || !eventId || !otp) {
      return {
        success: false,
        error: 'Missing required parameters: userId, eventId, and otp are required',
      };
    }

    // If Mongoose is not connected and models are not mocked, fall back to high-speed in-memory verification
    if (mongoose.connection.readyState !== 1 && !(AttendanceLockout.findOne as any).mock) {
      return this.verifyAndQueue(userId, eventId, otp, dayNumber, dateAttended);
    }

    const cleanUserId = String(userId).trim();
    const cleanEventId = String(eventId).trim();
    const cleanOtp = String(otp).trim();
    const parsedDay = Math.max(1, Number(dayNumber) || 1);
    const attemptKey = this.makeAttemptKey(cleanUserId, cleanEventId);

    // 1. Check in-memory attempt lockout
    const memoryAttempt = this.failedAttempts.get(attemptKey);
    if (memoryAttempt && memoryAttempt.lockedUntil > Date.now()) {
      const remainingSec = Math.max(1, Math.ceil((memoryAttempt.lockedUntil - Date.now()) / 1000));
      return {
        success: false,
        error: `Too many invalid OTP attempts for this event. Account locked for ${remainingSec} seconds.`,
      };
    }

    // 2. Check MongoDB shared attempt lockout across nodes
    try {
      const dbLockout = await AttendanceLockout.findOne({ userId: cleanUserId, eventId: cleanEventId }).lean();
      if (dbLockout && dbLockout.lockedUntil && new Date(dbLockout.lockedUntil).getTime() > Date.now()) {
        const remainingSec = Math.max(1, Math.ceil((new Date(dbLockout.lockedUntil).getTime() - Date.now()) / 1000));
        return {
          success: false,
          error: `Too many invalid OTP attempts for this event. Account locked for ${remainingSec} seconds.`,
        };
      }
    } catch (dbErr) {
      // Continue
    }

    // 3. Check duplicate submission in MongoDB and memory
    const markKey = this.makeMarkedKey(cleanUserId, cleanEventId, parsedDay);
    if (this.markedSet.has(markKey)) {
      return {
        success: false,
        error: `Attendance has already been marked for Day ${parsedDay} of this event`,
      };
    }

    try {
      const existingAttendance = await AttendanceModel.findOne({
        userId: cleanUserId,
        eventId: cleanEventId,
        dayNumber: parsedDay,
      }).lean();
      if (existingAttendance) {
        this.markedSet.add(markKey);
        return {
          success: false,
          error: `Attendance has already been marked for Day ${parsedDay} of this event`,
        };
      }
    } catch (attErr) {
      // Continue
    }

    // 4. Validate OTP across cluster nodes (checks memory then MongoDB)
    const activeOtp = await this.getEventOTPAsync(cleanEventId, parsedDay);
    if (!activeOtp || activeOtp !== cleanOtp) {
      let currentAttempts = memoryAttempt?.attempts || 0;
      try {
        const existingLockout = await AttendanceLockout.findOne({ userId: cleanUserId, eventId: cleanEventId });
        if (existingLockout) {
          currentAttempts = Math.max(currentAttempts, existingLockout.attempts);
        }
      } catch {}

      currentAttempts += 1;
      const isLocked = currentAttempts >= 5;
      const lockedUntilMs = isLocked ? Date.now() + 15 * 60 * 1000 : 0;
      const lockedUntilDate = isLocked ? new Date(lockedUntilMs) : null;
      const expiresAtDate = new Date(Date.now() + (isLocked ? 16 * 60 * 1000 : 30 * 60 * 1000));

      this.failedAttempts.set(attemptKey, { attempts: currentAttempts, lockedUntil: lockedUntilMs });

      // Save to shared MongoDB AttendanceLockout across nodes
      try {
        await AttendanceLockout.findOneAndUpdate(
          { userId: cleanUserId, eventId: cleanEventId },
          {
            $set: {
              userId: cleanUserId,
              eventId: cleanEventId,
              attempts: currentAttempts,
              lockedUntil: lockedUntilDate,
              expiresAt: expiresAtDate,
            },
          },
          { upsert: true, new: true }
        );
      } catch (saveLockErr) {
        console.warn('[AttendanceBuffer] Error updating AttendanceLockout:', saveLockErr);
      }

      if (isLocked) {
        return {
          success: false,
          error: 'Maximum OTP verification attempts exceeded (5). Account locked for this event for 15 minutes.',
        };
      }

      return {
        success: false,
        error: `Invalid or expired OTP for Day ${parsedDay} of this event. Attempts remaining: ${5 - currentAttempts}`,
      };
    }

    // 5. Successful verification: clear lockout in memory and in MongoDB
    this.failedAttempts.delete(attemptKey);
    this.markedSet.add(markKey);

    try {
      await AttendanceLockout.deleteMany({ userId: cleanUserId, eventId: cleanEventId });
    } catch {}

    // Durably insert into MongoDB AttendanceModel (idempotent via unique compound index)
    try {
      await AttendanceModel.create({
        userId: cleanUserId,
        eventId: cleanEventId,
        dayNumber: parsedDay,
        dateAttended: dateAttended ? new Date(dateAttended) : new Date(),
        timestamp: new Date(),
        status: 'Present',
      });

      return {
        success: true,
        status: 'saved',
        message: `Attendance for Day ${parsedDay} confirmed and stored durably in database`,
        dayNumber: parsedDay,
        queueLength: this.writeQueue.length,
      };
    } catch (writeErr: any) {
      if (writeErr.code === 11000) {
        return {
          success: false,
          error: `Attendance has already been marked for Day ${parsedDay} of this event`,
        };
      }
      this.writeQueue.push({
        userId: cleanUserId,
        eventId: cleanEventId,
        dayNumber: parsedDay,
        dateAttended: dateAttended ? new Date(dateAttended) : new Date(),
        timestamp: new Date(),
      });

      return {
        success: true,
        status: 'pending',
        retryAfter: 2,
        message: `Attendance for Day ${parsedDay} enqueued for durable storage. Awaiting batch flusher confirmation.`,
        dayNumber: parsedDay,
        queueLength: this.writeQueue.length,
      };
    }
  }

  /**
   * Flushes queued attendance records to MongoDB Atlas using bulkWrite with upsert: true.
   * Upsert filter includes dayNumber to safely record attendance across multi-day events.
   * Protected with `isFlushing` lock to prevent race conditions.
   */
  public async flush(): Promise<FlushResult> {
    // If a flush is already in progress or the queue is empty, do not re-enter
    if (this.isFlushing || this.writeQueue.length === 0) {
      return {
        flushedCount: 0,
        remainingCount: this.writeQueue.length,
      };
    }

    this.isFlushing = true;
    // Take all current items out of the queue so newly queued items during bulkWrite won't be lost
    const batch = this.writeQueue.splice(0, this.writeQueue.length);

    try {
      const bulkOps = batch.map((item) => {
        const isUserObjId =
          mongoose.Types.ObjectId.isValid(item.userId) &&
          String(new mongoose.Types.ObjectId(item.userId)) === item.userId;
        const isEventObjId =
          mongoose.Types.ObjectId.isValid(item.eventId) &&
          String(new mongoose.Types.ObjectId(item.eventId)) === item.eventId;

        return {
          updateOne: {
            filter: {
              userId: item.userId,
              eventId: item.eventId,
              dayNumber: item.dayNumber,
            },
            update: {
              $setOnInsert: {
                userId: item.userId,
                eventId: item.eventId,
                dayNumber: item.dayNumber,
                dateAttended: item.dateAttended || item.timestamp,
                ...(isUserObjId ? { user: new mongoose.Types.ObjectId(item.userId) } : {}),
                ...(isEventObjId ? { event: new mongoose.Types.ObjectId(item.eventId) } : {}),
                timestamp: item.timestamp || new Date(),
                status: 'Present',
              },
            },
            upsert: true,
          },
        };
      });

      if (bulkOps.length > 0) {
        await AttendanceModel.bulkWrite(bulkOps, { ordered: false });
      }

      return {
        flushedCount: batch.length,
        remainingCount: this.writeQueue.length,
      };
    } catch (error) {
      console.error('[AttendanceBuffer] MongoDB bulkWrite error:', error);
      // Re-prepend items to the front of writeQueue on failure to prevent data loss
      this.writeQueue.unshift(...batch);
      throw error;
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Registers graceful shutdown hooks on SIGTERM and SIGINT to flush any
   * pending in-memory attendance records before the process terminates.
   */
  private registerShutdownHooks(): void {
    const handleShutdown = async (signal: string) => {
      console.log(`[AttendanceBuffer] Received ${signal}, flushing pending attendance records before exit...`);
      try {
        await this.flushAllPending();
        console.log('[AttendanceBuffer] Shutdown flush complete.');
      } catch (err) {
        console.error('[AttendanceBuffer] Error during shutdown flush:', err);
      }
    };

    process.once('SIGTERM', () => void handleShutdown('SIGTERM'));
    process.once('SIGINT', () => void handleShutdown('SIGINT'));
  }

  /**
   * Flushes all pending queued records until writeQueue is completely drained.
   */
  public async flushAllPending(): Promise<void> {
    while (this.writeQueue.length > 0) {
      await this.flush();
    }
  }

  /**
   * Stops the background interval timer
   */
  public stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
  }

  /**
   * Resets in-memory state (useful for unit testing)
   */
  public clear(): void {
    this.activeOTPs.clear();
    this.markedSet.clear();
    this.writeQueue = [];
    this.isFlushing = false;
  }
}

export const attendanceBuffer = new AttendanceBuffer();
export default attendanceBuffer;
