import { ISeedTrackData } from './types';

export const track5Mern: ISeedTrackData = {
  name: 'MERN Stack Development: Enterprise Web Engineering',
  description:
    'Build production-grade full-stack web platforms with MongoDB, Express.js, React 19, Node.js 20, TailwindCSS, and Docker.',
  coverImageUrl:
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80',
  isLocked: false,
  levels: [
    {
      levelNumber: 1,
      title: 'Level 1: Web Foundations, Semantic HTML5 & Modern CSS',
      youtubeVideoId: 'pQN-pnXPaVg',
      studyMaterials: [
        {
          title: 'Semantic HTML5 & Responsive Flexbox',
          type: 'notes',
          content: `# Web Foundations\n\n- Semantic HTML: <main>, <header>, <section>, <article>, <footer>\n- Flexbox: display: flex; justify-content: center; align-items: center;\n- Git Branch Workflows: git checkout -b feature/xyz`,
        },
      ],
      questQuestions: [
        {
          question: 'Which HTML5 element represents self-contained content suitable for independent distribution?',
          options: ['<article>', '<section>', '<div>', '<aside>'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 1: Responsive Breakpoint Viewport Classifier',
        description: 'Read a viewport width in pixels. Output "MOBILE" (< 640), "TABLET" (640-1023), or "DESKTOP" (>= 1024).',
        inputFormat: 'Single integer width',
        outputFormat: 'MOBILE, TABLET, or DESKTOP',
        constraints: '1 <= width <= 4000',
        sampleInput: '768',
        sampleOutput: 'TABLET',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const w = parseInt(fs.readFileSync(0, 'utf-8').trim(), 10);\n    if (w < 640) console.log('MOBILE');\n    else if (w < 1024) console.log('TABLET');\n    else console.log('DESKTOP');\n}\nmain();\n`,
        },
        testCases: [
          { input: '768', expectedOutput: 'TABLET', isHidden: false },
          { input: '375', expectedOutput: 'MOBILE', isHidden: false },
          { input: '1440', expectedOutput: 'DESKTOP', isHidden: true },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What CSS property allows flex items to wrap across multiple lines?',
          options: ['flex-wrap: wrap;', 'flex-direction: column;', 'display: block;', 'overflow: scroll;'],
          correctOptionIndex: 0,
          explanation: 'flex-wrap: wrap allows items to flow into additional lines rather than overflowing the container.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 2,
      title: 'Level 2: Modern JavaScript & Asynchronous Data',
      youtubeVideoId: 'NCwa_xi0Uuc',
      studyMaterials: [
        {
          title: 'ES6+ & Async/Await',
          type: 'notes',
          content: `# Modern JavaScript\n\n- Destructuring, Rest & Spread operators.\n- Fetch API with async/await and try/catch blocks.\n- Error envelope pattern: { success, data, error }.`,
        },
      ],
      questQuestions: [
        {
          question: 'What happens when an unhandled error is thrown inside an async function?',
          options: ['It returns a rejected Promise', 'It crashes the browser tab', 'It returns undefined', 'It pauses execution'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 2: Standardized API Response Envelope Formatter',
        description: 'Read an HTTP status code and a message string. If status < 400, output "SUCCESS: <msg>", else "ERROR: <msg>".',
        inputFormat: 'Status Message',
        outputFormat: 'SUCCESS: <msg> or ERROR: <msg>',
        constraints: '100 <= status <= 599',
        sampleInput: '200 OK',
        sampleOutput: 'SUCCESS: OK',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const [status, ...msgParts] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    const code = parseInt(status, 10);\n    const msg = msgParts.join(' ');\n    if (code < 400) console.log(\`SUCCESS: \${msg}\`);\n    else console.log(\`ERROR: \${msg}\`);\n}\nmain();\n`,
        },
        testCases: [
          { input: '200 OK', expectedOutput: 'SUCCESS: OK', isHidden: false },
          { input: '404 NOT_FOUND', expectedOutput: 'ERROR: NOT_FOUND', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What HTTP status code represents a resource creation success?',
          options: ['201 Created', '200 OK', '204 No Content', '301 Moved Permanently'],
          correctOptionIndex: 0,
          explanation: 'HTTP 201 Created signifies that the request succeeded and led to the creation of a new resource.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 3,
      title: 'Level 3: React Foundations, JSX & Controlled State',
      youtubeVideoId: 'bMknfKXIFA8',
      studyMaterials: [
        {
          title: 'React Component Architecture',
          type: 'notes',
          content: `# React Foundations\n\n- Declarative UI: V = f(state)\n- useState for reactive local component state\n- Controlled form inputs with value and onChange props`,
        },
      ],
      questQuestions: [
        {
          question: 'Why should state in React never be modified directly (e.g., state.count = 5)?',
          options: ['Direct mutation does not trigger re-render reconciliation', 'Throws runtime exception', 'Modifies global window', 'Compiles to undefined'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 3: Controlled Form Validation State Machine',
        description: 'Read an email string. Output "VALID" if it contains "@" and ".", else output "INVALID".',
        inputFormat: 'Single string email',
        outputFormat: 'VALID or INVALID',
        constraints: '1 <= length <= 100',
        sampleInput: 'student@codecircle.com',
        sampleOutput: 'VALID',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const email = fs.readFileSync(0, 'utf-8').trim();\n    if (email.includes('@') && email.includes('.')) {\n        console.log('VALID');\n    } else {\n        console.log('INVALID');\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: 'student@codecircle.com', expectedOutput: 'VALID', isHidden: false },
          { input: 'invalidemail', expectedOutput: 'INVALID', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is a controlled component in React?',
          options: ['An input whose value is driven by React state rather than the internal DOM state', 'A component with CSS styling', 'A server component', 'A class component'],
          correctOptionIndex: 0,
          explanation: 'In a controlled component, form data is handled by a React component state via value and onChange.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 4,
      title: 'Level 4: Advanced React & TanStack Query Caching',
      youtubeVideoId: 'r8Dg0KVnfMA',
      studyMaterials: [
        {
          title: 'Server State vs Client State',
          type: 'notes',
          content: `# Advanced React\n\n- React Router v6: Route guards & nested outlets\n- TanStack Query (React Query): Automated cache invalidation and query deduplication\n- Custom hooks for business logic separation.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is the primary purpose of TanStack Query (React Query)?',
          options: ['Managing and caching asynchronous server state in client applications', 'Rendering CSS animations', 'Managing HTML tables', 'Form validation'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 4: Client-Side Query Cache Expiration Simulator',
        description: 'Read currentTime, cachedTime, and cacheTTL (in seconds). Output "FRESH" if (currentTime - cachedTime) <= cacheTTL, else "STALE".',
        inputFormat: 'CurrentTime CachedTime TTL',
        outputFormat: 'FRESH or STALE',
        constraints: 'All integers >= 0',
        sampleInput: '100 80 30',
        sampleOutput: 'FRESH',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const [curr, cached, ttl] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);\n    if (curr - cached <= ttl) console.log('FRESH');\n    else console.log('STALE');\n}\nmain();\n`,
        },
        testCases: [
          { input: '100 80 30', expectedOutput: 'FRESH', isHidden: false },
          { input: '100 60 30', expectedOutput: 'STALE', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What does React.useMemo accomplish?',
          options: ['Memoizes the result of an expensive calculation between renders unless dependencies change', 'Creates a ref', 'Sets up timers', 'Triggers re-render'],
          correctOptionIndex: 0,
          explanation: 'useMemo caches calculated values across renders until one of its dependencies changes.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 5,
      title: 'Level 5: Node.js & Express.js Backend Architecture',
      youtubeVideoId: 'Oe421EPjeBE',
      studyMaterials: [
        {
          title: 'Express Routing & Middleware Lifecycle',
          type: 'notes',
          content: `# Express Backend\n\n- Request lifecycle: Request -> Middleware Chain -> Controller -> Response\n- Zod schema validation for request bodies\n- Centralized error-handling middleware: (err, req, res, next).`,
        },
      ],
      questQuestions: [
        {
          question: 'How does an Express middleware pass control to the next handler?',
          options: ['Calling next()', 'Calling return true', 'Calling res.continue()', 'Calling emit()'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 5: Express Route Path Parameter Extractor',
        description: 'Given a route template "/api/users/:id/posts/:postId" and a path "/api/users/42/posts/99", print "id=42,postId=99".',
        inputFormat: 'Single line with URL path',
        outputFormat: 'id=<id>,postId=<postId>',
        constraints: 'Valid path structure',
        sampleInput: '/api/users/42/posts/99',
        sampleOutput: 'id=42,postId=99',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const path = fs.readFileSync(0, 'utf-8').trim();\n    const parts = path.split('/').filter(Boolean);\n    console.log(\`id=\${parts[2]},postId=\${parts[4]}\`);\n}\nmain();\n`,
        },
        testCases: [
          { input: '/api/users/42/posts/99', expectedOutput: 'id=42,postId=99', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the signature of an Express error-handling middleware?',
          options: ['(err, req, res, next)', '(req, res, next)', '(err, res)', '(req, err)'],
          correctOptionIndex: 0,
          explanation: 'Express recognizes error middleware by having exactly 4 parameters starting with err.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 6,
      title: 'Level 6: MongoDB, Mongoose & Aggregation Pipelines',
      youtubeVideoId: 'ofme2o29ngU',
      studyMaterials: [
        {
          title: 'MongoDB Aggregation Pipeline',
          type: 'notes',
          content: `# MongoDB Aggregation\n\n- Pipelines: $match -> $group -> $sort -> $project\n- Indexing: Compound indexes and single field indexes\n- Mongoose schemas with virtuals and pre-save hooks.`,
        },
      ],
      questQuestions: [
        {
          question: 'Which aggregation stage in MongoDB groups documents by a specified identifier key?',
          options: ['$group', '$match', '$project', '$lookup'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 6: MongoDB Aggregation $group Simulator',
        description: 'Read N product sales records (Category, Amount). Output category with the highest total sales.',
        inputFormat: 'Line 1: N\\nNext N lines: Category Amount',
        outputFormat: 'Category name',
        constraints: '1 <= N <= 1000',
        sampleInput: '3\nTech 500\nBooks 200\nTech 300',
        sampleOutput: 'Tech',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\r?\\n/);\n    if (lines.length >= 2) {\n        const n = parseInt(lines[0], 10);\n        const totals = {};\n        for (let i = 1; i <= n && i < lines.length; i++) {\n            const [cat, amt] = lines[i].split(/\\s+/);\n            totals[cat] = (totals[cat] || 0) + parseFloat(amt);\n        }\n        let bestCat = '', maxAmt = -1;\n        for (const [cat, amt] of Object.entries(totals)) {\n            if (amt > maxAmt) { maxAmt = amt; bestCat = cat; }\n        }\n        console.log(bestCat);\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '3\nTech 500\nBooks 200\nTech 300', expectedOutput: 'Tech', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the purpose of compound indexes in MongoDB?',
          options: ['Indexes queries filtering on multiple fields in an ordered sequence', 'Compresses database collections', 'Replicates documents', 'Encrypts fields'],
          correctOptionIndex: 0,
          explanation: 'Compound indexes index multiple fields together to support multi-attribute queries efficiently.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 7,
      title: 'Level 7: Authentication, JWT & Security (RBAC)',
      youtubeVideoId: 'mbsmsi7l3r4',
      studyMaterials: [
        {
          title: 'JWT Authentication & Password Hashing',
          type: 'notes',
          content: `# Authentication & Security\n\n- Passwords hashed with Bcrypt (salt rounds 10-12)\n- Stateless JWT access tokens + refresh tokens stored in HttpOnly cookies\n- Role-Based Access Control (RBAC) middleware`,
        },
      ],
      questQuestions: [
        {
          question: 'Why should JWT refresh tokens be stored in HttpOnly cookies instead of localStorage?',
          options: ['HttpOnly cookies cannot be read by client-side JavaScript, preventing XSS token theft', 'Cookies are faster', 'LocalStorage has no expiry', 'Required by MongoDB'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 7: RBAC Permission Bitmask Evaluator',
        description: 'Given UserPermission and RequiredPermission bitmasks, output "PERMITTED" if (User & Required) === Required, else "DENIED".',
        inputFormat: 'UserMask RequiredMask',
        outputFormat: 'PERMITTED or DENIED',
        constraints: 'Non-negative integers',
        sampleInput: '7 2',
        sampleOutput: 'PERMITTED',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const [user, req] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);\n    if ((user & req) === req) console.log('PERMITTED');\n    else console.log('DENIED');\n}\nmain();\n`,
        },
        testCases: [
          { input: '7 2', expectedOutput: 'PERMITTED', isHidden: false },
          { input: '4 2', expectedOutput: 'DENIED', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What does Helmet middleware accomplish in Express.js?',
          options: ['Sets secure HTTP response headers (CSP, HSTS, X-Frame-Options) to mitigate common vulnerabilities', 'Encrypts database connections', 'Compresses JSON payloads', 'Handles JWT verification'],
          correctOptionIndex: 0,
          explanation: 'Helmet sets security-related HTTP headers to protect against clickjacking, cross-site scripting, and sniffing.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 8,
      title: 'Level 8: Full-Stack MERN Integration & Media Uploads',
      youtubeVideoId: '7CqJlxBYj-M',
      studyMaterials: [
        {
          title: 'Connecting React and Express',
          type: 'notes',
          content: `# Full-Stack MERN Integration\n\n- Axios interceptors for automated bearer token injection and 401 refresh retries.\n- Multipart form uploads with Multer & Cloudinary.\n- React Hook Form + Zod for unified client-server validation.`,
        },
      ],
      questQuestions: [
        {
          question: 'What HTTP header must be sent for file upload requests?',
          options: ['multipart/form-data', 'application/json', 'text/plain', 'application/xml'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 8: Paginated Page Offset Calculator',
        description: 'Read Page number (1-indexed) and PageSize. Print the skip offset and limit for MongoDB query.',
        inputFormat: 'Page PageSize',
        outputFormat: 'Skip=<skip>,Limit=<limit>',
        constraints: 'Page >= 1, PageSize >= 1',
        sampleInput: '3 10',
        sampleOutput: 'Skip=20,Limit=10',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const [page, size] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);\n    const skip = (page - 1) * size;\n    console.log(\`Skip=\${skip},Limit=\${size}\`);\n}\nmain();\n`,
        },
        testCases: [
          { input: '3 10', expectedOutput: 'Skip=20,Limit=10', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is CORS (Cross-Origin Resource Sharing)?',
          options: ['A browser security mechanism restricting web pages from making requests to a different domain without permission', 'A database protocol', 'A CSS grid framework', 'An image format'],
          correctOptionIndex: 0,
          explanation: 'CORS uses HTTP headers to allow servers to declare which origins are permitted to access their resources.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 9,
      title: 'Level 9: Real-Time Sockets, Redis & Docker Compose',
      youtubeVideoId: 'djMy4QsPWiI',
      studyMaterials: [
        {
          title: 'WebSockets & Dockerization',
          type: 'notes',
          content: `# Production MERN\n\n- Socket.IO rooms for targeted event broadcasts\n- Redis key invalidation on POST/PUT mutations\n- Docker Compose orchestration with Node, Mongo, and Redis containers.`,
        },
      ],
      questQuestions: [
        {
          question: 'What is Docker Compose used for?',
          options: ['Defining and running multi-container Docker applications with a YAML configuration file', 'Writing JavaScript', 'Generating CSS', 'Compiling React'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 9: Socket Room Presence Counter Simulation',
        description: 'Read N socket operations (JOIN roomName or LEAVE roomName). Output user count in room "dev".',
        inputFormat: 'Line 1: N\\nNext N lines: ACTION ROOM',
        outputFormat: 'Count in dev room',
        constraints: '1 <= N <= 100',
        sampleInput: '4\nJOIN dev\nJOIN general\nJOIN dev\nLEAVE dev',
        sampleOutput: '1',
        difficulty: 'Easy',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\r?\\n/);\n    if (lines.length >= 2) {\n        const n = parseInt(lines[0], 10);\n        let devCount = 0;\n        for (let i = 1; i <= n && i < lines.length; i++) {\n            const [action, room] = lines[i].split(/\\s+/);\n            if (room === 'dev') {\n                if (action === 'JOIN') devCount++;\n                else if (action === 'LEAVE' && devCount > 0) devCount--;\n            }\n        }\n        console.log(devCount);\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '4\nJOIN dev\nJOIN general\nJOIN dev\nLEAVE dev', expectedOutput: '1', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is the purpose of Redis Pub/Sub in scaling Socket.IO across multiple server instances?',
          options: ['Allows Socket.IO instances to share broadcast events across all servers in a cluster', 'Compiles React components', 'Backs up MongoDB', 'Caches HTML files'],
          correctOptionIndex: 0,
          explanation: 'Redis Pub/Sub acts as an adapter, broadcasting socket events to all connected server nodes in a load-balanced cluster.',
          points: 1,
        },
      ],
    },
    {
      levelNumber: 10,
      title: 'Level 10: Scalable Architecture & Capstone Platform',
      youtubeVideoId: 'mr9j8u2d6_0',
      studyMaterials: [
        {
          title: 'Clean Architecture & Microservices',
          type: 'notes',
          content: `# Scalable MERN Architecture\n\n- Domain-Driven Design (DDD) modular boundaries\n- Background job workers with BullMQ\n- GitHub Actions CI/CD automated test & build pipelines.`,
        },
      ],
      questQuestions: [
        {
          question: 'Why are asynchronous message queues (e.g. BullMQ) used in web backends?',
          options: ['To offload heavy tasks (PDF generation, emails) from HTTP request cycles without blocking clients', 'To format JSON', 'To compile React', 'To secure ports'],
          correctOption: 0,
        },
      ],
      challenge: {
        title: 'Level 10: Distributed Job Queue Priority Scheduler Simulator',
        description: 'Read N jobs with Priority (1=High, 2=Normal). Process High priority first, then Normal. Output job names in order.',
        inputFormat: 'Line 1: N\\nNext N lines: JobName Priority',
        outputFormat: 'Job names on separate lines in execution order',
        constraints: '1 <= N <= 100',
        sampleInput: '3\nEmailJob 2\nPaymentJob 1\nReportJob 2',
        sampleOutput: 'PaymentJob\nEmailJob\nReportJob',
        difficulty: 'Medium',
        allowedLanguages: ['javascript'],
        starterCode: {
          javascript: `const fs = require('fs');\n\nfunction main() {\n    const lines = fs.readFileSync(0, 'utf-8').trim().split(/\\r?\\n/);\n    if (lines.length >= 2) {\n        const n = parseInt(lines[0], 10);\n        const high = [], normal = [];\n        for (let i = 1; i <= n && i < lines.length; i++) {\n            const [name, p] = lines[i].split(/\\s+/);\n            if (parseInt(p, 10) === 1) high.push(name);\n            else normal.push(name);\n        }\n        [...high, ...normal].forEach(j => console.log(j));\n    }\n}\nmain();\n`,
        },
        testCases: [
          { input: '3\nEmailJob 2\nPaymentJob 1\nReportJob 2', expectedOutput: 'PaymentJob\nEmailJob\nReportJob', isHidden: false },
        ],
      },
      assessmentQuestions: [
        {
          questionText: 'What is Blue-Green Deployment in web operations?',
          options: ['Running two identical production environments to enable zero-downtime releases and instant rollback', 'Running unit tests twice', 'Using two CSS stylesheets', 'A git branch strategy'],
          correctOptionIndex: 0,
          explanation: 'Blue-Green deployments maintain two identical environments, switching router traffic to the new version with zero downtime.',
          points: 1,
        },
      ],
    },
  ],
};
