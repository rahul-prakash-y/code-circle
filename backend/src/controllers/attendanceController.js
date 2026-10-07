const AttendanceSession = require('../models/attendanceSessionModel');
const AttendanceRecord = require('../models/attendanceRecordModel');
const Enrollment = require('../models/enrollmentModel');
const Event = require('../models/eventModel');

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const createSession = async (request, reply) => {
  try {
    const user = request.user;
    const { event: eventId, sessionName, durationMinutes = 60, classHours, hourlyPoints } = request.body || {};

    if (!eventId || !sessionName) {
      return reply.status(400).send({ error: 'Event ID and session name are required' });
    }

    const AttendanceService = require('../services/attendanceService').default || require('../services/attendanceService');
    const session = await AttendanceService.createSession({
      eventId,
      sessionName,
      durationMinutes: Number(durationMinutes) || 60,
      adminId: String(user.id || user._id),
      classHours: Array.isArray(classHours) ? classHours : undefined,
      hourlyPoints: typeof hourlyPoints === 'number' ? hourlyPoints : (hourlyPoints ? Number(hourlyPoints) : undefined),
    });

    return reply.status(201).send(session);
  } catch (error) {
    request.log.error(error);
    return reply.status(400).send({ error: error.message || 'Failed to create attendance session' });
  }
};

const markAttendance = async (request, reply) => {
  try {
    const user = request.user;
    const { otp } = request.body || {};

    if (!otp) return reply.status(400).send({ error: 'OTP is required' });

    const AttendanceService = require('../services/attendanceService').default || require('../services/attendanceService');
    const result = await AttendanceService.markAttendance({
      userId: String(user.id || user._id),
      otp,
    });

    return reply.send(result);
  } catch (error) {
    request.log.error(error);
    return reply.status(400).send({ error: error.message || 'Failed to mark attendance' });
  }
};

const getEventSessions = async (request, reply) => {
  try {
    const { eventId } = request.params;
    const sessions = await AttendanceSession.find({ event: eventId })
      .sort({ createdAt: -1 });

    return reply.send(sessions);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch sessions' });
  }
};

const getSessionAttendance = async (request, reply) => {
  try {
    const { sessionId } = request.params;
    const records = await AttendanceRecord.find({ session: sessionId })
      .populate('user', 'name rollNo email department')
      .sort({ timestamp: -1 });

    return reply.send(records);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch attendance records' });
  }
};

const getUserAttendanceHistory = async (request, reply) => {
  try {
    const user = request.user;

    const records = await AttendanceRecord.find({ user: user._id })
      .populate({
        path: 'session',
        populate: { path: 'event', select: 'title date venueOrLink type' }
      })
      .sort({ timestamp: -1 });

    return reply.send(records);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch attendance history' });
  }
};

const markManualAttendance = async (request, reply) => {
  try {
    const user = request.user;
    const { eventId, studentId, studentIds, sessionId, sessionName, classHours, hourlyPoints } = request.body || {};
    const AttendanceService = require('../services/attendanceService').default || require('../services/attendanceService');

    const result = await AttendanceService.markManualAttendance({
      eventId,
      studentId,
      studentIds,
      sessionId,
      sessionName,
      adminId: String(user.id || user._id),
      classHours: Array.isArray(classHours) ? classHours : undefined,
      hourlyPoints: typeof hourlyPoints === 'number' ? hourlyPoints : (hourlyPoints ? Number(hourlyPoints) : undefined),
    });

    return reply.send(result);
  } catch (error) {
    request.log.error(error);
    return reply.status(400).send({ success: false, error: error.message || 'Failed to mark manual attendance' });
  }
};

const deleteAttendanceRecord = async (request, reply) => {
  try {
    const { recordId } = request.params;
    const AttendanceService = require('../services/attendanceService').default || require('../services/attendanceService');
    const result = await AttendanceService.deleteAttendanceRecord(recordId);
    return reply.send(result);
  } catch (error) {
    request.log.error(error);
    return reply.status(400).send({ success: false, error: error.message || 'Failed to delete record' });
  }
};

const getAttendanceRecords = async (request, reply) => {
  try {
    const { studentId, eventId, sessionId, search, page = '1', limit = '50', all } = request.query || {};
    const AttendanceService = require('../services/attendanceService').default || require('../services/attendanceService');
    const isAll = all === 'true' || all === '1' || limit === '0' || limit === 'all';
    const parsedLimit = isAll ? 0 : (parseInt(limit, 10) || 50);

    const result = await AttendanceService.getAttendanceRecords({
      studentId: studentId ? String(studentId) : undefined,
      eventId: eventId ? String(eventId) : undefined,
      sessionId: sessionId ? String(sessionId) : undefined,
      search: search ? String(search) : undefined,
      page: isAll ? 1 : (parseInt(page, 10) || 1),
      limit: parsedLimit,
      all: isAll,
    });

    return reply.send({ success: true, data: result });
  } catch (error) {
    request.log.error(error);
    return reply.status(400).send({ success: false, error: error.message || 'Failed to fetch attendance records' });
  }
};

const getActiveSession = async (request, reply) => {
  try {
    const { eventId } = request.params;
    const AttendanceService = require('../services/attendanceService').default || require('../services/attendanceService');
    const session = await AttendanceService.getActiveSessionForEvent(eventId);
    return reply.send({ success: true, session });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch active session' });
  }
};

module.exports = {
  createSession,
  markAttendance,
  markManualAttendance,
  deleteAttendanceRecord,
  getEventSessions,
  getSessionAttendance,
  getUserAttendanceHistory,
  getAttendanceRecords,
  getActiveSession,
};
