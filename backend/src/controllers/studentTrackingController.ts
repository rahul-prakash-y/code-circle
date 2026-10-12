import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import { Transform, pipeline } from 'stream';
import { stringify } from 'csv-stringify';
import User from '../models/userModel';
import AttendanceRecord from '../models/attendanceRecordModel';
import AttendanceModel from '../models/attendanceModel';
import StudentProgress from '../models/studentProgressModel';
import AssessmentSubmission from '../models/assessmentSubmissionModel';
import CodingSubmission from '../models/codingSubmissionModel';
import Domain from '../models/domainModel';
import Level from '../models/levelModel';
import '../models/eventModel';
import '../models/attendanceSessionModel';
import '../models/assessmentModel';
import '../models/codingChallengeModel';
import { generateStudentReportPdf } from '../services/studentReportPdfService';

export interface TrackingStudentsQuery {
  page?: string;
  limit?: string;
  search?: string;
  department?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Route 1: GET /api/admin/tracking/students
 * Paginated list of students with real-time search.
 * Attaches summary metrics using Mongoose $lookup:
 * - totalEventsAttended
 * - questsCompleted
 * - averageAssessmentScore
 */
export const getTrackingStudents = async (
  request: FastifyRequest<{ Querystring: TrackingStudentsQuery }>,
  reply: FastifyReply
) => {
  try {
    const {
      page: pageQuery = '1',
      limit: limitQuery = '15',
      search = '',
      department = 'all',
      sortBy = 'totalEventsAttended',
      sortOrder = 'desc',
    } = request.query;

    const page = Math.max(1, parseInt(pageQuery, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(limitQuery, 10) || 15));
    const skip = (page - 1) * limit;

    // Filter students by role
    const matchStage: any = {
      role: { $in: ['Student', 'Member', 'Committee'] },
    };

    if (department && department !== 'all') {
      matchStage.department = department;
    }

    if (search && search.trim()) {
      const s = search.trim();
      matchStage.$or = [
        { name: { $regex: s, $options: 'i' } },
        { rollNo: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { department: { $regex: s, $options: 'i' } },
      ];
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortFieldMap: Record<string, string> = {
      name: 'name',
      rollNo: 'rollNo',
      department: 'department',
      points: 'points',
      totalEventsAttended: 'totalEventsAttended',
      questsCompleted: 'questsCompleted',
      averageAssessmentScore: 'averageAssessmentScore',
      createdAt: 'createdAt',
    };
    const sortField = sortFieldMap[sortBy] || 'totalEventsAttended';

    const aggregationPipeline: any[] = [
      { $match: matchStage },
      // 1. $lookup for attendance records
      {
        $lookup: {
          from: 'attendancerecords',
          localField: '_id',
          foreignField: 'user',
          as: 'attendanceRecords',
        },
      },
      // Also lookup direct attendances if any
      {
        $lookup: {
          from: 'attendances',
          let: { uid: '$_id', uidStr: { $toString: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$user', '$$uid'] },
                    { $eq: ['$userId', '$$uidStr'] },
                  ],
                },
              },
            },
          ],
          as: 'legacyAttendances',
        },
      },
      // 2. $lookup for student progress (quests & levels)
      {
        $lookup: {
          from: 'studentprogresses',
          localField: '_id',
          foreignField: 'userId',
          as: 'progressDocs',
        },
      },
      // 3. $lookup for assessment submissions
      {
        $lookup: {
          from: 'assessmentsubmissions',
          localField: '_id',
          foreignField: 'user',
          as: 'assessmentSubmissions',
        },
      },
      // 4. $lookup for coding challenge submissions
      {
        $lookup: {
          from: 'codingsubmissions',
          localField: '_id',
          foreignField: 'student',
          as: 'codingSubmissions',
        },
      },
      // Compute attached metrics
      {
        $addFields: {
          totalEventsAttended: {
            $add: [
              { $size: { $ifNull: ['$attendanceRecords', []] } },
              { $size: { $ifNull: ['$legacyAttendances', []] } },
            ],
          },
          questsCompleted: {
            $cond: {
              if: { $isArray: { $arrayElemAt: ['$progressDocs.completedQuests', 0] } },
              then: { $size: { $arrayElemAt: ['$progressDocs.completedQuests', 0] } },
              else: 0,
            },
          },
          levelsCompleted: {
            $cond: {
              if: { $isArray: { $arrayElemAt: ['$progressDocs.completedLevels', 0] } },
              then: { $size: { $arrayElemAt: ['$progressDocs.completedLevels', 0] } },
              else: 0,
            },
          },
          averageAssessmentScore: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$assessmentSubmissions', []] } }, 0] },
              then: {
                $round: [
                  {
                    $avg: {
                      $map: {
                        input: '$assessmentSubmissions',
                        as: 'sub',
                        in: { $ifNull: ['$$sub.percentage', '$$sub.score', 0] },
                      },
                    },
                  },
                  1,
                ],
              },
              else: 0,
            },
          },
          codingChallengesSolved: {
            $size: {
              $filter: {
                input: { $ifNull: ['$codingSubmissions', []] },
                as: 'cs',
                cond: { $eq: ['$$cs.status', 'passed'] },
              },
            },
          },
        },
      },
      {
        $facet: {
          data: [
            { $sort: { [sortField]: sortDirection, _id: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                name: 1,
                rollNo: 1,
                email: 1,
                role: 1,
                department: 1,
                college: 1,
                year: 1,
                points: 1,
                profilePicUrl: 1,
                socialLinks: 1,
                skills: 1,
                isOnboarded: 1,
                isBlocked: 1,
                totalEventsAttended: 1,
                questsCompleted: 1,
                levelsCompleted: 1,
                averageAssessmentScore: 1,
                codingChallengesSolved: 1,
                createdAt: 1,
              },
            },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await User.aggregate(aggregationPipeline);

    const students = result?.data || [];
    const total = result?.totalCount?.[0]?.count || 0;

    return reply.send({
      success: true,
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch student tracking list',
      details: error.message,
    });
  }
};

/**
 * Route 2: GET /api/admin/tracking/students/:userId
 * Fetch a detailed 360-view of an individual student:
 * - Student info + macro stats + Club Rank
 * - Exact Attendance records (populated with Event details)
 * - StudentProgress (Domains & Levels completed & in progress)
 * - CodingChallenge results
 * - Assessment results
 * - Unified, chronological activityTimeline array
 */
export const fetchStudent360DataInternal = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID format');
  }

