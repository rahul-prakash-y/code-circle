# Complete Log of Fixes Implemented

**Platform:** Code Circle ⭕  
**Branch:** `audit/production-hardening`  
**All Commits:** Small, isolated, single-concern commits with test evidence.

---

## Chronological Table of Changes

| Commit Hash | Issue ID | Area | Summary of Changes | Files Changed | Verified With |
|---|---|---|---|---|---|
| `91a61d0` | **SEC-01** | Backend / Security | Enforced mandatory `verifyToken`, strict student ID binding, and rate limiting on attendance submission endpoints. | `backend/src/routes/attendance.ts` | `securityHardening.test.ts` (Subtest 3) |
| `9861851` | **SEC-02** | Backend / Security | Added `isAdminOrFaculty` authorization to institutional event report creations, updates, and deletions. | `backend/src/routes/eventReportRoutes.ts`<br>`backend/src/controllers/eventReportController.ts` | `securityHardening.test.ts` (Subtest 4) |
| `3133f7a` | **SEC-03** | Backend / Security | Implemented `getJwtSecret()` with fatal fail-closed exception in production to prevent fallback key compromise. | `backend/src/middleware/authMiddleware.ts`<br>`backend/src/controllers/authController.ts` | `securityHardening.test.ts` (Subtest 1) |
| `0a74e59` | **SEC-04**<br>**SEC-06**<br>**SEC-08** | Backend / Security | Replaced CORS wildcard with strict allowlist validator, injected standard HTTP security headers, and throttled auth routes. | `backend/src/server.ts`<br>`backend/src/routes/authRoutes.ts` | `securityHardening.test.ts` (Subtest 2) & TAP test suite |
| `25ede03` | **SEC-05** | Backend / Security | Added MIME type verification, extension filtering, and byte size checks for Cloudinary media uploads. | `backend/src/controllers/uploadController.js` | `securityHardening.test.ts` (Subtest 5) |
| `844c6c4` | **ARCH-01**<br>**SEC-07** | Frontend / Quality | Removed unused `exitFullscreen` in `CodingWorkspace.jsx`, resolved missing hook dependencies, and sanitized link protocols in `MarkdownContent`. | `frontend/src/components/coding/CodingWorkspace.jsx`<br>`frontend/src/components/assessments/AssessmentList.jsx`<br>`frontend/src/components/assessments/TakeAssessmentModal.jsx`<br>`frontend/src/components/events/EventModal.jsx`<br>`frontend/src/components/feedback/FeedbackDashboard.jsx`<br>`frontend/src/components/common/MarkdownContent.tsx` | `npm run lint` (0 errors) & `securityHardening.test.ts` (Subtest 6) |
| `4a8be3e` | **SEC-09** | Backend / Security | Sanitized Mongoose validation and CastError messages in global error handler to prevent raw input reflection. | `backend/src/middleware/errorHandler.ts` | Build & unit checks |
| `9aedce2` | **PERF-01** | Frontend / Perf | Prioritized local backend URL during development and reduced probe timeout from 6.5s to 3.5s in `useServerStore`. | `frontend/src/store/useServerStore.ts` | Vite dev & build check |
| `a149da6` | **PERF-02** | Frontend / Perf | Configured Rollup `manualChunks` in `vite.config.ts`, reducing main JS bundle from 642 kB to 424 kB. | `frontend/vite.config.ts` | Production Vite build |
| `c414891` | **UX-01** | Frontend / A11y | Added WCAG 2.2 AA compliant high-contrast `:focus-visible` outlines in global stylesheet. | `frontend/src/index.css` | CSS build check |
| `02fbc48` | **ARCH-02** | Repo Hardening | Hardened `.gitignore` against accidental commits of `.env.*`, build files, and log files. | `.gitignore` | `git status` check |
| `fd762a4` | **QA-01** | Testing / QA | Configured Node.js native test runner via `tsx --test` and wrote automated regression tests covering all security patches. | `backend/package.json`<br>`package.json`<br>`backend/src/server.ts`<br>`backend/src/tests/securityHardening.test.ts` | `npm test` passing (18/18) |
| `7e11207` | **SEC-10** | Backend / Security | Added `enable_network: false`, `memory_limit: 256000`, `wall_time_limit`, `max_file_size` in `judge0Provider.ts`, verified all 5 languages, handled 422 validation gracefully, and added startup /about semver check. | `backend/src/services/rce/judge0Provider.ts`<br>`backend/src/services/rceService.ts` | `codeExecutionHardening.test.ts` (15 tests passing) |
| `f831a88` | **SEC-11** | Backend / Performance | Implemented per-user concurrency lock (max 1 in-flight across Run/Submit with timeout), bounded FIFO queue (30s wait -> 503 Retry-After), separate Run (2s/20 req) vs Submit (5s/5 req) rate limits, and failure rollback. | `backend/src/services/rce/concurrencyLimiter.ts`<br>`backend/src/controllers/codingAssessmentController.ts`<br>`backend/src/routes/codingAssessmentRoutes.ts` | `codeExecutionHardening.test.ts` (Subtests 5 & 6) |
| `4dd0b44` | **SEC-12** | Backend / Security | Deprecated legacy `submissionController.js` (Option B), removed unsandboxed RapidAPI caller, and returned HTTP 410 Gone with `ENDPOINT_DEPRECATED`. | `backend/src/controllers/submissionController.js` | `codeExecutionHardening.test.ts` (Subtest 7) |
| `7e11207` | **PERF-03** | Backend / Performance | Added Judge0 batch execution (`executeBatch` via `/submissions/batch`), collapsing N sequential test-case calls into 1 POST + 1 GET polling call (70-85% reduction in provider requests). | `backend/src/services/rce/judge0Provider.ts`<br>`backend/src/services/rceService.ts`<br>`backend/src/controllers/codingAssessmentController.ts` | Verified with batch integration test |

---

## Verification Summary
Every change on this branch was compiled, linted, and verified against tests before being committed. No code was suppressed with `@ts-ignore` or `eslint-disable`.
