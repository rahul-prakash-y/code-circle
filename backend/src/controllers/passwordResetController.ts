import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import User from '../models/userModel';
import PasswordResetRequest from '../models/passwordResetRequestModel';
import emailService from '../services/emailService';

const getClientUrl = (request?: FastifyRequest): string => {
  const envUrl = process.env.CLIENT_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/$/, '');
  }
  const origin = request?.headers?.origin as string;
  if (origin && !origin.includes('localhost')) {
    return origin.replace(/\/$/, '');
  }
  const referer = request?.headers?.referer as string;
  if (referer && !referer.includes('localhost')) {
    try {
      const parsed = new URL(referer);
      return parsed.origin;
    } catch {}
  }
  return (envUrl || 'http://localhost:5173').replace(/\/$/, '');
};

/**
 * Public User Endpoint:
 * User submits email and password (or rollNo) to verify identity before a password reset request is generated.
 */
export const requestPasswordReset = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password, rollNo, reason } = (request.body || {}) as any;

    if (!email) {
      return reply.status(400).send({
        success: false,
        error: 'Registered email address is required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up the user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'No Code Circle account found with this email address.',
      });
    }

    if (user.isBlocked) {
      return reply.status(403).send({
        success: false,
        error: 'Your account has been blocked by an administrator. Please contact club administration.',
      });
    }

    // Verify identity using password (or rollNo fallback if student forgot password)
    let verificationMethod: 'password' | 'rollNo' = 'password';

    if (password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid password. Account credentials could not be verified.',
        });
      }
      verificationMethod = 'password';
    } else if (rollNo) {
      const normalizedRollNo = rollNo.toUpperCase().trim();
      if (user.rollNo.toUpperCase().trim() !== normalizedRollNo) {
        return reply.status(401).send({
          success: false,
          error: 'Roll number does not match registered student profile.',
        });
      }
      verificationMethod = 'rollNo';
    } else {
      return reply.status(400).send({
        success: false,
        error: 'Password or Roll Number is required to verify your account identity.',
      });
    }

    // Check if there is already an active pending request
    const existingPending = await PasswordResetRequest.findOne({
      userId: user._id,
      status: 'pending',
    });

    if (existingPending) {
      return reply.send({
        success: true,
        alreadyPending: true,
        message: 'A password reset request is already active and awaiting administrator approval.',
        requestId: existingPending._id,
        createdAt: existingPending.createdAt,
      });
    }

    // Create the new reset request
    const newRequest = new PasswordResetRequest({
      userId: user._id,
      name: user.name,
      email: user.email,
      rollNo: user.rollNo,
      department: user.department || '',
      status: 'pending',
      emailSent: false,
      verificationMethod,
      reason: reason?.trim() || '',
      requestIp: request.ip || '',
    });

    await newRequest.save();

    return reply.status(201).send({
      success: true,
      message: 'Password reset request verified and created successfully. Queued for administrator approval.',
      requestId: newRequest._id,
      name: user.name,
      email: user.email,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to create password reset request',
      details: error.message,
    });
  }
};

/**
 * Public User Endpoint:
 * Allows a user to check the status of their reset request by email or rollNo
 */
export const checkUserResetStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { identifier } = (request.query || {}) as { identifier?: string };

    if (!identifier) {
      return reply.status(400).send({
        success: false,
        error: 'Email or Roll Number is required',
      });
    }

    const trimmed = identifier.trim();

    const latestRequest = await PasswordResetRequest.findOne({
      $or: [
        { email: trimmed.toLowerCase() },
        { rollNo: trimmed.toUpperCase() },
      ],
    }).sort({ createdAt: -1 });

    if (!latestRequest) {
      return reply.send({
        success: true,
        hasRequest: false,
      });
    }

    return reply.send({
      success: true,
      hasRequest: true,
      request: {
        id: latestRequest._id,
        name: latestRequest.name,
        email: latestRequest.email,
        rollNo: latestRequest.rollNo,
        status: latestRequest.status,
        emailSent: latestRequest.emailSent,
        emailSentAt: latestRequest.emailSentAt,
        isUsed: latestRequest.isUsed,
        createdAt: latestRequest.createdAt,
        approvedAt: latestRequest.approvedAt,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to check reset status',
    });
  }
};

/**
 * Admin Endpoint:
 * Fetch all password reset requests with filtering, searching, and summary metrics.
 */
