import { FastifyRequest, FastifyReply } from 'fastify';
import User from '../models/userModel';
import crypto from 'crypto';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
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

/**
 * POST /api/users/bulk-upload
 * Bulk create students from an uploaded Excel file (.xlsx / .xls).
 * Columns: Reg No → rollNo, Student Name → name, Department → department,
 *          Student Official Email ID → email.
 * Default password = rollNo (lowercased). All created users get mustChangePassword = true.
 */
export const bulkCreateUsers = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const callerRole = request.user?.role;
    if (callerRole !== 'Admin' && callerRole !== 'SuperAdmin') {
      return reply.status(403).send({ success: false, error: 'Admin privileges required' });
    }

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ success: false, error: 'No file uploaded' });
    }

    const filename = data.filename.toLowerCase();
    if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls')) {
      return reply.status(400).send({ success: false, error: 'Only .xlsx and .xls files are accepted' });
    }

    // Read the entire file into a buffer
    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Parse the Excel workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return reply.status(400).send({ success: false, error: 'Excel file has no sheets' });
    }

    const rows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    if (rows.length < 2) {
      return reply.status(400).send({ success: false, error: 'Excel file has no data rows' });
    }

    // Detect header row and map columns
    const headers = (rows[0] || []).map((h: any) => String(h).trim().toLowerCase());
    const colMap = {
      rollNo: headers.findIndex((h: string) => h.includes('reg') || h.includes('roll')),
      name: headers.findIndex((h: string) => h.includes('student name') || h.includes('name')),
      department: headers.findIndex((h: string) => h.includes('department') || h.includes('dept')),
      email: headers.findIndex((h: string) => h.includes('email')),
    };

    if (colMap.rollNo === -1 || colMap.name === -1 || colMap.email === -1) {
      return reply.status(400).send({
        success: false,
        error: 'Required columns not found. Expected: Reg No, Student Name, Student Official Email ID',
      });
    }

    // Parse data rows
    const studentsToCreate: any[] = [];
    const skippedRows: { row: number; reason: string }[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rollNo = row[colMap.rollNo] ? String(row[colMap.rollNo]).trim().toUpperCase() : '';
      const name = row[colMap.name] ? String(row[colMap.name]).trim() : '';
      const email = row[colMap.email] ? String(row[colMap.email]).trim().toLowerCase() : '';
      const department = colMap.department !== -1 && row[colMap.department]
        ? String(row[colMap.department]).trim()
        : '';

      if (!rollNo || !name || !email) {
        skippedRows.push({ row: i + 1, reason: 'Missing required fields (rollNo, name, or email)' });
        continue;
      }

      studentsToCreate.push({
        rollNo,
        name,
        email,
        department,
        role: 'Student',
        password: rollNo.toLowerCase(),
        mustChangePassword: true,
        isBlocked: false,
      });
    }

    if (studentsToCreate.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'No valid student records found in the file',
        skippedRows,
      });
    }

    // Check for existing users to avoid duplicates
    const allRollNos = studentsToCreate.map((s) => s.rollNo);
    const allEmails = studentsToCreate.map((s) => s.email);

    const existingUsers = await User.find({
      $or: [
        { rollNo: { $in: allRollNos } },
        { email: { $in: allEmails } },
      ],
    }).select('rollNo email').lean();

    const existingRollNos = new Set(existingUsers.map((u: any) => u.rollNo));
    const existingEmails = new Set(existingUsers.map((u: any) => u.email));

    const newStudents: any[] = [];
    const duplicateStudents: { rollNo: string; name: string; reason: string }[] = [];

    for (const student of studentsToCreate) {
      if (existingRollNos.has(student.rollNo)) {
        duplicateStudents.push({ rollNo: student.rollNo, name: student.name, reason: 'Roll number already exists' });
      } else if (existingEmails.has(student.email)) {
        duplicateStudents.push({ rollNo: student.rollNo, name: student.name, reason: 'Email already exists' });
      } else {
        newStudents.push(student);
      }
    }

    // Hash passwords before insert (pre-save hooks don't run with insertMany)
    const bcrypt = require('bcryptjs');
    for (const student of newStudents) {
      const salt = await bcrypt.genSalt(10);
      student.password = await bcrypt.hash(student.password, salt);
    }

    let createdCount = 0;
    const insertErrors: { rollNo: string; error: string }[] = [];

    if (newStudents.length > 0) {
      try {
        const result = await User.insertMany(newStudents, { ordered: false });
        createdCount = result.length;
      } catch (err: any) {
        // With ordered: false, some may succeed even if others fail
        if (err.insertedDocs) {
          createdCount = err.insertedDocs.length;
        }
        if (err.writeErrors) {
          for (const writeErr of err.writeErrors) {
            insertErrors.push({
              rollNo: newStudents[writeErr.index]?.rollNo || 'unknown',
              error: writeErr.errmsg || 'Insert failed',
            });
          }
        }
      }
    }

    return reply.send({
      success: true,
      message: `Bulk upload complete: ${createdCount} created, ${duplicateStudents.length} duplicates skipped`,
      summary: {
        totalRows: rows.length - 1,
        created: createdCount,
        duplicatesSkipped: duplicateStudents.length,
        invalidRows: skippedRows.length,
        insertErrors: insertErrors.length,
      },
      details: {
        duplicates: duplicateStudents.slice(0, 50),
        skippedRows: skippedRows.slice(0, 50),
        insertErrors: insertErrors.slice(0, 50),
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Bulk upload failed: ' + (error.message || 'Unknown error') });
  }
};

/**
 * POST /api/users/bulk-delete
 * Bulk delete students with strict safeguards.
 * Body: { userIds?: string[], allStudents?: boolean, department?: string }
 *
 * Safeguards:
 * - Only Admins and SuperAdmins can invoke this.
 * - Only accounts with role === 'Student' can be deleted.
 * - Admin and SuperAdmin accounts are NEVER touched.
 * - The caller's own account is never deleted.
 */
export const bulkDeleteUsers = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const callerId = request.user?.id;
    const callerRole = request.user?.role;

    if (callerRole !== 'Admin' && callerRole !== 'SuperAdmin') {
      return reply.status(403).send({ success: false, error: 'Admin privileges required' });
    }

    const { userIds, allStudents, department } = (request.body || {}) as {
      userIds?: string[];
      allStudents?: boolean;
      department?: string;
    };

    if (!allStudents && (!Array.isArray(userIds) || userIds.length === 0)) {
      return reply.status(400).send({
        success: false,
        error: 'Please provide userIds array or specify allStudents: true',
      });
    }

    const filter: any = {
      role: 'Student', // STRICT SAFEGUARD: Only students can be bulk deleted
    };

    if (callerId && mongoose.Types.ObjectId.isValid(callerId)) {
      filter._id = { $ne: new mongoose.Types.ObjectId(callerId) };
    }

    if (allStudents) {
      if (department && typeof department === 'string' && department.trim() && department.trim() !== 'all') {
        filter.department = department.trim();
      }
    } else if (userIds && userIds.length > 0) {
      const validIds = userIds
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

    const deleteResult = await User.deleteMany(filter);

    return reply.send({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} student(s)`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to bulk delete users' });
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
  bulkCreateUsers,
  bulkDeleteUsers,
};
