import os from 'os';
import mongoose from 'mongoose';
import AssessmentSubmission, { IAssessmentSubmission } from '../models/assessmentSubmissionModel';
import User from '../models/userModel';
import PointTransaction from '../models/pointTransactionModel';

export class QueueOverflowError extends Error {
  public statusCode: number = 503;
  public code: string = 'QUEUE_OVERFLOW';
  public retryAfterSeconds: number = 2;

  constructor(message: string = 'Submission queue is currently at maximum capacity. Please retry shortly.') {
    super(message);
    this.name = 'QueueOverflowError';
  }
}

export interface QueuedSubmission {
  submissionId: string;
  userId: string;
  assessmentId: string;
  answers: any[];
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  pointsAwarded: number;
  timeSpentSeconds: number;
  detailedResults: any[];
  isLate: boolean;
  submissionStatus: 'on_time' | 'late' | 'review';
  enqueuedAt: Date;
  submittedAt: Date;
  assessmentTitle?: string;
  passingScorePercentage?: number;
  customPoints?: number;
}

export interface FailedSubmissionItem {
  submissionId: string;
  userId: string;
  assessmentId: string;
  error: string;
  failedAt: Date;
  attempts: number;
  submission: QueuedSubmission;
}

export interface QueueFlushResult {
  flushedCount: number;
  remainingPending: number;
  failedCount: number;
  durationMs: number;
}

export interface QueueStatusReport {
  nodeId: string;
  pendingCount: number;
  oldestPendingAgeSeconds: number;
  lastSuccessfulFlush: Date | null;
  failedCount: number;
  failedItems: Array<{
    submissionId: string;
    userId: string;
    assessmentId: string;
    error: string;
    failedAt: Date;
    attempts: number;
  }>;
  isFlushing: boolean;
  isWarningActive: boolean;
  warningMessage: string | null;
}

export class SubmissionQueueService {
  public readonly nodeId: string;
  public readonly maxQueueSize: number;
  public readonly maxBatchSize: number; // Cap doc writes per flush
  public readonly flushIntervalMs: number;

  private pendingQueue: QueuedSubmission[] = [];
  private inFlightMap: Map<string, QueuedSubmission> = new Map();
  private failedQueue: FailedSubmissionItem[] = [];
  private confirmedCache: Map<string, any> = new Map(); // submissionId -> summary for rapid response

  public isFlushing: boolean = false;
  private flushTimer: NodeJS.Timeout | null = null;
  public lastSuccessfulFlush: Date | null = null;

  constructor(options?: {
    maxQueueSize?: number;
    maxBatchSize?: number;
    flushIntervalMs?: number;
    nodeId?: string;
  }) {
    this.nodeId =
      options?.nodeId ||
      process.env.RENDER_INSTANCE_ID ||
      process.env.NODE_ID ||
      `${os.hostname()}-${process.pid}`;
    this.maxQueueSize = options?.maxQueueSize || Number(process.env.MAX_SUBMISSION_QUEUE_SIZE) || 1000;
    this.maxBatchSize = options?.maxBatchSize || 60; // Hard cap 60 doc writes/sec per requirement
    this.flushIntervalMs = options?.flushIntervalMs || 1000; // 1s flush interval

    // Start background flusher
    this.startAutoFlusher();

    // Register process shutdown hooks for durable flush on SIGTERM / SIGINT
    this.registerShutdownHooks();
  }

