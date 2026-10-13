import { FastifyRequest, FastifyReply } from 'fastify';
import User from '../models/userModel';
import Enrollment from '../models/enrollmentModel';
import AttendanceRecord from '../models/attendanceRecordModel';
import '../models/attendanceSessionModel';
import '../models/eventModel';

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

    // 1. Fetch formal enrollments
    const enrollments: any = await (Enrollment as any).find({
      $or: [
        { enrolledBy: user._id },
        { members: user._id },
      ],
    })
      .populate('event')
      .sort({ createdAt: -1 });

    // 2. Fetch all verified attendance records for the student
    const attendanceRecords = await AttendanceRecord.find({ user: user._id })
      .populate({
        path: 'session',
        populate: {
          path: 'event',
        },
      })
      .sort({ timestamp: -1 })
      .lean();

    // Map attendance by event ID
    const attendanceByEventId = new Map<string, any[]>();
    for (const record of attendanceRecords) {
      const session = (record as any).session;
      const eventId = session?.event?._id?.toString();
      if (eventId) {
        const existing = attendanceByEventId.get(eventId) || [];
        existing.push(record);
        attendanceByEventId.set(eventId, existing);
      }
    }

    const processedEventIds = new Set<string>();

    // Format formal enrollments enriched with club hours & attendance verification
    const passportData = enrollments.map((act: any) => {
      const eventIdStr = act.event?._id?.toString();
      if (eventIdStr) processedEventIds.add(eventIdStr);

      const matchedRecords = eventIdStr ? attendanceByEventId.get(eventIdStr) || [] : [];
      const primaryRecord = matchedRecords[0];
      const session = primaryRecord?.session;

      const hasAttended = Boolean(act.attendanceStatus || matchedRecords.length > 0);
      const rawHours = session?.classHours || [];
      const classHours = Array.isArray(rawHours) && rawHours.length > 0 ? rawHours : hasAttended ? [1] : [];
      const clubHoursCount = classHours.length;
      const pointsAwarded = primaryRecord?.pointsAwarded ?? session?.totalPoints ?? 0;

      let clubHoursText = '';
      if (clubHoursCount > 0) {
        clubHoursText = `Hours ${classHours.join(', ')} (${clubHoursCount} hr${clubHoursCount > 1 ? 's' : ''})`;
      }

      return {
        id: act._id,
        eventId: act.event?._id,
        eventTitle: act.event?.title || 'Code Circle Event',
        eventDate: act.event?.date || act.createdAt,
        type: act.type,
        attendanceStatus: hasAttended,
        certificateUrl: act.certificateUrl,
        teamName: act.teamName,
        createdAt: act.createdAt,
        // Connected Club Hour details
        sessionName: session?.sessionName || (hasAttended ? 'Club Session' : ''),
        classHours,
        clubHoursCount,
        clubHoursText,
        pointsAwarded: hasAttended ? pointsAwarded : 0,
        attendanceDate: primaryRecord?.timestamp || null,
        isClubHour: clubHoursCount > 0,
      };
    });

    // 3. Connect any attendance records where student attended club hour without prior formal registration
    for (const record of attendanceRecords) {
      const session = (record as any).session;
      const event = session?.event;
      const eventIdStr = event?._id?.toString();

      if (eventIdStr && !processedEventIds.has(eventIdStr)) {
        processedEventIds.add(eventIdStr);
        const rawHours = session?.classHours || [];
        const classHours = Array.isArray(rawHours) && rawHours.length > 0 ? rawHours : [1];
        const clubHoursCount = classHours.length;
        const pointsAwarded = (record as any).pointsAwarded ?? session?.totalPoints ?? 50;

        passportData.push({
          id: `att-reg-${(record as any)._id}`,
          eventId: event._id,
          eventTitle: event.title || session?.sessionName || 'Club Hour Event',
          eventDate: event.date || (record as any).timestamp,
          type: event.type || 'Individual',
          attendanceStatus: true,
          certificateUrl: null,
          teamName: '',
          createdAt: (record as any).timestamp,
          // Connected Club Hour details
          sessionName: session?.sessionName || 'Club Hour Session',
          classHours,
          clubHoursCount,
          clubHoursText: `Hours ${classHours.join(', ')} (${clubHoursCount} hr${clubHoursCount > 1 ? 's' : ''})`,
          pointsAwarded,
          attendanceDate: (record as any).timestamp,
          isClubHour: true,
        });
      }
    }

    // Sort chronologically descending
    passportData.sort((a: any, b: any) => {
      const timeA = new Date(a.attendanceDate || a.eventDate || a.createdAt).getTime();
      const timeB = new Date(b.attendanceDate || b.eventDate || b.createdAt).getTime();
      return timeB - timeA;
    });

    return reply.send(passportData);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch event passport' });
  }
};

export default { getMe, updateMe, getEventPassport };
