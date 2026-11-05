import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import User from '../models/userModel';
import PointTransaction, { PointCategory } from '../models/pointTransactionModel';
import AttendanceRecord from '../models/attendanceRecordModel';
import '../models/attendanceSessionModel';
import '../models/eventModel';
import ContestSubmission from '../models/contestSubmissionModel';
import '../models/contestModel';
import StudentProgress from '../models/studentProgressModel';
import '../models/levelModel';

import AssessmentSubmission from '../models/assessmentSubmissionModel';
import '../models/assessmentModel';

// Calculate tier based on points
export const calculateTier = (points: number = 0) => {
  if (points >= 2500) {
    return { name: 'Diamond', level: 5, color: '#A855F7', nextTierPoints: 5000, progressPercent: 100 };
  } else if (points >= 1200) {
    const progress = Math.min(100, Math.round(((points - 1200) / (2500 - 1200)) * 100));
    return { name: 'Platinum', level: 4, color: '#06B6D4', nextTierPoints: 2500, progressPercent: progress };
  } else if (points >= 600) {
    const progress = Math.min(100, Math.round(((points - 600) / (1200 - 600)) * 100));
    return { name: 'Gold', level: 3, color: '#EAB308', nextTierPoints: 1200, progressPercent: progress };
  } else if (points >= 250) {
    const progress = Math.min(100, Math.round(((points - 250) / (600 - 250)) * 100));
    return { name: 'Silver', level: 2, color: '#94A3B8', nextTierPoints: 600, progressPercent: progress };
  } else {
    const progress = Math.min(100, Math.round((points / 250) * 100));
    return { name: 'Bronze', level: 1, color: '#D97706', nextTierPoints: 250, progressPercent: progress };
  }
};

/**
 * Helper to gather comprehensive point activities for a student
 * Combines explicit PointTransactions and fallback sources (AttendanceRecords, ContestSubmissions, StudentProgress, AssessmentSubmissions)
 */
