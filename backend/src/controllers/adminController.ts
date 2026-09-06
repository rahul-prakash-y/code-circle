import { FastifyRequest, FastifyReply } from 'fastify';
import User from '../models/userModel';
import bcrypt from 'bcryptjs';

export const getAllStudents = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const students = await User.find({ 
      role: { $in: ['Student', 'Member', 'Committee'] } 
    }).select('-password -resetPasswordToken -resetPasswordExpires').sort({ createdAt: -1 });
    return reply.send(students);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch students' });
  }
};

export const updateStudentPassword = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const { password } = (request.body || {}) as any;

    if (!password) {
      return reply.status(400).send({ success: false, error: 'Password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(id, { password: hashedPassword });

    if (!user) {
      return reply.status(404).send({ success: false, error: 'Student not found' });
    }

    return reply.send({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to update password' });
  }
};

export const toggleBlockStudent = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const { isBlocked } = (request.body || {}) as any;

    const user = await User.findByIdAndUpdate(
      id, 
      { isBlocked, activeSessionId: isBlocked ? null : undefined }, 
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return reply.status(404).send({ success: false, error: 'Student not found' });
    }

    return reply.send(user);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to update block status' });
  }
};

export const deleteStudent = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return reply.status(404).send({ success: false, error: 'Student not found' });
    }

    return reply.send({ success: true, message: 'Student deleted successfully' });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to delete student' });
  }
};

export const forceLogoutStudent = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const user = await User.findByIdAndUpdate(
      id, 
      { activeSessionId: null }, 
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return reply.status(404).send({ success: false, error: 'Student not found' });
    }

    return reply.send({ success: true, message: 'Student forced to logout successfully' });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to force logout' });
  }
};

export default {
  getAllStudents,
  updateStudentPassword,
  toggleBlockStudent,
  deleteStudent,
  forceLogoutStudent,
};
