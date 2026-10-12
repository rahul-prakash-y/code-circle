# Track 4: JavaScript Programming — Modern V8, Runtimes & Full-Stack Engineering

**Category**: Web & Full-Stack Programming  
**Target Audience**: Web Developers, Full-Stack Engineers, Frontend Specialists  
**Primary Language**: JavaScript (ES2024 / Node.js 20 LTS)  
**Total Estimated Duration**: 120 Hours  

---

## Level 1: JavaScript & Runtime Foundations
- **Difficulty**: Beginner
- **Estimated Completion Time**: 8 Hours
- **Prerequisites**: Basic web browsing knowledge.
- **Skills Unlocked**: ECMAScript standards, Node.js CLI, V8 engine overview, dynamic typing, `let`/`const` vs `var`, template literals, console methods.

### Description & Objectives
Understand how JavaScript executes across client (browsers) and server (Node.js). Master primitive data types (`number`, `string`, `boolean`, `null`, `undefined`, `symbol`, `bigint`), type coercion, and standard console tooling.

### Concepts & Examples
- Truthy and Falsy values (`0`, `""`, `null`, `undefined`, `NaN`, `false`).
- Strict equality (`===`) vs loose equality (`==`) and coercion traps.
- Template literals and arithmetic operators.

### Coding Challenges
- **Easy**: Strict Type Checker & Formatted Bio Printer.
- **Medium**: High-Precision Currency Formatter (`Intl.NumberFormat`).
- **Hard**: Safe Arithmetic Evaluator with `BigInt` Support.

### Mini Project
- **Level 1 Micro-Utility**: **Browser & Console Interactive Tip & Split Calculator**
- CLI/Web utility calculating restaurant bills, split amounts per person, custom tip percentages, and currency rounding.

---

## Level 2: Control Flow, Scopes & Arrow Functions
- **Difficulty**: Elementary
- **Estimated Completion Time**: 10 Hours
- **Skills Unlocked**: Function declarations vs function expressions, arrow functions (`() => {}`), block scope vs function scope, lexical `this`, default parameters.

### Key Concepts & Exercises
- Variable hoisting: Why `var` hoists undefined, while `let`/`const` reside in the Temporal Dead Zone (TDZ).
- Short-circuit evaluation (`&&`, `||`, nullish coalescing `??`).
- Arrow functions: Concise syntax and absence of own `this`/`arguments`.

### Coding Challenges
- **Easy**: Multi-Condition Discount Evaluator using `??` and Ternary.
- **Medium**: Prime Factorization and Fibonacci Array Generator.
- **Hard**: Curried Arithmetic Calculator Function (`add(2)(3)(4)`).

### Mini Project
- **Level 2 Utility**: **Dynamic Command-Line Quiz Application**
- Interactive timed quiz evaluating student answers, scoring percentage, providing hints, and reporting performance summaries.

---

## Level 3: Objects, Arrays & Functional Idioms
- **Difficulty**: Intermediate
- **Estimated Completion Time**: 12 Hours
- **Skills Unlocked**: Array methods (`map`, `filter`, `reduce`, `find`, `some`, `every`, `flat`), Object destructuring, Rest/Spread operators (`...`), `Object.entries()`, `Object.freeze()`.

### Key Concepts & Exercises
- Reference vs Value: Shallow copy (`{...obj}`) vs Deep copy (`structuredClone(obj)`).
- Chaining functional array methods without mutating source data.
- Array destructuring with default fallbacks and rest properties.

### Coding Challenges
- **Easy**: Dynamic Object Property Extractor and Transformer.
- **Medium**: Array Grouping and Aggregation using `Array.prototype.reduce`.
- **Hard**: Deep Object Difference Engine (Comparing nested objects).

### Mini Project
- **Level 3 Logic App**: **Student Roster & Grade Analysis Engine**
- Collects student records, computes department averages using `reduce()`, extracts Dean's honor list using `filter()`, and sorts by ranking.

---

