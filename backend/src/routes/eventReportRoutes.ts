import { FastifyInstance } from 'fastify';
import {
  createOrUpdateReport,
  getReportByEventId,
  getAllReports,
  deleteReport,
} from '../controllers/eventReportController';
import { verifyToken, isAdminOrFaculty } from '../middleware/authMiddleware';

export async function eventReportRoutes(fastify: FastifyInstance) {
  // Enforce authentication for reporting system
  fastify.addHook('preHandler', verifyToken);

  // CRUD Routes for Event Documentation Generator
  fastify.post('/', { preHandler: [isAdminOrFaculty] }, createOrUpdateReport as any);
  fastify.get('/:eventId', getReportByEventId as any);
  fastify.get('/', getAllReports as any);
  fastify.delete('/:id', { preHandler: [isAdminOrFaculty] }, deleteReport as any);
}

export default eventReportRoutes;
