import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import Event, { EventType, EventFormat, EventStatus, ICustomField } from '../models/eventModel';
import Enrollment from '../models/enrollmentModel';
import AttendanceSession from '../models/attendanceSessionModel';
import AttendanceRecord from '../models/attendanceRecordModel';
import Attendance from '../models/attendanceModel';
import Team from '../models/teamModel';
import Feedback from '../models/feedbackModel';
import MissedEventRequest from '../models/missedEventRequestModel';
import { IssuedCertificate, CertificateTemplate } from '../models/certificateModel';
import Assessment from '../models/assessmentModel';
import User from '../models/userModel';
import EventArenaSubmission from '../models/eventArenaSubmissionModel';

export interface CreateEventBody {
  title: string;
  description: string;
  type?: EventType;
  format?: EventFormat;
  registrationType?: 'open' | 'admin_upload';
  date: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  hourlyPoints?: number;
  status?: EventStatus;
  venueOrLink?: string;
  maxParticipants?: number;
  maxTeamSize?: number;
  registrationDeadline?: string | Date;
  certificateTemplateUrl?: string;
  certificateTemplateId?: string;
  customFields?: ICustomField[];
}

export interface GetEventsQuery {
  status?: string;
  type?: string;
  format?: string;
  search?: string;
}

export const createEvent = async (
  request: FastifyRequest<{ Body: CreateEventBody }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const {
      title,
      description,
      type = 'Technical',
      format = 'Individual',
      registrationType = 'open',
      date,
      startDate,
      endDate,
      hourlyPoints = 50,
      status = 'Upcoming',
      venueOrLink = 'Campus / Online',
      maxParticipants = 0,
      maxTeamSize = 4,
      registrationDeadline,
      certificateTemplateUrl = '',
      certificateTemplateId,
      customFields = [],
    } = request.body;

    if (!title || !description || (!date && !startDate)) {
      return reply.status(400).send({
        success: false,
        error: 'Title, description, and event date are required fields',
      });
    }

    const eventDate = startDate ? new Date(startDate) : (date ? new Date(date) : new Date());
    const evStartDate = startDate ? new Date(startDate) : eventDate;
    const evEndDate = endDate ? new Date(endDate) : evStartDate;

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      type,
      format,
      registrationType: registrationType === 'admin_upload' ? 'admin_upload' : 'open',
      date: eventDate,
      startDate: evStartDate,
      endDate: evEndDate,
      hourlyPoints: Number(hourlyPoints) >= 0 ? Number(hourlyPoints) : 50,
      status,
      venueOrLink: venueOrLink.trim(),
      maxParticipants: Number(maxParticipants) >= 0 ? Number(maxParticipants) : 0,
      maxTeamSize: format === 'Duo' ? 2 : (Number(maxTeamSize) > 0 ? Number(maxTeamSize) : 4),
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : eventDate,
      certificateTemplateUrl: certificateTemplateUrl ? certificateTemplateUrl.trim() : '',
      certificateTemplateId: certificateTemplateId && mongoose.Types.ObjectId.isValid(certificateTemplateId) ? new mongoose.Types.ObjectId(certificateTemplateId) : undefined,
      customFields: Array.isArray(customFields) ? customFields : [],
      createdBy: new mongoose.Types.ObjectId(user.id || user._id),
    });

    if (certificateTemplateId && mongoose.Types.ObjectId.isValid(certificateTemplateId)) {
      const tmpl = await CertificateTemplate.findByIdAndUpdate(
        certificateTemplateId,
        { $set: { associatedEventId: event._id } },
        { new: true }
      );
      if (tmpl && tmpl.bgImageUrl && !event.certificateTemplateUrl) {
        event.certificateTemplateUrl = tmpl.bgImageUrl;
        await event.save();
      }
    }

    return reply.status(201).send(event);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to create event',
    });
  }
};

import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';

