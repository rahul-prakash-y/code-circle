import dotenv from 'dotenv';
dotenv.config();

import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import connectDB from './config/db';
import errorHandler from './middleware/errorHandler';
import sanitizeInputsHook from './middleware/sanitizeInput';
import { authRoutes } from './routes/authRoutes';
import { userRoutes } from './routes/userRoutes';
import { newsRoutes } from './routes/newsRoutes';
import { eventRoutes } from './routes/eventRoutes';
import { eventArenaRoutes } from './routes/eventArenaRoutes';
import { teamRoutes } from './routes/teamRoutes';
import { attendanceRoutes } from './routes/attendanceRoutes';
import { attendanceBufferRoutes } from './routes/attendance';
import { assessmentRoutes } from './routes/assessmentRoutes';
import { feedbackRoutes } from './routes/feedbackRoutes';
import { bearerRoutes } from './routes/bearerRoutes';
import { notificationRoutes } from './routes/notificationRoutes';
import { adminRoutes } from './routes/adminRoutes';
import { statsRoutes } from './routes/statsRoutes';
import { domainRoutes } from './routes/domainRoutes';
import { levelRoutes } from './routes/levelRoutes';
import { certificateRoutes } from './routes/certificateRoutes';
import { diagnosticsRoutes } from './routes/diagnosticsRoutes';
import { contestRoutes } from './routes/contestRoutes';
import { pointsRoutes } from './routes/pointsRoutes';
import { missedEventRequestRoutes } from './routes/missedEventRequestRoutes';
import { eventDocumentRoutes } from './routes/eventDocumentRoutes';
import { eventReportRoutes } from './routes/eventReportRoutes';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './middleware/authMiddleware';
import fastifyStatic from '@fastify/static';


export const server: FastifyInstance = Fastify({
  trustProxy: true,
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// --- JWT Secret Cluster Consistency Check ---
const activeJwtSecret = getJwtSecret();
const jwtFingerprint = crypto.createHash('sha256').update(activeJwtSecret).digest('hex').substring(0, 8);
server.log.info(`[Auth Cluster] Node JWT Secret Loaded (Fingerprint: ${jwtFingerprint}). Cluster instances MUST share identical JWT_SECRET.`);
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn(`[Auth Cluster Warning] JWT_SECRET is not explicitly set in environment! Using local fallback key.`);
}

// --- CORS Allowed Origins Validator ---
const getAllowedOrigins = (): string[] => {
  const origins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
  ].filter(Boolean) as string[];

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach((o) => {
      const trimmed = o.trim();
      if (trimmed) origins.push(trimmed);
    });
  }
  return origins;
};

export const isOriginAllowed = (origin: string): boolean => {
  const allowed = getAllowedOrigins();
  if (allowed.some((a) => a === origin || origin === a.replace(/\/+$/, ''))) {
    return true;
  }
  // Allow official Vercel deployment domains (including preview branches)
  if (/^https:\/\/[a-zA-Z0-9_\-]+\.vercel\.app$/.test(origin)) {
    return true;
  }
  // In development, permit any localhost or loopback port
  if (process.env.NODE_ENV !== 'production') {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return true;
    }
  }
  return false;
};

// Register CORS with strict origin validation
server.register(cors, {
  origin: (origin, cb) => {
    // Non-browser or same-origin requests (e.g. server-to-server, curl, mobile) have no origin header
    if (!origin) {
      return cb(null, true);
    }
    if (isOriginAllowed(origin)) {
      return cb(null, true);
    }
    return cb(null, false);
  },
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Session-Id'],
  credentials: true,
});

// Production-Grade Security Headers Hook
server.addHook('onSend', async (_request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'SAMEORIGIN');
  reply.header('X-XSS-Protection', '0');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
});

// Register Multipart (File Uploads)
server.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// --- High-Performance Identity-Based Global Rate Limiting ---
// Authenticated routes limit by user ID from verified JWT (preHandler hook ensures request.user exists).
// Unauthenticated requests use client IP with high cap (default 600/min) so an entire classroom on 1 NAT IP is never throttled.
server.register(rateLimit, {
  global: true,
  hook: 'preHandler',
  timeWindow: '1 minute',
  addHeaders: {
    'retry-after': true,
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
  },
  keyGenerator: (request: FastifyRequest) => {
    // 1. If user was populated by verifyToken or preceding auth middleware
    if (request.user?.id) {
      return `user:${request.user.id}`;
    }
    // 2. If Authorization header has a cryptographically verified JWT, extract user id safely
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, getJwtSecret()) as any;
        if (decoded?.id) {
          if (!request.user) {
            request.user = { id: String(decoded.id), ...decoded };
          }
          return `user:${decoded.id}`;
        }
      } catch {
        // Tampered or expired token - fallback to IP-based unauthenticated limit
      }
    }
    // 3. Unauthenticated requests: keyed strictly by client IP (never trusting spoofed client headers)
    return `ip:${request.ip}`;
  },
  max: (_request: FastifyRequest, key: string) => {
    if (key.startsWith('user:')) {
      return Number(process.env.AUTH_RATE_LIMIT_MAX) || 300;
    }
    return Number(process.env.UNAUTH_RATE_LIMIT_MAX) || 600;
  },
  errorResponseBuilder: (_request: FastifyRequest, context: any) => {
    const isUser = typeof context?.key === 'string' && context.key.startsWith('user:');
    const retryAfterSeconds = Math.max(1, Math.ceil(context.ttl / 1000));
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: retryAfterSeconds,
      message: isUser
        ? `Personal rate limit reached. Please wait ${retryAfterSeconds} seconds before trying again.`
        : `Network rate limit reached. Please wait ${retryAfterSeconds} seconds before trying again.`,
    };
  },
});

