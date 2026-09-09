const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'stellar-minimalist-secret-key-2026';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

const register = async (request, reply) => {
  try {
    const { name, email, rollNo, password, department } = request.body || {};

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

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      rollNo: normalizedRollNo,
      password,
      role: 'Student',
      department: department ? department.trim() : '',
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
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Registration failed' });
  }
};

const login = async (request, reply) => {
  try {
    const { identifier, password } = request.body || {};

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
      mustChangePassword: user.mustChangePassword || false,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Login failed' });
  }
};

const logout = async (request, reply) => {
  try {
    if (request.user && request.user.email) {
      await User.findOneAndUpdate(
        { email: request.user.email },
        { activeSessionId: null }
      );
    }
    return reply.send({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Logout failed' });
  }
};

const getMe = async (request, reply) => {
  try {
    if (!request.user || !request.user.id) {
      return reply.status(401).send({ success: false, error: 'Authentication required' });
    }
    const user = await User.findById(request.user.id).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return reply.status(404).send({ success: false, error: 'User profile not found' });
    }
    return reply.send(sanitizeUser(user));
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch user profile' });
  }
};

const forgotPassword = async (request, reply) => {
  try {
    const { email } = request.body || {};

    return reply.send({
      success: true,
      message: 'Password reset links cannot be self-generated. Please contact your club administrator to receive a secure temporary password.',
      contactAdmin: true,
      adminEmail: 'codecircle@bitsathy.ac.in',
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to process request' });
  }
};

const resetPassword = async (request, reply) => {
  try {
    const { token, newPassword } = request.body || {};

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

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.activeSessionId = null;
    await user.save();

    return reply.send({
      success: true,
      message: 'Your password has been reset successfully. Please log in with your new credentials.',
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Password reset failed' });
  }
};

const changePassword = async (request, reply) => {
  try {
    const { currentPassword, newPassword } = request.body || {};

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

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    return reply.send({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to change password' });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  sanitizeUser,
};
