const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const getAllStudents = async (request, reply) => {
  try {
    const students = await User.find({ 
      role: { $in: ['Student', 'Member', 'Committee'] } 
    }).select('-password').sort({ createdAt: -1 });
    return reply.send(students);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch students' });
  }
};

const updateStudentPassword = async (request, reply) => {
  try {
    const { id } = request.params;
    const { password } = request.body;

    if (!password) {
      return reply.status(400).send({ error: 'Password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(id, { password: hashedPassword });

    if (!user) {
      return reply.status(404).send({ error: 'Student not found' });
    }

    return reply.send({ message: 'Password updated successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to update password' });
  }
};

const toggleBlockStudent = async (request, reply) => {
  try {
    const { id } = request.params;
    const { isBlocked } = request.body;

    const user = await User.findByIdAndUpdate(id, { isBlocked }, { new: true }).select('-password');

    if (!user) {
      return reply.status(404).send({ error: 'Student not found' });
    }

    return reply.send(user);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to update block status' });
  }
};

const deleteStudent = async (request, reply) => {
  try {
    const { id } = request.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return reply.status(404).send({ error: 'Student not found' });
    }

    return reply.send({ message: 'Student deleted successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to delete student' });
  }
};

const forceLogoutStudent = async (request, reply) => {
  try {
    const { id } = request.params;
    const user = await User.findByIdAndUpdate(id, { activeSessionId: null }, { new: true }).select('-password');

    if (!user) {
      return reply.status(404).send({ error: 'Student not found' });
    }

    return reply.send({ message: 'Student forced to logout successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to force logout' });
  }
};

module.exports = {
  getAllStudents,
  updateStudentPassword,
  toggleBlockStudent,
  deleteStudent,
  forceLogoutStudent
};