export const gatherStudentPointsAudit = async (userId: mongoose.Types.ObjectId | string) => {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(userObjId).select('name rollNo email department college year points profilePicUrl role');
  if (!user) return null;

  const totalPoints = user.points || 0;

  // 1. Fetch recorded transactions
  const transactions = await PointTransaction.find({ user: userObjId })
    .populate('awardedBy', 'name email role')
    .sort({ timestamp: -1 })
    .lean();

  // 2. Fetch Attendance Records with session and class hours
  const attendanceRecords = await AttendanceRecord.find({ user: userObjId })
    .populate({
      path: 'session',
      select: 'sessionName classHours hourlyPoints totalPoints event',
      populate: {
        path: 'event',
        select: 'title type format date startDate endDate hourlyPoints venueOrLink',
      },
    })
    .sort({ timestamp: -1 })
    .lean();

  // 3. Fetch Contest Submissions
  let contestSubmissions: any[] = [];
  try {
    contestSubmissions = await ContestSubmission.find({ userId: userObjId, pointsAwarded: true })
      .populate('contestId', 'title description startDate endDate')
      .sort({ createdAt: -1 })
      .lean();
  } catch (err) {
    console.warn('[PointsController] Could not fetch contest submissions:', err);
  }

  // 4. Fetch Student Progress for completed levels/quests
  let completedLevelsCount = 0;
  let completedQuestsCount = 0;
  try {
    const progress = await StudentProgress.findOne({ userId: userObjId }).lean();
    if (progress) {
      completedLevelsCount = progress.completedLevels?.length || 0;
      completedQuestsCount = progress.completedQuests?.length || 0;
    }
  } catch (err) {
    console.warn('[PointsController] Could not fetch student progress:', err);
  }

  // 5. Fetch Assessment Submissions (MCQ Assessments)
  let assessmentSubmissions: any[] = [];
  try {
    assessmentSubmissions = await AssessmentSubmission.find({ user: userObjId, passed: true })
      .populate('assessment', 'title category customPoints passingScorePercentage')
      .sort({ createdAt: -1 })
      .lean();
  } catch (err) {
    console.warn('[PointsController] Could not fetch assessment submissions:', err);
  }

  // Build unified transaction list
  const transactionMap = new Map<string, boolean>();
  for (const tx of transactions) {
    if (tx.referenceId) {
      transactionMap.set(tx.referenceId, true);
    }
  }

  const unifiedList: any[] = [];

  // Add all explicit transactions
  for (const tx of transactions) {
    unifiedList.push({
      id: tx._id.toString(),
      title: tx.title,
      description: tx.description,
      category: tx.category,
      amount: tx.amount,
      classHours: tx.classHours || [],
      classHoursText:
        tx.classHours && tx.classHours.length > 0
          ? `Hour(s) ${tx.classHours.join(', ')} (${tx.classHours.length} hr${tx.classHours.length > 1 ? 's' : ''})`
          : '',
      timestamp: tx.timestamp || tx.createdAt,
      awardedBy: (tx.awardedBy as any)?.name || null,
      source: 'transaction',
    });
  }

  // Backfill attendance records if not explicitly in PointTransaction
  let attendancePointsSum = 0;
  let totalClubHoursCount = 0;

  for (const att of attendanceRecords) {
    const session = att.session as any;
    const hours = Array.isArray(session?.classHours) && session.classHours.length > 0 ? session.classHours : [1];
    const pts = att.pointsAwarded ?? session?.totalPoints ?? 50;

    attendancePointsSum += pts;
    totalClubHoursCount += hours.length;

    if (!transactionMap.has(att._id.toString())) {
      const eventTitle = session?.event?.title || 'Club Session';
      unifiedList.push({
        id: `att-${att._id}`,
        title: `Club Hour: ${session?.sessionName || eventTitle}`,
        description: `Verified presence for ${eventTitle} (Hours ${hours.join(', ')})`,
        category: 'Attendance' as PointCategory,
        amount: pts,
        classHours: hours,
        classHoursText: `Hour(s) ${hours.join(', ')} (${hours.length} hr${hours.length > 1 ? 's' : ''})`,
        timestamp: att.timestamp || (att as any).createdAt,
        source: 'attendance_record',
      });
    }
  }

  // Backfill contest submissions if not explicitly in PointTransaction
  let contestPointsSum = 0;
  for (const sub of contestSubmissions) {
    const pts = sub.awardedClubPoints || 0;
    if (pts > 0) {
      contestPointsSum += pts;
      if (!transactionMap.has(sub._id.toString())) {
        const contestTitle = sub.contestId?.title || 'Weekly Contest';
        unifiedList.push({
          id: `contest-${sub._id}`,
          title: `Contest: ${contestTitle}`,
          description: `Score: ${sub.totalScore || 0} pts • Time: ${sub.timeTakenSeconds || 0}s`,
          category: 'Contest' as PointCategory,
          amount: pts,
          classHours: [],
          classHoursText: '',
          timestamp: sub.submittedAt || sub.createdAt,
          source: 'contest_submission',
        });
      }
    }
  }

  // Backfill assessment submissions if not explicitly in PointTransaction
  let assessmentPointsSum = 0;
  let assessmentPassedCount = 0;
  for (const sub of assessmentSubmissions) {
    const assessment = sub.assessment as any;
    const pts =
      sub.pointsAwarded && sub.pointsAwarded > 0
        ? sub.pointsAwarded
        : typeof assessment?.customPoints === 'number' && assessment.customPoints > 0
        ? assessment.customPoints
        : 50;

    assessmentPointsSum += pts;
    assessmentPassedCount += 1;

    const refKey = assessment?._id ? assessment._id.toString() : sub._id.toString();
    if (!transactionMap.has(refKey) && !transactionMap.has(sub._id.toString())) {
      const title = assessment?.title || 'MCQ Assessment';
      unifiedList.push({
        id: `assessment-${sub._id}`,
        title: `MCQ Assessment: ${title}`,
        description: `Passed with score ${sub.score}/${sub.totalPoints} (${sub.percentage}%)`,
        category: 'Assessment' as PointCategory,
        amount: pts,
        classHours: [],
        classHoursText: '',
        timestamp: sub.createdAt,
        source: 'assessment_submission',
      });
    }
  }

  // Compute breakdown totals from transactions if available
  let txAttendance = 0;
  let txCoding = 0;
  let txContest = 0;
  let txCourse = 0;
  let txAssessment = 0;
  let txBonus = 0;

  for (const item of unifiedList) {
    const amt = item.amount || 0;
    if (item.category === 'Attendance') txAttendance += amt;
    else if (item.category === 'Coding') txCoding += amt;
    else if (item.category === 'Contest') txContest += amt;
    else if (item.category === 'Course') txCourse += amt;
    else if (item.category === 'Assessment') txAssessment += amt;
    else if (item.category === 'Bonus' || item.category === 'Adjustment') txBonus += amt;
  }

  // If there's an unexplained gap between totalPoints and aggregated transactions, add a balancing entry
  const recordedSum = txAttendance + txCoding + txContest + txCourse + txAssessment + txBonus;
  if (totalPoints > recordedSum) {
    const diff = totalPoints - recordedSum;
    unifiedList.unshift({
      id: `initial-merit-${user._id}`,
      title: 'Club Foundation & Academic Merit Points',
      description: 'Points earned from earlier club activities, domain quests, and coding challenges',
      category: 'Bonus' as PointCategory,
      amount: diff,
      classHours: [],
      classHoursText: '',
      timestamp: (user as any).createdAt || new Date(),
      source: 'legacy_balance',
    });
    txBonus += diff;
  }

  // Sort unified activities chronologically descending
  unifiedList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Rank calculation
  const rank = (await User.countDocuments({
    role: { $in: ['Student', 'Member', 'Committee'] },
    points: { $gt: totalPoints },
  })) + 1;

  const totalStudents = await User.countDocuments({
    role: { $in: ['Student', 'Member', 'Committee'] },
  });

  return {
    student: {
      _id: user._id,
      name: user.name,
      rollNo: user.rollNo,
      email: user.email,
      department: user.department || 'General',
      college: user.college || 'BIT',
      year: user.year || '3rd Year',
      profilePicUrl: user.profilePicUrl || '',
      role: user.role,
    },
    totalPoints,
    rank,
    totalStudents,
    tier: calculateTier(totalPoints),
    summary: {
      attendance: {
        points: Math.max(attendancePointsSum, txAttendance),
        sessionsCount: attendanceRecords.length,
        totalClubHours: totalClubHoursCount,
      },
      coding: {
        points: txCoding,
        completedLevels: completedLevelsCount,
      },
      contests: {
        points: Math.max(contestPointsSum, txContest),
        participatedCount: contestSubmissions.length,
      },
      courses: {
        points: txCourse,
        completedQuests: completedQuestsCount,
      },
      assessment: {
        points: Math.max(assessmentPointsSum, txAssessment),
        completedCount: assessmentPassedCount,
      },
      bonus: {
        points: txBonus,
      },
    },
    transactions: unifiedList,
  };
};

