import { FastifyInstance } from 'fastify';
import feedbackController from '../controllers/feedbackController';
import { verifyToken, isAdminOrFaculty, requireRole } from '../middleware/authMiddleware';

export async function feedbackRoutes(fastify: FastifyInstance) {
  // All feedback routes require valid authentication
  fastify.addHook('preHandler', verifyToken);

  // Student endpoints
  fastify.post('/', feedbackController.submitFeedback as any);
  fastify.get('/my', feedbackController.getMyFeedbacks as any);

  // Endpoints with role-based privacy enforcement (SuperAdmin unmasked, all others anonymized)
  fastify.get('/', feedbackController.getFeedbacks as any);
  fastify.get('/stats', feedbackController.getFeedbackStats as any);
  fastify.delete(
    '/:id',
    { preHandler: [requireRole('Admin', 'SuperAdmin')] },
    feedbackController.deleteFeedback as any
  );
}

export default feedbackRoutes;
