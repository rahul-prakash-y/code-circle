const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'stellar-minimalist-secret-key-2026';

const register = async (request, reply) => {
  try {
    const { name, email, rollNo, password, role, department } = request.body;

    const existingUser = await User.findOne({ $or: [{ email }, { rollNo }] });
    if (existingUser) {
      return reply.status(400).send({ error: 'User with this email or roll number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      rollNo,
      password: hashedPassword,
      role: role || 'Student',
      department
    });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    // Set active session
    const sessionId = uuidv4();
    user.activeSessionId = sessionId;
    await user.save();

    return reply.status(201).send({ user, token, sessionId });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Registration failed' });
  }
};

const login = async (request, reply) => {
  try {
    const { identifier, password } = request.body; // identifier can be email or rollNo

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

    // Single-device login check (Exclusive for non-admins)
    if (user.activeSessionId && user.role !== 'Admin') {
      return reply.status(401).send({ error: 'You are already logged in on another device' });
    }

    // Generate new session ID
    const sessionId = uuidv4();
    user.activeSessionId = sessionId;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, sessionId }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return reply.send({ user, token, sessionId });
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
    const { email } = request.user;
    const user = await User.findOne({ email }).select('-password');
    return reply.send(user);
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to fetch user' });
  }
};

module.exports = { register, login, logout, getMe };
