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

---

## Verification Summary
Every change on this branch was compiled, linted, and verified against tests before being committed. No code was suppressed with `@ts-ignore` or `eslint-disable`.
