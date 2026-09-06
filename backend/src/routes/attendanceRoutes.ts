import { FastifyInstance } from 'fastify';
import attendanceController from '../controllers/attendanceController';
import { verifyToken, isAdminOrFaculty } from '../middleware/authMiddleware';

export async function attendanceRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyToken);

  // Administrative Attendance & OTP Management
  fastify.post('/sessions', { preHandler: [isAdminOrFaculty] }, attendanceController.createSession as any);
  fastify.get('/sessions/active/:eventId', { preHandler: [isAdminOrFaculty] }, attendanceController.getActiveSession as any);
  fastify.get('/sessions/event/:eventId', attendanceController.getEventSessions as any);
  fastify.get('/sessions/:sessionId/attendance', { preHandler: [isAdminOrFaculty] }, attendanceController.getSessionAttendance as any);
  fastify.get('/records', { preHandler: [isAdminOrFaculty] }, attendanceController.getAttendanceRecords as any);

  // Student Attendance Actions
  fastify.post('/mark', attendanceController.markAttendance as any);
  fastify.get('/history', attendanceController.getUserAttendanceHistory as any);
}

export default attendanceRoutes;
