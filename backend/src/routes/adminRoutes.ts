import { FastifyInstance } from 'fastify';
import {
  getOnboardingStats,
  sendOnboardingReminder,
  updateStudentOnboardingStatus,
  bulkDeletePendingStudents,
  getAllStudents,
  updateStudentPassword,
  toggleBlockStudent,
  deleteStudent,
  forceLogoutStudent,
} from '../controllers/adminController';
import * as passwordResetController from '../controllers/passwordResetController';
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

  // Quick actions: bulk delete pending initial login students
  fastify.post('/onboarding/bulk-delete', bulkDeletePendingStudents);
  fastify.delete('/onboarding/pending-students', bulkDeletePendingStudents);

  // Toggle/update student onboarding status
  fastify.patch('/students/:id/onboarding', updateStudentOnboardingStatus);
  fastify.patch('/students/:id/onboarding-status', updateStudentOnboardingStatus);

  // Legacy admin student endpoints for convenience under /api/admin
  fastify.get('/students', getAllStudents);
  fastify.put('/students/:id/password', updateStudentPassword);
  fastify.put('/students/:id/block', toggleBlockStudent);
  fastify.delete('/students/:id', deleteStudent);
  fastify.put('/students/:id/logout', forceLogoutStudent);

  // Password Reset Link Dispatcher & Approval Endpoints (/api/admin/password-resets)
  fastify.get('/password-resets', passwordResetController.getAdminResetRequests);
  fastify.post('/password-resets/:id/approve', passwordResetController.approveResetRequest);
  fastify.post('/password-resets/:id/resend', passwordResetController.resendResetEmail);
  fastify.post('/password-resets/:id/reject', passwordResetController.rejectResetRequest);
  fastify.post('/password-resets/approve-all', passwordResetController.approveAllResetRequests);
  fastify.delete('/password-resets/:id', passwordResetController.deleteResetRequest);
  fastify.get('/password-resets/smtp-status', passwordResetController.getSmtpStatus);
}

export default adminRoutes;