export interface GetEventsQuery {
  status?: string;
  type?: string;
  format?: string;
  search?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const getEvents = async (
  request: FastifyRequest<{ Querystring: GetEventsQuery }>,
  reply: FastifyReply
) => {
  try {
    const { status, type, format, search } = request.query;
    const { page, limit, skip, sort } = parsePaginationParams(request.query, {
      defaultPage: 1,
      defaultLimit: 20,
      maxLimit: 100,
      allowedSortFields: ['date', 'title', 'status', 'type', 'format', 'createdAt', 'startDate', 'endDate'],
      defaultSortBy: 'date',
      defaultSortOrder: 'asc',
    });

    const query: any = {};
    const now = new Date();

    if (status) {
      const lower = status.toLowerCase();
      if (lower === 'upcoming') {
        query.date = { $gte: now };
        query.status = { $ne: 'Cancelled' };
      } else if (lower === 'past' || lower === 'completed') {
        query.$or = [{ date: { $lt: now } }, { status: 'Completed' }];
      } else if (lower === 'live') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        query.$or = [
          { status: { $regex: /^live$/i } },
          {
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $nin: ['Cancelled', 'Completed'] },
          },
        ];
      } else if (lower === 'cancelled') {
        query.status = 'Cancelled';
      } else {
        query.status = status;
      }
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (format && format !== 'all') {
      query.format = format;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: regex }, { description: regex }, { venueOrLink: regex }];
    }

    const [total, events] = await Promise.all([
      Event.countDocuments(query),
      Event.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email profilePicUrl role')
        .populate('arenaAdmins', 'name email profilePicUrl role rollNo department')
        .populate('certificateTemplateId', 'title subtitle theme type bgImageUrl primaryColor accentColor')
        .lean(),
    ]);

    const eventIds = events.map((e: any) => e._id);
    const enrollments = await (Enrollment as any).find({ event: { $in: eventIds } }).lean();
    const countMap: Record<string, number> = {};
    const participantCountMap: Record<string, number> = {};
    for (const enr of enrollments) {
      const evId = enr.event.toString();
      const count = 1 + (enr.members?.length || 0);
      if (!enr.isWalkIn) {
        countMap[evId] = (countMap[evId] || 0) + count;
      }
      if (enr.attendanceStatus) {
        participantCountMap[evId] = (participantCountMap[evId] || 0) + count;
      }
    }

    const eventsWithCounts = events.map((e: any) => ({
      ...e,
      enrolledCount: countMap[e._id.toString()] || 0,
      participantsCount: participantCountMap[e._id.toString()] || 0,
    }));

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      data: eventsWithCounts,
      events: eventsWithCounts,
      pagination,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch events',
    });
  }
};

export const getEventById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid event ID' });
    }

    const event = await Event.findById(id)
      .populate('createdBy', 'name email profilePicUrl role')
      .populate('arenaAdmins', 'name email profilePicUrl role rollNo department')
      .populate('certificateTemplateId', 'title subtitle theme type bgImageUrl primaryColor accentColor');

    if (!event) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    const enrollments = await (Enrollment as any).find({ event: event._id });
    const enrolledCount = enrollments
      .filter((enr: any) => !enr.isWalkIn)
      .reduce(
        (sum: number, enr: any) => sum + 1 + (enr.members?.length || 0),
        0
      );
    const participantsCount = enrollments
      .filter((enr: any) => enr.attendanceStatus)
      .reduce(
        (sum: number, enr: any) => sum + 1 + (enr.members?.length || 0),
        0
      );

    const obj: any = event.toObject ? event.toObject() : { ...event };
    obj.enrolledCount = enrolledCount;
    obj.participantsCount = participantsCount;

    return reply.send(obj);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch event',
    });
  }
};

