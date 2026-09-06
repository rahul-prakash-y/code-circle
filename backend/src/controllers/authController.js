const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'stellar-minimalist-secret-key-2026';

// Helper to sanitize user object and omit sensitive credentials
const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  return user;
};

const register = async (request, reply) => {
  try {
    const { name, email, rollNo, password, role, department } = request.body;

    if (!name || !email || !rollNo || !password) {
      return reply.status(400).send({ error: 'Name, email, rollNo, and password are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { rollNo }] });
    if (existingUser) {
      return reply.status(400).send({ error: 'User with this email or roll number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sessionId = crypto.randomUUID();

    const user = await User.create({
      name,
      email,
      rollNo,
      password: hashedPassword,
      role: role || 'Member',
      department: department || '',
      activeSessionId: sessionId
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, sessionId }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return reply.status(201).send({ 
      user: sanitizeUser(user), 
      token, 
      sessionId 
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Registration failed' });
  }
};

const login = async (request, reply) => {
  try {
    const { identifier, password } = request.body; // identifier can be email or rollNo

    if (!identifier || !password) {
      return reply.status(400).send({ error: 'Email/Roll Number and password are required' });
    }

    const user = await User.findOne({ 
      $or: [{ email: identifier }, { rollNo: identifier }] 
    });

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return reply.status(403).send({ error: 'Your account has been blocked by an administrator' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // Generate a fresh session ID. Overriding activeSessionId invalidates any previously open tab/device
    // while preventing permanent student lockouts.
    const sessionId = crypto.randomUUID();
    user.activeSessionId = sessionId;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, sessionId }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return reply.send({ 
      user: sanitizeUser(user), 
      token, 
      sessionId 
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Login failed' });
  }
};

const logout = async (request, reply) => {
  try {
    const { email } = request.user;
    await User.findOneAndUpdate({ email }, { activeSessionId: null });
    return reply.send({ message: 'Logged out successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Logout failed' });
  }
};

const getMe = async (request, reply) => {
  try {
    // request.user is already validated and hydrated by verifyToken middleware
    return reply.send(request.user);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch user' });
  }
};

module.exports = { register, login, logout, getMe, sanitizeUser };
