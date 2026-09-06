/**
 * Centralized Fastify Error Handler
 * Normalizes error responses across all controllers, plugins, and mongoose operations.
 */
const errorHandler = (error, request, reply) => {
  request.log.error({
    err: error,
    url: request.raw.url,
    method: request.raw.method,
  }, 'Request encountered an error');

  const statusCode = error.statusCode || (error.status ? error.status : 500);

  // Mongoose Schema Validation Error
  if (error.name === 'ValidationError' && error.errors) {
    const messages = Object.values(error.errors).map(e => e.message);
    return reply.status(400).send({
      success: false,
      error: messages.join(', ') || 'Validation failed'
    });
  }

  // MongoDB Unique Constraint Violation
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    return reply.status(409).send({
      success: false,
      error: `A record with this ${field} already exists.`
    });
  }

  // Cast Error (Invalid MongoDB ObjectId)
  if (error.name === 'CastError') {
    return reply.status(400).send({
      success: false,
      error: `Invalid format for resource identifier: ${error.value}`
    });
  }

  // JWT Token Errors
  if (error.name === 'TokenExpiredError') {
    return reply.status(401).send({
      success: false,
      error: 'Your session has expired. Please log in again.'
    });
  }
  if (error.name === 'JsonWebTokenError') {
    return reply.status(401).send({
      success: false,
      error: 'Invalid authentication token.'
    });
  }

  return reply.status(statusCode).send({
    success: false,
    error: statusCode === 500 && process.env.NODE_ENV === 'production' 
      ? 'An unexpected internal error occurred.' 
      : (error.message || 'Internal Server Error')
  });
};

module.exports = errorHandler;
