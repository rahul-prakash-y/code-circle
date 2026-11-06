import { FastifyInstance } from 'fastify';
import {
  createOrUpdateReport,
  getReportByEventId,
  getAllReports,
  deleteReport,
} from '../controllers/eventReportController';
import { verifyToken } from '../middleware/authMiddleware';

export async function eventReportRoutes(fastify: FastifyInstance) {
  // Enforce authentication for reporting system
  fastify.addHook('preHandler', verifyToken);

  // CRUD Routes for Event Documentation Generator
  fastify.post('/', createOrUpdateReport as any);
  fastify.get('/:eventId', getReportByEventId as any);
  fastify.get('/', getAllReports as any);
  fastify.delete('/:id', deleteReport as any);
}

export default eventReportRoutes;