  const userObjId = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(userObjId).select('-password -resetPasswordToken -resetPasswordExpires');

  if (!user) {
    throw new Error('Student not found');
  }

  // 1. Calculate Club Rank based on points
  const userPoints = user.points || 0;
  const rank =
    (await User.countDocuments({
      role: { $in: ['Student', 'Member', 'Committee'] },
      points: { $gt: userPoints },
    })) + 1;
  const totalStudents = await User.countDocuments({
    role: { $in: ['Student', 'Member', 'Committee'] },
  });

  // 2. Fetch exact Attendance records (populated with Event details)
  const [attendanceRecords, legacyAttendances] = await Promise.all([
    AttendanceRecord.find({ user: userObjId })
      .populate({
        path: 'session',
        populate: {
          path: 'event',
          select: 'title description type format venueOrLink date hourlyPoints status',
        },
      })
      .sort({ timestamp: -1 })
      .lean(),
    AttendanceModel.find({
      $or: [{ user: userObjId }, { userId: userId }],
    })
      .populate({
        path: 'event',
        select: 'title description type format venueOrLink date hourlyPoints status',
      })
      .sort({ timestamp: -1 })
      .lean(),
  ]);

  // Normalize attendance records into a consistent structure
  const formattedAttendance = [
    ...attendanceRecords.map((r: any) => ({
      id: r._id.toString(),
      eventName: r.session?.event?.title || r.session?.sessionName || 'Club Event',
      eventDescription: r.session?.event?.description || '',
      eventType: r.session?.event?.type || 'Technical',
      eventFormat: r.session?.event?.format || 'Individual',
      venueOrLink: r.session?.event?.venueOrLink || '',
      sessionName: r.session?.sessionName || 'Attendance Session',
      timestamp: r.timestamp || r.createdAt,
      status: 'Present',
      pointsAwarded: r.pointsAwarded || r.session?.hourlyPoints || 0,
    })),
    ...legacyAttendances.map((r: any) => ({
      id: r._id.toString(),
      eventName: r.event?.title || 'Club Event',
      eventDescription: r.event?.description || '',
      eventType: r.event?.type || 'Technical',
      eventFormat: r.event?.format || 'Individual',
      venueOrLink: r.event?.venueOrLink || '',
      sessionName: 'General Attendance',
      timestamp: r.timestamp || r.createdAt,
      status: r.status || 'Present',
      pointsAwarded: r.event?.hourlyPoints || 0,
    })),
  ];

