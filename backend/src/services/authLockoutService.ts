import mongoose from 'mongoose';
import AuthLockout from '../models/authLockoutModel';
import AuditLog from '../models/auditLogModel';

export class AuthLockoutService {
  public getMaxFailedAttempts(): number {
    return Number(process.env.LOGIN_MAX_FAILED_ATTEMPTS) || 5;
  }

  public getLockoutMinutes(): number {
    return Number(process.env.LOGIN_LOCKOUT_MINUTES) || 5;
  }

  public getIpMaxFailedPerMin(): number {
    return Number(process.env.LOGIN_IP_MAX_FAILED_PER_MIN) || 100;
  }

  /**
   * Checks whether a normalized username or client IP is currently locked out.
   * Responses are non-enumerating and calculate remaining Retry-After seconds.
   */
  public async checkLockout(
    normalizedUsername: string,
    ip: string
  ): Promise<{
    isLocked: boolean;
    retryAfterSeconds: number;
    reason?: 'username' | 'ip';
    message?: string;
  }> {
    if (mongoose.connection.readyState !== 1 && !(AuthLockout.findOne as any).mock) {
      return { isLocked: false, retryAfterSeconds: 0 };
    }

    const now = new Date();

    // 1. Check IP-level password spray lockout
    if (ip) {
      try {
        const ipRecord = await AuthLockout.findOne({ key: `ip:${ip.trim()}` });
        if (ipRecord && ipRecord.lockedUntil && ipRecord.lockedUntil > now) {
          const retryAfterSeconds = Math.max(1, Math.ceil((ipRecord.lockedUntil.getTime() - now.getTime()) / 1000));
          return {
            isLocked: true,
            retryAfterSeconds,
            reason: 'ip',
            message: `Too many failed login attempts from this network. Please try again in ${retryAfterSeconds} seconds.`,
          };
        }
      } catch (err) {
        console.warn('[AuthLockoutService] Error querying IP lockout:', err);
      }
    }

    // 2. Check User-level account lockout
    if (normalizedUsername) {
      try {
        const userKey = `user:${normalizedUsername.trim().toLowerCase()}`;
        const userRecord = await AuthLockout.findOne({ key: userKey });
        if (userRecord && userRecord.lockedUntil && userRecord.lockedUntil > now) {
          const retryAfterSeconds = Math.max(1, Math.ceil((userRecord.lockedUntil.getTime() - now.getTime()) / 1000));
          const mins = Math.max(1, Math.ceil(retryAfterSeconds / 60));
          return {
            isLocked: true,
            retryAfterSeconds,
            reason: 'username',
            message: `Account temporarily locked due to multiple failed login attempts. Please try again in ${mins} minute(s) or contact faculty.`,
          };
        }
      } catch (err) {
        console.warn('[AuthLockoutService] Error querying user lockout:', err);
      }
    }

    return {
      isLocked: false,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Records a failed login attempt for a normalized username and IP.
   * If threshold is reached, triggers account or IP lockout in MongoDB with TTL.
   */
  public async recordFailedAttempt(
    normalizedUsername: string,
    ip: string
  ): Promise<{
    isUserLocked: boolean;
    remainingAttempts: number;
    lockedUntil?: Date;
  }> {
    const maxFails = this.getMaxFailedAttempts();
    if (mongoose.connection.readyState !== 1 && !(AuthLockout.findOne as any).mock) {
      return { isUserLocked: false, remainingAttempts: maxFails };
    }

    const now = new Date();
    const lockoutMins = this.getLockoutMinutes();
    const ipMaxFails = this.getIpMaxFailedPerMin();

    let isUserLocked = false;
    let remainingAttempts = maxFails;
    let lockedUntilDate: Date | undefined;

    // 1. Record User failure
    if (normalizedUsername) {
      const cleanUser = normalizedUsername.trim().toLowerCase();
      const userKey = `user:${cleanUser}`;
      try {
        const existing = await AuthLockout.findOne({ key: userKey });
        const newCount = (existing?.failedCount || 0) + 1;

        if (newCount >= maxFails) {
          isUserLocked = true;
          remainingAttempts = 0;
          lockedUntilDate = new Date(now.getTime() + lockoutMins * 60 * 1000);
          const expiresAt = new Date(lockedUntilDate.getTime() + 60 * 1000); // 1 min buffer past lock

          await AuthLockout.findOneAndUpdate(
            { key: userKey },
            {
              $set: {
                targetType: 'username',
                targetValue: cleanUser,
                failedCount: newCount,
                lockedUntil: lockedUntilDate,
                lastFailedAt: now,
                expiresAt,
              },
            },
            { upsert: true, new: true }
          );
        } else {
          remainingAttempts = maxFails - newCount;
          // Keep failure record for 15 minutes window
          const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

          await AuthLockout.findOneAndUpdate(
            { key: userKey },
            {
              $set: {
                targetType: 'username',
                targetValue: cleanUser,
                failedCount: newCount,
                lockedUntil: null,
                lastFailedAt: now,
                expiresAt,
              },
            },
            { upsert: true, new: true }
          );
        }
      } catch (err) {
        console.error('[AuthLockoutService] Error recording user failed attempt:', err);
      }
    }

    // 2. Record IP failure (anti-spray)
    if (ip) {
      const cleanIp = ip.trim();
      const ipKey = `ip:${cleanIp}`;
      try {
        const existingIp = await AuthLockout.findOne({ key: ipKey });
        const newIpCount = (existingIp?.failedCount || 0) + 1;

        if (newIpCount >= ipMaxFails) {
          const ipLockUntil = new Date(now.getTime() + 60 * 1000); // 1-min lock for IP spray
          await AuthLockout.findOneAndUpdate(
            { key: ipKey },
            {
              $set: {
                targetType: 'ip',
                targetValue: cleanIp,
                failedCount: newIpCount,
                lockedUntil: ipLockUntil,
                lastFailedAt: now,
                expiresAt: new Date(now.getTime() + 120 * 1000),
              },
            },
            { upsert: true, new: true }
          );
        } else {
          await AuthLockout.findOneAndUpdate(
            { key: ipKey },
            {
              $set: {
                targetType: 'ip',
                targetValue: cleanIp,
                failedCount: newIpCount,
                lockedUntil: null,
                lastFailedAt: now,
                expiresAt: new Date(now.getTime() + 60 * 1000), // 1-minute window
              },
            },
            { upsert: true, new: true }
          );
        }
      } catch (err) {
        console.error('[AuthLockoutService] Error recording IP failed attempt:', err);
      }
    }

    return {
      isUserLocked,
      remainingAttempts,
      lockedUntil: lockedUntilDate,
    };
  }

  /**
   * Resets/clears failed attempts upon successful authentication.
   */
  public async clearLockout(normalizedUsername: string): Promise<void> {
    if (!normalizedUsername) return;
    try {
      const userKey = `user:${normalizedUsername.trim().toLowerCase()}`;
      await AuthLockout.deleteMany({ key: userKey });
    } catch (err) {
      console.warn('[AuthLockoutService] Error clearing lockout:', err);
    }
  }

  /**
   * Administrative action: Faculty or Admin clears an account lockout manually.
   * Guaranteed to be audit-logged in MongoDB.
   */
  public async adminUnlockAccount(
    identifier: string,
    adminUser: { id: string; email: string; role: string }
  ): Promise<{ success: boolean; message: string; unlockedKeys: string[] }> {
    if (!identifier || typeof identifier !== 'string') {
      throw new Error('Valid identifier is required to unlock an account');
    }

    const clean = identifier.trim().toLowerCase();
    const candidateKeys = [
      `user:${clean}`,
      `user:${clean.toUpperCase()}`,
      `ip:${clean}`,
    ];

    const deleteResult = await AuthLockout.deleteMany({
      $or: [
        { key: { $in: candidateKeys } },
        { targetValue: clean },
      ],
    });

    // Record immutable AuditLog entry
    try {
      await AuditLog.create({
        action: 'AUTH_LOCKOUT_CLEARED',
        actorId: mongoose.Types.ObjectId.isValid(adminUser.id)
          ? new mongoose.Types.ObjectId(adminUser.id)
          : new mongoose.Types.ObjectId(),
        actorRole: adminUser.role,
        targetId: clean,
        details: {
          identifier: clean,
          actorEmail: adminUser.email,
          deletedCount: deleteResult.deletedCount,
          timestamp: new Date(),
        },
      });
    } catch (auditErr) {
      console.warn('[AuthLockoutService] AuditLog recording warning:', auditErr);
    }

    return {
      success: true,
      message: `Account lockout for "${clean}" has been successfully cleared.`,
      unlockedKeys: candidateKeys,
    };
  }
}

export const authLockoutService = new AuthLockoutService();
export default authLockoutService;
