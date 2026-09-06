import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ApiError } from '../utils/ApiError';

export const errorHandler = (
  error: FastifyError | Error | any,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  request.log.error(
    {
      err: error,
      url: request.raw.url,
      method: request.raw.method,
    },
    'Request encountered an error'
  );

  // Custom Application Error
  if (error instanceof ApiError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  // Fastify Schema Validation Error
  if (error.validation && Array.isArray(error.validation)) {
    return reply.status(400).send({
      success: false,
      error: 'Validation failed',
      details: error.validation.map((v: any) => ({
        field: v.instancePath || v.params?.missingProperty || 'field',
        message: v.message,
      })),
    });
  }

  // Mongoose Schema Validation Error
  if (error.name === 'ValidationError' && error.errors) {
    const messages = Object.values(error.errors).map((e: any) => e.message);
    return reply.status(400).send({
      success: false,
      error: messages.join(', ') || 'Validation failed',
      details: error.errors,
    });
  }

  // MongoDB Unique Constraint Violation (Duplicate Key)
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    return reply.status(409).send({
      success: false,
      error: `A record with this ${field} already exists.`,
    });
  }

  // Cast Error (Invalid MongoDB ObjectId)
  if (error.name === 'CastError') {
    return reply.status(400).send({
      success: false,
      error: `Invalid format for resource identifier: ${error.value}`,
    });
  }

  // JWT Token Errors
  if (error.name === 'TokenExpiredError') {
    return reply.status(401).send({
      success: false,
      error: 'Your session has expired. Please log in again.',
    });
  }

  if (error.name === 'JsonWebTokenError') {
    return reply.status(401).send({
      success: false,
      error: 'Invalid authentication token.',
    });
  }

  // Default fallback for HTTP status codes
  const statusCode = error.statusCode || (typeof error.status === 'number' ? error.status : 500);

  return reply.status(statusCode).send({
    success: false,
    error:
      statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'An unexpected internal error occurred.'
        : error.message || 'Internal Server Error',
  });
};

export default errorHandler;
