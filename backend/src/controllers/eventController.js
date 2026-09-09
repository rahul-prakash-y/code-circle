const Event = require('../models/eventModel');

const createEvent = async (request, reply) => {
  try {
    const user = request.user;
    const { 
      title, 
      description, 
      date, 
      venueOrLink, 
      type, 
      format,
      maxParticipants, 
      registrationDeadline,
      certificateTemplateUrl 
    } = request.body;

    if (!title || !description || !date || !venueOrLink || !type || !registrationDeadline) {
      return reply.status(400).send({ 
        error: 'Title, description, date, venue/link, type, and registration deadline are required' 
      });
    }

    const eventFormat = format || (type === 'Team' ? 'Team' : 'Individual');
    const computedMax = eventFormat === 'Duo' ? 2 : (eventFormat === 'Team' ? (maxParticipants || 4) : 0);

    const event = await Event.create({
      title,
      description,
      date,
      venueOrLink,
      type,
      format: eventFormat,
      maxParticipants: computedMax,
      registrationDeadline,
      certificateTemplateUrl: certificateTemplateUrl ? String(certificateTemplateUrl).trim() : '',
      createdBy: user._id
    });

    return reply.status(201).send(event);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to create event' });
  }
};

const getEvents = async (request, reply) => {
  try {
    const { status, type, format, search } = request.query;
    const query = {};
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
      .populate('createdBy', 'name email profilePicUrl');

    return reply.send(events);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch events' });
  }
};

const updateEvent = async (request, reply) => {
  try {
    const { id } = request.params;
    const updateData = { ...request.body };

    if (updateData.type === 'Individual') {
      updateData.maxParticipants = 0;
    }

    const event = await Event.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    return reply.send(event);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to update event' });
  }
};

const deleteEvent = async (request, reply) => {
  try {
    const { id } = request.params;
    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    return reply.send({ message: 'Event deleted successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to delete event' });
  }
};

module.exports = {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent
};
