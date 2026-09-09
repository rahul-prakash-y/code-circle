const rawEnrollment = require('../models/enrollmentModel');
const Enrollment = rawEnrollment.default || rawEnrollment;
const rawEvent = require('../models/eventModel');
const Event = rawEvent.default || rawEvent;
const rawUser = require('../models/userModel');
const User = rawUser.default || rawUser;
const { generateCertificate } = require('../utils/pdfGenerator');

const enrollInEvent = async (request, reply) => {
  try {
    const user = request.user;
    const { event: eventId, type: rawType, teamName, members: memberRollNumbers } = request.body;

    if (!eventId) {
      return reply.status(400).send({ error: 'Event ID is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    // Determine registration format ('Individual' vs 'Duo' vs 'Team')
    let type = 'Individual';
    if (rawType === 'Team' || rawType === 'Duo' || rawType === 'Individual') {
      type = rawType;
    } else if (event.format === 'Duo') {
      type = 'Duo';
    } else if (event.format === 'Team' || event.type === 'Team') {
      type = 'Team';
    }

    const now = new Date();
    if (event.registrationDeadline && !isNaN(new Date(event.registrationDeadline).getTime())) {
      if (now > new Date(event.registrationDeadline)) {
        return reply.status(400).send({ error: 'Registration deadline has passed' });
      }
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

    if (type === 'Team' || type === 'Duo') {
      if (!teamName || !teamName.trim()) {
        return reply.status(400).send({ 
          error: `${type === 'Duo' ? 'Duo' : 'Team'} name is required for registration` 
        });
      }

      const totalMembers = (memberRollNumbers ? memberRollNumbers.length : 0) + 1;

      if (type === 'Duo') {
        if (!memberRollNumbers || memberRollNumbers.length !== 1 || !memberRollNumbers[0]?.trim()) {
          return reply.status(400).send({ 
            error: 'Duo format requires exactly 1 partner roll number' 
          });
        }
      } else if (event.maxParticipants > 0 && totalMembers > event.maxParticipants) {
        return reply.status(400).send({ 
          error: `Team size exceeds maximum limit of ${event.maxParticipants} members` 
        });
      }

      if (memberRollNumbers && memberRollNumbers.length > 0) {
        // Prevent enrolling oneself as a team member twice
        const cleanedRollNumbers = memberRollNumbers
          .map(rn => (typeof rn === 'string' ? rn.trim() : ''))
          .filter(rn => rn !== '' && rn !== user.rollNo);

        if (cleanedRollNumbers.length === 0 && type === 'Duo') {
          return reply.status(400).send({ error: 'You cannot add yourself as your Duo partner' });
        }

        if (cleanedRollNumbers.length > 0) {
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
    }

    const isGroup = type === 'Team' || type === 'Duo';
    const enrollmentData = {
      event: eventId,
      enrolledBy: user._id,
      type,
      teamName: isGroup ? teamName.trim() : undefined,
      members: isGroup ? teamMembers : undefined,
    };

    const enrollment = await Enrollment.create(enrollmentData);

    return reply.status(201).send(enrollment);
  } catch (error) {
    request.log.error(error);
    const errorMessage = error.message || 'Failed to enroll in event';
    return reply.status(error.name === 'ValidationError' ? 400 : 500).send({ error: errorMessage });
  }
};

const deriveStudentYear = (user) => {
  if (!user) return '3rd Year';
  if (user.year) {
    const yStr = String(user.year).trim();
    if (/^[1-4]$/.test(yStr)) {
      const map = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
      return map[yStr] || `${yStr} Year`;
    }
    if (yStr.toLowerCase().includes('year')) return yStr;
    return `${yStr} Year`;
  }

  const roll = String(user.rollNo || '').toUpperCase().trim();
  const email = String(user.email || '').toLowerCase().trim();

  // Anna University register format: 7376YY... (e.g. 7376231CS272 -> admitted 2023)
  const auMatch = roll.match(/^7376(\d{2})/);
  if (auMatch) {
    const admitYear = 2000 + parseInt(auMatch[1], 10);
    const now = new Date();
    let diff = now.getFullYear() - admitYear;
    if (now.getMonth() >= 6) diff += 1;
    if (diff <= 1) return '1st Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '3rd Year';
    return '4th Year';
  }

  // BIT Roll format: 2026UAD1021 (Graduation year prefix)
  const bitPassMatch = roll.match(/^(20\d{2})[A-Z]/);
  if (bitPassMatch) {
    const passYear = parseInt(bitPassMatch[1], 10);
    const now = new Date();
    const admitYear = passYear - 4;
    let diff = now.getFullYear() - admitYear;
    if (now.getMonth() >= 6) diff += 1;
    if (diff <= 1) return '1st Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '3rd Year';
    return '4th Year';
  }

  // Institutional email format: .ad26@bitsathy.ac.in or .cs23@bitsathy.ac.in
  const emailMatch = email.match(/([a-z]+)(\d{2})@bitsathy\.ac\.in/);
  if (emailMatch) {
    const num = parseInt(emailMatch[2], 10);
    const admitYear = num >= 25 ? 2000 + num - 4 : 2000 + num;
    const now = new Date();
    let diff = now.getFullYear() - admitYear;
    if (now.getMonth() >= 6) diff += 1;
    if (diff <= 1) return '1st Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '3rd Year';
    return '4th Year';
  }

  // General 2-digit roll format: e.g. 23CS012
  const generalRollMatch = roll.match(/^(\d{2})[A-Z]/);
  if (generalRollMatch) {
    const admitYear = 2000 + parseInt(generalRollMatch[1], 10);
    const now = new Date();
    let diff = now.getFullYear() - admitYear;
    if (now.getMonth() >= 6) diff += 1;
    if (diff <= 1) return '1st Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '3rd Year';
    return '4th Year';
  }

  return '3rd Year';
};

const getEventEnrollments = async (request, reply) => {
  try {
    const { eventId } = request.params;

    const enrollments = await Enrollment.find({ event: eventId })
      .populate('enrolledBy', 'name rollNo email profilePicUrl department year phone college role')
      .populate('members', 'name rollNo email profilePicUrl department year phone college role')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = enrollments.map((e) => {
      if (e.enrolledBy) {
        e.enrolledBy.college = e.enrolledBy.college || 'BIT';
        e.enrolledBy.year = deriveStudentYear(e.enrolledBy);
      }
      if (e.members && e.members.length > 0) {
        e.members = e.members.map((m) => {
          if (m) {
            m.college = m.college || 'BIT';
            m.year = deriveStudentYear(m);
          }
          return m;
        });
      }
      return e;
    });

    return reply.send(formatted);
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
