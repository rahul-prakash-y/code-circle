import { FastifyRequest, FastifyReply } from 'fastify';
import User, { IUser } from '../models/userModel';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'stellar-minimalist-secret-key-2026';
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

    if (!name || !email || !rollNo || !password) {
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
    });

    await user.save();

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        sessionId,
      },
      JWT_SECRET,
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

    if (!identifier || !password) {
      return reply.status(400).send({
        success: false,
        error: 'Email or Roll Number and password are required',
      });
    }

    const trimmedIdentifier = identifier.trim();

    const user = await User.findOne({
      $or: [
        { email: trimmedIdentifier.toLowerCase() },
        { rollNo: trimmedIdentifier.toUpperCase() },
      ],
    });

    if (!user) {
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
      return reply.status(401).send({ success: false, error: 'Invalid credentials' });
    }

    // Generate fresh session ID to invalidate previous sessions on other devices
    const sessionId = crypto.randomUUID();
    user.activeSessionId = sessionId;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        sessionId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return reply.send({
      success: true,
      message: 'Logged in successfully',
      user: sanitizeUser(user),
      token,
      sessionId,
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
    const { email } = (request.body || {}) as any;

    if (!email) {
      return reply.status(400).send({ success: false, error: 'Email address is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return success without disclosing user existence for security
      return reply.send({
        success: true,
        message: 'If an account exists with this email, a password reset link has been dispatched.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour expiration
    await user.save();

    const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    return reply.send({
      success: true,
      message: 'Password reset link generated successfully',
      resetLink,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to process password reset request' });
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
    await user.save();

    return reply.send({
      success: true,
      message: 'Your password has been reset successfully. Please log in with your new credentials.',
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Password reset failed' });
  }
};

export default {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  sanitizeUser,
};
