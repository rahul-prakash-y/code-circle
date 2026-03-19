const Problem = require('../models/problemModel');

const createProblem = async (req, reply) => {
  try {
    const problem = new Problem(req.body);
    await problem.save();
    return reply.code(201).send(problem);
  } catch (error) {
    return reply.code(500).send({ message: error.message });
  }
};

const getProblems = async (req, reply) => {
  try {
    const problems = await Problem.find({}, { testCases: 0 }); // Hide test cases in list
    return reply.send(problems);
  } catch (error) {
    return reply.code(500).send({ message: error.message });
  }
};

const getProblemById = async (req, reply) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return reply.code(404).send({ message: 'Problem not found' });
    
    // Send only example test cases (non-hidden) to the frontend
    const publicProblem = problem.toObject();
    publicProblem.testCases = publicProblem.testCases.filter(tc => !tc.isHidden);
    
    return reply.send(publicProblem);
  } catch (error) {
    return reply.code(500).send({ message: error.message });
  }
};

module.exports = {
  createProblem,
  getProblems,
  getProblemById
};
