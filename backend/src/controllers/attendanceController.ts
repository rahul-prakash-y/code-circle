import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import AttendanceService from '../services/attendanceService';
import AttendanceSession from '../models/attendanceSessionModel';
import AttendanceRecord from '../models/attendanceRecordModel';

export interface CreateSessionBody {
  event: string;
  sessionName: string;
  durationMinutes?: number;
  classHours?: number[];
  hourlyPoints?: number;
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
  all?: string;
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

    const { event: eventId, sessionName, durationMinutes = 60, classHours, hourlyPoints } = request.body;

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
      classHours: Array.isArray(classHours) ? classHours : undefined,
      hourlyPoints: typeof hourlyPoints === 'number' ? hourlyPoints : (hourlyPoints ? Number(hourlyPoints) : undefined),
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

import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';

export const getAttendanceRecords = async (
  request: FastifyRequest<{ Querystring: AttendanceRecordsQuery }>,
  reply: FastifyReply
) => {
  try {
    const { studentId, eventId, sessionId, search, page = '1', limit = '50', all } =
      request.query;

    const isAll = all === 'true' || all === '1';
    // Clamp limit safely to max 100 to prevent unbounded retrieval
    const parsedLimit = isAll ? 100 : Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);

    const result = await AttendanceService.getAttendanceRecords({
      studentId: studentId ? String(studentId) : undefined,
      eventId: eventId ? String(eventId) : undefined,
      sessionId: sessionId ? String(sessionId) : undefined,
      search: search ? String(search) : undefined,
      page: parsedPage,
      limit: parsedLimit,
      all: false,
    });

    const pagination = buildPaginationMeta(result.total, parsedPage, parsedLimit);

    return reply.send({
      success: true,
      data: result,
      records: result.records,
      pagination,
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
    const sessions = await AttendanceSession.find({ event: eventId }).sort({ createdAt: -1 }).lean();

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
  request: FastifyRequest<{ Params: { sessionId: string }; Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) => {
  try {
    const { sessionId } = request.params;
    const { page, limit, skip } = parsePaginationParams(request.query || {}, {
      defaultPage: 1,
      defaultLimit: 50,
      maxLimit: 100,
    });

    const filter = { session: sessionId };
    const [total, records] = await Promise.all([
      AttendanceRecord.countDocuments(filter),
      AttendanceRecord.find(filter)
        .populate('user', 'name rollNo email department profilePicUrl')
        .sort({ timestamp: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      data: records,
      records,
      pagination,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch attendance records',
    });
  }
};

export const getUserAttendanceHistory = async (
  request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { page, limit, skip } = parsePaginationParams(request.query || {}, {
      defaultPage: 1,
      defaultLimit: 20,
      maxLimit: 100,
    });

    const filter = { user: user.id || user._id };
    const [total, records] = await Promise.all([
      AttendanceRecord.countDocuments(filter),
      AttendanceRecord.find(filter)
        .populate({
          path: 'session',
          populate: { path: 'event', select: 'title date venueOrLink type format status thumbnail' },
        })
        .sort({ timestamp: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      data: records,
      records,
      pagination,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch attendance history',
    });
  }
};

export interface MarkManualAttendanceBody {
  eventId: string;
  studentId?: string;
  studentIds?: string[];
  sessionId?: string;
  sessionName?: string;
  classHours?: number[];
  hourlyPoints?: number;
}

export const markManualAttendance = async (
  request: FastifyRequest<{ Body: MarkManualAttendanceBody }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { eventId, studentId, studentIds, sessionId, sessionName, classHours, hourlyPoints } = request.body || {};

    if (!eventId) {
      return reply.status(400).send({
        success: false,
        error: 'Event ID is required',
      });
    }

    const result = await AttendanceService.markManualAttendance({
      eventId,
      studentId,
      studentIds,
      sessionId,
      sessionName,
      adminId: (user.id || user._id) as string,
      classHours: Array.isArray(classHours) ? classHours : undefined,
      hourlyPoints: typeof hourlyPoints === 'number' ? hourlyPoints : (hourlyPoints ? Number(hourlyPoints) : undefined),
    });

    return reply.status(200).send(result);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to mark manual attendance',
    });
  }
};

export const deleteAttendanceRecord = async (
  request: FastifyRequest<{ Params: { recordId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { recordId } = request.params;
    const result = await AttendanceService.deleteAttendanceRecord(recordId);
    return reply.send(result);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to delete attendance record',
    });
  }
};

export default {
  createSession,
  markAttendance,
  markManualAttendance,
  deleteAttendanceRecord,
  getAttendanceRecords,
  getActiveSession,
  getEventSessions,
  getSessionAttendance,
  getUserAttendanceHistory,
};
