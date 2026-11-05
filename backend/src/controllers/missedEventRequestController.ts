import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import MissedEventRequest from '../models/missedEventRequestModel';
import User from '../models/userModel';
import Event from '../models/eventModel';
import AttendanceRecord from '../models/attendanceRecordModel';
import AttendanceSession from '../models/attendanceSessionModel';
import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';

/**
 * Student creates a missed event request (e.g. missed club hours / workshop).
 * POST /api/missed-event-requests
 */
export const createMissedEventRequest = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Authentication required' });
    }

    const {
      eventId,
      sessionId,
      missedDate,
      classHours,
      clubHoursRequested,
      reason,
      proofUrl,
    } = (request.body || {}) as {
      eventId?: string;
      sessionId?: string;
      missedDate?: string;
      classHours?: number[];
      clubHoursRequested?: number;
      reason?: string;
      proofUrl?: string;
    };

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return reply.status(400).send({ success: false, error: 'Valid eventId is required' });
    }

    if (!reason || !reason.trim()) {
      return reply.status(400).send({ success: false, error: 'Reason for absence is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    const parsedMissedDate = missedDate ? new Date(missedDate) : event.date || new Date();

    // Check for duplicate pending request for this student and event
    const existingPending = await MissedEventRequest.findOne({
      student: new mongoose.Types.ObjectId(user.id),
      event: new mongoose.Types.ObjectId(eventId),
      status: 'PENDING',
    });

    if (existingPending) {
      return reply.status(400).send({
        success: false,
        error: 'You already have a pending missed event request for this event. Please wait for admin review.',
      });
    }

    let parsedSessionId: mongoose.Types.ObjectId | undefined = undefined;
    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      parsedSessionId = new mongoose.Types.ObjectId(sessionId);
    }

    const newRequest = await MissedEventRequest.create({
      student: new mongoose.Types.ObjectId(user.id),
      event: new mongoose.Types.ObjectId(eventId),
      session: parsedSessionId,
      missedDate: parsedMissedDate,
      classHours: Array.isArray(classHours) && classHours.length > 0 ? classHours : [1],
      clubHoursRequested: Number(clubHoursRequested) > 0 ? Number(clubHoursRequested) : 1,
      reason: reason.trim(),
      proofUrl: proofUrl ? proofUrl.trim() : '',
      status: 'PENDING',
    });

    const populated = await MissedEventRequest.findById(newRequest._id)
      .populate('event', 'title type format date hourlyPoints status')
      .populate('student', 'name rollNo email department isRestricted restrictedFeatures');

    return reply.status(201).send({
      success: true,
      message: 'Missed event request submitted successfully. It is now pending administrator review.',
      data: populated,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to submit missed event request',
      details: error.message,
    });
  }
};

/**
 * Student retrieves their own missed event requests.
 * GET /api/missed-event-requests/my
 */
export const getMyMissedEventRequests = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Authentication required' });
    }

    const { page, limit, skip, sort } = parsePaginationParams(request.query as any, {
      defaultLimit: 20,
      maxLimit: 50,
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
      allowedSortFields: ['createdAt', 'missedDate', 'status'],
    });

    const filter = {
      student: new mongoose.Types.ObjectId(user.id),
    };

    const [requests, total] = await Promise.all([
      MissedEventRequest.find(filter)
        .populate('event', 'title type format date hourlyPoints status venueOrLink')
        .populate('session', 'sessionName classHours hourlyPoints totalPoints')
        .populate('reviewedBy', 'name role')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      MissedEventRequest.countDocuments(filter),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      data: requests,
      count: requests.length,
      pagination,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to retrieve your missed event requests',
      details: error.message,
    });
  }
};

/**
 * Admin / Faculty retrieves all missed event requests with search and status filters.
 * GET /api/missed-event-requests
 */
export const getAdminMissedEventRequests = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page, limit, skip, sort } = parsePaginationParams(request.query as any, {
      defaultLimit: 20,
      maxLimit: 100,
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
      allowedSortFields: ['createdAt', 'missedDate', 'status'],
    });

    const {
      status,
      search,
      eventId,
    } = (request.query || {}) as any;

    const filter: any = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.event = new mongoose.Types.ObjectId(eventId);
    }

    // Filter by student name or rollNo if search query provided
    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(sanitized, 'i');
      const matchedStudents = await User.find({
        $or: [{ name: searchRegex }, { rollNo: searchRegex }, { email: searchRegex }],
      }).select('_id');
      const studentIds = matchedStudents.map((s) => s._id);
      filter.student = { $in: studentIds };
    }

    const [total, requests] = await Promise.all([
      MissedEventRequest.countDocuments(filter),
      MissedEventRequest.find(filter)
        .populate('student', 'name rollNo email department year isRestricted restrictionReason restrictedFeatures points')
        .populate('event', 'title type format date hourlyPoints status venueOrLink')
        .populate('session', 'sessionName classHours hourlyPoints totalPoints')
        .populate('reviewedBy', 'name role email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      data: requests,
      count: requests.length,
      pagination,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to retrieve missed event requests',
      details: error.message,
    });
  }
};

/**
 * Admin / Faculty stats for missed requests overview.
 * GET /api/missed-event-requests/stats
 */
export const getMissedEventRequestsStats = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    const [total, pending, approved, rejected, restrictedStudents] = await Promise.all([
      MissedEventRequest.countDocuments(),
      MissedEventRequest.countDocuments({ status: 'PENDING' }),
      MissedEventRequest.countDocuments({ status: 'APPROVED' }),
      MissedEventRequest.countDocuments({ status: 'REJECTED' }),
      User.countDocuments({ isRestricted: true }),
    ]);

    return reply.send({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
        restrictedStudents,
      },
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: 'Failed to retrieve missed event requests statistics',
    });
  }
};

