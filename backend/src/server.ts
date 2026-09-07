import dotenv from 'dotenv';
dotenv.config();

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import connectDB from './config/db';
import errorHandler from './middleware/errorHandler';
import { authRoutes } from './routes/authRoutes';
import { userRoutes } from './routes/userRoutes';
import { newsRoutes } from './routes/newsRoutes';
import { eventRoutes } from './routes/eventRoutes';
import { teamRoutes } from './routes/teamRoutes';
import { attendanceRoutes } from './routes/attendanceRoutes';
import { assessmentRoutes } from './routes/assessmentRoutes';
import { feedbackRoutes } from './routes/feedbackRoutes';
import path from 'path';
import fs from 'fs';
import fastifyStatic from '@fastify/static';


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
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Centralized Global Error Handler
server.setErrorHandler(errorHandler);

// --- API ROUTES ---
server.register(authRoutes, { prefix: '/api/auth' });
server.register(userRoutes, { prefix: '/api/users' });
server.register(eventRoutes, { prefix: '/api/events' });
server.register(teamRoutes, { prefix: '/api/teams' });
server.register(attendanceRoutes, { prefix: '/api/attendance' });
server.register(newsRoutes, { prefix: '/api/news' });
server.register(assessmentRoutes, { prefix: '/api/assessments' });
server.register(feedbackRoutes, { prefix: '/api/feedback' });
server.register(require('./routes/health'), { prefix: '/api' });
server.register(require('./routes/uploadRoutes'), { prefix: '/api/upload' });
server.register(require('./routes/enrollmentRoutes'), { prefix: '/api/enrollments' });
server.register(require('./routes/problemRoutes'), { prefix: '/api/problems' });
server.register(require('./routes/analyticsRoutes'), { prefix: '/api/analytics' });
server.register(require('./routes/quizRoutes'), { prefix: '/api/quizzes' });
server.register(require('./routes/bearerRoutes'), { prefix: '/api/bearers' });

// API 404 Handler
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  server.register(fastifyStatic, {
    root: frontendDistPath,
    prefix: '/',
  });
  // SPA Route Fallback: Any non-API route serves index.html
  server.setNotFoundHandler((request, reply) => {
    if (request.raw.url && request.raw.url.startsWith('/api')) {
      reply.status(404).send({ success: false, error: 'Not found' });
    } else {
      reply.sendFile('index.html');
    }
  });
}


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
