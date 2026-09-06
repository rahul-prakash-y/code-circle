const analyticsController = require('../controllers/analyticsController');
const { verifyToken, isAdminOrFaculty } = require('../middleware/authMiddleware');

async function analyticsRoutes(fastify, options) {
  fastify.get('/dashboard', analyticsController.getDashboardStats);
  fastify.get('/leaderboard', analyticsController.getLeaderboard);
  
  // Scalable metrics aggregation route (Admin & Faculty)
  fastify.get('/metrics', { preHandler: [verifyToken, isAdminOrFaculty] }, analyticsController.getMetrics);

  // CSV/PDF report download export route (Admin & Faculty)
  fastify.get('/reports/export', { preHandler: [verifyToken, isAdminOrFaculty] }, analyticsController.exportReport);
}

module.exports = analyticsRoutes;
