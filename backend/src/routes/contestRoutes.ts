import { FastifyInstance } from 'fastify';
import {
  getContests,
  getContestById,
  startContestSession,
  runContestCode,
  submitContestProblemCode,
  submitContest,
  getContestLeaderboard,
  createContest,
  updateContest,
  deleteContest,
  allocateContestPoints,
  bulkAllocateContestPoints,
  getContestSubmissionsForAdmin,
  getSingleContestSubmissionForAdmin,
  getMyContestSubmission,
  downloadContestMcqTemplate,
  downloadContestCodingTemplate,
  parseContestMcqUpload,
  parseContestCodingUpload,
  requestContestReentry,
  approveContestReentry,
  rejectContestReentry,
  deleteContestSubmission,
} from '../controllers/contestController';
import {
  verifyToken,
  isAdmin,
  isAdminOrFaculty,
  optionalToken,
  checkFeatureNotRestricted,
} from '../middleware/authMiddleware';

export async function contestRoutes(fastify: FastifyInstance) {
  // Public/Student routes with optional or verified token
  fastify.get('/', { preHandler: [optionalToken] }, getContests);
  fastify.get('/:id', { preHandler: [optionalToken] }, getContestById);
  fastify.get('/:id/leaderboard', { preHandler: [optionalToken] }, getContestLeaderboard);

  // Authenticated Student Contest Session (gated against contest restriction)
  fastify.register(async (studentGroup) => {
    studentGroup.addHook('preHandler', verifyToken);

    // Submission review & re-entry request endpoints do not require active arena access
    studentGroup.get('/:id/my-submission', getMyContestSubmission);
    studentGroup.post('/:id/request-reentry', requestContestReentry);

    // Active arena session routes gated against restrictedFeatures
    studentGroup.register(async (arenaGroup) => {
      arenaGroup.addHook('preHandler', checkFeatureNotRestricted('contests'));

      arenaGroup.post('/:id/start', startContestSession);
      arenaGroup.post('/:id/run-code', runContestCode);
      arenaGroup.post('/:id/submit-code', submitContestProblemCode);
      arenaGroup.post('/:id/submit', submitContest);
    });
  });

  // Admin / Faculty Contest Creation, Management & Manual Point Allocation
  fastify.register(async (adminGroup) => {
    adminGroup.addHook('preHandler', verifyToken);
    adminGroup.addHook('preHandler', isAdminOrFaculty);

    adminGroup.get('/admin/mcq-template', downloadContestMcqTemplate);
    adminGroup.get('/admin/coding-template', downloadContestCodingTemplate);
    adminGroup.post('/admin/parse-mcq-upload', parseContestMcqUpload);
    adminGroup.post('/admin/parse-coding-upload', parseContestCodingUpload);

    adminGroup.post('/', createContest);
    adminGroup.put('/:id', updateContest);
    adminGroup.delete('/:id', deleteContest);

    // Manual Point Allocation & Submissions Review
    adminGroup.get('/:id/submissions', getContestSubmissionsForAdmin);
    adminGroup.get('/:id/submissions/:submissionId', getSingleContestSubmissionForAdmin);
    adminGroup.post('/:id/submissions/:submissionId/allocate-points', allocateContestPoints);
    adminGroup.post('/:id/allocate-bulk', bulkAllocateContestPoints);

    // Student Re-entry Approval, Rejection & Entry Deletion
    adminGroup.delete('/:id/submissions/:submissionId', deleteContestSubmission);
    adminGroup.post('/:id/submissions/:submissionId/approve-reentry', approveContestReentry);
    adminGroup.post('/:id/submissions/:submissionId/reject-reentry', rejectContestReentry);
  });
}

export default contestRoutes;