  // 3. Fetch StudentProgress (Domains/Levels/Quests)
  const [progressDoc, allDomains, domainLevelCounts] = await Promise.all([
    StudentProgress.findOne({ userId: userObjId })
      .populate({ path: 'completedLevels', select: 'title levelNumber domainId' })
      .populate({ path: 'completedQuests', select: 'title levelNumber domainId' })
      .populate({ path: 'unlockedAssessments', select: 'title category passingScorePercentage' })
      .populate({ path: 'unlockedCodingChallenges', select: 'title difficulty' })
      .populate({ path: 'completedCodingChallenges', select: 'title difficulty' })
      .populate({ path: 'unlockedDomains', select: 'name description coverImageUrl' })
      .lean(),
    Domain.find({}).lean(),
    Level.aggregate([
      {
        $group: {
          _id: '$domainId',
          totalLevels: { $sum: 1 },
          levelIds: { $push: '$_id' },
        },
      },
    ]),
  ]);

  const domainLevelCountMap = new Map<string, { totalLevels: number; levelIds: any[] }>();
  for (const d of domainLevelCounts) {
    if (d._id) domainLevelCountMap.set(d._id.toString(), { totalLevels: d.totalLevels, levelIds: d.levelIds });
  }

  const completedLevelIdSet = new Set<string>(
    (progressDoc?.completedLevels || []).map((l: any) =>
      typeof l === 'object' && l._id ? l._id.toString() : l.toString()
    )
  );

  const completedQuestIdSet = new Set<string>(
    (progressDoc?.completedQuests || []).map((q: any) =>
      typeof q === 'object' && q._id ? q._id.toString() : q.toString()
    )
  );

  // Map domains with progress details
  const domainProgress = allDomains.map((domain: any) => {
    const dId = domain._id.toString();
    const meta = domainLevelCountMap.get(dId) || { totalLevels: 0, levelIds: [] };
    const completedInDomain = meta.levelIds.filter((lid) => completedLevelIdSet.has(lid.toString())).length;
    const progressPercent = meta.totalLevels > 0 ? Math.round((completedInDomain / meta.totalLevels) * 100) : 0;

    return {
      id: dId,
      name: domain.name,
      description: domain.description,
      coverImageUrl: domain.coverImageUrl,
      totalLevels: meta.totalLevels,
      completedLevels: completedInDomain,
      progressPercent,
      isUnlocked:
        !domain.isLocked ||
        Boolean(progressDoc?.unlockedDomains?.some((ud: any) => ud._id?.toString() === dId)),
    };
  });

  // 4. Fetch CodingChallenge results
  const codingSubmissions = await CodingSubmission.find({ student: userObjId })
    .populate({ path: 'challenge', select: 'title difficulty description' })
    .sort({ createdAt: -1 })
    .lean();