## Level 4: DOM Manipulation & Web APIs
- **Difficulty**: Upper-Intermediate
- **Estimated Completion Time**: 14 Hours
- **Skills Unlocked**: Document Object Model (DOM), DOM Queries (`querySelector`), Event Listeners, Event Bubbling & Delegation, Web Storage (`localStorage`, `sessionStorage`), Fetch API basics.

### Key Concepts & Exercises
- The Event propagation model: Capturing, Target, and Bubbling phases; `e.stopPropagation()` and `e.preventDefault()`.
- Event delegation for high-performance dynamic lists.
- Persisting state across browser refreshes via `localStorage`.

### Coding Challenges
- **Easy**: Dynamic Element Creator and Counter Widget.
- **Medium**: Event-Delegated Filterable Item List.
- **Hard**: Client-Side Offline Storage Sync Engine.

### Mini Project
- **Level 4 Data-Processing App**: **Interactive Kanban Board & Task Manager**
- Interactive web app supporting drag-and-drop task movement, category color coding, inline title editing, and persistent `localStorage` synchronization.

---

## Level 5: Modern Asynchronous JavaScript & Classes
- **Difficulty**: Intermediate
- **Estimated Completion Time**: 14 Hours
- **Skills Unlocked**: ES6 Classes (`class`, `constructor`, `extends`, `super`, `#privateFields`), Promises, `async`/`await`, `Promise.all()`, `Promise.race()`, `Promise.allSettled()`, Error handling with `try-catch-finally`.

### Key Concepts & Exercises
- The Promise lifecycle: `pending`, `fulfilled`, `rejected`.
- Migrating from callback hell to `async/await` clean linear code.
- Private class fields (`#id`) and getter/setter encapsulation.

### Coding Challenges
- **Easy**: Sequential Delay Task Runner using Promises.
- **Medium**: Concurrent API Fetcher with Timeout Fallback using `Promise.race()`.
- **Hard**: Resilient Retry Fetch Function with Exponential Backoff.

### Mini Project
- **Level 5 Structured App**: **Live Multi-Source Cryptocurrency & Stock Dashboard**
- Asynchronous browser app fetching real-time market data from public REST APIs, handling network failures with graceful retries, and rendering charts.

---

## Level 6: Advanced JavaScript: V8 Internals & The Event Loop
- **Difficulty**: Advanced
- **Estimated Completion Time**: 16 Hours
- **Skills Unlocked**: Closures, Lexical Environment, Prototypal Inheritance (`__proto__`, `prototype`), `this` binding (`call`, `apply`, `bind`), Event Loop (Call Stack, Web APIs, Microtask Queue vs Macrotask Queue), Generators (`function*`, `yield`), Iterators.

### Key Concepts & Exercises
- Demystifying the Event Loop: Why `Promise.resolve().then(...)` runs before `setTimeout(..., 0)`.
- Memory Leaks: Detached DOM nodes, uncleaned intervals, closure retaining references.
- Custom Iterators (`Symbol.iterator`) and infinite generator sequences.

### Coding Challenges
- **Easy**: Function Memoization Wrapper with Cache Eviction.
- **Medium**: Custom Polyfill for `Array.prototype.flat` and `Function.prototype.bind`.
- **Hard**: Asynchronous Task Queue with Concurrency Limit (Max $N$ in parallel).

### Mini Project
- **Level 6 Structured App**: **Custom In-Browser Reactive State Management Utility**
- A lightweight state container inspired by Redux/Zustand using Closures and JavaScript Proxies to trigger automated DOM updates on property changes.

---

## Level 7: Server-Side JavaScript with Node.js & Fastify
- **Difficulty**: Advanced
- **Estimated Completion Time**: 16 Hours
- **Skills Unlocked**: Node.js architecture, Libuv thread pool, Event Emitter, `fs/promises`, Streams & Buffers, HTTP module, Fastify / Express fundamentals, Environment configuration (`dotenv`).

