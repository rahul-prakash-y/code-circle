import { FastifyInstance } from 'fastify';
import {
  getArenaAdminCandidates,
  updateArenaConfig,
  getAdminArenaQuestions,
  saveArenaMcqs,
  saveArenaCodingProblems,
  bulkUploadArenaQuestions,
  downloadArenaSampleTemplate,
  getStudentArenaData,
  startArenaSession,
  runArenaCode,
  submitArenaCodingProblem,
  submitArenaFinal,
  getArenaLeaderboard,
  getAdminArenaSubmissions,
} from '../controllers/eventArenaController';
import { verifyToken, isAdmin, checkFeatureNotRestricted } from '../middleware/authMiddleware';

export async function eventArenaRoutes(fastify: FastifyInstance) {
  // All arena endpoints require verified user authentication
  fastify.addHook('preHandler', verifyToken);

  // 1. Candidate admins for SuperAdmin selection
  fastify.get('/arena/admin-candidates', { preHandler: [isAdmin] }, getArenaAdminCandidates);

  // 2. Admin & Question Authoring Endpoints (Protected by SuperAdmin or Assigned Admin guard)
  fastify.put('/:id/arena/config', updateArenaConfig);
  fastify.get('/:id/arena/questions', getAdminArenaQuestions);
  fastify.post('/:id/arena/questions/mcq', saveArenaMcqs);
  fastify.post('/:id/arena/questions/coding', saveArenaCodingProblems);
  fastify.post('/:id/arena/questions/bulk-upload', bulkUploadArenaQuestions);
  fastify.get('/:id/arena/templates/:type', downloadArenaSampleTemplate);
  fastify.get('/:id/arena/admin/submissions', getAdminArenaSubmissions);

  // 3. Student Arena Participation Endpoints (Gated against restriction)
  fastify.get('/:id/arena', getStudentArenaData);
  fastify.get('/:id/arena/leaderboard', getArenaLeaderboard);

  fastify.register(async (studentArenaGroup) => {
    studentArenaGroup.addHook('preHandler', checkFeatureNotRestricted('assessments'));

    studentArenaGroup.post('/:id/arena/start', startArenaSession);
    studentArenaGroup.post('/:id/arena/run-code', runArenaCode);
    studentArenaGroup.post('/:id/arena/submit-problem', submitArenaCodingProblem);
    studentArenaGroup.post('/:id/arena/submit', submitArenaFinal);
  });
}

export default eventArenaRoutes;
