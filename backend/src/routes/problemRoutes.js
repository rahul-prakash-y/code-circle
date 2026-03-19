const { 
  createProblem, 
  getProblems, 
  getProblemById 
} = require('../controllers/problemController');
const { submitCode } = require('../controllers/submissionController');
const verifyToken = require('../middleware/authMiddleware');

async function problemRoutes(fastify, options) {
  fastify.get('/', getProblems);
  fastify.get('/:id', getProblemById);
  fastify.post('/', { preHandler: [verifyToken] }, createProblem);
  fastify.post('/:id/submit', { preHandler: [verifyToken] }, submitCode);
}

module.exports = problemRoutes;
