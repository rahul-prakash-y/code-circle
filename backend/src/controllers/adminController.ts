import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import User from '../models/userModel';
import bcrypt from 'bcryptjs';

import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';

export const getAllStudents = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const query = (request.query || {}) as any;
    const { page, limit, skip, sort } = parsePaginationParams(query, {
      defaultPage: 1,
      defaultLimit: 20,
      maxLimit: 100,
      allowedSortFields: ['name', 'rollNo', 'email', 'department', 'points', 'createdAt'],
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
    });

    const filter: any = {
      role: { $in: ['Student', 'Member', 'Committee'] },
    };

    if (query.department && query.department !== 'all') {
      filter.department = query.department;
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: searchRegex },
        { rollNo: searchRegex },
        { email: searchRegex },
        { department: searchRegex },
      ];
    }

    const [total, students] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      data: students,
      students,
      pagination,
    });
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
    const callerId = request.user?.id;
    const callerRole = request.user?.role;

    if (callerId === id) {
      return reply.status(400).send({ success: false, error: 'Cannot delete your own administrator account' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return reply.status(404).send({ success: false, error: 'Student not found' });
    }

    if (targetUser.role === 'SuperAdmin' || targetUser.role === 'Admin') {
      if (callerRole !== 'SuperAdmin') {
        return reply.status(403).send({ success: false, error: 'Only SuperAdmin can delete an administrator account' });
      }
    }

    await User.findByIdAndDelete(id);

    // Clean up any pending password reset requests for this user
    try {
      const PasswordResetRequest = (await import('../models/passwordResetRequestModel')).default;
      await PasswordResetRequest.deleteMany({ userId: id });
    } catch {}

    return reply.send({ success: true, message: `Student ${targetUser.name} deleted successfully` });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to delete student' });
  }
};

/**
 * Bulk delete students who are in 'Pending Initial Login' status (mustChangePassword === true)
 * Body: { allPending?: boolean, studentIds?: string[], department?: string }
 */
export const bulkDeletePendingStudents = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const callerId = request.user?.id;
    const { allPending, studentIds, department } = (request.body || {}) as {
      allPending?: boolean;
      studentIds?: string[];
      department?: string;
    };

    if (!allPending && (!Array.isArray(studentIds) || studentIds.length === 0)) {
      return reply.status(400).send({
        success: false,
        error: 'Please specify allPending: true or provide studentIds array to delete',
      });
    }

    const filter: any = {
      role: { $in: ['Student', 'Member', 'Committee', 'Guest'] }, // Safeguard: Never delete Admin or SuperAdmin
      mustChangePassword: true, // Safeguard: ONLY delete Pending Initial Login students!
    };

    if (callerId && mongoose.Types.ObjectId.isValid(callerId)) {
      filter._id = { $ne: new mongoose.Types.ObjectId(callerId) };
    }

    if (allPending) {
      if (department && department !== 'all') {
        filter.department = new RegExp(`^${department.trim()}$`, 'i');
      }
    } else if (studentIds && studentIds.length > 0) {
      const validIds = studentIds
        .filter((id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (validIds.length === 0) {
        return reply.status(400).send({ success: false, error: 'No valid student IDs provided' });
      }

      filter._id = { $in: validIds };
      if (callerId && mongoose.Types.ObjectId.isValid(callerId)) {
        filter._id.$ne = new mongoose.Types.ObjectId(callerId);
      }
    }

    // Find all matching users first so we can return their names and clean up requests
    const matchingUsers = await User.find(filter).select('_id name email rollNo');
    const userIds = matchingUsers.map((u) => u._id);

    if (userIds.length === 0) {
      return reply.send({
        success: true,
        message: 'No pending initial login student accounts found matching the criteria to delete.',
        deletedCount: 0,
        deletedStudents: [],
      });
    }

    const deleteResult = await User.deleteMany({ _id: { $in: userIds } });

    // Clean up associated password reset requests
    try {
      const PasswordResetRequest = (await import('../models/passwordResetRequestModel')).default;
      await PasswordResetRequest.deleteMany({ userId: { $in: userIds } });
    } catch {}

    return reply.send({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} pending student user account(s)`,
      deletedCount: deleteResult.deletedCount,
      deletedStudents: matchingUsers.map((u) => ({ id: u._id, name: u.name, rollNo: u.rollNo })),
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to bulk delete pending students',
      details: error.message,
    });
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

    const page = Math.max(1, parseInt((query as any).page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as any, 10) || 50));
    const skip = (page - 1) * limit;

    // Fetch students list (Not Onboarded / mustChangePassword: true first by default)
    const [totalMatchingStudents, students] = await Promise.all([
      User.countDocuments(studentListFilter),
      User.find(studentListFilter)
        .select('name rollNo email department college year mustChangePassword isBlocked createdAt')
        .sort({ mustChangePassword: -1, createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const pagination = buildPaginationMeta(totalMatchingStudents, page, limit);

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
      pagination,
      data: {
        stats: statsPayload,
        students: formattedStudents,
        pagination,
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
  bulkDeletePendingStudents,
  forceLogoutStudent,
  getOnboardingStats,
  sendOnboardingReminder,
  updateStudentOnboardingStatus,
};
