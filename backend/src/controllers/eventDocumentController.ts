import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import EventDocument, { EventDocumentStatus } from '../models/eventDocumentModel';
import Event from '../models/eventModel';
import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';

interface EventDocumentQuery {
  eventId?: string;
  status?: EventDocumentStatus | string;
  search?: string;
  page?: string;
  limit?: string;
}

interface CreateEventDocumentBody {
  eventId: string;
  title?: string;
  content: string;
  status?: EventDocumentStatus;
  tags?: string[];
}

interface UpdateEventDocumentBody {
  title?: string;
  content?: string;
  status?: EventDocumentStatus;
  rejectionReason?: string;
  tags?: string[];
}

interface RejectDocumentBody {
  rejectionReason?: string;
}

/**
 * 1. List event documents with optional filters
 */
export const getEventDocuments = async (
  request: FastifyRequest<{ Querystring: EventDocumentQuery }>,
  reply: FastifyReply
) => {
  try {
    const { eventId, status, search } = request.query;
    const { page, limit, skip } = parsePaginationParams(request.query as any, {
      defaultLimit: 10,
      maxLimit: 50,
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
    });

    const filter: Record<string, any> = {};

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.eventId = new mongoose.Types.ObjectId(eventId);
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { content: searchRegex }];
    }

    const [total, documents] = await Promise.all([
      EventDocument.countDocuments(filter),
      EventDocument.find(filter)
        .populate('eventId', 'title date format venueOrLink')
        .populate('createdBy', 'name rollNo email role')
        .populate('approvedBy', 'name rollNo email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return reply.send({
      success: true,
      data: documents,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to fetch event documents',
    });
  }
};

/**
 * 2. Get single event document by ID
 */
export const getEventDocumentById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid document ID' });
    }

    const doc = await EventDocument.findById(id)
      .populate('eventId', 'title date format venueOrLink')
      .populate('createdBy', 'name rollNo email role')
      .populate('approvedBy', 'name rollNo email role');

    if (!doc) {
      return reply.status(404).send({ success: false, error: 'Event document not found' });
    }

    return reply.send({
      success: true,
      data: doc,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to fetch document',
    });
  }
};

/**
 * 3. Create a new event document
 */
export const createEventDocument = async (
  request: FastifyRequest<{ Body: CreateEventDocumentBody }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { eventId, title, content, status = 'Draft', tags = [] } = request.body;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return reply.status(400).send({ success: false, error: 'Valid eventId is required' });
    }

    const eventExists = await Event.findById(eventId);
    if (!eventExists) {
      return reply.status(404).send({ success: false, error: 'Target event does not exist' });
    }

    const newDoc = await EventDocument.create({
      eventId: new mongoose.Types.ObjectId(eventId),
      title: title || `${eventExists.title} - Official Documentation`,
      content: content || '',
      status: status === 'Pending' ? 'Pending' : 'Draft',
      createdBy: new mongoose.Types.ObjectId(user.id || user._id),
      tags,
      version: 1,
    });

    const populatedDoc = await EventDocument.findById(newDoc._id)
      .populate('eventId', 'title date format venueOrLink')
      .populate('createdBy', 'name rollNo email role');

    return reply.status(201).send({
      success: true,
      message: 'Event document created successfully',
      data: populatedDoc,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to create event document',
    });
  }
};

/**
 * 4. Update an existing event document
 */
export const updateEventDocument = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateEventDocumentBody }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid document ID' });
    }

    const doc = await EventDocument.findById(id);
    if (!doc) {
      return reply.status(404).send({ success: false, error: 'Event document not found' });
    }

    // Role check: Admin can update anything. Original author can update if not approved.
    const isAuthor = doc.createdBy.toString() === (user.id || user._id);
    const isAdminUser = ['Admin', 'SuperAdmin', 'Faculty'].includes(user.role);

    if (!isAuthor && !isAdminUser) {
      return reply.status(403).send({ success: false, error: 'Not authorized to modify this document' });
    }

    const { title, content, status, rejectionReason, tags } = request.body;

    if (title !== undefined) doc.title = title;
    if (content !== undefined && content !== doc.content) {
      doc.content = content;
      doc.version = (doc.version || 1) + 1;
    }
    if (status !== undefined) doc.status = status;
    if (rejectionReason !== undefined) doc.rejectionReason = rejectionReason;
    if (tags !== undefined) doc.tags = tags;

    await doc.save();

    const populatedDoc = await EventDocument.findById(doc._id)
      .populate('eventId', 'title date format venueOrLink')
      .populate('createdBy', 'name rollNo email role')
      .populate('approvedBy', 'name rollNo email role');

    return reply.send({
      success: true,
      message: 'Document updated successfully',
      data: populatedDoc,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to update document',
    });
  }
};

/**
 * 5. Delete an event document
 */
export const deleteEventDocument = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid document ID' });
    }

    const doc = await EventDocument.findById(id);
    if (!doc) {
      return reply.status(404).send({ success: false, error: 'Event document not found' });
    }

    const isAuthor = doc.createdBy.toString() === (user.id || user._id);
    const isAdminUser = ['Admin', 'SuperAdmin', 'Faculty'].includes(user.role);

    if (!isAuthor && !isAdminUser) {
      return reply.status(403).send({ success: false, error: 'Not authorized to delete this document' });
    }

    await doc.deleteOne();

    return reply.send({
      success: true,
      message: 'Event document deleted successfully',
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to delete document',
    });
  }
};

/**
 * 6. Specific Approval Route: PATCH /api/docs/:id/approve (Admin only)
 */
export const approveEventDocument = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid document ID' });
    }

    const doc = await EventDocument.findById(id);
    if (!doc) {
      return reply.status(404).send({ success: false, error: 'Event document not found' });
    }

    doc.status = 'Approved';
    doc.approvedBy = new mongoose.Types.ObjectId(user.id || user._id);
    doc.approvedAt = new Date();
    doc.rejectionReason = '';

    await doc.save();

    const populatedDoc = await EventDocument.findById(doc._id)
      .populate('eventId', 'title date format venueOrLink')
      .populate('createdBy', 'name rollNo email role')
      .populate('approvedBy', 'name rollNo email role');

    request.log.info(`Document ${id} approved by admin ${user.id || user._id}`);

    return reply.send({
      success: true,
      message: 'Event document approved successfully',
      data: populatedDoc,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to approve document',
    });
  }
};

/**
 * 7. Rejection Route: PATCH /api/docs/:id/reject (Admin only)
 */
export const rejectEventDocument = async (
  request: FastifyRequest<{ Params: { id: string }; Body?: RejectDocumentBody }>,
  reply: FastifyReply
) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const { id } = request.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid document ID' });
    }

    const doc = await EventDocument.findById(id);
    if (!doc) {
      return reply.status(404).send({ success: false, error: 'Event document not found' });
    }

    doc.status = 'Rejected';
    doc.rejectionReason = request.body?.rejectionReason || 'Requires revision';
    doc.approvedBy = null;
    doc.approvedAt = null;

    await doc.save();

    const populatedDoc = await EventDocument.findById(doc._id)
      .populate('eventId', 'title date format venueOrLink')
      .populate('createdBy', 'name rollNo email role');

    return reply.send({
      success: true,
      message: 'Event document rejected with revision feedback',
      data: populatedDoc,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to reject document',
    });
  }
};

export default {
  getEventDocuments,
  getEventDocumentById,
  createEventDocument,
  updateEventDocument,
  deleteEventDocument,
  approveEventDocument,
  rejectEventDocument,
};
