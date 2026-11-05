const mongoose = require('mongoose');

async function healthRoutes(fastify, options) {
  fastify.get('/health', async (request, reply) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const isHealthy = dbState === 1;

    return reply.status(200).send({
      status: isHealthy ? 'ok' : 'initializing',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatusMap[dbState] || 'unknown',
      memory: {
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      }
    });
  });
}

module.exports = healthRoutes;
