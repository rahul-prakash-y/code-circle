const { 
  createQuiz, 
  getQuizzes, 
  getQuizById 
} = require('../controllers/quizController');
const verifyToken = require('../middleware/authMiddleware');

async function quizRoutes(fastify, options) {
  fastify.get('/', getQuizzes);
  fastify.get('/:id', getQuizById);
  fastify.post('/', { preHandler: [verifyToken] }, createQuiz);
}

module.exports = quizRoutes;
