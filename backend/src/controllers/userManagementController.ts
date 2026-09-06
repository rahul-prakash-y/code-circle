import { FastifyRequest, FastifyReply } from 'fastify';
import User from '../models/userModel';
import crypto from 'crypto';
import { sanitizeUser } from './authController';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Generates a high-entropy, secure temporary default password.
 * Format: 14 characters including uppercase, lowercase, digits, and special characters.
 */
const generateSecureTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  const bytes = crypto.randomBytes(14);
  let result = 'Tmp#';
  for (let i = 0; i < 10; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
};

/**
 * GET /api/users
 * Paginated user directory with search, role filters, and status filters.
 */
export const getUsers = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const queryParams = (request.query || {}) as any;
    const page = Math.max(1, parseInt(queryParams.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit) || 10));
    const search = (queryParams.search || '').trim();
    const role = queryParams.role;
    const status = queryParams.status;
    const sortBy = queryParams.sortBy || 'createdAt';
    const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;

    const filter: any = {};

    // Text search on name, rollNo, email, and department
    if (search) {
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(sanitizedSearch, 'i');
      filter.$or = [
        { name: searchRegex },
        { rollNo: searchRegex },
        { email: searchRegex },
        { department: searchRegex },
      ];
    }

    // Role filter
    if (role && role !== 'all') {
      filter.role = role;
    }

    // Status filter
    if (status === 'active') {
      filter.isBlocked = false;
    } else if (status === 'blocked') {
      filter.isBlocked = true;
    }

    const [total, rawUsers] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const hasMore = page < totalPages;

    const users = rawUsers.map((u: any) => ({
      ...u,
      id: u._id.toString(),
    }));

    return reply.send({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasMore,
        },
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to retrieve users' });
  }
};

/**
 * POST /api/users
 * Admins can create Students; SuperAdmins can create any role.
 */
export const createUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { name, email, rollNo, role, department, password } = (request.body || {}) as any;
    const callerRole = request.user?.role;

    if (!name || !email || !rollNo) {
      return reply.status(400).send({
        success: false,
        error: 'Name, email, and roll number are required',
      });
    }

    const requestedRole = role || 'Student';

    // Privilege verification: Only SuperAdmin can create Admin or SuperAdmin
    if (requestedRole === 'SuperAdmin' && callerRole !== 'SuperAdmin') {
      return reply.status(403).send({
        success: false,
        error: 'Only SuperAdmins can create SuperAdmin accounts',
      });
    }

    if (requestedRole === 'Admin' && callerRole !== 'SuperAdmin') {
      return reply.status(403).send({
        success: false,
        error: 'Only SuperAdmins can create Admin accounts',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRollNo = rollNo.toUpperCase().trim();

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { rollNo: normalizedRollNo }],
    });

    if (existing) {
      return reply.status(400).send({
        success: false,
        error: 'A user with this email or roll number already exists',
      });
    }

    // If password not provided, generate a secure default
    const initialPassword = password && password.length >= 6
      ? password
      : generateSecureTemporaryPassword();

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      rollNo: normalizedRollNo,
      role: requestedRole,
      department: department ? department.trim() : '',
      password: initialPassword, // Pre-save hook hashes this
      activeSessionId: null,
    });

    await newUser.save();

    return reply.status(201).send({
      success: true,
      message: 'User created successfully',
      user: sanitizeUser(newUser),
      generatedPassword: password ? undefined : initialPassword,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to create user' });
  }
};

/**
 * PUT /api/users/:id
 * Update user details with privilege checks.
 */
export const updateUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const { name, email, rollNo, role, department, skills, socialLinks } = (request.body || {}) as any;
    const callerRole = request.user?.role;
    const callerId = request.user?.id;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    // Role protection: Regular Admins cannot modify SuperAdmins
    if (targetUser.role === 'SuperAdmin' && callerRole !== 'SuperAdmin' && callerId !== targetUser._id.toString()) {
      return reply.status(403).send({
        success: false,
        error: 'Cannot modify a SuperAdmin account without SuperAdmin clearance',
      });
    }

    // Role promotion protection: Only SuperAdmin can promote anyone to SuperAdmin
    if (role && role === 'SuperAdmin' && callerRole !== 'SuperAdmin') {
      return reply.status(403).send({
        success: false,
        error: 'Only SuperAdmins can assign the SuperAdmin role',
      });
    }

    // Check unique email and rollNo if modified
    if (email && email.toLowerCase().trim() !== targetUser.email) {
      const emailConflict = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: id } });
      if (emailConflict) {
        return reply.status(400).send({ success: false, error: 'Email is already in use by another account' });
      }
      targetUser.email = email.toLowerCase().trim();
    }

    if (rollNo && rollNo.toUpperCase().trim() !== targetUser.rollNo) {
      const rollConflict = await User.findOne({ rollNo: rollNo.toUpperCase().trim(), _id: { $ne: id } });
      if (rollConflict) {
        return reply.status(400).send({ success: false, error: 'Roll number is already in use by another account' });
      }
      targetUser.rollNo = rollNo.toUpperCase().trim();
    }

    if (name !== undefined) targetUser.name = name.trim();
    if (department !== undefined) targetUser.department = department.trim();
    if (role !== undefined) targetUser.role = role;
    if (skills !== undefined) targetUser.skills = skills;
    if (socialLinks !== undefined) targetUser.socialLinks = socialLinks;

    await targetUser.save();

    return reply.send({
      success: true,
      message: 'User updated successfully',
      user: sanitizeUser(targetUser),
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to update user' });
  }
};

