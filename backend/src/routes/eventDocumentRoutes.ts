import { FastifyInstance } from 'fastify';
import {
  getEventDocuments,
  getEventDocumentById,
  createEventDocument,
  updateEventDocument,
  deleteEventDocument,
  approveEventDocument,
  rejectEventDocument,
} from '../controllers/eventDocumentController';
import { verifyToken, isAdminOrFaculty } from '../middleware/authMiddleware';

export async function eventDocumentRoutes(fastify: FastifyInstance) {
  // All document routes require verified user authentication
  fastify.addHook('preHandler', verifyToken);

  // CRUD Routes
  fastify.get('/', getEventDocuments as any);
  fastify.get('/:id', getEventDocumentById as any);
  fastify.post('/', createEventDocument as any);
  fastify.put('/:id', updateEventDocument as any);
  fastify.delete('/:id', deleteEventDocument as any);

  // Specific Approval and Rejection Routes (Admin / Faculty only)
  fastify.patch('/:id/approve', { preHandler: [isAdminOrFaculty] }, approveEventDocument as any);
  fastify.patch('/:id/reject', { preHandler: [isAdminOrFaculty] }, rejectEventDocument as any);
}

export default eventDocumentRoutes;
