import { FastifyInstance } from 'fastify';
import domainController from '../controllers/domainController';
import { verifyToken } from '../middleware/authMiddleware';

export async function levelRoutes(fastify: FastifyInstance) {
  // Quest evaluation requires verified student authentication
  fastify.post(
    '/:id/submit-quest',
    { preHandler: [verifyToken] },
    domainController.submitLevelQuest as any
  );
}

export default levelRoutes;
