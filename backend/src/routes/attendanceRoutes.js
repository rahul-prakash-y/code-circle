const attendanceController = require('../controllers/attendanceController');
const verifyToken = require('../middleware/authMiddleware');

async function attendanceRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyToken);

  // Admin/Faculty routes
  fastify.post('/sessions', attendanceController.createSession);
  fastify.get('/sessions/event/:eventId', attendanceController.getEventSessions);
  fastify.get('/sessions/:sessionId/attendance', attendanceController.getSessionAttendance);

  // Student routes
  fastify.post('/mark', attendanceController.markAttendance);
  fastify.get('/history', attendanceController.getUserAttendanceHistory);
}

module.exports = attendanceRoutes;
