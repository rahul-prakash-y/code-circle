const User = require('../models/userModel');
const Enrollment = require('../models/enrollmentModel');

const getMe = async (request, reply) => {
  try {
    const { id } = request.user;
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return reply.status(404).send({ error: 'User profile not found' });
    }
    
    return reply.send(user);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch user profile' });
  }
};

const updateMe = async (request, reply) => {
  try {
    const { id } = request.user;
    const { name, department, skills, socialLinks, profilePicUrl } = request.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (department !== undefined) updateData.department = department;
    if (skills !== undefined) updateData.skills = skills;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (profilePicUrl !== undefined) updateData.profilePicUrl = profilePicUrl;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    return reply.send(user);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to update user profile' });
  }
};

const getEventPassport = async (request, reply) => {
  try {
    const { id } = request.user;
    const user = await User.findById(id);

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const activities = await Enrollment.find({
      $or: [
        { enrolledBy: user._id },
        { members: user._id }
      ]
    })
    .populate('event')
    .sort({ createdAt: -1 });

    const passportData = activities.map(act => ({
      id: act._id,
      eventId: act.event?._id,
      eventTitle: act.event?.title,
      eventDate: act.event?.date,
      type: act.type,
      attendanceStatus: act.attendanceStatus,
      certificateUrl: act.certificateUrl,
      teamName: act.teamName,
      createdAt: act.createdAt
    }));

    return reply.send(passportData);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch event passport' });
  }
};

module.exports = { getMe, updateMe, getEventPassport };