export const getAdminResetRequests = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { status, emailSent, search, page = '1', limit = '50' } = (request.query || {}) as any;

    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (emailSent && emailSent !== 'all') {
      query.emailSent = emailSent === 'true';
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { rollNo: searchRegex },
        { department: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [requests, totalCount, statsAgg] = await Promise.all([
      PasswordResetRequest.find(query)
        .populate('approvedBy', 'name email role')
        .populate('rejectedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      PasswordResetRequest.countDocuments(query),
      PasswordResetRequest.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
            },
            emailSent: {
              $sum: { $cond: [{ $eq: ['$emailSent', true] }, 1, 0] },
            },
            emailFailed: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'approved'] },
                      { $eq: ['$emailSent', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            isUsed: {
              $sum: { $cond: [{ $eq: ['$isUsed', true] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const stats = statsAgg[0] || {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      emailSent: 0,
      emailFailed: 0,
      isUsed: 0,
    };

    return reply.send({
      success: true,
      requests,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      stats,
      smtp: emailService.getStatus(),
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch password reset requests',
      details: error.message,
    });
  }
};

/**
 * Admin Endpoint:
 * Approve an individual user request and send the password reset link email.
 */
export const approveResetRequest = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;

    const resetReq = await PasswordResetRequest.findById(id);
    if (!resetReq) {
      return reply.status(404).send({ success: false, error: 'Password reset request not found' });
    }

    const user = await User.findById(resetReq.userId);
    if (!user) {
      return reply.status(404).send({ success: false, error: 'Associated user account not found' });
    }

    // Generate secure 32-byte token valid for 24 hours
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    const resetLink = `${getClientUrl(request)}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    // Dispatch password reset email
    const emailResult = await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      rollNo: user.rollNo,
      resetLink,
      expiresHours: 24,
    });

    const adminId = (request as any).user?.id || null;

    resetReq.status = 'approved';
    resetReq.resetToken = token;
    resetReq.resetTokenExpires = expires;
    resetReq.approvedBy = adminId;
    resetReq.approvedAt = new Date();
    resetReq.emailSent = emailResult.success;
    resetReq.emailSentAt = emailResult.success ? new Date() : null;
    resetReq.emailError = emailResult.error || null;
    resetReq.emailAttempts = (resetReq.emailAttempts || 0) + 1;
    await resetReq.save();

    return reply.send({
      success: true,
      message: emailResult.success
        ? `Reset link generated and emailed to ${user.email} successfully!`
        : `Request approved and link created. Note: Email send failed (${emailResult.error}). Admin can copy link or resend.`,
      emailSent: emailResult.success,
      emailError: emailResult.error,
      resetLink,
      request: resetReq,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to approve reset request',
      details: error.message,
    });
  }
};

/**
 * Admin Endpoint:
 * Approve ALL pending requests in batch (or specified array of IDs) and send emails.
 */
export const approveAllResetRequests = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { ids } = (request.body || {}) as { ids?: string[] };

    const query: any = { status: 'pending' };
    if (ids && Array.isArray(ids) && ids.length > 0) {
      query._id = { $in: ids };
    }

    const pendingRequests = await PasswordResetRequest.find(query);

    if (pendingRequests.length === 0) {
      return reply.send({
        success: true,
        message: 'No pending password reset requests found to approve.',
        approvedCount: 0,
        emailSentCount: 0,
        emailFailedCount: 0,
      });
    }

    const adminId = (request as any).user?.id || null;
    let emailSentCount = 0;
    let emailFailedCount = 0;
    const results: any[] = [];

    for (const reqDoc of pendingRequests) {
      try {
        const user = await User.findById(reqDoc.userId);
        if (!user) {
          results.push({ id: reqDoc._id, success: false, error: 'User not found' });
          continue;
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        user.resetPasswordToken = token;
        user.resetPasswordExpires = expires;
        await user.save();

        const resetLink = `${getClientUrl(request)}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

        const emailResult = await emailService.sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          rollNo: user.rollNo,
          resetLink,
          expiresHours: 24,
        });

        reqDoc.status = 'approved';
        reqDoc.resetToken = token;
        reqDoc.resetTokenExpires = expires;
        reqDoc.approvedBy = adminId;
        reqDoc.approvedAt = new Date();
        reqDoc.emailSent = emailResult.success;
        reqDoc.emailSentAt = emailResult.success ? new Date() : null;
        reqDoc.emailError = emailResult.error || null;
        reqDoc.emailAttempts = (reqDoc.emailAttempts || 0) + 1;
        await reqDoc.save();

        if (emailResult.success) {
          emailSentCount++;
        } else {
          emailFailedCount++;
        }

        results.push({
          id: reqDoc._id,
          name: reqDoc.name,
          email: reqDoc.email,
          success: true,
          emailSent: emailResult.success,
          emailError: emailResult.error,
          resetLink,
        });
      } catch (err: any) {
        results.push({
          id: reqDoc._id,
          name: reqDoc.name,
          email: reqDoc.email,
          success: false,
          error: err.message,
        });
        emailFailedCount++;
      }
    }

    return reply.send({
      success: true,
      message: `Batch approval completed: ${pendingRequests.length} requests approved (${emailSentCount} emails sent, ${emailFailedCount} unsent/failed).`,
      totalTargeted: pendingRequests.length,
      approvedCount: pendingRequests.length,
      emailSentCount,
      emailFailedCount,
      results,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to batch approve reset requests',
      details: error.message,
    });
  }
};

