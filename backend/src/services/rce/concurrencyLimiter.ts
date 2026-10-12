/**
 * Lightweight in-memory concurrency limiter and queue for external RCE calls.
 * Ensures the Fastify server remains responsive and does not overwhelm
 * external sandboxed execution providers or exhaust network sockets.
 */
export class ConcurrencyLimiter {
  private activeCount: number = 0;
  private readonly maxConcurrency: number;
  private readonly queue: Array<() => void> = [];
  private readonly maxQueueSize: number;

  constructor(maxConcurrency = 5, maxQueueSize = 50) {
    this.maxConcurrency = maxConcurrency;
    this.maxQueueSize = maxQueueSize;
  }

  public async acquire(): Promise<void> {
    if (this.activeCount < this.maxConcurrency) {
      this.activeCount++;
      return;
    }

    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('RCE service is currently at maximum capacity. Please retry in a few seconds.');
    }

    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.activeCount++;
        resolve();
      });
    });
  }

  public release(): void {
    this.activeCount = Math.max(0, this.activeCount - 1);
    if (this.queue.length > 0 && this.activeCount < this.maxConcurrency) {
      const next = this.queue.shift();
      if (next) {
        next();
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
    };
  }
}

export const globalRceLimiter = new ConcurrencyLimiter(
  Number(process.env.MAX_CONCURRENT_RCE) || 5,
  Number(process.env.MAX_RCE_QUEUE_SIZE) || 50
);
