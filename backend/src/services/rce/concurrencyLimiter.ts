/**
 * Lightweight in-memory concurrency limiter, bounded FIFO queue, and per-user execution locks.
 * Ensures Fastify remains responsive, prevents provider socket exhaustion, and blocks single-user monopoly.
 */

interface QueueEntry {
  resolve: () => void;
  reject: (err: any) => void;
  timeoutId: NodeJS.Timeout;
}

export class ConcurrencyLimiter {
  private activeCount: number = 0;
  private readonly maxConcurrency: number;
  private readonly queue: QueueEntry[] = [];
  private readonly maxQueueSize: number;
  private readonly maxWaitMs: number;

  constructor(maxConcurrency = 5, maxQueueSize = 50, maxWaitMs = 30000) {
    this.maxConcurrency = maxConcurrency;
    this.maxQueueSize = maxQueueSize;
    this.maxWaitMs = maxWaitMs;
  }

  public async acquire(): Promise<void> {
    if (this.activeCount < this.maxConcurrency) {
      this.activeCount++;
      return;
    }

    if (this.queue.length >= this.maxQueueSize) {
      const err: any = new Error('Execution capacity saturated. Please retry shortly.');
      err.statusCode = 503;
      err.retryAfter = 5;
      throw err;
    }

    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const idx = this.queue.findIndex((entry) => entry.timeoutId === timeoutId);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
        }
        const waitErr: any = new Error('Execution queue wait limit exceeded (30s). System is under heavy load.');
        waitErr.statusCode = 503;
        waitErr.retryAfter = 5;
        reject(waitErr);
      }, this.maxWaitMs);

      this.queue.push({
        resolve: () => {
          clearTimeout(timeoutId);
          this.activeCount++;
          resolve();
        },
        reject,
        timeoutId,
      });
    });
  }

  public release(): void {
    this.activeCount = Math.max(0, this.activeCount - 1);
    if (this.queue.length > 0 && this.activeCount < this.maxConcurrency) {
      const next = this.queue.shift();
      if (next) {
        next.resolve();
      }
    }
  }

  public async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await task();
    } finally {
      this.release();
    }
  }

  public getStats() {
    return {
      active: this.activeCount,
      queued: this.queue.length,
      maxConcurrency: this.maxConcurrency,
      maxQueueSize: this.maxQueueSize,
      isBusy: this.activeCount >= this.maxConcurrency,
    };
  }

  public clearQueue(): void {
    for (const item of this.queue) {
      clearTimeout(item.timeoutId);
    }
    this.queue.length = 0;
    this.activeCount = 0;
  }
}

export const globalRceLimiter = new ConcurrencyLimiter(
  Number(process.env.MAX_CONCURRENT_RCE) || 5,
  Number(process.env.MAX_RCE_QUEUE_SIZE) || 50,
  Number(process.env.MAX_RCE_WAIT_MS) || 30000
);

/**
 * Per-User In-Flight Execution Lock Manager
 * Enforces maximum 1 simultaneous execution per user across Run Code and Submit.
 */
interface UserLockRecord {
  timeoutId: NodeJS.Timeout;
  acquiredAt: number;
}

export class UserExecutionLockManager {
  private activeLocks = new Map<string, UserLockRecord>();
  private readonly autoReleaseTimeoutMs: number;

  constructor(autoReleaseTimeoutMs = 35000) {
    this.autoReleaseTimeoutMs = autoReleaseTimeoutMs;
  }

  public acquire(userId: string): void {
    if (this.activeLocks.has(userId)) {
      const err: any = new Error('An execution is already in progress for your account. Please wait for it to complete.');
      err.statusCode = 429;
      throw err;
    }

    const timeoutId = setTimeout(() => {
      console.warn(`[UserExecutionLock] Auto-releasing hung execution lock for user ${userId}`);
      this.activeLocks.delete(userId);
    }, this.autoReleaseTimeoutMs);

    this.activeLocks.set(userId, { timeoutId, acquiredAt: Date.now() });
  }

  public release(userId: string): void {
    const record = this.activeLocks.get(userId);
    if (record) {
      clearTimeout(record.timeoutId);
      this.activeLocks.delete(userId);
    }
  }

  public isLocked(userId: string): boolean {
    return this.activeLocks.has(userId);
  }

  public clearAll(): void {
    for (const record of this.activeLocks.values()) {
      clearTimeout(record.timeoutId);
    }
    this.activeLocks.clear();
  }
}

export const globalUserExecutionLocks = new UserExecutionLockManager();
export default globalRceLimiter;