export const updateEvent = async (
  request: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateEventBody> }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid event ID' });
    }

    const updateData: any = { ...request.body };

    if (updateData.maxParticipants !== undefined) {
      updateData.maxParticipants = Number(updateData.maxParticipants) >= 0 ? Number(updateData.maxParticipants) : 0;
    }
    if (updateData.maxTeamSize !== undefined) {
      updateData.maxTeamSize = Number(updateData.maxTeamSize) > 0 ? Number(updateData.maxTeamSize) : 4;
    }

    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
      if (!updateData.date) updateData.date = updateData.startDate;
    }

    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    if (updateData.hourlyPoints !== undefined) {
      updateData.hourlyPoints = Number(updateData.hourlyPoints) >= 0 ? Number(updateData.hourlyPoints) : 50;
    }

    if (updateData.registrationDeadline) {
      updateData.registrationDeadline = new Date(updateData.registrationDeadline);
    }

    if (updateData.registrationType !== undefined) {
      updateData.registrationType = updateData.registrationType === 'admin_upload' ? 'admin_upload' : 'open';
    }

    if (updateData.certificateTemplateId !== undefined) {
      if (updateData.certificateTemplateId && mongoose.Types.ObjectId.isValid(updateData.certificateTemplateId)) {
        updateData.certificateTemplateId = new mongoose.Types.ObjectId(updateData.certificateTemplateId);
        const tmpl = await CertificateTemplate.findByIdAndUpdate(
          updateData.certificateTemplateId,
          { $set: { associatedEventId: id } },
          { new: true }
        );
        if (tmpl && tmpl.bgImageUrl && !updateData.certificateTemplateUrl) {
          updateData.certificateTemplateUrl = tmpl.bgImageUrl;
        }
      } else {
        updateData.certificateTemplateId = null;
      }
    }

    const event = await Event.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!event) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    return reply.send(event);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to update event',
    });
  }
};

export const deleteEvent = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid event ID' });
    }

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    const eventObjectId = new mongoose.Types.ObjectId(id);

    // Cascade delete related records across the system
    // 1. Delete all student enrollments for this event
    await (Enrollment as any).deleteMany({
      $or: [{ event: id }, { event: eventObjectId }],
    });

    // 2. Cascade delete attendance sessions & student attendance records
    const sessions = await AttendanceSession.find({
      $or: [{ event: id }, { event: eventObjectId }],
    })
      .select('_id')
      .lean();
    const sessionIds = sessions.map((s: any) => s._id);
    if (sessionIds.length > 0) {
      await AttendanceRecord.deleteMany({ session: { $in: sessionIds } });
      await AttendanceSession.deleteMany({ _id: { $in: sessionIds } });
    }

    // 3. Delete direct attendance records (legacy Attendance collection)
    await Attendance.deleteMany({
      $or: [{ event: id }, { event: eventObjectId }, { eventId: String(id) }],
    });

    // 4. Delete teams formed specifically for this event
    await Team.deleteMany({
      $or: [{ event: id }, { event: eventObjectId }],
    });

    // 5. Delete feedbacks for this event
    await Feedback.deleteMany({
      $or: [{ event: id }, { event: eventObjectId }],
    });

    // 6. Delete missed event requests for this event
    await MissedEventRequest.deleteMany({
      $or: [{ event: id }, { event: eventObjectId }],
    });

    // 7. Delete issued certificates associated with this event
    await IssuedCertificate.deleteMany({
      $or: [{ associatedEventId: id }, { associatedEventId: eventObjectId }],
    });

    // 8. Disassociate any assessments linked to this event
    await Assessment.updateMany(
      { $or: [{ eventId: id }, { eventId: eventObjectId }] },
      { $set: { eventId: null } }
    );

    return reply.send({
      success: true,
      message: 'Event and all associated student enrollments and records deleted successfully',
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to delete event',
    });
  }
};

export const blockStudent = async (
  request: FastifyRequest<{
    Params: { eventId?: string; id?: string };
    Body?: { studentId?: string; reason?: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const eventId = request.params.eventId || request.params.id;
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return reply.status(400).send({ success: false, error: 'Invalid or missing Event ID' });
    }

    let targetStudentId = user.id || user._id;
    if (request.body?.studentId && (user.role === 'Admin' || user.role === 'SuperAdmin' || user.role === 'Faculty')) {
      targetStudentId = request.body.studentId;
    }

    if (!targetStudentId || !mongoose.Types.ObjectId.isValid(targetStudentId)) {
      return reply.status(400).send({ success: false, error: 'Invalid student ID' });
    }

    const eventObjectId = new mongoose.Types.ObjectId(eventId);
    const studentObjectId = new mongoose.Types.ObjectId(targetStudentId);

    let enrollment = await Enrollment.findOne({
      event: eventObjectId,
      $or: [{ enrolledBy: studentObjectId }, { members: studentObjectId }],
    });

    if (enrollment) {
      enrollment.isBlocked = true;
      await enrollment.save();
    } else {
      enrollment = await Enrollment.create({
        event: eventObjectId,
        enrolledBy: studentObjectId,
        type: 'Individual',
        members: [studentObjectId],
        isBlocked: true,
      });
    }

    request.log.warn(
      `Anti-Cheat Triggered: Student ${targetStudentId} has been blocked for navigating away in event ${eventId}`
    );

    return reply.send({
      success: true,
      message: 'You have been blocked for navigating away. Contact Admin.',
      isBlocked: true,
      eventId,
      studentId: targetStudentId,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to block student',
    });
  }
};

