import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import User from '../models/userModel';
import Enrollment from '../models/enrollmentModel';
import Event from '../models/eventModel';
import EventArenaSubmission from '../models/eventArenaSubmissionModel';

export interface UnifiedBlockedStudent {
  id: string;
  studentId: string;
  name: string;
  rollNo: string;
  email: string;
  department?: string;
  year?: string | number;
  profilePicUrl?: string;
  category: 'GLOBAL' | 'EVENT' | 'ASSESSMENT' | 'CONTEST' | 'COURSE';
  categoryLabel: string;
  blockReason: string;
  sourceTitle: string;
  eventId?: string;
  eventTitle?: string;
  blockedAt: Date | string;
  restrictedFeatures?: string[];
  isRestrictedGlobally: boolean;
  isAccountBlocked: boolean;
  isBlockedInEvent?: boolean;
}

/**
 * GET /api/admin/blocked-students
 * Aggregates all blocked/restricted students across any category:
 * - GLOBAL: User.isBlocked === true
 * - ASSESSMENT: User.isRestricted === true (assessments)
 * - CONTEST: User.isRestricted === true (contests)
 * - COURSE: User.isRestricted === true (courses)
 * - EVENT: Enrollment.isBlocked === true for any Event / Event Arena
 */
export const getAllBlockedStudents = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = (request.query || {}) as {
      category?: string;
      search?: string;
    };

    const studentMap = new Map<string, UnifiedBlockedStudent>();

    // 1. Fetch all blocked enrollments across all events
    const blockedEnrollments = await Enrollment.find({ isBlocked: true })
      .populate('enrolledBy', 'name rollNo email profilePicUrl department year isRestricted restrictionReason isBlocked')
      .populate('members', 'name rollNo email profilePicUrl department year isRestricted restrictionReason isBlocked')
      .populate('event', 'title eventCode date hasArena')
      .lean();

    const addStudentEntry = (
      studentObj: any,
      category: 'GLOBAL' | 'EVENT' | 'ASSESSMENT' | 'CONTEST' | 'COURSE',
      categoryLabel: string,
      sourceTitle: string,
      blockReason: string,
      blockedAtDate?: Date | null,
      eventId?: string,
      eventTitle?: string
    ) => {
      if (!studentObj || !studentObj._id) return;
      const sId = studentObj._id.toString();
      const uniqueKey = `${sId}_${category}_${eventId || 'any'}`;

      if (!studentMap.has(uniqueKey)) {
        studentMap.set(uniqueKey, {
          id: uniqueKey,
          studentId: sId,
          name: studentObj.name || 'Unknown Student',
          rollNo: studentObj.rollNo || 'N/A',
          email: studentObj.email || '',
          department: studentObj.department || 'N/A',
          year: studentObj.year,
          profilePicUrl: studentObj.profilePicUrl,
          category,
          categoryLabel,
          sourceTitle,
          blockReason: blockReason || 'Proctoring violation / navigation away',
          eventId,
          eventTitle,
          blockedAt: blockedAtDate || new Date(),
          restrictedFeatures: studentObj.restrictedFeatures || [],
          isRestrictedGlobally: Boolean(studentObj.isRestricted || studentObj.isBlocked),
          isAccountBlocked: Boolean(studentObj.isBlocked),
          isBlockedInEvent: category === 'EVENT',
        });
      }
    };

    // Process event-level blocks
    for (const en of blockedEnrollments) {
      const ev: any = en.event;
      const eventId = ev?._id?.toString() || en.event?.toString();
      const eventTitle = ev?.title || 'Event Arena Session';

      if (en.enrolledBy) {
        addStudentEntry(
          en.enrolledBy,
          'EVENT',
          'Event Arena / Event',
          eventTitle,
          'Navigated away / tab switch violation in Event Arena',
          en.updatedAt,
          eventId,
          eventTitle
        );
      }
      if (Array.isArray(en.members)) {
        en.members.forEach((m: any) => {
          if (m) {
            addStudentEntry(
              m,
              'EVENT',
              'Event Arena / Event',
              eventTitle,
              'Navigated away / tab switch violation in Event Arena',
              en.updatedAt,
              eventId,
              eventTitle
            );
          }
        });
      }
    }

    // 2. Fetch all users with global account blocks or feature restrictions
    const restrictedUsers = await User.find({
      $or: [{ isBlocked: true }, { isRestricted: true }],
    })
      .select('name rollNo email profilePicUrl department year isRestricted restrictionReason restrictedFeatures isBlocked restrictedAt createdAt')
      .lean();

    for (const u of restrictedUsers) {
      if (u.isBlocked) {
        addStudentEntry(
          u,
          'GLOBAL',
          'Global Account Lock',
          'Platform Account',
          u.restrictionReason || 'User account locked by Administrator',
          u.restrictedAt || u.createdAt
        );
      }

      if (u.isRestricted) {
        const reasonLower = (u.restrictionReason || '').toLowerCase();
        let cat: 'ASSESSMENT' | 'CONTEST' | 'COURSE' = 'ASSESSMENT';
        let label = 'Coding Assessment';
        let source = 'Assessment Proctoring Lock';

        if (reasonLower.includes('contest') || (u.restrictedFeatures || []).includes('contests')) {
          cat = 'CONTEST';
          label = 'Coding Contest';
          source = 'Contest Proctoring Lock';
        } else if (reasonLower.includes('course') || (u.restrictedFeatures || []).includes('courses')) {
          cat = 'COURSE';
          label = 'Course Assessment';
          source = 'Course Assessment Lock';
        }

        addStudentEntry(
          u,
          cat,
          label,
          source,
          u.restrictionReason || 'Exceeded tab switch limit / Proctoring violation',
          u.restrictedAt
        );
      }
    }

    let allStudents = Array.from(studentMap.values());

    // Compute stats before query filtering
    const counts = {
      all: allStudents.length,
      global: allStudents.filter((s) => s.category === 'GLOBAL').length,
      event: allStudents.filter((s) => s.category === 'EVENT').length,
      assessment: allStudents.filter((s) => s.category === 'ASSESSMENT').length,
      contest: allStudents.filter((s) => s.category === 'CONTEST').length,
      course: allStudents.filter((s) => s.category === 'COURSE').length,
    };

    // Apply category filter
    if (query.category && query.category !== 'all') {
      const targetCategory = query.category.toUpperCase();
      allStudents = allStudents.filter((s) => s.category === targetCategory);
    }

    // Apply search filter
    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      allStudents = allStudents.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.department && s.department.toLowerCase().includes(q)) ||
          s.sourceTitle.toLowerCase().includes(q) ||
          s.blockReason.toLowerCase().includes(q)
      );
    }

    // Sort by blocked date descending
    allStudents.sort((a, b) => new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime());

    return reply.send({
      success: true,
      blockedStudents: allStudents,
      counts,
      total: allStudents.length,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to fetch blocked students list',
    });
  }
};

