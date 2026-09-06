import { FastifyInstance } from 'fastify';
import {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
} from '../controllers/newsController';
import { verifyToken, isAdminOrFaculty } from '../middleware/authMiddleware';

export async function newsRoutes(fastify: FastifyInstance) {
  // Public news feed routes
  fastify.get('/', getNews);
  fastify.get('/:id', getNewsById);

  // Protected administrative CRUD routes (Admin, SuperAdmin, Faculty, Committee)
  fastify.post(
    '/',
    { preHandler: [verifyToken, isAdminOrFaculty] },
    createNews as any
  );

  fastify.put(
    '/:id',
    { preHandler: [verifyToken, isAdminOrFaculty] },
    updateNews as any
  );

  fastify.delete(
    '/:id',
    { preHandler: [verifyToken, isAdminOrFaculty] },
    deleteNews as any
  );
}

export default newsRoutes;
