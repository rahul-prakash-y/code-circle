const crypto = require('crypto');

function getJwtFingerprint() {
  try {
    const secret = process.env.JWT_SECRET || 'stellar-minimalist-secret-key-2026';
    return crypto.createHash('sha256').update(secret).digest('hex').substring(0, 8);
  } catch {
    return 'unknown';
  }
}

/**
 * Fastify Health Route
 * Provides sub-millisecond response for client-side load balancers and container readiness checks.
 * Includes cluster nodeId and jwtFingerprint for multi-node admin verification.
 */
async function healthRoutes(fastify, options) {
  fastify.get('/health', async (request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      nodeId:
        process.env.RENDER_INSTANCE_ID ||
        process.env.NODE_ID ||
        `${require('os').hostname()}-${process.pid}`,
      jwtFingerprint: getJwtFingerprint(),
      timestamp: Date.now(),
    });
  });
}

module.exports = healthRoutes;
