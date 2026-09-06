import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import { UserRole, UserPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'stellar-minimalist-secret-key-2026';

export const verifyToken = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ success: false, error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await User.findById(decoded.id);
    if (!user) {
      return reply.status(401).send({ success: false, error: 'User no longer exists' });
    }

    if (user.isBlocked) {
      return reply.status(403).send({ success: false, error: 'Your account has been blocked by an administrator' });
    }

    // Single-device login check
    if (decoded.sessionId && user.activeSessionId && user.activeSessionId !== decoded.sessionId) {
      return reply.status(401).send({ success: false, error: 'Session expired. Another login was detected on your account.' });
    }

    request.user = {
      id: user._id.toString(),
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      rollNo: user.rollNo,
      department: user.department || '',
      sessionId: decoded.sessionId,
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return reply.status(401).send({ success: false, error: 'Token expired. Please log in again.' });
    }
    return reply.status(401).send({ success: false, error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Role-based access control middleware with hierarchy support:
 * SuperAdmin has universal clearance.
 * Admin has admin, faculty, and student clearance.
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: 'Authentication required' });
    }

    const userRole = request.user.role;

    // SuperAdmin has unconditional clearance for all role checks
    if (userRole === 'SuperAdmin') {
      return;
    }

    // Admin has access to standard admin and lower role operations
    if (userRole === 'Admin') {
      if (allowedRoles.includes('Admin') || allowedRoles.includes('Student') || allowedRoles.includes('Member') || allowedRoles.includes('Faculty')) {
        return;
      }
    }

    // Direct match check
    if (allowedRoles.includes(userRole)) {
      return;
    }

    return reply.status(403).send({
      success: false,
      error: `Forbidden: Requires elevated [${allowedRoles.join(', ')}] role`,
    });
  };
};

export const requireAdmin = requireRole('Admin');
export const requireSuperAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.status(401).send({ success: false, error: 'Authentication required' });
  }
  if (request.user.role !== 'SuperAdmin') {
    return reply.status(403).send({
      success: false,
      error: 'Forbidden: SuperAdmin privileges required for this operation',
    });
  }
};
export const isAdminOrFaculty = requireRole('Admin', 'Faculty', 'Committee');

export default {
  verifyToken,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  isAdminOrFaculty,
};
