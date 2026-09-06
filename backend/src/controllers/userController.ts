import { FastifyRequest, FastifyReply } from 'fastify';
import User from '../models/userModel';
// @ts-ignore
import Enrollment from '../models/enrollmentModel';

export const getMe = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = (request.user || {}) as any;
    const user = await User.findById(id).select('-password -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return reply.status(404).send({ success: false, error: 'User profile not found' });
    }
    
    return reply.send(user);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch user profile' });
  }
};

export const updateMe = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = (request.user || {}) as any;
    const { name, department, skills, socialLinks, profilePicUrl } = (request.body || {}) as any;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (department !== undefined) updateData.department = department;
    if (skills !== undefined) updateData.skills = skills;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (profilePicUrl !== undefined) updateData.profilePicUrl = profilePicUrl;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }
    
    return reply.send(user);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to update user profile' });
  }
};

export const getEventPassport = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = (request.user || {}) as any;
    const user = await User.findById(id);

    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    const activities: any = await (Enrollment as any).find({
      $or: [
        { enrolledBy: user._id },
        { members: user._id },
      ],
    })
      .populate('event')
      .sort({ createdAt: -1 });

    const passportData = activities.map((act: any) => ({
      id: act._id,
      eventId: act.event?._id,
      eventTitle: act.event?.title,
      eventDate: act.event?.date,
      type: act.type,
      attendanceStatus: act.attendanceStatus,
      certificateUrl: act.certificateUrl,
      teamName: act.teamName,
      createdAt: act.createdAt,
    }));

    return reply.send(passportData);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch event passport' });
  }
};

export default { getMe, updateMe, getEventPassport };
