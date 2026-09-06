import { FastifyInstance } from 'fastify';
import eventController from '../controllers/eventController';
import { verifyToken, isAdminOrFaculty } from '../middleware/authMiddleware';

export async function eventRoutes(fastify: FastifyInstance) {
  // All event routes require valid authentication
  fastify.addHook('preHandler', verifyToken);

  // List and read events
  fastify.get('/', eventController.getEvents as any);
  fastify.get('/:id', eventController.getEventById as any);

  // Administrative event CRUD
  fastify.post('/', { preHandler: [isAdminOrFaculty] }, eventController.createEvent as any);
  fastify.put('/:id', { preHandler: [isAdminOrFaculty] }, eventController.updateEvent as any);
  fastify.delete('/:id', { preHandler: [isAdminOrFaculty] }, eventController.deleteEvent as any);
}

export default eventRoutes;