/**
 * Admin / Faculty reviews a missed event request.
 * If REJECTED -> Automatically restricts the student from ['assessments', 'contests', 'courses'].
 * If APPROVED -> Sets status to APPROVED, student is NOT restricted.
 * PATCH /api/missed-event-requests/:id/review
 */
export const reviewMissedEventRequest = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const caller = request.user;
    if (!caller) {
      return reply.status(401).send({ success: false, error: 'Authentication required' });
    }

    const { id } = request.params as { id: string };
    const { action, reviewNote, grantAttendance } = (request.body || {}) as {
      action: 'APPROVE' | 'REJECT';
      reviewNote?: string;
      grantAttendance?: boolean;
    };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid request ID' });
    }

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return reply.status(400).send({ success: false, error: 'Action must be either APPROVE or REJECT' });
    }

    const missedRequest = await MissedEventRequest.findById(id).populate('event', 'title hourlyPoints');
    if (!missedRequest) {
      return reply.status(404).send({ success: false, error: 'Missed event request not found' });
    }

    const studentUser = await User.findById(missedRequest.student);
    if (!studentUser) {
      return reply.status(404).send({ success: false, error: 'Associated student not found' });
    }

    const callerObjId = new mongoose.Types.ObjectId(caller.id);
    const eventTitle = (missedRequest.event as any)?.title || 'Event/Club Hours';

    if (action === 'REJECT') {
      const note = reviewNote?.trim()
        ? reviewNote.trim()
        : 'Absence excuse unverified or rejected by administration.';

      // 1. Update the request status
      missedRequest.status = 'REJECTED';
      missedRequest.reviewedBy = callerObjId;
      missedRequest.reviewedAt = new Date();
      missedRequest.reviewNote = note;
      await missedRequest.save();

      // 2. RESTRICT the student from assessments, contests, and courses
      studentUser.isRestricted = true;
      studentUser.restrictionReason = `Missed event request for "${eventTitle}" was REJECTED: ${note}`;
      studentUser.restrictedFeatures = ['assessments', 'contests', 'courses'];
      studentUser.restrictedAt = new Date();
      await studentUser.save();

      return reply.send({
        success: true,
        action: 'REJECT',
        message: `Request rejected. Student ${studentUser.name} (${studentUser.rollNo}) is now restricted from attending assessments, contests, and courses.`,
        request: missedRequest,
        student: {
          id: studentUser._id,
          name: studentUser.name,
          rollNo: studentUser.rollNo,
          isRestricted: studentUser.isRestricted,
          restrictionReason: studentUser.restrictionReason,
          restrictedFeatures: studentUser.restrictedFeatures,
        },
      });
    }

    // Action === 'APPROVE'
    const note = reviewNote?.trim() || 'Absence approved by administration.';
    missedRequest.status = 'APPROVED';
    missedRequest.reviewedBy = callerObjId;
    missedRequest.reviewedAt = new Date();
    missedRequest.reviewNote = note;
    await missedRequest.save();

    // Optionally grant attendance credit / points if requested and session available
    let attendanceGranted = false;
    if (grantAttendance && missedRequest.session) {
      const existingRecord = await AttendanceRecord.findOne({
        session: missedRequest.session,
        user: studentUser._id,
      });

      if (!existingRecord) {
        const sessionDoc = await AttendanceSession.findById(missedRequest.session);
        const points = sessionDoc?.totalPoints || sessionDoc?.hourlyPoints || 50;

        await AttendanceRecord.create({
          session: missedRequest.session,
          user: studentUser._id,
          timestamp: new Date(),
          pointsAwarded: points,
        });

        // Increment student's club points
        await User.findByIdAndUpdate(studentUser._id, {
          $inc: { points: points },
        });

        attendanceGranted = true;
      }
    }

    return reply.send({
      success: true,
      action: 'APPROVE',
      message: `Request approved for ${studentUser.name} (${studentUser.rollNo}).${
        attendanceGranted ? ' Attendance record and points credited.' : ''
      }`,
      request: missedRequest,
      attendanceGranted,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to review missed event request',
      details: error.message,
    });
  }
};

/**
 * Delete a missed event request (student can delete if pending, admin can delete any).
 * DELETE /api/missed-event-requests/:id
 */
export const deleteMissedEventRequest = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Authentication required' });
    }

    const { id } = request.params as { id: string };
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid request ID' });
    }

    const reqDoc = await MissedEventRequest.findById(id);
    if (!reqDoc) {
      return reply.status(404).send({ success: false, error: 'Request not found' });
    }

    const isAdminOrStaff = ['Admin', 'SuperAdmin', 'Faculty', 'Committee'].includes(user.role);
    const isOwner = reqDoc.student.toString() === user.id;

    if (!isAdminOrStaff && !isOwner) {
      return reply.status(403).send({ success: false, error: 'You are not authorized to delete this request' });
    }

    if (!isAdminOrStaff && reqDoc.status !== 'PENDING') {
      return reply.status(400).send({ success: false, error: 'You can only delete pending requests' });
    }

    await MissedEventRequest.findByIdAndDelete(id);

    return reply.send({
      success: true,
      message: 'Missed event request deleted successfully',
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to delete missed event request',
    });
  }
};

export default {
  createMissedEventRequest,
  getMyMissedEventRequests,
  getAdminMissedEventRequests,
  getMissedEventRequestsStats,
  reviewMissedEventRequest,
  deleteMissedEventRequest,
};
