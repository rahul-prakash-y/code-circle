const enrollmentController = require('../controllers/enrollmentController');
const { verifyToken, isAdminOrFaculty } = require('../middleware/authMiddleware');

async function enrollmentRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyToken);

  fastify.post('/', enrollmentController.enrollInEvent);
  fastify.get('/my-certificates', enrollmentController.getMyCertificates);

  // Admin / Faculty privileged routes
  fastify.get('/event/:eventId', { preHandler: [isAdminOrFaculty] }, enrollmentController.getEventEnrollments);
  fastify.get('/event/:eventId/participants', { preHandler: [isAdminOrFaculty] }, enrollmentController.getEventParticipants);
  fastify.get('/event/:eventId/registered', { preHandler: [isAdminOrFaculty] }, enrollmentController.getEventRegistered);
  fastify.patch('/:eventId/attendance', { preHandler: [isAdminOrFaculty] }, enrollmentController.updateAttendance);
  fastify.post('/:eventId/generate-certificates', { preHandler: [isAdminOrFaculty] }, enrollmentController.generateCertificates);
  fastify.post('/event/:eventId/bulk-upload', { preHandler: [isAdminOrFaculty] }, enrollmentController.bulkUploadEventParticipants);
  fastify.post('/event/:eventId/add-participant', { preHandler: [isAdminOrFaculty] }, enrollmentController.addSingleParticipant);
  fastify.post('/event/:eventId/remove-participant', { preHandler: [isAdminOrFaculty] }, enrollmentController.removeSingleParticipant);
  fastify.delete('/event/:eventId/remove-participant', { preHandler: [isAdminOrFaculty] }, enrollmentController.removeSingleParticipant);
  fastify.get('/event/:eventId/sample-template', { preHandler: [isAdminOrFaculty] }, enrollmentController.downloadSampleTemplate);
  fastify.delete('/:enrollmentId', { preHandler: [isAdminOrFaculty] }, enrollmentController.deleteEventEnrollment);
}

module.exports = enrollmentRoutes;
