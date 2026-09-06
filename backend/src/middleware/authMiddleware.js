const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const JWT_SECRET = process.env.JWT_SECRET || 'stellar-minimalist-secret-key-2026';

const verifyToken = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, JWT_SECRET);

    // Fetch user and verify session + block status
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return reply.status(401).send({ error: 'User no longer exists' });
    }

    if (user.isBlocked) {
      return reply.status(403).send({ error: 'Your account has been blocked' });
    }

    // Single-device login check
    if (decodedToken.sessionId && user.activeSessionId !== decodedToken.sessionId) {
      return reply.status(401).send({ error: 'Session expired. Someone else logged in from another device.' });
    }

    // Attach fully populated, sanitized user so downstream controllers do not need to re-query User collection
    request.user = {
      _id: user._id,
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      rollNo: user.rollNo,
      department: user.department || '',
      skills: user.skills || [],
      socialLinks: user.socialLinks || {},
      profilePicUrl: user.profilePicUrl || ''
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return reply.status(401).send({ error: 'Token expired' });
    }
    return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
  }
};

const requireRole = (...allowedRoles) => async (request, reply) => {
  if (!request.user || !allowedRoles.includes(request.user.role)) {
    return reply.status(403).send({ 
      error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role` 
    });
  }
};

const isAdmin = requireRole('Admin');
const isAdminOrFaculty = requireRole('Admin', 'Faculty', 'Committee');

module.exports = { verifyToken, requireRole, isAdmin, isAdminOrFaculty };
