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
} from '../controllers/contestController';
import { verifyToken, isAdmin, optionalToken } from '../middleware/authMiddleware';

export async function contestRoutes(fastify: FastifyInstance) {
  // Public/Student routes with optional or verified token
  fastify.get('/', { preHandler: [optionalToken] }, getContests);
  fastify.get('/:id', { preHandler: [optionalToken] }, getContestById);
  fastify.get('/:id/leaderboard', { preHandler: [optionalToken] }, getContestLeaderboard);

  // Authenticated Student Contest Session
  fastify.register(async (studentGroup) => {
    studentGroup.addHook('preHandler', verifyToken);

    studentGroup.post('/:id/start', startContestSession);
    studentGroup.post('/:id/run-code', runContestCode);
    studentGroup.post('/:id/submit-code', submitContestProblemCode);
    studentGroup.post('/:id/submit', submitContest);
  });

  // Admin / Faculty Contest Creation, Management & Manual Point Allocation
  fastify.register(async (adminGroup) => {
    adminGroup.addHook('preHandler', verifyToken);
    adminGroup.addHook('preHandler', isAdmin);

    adminGroup.post('/', createContest);
    adminGroup.put('/:id', updateContest);
    adminGroup.delete('/:id', deleteContest);

    // Manual Point Allocation & Submissions Review
    adminGroup.get('/:id/submissions', getContestSubmissionsForAdmin);
    adminGroup.post('/:id/submissions/:submissionId/allocate-points', allocateContestPoints);
    adminGroup.post('/:id/allocate-bulk', bulkAllocateContestPoints);
  });
}

export default contestRoutes;
