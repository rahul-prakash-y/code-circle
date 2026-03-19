const { getMe, updateMe } = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');

async function userRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyToken);

  fastify.get('/me', getMe);
  fastify.put('/me', updateMe);
}

module.exports = userRoutes;
