import { FastifyInstance } from 'fastify';
import {
  getTrackingStudents,
  getStudent360Profile,
  generateStudentPdfReport,
  exportTrackingCsv,
} from '../controllers/studentTrackingController';
import { verifyToken, isAdmin, isSuperAdmin } from '../middleware/authMiddleware';

export async function studentTrackingRoutes(fastify: FastifyInstance) {
  // Authentication & admin verification for tracking system
  fastify.addHook('preHandler', verifyToken);
  fastify.addHook('preHandler', isAdmin);

  // Route 1: GET /api/admin/tracking/students (Paginated list with search & aggregated metrics)
  fastify.get('/students', getTrackingStudents);

  // Route 2: GET /api/admin/tracking/students/:userId (Detailed 360-view & chronological activity timeline)
  fastify.get('/students/:userId', getStudent360Profile);

  // Route 3: GET /api/admin/tracking/students/:userId/pdf (Official student performance PDF report)
  fastify.get('/students/:userId/pdf', generateStudentPdfReport);

  // Route 4: GET /api/admin/tracking/export (Low-RAM constant memory streaming CSV export, SuperAdmin only)
  fastify.get('/export', { preHandler: [isSuperAdmin] }, exportTrackingCsv);
}

export default studentTrackingRoutes;
