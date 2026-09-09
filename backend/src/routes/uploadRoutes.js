const { uploadProfilePic, uploadCertificateTemplate } = require('../controllers/uploadController');
const { verifyToken, isAdminOrFaculty } = require('../middleware/authMiddleware');

async function uploadRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyToken);

  fastify.post('/profile-pic', uploadProfilePic);
  fastify.post('/certificate-template', { preHandler: [isAdminOrFaculty] }, uploadCertificateTemplate);
}

module.exports = uploadRoutes;
