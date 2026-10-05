import { FastifyPluginAsync } from 'fastify';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';
import { verifyToken, requireAdmin } from '../middleware/authMiddleware';

export const notificationRoutes: FastifyPluginAsync = async (server) => {
  // Fetch notifications for the current authenticated user
  server.get('/', { preHandler: [verifyToken] }, getNotifications);

  // Mark all notifications as read for current user
  server.post('/read-all', { preHandler: [verifyToken] }, markAllAsRead);

  // Mark a single notification as read
  server.patch('/:id/read', { preHandler: [verifyToken] }, markAsRead);

  // Admin/SuperAdmin: Create a new broadcast notification
  server.post('/', { preHandler: [verifyToken, requireAdmin] }, createNotification);

  // Admin/SuperAdmin: Delete a broadcast notification
  server.delete('/:id', { preHandler: [verifyToken, requireAdmin] }, deleteNotification);
};

export default notificationRoutes;
