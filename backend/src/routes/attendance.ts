import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import attendanceBuffer from '../services/attendanceBuffer';
import { verifyToken, requireSuperAdmin, isAdminOrFaculty } from '../middleware/authMiddleware';

export interface SubmitAttendanceBody {
  eventId: string;
  otp: string;
  userId: string;
}

export interface SetEventOTPBody {
  eventId: string;
  otp: string;
}

/**
 * High-performance attendance submission handler.
 * Validates against in-memory OTP cache and queues record in memory.
 * Guarantees sub-5ms response time by avoiding awaiting any database calls.
 */
export const submitAttendanceHandler = async (
  request: FastifyRequest<{ Body: SubmitAttendanceBody }>,
  reply: FastifyReply
) => {
  const { eventId, otp, userId } = request.body || {};

  if (!eventId || !otp || !userId) {
    return reply.status(400).send({
      success: false,
      error: 'eventId, otp, and userId are required fields',
    });
  }

  const result = attendanceBuffer.verifyAndQueue(userId, eventId, otp);

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
 * Admin/Faculty handler to set an event's active OTP into memory buffer
 */
export const setEventOTPHandler = async (
  request: FastifyRequest<{ Body: SetEventOTPBody }>,
  reply: FastifyReply
) => {
  const { eventId, otp } = request.body || {};

  if (!eventId || !otp) {
    return reply.status(400).send({
      success: false,
      error: 'eventId and otp are required fields',
    });
  }

  attendanceBuffer.setEventOTP(eventId, otp);

  return reply.status(200).send({
    success: true,
    message: `Active OTP cached for event ${eventId}`,
    eventId,
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
