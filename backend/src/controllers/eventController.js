const Event = require('../models/eventModel');
const User = require('../models/userModel');

const createEvent = async (request, reply) => {
  try {
    const { email } = request.user;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'Admin') {
      return reply.status(403).send({ error: 'Forbidden: Admin access only' });
    }

    const { 
      title, 
      description, 
      date, 
      venueOrLink, 
      type, 
      maxParticipants, 
      registrationDeadline 
    } = request.body;

    const event = await Event.create({
      title,
      description,
      date,
      venueOrLink,
      type,
      maxParticipants: type === 'Team' ? maxParticipants : 0,
      registrationDeadline,
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
    const { status } = request.query;
    const query = {};
    const now = new Date();

    if (status === 'upcoming') {
      query.date = { $gte: now };
    } else if (status === 'past') {
      query.date = { $lt: now };
    }

    const events = await Event.find(query)
      .sort({ date: 1 })
      .populate('createdBy', 'name email');

    return reply.send(events);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch events' });
  }
};

const updateEvent = async (request, reply) => {
  try {
    const { email } = request.user;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'Admin') {
      return reply.status(403).send({ error: 'Forbidden: Admin access only' });
    }

    const { id } = request.params;
    const updateData = request.body;

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
    const { email } = request.user;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'Admin') {
      return reply.status(403).send({ error: 'Forbidden: Admin access only' });
    }

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
