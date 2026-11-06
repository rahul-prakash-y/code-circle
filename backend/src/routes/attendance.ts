import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import attendanceBuffer from '../services/attendanceBuffer';
import { verifyToken, requireSuperAdmin, isAdminOrFaculty } from '../middleware/authMiddleware';

export interface SubmitAttendanceBody {
  eventId: string;
  otp: string;
  userId: string;
  dayNumber?: number;
  dateAttended?: string | Date;
}

export interface SetEventOTPBody {
  eventId: string;
  otp: string;
  dayNumber?: number;
}

/**
 * High-performance attendance submission handler for multi-day events.
 * Validates against in-memory OTP cache for the specific day and queues record in memory.
 * Guarantees sub-5ms response time by avoiding awaiting any database calls.
 */
export const submitAttendanceHandler = async (
  request: FastifyRequest<{ Body: SubmitAttendanceBody }>,
  reply: FastifyReply
) => {
  const { eventId, otp, userId, dayNumber = 1, dateAttended } = request.body || {};

  if (!eventId || !otp || !userId) {
    return reply.status(400).send({
      success: false,
      error: 'eventId, otp, and userId are required fields',
    });
  }

  const parsedDay = Math.max(1, Number(dayNumber) || 1);
  if (parsedDay < 1 || parsedDay > 30) {
    return reply.status(400).send({
      success: false,
      error: 'Invalid dayNumber: must be a positive integer corresponding to an event day (e.g. 1-5)',
    });
  }

  const result = attendanceBuffer.verifyAndQueue(
    userId,
    eventId,
    otp,
    parsedDay,
    dateAttended ? new Date(dateAttended) : new Date()
  );

  if (!result.success) {
    return reply.status(400).send(result);
  }

  return reply.status(200).send(result);
};

/**
 * Superadmin-only forced database sync handler.
 * Forces an immediate flush of the in-memory writeQueue to MongoDB Atlas using bulkWrite.
 * Returns the number of items flushed and remaining queue count.
 */
export const syncDbHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const flushResult = await attendanceBuffer.flush();
    const remaining = attendanceBuffer.writeQueue.length;

    return reply.status(200).send({
      success: true,
      message: 'Attendance buffer synchronized to database successfully',
      flushedCount: flushResult.flushedCount,
      remaining,
      remainingItems: remaining,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to synchronize attendance buffer with database',
    });
  }
};

/**
 * Admin/Faculty handler to set an event's active OTP for a specific day into memory buffer
 */
export const setEventOTPHandler = async (
  request: FastifyRequest<{ Body: SetEventOTPBody }>,
  reply: FastifyReply
) => {
  const { eventId, otp, dayNumber = 1 } = request.body || {};

  if (!eventId || !otp) {
    return reply.status(400).send({
      success: false,
      error: 'eventId and otp are required fields',
    });
  }

  const parsedDay = Math.max(1, Number(dayNumber) || 1);
  if (parsedDay < 1 || parsedDay > 30) {
    return reply.status(400).send({
      success: false,
      error: 'Invalid dayNumber: must be a positive integer corresponding to an event day (e.g. 1-5)',
    });
  }

  attendanceBuffer.setEventOTP(eventId, otp, parsedDay);

  return reply.status(200).send({
    success: true,
    message: `Active OTP cached for event ${eventId} (Day ${parsedDay})`,
    eventId,
    dayNumber: parsedDay,
  });
};

export async function attendanceBufferRoutes(fastify: FastifyInstance) {
  // POST /api/attendance/submit
  fastify.post<{ Body: SubmitAttendanceBody }>('/attendance/submit', submitAttendanceHandler);
  fastify.post<{ Body: SubmitAttendanceBody }>('/submit', submitAttendanceHandler);

  // POST /api/admin/sync-db (Superadmin-only)
  fastify.post('/admin/sync-db', { preHandler: [verifyToken, requireSuperAdmin] }, syncDbHandler);
  fastify.post('/sync-db', { preHandler: [verifyToken, requireSuperAdmin] }, syncDbHandler);

  // POST /api/attendance/set-otp (Admin/Faculty)
  fastify.post<{ Body: SetEventOTPBody }>('/attendance/set-otp', { preHandler: [verifyToken, isAdminOrFaculty] }, setEventOTPHandler);
  fastify.post<{ Body: SetEventOTPBody }>('/set-otp', { preHandler: [verifyToken, isAdminOrFaculty] }, setEventOTPHandler);
}

export default attendanceBufferRoutes;
