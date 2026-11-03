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
  // Multi-assessment endpoints
  getEventAssessmentsList,
  createEventAssessment,
  updateEventAssessment,
  deleteEventAssessment,
  getAdminAssessmentQuestions,
  saveAssessmentMcqs,
  saveAssessmentCodingProblems,
  bulkUploadAssessmentQuestions,
  getAdminAssessmentSubmissions,
  saveAssessmentDesignChallenge,
  evaluateAssessmentDesign,
  getStudentAssessmentData,
  startAssessmentSession,
  runAssessmentCode,
  submitAssessmentCodingProblem,
  submitAssessmentFinal,
  submitAssessmentDesign,
  getAssessmentLeaderboard,
  getArenaTeams,
  createArenaTeam,
  assignArenaTeamMembers,
  deleteArenaTeam,
} from '../controllers/eventArenaController';
import { verifyToken, isAdmin, checkFeatureNotRestricted } from '../middleware/authMiddleware';

export async function eventArenaRoutes(fastify: FastifyInstance) {
  // All arena endpoints require verified user authentication
  fastify.addHook('preHandler', verifyToken);

  // 1. Candidate admins for SuperAdmin selection
  fastify.get('/arena/admin-candidates', { preHandler: [isAdmin] }, getArenaAdminCandidates);

  // 2. Multi-Assessment management
  fastify.get('/:id/arena/assessments', getEventAssessmentsList as any);
  fastify.post('/:id/arena/assessments', { preHandler: [isAdmin] }, createEventAssessment as any);
  fastify.put('/:id/arena/assessments/:assessmentId', { preHandler: [isAdmin] }, updateEventAssessment as any);
  fastify.delete('/:id/arena/assessments/:assessmentId', { preHandler: [isAdmin] }, deleteEventAssessment as any);

  // 3. Question & Design Challenge Authoring per Assessment (SuperAdmin OR assigned admins)
  fastify.get('/:id/arena/assessments/:assessmentId/questions', getAdminAssessmentQuestions);
  fastify.post('/:id/arena/assessments/:assessmentId/questions/mcq', saveAssessmentMcqs);
  fastify.post('/:id/arena/assessments/:assessmentId/questions/coding', saveAssessmentCodingProblems);
  fastify.post('/:id/arena/assessments/:assessmentId/questions/bulk-upload', bulkUploadAssessmentQuestions);
  fastify.put('/:id/arena/assessments/:assessmentId/design', saveAssessmentDesignChallenge);
  fastify.get('/:id/arena/assessments/:assessmentId/admin/submissions', getAdminAssessmentSubmissions);
  fastify.put('/:id/arena/assessments/:assessmentId/submissions/:submissionId/evaluate-design', evaluateAssessmentDesign);

  // 4. Sample Templates
  fastify.get('/:id/arena/templates/:type', downloadArenaSampleTemplate);

  // 4.5 Team Management for Event Arena Rounds
  fastify.get('/:id/arena/teams', getArenaTeams);
  fastify.post('/:id/arena/teams', createArenaTeam);
  fastify.put('/:id/arena/teams/:teamId/members', assignArenaTeamMembers);
  fastify.delete('/:id/arena/teams/:teamId', deleteArenaTeam);

  // 5. Legacy / Single Arena Endpoints (Backwards-compatible)
  fastify.put('/:id/arena/config', updateArenaConfig);
  fastify.get('/:id/arena/questions', getAdminArenaQuestions);
  fastify.post('/:id/arena/questions/mcq', saveArenaMcqs);
  fastify.post('/:id/arena/questions/coding', saveArenaCodingProblems);
  fastify.post('/:id/arena/questions/bulk-upload', bulkUploadArenaQuestions);
  fastify.get('/:id/arena/admin/submissions', getAdminArenaSubmissions);
  fastify.get('/:id/arena', getStudentArenaData);
  fastify.get('/:id/arena/leaderboard', getArenaLeaderboard);

  // 6. Student Assessment Participation Endpoints (Gated against restriction)
  fastify.register(async (studentArenaGroup) => {
    studentArenaGroup.addHook('preHandler', checkFeatureNotRestricted('assessments'));

    // Multi-assessment routes
    studentArenaGroup.get('/:id/arena/assessments/:assessmentId/data', getStudentAssessmentData);
    studentArenaGroup.post('/:id/arena/assessments/:assessmentId/start', startAssessmentSession);
    studentArenaGroup.post('/:id/arena/assessments/:assessmentId/run-code', runAssessmentCode);
    studentArenaGroup.post('/:id/arena/assessments/:assessmentId/submit-problem', submitAssessmentCodingProblem);
    studentArenaGroup.post('/:id/arena/assessments/:assessmentId/submit', submitAssessmentFinal);
    studentArenaGroup.post('/:id/arena/assessments/:assessmentId/design/submit', submitAssessmentDesign);
    studentArenaGroup.get('/:id/arena/assessments/:assessmentId/leaderboard', getAssessmentLeaderboard);

    // Single-arena legacy routes
    studentArenaGroup.post('/:id/arena/start', startArenaSession);
    studentArenaGroup.post('/:id/arena/run-code', runArenaCode);
    studentArenaGroup.post('/:id/arena/submit-problem', submitArenaCodingProblem);
    studentArenaGroup.post('/:id/arena/submit', submitArenaFinal);
  });
}

export default eventArenaRoutes;
