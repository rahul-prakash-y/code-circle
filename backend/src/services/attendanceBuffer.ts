import mongoose from 'mongoose';
import AttendanceModel from '../models/attendanceModel';

export interface AttendanceEntry {
  userId: string;
  eventId: string;
  timestamp: Date;
}

export interface VerifyAndQueueResult {
  success: boolean;
  message?: string;
  error?: string;
  queueLength?: number;
}

export interface FlushResult {
  flushedCount: number;
  remainingCount: number;
}

export class AttendanceBuffer {
  public activeOTPs: Map<string, string> = new Map();
  public markedSet: Set<string> = new Set();
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
  }

  /**
   * Saves the active OTP for an event to in-memory cache for instant lookup
   */
  public setEventOTP(eventId: string, otp: string): void {
    if (!eventId || !otp) return;
    this.activeOTPs.set(String(eventId).trim(), String(otp).trim());
  }

  /**
   * Retrieves the active OTP for an event from memory
   */
  public getEventOTP(eventId: string): string | undefined {
    return this.activeOTPs.get(String(eventId).trim());
  }

  /**
   * Removes active OTP from memory
   */
  public clearEventOTP(eventId: string): void {
    this.activeOTPs.delete(String(eventId).trim());
  }

  /**
   * Validates the OTP against the activeOTPs map.
   * If valid and not in markedSet, pushes to writeQueue.
   * If the queue hits 50 items, triggers a flush.
   * Responds in sub-millisecond time without awaiting database calls.
   */
  public verifyAndQueue(userId: string, eventId: string, otp: string): VerifyAndQueueResult {
    if (!userId || !eventId || !otp) {
      return {
        success: false,
        error: 'Missing required parameters: userId, eventId, and otp are required',
      };
    }

    const cleanUserId = String(userId).trim();
    const cleanEventId = String(eventId).trim();
    const cleanOtp = String(otp).trim();

    // 1. Instant O(1) in-memory OTP validation
    const activeOtp = this.activeOTPs.get(cleanEventId);
    if (!activeOtp || activeOtp !== cleanOtp) {
      return {
        success: false,
        error: 'Invalid or expired OTP',
      };
    }

    // 2. Instant O(1) duplicate submission check
    const markKey = `${cleanUserId}:${cleanEventId}`;
    if (this.markedSet.has(markKey)) {
      return {
        success: false,
        error: 'Attendance has already been marked for this event',
      };
    }

    // 3. Mark in memory to block concurrent duplicates immediately
    this.markedSet.add(markKey);

    // 4. Push to batched write queue
    this.writeQueue.push({
      userId: cleanUserId,
      eventId: cleanEventId,
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
      message: 'Attendance recorded and queued successfully',
      queueLength: this.writeQueue.length,
    };
  }

  /**
   * Flushes queued attendance records to MongoDB Atlas using bulkWrite with upsert: true.
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
            filter: { userId: item.userId, eventId: item.eventId },
            update: {
              $setOnInsert: {
                userId: item.userId,
                eventId: item.eventId,
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
