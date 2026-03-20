const AttendanceSession = require('../models/attendanceSessionModel');
const AttendanceRecord = require('../models/attendanceRecordModel');
const Enrollment = require('../models/enrollmentModel');
const User = require('../models/userModel');
const Event = require('../models/eventModel');

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const createSession = async (request, reply) => {
  try {
    const { email } = request.user;
    const user = await User.findOne({ email });

    if (!user || (user.role !== 'Admin' && user.role !== 'Faculty')) {
      return reply.status(403).send({ error: 'Only Admins and Faculty can create attendance sessions' });
    }

    const { event: eventId, sessionName, durationMinutes = 60 } = request.body;

    const event = await Event.findById(eventId);
    if (!event) return reply.status(404).send({ error: 'Event not found' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + durationMinutes * 60000);

    const session = await AttendanceSession.create({
      event: eventId,
      sessionName,
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
    const { email } = request.user;
    const user = await User.findOne({ email });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const { otp } = request.body;
    if (!otp) return reply.status(400).send({ error: 'OTP is required' });

    // Find active session with this OTP
    const session = await AttendanceSession.findOne({ 
      otp, 
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

    // Create attendance record
    try {
      await AttendanceRecord.create({
        session: session._id,
        user: user._id
      });
      return reply.send({ message: `Attendance marked for ${session.sessionName}` });
    } catch (err) {
      if (err.code === 11000) {
        return reply.status(400).send({ error: 'Attendance already marked for this session' });
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
    const sessions = await AttendanceSession.find({ event: eventId }).sort({ createdAt: -1 });
    return reply.send(sessions);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch sessions' });
  }
};

const getSessionAttendance = async (request, reply) => {
  try {
    const { email } = request.user;
    const user = await User.findOne({ email });
    if (!user || (user.role !== 'Admin' && user.role !== 'Faculty')) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const { sessionId } = request.params;
    const records = await AttendanceRecord.find({ session: sessionId })
      .populate('user', 'name rollNo email')
      .sort({ timestamp: -1 });

    return reply.send(records);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch attendance records' });
  }
};

const getUserAttendanceHistory = async (request, reply) => {
  try {
    const { email } = request.user;
    const user = await User.findOne({ email });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const records = await AttendanceRecord.find({ user: user._id })
      .populate({
        path: 'session',
        populate: { path: 'event', select: 'title date thumbnail' }
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
