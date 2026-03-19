const eventController = require('../controllers/eventController');
const verifyToken = require('../middleware/authMiddleware');

async function eventRoutes(fastify, options) {
  fastify.addHook('preHandler', verifyToken);

  fastify.post('/', eventController.createEvent);
  fastify.get('/', eventController.getEvents);
  fastify.put('/:id', eventController.updateEvent);
  fastify.delete('/:id', eventController.deleteEvent);
}

module.exports = eventRoutes;
