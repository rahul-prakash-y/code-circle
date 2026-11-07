const crypto = require('crypto');
const os = require('os');
const jwt = require('jsonwebtoken');

function computeHmacFingerprint(secret) {
  try {
    return crypto.createHmac('sha256', secret).update('fingerprint-v1').digest('hex').substring(0, 12);
  } catch {
    return 'unknown';
  }
}

/**
 * Fastify Health Route
 * Provides sub-millisecond response for client-side load balancers and container readiness checks.
 * Public health check returns ONLY status to prevent information disclosure.
 * Authenticated admins receive cluster nodeId and 12-char HMAC(JWT_SECRET, "fingerprint-v1").
 */
async function healthRoutes(fastify, options) {
  fastify.get('/health', async (request, reply) => {
    // 1. Check for authenticated Admin / Faculty
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const secret = process.env.JWT_SECRET || 'stellar-minimalist-secret-key-2026';
      try {
        const decoded = jwt.verify(token, secret);
        if (decoded && (decoded.role === 'Admin' || decoded.role === 'SuperAdmin' || decoded.role === 'Faculty')) {
          return reply.status(200).send({
            status: 'ok',
            nodeId:
              process.env.RENDER_INSTANCE_ID ||
              process.env.NODE_ID ||
              `${os.hostname()}-${process.pid}`,
            jwtFingerprint: computeHmacFingerprint(secret),
            timestamp: Date.now(),
          });
        }
      } catch {
        // Fall through to public response on invalid token
      }
    }

    // Public health check returns ONLY status
    return reply.status(200).send({
      status: 'ok',
    });
  });
}

module.exports = healthRoutes;
