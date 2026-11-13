import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import Enrollment from '../models/enrollmentModel';
import Assessment from '../models/assessmentModel';
import User from '../models/userModel';

/**
 * Anti-Cheat Assessment Middleware
 * If a student's registration/participation for an event has `isBlocked === true`,
 * or if they are restricted by another assessment, contest, or course,
 * all assessment fetch and submit requests are rejected with 403 status and detailed origin info.
 */
export const checkAssessmentNotBlocked = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return; // Token verification will handle or has handled unauthenticated calls
    }

    // Admins and faculty are exempt from student blocking
    if (user.role === 'Admin' || user.role === 'SuperAdmin' || user.role === 'Faculty') {
      return;
    }

    const params = request.params as Record<string, string | undefined>;
    let targetEventId: string | undefined = params.eventId;

    // Check if route has :id as eventId (e.g. /api/events/:id/arena/...)
    if (!targetEventId && params.id) {
      if (request.url.includes('/arena') || request.url.startsWith('/api/events')) {
        targetEventId = params.id;
      }
    }

    // If request is targeting /api/assessments/:id, retrieve associated eventId from the assessment document
    if (!targetEventId && params.id && request.url.includes('/assessments')) {
      if (mongoose.Types.ObjectId.isValid(params.id)) {
        const assessmentDoc = await Assessment.findById(params.id).select('eventId').lean();
        if (assessmentDoc && assessmentDoc.eventId) {
          targetEventId = assessmentDoc.eventId.toString();
        }
      }
    }

    if (!targetEventId || !mongoose.Types.ObjectId.isValid(targetEventId)) {
      return;
    }

    const eventObjectId = new mongoose.Types.ObjectId(targetEventId);
    const userObjectId = new mongoose.Types.ObjectId(user.id || user._id);

    // 1. Check if user is globally blocked or restricted by another assessment, contest, or course
    const dbUser = await User.findById(userObjectId)
      .select('isBlocked isRestricted restrictionReason restrictedFeatures')
      .lean();

    if (dbUser?.isBlocked) {
      return reply.status(403).send({
        success: false,
        isBlocked: true,
        code: 'BLOCKED_BY_OTHER_ACTIVITY',
        blockedType: 'GLOBAL',
        sourceTitle: 'Account Level Lockout',
        reason: 'Your account has been locked by an administrator.',
        error: 'Your account is blocked. Please contact an administrator or faculty to unblock it first.',
      });
    }

    if (dbUser?.isRestricted && (dbUser.restrictedFeatures || []).includes('assessments')) {
      const reasonLower = (dbUser.restrictionReason || '').toLowerCase();
      let blockedType = 'ASSESSMENT';
      let sourceTitle = 'Assessment Proctoring Lockout';
      if (reasonLower.includes('contest')) {
        blockedType = 'CONTEST';
        sourceTitle = 'Coding Contest Lockout';
      } else if (reasonLower.includes('course')) {
        blockedType = 'COURSE';
        sourceTitle = 'Course Assessment Lockout';
      }

      return reply.status(403).send({
        success: false,
        isBlocked: true,
        code: 'BLOCKED_BY_OTHER_ACTIVITY',
        blockedType,
        sourceTitle,
        reason: dbUser.restrictionReason || `Exceeded tab switch limits in a ${blockedType.toLowerCase()}.`,
        error: `You are currently blocked by a ${blockedType.toLowerCase()}. Please unblock that first before entering this Event Arena.`,
      });
    }

    // 2. Check if student is blocked in another event
    const otherBlockedEnrollment = await Enrollment.findOne({
      event: { $ne: eventObjectId },
      $or: [{ enrolledBy: userObjectId }, { members: userObjectId }],
      isBlocked: true,
    })
      .populate('event', 'title')
      .lean();

    if (otherBlockedEnrollment && (otherBlockedEnrollment.event as any)?.title) {
      const otherTitle = (otherBlockedEnrollment.event as any).title;
      return reply.status(403).send({
        success: false,
        isBlocked: true,
        code: 'BLOCKED_BY_OTHER_ACTIVITY',
        blockedType: 'OTHER_EVENT',
        sourceTitle: `Event: ${otherTitle}`,
        reason: `Blocked for navigating away in event "${otherTitle}"`,
        error: `You are currently blocked in "${otherTitle}". Please unblock that first.`,
      });
    }

    // 3. Query event registration / participation for blocked status in THIS event
    const blockedRegistration = await Enrollment.findOne({
      event: eventObjectId,
      $or: [
        { enrolledBy: userObjectId },
        { members: userObjectId },
      ],
      isBlocked: true,
    }).lean();

    if (blockedRegistration) {
      return reply.status(403).send({
        success: false,
        isBlocked: true,
        code: 'STUDENT_ASSESSMENT_BLOCKED',
        blockedType: 'THIS_EVENT',
        sourceTitle: 'This Event Arena',
        reason: 'Blocked for navigating away / tab switch violation in this assessment',
        error: 'You have been blocked for navigating away. Contact Admin.',
      });
    }
  } catch (error: any) {
    request.log.error(error, 'AntiCheat checkAssessmentNotBlocked middleware encountered an error');
  }
};

export default checkAssessmentNotBlocked;
