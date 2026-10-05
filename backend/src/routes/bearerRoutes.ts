import { FastifyInstance } from 'fastify';
import {
  getBearers,
  createBearer,
  updateBearer,
  deleteBearer,
} from '../controllers/bearerController';
import { verifyToken, isSuperAdmin } from '../middleware/authMiddleware';

export async function bearerRoutes(fastify: FastifyInstance) {
  // Public route: Student-facing page
  fastify.get('/', getBearers);

  // Protected administrative routes: Strictly SuperAdmin only
  // Normal Admins receive 403 Forbidden via isSuperAdmin middleware
  fastify.post(
    '/',
    { preHandler: [verifyToken, isSuperAdmin] },
    createBearer
  );

  fastify.put(
    '/:id',
    { preHandler: [verifyToken, isSuperAdmin] },
    updateBearer as any
  );

  fastify.delete(
    '/:id',
    { preHandler: [verifyToken, isSuperAdmin] },
    deleteBearer as any
  );
}

export default bearerRoutes;
