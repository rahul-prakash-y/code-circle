const bearerController = require('../controllers/bearerController');
const verifyToken = require('../middleware/authMiddleware');

async function bearerRoutes(fastify, options) {
  // Public route
  fastify.get('/', bearerController.getBearers);

  // Protected routes
  fastify.register(async function (privateRoutes) {
    privateRoutes.addHook('preHandler', verifyToken);
    
    privateRoutes.post('/', bearerController.createBearer);
    privateRoutes.put('/:id', bearerController.updateBearer);
    privateRoutes.delete('/:id', bearerController.deleteBearer);
  });
}

module.exports = bearerRoutes;