export const unblockStudent = async (
  request: FastifyRequest<{
    Params: { eventId?: string; id?: string };
    Body: { studentId: string; unblockAll?: boolean };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const eventId = request.params.eventId || request.params.id;
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return reply.status(400).send({ success: false, error: 'Invalid or missing Event ID' });
    }

    const { studentId, unblockAll } = request.body || {};
    if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
      return reply.status(400).send({ success: false, error: 'Valid studentId is required' });
    }

    let targetStudentId = studentId.trim();
    let targetUser: any = null;
    if (mongoose.Types.ObjectId.isValid(targetStudentId)) {
      targetUser = await User.findById(targetStudentId).select('_id name email rollNo').lean();
    }
    if (!targetUser) {
      targetUser = await User.findOne({
        $or: [
          { rollNo: targetStudentId.toUpperCase() },
          { rollNo: targetStudentId },
          { email: targetStudentId.toLowerCase() },
          { email: targetStudentId },
        ],
      }).select('_id name email rollNo').lean();
    }

    if (targetUser) {
      targetStudentId = targetUser._id.toString();
    } else {
      return reply.status(404).send({
        success: false,
        error: `Student '${studentId}' could not be found by Roll No, Email, or ID`,
      });
    }

    const eventObjectId = new mongoose.Types.ObjectId(eventId);
    const studentObjectId = new mongoose.Types.ObjectId(targetStudentId);

    // 1. Unblock matching registrations/enrollments for this event (or all events if unblockAll is true)
    const enrollmentFilter: any = unblockAll
      ? { $or: [{ enrolledBy: studentObjectId }, { members: studentObjectId }] }
      : { event: eventObjectId, $or: [{ enrolledBy: studentObjectId }, { members: studentObjectId }] };

    const updateResult = await Enrollment.updateMany(
      enrollmentFilter,
      {
        $set: { isBlocked: false },
      }
    );

    // If no enrollment existed at all for this event, ensure an unblocked enrollment record is registered
    if (!unblockAll && updateResult.matchedCount === 0) {
      await Enrollment.findOneAndUpdate(
        {
          event: eventObjectId,
          $or: [{ enrolledBy: studentObjectId }, { members: studentObjectId }],
        },
        {
          $set: {
            event: eventObjectId,
            enrolledBy: studentObjectId,
            type: 'Individual',
            members: [studentObjectId],
            isBlocked: false,
          },
        },
        { upsert: true, new: true }
      );
    }

    // 2. Clear any user-level proctoring restrictions on the User record
    await User.findByIdAndUpdate(studentObjectId, {
      $set: {
        isRestricted: false,
        restrictionReason: '',
        restrictedFeatures: [],
        isBlocked: false,
        unblockedAt: new Date(),
        unblockedBy: user._id || user.id,
      },
    });

    // 3. Log unblock event in active Arena submissions if any
    try {
      await EventArenaSubmission.updateMany(
        { eventId: eventObjectId, userId: studentObjectId },
        {
          $push: {
            integrityEvents: {
              type: 'ADMIN_UNBLOCKED',
              timestamp: new Date(),
              details: `Unblocked by admin ${user.name || user.email || user.role}${unblockAll ? ' (All system restrictions cleared)' : ''}`,
            },
          },
        }
      );
    } catch {
      // Non-critical audit trail update
    }

    request.log.info(
      `Admin ${user.id || user._id} unblocked student ${targetStudentId} for event ${eventId}`
    );

    return reply.send({
      success: true,
      message: `${targetUser.name || 'Student'} unblocked successfully.${unblockAll ? ' All restrictions cleared.' : ''}`,
      isBlocked: false,
      eventId,
      studentId: targetStudentId,
      unblockAll: Boolean(unblockAll),
      student: {
        _id: targetStudentId,
        name: targetUser.name,
        email: targetUser.email,
        rollNo: targetUser.rollNo,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to unblock student',
    });
  }
};

