const { getMe, updateMe, getEventPassport } = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');

async function userRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyToken);

  fastify.get('/me', getMe);
  fastify.put('/me', updateMe);
  fastify.get('/passport', getEventPassport);
}

module.exports = userRoutes;
