# Remaining Risks, Limitations & Decisions Pending

**Platform:** Code Circle ⭕  
**Branch:** `audit/production-hardening`  
**Date:** November 2026  
**Status:** Post-Hardening Production Readiness Analysis  

---

## 1. Important Notice on Security Guarantees
In accordance with professional engineering ethics and audit standards: **No software system can ever be declared completely secure or vulnerability-free.** This audit resolved critical and high-priority risks that were verified directly on this branch. The items below represent accepted trade-offs, architecture limitations, and areas requiring business or infrastructure decisions before production scale-out.

---

## 2. Items Requiring Product Owner / Stakeholder Decision

### 2.1 Self-Service Assessment Reappearance (`DELETE /api/assessments/:id/my-submission`)
- **Current Behavior:** A student who fails or leaves an assessment can call `DELETE /api/assessments/:id/my-submission` or `POST /api/assessments/:id/reappear` to wipe their attempt record and retake the test.
- **Academic Integrity Risk:** Students can take a test, inspect all questions, wipe their submission, and retake it with known answers.
- **Architectural Conflict:** The codebase already includes an administrative reappearance endpoint (`POST /api/assessments/:id/reappear/:studentId`) intended for faculty-governed re-examination.
- **Decision Needed:** Should self-service wipe be disabled for formal exams and limited strictly to practice quizzes, or should test retakes always require faculty approval?
- **Status:** **NOT MODIFIED (Awaiting Decision)** — Preserved existing endpoint per safety rules ("STOP AND ASK ME BEFORE removing any feature or endpoint").

### 2.2 SheetJS (`xlsx`) Library Vulnerabilities
- **Vulnerabilities:**
  - `GHSA-4r6h-8v6p-xvw6` (Prototype Pollution in SheetJS)
  - `GHSA-5pgg-2g8v-p4x9` (SheetJS Regular Expression Denial of Service)
- **Current State:** `npm audit` reports these advisories with no automated fix available in the legacy SheetJS line.
- **Mitigation in Place:** In `userManagementController.ts`, file extensions and header boundaries are validated, and the bulk upload chunk is limited to memory buffers.
- **Decision Needed:** Migrate bulk import/export to `exceljs` or native CSV in the next sprint to eliminate `xlsx` entirely.
- **Status:** **ACCEPTED RISK / SCHEDULED FOR MIGRATION**.

### 2.3 Dependency Major Version Upgrades
- **Advisories:**
  - `@fastify/static` (Authorization bypass via non-canonical URL paths `GHSA-8pvw-jcv7-9cmj` / route guard bypass `GHSA-83w8-p2f5-377r`). Fix requires upgrading to major release v10.
  - `firebase-admin` (uuid missing buffer bounds check). Fix requires upgrading across major version.
- **Rule Boundary:** "STOP AND ASK ME BEFORE upgrading a dependency across a major version."
- **Status:** **NOT UPGRADED (Awaiting Approval)** — Documented for scheduled major release cycle.

---

## 3. Infrastructure & Operational Limitations

### 3.1 MongoDB Atlas M0 Connection Starvation
- **Constraint:** MongoDB Atlas Free Tier (M0) enforces a hard limit of 50 concurrent socket connections.
- **Platform Architecture:** Fastify is configured with `maxPoolSize: 50`.
- **Operating Risk:** While the in-memory attendance buffer (`attendanceBuffer.ts`) batches writes to avoid exceeding socket limits, concurrent assessment submissions or report exports during a college-wide event (>300 simultaneous students) could trigger connection timeouts.
- **Recommendation:** Upgrade database tier to MongoDB Atlas M10+ (dedicated cluster with 1,500 connections) prior to campus-wide exam rollouts.

### 3.2 In-Memory State Durability Across Distributed Instances
- **Current State:** Both `attendanceBuffer.ts` (active OTPs and queued records) and `concurrencyLimiter.ts` (RCE slots) store state in Node.js process memory.
- **Limitation:** If the backend is scaled horizontally to multiple container replicas (e.g. 3 Render instances), an OTP set on Node A is not automatically visible to Node B.
- **Recommendation:** Introduce a shared Redis cache (Upstash or Redis Cloud) to synchronize active OTPs and distributed rate limiting across horizontal instances.

### 3.3 Email SMTP Deliverability & Verification
- **Current State:** Password reset emails and onboarding reminders rely on Nodemailer with environment-provided SMTP credentials.
- **Operational Risk:** Free-tier SMTP accounts (Gmail App Passwords or shared relays) have daily sending limits (e.g. 500 emails/day) and may trigger spam filters for institutional student domains (`@bitsathy.ac.in`).
- **Recommendation:** Configure a verified transactional email provider (SendGrid, Postmark, or AWS SES) with SPF, DKIM, and DMARC DNS records.
