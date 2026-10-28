const rawEnrollment = require('../models/enrollmentModel');
const Enrollment = rawEnrollment.default || rawEnrollment;
const rawEvent = require('../models/eventModel');
const Event = rawEvent.default || rawEvent;
const rawUser = require('../models/userModel');
const User = rawUser.default || rawUser;
const rawAttendanceSession = require('../models/attendanceSessionModel');
const AttendanceSession = rawAttendanceSession.default || rawAttendanceSession;
const rawAttendanceRecord = require('../models/attendanceRecordModel');
const AttendanceRecord = rawAttendanceRecord.default || rawAttendanceRecord;
const { generateCertificate } = require('../utils/pdfGenerator');
const XLSX = require('xlsx');

const enrollInEvent = async (request, reply) => {
  try {
    const user = request.user;
    const { event: eventId, type: rawType, teamName, members: memberRollNumbers, customResponses } = request.body;

    if (!eventId) {
      return reply.status(400).send({ error: 'Event ID is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    // Check if event is restricted to Admin upload only
    if (event.registrationType === 'admin_upload') {
      const callerRole = user.role;
      if (callerRole !== 'Admin' && callerRole !== 'SuperAdmin') {
        return reply.status(400).send({
          error: 'Self-registration is disabled for this event. Participants are uploaded directly by the administrator.'
        });
      }
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

    // Check overall event registration limit / student participation capacity
    if (event.maxParticipants && event.maxParticipants > 0) {
      const existingEventEnrollments = await Enrollment.find({ event: eventId });
      const currentParticipantsCount = existingEventEnrollments.reduce(
        (sum, enr) => sum + 1 + (enr.members ? enr.members.length : 0),
        0
      );

      const incomingCount = (type === 'Team' || type === 'Duo') && Array.isArray(memberRollNumbers)
        ? memberRollNumbers.length + 1
        : 1;

      if (currentParticipantsCount + incomingCount > event.maxParticipants) {
        const remaining = Math.max(0, event.maxParticipants - currentParticipantsCount);
        return reply.status(400).send({
          error: remaining === 0
            ? 'Registration full: This event has reached its maximum student participation limit.'
            : `Registration limit exceeded: Only ${remaining} spot(s) remaining for this event.`
        });
      }
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
      } else if (type === 'Team') {
        const maxTeam = event.maxTeamSize || 4;
        if (totalMembers > maxTeam) {
          return reply.status(400).send({ 
            error: `Team size exceeds maximum limit of ${maxTeam} members` 
          });
        }
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
      customResponses: customResponses && typeof customResponses === 'object' ? customResponses : {},
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

const formatEnrollmentsList = (enrollments) => {
  return enrollments.map((e) => {
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
};

const getEventEnrollments = async (request, reply) => {
  try {
    const { eventId } = request.params;
    const { participantsOnly, status } = request.query || {};

    const query = { event: eventId };
    if (participantsOnly === 'true' || participantsOnly === true || status === 'participants' || status === 'attended' || status === 'present') {
      query.attendanceStatus = true;
    } else if (status === 'absent' || status === 'unmarked') {
      query.attendanceStatus = false;
    }

    const isPaginated = request.query && request.query.page !== undefined;
    const page = Math.max(1, parseInt(request.query?.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(request.query?.limit, 10) || (isPaginated ? 20 : 200)));
    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      Enrollment.find(query)
        .populate('enrolledBy', 'name rollNo email profilePicUrl department year phone college role')
        .populate('members', 'name rollNo email profilePicUrl department year phone college role')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Enrollment.countDocuments(query),
    ]);

    const formatted = formatEnrollmentsList(enrollments);
    if (isPaginated) {
      const totalPages = Math.max(1, Math.ceil(total / limit));
      return reply.send({
        success: true,
        data: formatted,
        count: formatted.length,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          pages: totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    }

    return reply.send(formatted);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch enrollments' });
  }
};

const getEventParticipants = async (request, reply) => {
  try {
    const { eventId } = request.params;

    // Synchronize any students who marked attendance via AttendanceSession OTP / records for this event
    try {
      if (AttendanceSession && AttendanceRecord) {
        const sessions = await AttendanceSession.find({ event: eventId }).select('_id').lean();
        if (sessions.length > 0) {
          const sessionIds = sessions.map((s) => s._id);
          const records = await AttendanceRecord.find({ session: { $in: sessionIds } }).select('user').lean();
          const userIds = [...new Set(records.map((r) => r.user.toString()))];

          for (const uId of userIds) {
            const existingEnrollment = await Enrollment.findOne({
              event: eventId,
              $or: [{ enrolledBy: uId }, { members: uId }],
            });

            if (!existingEnrollment) {
              // Student marked attendance but was not pre-registered (walk-in attendee)
              await Enrollment.create({
                event: eventId,
                enrolledBy: uId,
                type: 'Individual',
                attendanceStatus: true,
                isWalkIn: true,
              });
            } else if (!existingEnrollment.attendanceStatus) {
              existingEnrollment.attendanceStatus = true;
              await existingEnrollment.save();
            }
          }
        }
      }
    } catch (syncErr) {
      request.log.warn(`[getEventParticipants] AttendanceRecord sync notice: ${syncErr.message}`);
    }

    const isPaginated = request.query && request.query.page !== undefined;
    const page = Math.max(1, parseInt(request.query?.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(request.query?.limit, 10) || (isPaginated ? 20 : 200)));
    const skip = (page - 1) * limit;

    const filter = { event: eventId, attendanceStatus: true };
    const [enrollments, total] = await Promise.all([
      Enrollment.find(filter)
        .populate('enrolledBy', 'name rollNo email profilePicUrl department year phone college role')
        .populate('members', 'name rollNo email profilePicUrl department year phone college role')
        .sort({ updatedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Enrollment.countDocuments(filter),
    ]);

    const formatted = formatEnrollmentsList(enrollments);
    if (isPaginated) {
      const totalPages = Math.max(1, Math.ceil(total / limit));
      return reply.send({
        success: true,
        data: formatted,
        count: formatted.length,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          pages: totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    }

    return reply.send(formatted);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch event participants' });
  }
};

const getEventRegistered = async (request, reply) => {
  try {
    const { eventId } = request.params;

    const isPaginated = request.query && request.query.page !== undefined;
    const page = Math.max(1, parseInt(request.query?.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(request.query?.limit, 10) || (isPaginated ? 20 : 200)));
    const skip = (page - 1) * limit;

    const filter = { event: eventId, isWalkIn: { $ne: true } };
    const [enrollments, total] = await Promise.all([
      Enrollment.find(filter)
        .populate('enrolledBy', 'name rollNo email profilePicUrl department year phone college role')
        .populate('members', 'name rollNo email profilePicUrl department year phone college role')
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Enrollment.countDocuments(filter),
    ]);

    const formatted = formatEnrollmentsList(enrollments);
    if (isPaginated) {
      const totalPages = Math.max(1, Math.ceil(total / limit));
      return reply.send({
        success: true,
        data: formatted,
        count: formatted.length,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          pages: totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    }

    return reply.send(formatted);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch registered students' });
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

    if (!event.certificateTemplateUrl) {
      return reply.status(400).send({
        error: 'No certificate template has been uploaded for this event. Please upload an official certificate template before generating certificates.'
      });
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
          const certUrl = await generateCertificate(studentName, event.title, event.date, event.certificateTemplateUrl);
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

const bulkUploadEventParticipants = async (request, reply) => {
  try {
    const { eventId } = request.params;
    if (!eventId) {
      return reply.status(400).send({ success: false, error: 'Event ID is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return reply.status(404).send({ success: false, error: 'Event not found' });
    }

    let data;
    try {
      data = await request.file();
    } catch (err) {
      return reply.status(400).send({
        success: false,
        error: 'Failed to read upload file stream: ' + (err.message || 'Stream error'),
      });
    }

    if (!data) {
      return reply.status(400).send({ success: false, error: 'No Excel file uploaded' });
    }

    const filename = (data.filename || '').toLowerCase();
    if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls') && !filename.endsWith('.csv')) {
      return reply.status(400).send({
        success: false,
        error: 'Only .xlsx, .xls, and .csv files are supported',
      });
    }

    // Read options passed in multipart form fields or query params
    let markAsAttended = false;
    const queryMark = request.query?.markAttendance;
    if (queryMark === 'true' || queryMark === true || queryMark === '1') {
      markAsAttended = true;
    }
    if (data.fields?.markAttendance) {
      const val =
        typeof data.fields.markAttendance === 'object' && 'value' in data.fields.markAttendance
          ? data.fields.markAttendance.value
          : data.fields.markAttendance;
      if (val === 'true' || val === true || val === '1') {
        markAsAttended = true;
      }
    }

    const chunks = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return reply.status(400).send({ success: false, error: 'Uploaded file is empty' });
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return reply.status(400).send({ success: false, error: 'Excel file has no valid sheets' });
    }

    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    if (!rawRows || rawRows.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'The uploaded file contains no student data rows',
      });
    }

    // Extract roll numbers and emails from rows
    const studentEntries = [];
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      let rollNo = '';
      let email = '';
      let name = '';
      let dept = '';
      let rowAttendance = markAsAttended;

      for (const [key, val] of Object.entries(row)) {
        const cleanKey = key.trim().toLowerCase();
        const strVal = String(val).trim();

        if (cleanKey.includes('roll') || cleanKey.includes('reg') || cleanKey.includes('register')) {
          if (!rollNo && strVal) rollNo = strVal.toUpperCase();
        } else if (cleanKey.includes('email') || cleanKey.includes('mail')) {
          if (!email && strVal) email = strVal.toLowerCase();
        } else if (cleanKey.includes('name')) {
          if (!name && strVal) name = strVal;
        } else if (cleanKey.includes('dept') || cleanKey.includes('department') || cleanKey.includes('branch')) {
          if (!dept && strVal) dept = strVal;
        } else if (cleanKey.includes('attend') || cleanKey.includes('present') || cleanKey.includes('status')) {
          if (strVal) {
            const lower = strVal.toLowerCase();
            if (lower === 'present' || lower === 'yes' || lower === '1' || lower === 'attended' || lower === 'true') {
              rowAttendance = true;
            } else if (lower === 'absent' || lower === 'no' || lower === '0' || lower === 'false') {
              rowAttendance = false;
            }
          }
        }
      }

      if (rollNo || email) {
        studentEntries.push({
          rowNumber: i + 2,
          rollNo,
          email,
          name,
          dept,
          attended: rowAttendance,
        });
      }
    }

    if (studentEntries.length === 0) {
      return reply.status(400).send({
        success: false,
        error:
          'No valid student roll numbers or emails found in the file. Please check column headers (e.g. "Reg No", "Roll Number", or "Email").',
      });
    }

    // Query matching users in MongoDB
    const searchRollNos = studentEntries.map((s) => s.rollNo).filter(Boolean);
    const searchEmails = studentEntries.map((s) => s.email).filter(Boolean);

    const conditions = [];
    if (searchRollNos.length > 0) conditions.push({ rollNo: { $in: searchRollNos } });
    if (searchEmails.length > 0) conditions.push({ email: { $in: searchEmails } });

    const matchedUsers = await User.find({ $or: conditions })
      .select('_id rollNo email name department year phone role')
      .lean();

    const userByRoll = new Map();
    const userByEmail = new Map();
    for (const u of matchedUsers) {
      if (u.rollNo) userByRoll.set(u.rollNo.toUpperCase().trim(), u);
      if (u.email) userByEmail.set(u.email.toLowerCase().trim(), u);
    }

    // Existing enrollments for this event
    const matchedUserIds = matchedUsers.map((u) => u._id);
    const existingEnrollments = await Enrollment.find({
      event: eventId,
      $or: [{ enrolledBy: { $in: matchedUserIds } }, { members: { $in: matchedUserIds } }],
    });

    const enrolledUserMap = new Map();
    for (const enr of existingEnrollments) {
      if (enr.enrolledBy) enrolledUserMap.set(enr.enrolledBy.toString(), enr);
      if (enr.members && enr.members.length > 0) {
        for (const m of enr.members) {
          enrolledUserMap.set(m.toString(), enr);
        }
      }
    }

    let newlyEnrolledCount = 0;
    let attendanceUpdatedCount = 0;
    let alreadyEnrolledCount = 0;
    const notFound = [];
    const processedUserIds = new Set();
    const newEnrollmentsToInsert = [];

    for (const entry of studentEntries) {
      const user =
        (entry.rollNo && userByRoll.get(entry.rollNo)) ||
        (entry.email && userByEmail.get(entry.email));

      if (!user) {
        notFound.push({
          row: entry.rowNumber,
          rollNo: entry.rollNo || 'N/A',
          email: entry.email || 'N/A',
          name: entry.name || 'N/A',
          reason: 'Student not found in Code Circle system',
        });
        continue;
      }

      const uIdStr = user._id.toString();
      if (processedUserIds.has(uIdStr)) {
        continue; // Skip duplicate row in sheet
      }
      processedUserIds.add(uIdStr);

      const existingEnr = enrolledUserMap.get(uIdStr);
      if (existingEnr) {
        alreadyEnrolledCount++;
        // If student is already enrolled and sheet indicates attendance, update attendance
        if (entry.attended && !existingEnr.attendanceStatus) {
          existingEnr.attendanceStatus = true;
          await existingEnr.save();
          attendanceUpdatedCount++;
        }
      } else {
        newEnrollmentsToInsert.push({
          event: eventId,
          enrolledBy: user._id,
          type: 'Individual',
          attendanceStatus: entry.attended,
          isWalkIn: false,
          customResponses: {},
        });
        newlyEnrolledCount++;
      }
    }

    if (newEnrollmentsToInsert.length > 0) {
      await Enrollment.insertMany(newEnrollmentsToInsert, { ordered: false });
    }

    return reply.send({
      success: true,
      message: `Roster upload complete: ${newlyEnrolledCount} student(s) enrolled, ${alreadyEnrolledCount} already enrolled${
        attendanceUpdatedCount > 0 ? ` (${attendanceUpdatedCount} attendance verified)` : ''
      }${notFound.length > 0 ? `, ${notFound.length} not found` : ''}.`,
      summary: {
        totalRowsInFile: rawRows.length,
        validStudentEntries: studentEntries.length,
        newlyEnrolledCount,
        alreadyEnrolledCount,
        attendanceUpdatedCount,
        notFoundCount: notFound.length,
        notFound: notFound.slice(0, 50),
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to bulk upload event participants: ' + (error.message || 'Unknown error'),
    });
  }
};

const downloadSampleTemplate = async (request, reply) => {
  try {
    const { eventId } = request.params;
    const event = await Event.findById(eventId).select('title date format type');

    const sampleData = [
      {
        'Reg No': '7376221CS101',
        'Student Name': 'Aditya Kumar',
        'Student Official Email ID': 'aditya.cs22@bitsathy.ac.in',
        'Department': 'CSE',
        'Attendance Status (Optional)': 'Present',
      },
      {
        'Reg No': '7376221CS102',
        'Student Name': 'Bhavana S',
        'Student Official Email ID': 'bhavana.cs22@bitsathy.ac.in',
        'Department': 'AI & DS',
        'Attendance Status (Optional)': 'Present',
      },
      {
        'Reg No': '7376221EC105',
        'Student Name': 'Chandran R',
        'Student Official Email ID': 'chandran.ec22@bitsathy.ac.in',
        'Department': 'ECE',
        'Attendance Status (Optional)': 'Absent',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants Roster');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const safeTitle = event?.title ? event.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'event';
    const filename = `${safeTitle}_participants_sample_template.xlsx`;

    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);
    return reply.send(buffer);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to generate sample template' });
  }
};

module.exports = {
  enrollInEvent,
  getEventEnrollments,
  getEventParticipants,
  getEventRegistered,
  updateAttendance,
  generateCertificates,
  getMyCertificates,
  bulkUploadEventParticipants,
  downloadSampleTemplate,
};
