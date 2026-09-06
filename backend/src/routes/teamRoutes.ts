import { FastifyInstance } from 'fastify';
import teamController from '../controllers/teamController';
import { verifyToken, isAdminOrFaculty } from '../middleware/authMiddleware';

export async function teamRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyToken);

  // Teams listing and retrieval
  fastify.get('/', teamController.getTeams as any);
  fastify.get('/:id', teamController.getTeamById as any);

  // Team creation and updating
  fastify.post('/', teamController.createTeam as any);
  fastify.put('/:id', teamController.updateTeam as any);

  // Admin / Faculty operations
  fastify.delete('/:id', { preHandler: [isAdminOrFaculty] }, teamController.deleteTeam as any);
  fastify.patch('/:id/status', { preHandler: [isAdminOrFaculty] }, teamController.setTeamStatus as any);
  fastify.post('/:id/members', { preHandler: [isAdminOrFaculty] }, teamController.assignMembers as any);
  fastify.delete('/:id/members/:userId', { preHandler: [isAdminOrFaculty] }, teamController.removeMember as any);
}

export default teamRoutes;
