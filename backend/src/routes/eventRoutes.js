const eventController = require('../controllers/eventController');
const { verifyToken, isAdminOrFaculty } = require('../middleware/authMiddleware');

async function eventRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyToken);

  fastify.get('/', eventController.getEvents);
  
  // Administrative event management
  fastify.post('/', { preHandler: [isAdminOrFaculty] }, eventController.createEvent);
  fastify.put('/:id', { preHandler: [isAdminOrFaculty] }, eventController.updateEvent);
  fastify.delete('/:id', { preHandler: [isAdminOrFaculty] }, eventController.deleteEvent);
}

module.exports = eventRoutes;
