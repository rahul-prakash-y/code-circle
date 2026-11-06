import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import Enrollment from '../models/enrollmentModel';
import Assessment from '../models/assessmentModel';

/**
 * Anti-Cheat Assessment Middleware
 * If a student's registration/participation for an event has `isBlocked === true`,
 * all assessment fetch and submit requests for ANY test within that event are rejected with a 403 status.
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

    // Query event registration / participation for blocked status
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
        error: 'You have been blocked for navigating away. Contact Admin.',
      });
    }
  } catch (error: any) {
    request.log.error(error, 'AntiCheat checkAssessmentNotBlocked middleware encountered an error');
  }
};

export default checkAssessmentNotBlocked;