### Key Concepts & Exercises
- Non-blocking asynchronous I/O vs worker threads for CPU-bound tasks.
- Stream processing: Pipelining large files with zero RAM bloat (`stream.pipeline()`).
- Building high-speed RESTful routes with Fastify and JSON Schema validation.

### Coding Challenges
- **Easy**: Event-Driven Logger using `EventEmitter`.
- **Medium**: Streaming Large File Inverter and Line Counter.
- **Hard**: High-Throughput REST API Route with Fastify Schema Validation.

### Mini Project
- **Level 7 Real-World App**: **High-Performance Developer Snippet Vault REST API**
- A backend REST service with Fastify, JSON file storage, API token authorization, and file upload endpoints.

---

## Level 8: Full-Stack Integration with React & REST
- **Difficulty**: Advanced
- **Estimated Completion Time**: 18 Hours
- **Skills Unlocked**: React component lifecycle, Hooks (`useState`, `useEffect`, `useCallback`, `useMemo`), REST API consumption, JWT client storage, Global state with Context/Zustand.

### Key Concepts & Exercises
- Virtual DOM reconciliation and key prop mechanics.
- Managing server state with modern data fetching patterns.
- Secure client-side token storage and Axios/Fetch request interceptors.

### Coding Challenges
- **Easy**: Debounced Search Input Hook (`useDebounce`).
- **Medium**: Protected Route Wrapper with JWT Expiration Check.
- **Hard**: Infinite Scroll Data Loader with Intersection Observer.

### Mini Project
- **Level 8 Real-World App**: **Full-Stack Developer Community Q&A Platform**
- React frontend connected to a Fastify/Node backend: user registration, question posting, markdown code snippet rendering, upvoting, and commenting.

---

## Level 9: Real-Time WebSockets & Enterprise Backend
- **Difficulty**: Professional
- **Estimated Completion Time**: 18 Hours
- **Skills Unlocked**: WebSockets (`ws` / Socket.IO), Redis In-Memory Caching, Background Job Queues (BullMQ), Rate Limiting, OWASP security (Helmet, CORS, CSRF, XSS sanitization), Testing with Vitest & Supertest.

### Key Concepts & Exercises
- Full-duplex WebSocket communication vs HTTP polling.
- Redis caching strategies (Cache-Aside, Write-Through, TTL invalidation).
- Integration testing REST endpoints with mock databases.

### Coding Challenges
- **Easy**: WebSocket Heartbeat / Ping-Pong Keepalive Handler.
- **Medium**: Redis Sliding Window Rate Limiter Middleware.
- **Hard**: Distributed Background Task Worker with BullMQ.

### Mini Project
- **Level 9 Production Project**: **Real-Time Collaborative Code Whiteboard & Chat**
- Production-style full-stack application supporting real-time multi-user document edits via WebSockets, persistent chat rooms, Redis cache, and full unit test coverage.

---

## Level 10: Production Engineering & Capstone
- **Difficulty**: Capstone / Professional
- **Estimated Completion Time**: 22 Hours
- **Skills Unlocked**: TypeScript in full-stack JS, Monorepo architecture (Turborepo), Docker multi-stage containers, GitHub Actions CI/CD pipelines, Sentry observability, Performance audits (Lighthouse).

### Key Concepts & Exercises
- Type safety across full-stack boundaries (shared DTO schemas).
- Building automated CI/CD test and lint pipelines.
- Production container optimization: Alpine Node images, non-root user security.

### Level 10 Capstone Project
- **Production Capstone**: **Scalable Real-Time Collaborative Cloud Workspace Engine**
  - **Scope**: Enterprise-grade cloud IDE and workspace collaboration platform inspired by Figma / CodeSandbox.
  - **Key Features**:
    - Real-time cursor presence and collaborative editor synchronization via WebSockets.
    - Sandboxed server-side code execution runner with concurrency throttling.
    - Role-based team permissions and organization workspaces.
    - Production Docker deployment with automated GitHub Actions CI/CD test pipeline.
