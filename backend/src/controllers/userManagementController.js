const User = require('../models/userModel');
const crypto = require('crypto');
const { sanitizeUser } = require('./authController');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const generateSecureTemporaryPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  const bytes = crypto.randomBytes(14);
  let result = 'Tmp#';
  for (let i = 0; i < 10; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
};

const getUsers = async (request, reply) => {
  try {
    const queryParams = request.query || {};
    const page = Math.max(1, parseInt(queryParams.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit) || 10));
    const search = (queryParams.search || '').trim();
    const role = queryParams.role;
    const status = queryParams.status;
    const sortBy = queryParams.sortBy || 'createdAt';
    const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;

    const filter = {};

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

    if (role && role !== 'all') {
      filter.role = role;
    }

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

    const users = rawUsers.map((u) => ({
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
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to retrieve users' });
  }
};

const createUser = async (request, reply) => {
  try {
    const { name, email, rollNo, role, department, password } = request.body || {};
    const callerRole = request.user?.role;

    if (!name || !email || !rollNo) {
      return reply.status(400).send({
        success: false,
        error: 'Name, email, and roll number are required',
      });
    }

    const requestedRole = role || 'Student';

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

    const initialPassword = password && password.length >= 6
      ? password
      : generateSecureTemporaryPassword();

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      rollNo: normalizedRollNo,
      role: requestedRole,
      department: department ? department.trim() : '',
      password: initialPassword,
      activeSessionId: null,
    });

    await newUser.save();

    return reply.status(201).send({
      success: true,
      message: 'User created successfully',
      user: sanitizeUser(newUser),
      generatedPassword: password ? undefined : initialPassword,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to create user' });
  }
};

const updateUser = async (request, reply) => {
  try {
    const { id } = request.params;
    const { name, email, rollNo, role, department, skills, socialLinks } = request.body || {};
    const callerRole = request.user?.role;
    const callerId = request.user?.id;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    if (targetUser.role === 'SuperAdmin' && callerRole !== 'SuperAdmin' && callerId !== targetUser._id.toString()) {
      return reply.status(403).send({
        success: false,
        error: 'Cannot modify a SuperAdmin account without SuperAdmin clearance',
      });
    }

    if (role && role === 'SuperAdmin' && callerRole !== 'SuperAdmin') {
      return reply.status(403).send({
        success: false,
        error: 'Only SuperAdmins can assign the SuperAdmin role',
      });
    }

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
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to update user' });
  }
};

const deleteUser = async (request, reply) => {
  try {
    const { id } = request.params;
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
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to delete user' });
  }
};

const toggleBlockUser = async (request, reply) => {
  try {
    const { id } = request.params;
    const { isBlocked } = request.body || {};
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

    if (targetUser.isBlocked) {
      targetUser.activeSessionId = null;
    }

    await targetUser.save();

    return reply.send({
      success: true,
      message: targetUser.isBlocked ? 'User account has been blocked' : 'User account has been unblocked',
      user: sanitizeUser(targetUser),
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to update block status' });
  }
};

const triggerResetLink = async (request, reply) => {
  try {
    const { id } = request.params;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);

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
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to generate password reset link' });
  }
};

const forceResetPassword = async (request, reply) => {
  try {
    const { id } = request.params;

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

    const temporaryPassword = generateSecureTemporaryPassword();

    targetUser.password = temporaryPassword;
    targetUser.activeSessionId = null;
    targetUser.resetPasswordToken = null;
    targetUser.resetPasswordExpires = null;

    await targetUser.save();

    return reply.send({
      success: true,
      message: `Password forcefully reset for ${targetUser.name}. Inform the user to log in with this temporary default password.`,
      temporaryPassword,
      user: sanitizeUser(targetUser),
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to forcefully reset password' });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleBlockUser,
  triggerResetLink,
  forceResetPassword,
};
