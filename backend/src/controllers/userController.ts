import { FastifyRequest, FastifyReply } from 'fastify';
import User from '../models/userModel';
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
    const {
      name,
      department,
      skills,
      socialLinks,
      profilePicUrl,
      phone,
      phoneNumber,
      dob,
      dateOfBirth,
      gender,
      year,
      college,
      bio,
    } = (request.body || {}) as any;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (department !== undefined) updateData.department = department;
    if (skills !== undefined) updateData.skills = skills;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (profilePicUrl !== undefined) updateData.profilePicUrl = profilePicUrl;

    const rawPhone = phone !== undefined ? phone : phoneNumber;
    if (rawPhone !== undefined) {
      updateData.phone = rawPhone ? String(rawPhone).trim() : '';
      updateData.phoneNumber = updateData.phone;
    }

    const rawDob = dob !== undefined ? dob : dateOfBirth;
    if (rawDob !== undefined) {
      updateData.dob = rawDob ? String(rawDob).trim() : '';
      updateData.dateOfBirth = updateData.dob;
    }

    if (gender !== undefined) updateData.gender = gender ? String(gender).trim() : '';
    if (year !== undefined) updateData.year = year ? String(year).trim() : '';
    if (college !== undefined) updateData.college = college ? String(college).trim() : 'BIT';
    if (bio !== undefined) updateData.bio = bio ? String(bio).trim() : '';

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
      eventTitle: act.event?.title || 'Code Circle Event',
      eventDate: act.event?.date || act.createdAt,
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
