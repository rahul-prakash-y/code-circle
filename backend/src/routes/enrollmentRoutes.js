const enrollmentController = require('../controllers/enrollmentController');
const verifyToken = require('../middleware/authMiddleware');

async function enrollmentRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyToken);

  fastify.post('/', enrollmentController.enrollInEvent);
  fastify.get('/event/:eventId', enrollmentController.getEventEnrollments);
  fastify.patch('/:eventId/attendance', enrollmentController.updateAttendance);
  fastify.post('/:eventId/generate-certificates', enrollmentController.generateCertificates);
  fastify.get('/my-certificates', enrollmentController.getMyCertificates);
}

module.exports = enrollmentRoutes;
