import dotenv from 'dotenv';
dotenv.config();

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import connectDB from './config/db';
import errorHandler from './middleware/errorHandler';

export const server: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register CORS
server.register(cors, {
  origin: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Session-Id'],
  credentials: true,
});

// Register Multipart (File Uploads)
server.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Centralized Global Error Handler
server.setErrorHandler(errorHandler);

// Baseline Health Check Route
server.get('/api/health', async (request, reply) => {
  return reply.send({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API 404 Handler
server.setNotFoundHandler((request, reply) => {
  if (request.raw.url?.startsWith('/api')) {
    return reply.status(404).send({
      success: false,
      error: 'API route not found',
    });
  }
  return reply.status(404).send({
    success: false,
    error: 'Not found',
  });
});

// Server Initialization
export const start = async (): Promise<void> => {
  try {
    await connectDB();
    const port = Number(process.env.PORT) || 5000;
    const host = '0.0.0.0';

    await server.listen({ port, host });
    console.log(`[Server] Fastify server listening on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Start when executed directly
if (require.main === module || process.env.NODE_ENV !== 'test') {
  start();
}
