import { FastifyInstance } from 'fastify';
import feedbackController from '../controllers/feedbackController';
import { verifyToken, isAdminOrFaculty, requireRole } from '../middleware/authMiddleware';

export async function feedbackRoutes(fastify: FastifyInstance) {
  // All feedback routes require valid authentication
  fastify.addHook('preHandler', verifyToken);

  // Student endpoints
  fastify.post('/', feedbackController.submitFeedback as any);
  fastify.get('/my', feedbackController.getMyFeedbacks as any);

  // Administrative endpoints (Protected with role checking and privacy enforcement)
  fastify.get('/', { preHandler: [isAdminOrFaculty] }, feedbackController.getFeedbacks as any);
  fastify.get('/stats', { preHandler: [isAdminOrFaculty] }, feedbackController.getFeedbackStats as any);
  fastify.delete(
    '/:id',
    { preHandler: [requireRole('Admin', 'SuperAdmin')] },
    feedbackController.deleteFeedback as any
  );
}

export default feedbackRoutes;
