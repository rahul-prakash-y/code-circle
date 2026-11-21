import { FastifyInstance } from 'fastify';
import { getGallery, updateEventGallery } from '../controllers/galleryController';
import { optionalToken, verifyToken, isAdminOrFaculty } from '../middleware/authMiddleware';

export async function galleryRoutes(fastify: FastifyInstance) {
  // Public / all-user read endpoint (optional token attaches session if logged in)
  fastify.get('/', { preHandler: [optionalToken] }, getGallery as any);
  fastify.get('/events', { preHandler: [optionalToken] }, getGallery as any);

  // Admin / Coordinator upload route (mirrors PATCH /api/events/:id/gallery)
  fastify.patch(
    '/:id',
    { preHandler: [verifyToken, isAdminOrFaculty] },
    updateEventGallery as any
  );
}

export default galleryRoutes;
