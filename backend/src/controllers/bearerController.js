const Bearer = require('../models/bearerModel');
const User = require('../models/userModel');

const getBearers = async (request, reply) => {
  try {
    const bearers = await Bearer.find().sort({ createdAt: 1 });
    return reply.send(bearers);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch bearers' });
  }
};

const createBearer = async (request, reply) => {
  try {
    const { email } = request.user;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'Admin') {
      return reply.status(403).send({ error: 'Forbidden: Admin access only' });
    }

    const bearerData = request.body;
    const bearer = await Bearer.create(bearerData);
    return reply.status(201).send(bearer);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to create bearer' });
  }
};

const updateBearer = async (request, reply) => {
  try {
    const { email } = request.user;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'Admin') {
      return reply.status(403).send({ error: 'Forbidden: Admin access only' });
    }

    const { id } = request.params;
    const updateData = request.body;
    const bearer = await Bearer.findByIdAndUpdate(id, updateData, { new: true });

    if (!bearer) {
      return reply.status(404).send({ error: 'Bearer not found' });
    }

    return reply.send(bearer);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to update bearer' });
  }
};

const deleteBearer = async (request, reply) => {
  try {
    const { email } = request.user;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'Admin') {
      return reply.status(403).send({ error: 'Forbidden: Admin access only' });
    }

    const { id } = request.params;
    const bearer = await Bearer.findByIdAndDelete(id);

    if (!bearer) {
      return reply.status(404).send({ error: 'Bearer not found' });
    }

    return reply.send({ message: 'Bearer deleted successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to delete bearer' });
  }
};

module.exports = {
  getBearers,
  createBearer,
  updateBearer,
  deleteBearer
};
