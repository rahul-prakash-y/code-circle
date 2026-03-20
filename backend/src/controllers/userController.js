const User = require('../models/userModel');
const Enrollment = require('../models/enrollmentModel');
const Event = require('../models/eventModel');

const getMe = async (request, reply) => {
  try {
    const { email } = request.user; // request.user is set by Firebase authMiddleware
    let user = await User.findOne({ email });
    
    if (!user) {
      // If user doesn't exist, create a basic profile using Firebase info
      user = await User.create({
        email: request.user.email,
        name: request.user.name || 'Anonymous',
        rollNo: request.user.rollNo || `TEMP-${Date.now()}`, // Fallback if rollNo is not in token
        role: 'Student'
      });
    }
    
    return reply.send(user);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch user profile' });
  }
};

const updateMe = async (request, reply) => {
  try {
    const { email } = request.user;
    const { name, department, skills, socialLinks, profilePicUrl } = request.body;
    
    request.log.info({ email, skills }, 'Processing updateMe');

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (department !== undefined) updateData.department = department;
    if (skills !== undefined) updateData.skills = skills;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (profilePicUrl !== undefined) updateData.profilePicUrl = profilePicUrl;

    const user = await User.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      request.log.warn({ email }, 'User not found in updateMe');
      return reply.status(404).send({ error: 'User not found' });
    }
    
    request.log.info({ user }, 'User updated successfully');
    return reply.send(user);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to update user profile' });
  }
};

const getEventPassport = async (request, reply) => {
  try {
    const { email } = request.user;
    const user = await User.findOne({ email });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Fetch user's enrollments populated with event details
    const activities = await Enrollment.find({
      $or: [
        { enrolledBy: user._id },
        { members: user._id }
      ]
    })
    .populate('event')
    .sort({ createdAt: -1 });

    // Format for timeline
    const passportData = activities.map(act => ({
      id: act._id,
      eventId: act.event?._id,
      eventTitle: act.event?.title,
      eventDate: act.event.date,
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
