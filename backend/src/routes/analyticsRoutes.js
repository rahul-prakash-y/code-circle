const analyticsController = require('../controllers/analyticsController');

async function analyticsRoutes(fastify, options) {
  fastify.get('/dashboard', analyticsController.getDashboardStats);
  fastify.get('/leaderboard', analyticsController.getLeaderboard);
}

module.exports = analyticsRoutes;
