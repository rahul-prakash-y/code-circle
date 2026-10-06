import { FastifyRequest, FastifyReply } from 'fastify';
import User from '../models/userModel';
import bcrypt from 'bcryptjs';

export const getAllStudents = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const students = await User.find({ 
      role: { $in: ['Student', 'Member', 'Committee'] } 
    }).select('-password -resetPasswordToken -resetPasswordExpires').sort({ createdAt: -1 });
    return reply.send(students);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch students' });
  }
};

export const updateStudentPassword = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const { password } = (request.body || {}) as any;

    if (!password) {
      return reply.status(400).send({ success: false, error: 'Password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(id, { password: hashedPassword });

    if (!user) {
      return reply.status(404).send({ success: false, error: 'Student not found' });
    }

    return reply.send({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to update password' });
  }
};

export const toggleBlockStudent = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const { isBlocked } = (request.body || {}) as any;

    const user = await User.findByIdAndUpdate(
      id, 
      { isBlocked, activeSessionId: isBlocked ? null : undefined }, 
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return reply.status(404).send({ success: false, error: 'Student not found' });
    }

    return reply.send(user);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to update block status' });
  }
};

export const deleteStudent = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return reply.status(404).send({ success: false, error: 'Student not found' });
    }

    return reply.send({ success: true, message: 'Student deleted successfully' });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to delete student' });
  }
};

export const forceLogoutStudent = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const user = await User.findByIdAndUpdate(
      id, 
      { activeSessionId: null }, 
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return reply.status(404).send({ success: false, error: 'Student not found' });
    }

    return reply.send({ success: true, message: 'Student forced to logout successfully' });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to force logout' });
  }
};

/**
 * Aggregation pipeline to track and display student onboarding statistics.
 * Groups students by their isOnboarded status and returns exact counts and breakdowns.
 */