  private startAutoFlusher(): void {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        console.error(`[SubmissionQueue:${this.nodeId}] Auto-flush error:`, err);
      });
    }, this.flushIntervalMs);

    if (this.flushTimer && typeof this.flushTimer.unref === 'function') {
      this.flushTimer.unref();
    }
  }

  private registerShutdownHooks(): void {
    const handleShutdown = async (signal: string) => {
      console.log(`[SubmissionQueue:${this.nodeId}] Received ${signal}, flushing pending submissions before termination...`);
      try {
        await this.flushAllPending();
        console.log(`[SubmissionQueue:${this.nodeId}] Shutdown flush complete.`);
      } catch (err) {
        console.error(`[SubmissionQueue:${this.nodeId}] Error during shutdown flush:`, err);
      }
    };

    process.once('SIGTERM', () => {
      void handleShutdown('SIGTERM');
    });

    process.once('SIGINT', () => {
      void handleShutdown('SIGINT');
    });
  }

  /**
   * Enqueues an evaluated assessment submission.
   * Returns 'saved' if already confirmed durably, or 'pending' once placed in the queue.
   */
  public async enqueue(submission: QueuedSubmission): Promise<{
    status: 'saved' | 'pending';
    submissionId: string;
    data?: any;
  }> {
    const { submissionId, userId, assessmentId } = submission;

    // 1. Check if already confirmed in-memory cache
    if (this.confirmedCache.has(submissionId)) {
      return {
        status: 'saved',
        submissionId,
        data: this.confirmedCache.get(submissionId),
      };
    }

    // 2. Check if already confirmed in MongoDB
    try {
      const existing = await AssessmentSubmission.findOne({
        user: new mongoose.Types.ObjectId(userId),
        assessment: new mongoose.Types.ObjectId(assessmentId),
        submissionId,
      }).lean();

      if (existing) {
        this.confirmedCache.set(submissionId, existing);
        return {
          status: 'saved',
          submissionId,
          data: existing,
        };
      }
    } catch (dbErr) {
      // If DB is temporarily unreachable, proceed to check in-memory queue
    }

    // 3. Check if already in pendingQueue or inFlight (Idempotent enqueue)
    const alreadyPending = this.pendingQueue.some((item) => item.submissionId === submissionId);
    if (alreadyPending || this.inFlightMap.has(submissionId)) {
      return {
        status: 'pending',
        submissionId,
      };
    }

    // 4. Bounded Queue Check: Reject with 503 if queue overflow
    if (this.pendingQueue.length >= this.maxQueueSize) {
      throw new QueueOverflowError(
        `Submission queue is currently full (${this.pendingQueue.length}/${this.maxQueueSize}). Please retry in 2 seconds.`
      );
    }

    // 5. Add to queue
    this.pendingQueue.push({
      ...submission,
      enqueuedAt: new Date(),
    });

    return {
      status: 'pending',
      submissionId,
    };
  }

  /**
   * Queries whether a submission has been durably confirmed in MongoDB or is still pending.
   */
  public async getStatus(
    userId: string,
    assessmentId: string,
    submissionId: string
  ): Promise<{ status: 'saved' | 'pending' | 'not_found'; data?: any }> {
    // Check confirmed cache
    if (this.confirmedCache.has(submissionId)) {
      return {
        status: 'saved',
        data: this.confirmedCache.get(submissionId),
      };
    }

    // Check pending or in-flight
    const isPending =
      this.pendingQueue.some((item) => item.submissionId === submissionId) ||
      this.inFlightMap.has(submissionId);
    if (isPending) {
      return { status: 'pending' };
    }

    // Check MongoDB
    try {
      const doc = await AssessmentSubmission.findOne({
        user: new mongoose.Types.ObjectId(userId),
        assessment: new mongoose.Types.ObjectId(assessmentId),
        submissionId,
      }).lean();

      if (doc) {
        this.confirmedCache.set(submissionId, doc);
        return { status: 'saved', data: doc };
      }
    } catch (err) {
      // In case of query error, if it was in failed queue, report pending
      const isFailed = this.failedQueue.some((f) => f.submissionId === submissionId);
      if (isFailed) return { status: 'pending' };
    }

    return { status: 'not_found' };
  }

  /**
   * Automatic and manual batch flusher writing to MongoDB.
   * Capped at maxBatchSize (60 doc writes/sec).
   * Idempotent: uses upsert on unique (user, assessment, submissionId).
   */
  public async flush(): Promise<QueueFlushResult> {
    if (this.isFlushing || this.pendingQueue.length === 0) {
      return {
        flushedCount: 0,
        remainingPending: this.pendingQueue.length,
        failedCount: this.failedQueue.length,
        durationMs: 0,
      };
    }

    this.isFlushing = true;
    const startTime = Date.now();

    // Pull at most maxBatchSize (60) items
    const batch = this.pendingQueue.splice(0, this.maxBatchSize);

    // Track items in flight
    for (const item of batch) {
      this.inFlightMap.set(item.submissionId, item);
    }

    let flushedCount = 0;

    try {
      // Prepare bulk upsert operations
      const bulkOps = batch.map((item) => ({
        updateOne: {
          filter: {
            user: new mongoose.Types.ObjectId(item.userId),
            assessment: new mongoose.Types.ObjectId(item.assessmentId),
            submissionId: item.submissionId,
          },
          update: {
            $setOnInsert: {
              user: new mongoose.Types.ObjectId(item.userId),
              assessment: new mongoose.Types.ObjectId(item.assessmentId),
              submissionId: item.submissionId,
              answers: item.answers,
              score: item.score,
              totalPoints: item.totalPoints,
              percentage: item.percentage,
              passed: item.passed,
              pointsAwarded: item.pointsAwarded,
              timeSpentSeconds: item.timeSpentSeconds,
              detailedResults: item.detailedResults,
              isLate: item.isLate,
              submissionStatus: item.submissionStatus,
              durableStatus: 'saved',
              createdAt: item.submittedAt || new Date(),
              updatedAt: new Date(),
            },
          },
          upsert: true,
        },
      }));

      // Execute bulkWrite with unordered execution for maximum throughput
      const writeResult = await AssessmentSubmission.bulkWrite(bulkOps as any, { ordered: false });

      // After successful write, process points and update caches
      for (const item of batch) {
        this.inFlightMap.delete(item.submissionId);

        // Record in confirmed cache
        const confirmationData = {
          submissionId: item.submissionId,
          assessmentId: item.assessmentId,
          score: item.score,
          totalPoints: item.totalPoints,
          percentage: item.percentage,
          passed: item.passed,
          pointsAwarded: item.pointsAwarded,
          isLate: item.isLate,
          submissionStatus: item.submissionStatus,
          submittedAt: item.submittedAt,
        };
        this.confirmedCache.set(item.submissionId, confirmationData);

        // Award points idempotently if passed and pointsAwarded > 0
        if (item.passed && item.pointsAwarded > 0) {
          try {
            const existingTx = await PointTransaction.findOne({
              user: new mongoose.Types.ObjectId(item.userId),
              category: 'Assessment',
              referenceId: item.assessmentId,
            });

            if (!existingTx) {
              await User.findByIdAndUpdate(item.userId, { $inc: { points: item.pointsAwarded } });
              await PointTransaction.create({
                user: new mongoose.Types.ObjectId(item.userId),
                amount: item.pointsAwarded,
                category: 'Assessment',
                title: `Assessment Completed: ${item.assessmentTitle || 'Test'}`,
                description: `Passed with score ${item.score}/${item.totalPoints} (${item.percentage}%)`,
                referenceId: item.assessmentId,
                referenceModel: 'Assessment',
                timestamp: item.submittedAt || new Date(),
              });
            }
          } catch (ptErr) {
            console.warn(`[SubmissionQueue:${this.nodeId}] Point award sync non-fatal error:`, ptErr);
          }
        }
      }

      flushedCount = batch.length;
      this.lastSuccessfulFlush = new Date();
    } catch (batchErr: any) {
      console.error(`[SubmissionQueue:${this.nodeId}] Bulk flush error:`, batchErr);

      // Distinguish between duplicate key (already saved) and actual failures
      for (const item of batch) {
        this.inFlightMap.delete(item.submissionId);

        // If duplicate key error (code 11000), it is already saved in DB!
        if (batchErr.code === 11000) {
          this.confirmedCache.set(item.submissionId, { submissionId: item.submissionId, status: 'saved' });
          flushedCount++;
        } else {
          // Push to failed queue
          const existingFailedIndex = this.failedQueue.findIndex((f) => f.submissionId === item.submissionId);
          if (existingFailedIndex >= 0) {
            this.failedQueue[existingFailedIndex].attempts += 1;
            this.failedQueue[existingFailedIndex].error = batchErr.message || 'BulkWrite Error';
            this.failedQueue[existingFailedIndex].failedAt = new Date();
          } else {
            this.failedQueue.push({
              submissionId: item.submissionId,
              userId: item.userId,
              assessmentId: item.assessmentId,
              error: batchErr.message || 'BulkWrite Error',
              failedAt: new Date(),
              attempts: 1,
              submission: item,
            });
          }
        }
      }
    } finally {
      this.isFlushing = false;
    }

    return {
      flushedCount,
      remainingPending: this.pendingQueue.length,
      failedCount: this.failedQueue.length,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Flushes all pending items repeatedly until the queue is completely drained.
   * Used during graceful shutdown (SIGTERM).
   */
  public async flushAllPending(): Promise<void> {
    while (this.pendingQueue.length > 0) {
      await this.flush();
      if (this.pendingQueue.length > 0) {
        // Small delay between batches to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }

  /**
   * Manual admin action: Retries all failed submissions by returning them to the pending queue.
   */
  public retryFailed(): { retriedCount: number; pendingCount: number } {
    if (this.failedQueue.length === 0) {
      return { retriedCount: 0, pendingCount: this.pendingQueue.length };
    }

    const failedItems = this.failedQueue.splice(0, this.failedQueue.length);
    for (const failed of failedItems) {
      // Re-add to pendingQueue if not already there
      if (!this.pendingQueue.some((p) => p.submissionId === failed.submissionId)) {
        this.pendingQueue.push(failed.submission);
      }
    }

    return {
      retriedCount: failedItems.length,
      pendingCount: this.pendingQueue.length,
    };
  }

  /**
   * Generates a status report for the admin dashboard panel.
   */
  public getQueueStatus(): QueueStatusReport {
    let oldestAgeSec = 0;
    if (this.pendingQueue.length > 0) {
      const oldest = this.pendingQueue[0].enqueuedAt.getTime();
      oldestAgeSec = Math.max(0, Math.floor((Date.now() - oldest) / 1000));
    }

    const pendingCount = this.pendingQueue.length + this.inFlightMap.size;
    const isWarningActive = pendingCount > 0;

    return {
      nodeId: this.nodeId,
      pendingCount,
      oldestPendingAgeSeconds: oldestAgeSec,
      lastSuccessfulFlush: this.lastSuccessfulFlush,
      failedCount: this.failedQueue.length,
      failedItems: this.failedQueue.map((f) => ({
        submissionId: f.submissionId,
        userId: f.userId,
        assessmentId: f.assessmentId,
        error: f.error,
        failedAt: f.failedAt,
        attempts: f.attempts,
      })),
      isFlushing: this.isFlushing,
      isWarningActive,
      warningMessage: isWarningActive
        ? `⚠️ WARNING: ${pendingCount} submission(s) pending durable write in memory. Do not end exam or deploy!`
        : null,
    };
  }

  /**
   * Exports an in-memory JSON backup of everything currently held in process memory.
   */
  public exportBackup(): {
    nodeId: string;
    exportedAt: string;
    pendingCount: number;
    pendingSubmissions: QueuedSubmission[];
    failedCount: number;
    failedSubmissions: FailedSubmissionItem[];
    lastSuccessfulFlush: Date | null;
  } {
    return {
      nodeId: this.nodeId,
      exportedAt: new Date().toISOString(),
      pendingCount: this.pendingQueue.length,
      pendingSubmissions: [...this.pendingQueue],
      failedCount: this.failedQueue.length,
      failedSubmissions: [...this.failedQueue],
      lastSuccessfulFlush: this.lastSuccessfulFlush,
    };
  }

  /**
   * Resets queue state (for testing purposes).
   */
  public clear(): void {
    this.pendingQueue = [];
    this.inFlightMap.clear();
    this.failedQueue = [];
    this.confirmedCache.clear();
    this.isFlushing = false;
    this.lastSuccessfulFlush = null;
  }

  /**
   * Stops the auto-flusher interval timer.
   */
  public stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

export const submissionQueue = new SubmissionQueueService();
export default submissionQueue;
