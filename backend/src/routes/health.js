async function healthRoutes(fastify, options) {
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', message: 'Code Circle API running' };
  });
}

module.exports = healthRoutes;
