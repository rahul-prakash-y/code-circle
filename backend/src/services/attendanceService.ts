import crypto from 'crypto';
import mongoose from 'mongoose';
import AttendanceSession, { IAttendanceSession } from '../models/attendanceSessionModel';
import AttendanceRecord, { IAttendanceRecord } from '../models/attendanceRecordModel';
import Event from '../models/eventModel';
import User from '../models/userModel';
const Enrollment = require('../models/enrollmentModel');

export interface CreateSessionInput {
  eventId: string;
  sessionName: string;
  durationMinutes?: number;
  adminId: string;
}

export interface MarkAttendanceInput {
  userId: string;
  otp: string;
}

export interface AttendanceFilterOptions {
  studentId?: string;
  eventId?: string;
  sessionId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Service to manage OTP-based attendance workflows
 */
export class AttendanceService {
  /**
   * Generates a cryptographically secure 6-digit numeric OTP string
   */
  public static generateOTP(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Generates a time-sensitive 6-digit OTP for a specific active event
   */
  public static async createSession({
    eventId,
    sessionName,
    durationMinutes = 60,
    adminId,
  }: CreateSessionInput) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error('Invalid event ID format');
    }

    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status === 'Cancelled') {
      throw new Error('Cannot create an attendance session for a cancelled event');
    }

    // Automatically expire previous active sessions for this event to avoid confusion
    await AttendanceSession.updateMany(
      { event: eventId, isActive: true },
      { $set: { isActive: false } }
    );

    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + Math.max(1, durationMinutes) * 60 * 1000);

    const session = await AttendanceSession.create({
      event: event._id,
      sessionName: sessionName.trim(),
      otp,
      otpExpiry,
      isActive: true,
      createdBy: new mongoose.Types.ObjectId(adminId),
    });

    return {
      _id: session._id,
      event: {
        _id: event._id,
        title: event.title,
        type: event.type,
        format: event.format,
        date: event.date,
        status: event.status,
      },
      sessionName: session.sessionName,
      otp: session.otp,
      otpExpiry: session.otpExpiry,
      durationMinutes,
      isActive: session.isActive,
      createdAt: session.createdAt,
    };
  }

  /**
   * Submits student 6-digit OTP to verify presence
   */
  public static async markAttendance({ userId, otp }: MarkAttendanceInput) {
    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      throw new Error('Please provide a valid 6-digit OTP');
    }

    const cleanOtp = otp.trim();

    // Find active, unexpired session for this OTP
    const session = await AttendanceSession.findOne({
      otp: cleanOtp,
      isActive: true,
      otpExpiry: { $gt: new Date() },
    }).populate<{ event: any }>('event');

    if (!session) {
      throw new Error('Invalid or expired OTP code');
    }

    if (!session.event || session.event.status === 'Cancelled') {
      throw new Error('Event is currently cancelled. Attendance cannot be accepted.');
    }

    // Check if user already marked attendance for this session
    const existingRecord = await AttendanceRecord.findOne({
      session: session._id,
      user: userId,
    });

    if (existingRecord) {
      throw new Error('Attendance has already been marked for this session');
    }

    // Record attendance
    const record = await AttendanceRecord.create({
      session: session._id,
      user: new mongoose.Types.ObjectId(userId),
      timestamp: new Date(),
    });

    // Synchronize attendanceStatus in Enrollment if enrolled
    try {
      const enrollment = await Enrollment.findOne({
        event: session.event._id,
        $or: [{ enrolledBy: userId }, { members: userId }],
      });

      if (enrollment && !enrollment.attendanceStatus) {
        enrollment.attendanceStatus = true;
        await enrollment.save();
      }
    } catch (enrollErr) {
      console.warn('[AttendanceService] Could not sync enrollment attendanceStatus:', enrollErr);
    }

    return {
      success: true,
      message: `Attendance marked successfully for "${session.sessionName}"`,
      recordId: record._id,
      event: {
        _id: session.event._id,
        title: session.event.title,
        date: session.event.date,
        type: session.event.type,
        format: session.event.format,
      },
      sessionName: session.sessionName,
      timestamp: record.timestamp,
    };
  }

  /**
   * Retrieves currently active session for an event, including remaining countdown
   */
  public static async getActiveSessionForEvent(eventId: string) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) return null;

    const session = await AttendanceSession.findOne({
      event: eventId,
      isActive: true,
      otpExpiry: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate('event', 'title type format status date');

    if (!session) return null;

    const remainingSeconds = Math.max(
      0,
      Math.floor((new Date(session.otpExpiry).getTime() - Date.now()) / 1000)
    );

    return {
      ...session.toObject(),
      remainingSeconds,
    };
  }

  /**
   * Admin view: Query attendance records filtered by specific Student OR specific Event
   */
  public static async getAttendanceRecords(options: AttendanceFilterOptions) {
    const { studentId, eventId, sessionId, search, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    // Filter by student
    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        throw new Error('Invalid student ID format');
      }

      const student = await User.findById(studentId).select(
        'name rollNo email department profilePicUrl'
      );
      if (!student) {
        throw new Error('Student not found');
      }

      const records = await AttendanceRecord.find({ user: studentId })
        .populate({
          path: 'session',
          populate: {
            path: 'event',
            select: 'title type format date status venueOrLink',
          },
        })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      const total = await AttendanceRecord.countDocuments({ user: studentId });

      return {
        mode: 'student',
        student,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        records: records.map((r: any) => ({
          _id: r._id,
          timestamp: r.timestamp,
          sessionName: r.session?.sessionName || 'General Session',
          otp: r.session?.otp,
          event: r.session?.event || null,
        })),
      };
    }

    // Filter by event
    if (eventId) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new Error('Invalid event ID format');
      }

      const event = await Event.findById(eventId).select(
        'title description type format date status venueOrLink'
      );
      if (!event) {
        throw new Error('Event not found');
      }

      // Find all sessions for this event
      const sessionQuery: any = { event: eventId };
      if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
        sessionQuery._id = sessionId;
      }

      const sessions = await AttendanceSession.find(sessionQuery).select('_id sessionName otp otpExpiry isActive');
      const sessionIds = sessions.map((s) => s._id);

      const records = await AttendanceRecord.find({ session: { $in: sessionIds } })
        .populate('user', 'name rollNo email department profilePicUrl')
        .populate('session', 'sessionName otp otpExpiry')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      // Search filter in-memory or on populated fields if requested
      let filteredRecords = records;
      if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        filteredRecords = records.filter((r: any) => {
          const user = r.user;
          return (
            user?.name?.toLowerCase().includes(term) ||
            user?.rollNo?.toLowerCase().includes(term) ||
            user?.email?.toLowerCase().includes(term) ||
            user?.department?.toLowerCase().includes(term)
          );
        });
      }

      const total = await AttendanceRecord.countDocuments({ session: { $in: sessionIds } });

      return {
        mode: 'event',
        event,
        sessions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        records: filteredRecords.map((r: any) => ({
          _id: r._id,
          timestamp: r.timestamp,
          user: r.user,
          session: r.session,
        })),
      };
    }

    // Default general query: latest attendance records across the system
    const records = await AttendanceRecord.find()
      .populate('user', 'name rollNo email department profilePicUrl')
      .populate({
        path: 'session',
        populate: {
          path: 'event',
          select: 'title type format date status',
        },
      })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AttendanceRecord.countDocuments();

    return {
      mode: 'general',
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      records: records.map((r: any) => ({
        _id: r._id,
        timestamp: r.timestamp,
        user: r.user,
        sessionName: r.session?.sessionName,
        event: r.session?.event,
      })),
    };
  }
}

export default AttendanceService;
