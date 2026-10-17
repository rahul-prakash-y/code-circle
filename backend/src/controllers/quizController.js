const Quiz = require('../models/quizModel');

const createQuiz = async (req, reply) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    return reply.code(201).send(quiz);
  } catch (error) {
    return reply.code(500).send({ message: error.message });
  }
};

const getQuizzes = async (req, reply) => {
  try {
    const isPaginated = req.query && req.query.page !== undefined;
    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || (isPaginated ? 20 : 100)));
    const skip = (page - 1) * limit;

    const [quizzes, total] = await Promise.all([
      Quiz.find({})
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Quiz.countDocuments({}),
    ]);

    if (isPaginated) {
      const totalPages = Math.max(1, Math.ceil(total / limit));
      return reply.send({
        success: true,
        quizzes,
        data: quizzes,
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

    return reply.send(quizzes);
  } catch (error) {
    return reply.code(500).send({ message: error.message });
  }
};

const getQuizById = async (req, reply) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return reply.code(404).send({ message: 'Quiz not found' });
    return reply.send(quiz);
  } catch (error) {
    return reply.code(500).send({ message: error.message });
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
  getQuizById,
};
