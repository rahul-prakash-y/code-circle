import { FastifyInstance } from 'fastify';
import { getMe, updateMe, getEventPassport } from '../controllers/userController';
import * as userManagementController from '../controllers/userManagementController';
import * as adminController from '../controllers/adminController';
import { verifyToken, requireRole, requireSuperAdmin } from '../middleware/authMiddleware';

export async function userRoutes(fastify: FastifyInstance) {
  // Public / Authenticated user self profile routes
  fastify.register(async (instance) => {
    instance.addHook('preHandler', verifyToken);
    instance.get('/me', getMe);
    instance.put('/me', updateMe);
    instance.get('/passport', getEventPassport);
  });

  // Admin & SuperAdmin User Management routes
  fastify.register(async (instance) => {
    instance.addHook('preHandler', verifyToken);
    instance.addHook('preHandler', requireRole('Admin', 'SuperAdmin'));

    // Paginated User Directory & CRUD
    instance.get('/', userManagementController.getUsers);
    instance.post('/', userManagementController.createUser);
    instance.put('/:id', userManagementController.updateUser);
    instance.delete('/:id', userManagementController.deleteUser);
    instance.patch('/:id/block', userManagementController.toggleBlockUser);

    // Bulk Operations
    instance.post('/bulk-upload', userManagementController.bulkCreateUsers);
    instance.post('/bulk-delete', userManagementController.bulkDeleteUsers);

    // Password Reset Link trigger (Admin & SuperAdmin)
    instance.post('/:id/reset-link', userManagementController.triggerResetLink);

    // SuperAdmin Elevated Force Password Reset (NO ONE views raw passwords)
    instance.post('/:id/force-reset-password', { preHandler: [requireSuperAdmin] }, userManagementController.forceResetPassword);

    // Legacy backwards-compatible student routes
    instance.get('/students', adminController.getAllStudents);
    instance.put('/students/:id/password', adminController.updateStudentPassword);
    instance.put('/students/:id/block', adminController.toggleBlockStudent);
    instance.delete('/students/:id', adminController.deleteStudent);
    instance.put('/students/:id/logout', adminController.forceLogoutStudent);
  });
}

export default userRoutes;
