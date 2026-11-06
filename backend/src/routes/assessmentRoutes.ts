import { FastifyInstance } from 'fastify';
import assessmentController from '../controllers/assessmentController';
import { codingAssessmentRoutes } from './codingAssessmentRoutes';
import { verifyToken, isAdminOrFaculty, requireRole, checkFeatureNotRestricted } from '../middleware/authMiddleware';
import { checkAssessmentNotBlocked } from '../middleware/antiCheatMiddleware';

export async function assessmentRoutes(fastify: FastifyInstance) {
  // Mount live coding assessment sub-routes
  fastify.register(codingAssessmentRoutes, { prefix: '/code' });

  // All assessment routes require authentication
  fastify.addHook('preHandler', verifyToken);

  // Admin Excel Template & Bulk Upload Endpoints (Registered before /:id)
  fastify.get(
    '/admin/template',
    { preHandler: [isAdminOrFaculty] },
    assessmentController.downloadSampleTemplate as any
  );
  fastify.post(
    '/admin/bulk-upload',
    { preHandler: [isAdminOrFaculty] },
    assessmentController.bulkUploadMCQAssessments as any
  );

  // Student assessment endpoints (gated against restriction & Anti-Cheat block)
  fastify.get('/', assessmentController.getAssessments as any);
  fastify.get('/my-submissions', assessmentController.getMySubmissions as any);
  fastify.get(
    '/:id',
    { preHandler: [checkFeatureNotRestricted('assessments'), checkAssessmentNotBlocked] },
    assessmentController.getAssessmentById as any
  );
  fastify.post(
    '/:id/submit',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
          errorResponseBuilder: (request: any, context: any) => ({
            statusCode: 429,
            error: 'Too Many Requests',
            message: 'Submission rate limit exceeded. Please wait a moment before trying again.',
          }),
        },
      },
      preHandler: [checkFeatureNotRestricted('assessments'), checkAssessmentNotBlocked],
    },
    assessmentController.submitAssessment as any
  );
  fastify.delete('/:id/my-submission', assessmentController.resetMyAssessmentSubmission as any);
  fastify.post(
    '/:id/reappear',
    { preHandler: [checkFeatureNotRestricted('assessments'), checkAssessmentNotBlocked] },
    assessmentController.resetMyAssessmentSubmission as any
  );

  // Administrative CRUD, Evaluation & Submission management
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
  fastify.get(
    '/:id/submissions/export',
    { preHandler: [isAdminOrFaculty] },
    assessmentController.exportAssessmentSubmissionsCsv as any
  );
  fastify.get(
    '/:id/submissions/:submissionId/report',
    { preHandler: [isAdminOrFaculty] },
    assessmentController.getSingleAssessmentSubmissionReport as any
  );
  fastify.delete(
    '/:id/submissions/:submissionId',
    assessmentController.deleteAssessmentSubmission as any
  );
  fastify.post(
    '/:id/reappear/:studentId',
    { preHandler: [isAdminOrFaculty] },
    assessmentController.allowStudentReappear as any
  );
}

export default assessmentRoutes;
