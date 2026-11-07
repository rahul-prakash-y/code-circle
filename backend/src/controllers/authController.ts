import { FastifyRequest, FastifyReply } from 'fastify';
import User, { IUser } from '../models/userModel';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getJwtSecret } from '../middleware/authMiddleware';
import authLockoutService from '../services/authLockoutService';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

export const sanitizeUser = (userDoc: any) => {
  if (!userDoc) return null;
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

export const register = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { name, email, rollNo, password, department } = request.body as any;

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof rollNo !== 'string' ||
      typeof password !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !rollNo.trim() ||
      !password
    ) {
      return reply.status(400).send({
        success: false,
        error: 'Name, email, rollNo, and password are required',
      });
    }

    if (password.length < 6) {
      return reply.status(400).send({
        success: false,
        error: 'Password must be at least 6 characters in length',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRollNo = rollNo.toUpperCase().trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { rollNo: normalizedRollNo }],
    });

    if (existingUser) {
      return reply.status(400).send({
        success: false,
        error: 'User with this email or roll number already exists',
      });
    }

    const sessionId = crypto.randomUUID();

    // Standard public registrations are assigned the Student role
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      rollNo: normalizedRollNo,
      password, // Pre-save hook will hash this
      role: 'Student',
      department: department?.trim() || '',
      activeSessionId: sessionId,
      mustChangePassword: false,
    });

    await user.save();

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        sessionId,
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return reply.status(201).send({
      success: true,
      message: 'Account created successfully',
      user: sanitizeUser(user),
      token,
      sessionId,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Registration failed' });
  }
};

export const login = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { identifier, password } = (request.body || {}) as any;

    if (
      !identifier ||
      !password ||
      typeof identifier !== 'string' ||
      typeof password !== 'string' ||
      !identifier.trim()
    ) {
      return reply.status(400).send({
        success: false,
        error: 'Email or Roll Number and password are required',
      });
    }

    const trimmedIdentifier = identifier.trim();
    const normalizedIdentifier = trimmedIdentifier.toLowerCase();

    // Check shared MongoDB lockout status across cluster nodes
    const lockoutStatus = await authLockoutService.checkLockout(normalizedIdentifier, request.ip);
    if (lockoutStatus.isLocked) {
      reply.header('Retry-After', String(lockoutStatus.retryAfterSeconds));
      return reply.status(429).send({
        success: false,
        code: 'ACCOUNT_LOCKED',
        error: lockoutStatus.message,
        retryAfter: lockoutStatus.retryAfterSeconds,
      });
    }

    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier },
        { rollNo: trimmedIdentifier.toUpperCase() },
      ],
    });

    if (!user) {
      await authLockoutService.recordFailedAttempt(normalizedIdentifier, request.ip);
      return reply.status(401).send({ success: false, error: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return reply.status(403).send({
        success: false,
        error: 'Your account has been blocked by an administrator',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await authLockoutService.recordFailedAttempt(normalizedIdentifier, request.ip);
      return reply.status(401).send({ success: false, error: 'Invalid credentials' });
    }

    // Success: Clear any failed login attempt tracking
    await authLockoutService.clearLockout(normalizedIdentifier);

    // Generate fresh session ID to invalidate previous sessions on other devices
    const sessionId = crypto.randomUUID();
    user.activeSessionId = sessionId;
    await user.save();

    const requirePasswordChange = Boolean(user.mustChangePassword);

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        sessionId,
        requirePasswordChange,
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return reply.send({
      success: true,
      message: 'Logged in successfully',
      user: sanitizeUser(user),
      token,
      sessionId,
      requirePasswordChange,
      mustChangePassword: requirePasswordChange,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Login failed' });
  }
};

export const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    if (request.user?.email) {
      await User.findOneAndUpdate(
        { email: request.user.email },
        { activeSessionId: null }
      );
    }
    return reply.send({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Logout failed' });
  }
};

export const getMe = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!request.user?.id) {
      return reply.status(401).send({ success: false, error: 'Authentication required' });
    }
    const user = await User.findById(request.user.id).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return reply.status(404).send({ success: false, error: 'User profile not found' });
    }
    return reply.send(sanitizeUser(user));
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch user profile' });
  }
};

export const forgotPassword = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { identifier } = (request.body || {}) as any;
    if (identifier && typeof identifier === 'string' && identifier.trim()) {
      const normalizedIdentifier = identifier.trim().toLowerCase();
      const lockoutStatus = await authLockoutService.checkLockout(normalizedIdentifier, request.ip);
      if (lockoutStatus.isLocked) {
        reply.header('Retry-After', String(lockoutStatus.retryAfterSeconds));
        return reply.status(429).send({
          success: false,
          code: 'ACCOUNT_LOCKED',
          error: lockoutStatus.message,
          retryAfter: lockoutStatus.retryAfterSeconds,
        });
      }
    }

    return reply.send({
      success: true,
      message: 'Password reset links cannot be self-generated. Please contact your club administrator to receive a secure temporary password.',
      contactAdmin: true,
      adminEmail: 'codecircle@bitsathy.ac.in',
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to process request' });
  }
};

/**
 * Admin / Faculty endpoint to manually clear account lockout
 * Audit-logged in MongoDB.
 */
export const adminUnlockAccountHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const caller = request.user;
    if (!caller) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { identifier } = (request.body || {}) as any;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return reply.status(400).send({ success: false, error: 'User identifier is required' });
    }

    const result = await authLockoutService.adminUnlockAccount(identifier, {
      id: caller.id,
      email: caller.email,
      role: caller.role,
    });

    return reply.status(200).send(result);
  } catch (err: any) {
    request.log.error(err);
    return reply.status(500).send({ success: false, error: err.message || 'Failed to clear lockout' });
  }
};

export const resetPassword = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { token, newPassword } = (request.body || {}) as any;

    if (!token || !newPassword) {
      return reply.status(400).send({
        success: false,
        error: 'Reset token and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return reply.status(400).send({
        success: false,
        error: 'Password must be at least 6 characters in length',
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid or expired password reset link. Please request a new one.',
      });
    }

    user.password = newPassword; // Pre-save hook will hash it
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.activeSessionId = null; // Invalidate all active sessions
    user.mustChangePassword = false;
    await user.save();

    // Mark corresponding password reset request as redeemed
    try {
      const PasswordResetRequest = (await import('../models/passwordResetRequestModel')).default;
      await PasswordResetRequest.findOneAndUpdate(
        { resetToken: token },
        { isUsed: true, usedAt: new Date() }
      );
    } catch {
      // Non-blocking
    }

    return reply.send({
      success: true,
      message: 'Your password has been reset successfully. Please log in with your new credentials.',
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Password reset failed' });
  }
};

export const changePassword = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { currentPassword, newPassword } = (request.body || {}) as any;

    if (!currentPassword || !newPassword) {
      return reply.status(400).send({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return reply.status(400).send({
        success: false,
        error: 'New password must be at least 6 characters',
      });
    }

    if (currentPassword === newPassword) {
      return reply.status(400).send({
        success: false,
        error: 'New password must be different from the current password',
      });
    }

    const user = await User.findById(request.user?.id);
    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return reply.status(401).send({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword; // Pre-save hook will hash it
    user.mustChangePassword = false;
    await user.save();

    return reply.send({
      success: true,
      message: 'Password changed successfully',
      requirePasswordChange: false,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to change password' });
  }
};

export default {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  sanitizeUser,
};
