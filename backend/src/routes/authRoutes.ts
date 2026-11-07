import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/authController';
import * as passwordResetController from '../controllers/passwordResetController';
import { verifyToken, isAdminOrFaculty } from '../middleware/authMiddleware';

export async function authRoutes(fastify: FastifyInstance) {
  // Public registration & unauthenticated flows
  fastify.post('/register', authController.register);
  // Login & forgot-password rely on authLockoutService for identity-based failed attempt limits
  fastify.post('/login', authController.login);
  fastify.post('/forgot-password', authController.forgotPassword);
  fastify.post('/reset-password', authController.resetPassword);

  // Authenticated user flows
  fastify.post('/logout', { preHandler: [verifyToken] }, authController.logout);
  fastify.get('/me', { preHandler: [verifyToken] }, authController.getMe);
  fastify.post('/change-password', { preHandler: [verifyToken] }, authController.changePassword);

  // Administrative lockout release (Faculty / Admin only, audit-logged)
  fastify.post(
    '/unlock-lockout',
    { preHandler: [verifyToken, isAdminOrFaculty] },
    authController.adminUnlockAccountHandler
  );

  // User password reset request flow
  fastify.post('/request-reset', passwordResetController.requestPasswordReset);
  fastify.get('/reset-status', passwordResetController.checkUserResetStatus);
}

export default authRoutes;
