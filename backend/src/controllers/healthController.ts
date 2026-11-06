import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Lightweight Health Check Controller
 * Optimized for client-side load balancers and container readiness probes.
 * Returns sub-millisecond status without database overhead.
 */
export const getHealth = async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.status(200).send({
    status: 'ok',
    timestamp: Date.now(),
  });
};

export default {
  getHealth,
};