/**
 * DELETE /api/users/:id
 * Delete user with safeguard checks.
 */
export const deleteUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const callerId = request.user?.id;
    const callerRole = request.user?.role;

    if (callerId === id) {
      return reply.status(400).send({
        success: false,
        error: 'Cannot delete your own administrator account',
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    if (targetUser.role === 'SuperAdmin' && callerRole !== 'SuperAdmin') {
      return reply.status(403).send({
        success: false,
        error: 'Only SuperAdmins can delete a SuperAdmin account',
      });
    }

    if (targetUser.role === 'Admin' && callerRole !== 'SuperAdmin') {
      return reply.status(403).send({
        success: false,
        error: 'Only SuperAdmins can delete an Admin account',
      });
    }

    await User.findByIdAndDelete(id);

    return reply.send({
      success: true,
      message: `User ${targetUser.name} deleted successfully`,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to delete user' });
  }
};

/**
 * PATCH /api/users/:id/block
 * Block/unblock a user. If blocking, invalidates active sessions.
 */
export const toggleBlockUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;
    const { isBlocked } = (request.body || {}) as any;
    const callerId = request.user?.id;
    const callerRole = request.user?.role;

    if (callerId === id) {
      return reply.status(400).send({
        success: false,
        error: 'You cannot block your own account',
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    if (targetUser.role === 'SuperAdmin' && callerRole !== 'SuperAdmin') {
      return reply.status(403).send({
        success: false,
        error: 'Cannot block a SuperAdmin account',
      });
    }

    targetUser.isBlocked = Boolean(isBlocked);

    // If blocked, forcefully invalidate active session so user is immediately logged out
    if (targetUser.isBlocked) {
      targetUser.activeSessionId = null;
    }

    await targetUser.save();

    return reply.send({
      success: true,
      message: targetUser.isBlocked ? 'User account has been blocked' : 'User account has been unblocked',
      user: sanitizeUser(targetUser),
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to update block status' });
  }
};

/**
 * POST /api/users/:id/reset-link
 * Admins & SuperAdmins trigger a 24-hour cryptographic reset link.
 */
export const triggerResetLink = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000); // 24 hours

    targetUser.resetPasswordToken = resetToken;
    targetUser.resetPasswordExpires = expiresAt;
    await targetUser.save();

    const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(targetUser.email)}`;

    return reply.send({
      success: true,
      message: `Password reset link generated for ${targetUser.name}`,
      resetLink,
      expiresAt,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to generate password reset link' });
  }
};

/**
 * POST /api/users/:id/force-reset-password
 * Elevated SuperAdmin privilege to forcefully set a high-entropy temporary password.
 * NOTE: NO ONE can view raw passwords. Passwords are saved as bcrypt hashes only.
 * The temporary password is returned in the response ONCE for administrative handoff.
 */
export const forceResetPassword = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as any;

    // Strict SuperAdmin privilege check
    if (request.user?.role !== 'SuperAdmin') {
      return reply.status(403).send({
        success: false,
        error: 'Forbidden: Elevated SuperAdmin privileges are required for forced password resets',
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    // Generate high-entropy temporary default password
    const temporaryPassword = generateSecureTemporaryPassword();

    // Assign new password (pre-save hook will hash it with bcrypt before persisting)
    targetUser.password = temporaryPassword;
    targetUser.activeSessionId = null; // Invalidate active session immediately
    targetUser.resetPasswordToken = null;
    targetUser.resetPasswordExpires = null;

    await targetUser.save();

    return reply.send({
      success: true,
      message: `Password forcefully reset for ${targetUser.name}. Inform the user to log in with this temporary default password.`,
      temporaryPassword,
      user: sanitizeUser(targetUser),
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to forcefully reset password' });
  }
};

export default {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleBlockUser,
  triggerResetLink,
  forceResetPassword,
};
