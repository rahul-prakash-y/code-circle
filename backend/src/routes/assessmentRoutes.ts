import { FastifyInstance } from 'fastify';
import assessmentController from '../controllers/assessmentController';
import { codingAssessmentRoutes } from './codingAssessmentRoutes';
import { verifyToken, isAdminOrFaculty, requireRole } from '../middleware/authMiddleware';

export async function assessmentRoutes(fastify: FastifyInstance) {
  // Mount live coding assessment sub-routes
  fastify.register(codingAssessmentRoutes, { prefix: '/code' });

  // All assessment routes require authentication
  fastify.addHook('preHandler', verifyToken);

  // Student and Public assessment endpoints
  fastify.get('/', assessmentController.getAssessments as any);
  fastify.get('/my-submissions', assessmentController.getMySubmissions as any);
  fastify.get('/:id', assessmentController.getAssessmentById as any);
  fastify.post('/:id/submit', assessmentController.submitAssessment as any);

  // Administrative CRUD & Evaluation management
  fastify.post('/', { preHandler: [isAdminOrFaculty] }, assessmentController.createAssessment as any);
  fastify.put('/:id', { preHandler: [isAdminOrFaculty] }, assessmentController.updateAssessment as any);
  fastify.delete(
    '/:id',
    { preHandler: [requireRole('Admin', 'SuperAdmin')] },
    assessmentController.deleteAssessment as any
  );
  fastify.get(
    '/:id/submissions',
    { preHandler: [isAdminOrFaculty] },
    assessmentController.getAssessmentSubmissions as any
  );
}

export default assessmentRoutes;