  const formattedCodingChallenges = codingSubmissions.map((sub: any) => ({
    id: sub._id.toString(),
    challengeId: sub.challenge?._id?.toString() || '',
    challengeTitle: sub.challenge?.title || 'Coding Challenge',
    difficulty: sub.challenge?.difficulty || 'Medium',
    language: sub.language,
    score: sub.score,
    passed: sub.passed,
    total: sub.total,
    status: sub.status,
    submittedAt: sub.submittedAt || sub.createdAt,
  }));

  // 5. Fetch Assessment Submissions
  const assessmentSubmissions = await AssessmentSubmission.find({ user: userObjId })
    .populate({ path: 'assessment', select: 'title category passingScorePercentage totalPoints' })
    .sort({ createdAt: -1 })
    .lean();

  const formattedAssessments = assessmentSubmissions.map((sub: any) => ({
    id: sub._id.toString(),
    assessmentTitle: sub.assessment?.title || 'Knowledge Assessment',
    category: sub.assessment?.category || 'General',
    score: sub.score,
    totalPoints: sub.totalPoints,
    percentage: sub.percentage,
    passed: sub.passed,
    timeSpentSeconds: sub.timeSpentSeconds,
    createdAt: sub.createdAt,
  }));

  // 6. Build unified chronological activityTimeline array
  interface TimelineItem {
    id: string;
    category: 'attendance' | 'assessment' | 'coding' | 'quest' | 'onboarding';
    title: string;
    subtitle: string;
    timestamp: Date;
    status: string;
    semanticColor: 'green' | 'gray' | 'blue' | 'red' | 'amber';
    meta?: Record<string, any>;
  }

  const activityTimeline: TimelineItem[] = [];

  // Add Attendance events
  for (const att of formattedAttendance) {
    activityTimeline.push({
      id: `att-${att.id}`,
      category: 'attendance',
      title: `Attended: ${att.eventName}`,
      subtitle: att.venueOrLink ? `Venue: ${att.venueOrLink}` : 'Session verified & attendance logged',
      timestamp: new Date(att.timestamp),
      status: 'Attended',
      semanticColor: 'gray',
      meta: { points: att.pointsAwarded, session: att.sessionName },
    });
  }

  // Add Assessment events
  for (const sub of formattedAssessments) {
    activityTimeline.push({
      id: `as-${sub.id}`,
      category: 'assessment',
      title: `${sub.passed ? 'Passed' : 'Completed'}: ${sub.assessmentTitle}`,
      subtitle: `Scored ${sub.percentage}% (${sub.score}/${sub.totalPoints} pts) • ${sub.category}`,
      timestamp: new Date(sub.createdAt),
      status: sub.passed ? 'Passed' : 'Completed',
      semanticColor: sub.passed ? 'green' : 'amber',
      meta: { percentage: sub.percentage, passed: sub.passed },
    });
  }

  // Add Coding Challenge events
  for (const code of formattedCodingChallenges) {
    const isPass = code.status === 'passed';
    activityTimeline.push({
      id: `code-${code.id}`,
      category: 'coding',
      title: `${isPass ? 'Passed' : 'Attempted'}: ${code.challengeTitle}`,
      subtitle: `${code.language.toUpperCase()} • Passed ${code.passed}/${code.total} test cases (${code.difficulty})`,
      timestamp: new Date(code.submittedAt),
      status: isPass ? 'Passed' : code.status,
      semanticColor: isPass ? 'green' : code.status === 'failed' ? 'red' : 'amber',
      meta: { score: code.score, language: code.language },
    });
  }

  // Add Quest completions
  if (progressDoc?.completedQuests && progressDoc.completedQuests.length > 0) {
    for (const quest of progressDoc.completedQuests as any[]) {
      const qTitle = typeof quest === 'object' && quest.title ? quest.title : 'Domain Quest';
      activityTimeline.push({
        id: `quest-${quest._id || Math.random()}`,
        category: 'quest',
        title: `Passed Quest: ${qTitle}`,
        subtitle: 'Knowledge checks verified and quest reward unlocked',
        timestamp: new Date(progressDoc.updatedAt || progressDoc.createdAt),
        status: 'Passed',
        semanticColor: 'green',
      });
    }
  }

