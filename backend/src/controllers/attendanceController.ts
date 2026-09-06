import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import AttendanceService from '../services/attendanceService';
import AttendanceSession from '../models/attendanceSessionModel';
import AttendanceRecord from '../models/attendanceRecordModel';

export interface CreateSessionBody {
  event: string;
  sessionName: string;
  durationMinutes?: number;
}

export interface MarkAttendanceBody {
  otp: string;
}

export interface AttendanceRecordsQuery {
  studentId?: string;
  eventId?: string;
  sessionId?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export const createSession = async (
  request: FastifyRequest<{ Body: CreateSessionBody }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { event: eventId, sessionName, durationMinutes = 60 } = request.body;

    if (!eventId || !sessionName) {
      return reply.status(400).send({
        success: false,
        error: 'Event ID and session name are required',
      });
    }

    const session = await AttendanceService.createSession({
      eventId,
      sessionName,
      durationMinutes: Number(durationMinutes) || 60,
      adminId: (user.id || user._id) as string,
    });

    return reply.status(201).send(session);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to create attendance session',
    });
  }
};

export const markAttendance = async (
  request: FastifyRequest<{ Body: MarkAttendanceBody }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { otp } = request.body;

    const result = await AttendanceService.markAttendance({
      userId: (user.id || user._id) as string,
      otp,
    });

    return reply.send(result);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to mark attendance',
    });
  }
};

export const getAttendanceRecords = async (
  request: FastifyRequest<{ Querystring: AttendanceRecordsQuery }>,
  reply: FastifyReply
) => {
  try {
    const { studentId, eventId, sessionId, search, page = '1', limit = '50' } =
      request.query;

    const result = await AttendanceService.getAttendanceRecords({
      studentId: studentId ? String(studentId) : undefined,
      eventId: eventId ? String(eventId) : undefined,
      sessionId: sessionId ? String(sessionId) : undefined,
      search: search ? String(search) : undefined,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
    });

    return reply.send({
      success: true,
      data: result,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to fetch attendance records',
    });
  }
};

export const getActiveSession = async (
  request: FastifyRequest<{ Params: { eventId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { eventId } = request.params;
    const session = await AttendanceService.getActiveSessionForEvent(eventId);

    return reply.send({
      success: true,
      session,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch active session',
    });
  }
};

export const getEventSessions = async (
  request: FastifyRequest<{ Params: { eventId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { eventId } = request.params;
    const sessions = await AttendanceSession.find({ event: eventId }).sort({ createdAt: -1 });

    return reply.send(sessions);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch sessions',
    });
  }
};

export const getSessionAttendance = async (
  request: FastifyRequest<{ Params: { sessionId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { sessionId } = request.params;
    const records = await AttendanceRecord.find({ session: sessionId })
      .populate('user', 'name rollNo email department profilePicUrl')
      .sort({ timestamp: -1 });

    return reply.send(records);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch attendance records',
    });
  }
};

export const getUserAttendanceHistory = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const records = await AttendanceRecord.find({ user: user.id || user._id })
      .populate({
        path: 'session',
        populate: { path: 'event', select: 'title date venueOrLink type format status thumbnail' },
      })
      .sort({ timestamp: -1 });

    return reply.send(records);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch attendance history',
    });
  }
};

export default {
  createSession,
  markAttendance,
  getAttendanceRecords,
  getActiveSession,
  getEventSessions,
  getSessionAttendance,
  getUserAttendanceHistory,
};
