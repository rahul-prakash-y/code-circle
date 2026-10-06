import { FastifyInstance } from 'fastify';
import {
  getHackerRankStats,
  getGitHubStats,
} from '../controllers/statsController';

export async function statsRoutes(fastify: FastifyInstance) {
  // Public proxy routes for developer platform stats
  fastify.get('/hackerrank/:username', getHackerRankStats);
  fastify.get('/github/:username', getGitHubStats);
}

export default statsRoutes;