export const getOnboardingStats = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = (request.query || {}) as {
      department?: string;
      role?: string;
      status?: string;
      search?: string;
      limit?: string;
    };

    // Filter students by role
    const studentMatch: any = {
      role: { $in: ['Student', 'Member', 'Committee'] },
    };

    if (query.department && query.department !== 'all') {
      studentMatch.department = query.department;
    }

    // Aggregation pipeline to group students strictly by mustChangePassword status
    // Rule: mustChangePassword === true  -> User is NOT onboarded (Pending Initial Login)
    //       mustChangePassword === false -> User is ONBOARDED (Account Claimed)
    const aggregationPipeline = [
      { $match: studentMatch },
      {
        $facet: {
          // 1. Group by exact boolean mustChangePassword status
          rawStatusCounts: [
            {
              $group: {
                _id: { $eq: [{ $ifNull: ['$mustChangePassword', false] }, true] },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          // 2. Normalized status breakdown ('Claimed' vs 'Pending')
          normalizedStatusCounts: [
            {
              $project: {
                normalizedStatus: {
                  $cond: {
                    if: { $eq: [{ $ifNull: ['$mustChangePassword', false] }, true] },
                    then: 'Pending',
                    else: 'Claimed',
                  },
                },
              },
            },
            {
              $group: {
                _id: '$normalizedStatus',
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          // 3. Department breakdown
          byDepartment: [
            {
              $group: {
                _id: {
                  department: { $ifNull: ['$department', 'Unassigned'] },
                  mustChangePassword: { $eq: [{ $ifNull: ['$mustChangePassword', false] }, true] },
                },
                count: { $sum: 1 },
              },
            },
          ],
          // 4. Total count
          total: [
            { $count: 'count' },
          ],
        },
      },
    ];

    const [aggResult] = await User.aggregate(aggregationPipeline as any);

    const totalStudents = aggResult?.total?.[0]?.count || 0;

    // mustChangePassword === false means Onboarded/Claimed; mustChangePassword === true means Pending
    let onboardedCount = 0;
    let notOnboardedCount = 0;

    const rawList = aggResult?.rawStatusCounts || [];
    for (const item of rawList) {
      if (item._id === false) {
        onboardedCount += item.count;
      } else {
        notOnboardedCount += item.count;
      }
    }

    const completionRate = totalStudents > 0 
      ? Number(((onboardedCount / totalStudents) * 100).toFixed(1)) 
      : 0;

    // Structured breakdown for UI
    const breakdown = [
      {
        status: 'Claimed',
        label: 'Accounts Claimed',
        mustChangePassword: false,
        count: onboardedCount,
        percentage: completionRate,
        color: '#10B981', // Emerald
      },
      {
        status: 'Pending',
        label: 'Pending Initial Login',
        mustChangePassword: true,
        count: notOnboardedCount,
        percentage: totalStudents > 0 ? Number(((notOnboardedCount / totalStudents) * 100).toFixed(1)) : 0,
        color: '#F59E0B', // Amber
      },
    ];

    // Build filter for student list
    const studentListFilter: any = { ...studentMatch };
    if (query.status === 'not_onboarded' || query.status === 'Pending' || query.status === 'false' || query.status === 'true') {
      if (query.status === 'not_onboarded' || query.status === 'Pending' || query.status === 'true') {
        studentListFilter.mustChangePassword = true;
      } else {
        studentListFilter.mustChangePassword = { $ne: true };
      }
    } else if (query.status === 'onboarded' || query.status === 'Completed' || query.status === 'Claimed') {
      studentListFilter.mustChangePassword = { $ne: true };
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      studentListFilter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { rollNo: searchRegex },
        { department: searchRegex },
      ];
    }

    const limit = query.limit ? Math.min(parseInt(query.limit, 10), 5000) : 2000;

    // Fetch students list (Not Onboarded / mustChangePassword: true first by default)
    const students = await User.find(studentListFilter)
      .select('name rollNo email department college year mustChangePassword isBlocked createdAt')
      .sort({ mustChangePassword: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const formattedStudents = students.map((s: any) => {
      const isMustChange = Boolean(s.mustChangePassword);
      return {
        _id: s._id.toString(),
        id: s._id.toString(),
        name: s.name,
        rollNo: s.rollNo,
        email: s.email,
        department: s.department || 'General',
        college: s.college || 'BIT',
        year: s.year || 'N/A',
        mustChangePassword: isMustChange,
        onboardingStatus: isMustChange ? 'Pending' : 'Claimed',
        isBlocked: Boolean(s.isBlocked),
        createdAt: s.createdAt,
      };
    });

    // Collect list of unique departments
    const allStudentDepartments = await User.distinct('department', {
      role: { $in: ['Student', 'Member', 'Committee'] },
      department: { $exists: true, $ne: '' },
    });

    const statsPayload = {
      total: totalStudents,
      onboarded: onboardedCount,
      notOnboarded: notOnboardedCount,
      completionRate,
      breakdown,
      rawCounts: {
        true: onboardedCount,
        false: notOnboardedCount,
      },
      rawGrouping: rawList,
      departments: allStudentDepartments.filter(Boolean),
    };

    return reply.send({
      success: true,
      stats: statsPayload,
      students: formattedStudents,
      data: {
        stats: statsPayload,
        students: formattedStudents,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to aggregate onboarding statistics',
      details: error.message,
    });
  }
};

/**
 * Quick action: Send onboarding reminder email / notification
 */
export const sendOnboardingReminder = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { studentId, studentIds, allNotOnboarded, customMessage } = (request.body || {}) as any;

    let targetStudents: any[] = [];
    if (studentId) {
      const student = await User.findById(studentId);
      if (!student) {
        return reply.status(404).send({ success: false, error: 'Student not found' });
      }
      targetStudents = [student];
    } else if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      targetStudents = await User.find({ _id: { $in: studentIds } });
    } else if (allNotOnboarded) {
      targetStudents = await User.find({
        role: { $in: ['Student', 'Member', 'Committee'] },
        mustChangePassword: true,
      });
    } else {
      return reply.status(400).send({
        success: false,
        error: 'Please specify studentId, studentIds, or allNotOnboarded: true',
      });
    }

    if (targetStudents.length === 0) {
      return reply.status(400).send({ success: false, error: 'No target students found for reminder' });
    }

    // Create system notification for all targeted students
    try {
      const NotificationModel = (await import('../models/notificationModel')).default;
      const adminId = request.user?.id || targetStudents[0]._id;
      await NotificationModel.create({
        title: 'Action Required: Claim Your Account & Set Password',
        message:
          customMessage ||
          'Please log in with your temporary credentials and set your own secure password to activate your Code Circle access.',
        type: 'warning',
        targetRole: 'Student',
        link: '/setup-password',
        createdBy: adminId,
        readBy: [],
      });
    } catch {
      // Non-blocking notification creation
    }

    return reply.send({
      success: true,
      message: `Onboarding reminder sent successfully to ${targetStudents.length} student${
        targetStudents.length === 1 ? '' : 's'
      }.`,
      sentCount: targetStudents.length,
      recipients: targetStudents.map((s) => ({ id: s._id, name: s.name, email: s.email })),
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to send onboarding reminder' });
  }
};

/**
 * Toggle or update student's onboarding / password changed status
 * Rule: mustChangePassword === true  -> User is NOT onboarded (Pending)
 *       mustChangePassword === false -> User is ONBOARDED (Claimed)
 */
export const updateStudentOnboardingStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const body = (request.body || {}) as any;

    let mustChangePassword: boolean | undefined;

    if (typeof body.mustChangePassword === 'boolean') {
      mustChangePassword = body.mustChangePassword;
    } else if (typeof body.isOnboarded === 'boolean') {
      mustChangePassword = !body.isOnboarded;
    }

    if (mustChangePassword === undefined) {
      return reply.status(400).send({
        success: false,
        error: 'mustChangePassword boolean is required',
      });
    }

    const student = await User.findByIdAndUpdate(
      id,
      {
        mustChangePassword,
      },
      { new: true }
    ).select('name rollNo email department college year mustChangePassword isBlocked');

    if (!student) {
      return reply.status(404).send({ success: false, error: 'Student not found' });
    }

    return reply.send({
      success: true,
      message: `Student account status updated to ${mustChangePassword ? 'Pending' : 'Claimed'}`,
      student,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to update student onboarding status' });
  }
};

export default {
  getAllStudents,
  updateStudentPassword,
  toggleBlockStudent,
  deleteStudent,
  forceLogoutStudent,
  getOnboardingStats,
  sendOnboardingReminder,
  updateStudentOnboardingStatus,
};