/**
 * Route: GET /api/points/my-points
 * Student view to track points earned, breakdown, and chronological source ledger
 */
export const getMyPoints = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = (request.user || {}) as any;
    if (!id) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const audit = await gatherStudentPointsAudit(id);
    if (!audit) {
      return reply.status(404).send({ success: false, error: 'User profile not found' });
    }

    return reply.send({
      success: true,
      data: audit,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to retrieve your points data',
      details: error.message,
    });
  }
};

/**
 * Route: GET /api/points/admin/overview
 * Admin macro metrics for club point distributions
 */
export const getAdminPointsOverview = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const studentFilter = { role: { $in: ['Student', 'Member', 'Committee'] } };

    const totalStudents = await User.countDocuments(studentFilter);
    const studentsWithPoints = await User.countDocuments({ ...studentFilter, points: { $gt: 0 } });

    // Aggregate total points
    const pointsAgg = await User.aggregate([
      { $match: studentFilter },
      { $group: { _id: null, totalPoints: { $sum: '$points' }, avgPoints: { $avg: '$points' } } },
    ]);

    const totalPoints = pointsAgg[0]?.totalPoints || 0;
    const avgPoints = Math.round(pointsAgg[0]?.avgPoints || 0);

    // Total club hours attended across all students
    const attendanceAgg = await AttendanceRecord.aggregate([
      {
        $lookup: {
          from: 'attendancesessions',
          localField: 'session',
          foreignField: '_id',
          as: 'sessionDoc',
        },
      },
      { $unwind: '$sessionDoc' },
      {
        $project: {
          hoursCount: {
            $cond: {
              if: { $isArray: '$sessionDoc.classHours' },
              then: { $size: '$sessionDoc.classHours' },
              else: 1,
            },
          },
          pointsAwarded: { $ifNull: ['$pointsAwarded', '$sessionDoc.totalPoints'] },
        },
      },
      {
        $group: {
          _id: null,
          totalClubHours: { $sum: '$hoursCount' },
          totalAttendancePoints: { $sum: '$pointsAwarded' },
        },
      },
    ]);

    const totalClubHours = attendanceAgg[0]?.totalClubHours || 0;
    const totalAttendancePoints = attendanceAgg[0]?.totalAttendancePoints || 0;

    // Top department by points
    const deptAgg = await User.aggregate([
      { $match: { ...studentFilter, department: { $exists: true, $ne: '' } } },
      { $group: { _id: '$department', totalPoints: { $sum: '$points' }, count: { $sum: 1 } } },
      { $sort: { totalPoints: -1 } },
      { $limit: 1 },
    ]);

    const topDepartment = deptAgg[0] ? { name: deptAgg[0]._id, points: deptAgg[0].totalPoints } : null;

    // Tier distribution counts
    const bronzeCount = await User.countDocuments({ ...studentFilter, points: { $lt: 250 } });
    const silverCount = await User.countDocuments({ ...studentFilter, points: { $gte: 250, $lt: 600 } });
    const goldCount = await User.countDocuments({ ...studentFilter, points: { $gte: 600, $lt: 1200 } });
    const platinumCount = await User.countDocuments({ ...studentFilter, points: { $gte: 1200, $lt: 2500 } });
    const diamondCount = await User.countDocuments({ ...studentFilter, points: { $gte: 2500 } });

    return reply.send({
      success: true,
      data: {
        totalPoints,
        avgPoints,
        totalStudents,
        studentsWithPoints,
        totalClubHours,
        totalAttendancePoints,
        topDepartment,
        tierDistribution: {
          Bronze: bronzeCount,
          Silver: silverCount,
          Gold: goldCount,
          Platinum: platinumCount,
          Diamond: diamondCount,
        },
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch points overview',
      details: error.message,
    });
  }
};

