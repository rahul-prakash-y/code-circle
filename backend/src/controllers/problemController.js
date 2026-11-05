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
    const isPaginated = req.query && req.query.page !== undefined;
    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || (isPaginated ? 20 : 100)));
    const skip = (page - 1) * limit;

    const [problems, total] = await Promise.all([
      Problem.find({}, { testCases: 0 })
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Problem.countDocuments({}),
    ]);

    if (isPaginated) {
      const totalPages = Math.max(1, Math.ceil(total / limit));
      return reply.send({
        success: true,
        problems,
        data: problems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          pages: totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    }

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
