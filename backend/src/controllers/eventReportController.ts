import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import EventReport from '../models/eventReportModel';
import Event from '../models/eventModel';

// Helper to normalize string or array of strings
const normalizeStringArray = (input: any): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((item) => (typeof item === 'string' ? item.trim() : String(item))).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
};

// Helper to normalize evidence URLs/Base64 strings into string array
const normalizeEvidenceArray = (input: any): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.filter((item) => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof input === 'string' && input.trim().length > 0) {
    return [input.trim()];
  }
  return [];
};

/**
 * POST /api/reports
 * Create or Upsert an EventReport
 */
export const createOrUpdateReport = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = request.body as any;

    if (!body || !body.eventId) {
      return reply.status(400).send({
        success: false,
        error: 'Event ID (eventId) is required to generate or save a report.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(body.eventId)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid eventId format.',
      });
    }

    // Verify associated event exists
    const eventExists = await Event.findById(body.eventId);
    if (!eventExists) {
      return reply.status(404).send({
        success: false,
        error: 'Target Event not found in system.',
      });
    }

    const payload: any = {
      eventId: body.eventId,
      eventTitle: body.eventTitle || eventExists.title || '',
      clubName: body.clubName || 'Code Circle',
      eventCategory: body.eventCategory || 'Technical Workshop',
      academicYear: body.academicYear || '2025-2026',
      date: body.date ? new Date(body.date) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      dateDisplay: body.dateDisplay || '',
      venue: body.venue || eventExists.venueOrLink || 'Main Campus, BIT',
      // Core Text
      objective: body.objective || '',
      outcome: body.outcome || '',
      // Detailed Summary
      eventOverview: body.eventOverview || '',
      strategiesUsed: normalizeStringArray(body.strategiesUsed),
      activitiesDone: normalizeStringArray(body.activitiesDone),
      accomplishments: normalizeStringArray(body.accomplishments),
      achievements: normalizeStringArray(body.achievements),
      takeaways: normalizeStringArray(body.takeaways),
      concludingNote: body.concludingNote || '',
      // Evidence
      circularUrl: normalizeEvidenceArray(body.circularUrl),
      brochureUrl: normalizeEvidenceArray(body.brochureUrl),
      attendanceUrl: normalizeEvidenceArray(body.attendanceUrl),
      geoPhotoUrl: normalizeEvidenceArray(body.geoPhotoUrl),
      newspaperClippingUrl: normalizeEvidenceArray(body.newspaperClippingUrl),
      feedbackUrl: normalizeEvidenceArray(body.feedbackUrl),
      billSettlementUrl: normalizeEvidenceArray(body.billSettlementUrl),
      // Resource Person & Coordinator Details
      resourcePerson: body.resourcePerson !== undefined ? String(body.resourcePerson).trim() : 'NIL',
      coordinatorName: body.coordinatorName || '',
      coordinatorSignatureUrl: body.coordinatorSignatureUrl || '',
      status: body.status || 'Submitted',
    };

    const user = (request as any).user;
    if (user?.id || user?._id) {
      payload.createdBy = user.id || user._id;
    }

    // Find existing report for this event or create new
    let report = await EventReport.findOne({ eventId: body.eventId });

    if (report) {
      Object.assign(report, payload);
      await report.save();
    } else {
      report = await EventReport.create(payload);
    }

    const populated = await EventReport.findById(report._id)
      .populate('eventId', 'title date venueOrLink clubName domain')
      .populate('createdBy', 'name email rollNo');

    return reply.status(201).send({
      success: true,
      message: 'Event report successfully synchronized and saved.',
      data: populated,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to save event report.',
    });
  }
};

/**
 * GET /api/reports/:eventId
 * Retrieve report for a specific event
 */
export const getReportByEventId = async (request: FastifyRequest<{ Params: { eventId: string } }>, reply: FastifyReply) => {
  try {
    const { eventId } = request.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid ID format provided.',
      });
    }

    // Query either by eventId reference or direct _id
    let report = await EventReport.findOne({
      $or: [{ eventId }, { _id: eventId }],
    })
      .populate('eventId', 'title date venueOrLink description coverImage')
      .populate('createdBy', 'name email rollNo');

    if (!report) {
      return reply.status(404).send({
        success: false,
        error: 'No report found for the specified event.',
      });
    }

    return reply.send({
      success: true,
      data: report,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to fetch event report.',
    });
  }
};

/**
 * GET /api/reports
 * List reports
 */
export const getAllReports = async (request: FastifyRequest<{ Querystring: { eventId?: string } }>, reply: FastifyReply) => {
  try {
    const { eventId } = request.query;
    const filter: any = {};
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.eventId = eventId;
    }

    const reports = await EventReport.find(filter)
      .sort({ createdAt: -1 })
      .populate('eventId', 'title date venueOrLink')
      .populate('createdBy', 'name email rollNo')
      .lean();

    return reply.send({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to list reports.',
    });
  }
};

/**
 * DELETE /api/reports/:id
 */
export const deleteReport = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const isPrivileged =
      user.role === 'Admin' ||
      user.role === 'SuperAdmin' ||
      user.role === 'Faculty' ||
      user.role === 'Committee';

    if (!isPrivileged) {
      return reply.status(403).send({
        success: false,
        error: 'Forbidden: Elevated administrative privileges required to delete event reports',
      });
    }

    const { id } = request.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid report ID format' });
    }

    const deleted = await EventReport.findByIdAndDelete(id);
    if (!deleted) {
      return reply.status(404).send({ success: false, error: 'Report not found' });
    }
    return reply.send({ success: true, message: 'Event report deleted successfully.' });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: error.message || 'Failed to delete report.' });
  }
};