/**
 * GET /api/events/:eventId/anti-cheat/status
 * Check if the currently authenticated user (or specified student) is blocked for this event.
 */
export const getStudentAntiCheatStatus = async (
  request: FastifyRequest<{
    Params: { eventId?: string; id?: string };
    Querystring: { studentId?: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const eventId = request.params.eventId || request.params.id;
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return reply.status(400).send({ success: false, error: 'Invalid or missing Event ID' });
    }

    const isAdminRole = ['Admin', 'SuperAdmin', 'Faculty', 'Committee'].includes(user.role);
    let targetUserId = user.id || user._id;
    if (isAdminRole && request.query.studentId && mongoose.Types.ObjectId.isValid(request.query.studentId)) {
      targetUserId = request.query.studentId;
    }

    const eventObjectId = new mongoose.Types.ObjectId(eventId);
    const userObjectId = new mongoose.Types.ObjectId(targetUserId);

    // Check if any enrollment record is currently blocked in this event
    const blockedEnrollment = await Enrollment.findOne({
      event: eventObjectId,
      $or: [{ enrolledBy: userObjectId }, { members: userObjectId }],
      isBlocked: true,
    }).lean();

    const userDoc = await User.findById(userObjectId)
      .select('isRestricted restrictionReason restrictedFeatures isBlocked')
      .lean();

    // Check if blocked in any other event
    const otherBlockedEnrollment = await Enrollment.findOne({
      event: { $ne: eventObjectId },
      $or: [{ enrolledBy: userObjectId }, { members: userObjectId }],
      isBlocked: true,
    })
      .populate('event', 'title')
      .lean();

    let isBlocked = false;
    let blockedType: 'NONE' | 'GLOBAL' | 'CONTEST' | 'COURSE' | 'ASSESSMENT' | 'OTHER_EVENT' | 'THIS_EVENT' = 'NONE';
    let sourceTitle = '';
    let reason = '';

    if (userDoc?.isBlocked) {
      isBlocked = true;
      blockedType = 'GLOBAL';
      sourceTitle = 'Account Level Lockout';
      reason = 'Your account has been locked by an administrator.';
    } else if (userDoc?.isRestricted && (userDoc.restrictedFeatures || []).includes('assessments')) {
      isBlocked = true;
      const rLower = (userDoc.restrictionReason || '').toLowerCase();
      if (rLower.includes('contest')) {
        blockedType = 'CONTEST';
        sourceTitle = 'Coding Contest';
      } else if (rLower.includes('course')) {
        blockedType = 'COURSE';
        sourceTitle = 'Course Assessment';
      } else {
        blockedType = 'ASSESSMENT';
        sourceTitle = 'Assessment';
      }
      reason = userDoc.restrictionReason || `Exceeded tab switch limits in ${sourceTitle}.`;
    } else if (otherBlockedEnrollment) {
      isBlocked = true;
      blockedType = 'OTHER_EVENT';
      sourceTitle = (otherBlockedEnrollment.event as any)?.title || 'Another Event';
      reason = `Blocked for navigating away in event "${sourceTitle}".`;
    } else if (blockedEnrollment) {
      isBlocked = true;
      blockedType = 'THIS_EVENT';
      sourceTitle = 'This Event Arena';
      reason = 'Blocked for navigating away / tab switch violation in this event.';
    }

    return reply.send({
      success: true,
      isBlocked,
      blockedType,
      sourceTitle,
      reason,
      eventId,
      studentId: targetUserId,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to get anti-cheat status',
    });
  }
};

