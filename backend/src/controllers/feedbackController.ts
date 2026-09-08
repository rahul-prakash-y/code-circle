import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import Feedback, { FeedbackType } from '../models/feedbackModel';
import Event from '../models/eventModel';

export interface SubmitFeedbackBody {
  type: FeedbackType;
  eventId?: string | null;
  rating: number;
  category?: string;
  comment: string;
}

export interface GetFeedbackQuery {
  type?: string;
  eventId?: string;
  rating?: number;
  search?: string;
}

export const submitFeedback = async (
  request: FastifyRequest<{ Body: SubmitFeedbackBody }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { type, eventId, rating, category = 'General', comment } = request.body;

    if (!type || !['Event', 'ClubGeneral'].includes(type)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid feedback type. Must be "Event" or "ClubGeneral"',
      });
    }

    if (!comment || !comment.trim() || comment.trim().length < 3) {
      return reply.status(400).send({
        success: false,
        error: 'Feedback comment must be at least 3 characters long',
      });
    }

    const parsedRating = Number(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return reply.status(400).send({
        success: false,
        error: 'Rating must be an integer between 1 and 5',
      });
    }

    let verifiedEventId: mongoose.Types.ObjectId | null = null;
    if (type === 'Event') {
      if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
        return reply.status(400).send({
          success: false,
          error: 'Valid eventId is required when submitting feedback for an event',
        });
      }
      const existingEvent = await Event.findById(eventId);
      if (!existingEvent) {
        return reply.status(404).send({
          success: false,
          error: 'The specified event does not exist',
        });
      }
      verifiedEventId = new mongoose.Types.ObjectId(eventId);
    }

    const feedback = await Feedback.create({
      user: new mongoose.Types.ObjectId(user.id),
      type,
      event: verifiedEventId,
      rating: parsedRating,
      category: category.trim(),
      comment: comment.trim(),
    });

    return reply.status(201).send({
      success: true,
      message: 'Feedback submitted successfully. Thank you for your contribution!',
      data: feedback,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to submit feedback',
    });
  }
};

/**
 * Get feedback list for administration dashboard with role-based privacy enforcement:
 * - If user.role === 'SuperAdmin': populates the full user document (name, rollNo, email, department, profilePicUrl).
 * - If user.role !== 'SuperAdmin' (e.g. 'Admin', 'Faculty', 'Committee'): strictly strips real user data and obscures as 'Anonymous Student'.
 */
export const getFeedbacks = async (
  request: FastifyRequest<{ Querystring: GetFeedbackQuery }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { type, eventId, rating, search } = request.query;
    const filter: any = {};

    if (type && ['Event', 'ClubGeneral'].includes(type)) {
      filter.type = type;
    }

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.event = new mongoose.Types.ObjectId(eventId);
    }

    if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
      filter.rating = Number(rating);
    }

    if (search && search.trim()) {
      filter.$or = [
        { comment: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const roleNormalized = String(user.role || '').toLowerCase();
    const isSuperAdmin = roleNormalized === 'superadmin';

    let query = Feedback.find(filter)
      .populate('event', 'title date type status')
      .sort({ createdAt: -1 });

    if (isSuperAdmin) {
      // SuperAdmin clearance: Populate actual user identity
      query = query.populate('user', 'name rollNo email department profilePicUrl role');
    }

    const rawFeedbacks = await query.lean();

    // PRIVACY FILTER:
    // When requester is SuperAdmin: feedback is attributed and displayed by the user's real name.
    // When requester is Admin or others: student identity is strictly obscured and displayed as 'Anonymous User'.
    const feedbacks = rawFeedbacks.map((fb: any) => {
      if (isSuperAdmin) {
        return {
          ...fb,
          user: fb.user || {
            _id: 'unlinked',
            name: 'User',
            rollNo: 'N/A',
            email: 'user@codecircle.internal',
            department: 'Code Circle Member',
          },
          isAnonymous: false,
          accessLevel: 'SuperAdmin-Attributed',
        };
      }

      return {
        ...fb,
        user: {
          _id: 'anonymous',
          name: 'Anonymous User',
          rollNo: 'ANONYMOUS',
          email: 'anonymous@codecircle.internal',
          department: 'Code Circle Member',
          isAnonymous: true,
        },
        isAnonymous: true,
        accessLevel: 'Admin-Anonymized',
      };
    });

    return reply.send({
      success: true,
      viewerRole: user.role,
      isSuperAdminView: isSuperAdmin,
      privacyPolicyNotice: isSuperAdmin
        ? 'SuperAdmin clearance active: Full user identities are visible for moderation and governance.'
        : 'Standard Administrator clearance: Student feedback identities are displayed as anonymous user to protect privacy.',
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to fetch feedback records',
    });
  }
};

export const getMyFeedbacks = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const feedbacks = await Feedback.find({ user: user.id })
      .populate('event', 'title date type')
      .sort({ createdAt: -1 })
      .lean();

    return reply.send({
      success: true,
      data: feedbacks,
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to fetch personal feedback history',
    });
  }
};

export const deleteFeedback = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid feedback ID' });
    }

    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) {
      return reply.status(404).send({ success: false, error: 'Feedback not found' });
    }

    return reply.send({
      success: true,
      message: 'Feedback entry removed successfully',
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to delete feedback',
    });
  }
};

export const getFeedbackStats = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const [total, eventCount, clubGeneralCount, ratingAgg] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.countDocuments({ type: 'Event' }),
      Feedback.countDocuments({ type: 'ClubGeneral' }),
      Feedback.aggregate([
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
            rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const stats = ratingAgg[0] || {
      averageRating: 5.0,
      rating1: 0,
      rating2: 0,
      rating3: 0,
      rating4: 0,
      rating5: 0,
    };

    return reply.send({
      success: true,
      data: {
        totalFeedbacks: total,
        eventFeedbacks: eventCount,
        clubGeneralFeedbacks: clubGeneralCount,
        averageRating: Math.round((stats.averageRating || 5) * 10) / 10,
        distribution: {
          5: stats.rating5,
          4: stats.rating4,
          3: stats.rating3,
          2: stats.rating2,
          1: stats.rating1,
        },
      },
    });
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to calculate feedback statistics',
    });
  }
};

export default {
  submitFeedback,
  getFeedbacks,
  getMyFeedbacks,
  deleteFeedback,
  getFeedbackStats,
};
