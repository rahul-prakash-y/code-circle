import { FastifyInstance } from 'fastify';
import domainController from '../controllers/domainController';
import { optionalToken, verifyToken, isAdminOrFaculty } from '../middleware/authMiddleware';

export async function domainRoutes(fastify: FastifyInstance) {
  // Public / Student endpoints (with optional token parsing to enrich progression stats)
  fastify.get('/', { preHandler: [optionalToken] }, domainController.getDomains as any);
  fastify.get('/:id/levels', { preHandler: [optionalToken] }, domainController.getDomainLevels as any);

  // Administrative endpoints
  fastify.post('/', { preHandler: [verifyToken, isAdminOrFaculty] }, domainController.createDomain as any);
  fastify.put('/:id', { preHandler: [verifyToken, isAdminOrFaculty] }, domainController.updateDomain as any);
  fastify.delete('/:id', { preHandler: [verifyToken, isAdminOrFaculty] }, domainController.deleteDomain as any);
  fastify.post('/:id/levels', { preHandler: [verifyToken, isAdminOrFaculty] }, domainController.createLevel as any);
}

export default domainRoutes;
