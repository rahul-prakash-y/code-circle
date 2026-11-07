# Remaining Risks, Limitations & Decisions Pending

**Platform:** Code Circle ⭕  
**Branch:** `audit/production-hardening`  
**Date:** November 2026  
**Status:** Post-Hardening Production Readiness Analysis  

---

## 1. Important Notice on Security Guarantees
In accordance with professional engineering ethics and audit standards: **No software system can ever be declared completely secure or vulnerability-free.** This audit resolved critical and high-priority risks that were verified directly on this branch. The items below represent accepted trade-offs, architecture limitations, and areas requiring business or infrastructure decisions before production scale-out.

---

## 2. Hardening Fixes Completed in this Phase

### 2.1 Self-Service Assessment Reset Hardening (RESOLVED)
- **Previous Risk:** Students could call `DELETE /api/assessments/:id/my-submission` or `POST /:id/reappear` to wipe their previous attempts on graded exams, retaking tests after learning question contents.
- **Implemented Fix:**
  - Disabled self-service reset on any graded or published assessment (`isPublished: true` or `customPoints > 0`). Non-faculty/admin users receive **HTTP 403 Forbidden** (`Self-service reset is disabled for graded assessments. Reappearance requires faculty authorization.`).
  - Hardened faculty reappearance route `POST /api/assessments/:id/reappear/:studentId` to require an explicit `reason` string (minimum 5 characters) in the request body.
  - Generates an immutable entry in the `AuditLog` collection recording `actorId`, `actorRole`, `targetId`, `reason`, and `deletedSubmissionsCount`.
- **Status:** **VERIFIED WITH ROUTE-LEVEL TESTS** in `routeLevelAuth.test.ts`.

### 2.2 SheetJS (`xlsx`) Bulk Upload Hardening & ExcelJS Migration (RESOLVED)
- **Previous Risk:** Reliance on unmaintained `xlsx` (SheetJS 0.18.5) carrying known prototype pollution (`GHSA-4r6h-8v6p-xvw6`) and ReDoS (`GHSA-5pgg-2g8v-p4x9`) vulnerabilities, with no file size or row count limits.
- **Implemented Fix:**
  - Installed and migrated bulk upload parsing to `exceljs` (`v4.4.0`) and RFC-compliant streaming CSV parsing via `backend/src/utils/safeSpreadsheetParser.ts`.
  - Enforced strict upper bounds: `MAX_SPREADSHEET_SIZE_BYTES = 5MB` and `MAX_SPREADSHEET_ROWS = 500`.
  - Uses `Object.create(null)` for all parsed spreadsheet row objects, guaranteeing immunity against prototype pollution.
  - Implemented graceful error recovery: malformed or corrupted Excel archives return a clean HTTP 400 without crashing the Node.js process.
- **Status:** **VERIFIED WITH TESTS** in `safeSpreadsheetParser.test.ts`.

### 2.3 Attendance OTP Expiration & Attempt Throttling (RESOLVED)
- **Previous Risk:** Active OTPs stayed in process memory indefinitely, and students could brute-force 4-digit OTPs without attempt tracking.
- **Implemented Fix:**
  - Upgraded `attendanceBuffer.ts` to store OTPs with an explicit TTL expiry (`expiresAt: Date.now() + ttlMinutes * 60 * 1000`, default 30 minutes). Expired OTPs return `undefined` and reject submissions.
  - Implemented per-user and per-event attempt tracking (`failedAttempts: Map<string, { attempts, lockedUntil }>`).
  - Enforced 5-strike lockout: 5 incorrect OTP attempts immediately locks the student's account for that specific event for 15 minutes.
  - Successful OTP submission automatically resets the failed attempt counter.
- **Status:** **VERIFIED WITH TESTS** in `attendanceBufferHardening.test.ts`.

### 2.4 NoSQL Operator Injection Global Sanitization (RESOLVED)
- **Previous Risk:** Passing raw request body or query objects into MongoDB filter queries allowed potential operator injection (`$ne`, `$gt`, `$where`, `$regex`).
- **Implemented Fix:**
  - Created Fastify global `preValidation` hook `sanitizeInputsHook` in `backend/src/middleware/sanitizeInput.ts` which recursively traverses `request.query`, `request.params`, and `request.body` and strips any keys starting with `$`.
  - Added strict string type checking in `authController.ts` (`register` and `login`) ensuring identifiers and passwords must be primitive strings.
- **Status:** **VERIFIED WITH TESTS** in `noSqlSanitization.test.ts`.

