require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const connectDB = require('./config/db');
const { initFirebase } = require('./config/firebase');
const fastifyStatic = require("@fastify/static");
const path = require("path");


fastify.register(fastifyStatic, {
    root: path.join(__dirname, "../frontend/dist"),
    prefix: "/",
});

fastify.setNotFoundHandler((request, reply) => {
    if (request.raw.url.startsWith('/api')) {
        return reply.code(404).send({
            success: false,
            message: 'API route not found'
        });
    }

    // SPA fallback
    return reply.sendFile('index.html');
});

// Register CORS
fastify.register(cors, {
  origin: true, // Automatically reflect the request origin
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true // Set to true if you need to send cookies/auth headers
});

// Middleware & Auth
initFirebase();

// Connect Database
connectDB();

// Register Plugins
fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Register Routes
fastify.register(require('./routes/health'), { prefix: '/api' });
fastify.register(require('./routes/userRoutes'), { prefix: '/api/users' });
fastify.register(require('./routes/uploadRoutes'), { prefix: '/api/upload' });
fastify.register(require('./routes/eventRoutes'), { prefix: '/api/events' });
fastify.register(require('./routes/enrollmentRoutes'), { prefix: '/api/enrollments' });
fastify.register(require('./routes/problemRoutes'), { prefix: '/api/problems' });
fastify.register(require('./routes/analyticsRoutes'), { prefix: '/api/analytics' });
fastify.register(require('./routes/quizRoutes'), { prefix: '/api/quizzes' });

// Health Check Root
fastify.get('/', async () => {
  return { message: 'Code Circle Backend API' };
});

const start = async () => {
  try {
    const port = process.env.PORT || 5000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server is running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
