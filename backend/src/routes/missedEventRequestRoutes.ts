import { FastifyInstance } from 'fastify';
import missedEventRequestController from '../controllers/missedEventRequestController';
import { verifyToken, isAdminOrFaculty } from '../middleware/authMiddleware';

export async function missedEventRequestRoutes(fastify: FastifyInstance) {
  // All endpoints require verified user authentication
  fastify.addHook('preHandler', verifyToken);

  // Student endpoints
  fastify.post('/', missedEventRequestController.createMissedEventRequest);
  fastify.get('/my', missedEventRequestController.getMyMissedEventRequests);

  // Admin / Faculty management endpoints
  fastify.get(
    '/',
    { preHandler: [isAdminOrFaculty] },
    missedEventRequestController.getAdminMissedEventRequests
  );
  fastify.get(
    '/stats',
    { preHandler: [isAdminOrFaculty] },
    missedEventRequestController.getMissedEventRequestsStats
  );
  fastify.patch(
    '/:id/review',
    { preHandler: [isAdminOrFaculty] },
    missedEventRequestController.reviewMissedEventRequest
  );

  // Delete endpoint (student can delete own pending, admin can delete any)
  fastify.delete('/:id', missedEventRequestController.deleteMissedEventRequest);
}

export default missedEventRequestRoutes;
