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
    const quizzes = await Quiz.find({});
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