server.setErrorHandler(errorHandler);

// Global NoSQL Operator Injection Sanitization Hook
server.addHook('preValidation', sanitizeInputsHook);

// --- API ROUTES ---
server.register(authRoutes, { prefix: '/api/auth' });
server.register(userRoutes, { prefix: '/api/users' });
server.register(adminRoutes, { prefix: '/api/admin' });
server.register(eventRoutes, { prefix: '/api/events' });
server.register(eventArenaRoutes, { prefix: '/api/events' });
server.register(teamRoutes, { prefix: '/api/teams' });
server.register(attendanceRoutes, { prefix: '/api/attendance' });
server.register(attendanceBufferRoutes, { prefix: '/api' });
server.register(newsRoutes, { prefix: '/api/news' });
server.register(assessmentRoutes, { prefix: '/api/assessments' });
server.register(feedbackRoutes, { prefix: '/api/feedback' });
server.register(require('./routes/health'), { prefix: '/api' });
server.register(require('./routes/health'), { prefix: '/' });
server.register(require('./routes/uploadRoutes'), { prefix: '/api/upload' });
server.register(require('./routes/enrollmentRoutes'), { prefix: '/api/enrollments' });
server.register(require('./routes/problemRoutes'), { prefix: '/api/problems' });
server.register(require('./routes/analyticsRoutes'), { prefix: '/api/analytics' });
server.register(require('./routes/quizRoutes'), { prefix: '/api/quizzes' });
server.register(bearerRoutes, { prefix: '/api/bearers' });
server.register(notificationRoutes, { prefix: '/api/notifications' });
server.register(statsRoutes, { prefix: '/api/stats' });
server.register(domainRoutes, { prefix: '/api/domains' });
server.register(domainRoutes, { prefix: '/api/courses' });
server.register(levelRoutes, { prefix: '/api/levels' });
server.register(certificateRoutes, { prefix: '/api/certificates' });
server.register(diagnosticsRoutes, { prefix: '/api/admin/diagnostics' });
server.register(contestRoutes, { prefix: '/api/contests' });
server.register(pointsRoutes, { prefix: '/api/points' });
server.register(missedEventRequestRoutes, { prefix: '/api/missed-event-requests' });
server.register(eventDocumentRoutes, { prefix: '/api/docs' });
server.register(eventReportRoutes, { prefix: '/api/reports' });

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
    const port = Number(process.env.PORT) || 5000;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    console.log(`[Server] Fastify server listening on http://${host}:${port}`);

    await connectDB();

    // Asynchronous background migrations & sync (non-blocking)
    (async () => {
      // Ensure existing level-linked challenges are flagged as isCourseChallenge: true
      try {
        const Level = (await import('./models/levelModel')).default;
        const CodingChallenge = (await import('./models/codingChallengeModel')).default;
        const levels = await Level.find({
          $or: [
            { codingChallengeId: { $ne: null } },
            { codingChallengePool: { $exists: true, $ne: [] } },
          ],
        });
        const linkedIds = new Set<string>();
        for (const lvl of levels) {
          let changed = false;
          if (!Array.isArray(lvl.codingChallengePool)) {
            lvl.codingChallengePool = [];
            changed = true;
          }
          if (lvl.codingChallengeId) {
            const cId = lvl.codingChallengeId.toString();
            linkedIds.add(cId);
            if (!lvl.codingChallengePool.some((p: any) => p && p.toString() === cId)) {
              lvl.codingChallengePool.push(lvl.codingChallengeId);
              changed = true;
            }
          }
          if (changed) {
            await lvl.save();
          }
        }
        if (linkedIds.size > 0) {
          await CodingChallenge.updateMany(
            { _id: { $in: Array.from(linkedIds) } },
            { $set: { isCourseChallenge: true } }
          );
        }
      } catch (syncErr) {
        console.warn('[Server] Level challenge sync skipped:', syncErr);
      }

      // Sync passing MCQ assessment submissions for missing points
      try {
        const { syncAssessmentPoints } = await import('./scripts/syncAssessmentPoints');
        await syncAssessmentPoints();
      } catch (assSyncErr) {
        console.warn('[Server] Assessment points sync skipped:', assSyncErr);
      }
    })().catch((err) => console.warn('[Server] Background sync warning:', err));
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Start when executed directly
if (require.main === module && process.env.NODE_ENV !== 'test') {
  start();
}
