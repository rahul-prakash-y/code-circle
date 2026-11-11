import { FastifyInstance } from 'fastify';
import {
  getMyPoints,
  getAdminPointsOverview,
  getAdminStudentPoints,
  getAdminStudentPointsDetail,
  awardAdminPoints,
  getAdminPointTransactions,
} from '../controllers/pointsController';
import { verifyToken, isAdmin } from '../middleware/authMiddleware';

export async function pointsRoutes(fastify: FastifyInstance) {
  // All points routes require authenticated user
  fastify.addHook('preHandler', verifyToken);

  // Student self points tracking ("My Points" page)
  fastify.get('/my-points', getMyPoints);
  fastify.get('/me', getMyPoints);

  // Admin routes for inspecting points and seeing "how many and how they earned"
  fastify.register(async (adminScope) => {
    adminScope.addHook('preHandler', isAdmin);

    // Global club points KPIs & distributions
    adminScope.get('/admin/overview', getAdminPointsOverview);

    // Students list with point breakdown
    adminScope.get('/admin/students', getAdminStudentPoints);

    // Full 360-degree point audit for an individual student ("how they earned")
    adminScope.get('/admin/students/:userId', getAdminStudentPointsDetail);

    // Global points tracking ledger across all students sorted by recently
    adminScope.get('/admin/transactions', getAdminPointTransactions);
    adminScope.get('/admin/tracking', getAdminPointTransactions);

    // Award / adjust bonus merit points
    adminScope.post('/admin/award', awardAdminPoints);
  });
}

export default pointsRoutes;
