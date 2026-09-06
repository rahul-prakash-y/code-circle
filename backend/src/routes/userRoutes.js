const { getMe, updateMe, getEventPassport } = require('../controllers/userController');
const adminController = require('../controllers/adminController');
const { verifyToken, isAdminOrFaculty } = require('../middleware/authMiddleware');

async function userRoutes(fastify, options) {
  // Public user profile routes
  fastify.register(async (instance) => {
    instance.addHook('preHandler', verifyToken);
    instance.get('/me', getMe);
    instance.put('/me', updateMe);
    instance.get('/passport', getEventPassport);
  });

  // Admin/Faculty student management routes
  fastify.register(async (instance) => {
    instance.addHook('preHandler', verifyToken);
    instance.addHook('preHandler', isAdminOrFaculty);

    instance.get('/students', adminController.getAllStudents);
    instance.put('/students/:id/password', adminController.updateStudentPassword);
    instance.put('/students/:id/block', adminController.toggleBlockStudent);
    instance.delete('/students/:id', adminController.deleteStudent);
    instance.put('/students/:id/logout', adminController.forceLogoutStudent);
  });
}

module.exports = userRoutes;
