/**
 * Fastify Health Route
 * Provides sub-millisecond response for client-side load balancers and container readiness checks.
 */
async function healthRoutes(fastify, options) {
  fastify.get('/health', async (request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: Date.now(),
    });
  });
}

module.exports = healthRoutes;
