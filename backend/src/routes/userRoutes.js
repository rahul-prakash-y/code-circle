const { getMe, updateMe, getEventPassport } = require('../controllers/userController');
const userManagementController = require('../controllers/userManagementController');
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole, requireSuperAdmin } = require('../middleware/authMiddleware');

async function userRoutes(fastify, options) {
  // Authenticated user self profile routes
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

    // Password Reset Link trigger (Admin & SuperAdmin)
    instance.post('/:id/reset-link', userManagementController.triggerResetLink);

    // Admin & SuperAdmin Force Temporary Password Reset
    instance.post('/:id/force-reset-password', userManagementController.forceResetPassword);

    // Legacy backwards-compatible student routes
    instance.get('/students', adminController.getAllStudents);
    instance.put('/students/:id/password', adminController.updateStudentPassword);
    instance.put('/students/:id/block', adminController.toggleBlockStudent);
    instance.delete('/students/:id', adminController.deleteStudent);
    instance.put('/students/:id/logout', adminController.forceLogoutStudent);
  });
}

module.exports = userRoutes;
