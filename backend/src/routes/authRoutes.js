const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

async function authRoutes(fastify, options) {
  fastify.post('/register', authController.register);
  fastify.post('/login', authController.login);
  fastify.post('/logout', { preHandler: [verifyToken] }, authController.logout);
  fastify.get('/me', { preHandler: [verifyToken] }, authController.getMe);
  fastify.post('/forgot-password', authController.forgotPassword);
  fastify.post('/reset-password', authController.resetPassword);
  fastify.post('/change-password', { preHandler: [verifyToken] }, authController.changePassword);
}

module.exports = authRoutes;
