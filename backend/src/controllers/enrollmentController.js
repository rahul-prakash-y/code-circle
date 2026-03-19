const Enrollment = require('../models/enrollmentModel');
const Event = require('../models/eventModel');
const User = require('../models/userModel');

const enrollInEvent = async (request, reply) => {
  try {
    const { email } = request.user;
    const user = await User.findOne({ email });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const { event: eventId, type, teamName, members: memberRollNumbers } = request.body;

    // 1. Check if the event exists and if the registration deadline has passed.
    const event = await Event.findById(eventId);
    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    const now = new Date();
    if (now > new Date(event.registrationDeadline)) {
      return reply.status(400).send({ error: 'Registration deadline has passed' });
    }

    // 2. Duplicate Check: Ensure the user making the request isn't already enrolled in this event 
    // (either individually or as part of another team).
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

    // 3. Team Logic: If type === 'Team':
    if (type === 'Team') {
      if (!teamName) {
        return reply.status(400).send({ error: 'Team name is required for team enrollment' });
      }

      const totalMembers = (memberRollNumbers ? memberRollNumbers.length : 0) + 1; // +1 for the creator

      // Validate that the total number of members does not exceed the event's maxParticipants.
      if (totalMembers > event.maxParticipants) {
        return reply.status(400).send({ 
          error: `Team size exceeds maximum limit of ${event.maxParticipants} members` 
        });
      }

      // Query the User database using the provided array of Roll Numbers to ensure all team members actually exist.
      if (memberRollNumbers && memberRollNumbers.length > 0) {
        const foundMembers = await User.find({ rollNo: { $in: memberRollNumbers } });
        const foundRollNumbers = foundMembers.map(m => m.rollNo);
        const missingRollNumbers = memberRollNumbers.filter(rn => !foundRollNumbers.includes(rn));

        if (missingRollNumbers.length > 0) {
          return reply.status(400).send({ 
            error: `Roll Number(s) ${missingRollNumbers.join(', ')} not found` 
          });
        }

        // Ensure none of the added team members are already enrolled in this event.
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
      teamName: type === 'Team' ? teamName : undefined,
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
    const { email } = request.user;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'Admin') {
      return reply.status(403).send({ error: 'Forbidden: Admin access only' });
    }

    const { eventId } = request.params;

    const enrollments = await Enrollment.find({ event: eventId })
      .populate('enrolledBy', 'name rollNo email')
      .populate('members', 'name rollNo email')
      .sort({ createdAt: -1 });

    return reply.send(enrollments);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch enrollments' });
  }
};

const updateAttendance = async (request, reply) => {
  try {
    const { email } = request.user;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'Admin') {
      return reply.status(403).send({ error: 'Forbidden: Admin access only' });
    }

    const { eventId } = request.params;
    const { enrollmentIds } = request.body;

    if (!Array.isArray(enrollmentIds)) {
      return reply.status(400).send({ error: 'enrollmentIds should be an array' });
    }

    // Mark all specified enrollments as present
    await Enrollment.updateMany(
      { _id: { $in: enrollmentIds }, event: eventId },
      { $set: { attendanceStatus: true } }
    );

    return reply.send({ message: 'Attendance updated successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to update attendance' });
  }
};

const generateCertificates = async (request, reply) => {
  try {
    const { email } = request.user;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'Admin') {
      return reply.status(403).send({ error: 'Forbidden: Admin access only' });
    }

    const { eventId } = request.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    const { generateCertificate } = require('../utils/pdfGenerator');

    // Find all present students who don't have a certificate yet
    const eligibleEnrollments = await Enrollment.find({
      event: eventId,
      attendanceStatus: true,
      certificateUrl: null
    }).populate('enrolledBy', 'name email');

    if (eligibleEnrollments.length === 0) {
      return reply.send({ message: 'No certificates to generate', count: 0 });
    }

    let generatedCount = 0;

    for (const enrollment of eligibleEnrollments) {
      try {
        const studentName = enrollment.enrolledBy.name;
        const certUrl = await generateCertificate(studentName, event.title, event.date);

        enrollment.certificateUrl = certUrl;
        await enrollment.save();
        generatedCount++;
      } catch (err) {
        request.log.error(`Failed to generate certificate for ${enrollment.enrolledBy.email}: ${err.message}`);
        // Continue with others
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
    const { email } = request.user;
    const user = await User.findOne({ email });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Find enrollments where the user is either the creator (enrolledBy) or a member (members)
    // and a certificate exists.
    const enrollmentsWithCerts = await Enrollment.find({
      $or: [
        { enrolledBy: user._id },
        { members: user._id }
      ],
      certificateUrl: { $ne: null }
    }).populate('event', 'title date thumbnail');

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
