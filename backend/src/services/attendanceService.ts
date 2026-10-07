import crypto from 'crypto';
import mongoose from 'mongoose';
import AttendanceSession, { IAttendanceSession } from '../models/attendanceSessionModel';
import AttendanceRecord, { IAttendanceRecord } from '../models/attendanceRecordModel';
import Event from '../models/eventModel';
import User from '../models/userModel';
import attendanceBuffer from './attendanceBuffer';
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
  all?: boolean;
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

    // Prime the high-performance in-memory AttendanceBuffer for instant reads
    attendanceBuffer.setEventOTP(event._id.toString(), otp);

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
    const { studentId, eventId, sessionId, search, page = 1, limit = 50, all } = options;
    const isAll = Boolean(all || limit === 0);
    const parsedLimit = isAll ? 0 : Math.max(1, limit || 50);
    const parsedPage = isAll ? 1 : Math.max(1, page || 1);
    const skip = isAll ? 0 : (parsedPage - 1) * parsedLimit;

    // Filter by student
    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        throw new Error('Invalid student ID format');
      }

      const student = await User.findById(studentId).select(
        'name rollNo email department college year profilePicUrl'
      );
      if (!student) {
        throw new Error('Student not found');
      }

      let query = AttendanceRecord.find({ user: studentId })
        .populate({
          path: 'session',
          populate: {
            path: 'event',
            select: 'title type format date status venueOrLink',
          },
        })
        .sort({ timestamp: -1 });

      if (!isAll && parsedLimit > 0) {
        query = query.skip(skip).limit(parsedLimit);
      }

      const records = await query;
      const total = await AttendanceRecord.countDocuments({ user: studentId });

      return {
        mode: 'student',
        student,
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: parsedLimit > 0 ? Math.ceil(total / parsedLimit) : 1,
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

      const recordFilter: any = { session: { $in: sessionIds } };

      // If search is provided, find user IDs matching term or session names matching term
      if (search && search.trim()) {
        const term = search.trim();
        const searchRegex = new RegExp(term, 'i');
        const matchingUsers = await User.find({
          $or: [
            { name: searchRegex },
            { rollNo: searchRegex },
            { email: searchRegex },
            { department: searchRegex },
          ],
        }).select('_id');

        const matchingSessions = await AttendanceSession.find({
          event: eventId,
          sessionName: searchRegex,
        }).select('_id');

        recordFilter.$or = [
          { user: { $in: matchingUsers.map((u) => u._id) } },
          { session: { $in: matchingSessions.map((s) => s._id) } },
        ];
      }

      let query = AttendanceRecord.find(recordFilter)
        .populate('user', 'name rollNo email department college year profilePicUrl')
        .populate('session', 'sessionName otp otpExpiry')
        .sort({ timestamp: -1 });

      if (!isAll && parsedLimit > 0) {
        query = query.skip(skip).limit(parsedLimit);
      }

      const records = await query;
      const total = await AttendanceRecord.countDocuments(recordFilter);

      return {
        mode: 'event',
        event,
        sessions,
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: parsedLimit > 0 ? Math.ceil(total / parsedLimit) : 1,
        records: records.map((r: any) => ({
          _id: r._id,
          timestamp: r.timestamp,
          user: r.user,
          session: r.session,
        })),
      };
    }

    // Default general query: latest attendance records across the system
    let query = AttendanceRecord.find()
      .populate('user', 'name rollNo email department college year profilePicUrl')
      .populate({
        path: 'session',
        populate: {
          path: 'event',
          select: 'title type format date status',
        },
      })
      .sort({ timestamp: -1 });

    if (!isAll && parsedLimit > 0) {
      query = query.skip(skip).limit(parsedLimit);
    }

    const records = await query;
    const total = await AttendanceRecord.countDocuments();

    return {
      mode: 'general',
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: parsedLimit > 0 ? Math.ceil(total / parsedLimit) : 1,
      records: records.map((r: any) => ({
        _id: r._id,
        timestamp: r.timestamp,
        user: r.user,
        sessionName: r.session?.sessionName,
        event: r.session?.event,
      })),
    };
  }

  /**
   * Admin manual attendance entry: marks attendance for a student (or multiple students) without requiring OTP
   */
  public static async markManualAttendance({
    eventId,
    studentId,
    studentIds,
    sessionId,
    sessionName,
    adminId,
  }: {
    eventId: string;
    studentId?: string;
    studentIds?: string[];
    sessionId?: string;
    sessionName?: string;
    adminId: string;
  }) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error('Invalid event ID format');
    }

    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status === 'Cancelled') {
      throw new Error('Cannot mark attendance for a cancelled event');
    }

    // Resolve or create session
    let session: IAttendanceSession | null = null;
    if (sessionId) {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        throw new Error('Invalid session ID format');
      }
      session = await AttendanceSession.findOne({ _id: sessionId, event: eventId });
      if (!session) {
        throw new Error('Selected session does not belong to this event');
      }
    } else {
      // Look for active unexpired session first
      session = await AttendanceSession.findOne({
        event: eventId,
        isActive: true,
        otpExpiry: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      // If no active session, look for the most recently created session
      if (!session) {
        session = await AttendanceSession.findOne({ event: eventId }).sort({ createdAt: -1 });
      }

      // If still no session exists for the event, auto-create a manual attendance session
      if (!session) {
        const otp = this.generateOTP();
        const title = sessionName?.trim() || 'Manual Attendance Session';
        session = await AttendanceSession.create({
          event: event._id,
          sessionName: title,
          otp,
          otpExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          isActive: true,
          createdBy: new mongoose.Types.ObjectId(adminId),
        });
        attendanceBuffer.setEventOTP(event._id.toString(), otp);
      }
    }

    // Normalize student IDs
    const rawList = studentIds && Array.isArray(studentIds) ? studentIds : (studentId ? [studentId] : []);
    const validIds = rawList.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      throw new Error('Please select at least one valid student to mark attendance');
    }

    const users = await User.find({ _id: { $in: validIds } }).select('_id name rollNo email department college year profilePicUrl');
    if (users.length === 0) {
      throw new Error('Selected student(s) not found in system');
    }

    const newlyMarked: any[] = [];
    const alreadyMarked: any[] = [];

    for (const u of users) {
      // Find existing record in current session OR across any session of this event
      let existing = await AttendanceRecord.findOne({
        session: session._id,
        user: u._id,
      });

      if (!existing) {
        const allEventSessions = await AttendanceSession.find({ event: event._id }).select('_id');
        existing = await AttendanceRecord.findOne({
          session: { $in: allEventSessions.map((s) => s._id) },
          user: u._id,
        });
      }

      if (existing) {
        // Refresh timestamp to NOW so the manual entry floats to the top of verified attendees
        existing.timestamp = new Date();
        existing.session = session._id;
        await existing.save();
        alreadyMarked.push(u);
        newlyMarked.push(u);
      } else {
        await AttendanceRecord.create({
          session: session._id,
          user: u._id,
          timestamp: new Date(),
        });
        newlyMarked.push(u);
      }

      // Synchronize attendanceStatus in Enrollment if enrolled
      try {
        const enrollment = await Enrollment.findOne({
          event: event._id,
          $or: [{ enrolledBy: u._id }, { members: u._id }],
        });

        if (enrollment && !enrollment.attendanceStatus) {
          enrollment.attendanceStatus = true;
          await enrollment.save();
        }
      } catch (enrollErr) {
        console.warn('[AttendanceService] Could not sync enrollment attendanceStatus for manual entry:', enrollErr);
      }
    }

    return {
      success: true,
      message:
        newlyMarked.length > 0
          ? `Successfully marked attendance for ${newlyMarked.length} student${newlyMarked.length > 1 ? 's' : ''}${alreadyMarked.length > 0 ? ` (${alreadyMarked.length} already marked)` : ''}`
          : `Student(s) (${alreadyMarked.length}) already marked present for "${session.sessionName}"`,
      markedCount: newlyMarked.length,
      alreadyMarkedCount: alreadyMarked.length,
      newlyMarked,
      alreadyMarked,
      session: {
        _id: session._id,
        sessionName: session.sessionName,
        otp: session.otp,
      },
    };
  }

  /**
   * Delete attendance record manually (Admin override)
   */
  public static async deleteAttendanceRecord(recordId: string) {
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      throw new Error('Invalid record ID format');
    }

    const record = await AttendanceRecord.findById(recordId).populate<{ session: any }>('session');
    if (!record) {
      throw new Error('Attendance record not found');
    }

    const userId = record.user;
    const eventId = record.session?.event;

    await AttendanceRecord.findByIdAndDelete(recordId);

    // Revert enrollment status if no remaining attendance records for this student in this event
    if (eventId) {
      const eventSessions = await AttendanceSession.find({ event: eventId }).select('_id');
      const remainingCount = await AttendanceRecord.countDocuments({
        user: userId,
        session: { $in: eventSessions.map((s) => s._id) },
      });

      if (remainingCount === 0) {
        try {
          const enrollment = await Enrollment.findOne({
            event: eventId,
            $or: [{ enrolledBy: userId }, { members: userId }],
          });
          if (enrollment && enrollment.attendanceStatus) {
            enrollment.attendanceStatus = false;
            await enrollment.save();
          }
        } catch (err) {
          console.warn('[AttendanceService] Could not revert enrollment attendanceStatus:', err);
        }
      }
    }

    return {
      success: true,
      message: 'Attendance record deleted successfully',
    };
  }
}

export default AttendanceService;
