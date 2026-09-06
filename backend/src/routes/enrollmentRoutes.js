const enrollmentController = require('../controllers/enrollmentController');
const { verifyToken, isAdminOrFaculty } = require('../middleware/authMiddleware');

async function enrollmentRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyToken);

  fastify.post('/', enrollmentController.enrollInEvent);
  fastify.get('/my-certificates', enrollmentController.getMyCertificates);

  // Admin / Faculty privileged routes
  fastify.get('/event/:eventId', { preHandler: [isAdminOrFaculty] }, enrollmentController.getEventEnrollments);
  fastify.patch('/:eventId/attendance', { preHandler: [isAdminOrFaculty] }, enrollmentController.updateAttendance);
  fastify.post('/:eventId/generate-certificates', { preHandler: [isAdminOrFaculty] }, enrollmentController.generateCertificates);
}

module.exports = enrollmentRoutes;