/**
 * GET /api/events/:eventId/blocked-students
 * Retrieve all students who are currently blocked for this event (regardless of whether they have a submission record).
 */
export const getBlockedStudents = async (
  request: FastifyRequest<{ Params: { eventId?: string; id?: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const eventId = request.params.eventId || request.params.id;
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return reply.status(400).send({ success: false, error: 'Invalid or missing Event ID' });
    }

    const eventObjectId = new mongoose.Types.ObjectId(eventId);

    const blockedEnrollments = await Enrollment.find({
      event: eventObjectId,
      isBlocked: true,
    })
      .populate('enrolledBy', 'name rollNo email profilePicUrl department year isRestricted restrictionReason isBlocked')
      .populate('members', 'name rollNo email profilePicUrl department year isRestricted restrictionReason isBlocked')
      .lean();

    const studentMap = new Map<string, any>();

    const addStudentToMap = (studentObj: any, blockSource: string, blockReason: string, blockedAtDate?: Date | null) => {
      if (!studentObj || !studentObj._id) return;
      const idStr = studentObj._id.toString();
      if (!studentMap.has(idStr)) {
        studentMap.set(idStr, {
          _id: studentObj._id,
          name: studentObj.name,
          rollNo: studentObj.rollNo,
          email: studentObj.email,
          profilePicUrl: studentObj.profilePicUrl,
          department: studentObj.department,
          year: studentObj.year,
          blockedAt: blockedAtDate || new Date(),
          blockSource,
          blockReason,
          isBlockedInThisEvent: blockSource === 'THIS_EVENT',
          isRestrictedGlobally: Boolean(studentObj.isRestricted || studentObj.isBlocked),
        });
      }
    };

    // 1. Process directly blocked enrollments in this event
    blockedEnrollments.forEach((en: any) => {
      if (en.enrolledBy) {
        addStudentToMap(en.enrolledBy, 'THIS_EVENT', 'Navigated away from Event Arena session', en.updatedAt);
      }
      if (Array.isArray(en.members)) {
        en.members.forEach((m: any) => {
          addStudentToMap(m, 'THIS_EVENT', 'Navigated away from Event Arena session', en.updatedAt);
        });
      }
    });

    // 2. Find any students enrolled in this event who have user-level restrictions or account locks
    const allEventEnrollments = await Enrollment.find({ event: eventObjectId })
      .select('enrolledBy members')
      .lean();

    const enrolledUserIds: any[] = [];
    allEventEnrollments.forEach((en: any) => {
      if (en.enrolledBy) enrolledUserIds.push(en.enrolledBy);
      if (Array.isArray(en.members)) {
        en.members.forEach((m: any) => m && enrolledUserIds.push(m));
      }
    });

    if (enrolledUserIds.length > 0) {
      const restrictedUsers = await User.find({
        _id: { $in: enrolledUserIds },
        $or: [{ isBlocked: true }, { isRestricted: true }],
      })
        .select('name rollNo email profilePicUrl department year isRestricted restrictionReason restrictedFeatures isBlocked restrictedAt')
        .lean();

      for (const u of restrictedUsers) {
        const idStr = u._id.toString();
        if (!studentMap.has(idStr)) {
          let blockSource = 'ASSESSMENT';
          let blockReason = u.restrictionReason || 'Restricted from test sessions';
          if (u.isBlocked) {
            blockSource = 'GLOBAL';
            blockReason = 'Account blocked globally by administrator';
          } else if (u.isRestricted) {
            const reasonLower = (u.restrictionReason || '').toLowerCase();
            if (reasonLower.includes('contest')) {
              blockSource = 'CONTEST';
            } else if (reasonLower.includes('course')) {
              blockSource = 'COURSE';
            }
          }
          addStudentToMap(u, blockSource, blockReason, u.restrictedAt);
        }
      }
    }

    return reply.send({
      success: true,
      blockedStudents: Array.from(studentMap.values()),
      count: studentMap.size,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to fetch blocked students',
    });
  }
};

export default {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  blockStudent,
  unblockStudent,
  getStudentAntiCheatStatus,
  getBlockedStudents,
};
