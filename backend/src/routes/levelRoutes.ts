import { FastifyInstance } from 'fastify';
import domainController from '../controllers/domainController';
import { verifyToken, isAdminOrFaculty, optionalToken, checkFeatureNotRestricted } from '../middleware/authMiddleware';

export async function levelRoutes(fastify: FastifyInstance) {
  // Quest evaluation requires verified student authentication (gated against courses restriction)
  fastify.post(
    '/:id/submit-quest',
    { preHandler: [verifyToken, checkFeatureNotRestricted('courses')] },
    domainController.submitLevelQuest as any
  );

  // Single level details
  fastify.get(
    '/:id',
    { preHandler: [optionalToken] },
    domainController.getLevelById as any
  );

  // Administrative level updates and deletion
  fastify.put(
    '/:id',
    { preHandler: [verifyToken, isAdminOrFaculty] },
    domainController.updateLevel as any
  );

  fastify.delete(
    '/:id',
    { preHandler: [verifyToken, isAdminOrFaculty] },
    domainController.deleteLevel as any
  );
}

export default levelRoutes;
