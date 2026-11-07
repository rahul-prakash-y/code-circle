import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/authController';
import * as passwordResetController from '../controllers/passwordResetController';
import { verifyToken } from '../middleware/authMiddleware';

const authRateLimitConfig = {
  rateLimit: {
    max: 10,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please wait 1 minute before trying again.',
    }),
  },
};

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', { config: authRateLimitConfig }, authController.register);
  fastify.post('/login', { config: authRateLimitConfig }, authController.login);
  fastify.post('/logout', { preHandler: [verifyToken] }, authController.logout);
  fastify.get('/me', { preHandler: [verifyToken] }, authController.getMe);
  fastify.post('/forgot-password', { config: authRateLimitConfig }, authController.forgotPassword);
  fastify.post('/reset-password', { config: authRateLimitConfig }, authController.resetPassword);
  fastify.post('/change-password', { preHandler: [verifyToken] }, authController.changePassword);

  // User password reset request flow
  fastify.post('/request-reset', { config: authRateLimitConfig }, passwordResetController.requestPasswordReset);
  fastify.get('/reset-status', passwordResetController.checkUserResetStatus);
}

export default authRoutes;
