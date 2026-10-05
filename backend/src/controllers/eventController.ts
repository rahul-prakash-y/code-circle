import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import Event, { EventType, EventFormat, EventStatus, ICustomField } from '../models/eventModel';
import Enrollment from '../models/enrollmentModel';

export interface CreateEventBody {
  title: string;
  description: string;
  type?: EventType;
  format?: EventFormat;
  date: string | Date;
  status?: EventStatus;
  venueOrLink?: string;
  maxParticipants?: number;
  maxTeamSize?: number;
  registrationDeadline?: string | Date;
  certificateTemplateUrl?: string;
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
      date,
      status = 'Upcoming',
      venueOrLink = 'Campus / Online',
      maxParticipants = 0,
      maxTeamSize = 4,
      registrationDeadline,
      certificateTemplateUrl = '',
      customFields = [],
    } = request.body;

    if (!title || !description || !date) {
      return reply.status(400).send({
        success: false,
        error: 'Title, description, and date are required fields',
      });
    }

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      type,
      format,
      date: new Date(date),
      status,
      venueOrLink: venueOrLink.trim(),
      maxParticipants: Number(maxParticipants) >= 0 ? Number(maxParticipants) : 0,
      maxTeamSize: format === 'Duo' ? 2 : (Number(maxTeamSize) > 0 ? Number(maxTeamSize) : 4),
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : new Date(date),
      certificateTemplateUrl: certificateTemplateUrl ? certificateTemplateUrl.trim() : '',
      customFields: Array.isArray(customFields) ? customFields : [],
      createdBy: new mongoose.Types.ObjectId(user.id || user._id),
    });

    return reply.status(201).send(event);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to create event',
    });
  }
};

export const getEvents = async (
  request: FastifyRequest<{ Querystring: GetEventsQuery }>,
  reply: FastifyReply
) => {
  try {
    const { status, type, format, search } = request.query;
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
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { description: regex }, { venueOrLink: regex }];
    }

    const events = await Event.find(query)
      .sort({ date: 1 })
      .populate('createdBy', 'name email profilePicUrl role');

    const eventIds = events.map((e) => e._id);
    const enrollments = await (Enrollment as any).find({ event: { $in: eventIds } });
    const countMap: Record<string, number> = {};
    for (const enr of enrollments) {
      const evId = enr.event.toString();
      const count = 1 + (enr.members?.length || 0);
      countMap[evId] = (countMap[evId] || 0) + count;
    }

    const eventsWithCounts = events.map((e) => {
      const obj: any = e.toObject ? e.toObject() : { ...e };
      obj.enrolledCount = countMap[e._id.toString()] || 0;
      return obj;
    });

    return reply.send(eventsWithCounts);
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

    const event = await Event.findById(id).populate(
      'createdBy',
      'name email profilePicUrl role'
    );

    if (!event) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    const enrollments = await (Enrollment as any).find({ event: event._id });
    const enrolledCount = enrollments.reduce(
      (sum: number, enr: any) => sum + 1 + (enr.members?.length || 0),
      0
    );

    const obj: any = event.toObject ? event.toObject() : { ...event };
    obj.enrolledCount = enrolledCount;

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

    if (updateData.registrationDeadline) {
      updateData.registrationDeadline = new Date(updateData.registrationDeadline);
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

    return reply.send({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to delete event',
    });
  }
};

export default {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
