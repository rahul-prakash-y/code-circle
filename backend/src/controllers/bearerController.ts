import { FastifyRequest, FastifyReply } from 'fastify';
import StudentBearer from '../models/studentBearerModel';

export const getBearers = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const bearers = await StudentBearer.find().sort({ createdAt: 1 });
    return reply.send(bearers);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch student bearers',
    });
  }
};

export const createBearer = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { name, position, photoUrl, linkedinUrl, bio } = request.body as {
      name?: string;
      position?: string;
      photoUrl?: string;
      linkedinUrl?: string;
      bio?: string;
    };

    if (!name || !name.trim()) {
      return reply.status(400).send({ success: false, error: 'Name is required' });
    }
    if (!position || !position.trim()) {
      return reply.status(400).send({ success: false, error: 'Position is required' });
    }
    if (!photoUrl || !photoUrl.trim()) {
      return reply.status(400).send({ success: false, error: 'Photo URL is required' });
    }

    if (bio && bio.length > 120) {
      return reply.status(400).send({
        success: false,
        error: 'Bio cannot exceed 120 characters',
      });
    }

    const bearer = await StudentBearer.create({
      name: name.trim(),
      position: position.trim(),
      photoUrl: photoUrl.trim(),
      linkedinUrl: linkedinUrl ? linkedinUrl.trim() : '',
      bio: bio ? bio.trim() : '',
    });

    return reply.status(201).send(bearer);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to create student bearer',
    });
  }
};

export const updateBearer = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const { name, position, photoUrl, linkedinUrl, bio } = request.body as {
      name?: string;
      position?: string;
      photoUrl?: string;
      linkedinUrl?: string;
      bio?: string;
    };

    if (bio !== undefined && bio.length > 120) {
      return reply.status(400).send({
        success: false,
        error: 'Bio cannot exceed 120 characters',
      });
    }

    const updatePayload: Record<string, any> = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (position !== undefined) updatePayload.position = position.trim();
    if (photoUrl !== undefined) updatePayload.photoUrl = photoUrl.trim();
    if (linkedinUrl !== undefined) updatePayload.linkedinUrl = linkedinUrl.trim();
    if (bio !== undefined) updatePayload.bio = bio.trim();

    const bearer = await StudentBearer.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!bearer) {
      return reply.status(404).send({ success: false, error: 'Bearer not found' });
    }

    return reply.send(bearer);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to update student bearer',
    });
  }
};

export const deleteBearer = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const bearer = await StudentBearer.findByIdAndDelete(id);

    if (!bearer) {
      return reply.status(404).send({ success: false, error: 'Bearer not found' });
    }

    return reply.send({ success: true, message: 'Bearer deleted successfully' });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to delete student bearer',
    });
  }
};

export default {
  getBearers,
  createBearer,
  updateBearer,
  deleteBearer,
};
