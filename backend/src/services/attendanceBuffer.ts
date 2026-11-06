import mongoose from 'mongoose';
import AttendanceModel from '../models/attendanceModel';

export interface AttendanceEntry {
  userId: string;
  eventId: string;
  dayNumber: number;
  dateAttended?: Date;
  timestamp: Date;
}

export interface VerifyAndQueueResult {
  success: boolean;
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
  public activeOTPs: Map<string, string> = new Map();
  // Key format for markedSet: `${userId}:${eventId}:day:${dayNumber}`
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
   * Saves the active OTP for an event and specific day to in-memory cache
   */
  public setEventOTP(eventId: string, otp: string, dayNumber: number = 1): void {
    if (!eventId || !otp) return;
    const cleanEventId = String(eventId).trim();
    const cleanOtp = String(otp).trim();
    const parsedDay = Math.max(1, Number(dayNumber) || 1);

    // Store day-specific key as well as default event key for backward compatibility
    this.activeOTPs.set(this.makeOtpKey(cleanEventId, parsedDay), cleanOtp);
    if (parsedDay === 1) {
      this.activeOTPs.set(cleanEventId, cleanOtp);
    }
  }

  /**
   * Retrieves the active OTP for an event day from memory
   */
  public getEventOTP(eventId: string, dayNumber: number = 1): string | undefined {
    const cleanEventId = String(eventId).trim();
    const parsedDay = Math.max(1, Number(dayNumber) || 1);
    return (
      this.activeOTPs.get(this.makeOtpKey(cleanEventId, parsedDay)) ||
      this.activeOTPs.get(cleanEventId)
    );
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

    // 1. Instant O(1) in-memory OTP validation for the specific event day
    const activeOtp = this.getEventOTP(cleanEventId, parsedDay);
    if (!activeOtp || activeOtp !== cleanOtp) {
      return {
        success: false,
        error: `Invalid or expired OTP for Day ${parsedDay} of this event`,
      };
    }

    // 2. Instant O(1) duplicate submission check for that specific day
    const markKey = this.makeMarkedKey(cleanUserId, cleanEventId, parsedDay);
    if (this.markedSet.has(markKey)) {
      return {
        success: false,
        error: `Attendance has already been marked for Day ${parsedDay} of this event`,
      };
    }

    // 3. Mark in memory to block concurrent duplicates for this day immediately
    this.markedSet.add(markKey);

    // 4. Push to batched write queue
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