  // Add Onboarding milestone
  if (user.createdAt) {
    activityTimeline.push({
      id: `onboarding-${user._id}`,
      category: 'onboarding',
      title: user.isOnboarded ? 'Student Onboarded' : 'Account Created',
      subtitle: `Enrolled in ${user.department || 'Academic Department'} • Code Circle Member`,
      timestamp: new Date(user.createdAt),
      status: 'Onboarded',
      semanticColor: 'blue',
    });
  }

  // Sort descending by timestamp
  activityTimeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Summary metrics
  const totalEventsAttended = formattedAttendance.length;
  const questsCompletedCount = completedQuestIdSet.size;
  const codingSolvedCount = formattedCodingChallenges.filter((c) => c.status === 'passed').length;
  const avgAssessmentScore =
    formattedAssessments.length > 0
      ? Math.round(
          (formattedAssessments.reduce((acc, cur) => acc + cur.percentage, 0) /
            formattedAssessments.length) *
            10
        ) / 10
      : 0;

  return {
    student: {
      _id: user._id.toString(),
      name: user.name,
      rollNo: user.rollNo,
      email: user.email,
      role: user.role,
      department: user.department || '',
      college: user.college || 'BIT',
      year: user.year || '',
      points: user.points || 0,
      skills: user.skills || [],
      socialLinks: user.socialLinks || {},
      profilePicUrl: user.profilePicUrl || '',
      isOnboarded: user.isOnboarded || false,
      isBlocked: user.isBlocked || false,
      createdAt: user.createdAt,
    },
    stats: {
      rank,
      totalStudents,
      totalEventsAttended,
      questsCompleted: questsCompletedCount,
      codingChallengesSolved: codingSolvedCount,
      averageAssessmentScore: avgAssessmentScore,
    },
    domainProgress,
    attendanceRecords: formattedAttendance,
    codingResults: formattedCodingChallenges,
    assessmentResults: formattedAssessments,
    activityTimeline,
  };
};

export const getStudent360Profile = async (
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { userId } = request.params;
    const data = await fetchStudent360DataInternal(userId);
    return reply.send({
      success: true,
      ...data,
    });
  } catch (error: any) {
    request.log.error(error);
    const statusCode =
      error.message === 'Student not found'
        ? 404
        : error.message === 'Invalid user ID format'
        ? 400
        : 500;
    return reply.status(statusCode).send({
      success: false,
      error: error.message || 'Failed to fetch student 360 profile',
    });
  }
};

/**
 * Route: GET /api/admin/tracking/students/:userId/pdf
 * Generates an executive, branded PDF Dossier for an individual student.
 */
export const generateStudentPdfReport = async (
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { userId } = request.params;
    const data = await fetchStudent360DataInternal(userId);
    const { buffer, filename } = await generateStudentReportPdf(data as any);

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .header('Cache-Control', 'no-cache, no-store, must-revalidate')
      .send(buffer);
  } catch (error: any) {
    request.log.error(error);
    const statusCode =
      error.message === 'Student not found'
        ? 404
        : error.message === 'Invalid user ID format'
        ? 400
        : 500;
    return reply.status(statusCode).send({
      success: false,
      error: error.message || 'Failed to generate student PDF report',
    });
  }
};

/**
 * Route 3: GET /api/admin/tracking/export
 * Download CSV export feature for Student Tracking System.
 * Stream processing with MongoDB cursor -> Transform Stream -> csv-stringify -> Fastify reply.raw.
 * Prevents Out of Memory (OOM) crashes on low-RAM servers.
 * Protected with isSuperAdmin middleware.
 */