/**
 * POST /api/admin/blocked-students/block
 * Direct block a student in any category:
 * - GLOBAL: Global account lockout
 * - EVENT: Block from a specific Event / Event Arena
 * - ASSESSMENT: Block from coding assessments
 * - CONTEST: Block from contests
 */
export const blockStudentDirect = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const caller = request.user;
    if (!caller) return reply.status(401).send({ success: false, error: 'Unauthorized' });

    const {
      studentIdentifier,
      category = 'GLOBAL',
      eventId,
      reason,
      features,
    } = (request.body || {}) as {
      studentIdentifier: string;
      category: 'GLOBAL' | 'EVENT' | 'ASSESSMENT' | 'CONTEST';
      eventId?: string;
      reason?: string;
      features?: string[];
    };

    if (!studentIdentifier || !studentIdentifier.trim()) {
      return reply.status(400).send({ success: false, error: 'Student Roll No, Email, or ID is required' });
    }

    const trimmed = studentIdentifier.trim();
    let targetUser: any = null;
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      targetUser = await User.findById(trimmed);
    }
    if (!targetUser) {
      targetUser = await User.findOne({
        $or: [
          { rollNo: trimmed.toUpperCase() },
          { rollNo: trimmed },
          { email: trimmed.toLowerCase() },
          { email: trimmed },
        ],
      });
    }

    if (!targetUser) {
      return reply.status(404).send({ success: false, error: `Student '${trimmed}' was not found` });
    }

    if (targetUser.role === 'SuperAdmin') {
      return reply.status(403).send({ success: false, error: 'Cannot block a SuperAdmin account' });
    }

    const blockReason = reason?.trim() || 'Blocked by administrator';

    if (category === 'GLOBAL') {
      targetUser.isBlocked = true;
      targetUser.activeSessionId = null;
      targetUser.restrictionReason = blockReason;
      await targetUser.save();
    } else if (category === 'ASSESSMENT' || category === 'CONTEST') {
      targetUser.isRestricted = true;
      targetUser.restrictionReason = blockReason;
      targetUser.restrictedFeatures =
        Array.isArray(features) && features.length > 0
          ? features
          : category === 'CONTEST'
          ? ['contests']
          : ['assessments', 'contests'];
      targetUser.restrictedAt = new Date();
      await targetUser.save();
    } else if (category === 'EVENT') {
      if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
        return reply.status(400).send({ success: false, error: 'Valid Event ID is required to block from an event' });
      }

      const event = await Event.findById(eventId).select('_id title');
      if (!event) {
        return reply.status(404).send({ success: false, error: 'Selected event not found' });
      }

      const eventObjectId = new mongoose.Types.ObjectId(eventId);
      const studentObjectId = targetUser._id;

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
    }

    return reply.send({
      success: true,
      message: `Student ${targetUser.name} (${targetUser.rollNo}) has been blocked successfully in ${category} category.`,
      student: {
        _id: targetUser._id,
        name: targetUser.name,
        rollNo: targetUser.rollNo,
        email: targetUser.email,
        department: targetUser.department,
        isBlocked: targetUser.isBlocked,
        isRestricted: targetUser.isRestricted,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: error.message || 'Failed to block student' });
  }
};