### 2.5 Code Execution Sandboxing, Concurrency & Legacy Deprecation (RESOLVED)
- **Previous Risk:** `judge0Provider.ts` did not explicitly enforce `enable_network: false` or memory limits; unthrottled concurrent execution allowed a single user to consume all RCE workers; legacy `submissionController.js` bypassed `RCEService`, ran un-sandboxed RapidAPI calls, and blocked on synchronous polling.
- **Implemented Fix:**
  - Hardened `judge0Provider.ts`: explicitly sets `enable_network: false`, `memory_limit: 256000` (256 MB in KB), `wall_time_limit: Math.max(cpu + 1, ceil(timeout+2s))`, and `max_file_size: 1024` (1 MB). Tested all 5 languages against live Judge0 CE (C, C++, Python, JavaScript, Java).
  - Gracefully handles HTTP 422 provider parameter validation errors without crashing.
  - Added startup semver validation on remote `/about` (verified live provider runs `1.14.0`, which is >= `1.13.1` and safe against CVE-2024-28185 / CVE-2024-28189).
  - Added batch execution (`executeBatch` via `/submissions/batch`), collapsing $N$ testcase calls into 1 POST + 1 GET polling call (70-85% provider call reduction).
  - Enforced per-user concurrency lock (max 1 active in-flight execution per user across Run and Submit, with automatic release timeout).
  - Concurrency Limiter: bounded FIFO queue (max 50, 30s wait -> HTTP 503 `Retry-After: 5`).
  - Separated rate limits: Run (2s cooldown, 20 req/2 min) vs Submit (5s cooldown, 5 req/1 min) with failure/timeout rollback.
  - Deprecated legacy `POST /api/problems/:id/submit` with HTTP 410 Gone (`ENDPOINT_DEPRECATED`) and removed direct RapidAPI execution path.
- **Status:** **VERIFIED WITH ROUTE-LEVEL TESTS** in `codeExecutionHardening.test.ts` (15/15 tests passing).

---

## 3. Items Requiring Product Owner / Architecture Approval

### 3.2 JWT_SECRET Rotation in Production & Staging
- **Audit Findings:**
  - A historical default fallback string was committed in early repository revisions of `authMiddleware.ts` and `authController.ts`.
  - While SEC-03 guarantees that the server immediately terminates with a fatal error in production if `JWT_SECRET` is unset, any historical environment deployed without setting `JWT_SECRET` may have issued tokens signed with the public fallback string.
- **Action Required:**
  - **Rotate `JWT_SECRET` immediately in production and staging environments.**
  - Generate a fresh 256-bit random key (`crypto.randomBytes(32).toString('hex')`) and update hosting environment variables (Render / Railway / Docker).

### 3.3 Dependency Major Version Upgrades
- **Advisories:**
  - `@fastify/static` (Authorization bypass via non-canonical URL paths `GHSA-8pvw-jcv7-9cmj` / route guard bypass `GHSA-83w8-p2f5-377r`). Fix requires upgrading to major release v10.
  - `firebase-admin` (uuid missing buffer bounds check). Fix requires upgrading across major version.
- **Rule Boundary:** "STOP AND ASK ME BEFORE upgrading a dependency across a major version."
- **Status:** **NOT UPGRADED (Awaiting Approval)** — Documented for scheduled major release cycle.

---

## 4. Infrastructure & Operational Constraints

### 4.1 MongoDB Atlas M0 Free Tier vs M10 Dedicated Tier
- **Measured Data (from `loadTestSimulation.ts`):**
  - 300 concurrent students taking a 30-minute exam produce an average workload of **11.83 ops/sec** (compatible with Atlas M0).
  - However, during the final exam closing window when countdown timers expire and students submit simultaneously, the workload spikes to **294.00 ops/sec** within a 5-second burst.
  - MongoDB Atlas Free Tier (M0) enforces a hard limit of **100 ops/sec** and **50 socket connections**.
- **Operational Risk:** During a campus-wide exam rollout, Atlas M0 will suffer connection pool starvation, queued queries, dropped submissions, and 504 Gateway Timeouts.
- **Action Required:** Upgrade the database cluster to **MongoDB Atlas M10+** (1,500 connections, dedicated vCPU, 1,500+ ops/sec) before holding live exams.

### 4.2 In-Memory State Durability Across Distributed Instances
- **Current State:** Both `attendanceBuffer.ts` (active OTPs and queued records) and `concurrencyLimiter.ts` (RCE slots) store state in Node.js process memory.
- **Limitation:** If the backend is scaled horizontally across multiple container replicas (e.g. 3 Render instances), an OTP cached on Instance A is not visible to Instance B.
- **Recommendation:** Introduce a shared Redis cache (Upstash or Redis Cloud) to synchronize active OTPs and distributed rate limiting across horizontal instances.

---

## 5. Items Marked as UNVERIFIED

In strict adherence to audit integrity and pair-programming rules:

1. **Automated Axe-Core DOM Runtime Scans: UNVERIFIED**  
   While keyboard navigation, focus-visible outlines (`*:focus-visible`), and ARIA labels were verified in code walkthroughs, automated headless browser DOM execution (via Puppeteer/Playwright with axe-core) was not run across all application pages due to lack of a headless browser runtime in the current environment.

2. **Physical Network Concurrency Under 300 Real Browsers: UNVERIFIED**  
   While database operations and burst throughput were mathematically modeled and verified via `loadTestSimulation.ts`, a physical load test transmitting 300 simultaneous WebSocket/HTTP streams over real-world campus Wi-Fi infrastructure was not executed per safety rules ("Never run intrusive or load tests against production or third-party services").

3. **External Piston / Judge0 Upstream Rate Limits: UNVERIFIED**  
   Under a college-wide coding contest with >100 simultaneous code runs, the public Emkc Piston API or RapidAPI Judge0 endpoint may enforce upstream IP rate limits or experience queued execution delays. A self-hosted Piston or Judge0 instance on a dedicated staging VPC is recommended for large contests.