/**
 * Admin Endpoint:
 * Resend the password reset email for an approved request.
 */
export const resendResetEmail = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;

    const resetReq = await PasswordResetRequest.findById(id);
    if (!resetReq) {
      return reply.status(404).send({ success: false, error: 'Password reset request not found' });
    }

    const user = await User.findById(resetReq.userId);
    if (!user) {
      return reply.status(404).send({ success: false, error: 'Associated user account not found' });
    }

    // Check if token exists and is still valid; if not, generate a fresh 24h token
    let token = resetReq.resetToken;
    let expires = resetReq.resetTokenExpires;

    if (!token || !expires || expires < new Date()) {
      token = crypto.randomBytes(32).toString('hex');
      expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.resetPasswordToken = token;
      user.resetPasswordExpires = expires;
      await user.save();

      resetReq.resetToken = token;
      resetReq.resetTokenExpires = expires;
    }

    const resetLink = `${getClientUrl(request)}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    const emailResult = await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      rollNo: user.rollNo,
      resetLink,
      expiresHours: 24,
    });

    resetReq.emailSent = emailResult.success;
    if (emailResult.success) {
      resetReq.emailSentAt = new Date();
      resetReq.emailError = null;
    } else {
      resetReq.emailError = emailResult.error || 'Email dispatch failed';
    }
    resetReq.emailAttempts = (resetReq.emailAttempts || 0) + 1;
    await resetReq.save();

    return reply.send({
      success: true,
      message: emailResult.success
        ? `Reset email resent to ${user.email} successfully!`
        : `Email resend attempted, but delivery failed (${emailResult.error})`,
      emailSent: emailResult.success,
      emailError: emailResult.error,
      resetLink,
      request: resetReq,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to resend reset email',
      details: error.message,
    });
  }
};

/**
 * Admin Endpoint:
 * Reject a password reset request.
 */
export const rejectResetRequest = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const { reason } = (request.body || {}) as { reason?: string };

    const resetReq = await PasswordResetRequest.findById(id);
    if (!resetReq) {
      return reply.status(404).send({ success: false, error: 'Password reset request not found' });
    }

    const adminId = (request as any).user?.id || null;

    resetReq.status = 'rejected';
    resetReq.rejectedBy = adminId;
    resetReq.rejectedAt = new Date();
    resetReq.rejectionReason = reason?.trim() || 'Declined by administrator';
    await resetReq.save();

    return reply.send({
      success: true,
      message: 'Password reset request has been rejected.',
      request: resetReq,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to reject reset request',
    });
  }
};

/**
 * Admin Endpoint:
 * Delete a reset request record.
 */
export const deleteResetRequest = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const deleted = await PasswordResetRequest.findByIdAndDelete(id);

    if (!deleted) {
      return reply.status(404).send({ success: false, error: 'Password reset request not found' });
    }

    return reply.send({
      success: true,
      message: 'Reset request deleted successfully.',
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to delete reset request',
    });
  }
};

/**
 * Admin Endpoint:
 * Get SMTP service configuration and test connection.
 */
export const getSmtpStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const status = emailService.getStatus();
    const verification = await emailService.verifyConnection();
    return reply.send({
      success: true,
      status,
      connection: verification,
    });
  } catch (error: any) {
    return reply.send({
      success: false,
      status: emailService.getStatus(),
      connection: { success: false, message: error.message },
    });
  }
};