/**
 * Route: GET /api/points/admin/students
 * Paginated list of students with point summaries for admin
 */
export const getAdminStudentPoints = async (
  request: FastifyRequest<{
    Querystring: {
      page?: string;
      limit?: string;
      search?: string;
      department?: string;
      year?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const {
      page: pageQuery = '1',
      limit: limitQuery = '20',
      search = '',
      department = 'all',
      year = 'all',
      sortBy = 'points',
      sortOrder = 'desc',
    } = request.query;

    const page = Math.max(1, parseInt(pageQuery, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(limitQuery, 10) || 20));
    const skip = (page - 1) * limit;

    const matchStage: any = {
      role: { $in: ['Student', 'Member', 'Committee'] },
    };

    if (department && department !== 'all') {
      matchStage.department = department;
    }

    if (year && year !== 'all') {
      matchStage.year = year;
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
    const sortField = sortBy === 'name' ? 'name' : sortBy === 'rollNo' ? 'rollNo' : 'points';

    const [students, total] = await Promise.all([
      User.find(matchStage)
        .select('_id name rollNo email department college year profilePicUrl points role')
        .sort({ [sortField]: sortDirection, createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(matchStage),
    ]);

    // For the fetched page of students, enrich with quick attendance metrics
    const studentIds = students.map((s) => s._id);

    const attendanceStats = await AttendanceRecord.aggregate([
      { $match: { user: { $in: studentIds } } },
      {
        $lookup: {
          from: 'attendancesessions',
          localField: 'session',
          foreignField: '_id',
          as: 'sess',
        },
      },
      { $unwind: '$sess' },
      {
        $project: {
          user: 1,
          points: { $ifNull: ['$pointsAwarded', '$sess.totalPoints'] },
          hoursCount: {
            $cond: {
              if: { $isArray: '$sess.classHours' },
              then: { $size: '$sess.classHours' },
              else: 1,
            },
          },
        },
      },
      {
        $group: {
          _id: '$user',
          attendancePoints: { $sum: '$points' },
          totalClubHours: { $sum: '$hoursCount' },
          sessionsCount: { $sum: 1 },
        },
      },
    ]);

    const attStatMap = new Map<string, { attendancePoints: number; totalClubHours: number; sessionsCount: number }>();
    for (const a of attendanceStats) {
      if (a._id) {
        attStatMap.set(a._id.toString(), {
          attendancePoints: a.attendancePoints || 0,
          totalClubHours: a.totalClubHours || 0,
          sessionsCount: a.sessionsCount || 0,
        });
      }
    }

    const enrichedStudents = students.map((s) => {
      const att = attStatMap.get(s._id.toString()) || { attendancePoints: 0, totalClubHours: 0, sessionsCount: 0 };
      const totalPts = s.points || 0;
      const tier = calculateTier(totalPts);
      return {
        ...s,
        totalPoints: totalPts,
        tier,
        attendancePoints: att.attendancePoints,
        totalClubHours: att.totalClubHours,
        sessionsCount: att.sessionsCount,
        otherPoints: Math.max(0, totalPts - att.attendancePoints),
      };
    });

    return reply.send({
      success: true,
      data: {
        students: enrichedStudents,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch student points list',
      details: error.message,
    });
  }
};

/**
 * Route: GET /api/points/admin/students/:userId
 * Detailed point audit and chronological history for an individual student
 */
export const getAdminStudentPointsDetail = async (
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { userId } = request.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return reply.status(400).send({ success: false, error: 'Invalid student user ID' });
    }

    const audit = await gatherStudentPointsAudit(userId);
    if (!audit) {
      return reply.status(404).send({ success: false, error: 'Student not found' });
    }

    return reply.send({
      success: true,
      data: audit,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to retrieve student points audit',
      details: error.message,
    });
  }
};

/**
 * Route: POST /api/points/admin/award
 * Admin manually awards merit/bonus points or adjusts points for a student
 */
export const awardAdminPoints = async (
  request: FastifyRequest<{
    Body: {
      studentId: string;
      amount: number;
      category?: PointCategory;
      title: string;
      description?: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const adminUser = (request.user || {}) as any;
    const { studentId, amount, category = 'Bonus', title, description = '' } = request.body;

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return reply.status(400).send({ success: false, error: 'Valid student ID is required' });
    }

    const numAmount = parseInt(amount as any, 10);
    if (isNaN(numAmount) || numAmount === 0) {
      return reply.status(400).send({ success: false, error: 'Amount must be a non-zero number' });
    }

    if (!title || !title.trim()) {
      return reply.status(400).send({ success: false, error: 'Title or reason is required' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return reply.status(404).send({ success: false, error: 'Student not found' });
    }

    // Apply points change
    const updatedUser = await User.findByIdAndUpdate(
      studentId,
      { $inc: { points: numAmount } },
      { new: true }
    );

    const balanceAfter = updatedUser?.points || 0;

    // Record in PointTransaction ledger
    const transaction = await PointTransaction.create({
      user: student._id,
      amount: numAmount,
      category,
      title: title.trim(),
      description: description.trim(),
      balanceAfter,
      awardedBy: adminUser.id ? new mongoose.Types.ObjectId(adminUser.id) : undefined,
      timestamp: new Date(),
    });

    return reply.send({
      success: true,
      message: `Successfully ${numAmount > 0 ? 'awarded' : 'adjusted'} ${Math.abs(numAmount)} points for ${student.name}`,
      data: {
        transaction,
        totalPoints: balanceAfter,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to award points',
      details: error.message,
    });
  }
};