export const exportTrackingCsv = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Set response headers for direct CSV file attachment download
    reply.raw.setHeader('Content-Type', 'text/csv; charset=utf-8');
    reply.raw.setHeader('Content-Disposition', 'attachment; filename="student_progress_report.csv"');
    reply.raw.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    reply.raw.setHeader('Pragma', 'no-cache');
    reply.raw.setHeader('Expires', '0');

    // Pre-aggregate summary metrics fast in parallel using index scans (<50ms for thousands of records)
    const [attendanceAgg, legacyAttendanceAgg, progressDocs, assessmentAgg] = await Promise.all([
      AttendanceRecord.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]),
      AttendanceModel.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]),
      StudentProgress.find({}).select('userId completedQuests').lean(),
      AssessmentSubmission.aggregate([
        {
          $group: {
            _id: '$user',
            avgScore: { $avg: '$percentage' },
          },
        },
      ]),
    ]);

    const attendanceMap = new Map<string, number>();
    for (const a of attendanceAgg) {
      if (a._id) attendanceMap.set(a._id.toString(), a.count);
    }
    for (const a of legacyAttendanceAgg) {
      if (a._id) {
        const id = a._id.toString();
        attendanceMap.set(id, (attendanceMap.get(id) || 0) + a.count);
      }
    }

    const questMap = new Map<string, number>();
    for (const p of progressDocs) {
      if (p.userId) questMap.set(p.userId.toString(), p.completedQuests?.length || 0);
    }

    const scoreMap = new Map<string, number>();
    for (const s of assessmentAgg) {
      if (s._id) scoreMap.set(s._id.toString(), Math.round((s.avgScore || 0) * 10) / 10);
    }

    // Configure csv-stringify stream with appropriate columns
    const stringifier = stringify({
      header: true,
      columns: [
        'Roll Number',
        'Name',
        'Email',
        'Department',
        'Year',
        'Club Points',
        'Total Events Attended',
        'Quests Completed',
        'Average Assessment Score (%)',
        'Onboarding Status',
        'Account Created At',
      ],
    });

    // Transform stream: converts individual Mongoose User documents into flat CSV row arrays
    const transformStream = new Transform({
      objectMode: true,
      transform(chunk: any, _encoding, callback) {
        try {
          const userObj = chunk.toObject ? chunk.toObject() : chunk;
          const uId = userObj._id.toString();

          const totalEvents = attendanceMap.get(uId) || 0;
          const questsCompleted = questMap.get(uId) || 0;
          const avgScore = scoreMap.get(uId) || 0;

          const row = [
            userObj.rollNo || '',
            userObj.name || '',
            userObj.email || '',
            userObj.department || 'Unassigned',
            userObj.year || '',
            userObj.points || 0,
            totalEvents,
            questsCompleted,
            avgScore,
            userObj.isOnboarded ? 'Onboarded' : 'Pending',
            userObj.createdAt ? new Date(userObj.createdAt).toISOString().split('T')[0] : '',
          ];

          callback(null, row);
        } catch (err: any) {
          callback(err);
        }
      },
    });

    // Instruct Fastify that response will be handled raw
    reply.hijack();

    // Build the streaming pipeline: MongoDB Cursor -> Transform Stream -> CSV Stringifier -> HTTP raw socket
    const cursor = User.find({
      role: { $in: ['Student', 'Member', 'Committee'] },
    })
      .sort({ rollNo: 1 })
      .cursor();

    pipeline(cursor, transformStream, stringifier, reply.raw, (err) => {
      if (err) {
        request.log.error(err, 'Failed during CSV export stream pipeline');
        if (!reply.raw.headersSent) {
          reply.raw.writeHead(500, { 'Content-Type': 'application/json' });
          reply.raw.end(JSON.stringify({ success: false, error: 'Streaming pipeline failed' }));
        }
      }
    });
  } catch (error: any) {
    request.log.error(error);
    if (!reply.raw.headersSent) {
      return reply.status(500).send({
        success: false,
        error: 'Failed to initiate CSV export stream',
        details: error.message,
      });
    }
  }
};
