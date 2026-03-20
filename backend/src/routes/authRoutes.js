const authController = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

async function authRoutes(fastify, options) {
  fastify.post('/register', authController.register);
  fastify.post('/login', authController.login);
  fastify.post('/logout', { preHandler: [verifyToken] }, authController.logout);
  fastify.get('/me', { preHandler: [verifyToken] }, authController.getMe);
}

module.exports = authRoutes;
