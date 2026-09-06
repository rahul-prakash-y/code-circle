const Enrollment = require('../models/enrollmentModel');
const Event = require('../models/eventModel');
const User = require('../models/userModel');
const { generateCertificate } = require('../utils/pdfGenerator');

const enrollInEvent = async (request, reply) => {
  try {
    const user = request.user;
    const { event: eventId, type, teamName, members: memberRollNumbers } = request.body;

    if (!eventId || !type) {
      return reply.status(400).send({ error: 'Event ID and registration type are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    const now = new Date();
    if (now > new Date(event.registrationDeadline)) {
      return reply.status(400).send({ error: 'Registration deadline has passed' });
    }

    const existingEnrollment = await Enrollment.findOne({
      event: eventId,
      $or: [
        { enrolledBy: user._id },
        { members: user._id }
      ]
    });

    if (existingEnrollment) {
      return reply.status(400).send({ error: 'You are already enrolled in this event' });
    }

    let teamMembers = [];

    if (type === 'Team') {
      if (!teamName || !teamName.trim()) {
        return reply.status(400).send({ error: 'Team name is required for team enrollment' });
      }

      const totalMembers = (memberRollNumbers ? memberRollNumbers.length : 0) + 1;

      if (event.maxParticipants > 0 && totalMembers > event.maxParticipants) {
        return reply.status(400).send({ 
          error: `Team size exceeds maximum limit of ${event.maxParticipants} members` 
        });
      }

      if (memberRollNumbers && memberRollNumbers.length > 0) {
        // Prevent enrolling oneself as a team member twice
        const cleanedRollNumbers = memberRollNumbers.filter(rn => rn !== user.rollNo);
        const foundMembers = await User.find({ rollNo: { $in: cleanedRollNumbers } });
        const foundRollNumbers = foundMembers.map(m => m.rollNo);
        const missingRollNumbers = cleanedRollNumbers.filter(rn => !foundRollNumbers.includes(rn));

        if (missingRollNumbers.length > 0) {
          return reply.status(400).send({ 
            error: `Roll Number(s) ${missingRollNumbers.join(', ')} not found` 
          });
        }

        const memberIds = foundMembers.map(m => m._id);
        const teamMemberEnrollment = await Enrollment.findOne({
          event: eventId,
          $or: [
            { enrolledBy: { $in: memberIds } },
            { members: { $in: memberIds } }
          ]
        });

        if (teamMemberEnrollment) {
          return reply.status(400).send({ 
            error: 'One or more team members are already enrolled in this event' 
          });
        }

        teamMembers = memberIds;
      }
    }

    const enrollmentData = {
      event: eventId,
      enrolledBy: user._id,
      type,
      teamName: type === 'Team' ? teamName.trim() : undefined,
      members: type === 'Team' ? teamMembers : undefined,
    };

    const enrollment = await Enrollment.create(enrollmentData);

    return reply.status(201).send(enrollment);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to enroll in event' });
  }
};

const getEventEnrollments = async (request, reply) => {
  try {
    const { eventId } = request.params;

    const enrollments = await Enrollment.find({ event: eventId })
      .populate('enrolledBy', 'name rollNo email profilePicUrl department')
      .populate('members', 'name rollNo email profilePicUrl department')
      .sort({ createdAt: -1 });

    return reply.send(enrollments);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch enrollments' });
  }
};

const updateAttendance = async (request, reply) => {
  try {
    const { eventId } = request.params;
    const { enrollmentIds, attendanceStatus = true } = request.body;

    if (!Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
      return reply.status(400).send({ error: 'enrollmentIds must be a non-empty array' });
    }

    const updateResult = await Enrollment.updateMany(
      { _id: { $in: enrollmentIds }, event: eventId },
      { $set: { attendanceStatus: Boolean(attendanceStatus) } }
    );

    return reply.send({ 
      message: 'Attendance updated successfully',
      modifiedCount: updateResult.modifiedCount 
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to update attendance' });
  }
};

const generateCertificates = async (request, reply) => {
  try {
    const { eventId } = request.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    const eligibleEnrollments = await Enrollment.find({
      event: eventId,
      attendanceStatus: true,
      certificateUrl: null
    }).populate('enrolledBy', 'name email');

    if (eligibleEnrollments.length === 0) {
      return reply.send({ message: 'No certificates pending generation', count: 0 });
    }

    let generatedCount = 0;
    // Process in batches of 5 to avoid overwhelming Cloudinary or blocking the event loop
    const BATCH_SIZE = 5;
    for (let i = 0; i < eligibleEnrollments.length; i += BATCH_SIZE) {
      const batch = eligibleEnrollments.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (enrollment) => {
          const studentName = enrollment.enrolledBy.name;
          const certUrl = await generateCertificate(studentName, event.title, event.date);
          enrollment.certificateUrl = certUrl;
          await enrollment.save();
          return certUrl;
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          generatedCount++;
        } else {
          request.log.error(`Certificate generation error: ${result.reason?.message}`);
        }
      }
    }

    return reply.send({ 
      message: `${generatedCount} certificate(s) generated successfully`,
      count: generatedCount 
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to generate certificates' });
  }
};

const getMyCertificates = async (request, reply) => {
  try {
    const user = request.user;

    const enrollmentsWithCerts = await Enrollment.find({
      $or: [
        { enrolledBy: user._id },
        { members: user._id }
      ],
      certificateUrl: { $ne: null }
    }).populate('event', 'title date venueOrLink type');

    return reply.send(enrollmentsWithCerts);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch certificates' });
  }
};

module.exports = {
  enrollInEvent,
  getEventEnrollments,
  updateAttendance,
  generateCertificates,
  getMyCertificates
};
