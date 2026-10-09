import { FastifyInstance } from 'fastify';
import codingAssessmentController from '../controllers/codingAssessmentController';
import { verifyToken, isAdminOrFaculty } from '../middleware/authMiddleware';

const executeBodySchema = {
  type: 'object',
  required: ['problemId', 'language', 'code'],
  properties: {
    problemId: { type: 'string', minLength: 24, maxLength: 24 },
    language: { type: 'string', minLength: 1, maxLength: 30 },
    code: { type: 'string', minLength: 1, maxLength: 65536 },
  },
};

const submitBodySchema = {
  type: 'object',
  required: ['problemId', 'language', 'code'],
  properties: {
    problemId: { type: 'string', minLength: 24, maxLength: 24 },
    language: { type: 'string', minLength: 1, maxLength: 30 },
    code: { type: 'string', minLength: 1, maxLength: 65536 },
    integrityEvents: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          timestamp: { type: 'string' },
          warningNumber: { type: 'number' },
          details: { type: 'object' },
        },
      },
    },
  },
};

const integrityEventSchema = {
  type: 'object',
  required: ['problemId', 'warningNumber'],
  properties: {
    problemId: { type: 'string' },
    type: { type: 'string' },
    warningNumber: { type: 'number' },
    timestamp: { type: 'string' },
  },
};

export async function codingAssessmentRoutes(fastify: FastifyInstance) {
  // All coding assessment endpoints require student authentication
  fastify.addHook('preHandler', verifyToken);

  // ── Course Level Assessment Endpoints (1-hour, 2 random questions) ──
  fastify.get('/level/:levelId/session', codingAssessmentController.getLevelAssessmentSession as any);
  fastify.post('/level/:levelId/submit', codingAssessmentController.submitLevelAssessmentCode as any);

  // ── Admin Excel Template & Bulk Upload Endpoints ────────────────
  fastify.get(
    '/admin/template',
    { preHandler: [isAdminOrFaculty] },
    codingAssessmentController.downloadSampleTemplate as any
  );
  fastify.post(
    '/admin/bulk-upload',
    { preHandler: [isAdminOrFaculty] },
    codingAssessmentController.bulkUploadCodingChallenges as any
  );
  fastify.get(
    '/level/:levelId/pool',
    { preHandler: [isAdminOrFaculty] },
    codingAssessmentController.getLevelPool as any
  );
  fastify.post(
    '/level/:levelId/pool',
    { preHandler: [isAdminOrFaculty] },
    codingAssessmentController.updateLevelPool as any
  );

  // List available standalone coding challenges (assessment tab)
  fastify.get('/challenges', codingAssessmentController.listCodingChallenges as any);

  // Fetch challenge workspace data (Visible test cases only)
  fastify.get('/:problemId', codingAssessmentController.getCodingChallenge as any);
  fastify.get('/challenge/:problemId', codingAssessmentController.getCodingChallenge as any);

  // Run code against public visible test cases
  fastify.post(
    '/execute',
    {
      schema: {
        body: executeBodySchema,
      },
    },
    codingAssessmentController.executeCode as any
  );

  // Submit assessment solution against all test cases
  fastify.post(
    '/submit',
    {
      schema: {
        body: submitBodySchema,
      },
    },
    codingAssessmentController.submitAssessmentCode as any
  );

  // Student's own submissions across challenges
  fastify.get('/my-submissions', codingAssessmentController.getMySubmissions as any);

  // Deterrent audit trail logging
  fastify.post(
    '/integrity-event',
    {
      schema: {
        body: integrityEventSchema,
      },
    },
    codingAssessmentController.recordIntegrityEvent as any
  );

  // ── Admin / Faculty Management Endpoints ─────────────────────────
  fastify.get(
    '/admin/challenges',
    { preHandler: [isAdminOrFaculty] },
    codingAssessmentController.listAdminCodingChallenges as any
  );

  fastify.get(
    '/admin/challenges/:id',
    { preHandler: [isAdminOrFaculty] },
    codingAssessmentController.getAdminChallengeDetails as any
  );

  fastify.post(
    '/admin/challenges',
    { preHandler: [isAdminOrFaculty] },
    codingAssessmentController.createCodingChallenge as any
  );

  fastify.put(
    '/admin/challenges/:id',
    { preHandler: [isAdminOrFaculty] },
    codingAssessmentController.updateCodingChallenge as any
  );

  fastify.delete(
    '/admin/challenges/:id',
    { preHandler: [isAdminOrFaculty] },
    codingAssessmentController.deleteCodingChallenge as any
  );

  fastify.get(
    '/admin/challenges/:id/submissions',
    { preHandler: [isAdminOrFaculty] },
    codingAssessmentController.getCodingChallengeSubmissions as any
  );
}


export default codingAssessmentRoutes;
