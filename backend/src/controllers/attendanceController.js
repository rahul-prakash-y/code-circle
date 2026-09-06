const AttendanceSession = require('../models/attendanceSessionModel');
const AttendanceRecord = require('../models/attendanceRecordModel');
const Enrollment = require('../models/enrollmentModel');
const Event = require('../models/eventModel');

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const createSession = async (request, reply) => {
  try {
    const user = request.user;
    const { event: eventId, sessionName, durationMinutes = 60 } = request.body;

    if (!eventId || !sessionName) {
      return reply.status(400).send({ error: 'Event ID and session name are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) return reply.status(404).send({ error: 'Event not found' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + durationMinutes * 60000);

    const session = await AttendanceSession.create({
      event: eventId,
      sessionName: sessionName.trim(),
      otp,
      otpExpiry,
      createdBy: user._id
    });

    return reply.status(201).send(session);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to create attendance session' });
  }
};

const markAttendance = async (request, reply) => {
  try {
    const user = request.user;
    const { otp } = request.body;

    if (!otp) return reply.status(400).send({ error: 'OTP is required' });

    // Find active session matching this OTP
    const session = await AttendanceSession.findOne({ 
      otp: otp.trim(), 
      isActive: true,
      otpExpiry: { $gt: new Date() }
    }).populate('event');

    if (!session) {
      return reply.status(400).send({ error: 'Invalid or expired OTP' });
    }

    // Check if user is enrolled in the event
    const enrollment = await Enrollment.findOne({
      event: session.event._id,
      $or: [{ enrolledBy: user._id }, { members: user._id }]
    });

    if (!enrollment) {
      return reply.status(403).send({ error: 'You are not enrolled in this event' });
    }

    // Create attendance record and sync enrollment status
    try {
      await AttendanceRecord.create({
        session: session._id,
        user: user._id
      });

      // Synchronize attendanceStatus on the enrollment
      if (!enrollment.attendanceStatus) {
        enrollment.attendanceStatus = true;
        await enrollment.save();
      }

      return reply.send({ 
        message: `Attendance marked successfully for "${session.sessionName}"`,
        sessionName: session.sessionName
      });
    } catch (err) {
      if (err.code === 11000) {
        return reply.status(400).send({ error: 'Attendance has already been marked for this session' });
      }
      throw err;
    }
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to mark attendance' });
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

module.exports = {
  createSession,
  markAttendance,
  getEventSessions,
  getSessionAttendance,
  getUserAttendanceHistory
};