/**
 * POST /api/admin/blocked-students/unblock
 * Unblocks student from specific category or from all scopes.
 */
export const unblockStudentDirect = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const caller = request.user;
    if (!caller) return reply.status(401).send({ success: false, error: 'Unauthorized' });

    const {
      studentId,
      category = 'ALL',
      eventId,
    } = (request.body || {}) as {
      studentId: string;
      category?: 'GLOBAL' | 'EVENT' | 'ASSESSMENT' | 'CONTEST' | 'COURSE' | 'ALL';
      eventId?: string;
    };

    if (!studentId || !studentId.trim()) {
      return reply.status(400).send({ success: false, error: 'studentId is required' });
    }

    const trimmed = studentId.trim();
    let targetUser: any = null;
    if (mongoose.Types.ObjectId.isValid(trimmed)) {
      targetUser = await User.findById(trimmed);
    }
    if (!targetUser) {
      targetUser = await User.findOne({
        $or: [
          { rollNo: trimmed.toUpperCase() },
          { rollNo: trimmed },
          { email: trimmed.toLowerCase() },
          { email: trimmed },
        ],
      });
    }

    if (!targetUser) {
      return reply.status(404).send({ success: false, error: `Student '${trimmed}' not found` });
    }

    const studentObjectId = targetUser._id;

    if (category === 'GLOBAL' || category === 'ALL') {
      targetUser.isBlocked = false;
      await targetUser.save();
    }

    if (category === 'ASSESSMENT' || category === 'CONTEST' || category === 'COURSE' || category === 'ALL') {
      targetUser.isRestricted = false;
      targetUser.restrictionReason = '';
      targetUser.restrictedFeatures = [];
      targetUser.unblockedAt = new Date();
      targetUser.unblockedBy = new mongoose.Types.ObjectId(caller.id || caller._id);
      await targetUser.save();
    }

    if (category === 'EVENT' || category === 'ALL') {
      const enrollmentFilter: any =
        eventId && category === 'EVENT' && mongoose.Types.ObjectId.isValid(eventId)
          ? { event: new mongoose.Types.ObjectId(eventId), $or: [{ enrolledBy: studentObjectId }, { members: studentObjectId }] }
          : { $or: [{ enrolledBy: studentObjectId }, { members: studentObjectId }] };

      await Enrollment.updateMany(enrollmentFilter, { $set: { isBlocked: false } });

      // If they had Event Arena submissions, allow reentry
      const subFilter: any = { userId: studentObjectId };
      if (eventId && category === 'EVENT' && mongoose.Types.ObjectId.isValid(eventId)) {
        subFilter.eventId = new mongoose.Types.ObjectId(eventId);
      }
      await EventArenaSubmission.updateMany(subFilter, { $set: { reentryAllowed: true } });
    }

    return reply.send({
      success: true,
      message: `Student ${targetUser.name} (${targetUser.rollNo}) has been unblocked successfully.`,
      student: {
        _id: targetUser._id,
        name: targetUser.name,
        rollNo: targetUser.rollNo,
        email: targetUser.email,
        isBlocked: targetUser.isBlocked,
        isRestricted: targetUser.isRestricted,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: error.message || 'Failed to unblock student' });
  }
};

/**
 * GET /api/admin/blocked-students/events
 * Returns events list for selecting which event to block a student from.
 */
export const getAvailableEventsForBlock = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const events = await Event.find()
      .select('_id title eventCode date hasArena status')
      .sort({ createdAt: -1 })
      .limit(60)
      .lean();

    return reply.send({
      success: true,
      events,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch events' });
  }
};

/**
 * GET /api/admin/blocked-students/search-candidates
 * Autocomplete candidate search for direct blocking modal.
 */
export const searchStudentsForBlock = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = ((request.query as any)?.query || '').trim();
    if (!query || query.length < 1) {
      return reply.send({ success: true, candidates: [] });
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const candidates = await User.find({
      role: { $in: ['Student', 'Member', 'Committee'] },
      $or: [{ name: regex }, { rollNo: regex }, { email: regex }, { department: regex }],
    })
      .select('_id name rollNo email department year profilePicUrl isBlocked isRestricted restrictionReason')
      .limit(20)
      .lean();

    return reply.send({
      success: true,
      candidates,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to search students' });
  }
};
