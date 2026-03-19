const { uploadProfilePic } = require('../controllers/uploadController');
const verifyToken = require('../middleware/authMiddleware');

async function uploadRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyToken);

  fastify.post('/profile-pic', uploadProfilePic);
}

module.exports = uploadRoutes;
