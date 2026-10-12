import { FastifyInstance } from 'fastify';
import {
  getOnboardingStats,
  sendOnboardingReminder,
  updateStudentOnboardingStatus,
  getAllStudents,
  updateStudentPassword,
  toggleBlockStudent,
  deleteStudent,
  forceLogoutStudent,
} from '../controllers/adminController';
import { verifyToken, isAdmin } from '../middleware/authMiddleware';

import { studentTrackingRoutes } from './studentTrackingRoutes';

export async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes are protected by verifyToken & isAdmin middleware
  fastify.addHook('preHandler', verifyToken);
  fastify.addHook('preHandler', isAdmin);

  // Student Tracking System endpoints (/api/admin/tracking/students, /tracking/students/:userId, /tracking/export)
  fastify.register(studentTrackingRoutes, { prefix: '/tracking' });

  // Student onboarding stats tracker endpoint
  fastify.get('/onboarding-stats', getOnboardingStats);

  // Quick actions: send onboarding reminder
  fastify.post('/onboarding-reminder', sendOnboardingReminder);
  fastify.post('/send-onboarding-reminder', sendOnboardingReminder);

  // Toggle/update student onboarding status
  fastify.patch('/students/:id/onboarding', updateStudentOnboardingStatus);
  fastify.patch('/students/:id/onboarding-status', updateStudentOnboardingStatus);

  // Legacy admin student endpoints for convenience under /api/admin
  fastify.get('/students', getAllStudents);
  fastify.put('/students/:id/password', updateStudentPassword);
  fastify.put('/students/:id/block', toggleBlockStudent);
  fastify.delete('/students/:id', deleteStudent);
  fastify.put('/students/:id/logout', forceLogoutStudent);
}

export default adminRoutes;
