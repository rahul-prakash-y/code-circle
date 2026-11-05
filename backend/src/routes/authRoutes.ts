import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/authController';
import * as passwordResetController from '../controllers/passwordResetController';
import { verifyToken } from '../middleware/authMiddleware';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', authController.register);
  fastify.post('/login', authController.login);
  fastify.post('/logout', { preHandler: [verifyToken] }, authController.logout);
  fastify.get('/me', { preHandler: [verifyToken] }, authController.getMe);
  fastify.post('/forgot-password', authController.forgotPassword);
  fastify.post('/reset-password', authController.resetPassword);
  fastify.post('/change-password', { preHandler: [verifyToken] }, authController.changePassword);

  // User password reset request flow
  fastify.post('/request-reset', passwordResetController.requestPasswordReset);
  fastify.get('/reset-status', passwordResetController.checkUserResetStatus);
}

export default authRoutes;
