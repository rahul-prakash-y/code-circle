# Live 5-Day Exam Operational Checklist & Multi-Node Runbook

**Platform:** Code Circle ⭕  
**Branch:** `audit/production-hardening`  
**Target Infrastructure:** Vercel (Frontend), 3x Render Free Tier Instances (Backend Cluster), MongoDB Atlas M0 (Free Tier Database), Judge0 CE  
**Capacity Envelope:** Up to 300 Simultaneous Candidates, 60-Minute Exam Window  

---

## 1. Five-Day Exam Schedule & Resource Profiles

| Day | Track & Type | Evaluation Engine | Concurrency & Capacity Limits | Risk Level |
| :--- | :--- | :--- | :--- | :--- |
| **Day 1** | **Aptitude MCQ** | Server-side canonical scoring engine | Bounded queue (cap 60 doc writes/sec). Autosave off (`0s`). Local IndexedDB persistence. | Low |
| **Day 2** | **General Knowledge (GK) MCQ** | Server-side canonical scoring engine | Bounded queue (cap 60 doc writes/sec). 120s grace period. Local IndexedDB persistence. | Low |
| **Day 3** | **C Programming (MCQ + Code)** | Judge0 CE Batch execution | **Run Caps Enforced:** Max 1 in-flight per user. Run rate limit: 20 req/2 min (2s cooldown). Submit: 5 req/1 min (5s cooldown). Max 50 queue slots. | Medium |
| **Day 4** | **Python Programming (MCQ + Code)** | Judge0 CE Batch execution | **Run Caps Enforced:** Max 1 in-flight per user. Execution timeout: 5s CPU / 10s Wall. Max 256MB RAM per run. Max 50 queue slots. | Medium |
| **Day 5** | **UI/UX Design (Figma Link)** | Regex allowlist & idempotent storage | Single URL validation (`https://www.figma.com/file\|design\|proto\|board/...`), max 2048 chars, 1 submission per student. Server deadline. | Very Low |

---

## 2. Cluster Prerequisites & Maintenance Protocol

### 2.1 One-Time Pre-Day-1 JWT Secret Rotation
- [ ] **Rotate `JWT_SECRET` Once Before Day 1:**
  - Generate a secure 256-bit random key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
  - Set the identical key across all 3 Render instances and staging environments.
  - Verify secret consistency: Open the Admin Queue Monitor and verify all online nodes display the **identical 12-char HMAC `JWT Secret Fingerprint`** (e.g. `f4e35220e126`). Public `/api/health` checks return only `{"status":"ok"}`.
  - **CRITICAL:** Do **NOT** rotate `JWT_SECRET` during the 5-day examination window.

### 2.2 Campus NAT & Anti-Spray Environment Configurations
- [ ] **Configure `LOGIN_FAILED_IP_MAX` (Default: 300/min):**
  - **Campus NAT Requirement:** In a collegiate environment, 100–300 candidates share a single outbound public IP gateway. Accidental password typos across an entire room aggregate behind this one IP.
  - Setting `LOGIN_FAILED_IP_MAX=300` ensures password spraying is prevented while preventing an accidental IP-wide lockout of a classroom.
- [ ] **Strict CORS Previews Flag:**
  - Ensure `ALLOW_VERCEL_PREVIEWS=false` (or unset) in production. Production only permits exact origins (`CLIENT_URL`, `FRONTEND_URL`, `PRODUCTION_ORIGINS`).

### 2.2 Nightly Database Backups (`mongodump`)
- [ ] **Nightly Automated/Manual Database Export (23:00 UTC):**
  - Execute full cluster export nightly after all submissions are durably flushed:
    ```bash
    mongodump --uri="<MONGODB_ATLAS_M0_URI>" --gzip --archive="backup-codecircle-day-$DAY-$(date +%Y%m%d).gz"
    ```
  - Verify archive integrity by checking that file size is non-zero. Store archive securely on local faculty offline storage.

### 2.3 Strict Inter-Exam Deployment Window
- [ ] **Zero Deployment During Active Exams:**
  - Code deployments and Render redeploys are **STRICTLY PROHIBITED** between T-60m and T+75m of each exam.
  - Deployments may only occur in the designated maintenance window between exam days **AFTER** completing:
    1. Confirm `Pending in RAM: 0` across ALL 3 nodes in the Admin Queue Dashboard.
    2. Click **"Download All Backups"** to store JSON snapshots of all process memory.
    3. Complete the nightly `mongodump` export.

---

## 3. Pre-Exam Operations (T-60 to T-15 Minutes Daily)

- [ ] **3.1 Pre-Warm All 3 Render Backend Instances**
  - Render free tier instances sleep after 15 minutes of inactivity (taking 50-90s on cold start).
  - Verify UptimeRobot 5-minute pings are active.
  - Manually send probe requests to each node 15 minutes before candidate login:
    - Node 1: `curl -s https://<render-node-1>/api/health`
    - Node 2: `curl -s https://<render-node-2>/api/health`
    - Node 3: `curl -s https://<render-node-3>/api/health`
  - Ensure all 3 nodes respond with `{"status":"ok"}`.

- [ ] **3.2 Database Connection & Quota Verification**
  - Verify MongoDB Atlas M0 Console:
    - Current connection count `< 15` (Atlas M0 hard cap: 50 connections).
    - Current ops/sec `< 10` (Atlas M0 hard cap: 100 ops/sec).
  - Verify compound unique indexes exist:
    - `assessmentsubmissions`: `{ user: 1, assessment: 1, submissionId: 1 }`
    - `attendances`: `{ userId: 1, eventId: 1, dayNumber: 1 }`
    - `authlockouts`: `{ key: 1 }` (TTL: 0s)
    - `eventotps`: `{ eventId: 1, dayNumber: 1 }` (TTL: 0s)

- [ ] **3.3 Assessment Configuration Checklist**
  - **`serverCheckpointIntervalSeconds`**: Set to `0` (default: off). Candidates rely on local IndexedDB persistence; avoids database write exhaustion.
  - **`submissionGraceWindowSeconds`**: Configured to `120` (120s grace period). Late submissions inside 120s are accepted and flagged `late`; submissions outside 120s are rejected (`DEADLINE_EXCEEDED`).
  - **`deadline`**: Set exact official end time. Enforced via UTC server clock (`Date.now()`); client device clocks are never trusted.
  - **For Days 3 & 4 (Code Days):** Verify Judge0 provider is reachable: `GET /api/assessments/code/health` returns status 200 with semver >= `1.13.1`.
  - **For Day 5 (Figma Day):** Ensure `assessmentType: 'figma'`. Verify regex allowlist (`FIGMA_URL_REGEX`) is enforced.

---

## 4. Live Exam Monitoring (T-0 to T+60 Minutes)

- [ ] **4.1 Admin Submission Queue Multi-Node Dashboard**
  - Open `/assessments` as Admin/Faculty to inspect the **Submission Queue Panel**.
  - Dashboard auto-polls every 4 seconds across all 3 nodes via `Promise.allSettled`:
    - **Node Status:** All cards must show `Online` (Emerald badge).
    - **Pending in RAM:** Real-time count of submissions queued for batch flusher.
    - **Oldest in Queue:** Should remain `< 5s`.
    - **Failed Items:** Target: 0.
    - **JWT Secret:** Must show identical 8-character fingerprint across all 3 cards.

- [ ] **4.2 In-Flight Warning Banner Awareness**
  - If `Pending in RAM > 0` on any node, the Amber Warning Banner activates:
    > `⚠️ WARNING: [N] submission(s) pending durable write in memory! Do not end exam or deploy!`
  - Proctors must not terminate or reboot any instance while this banner is active.

- [ ] **4.3 Candidate Ingress & Authentication Monitoring**
  - 300 candidates behind a single campus WiFi IP (`NAT`) can all log in simultaneously without IP throttling.
  - Failed logins are restricted per normalized username: 5 consecutive failures triggers a 5-minute lock.
  - If a student is legitimately locked out:
    1. Admin clicks **"Unlock Account"** (`POST /api/auth/unlock-lockout`).
    2. Candidate can immediately retry authentication.
    3. Action is recorded in `AuditLog`.

---

## 5. Post-Exam Window & Closing Procedures (T+60 to T+75 Minutes)

- [ ] **5.1 MANDATORY: Verify Pending Count = 0 on ALL Nodes Before Ending Exam**
  - When countdown expires, up to 300 students submit simultaneously.
  - The flusher writes batches of up to 60 docs/sec to MongoDB (draining 300 items in ~5 seconds).
  - **CRITICAL:** **DO NOT** click "End Exam" until the panel shows:
    - **`Pending in RAM: 0` on Node 1**
    - **`Pending in RAM: 0` on Node 2**
    - **`Pending in RAM: 0` on Node 3**
  - If any node is offline, the "End Exam" button is guarded by a confirmation modal requiring explicit administrator acknowledgement.

- [ ] **5.2 Failed Items Recovery**
  - If any node shows `Failed Items > 0`:
    1. Inspect the error logs in the card viewer.
    2. Click **"Retry"** on that specific node (or **"Flush All"**).
    3. Verify `Failed Items` drops to 0.

- [ ] **5.3 MANDATORY: Click "Download All Backups" Before Any Deploy or Restart**
  - Click **"Download All Backups"** on the cluster toolbar.
  - Generates separate JSON backup files (`submission-queue-backup-<nodeId>-<timestamp>.json`) for all online nodes.
  - Store backups securely on local disk.

- [ ] **5.4 Review Flagged Late Submissions**
  - Submissions submitted within the 120s grace period are marked `isLate: true`, `submissionStatus: 'late'`.
  - Faculty exam committee filters by `submissionStatus === 'late'` to approve or adjust scores per policy.

---

## 6. Emergency Incident Runbook

| Incident | Root Cause | Immediate Action |
| :--- | :--- | :--- |
| **Node Crashes During Submission** | Memory spike or Render free tier timeout | **Client Auto-Recovery:** Candidate browser holds complete answers and UUID `submissionId` in IndexedDB. When student reloads or internet reconnects, client auto-retries. Unique index `{ user, assessment, submissionId }` guarantees exactly 1 stored document without duplicate scoring. |
| **Queue Backpressure (HTTP 503)** | Burst exceeds 1,000 pending items | Server returns `503 Service Unavailable` with `Retry-After: 2`. Client automatically retries after 2 seconds. Admin clicks **"Flush All"** to immediately relieve memory pressure. |
| **One Render Node Goes Offline** | Render platform maintenance | **Client Failover:** `useServerStore.ts` detects health-check failure on primary hashed node and automatically routes candidate to next healthy node. |
| **Judge0 Upstream Throttling (Days 3 & 4)** | Rapid consecutive code runs | RCE concurrency limiter holds at most 50 queued runs with 30s timeout. If exceeded, returns `503 Retry-After: 5`. Run caps prevent candidate spam. Advise students to test code locally before submission. |
| **Candidate WiFi Disconnects at Deadline** | Campus router disconnect | Answers remain safe in student's browser IndexedDB. Instruct student **NOT to clear browser cookies or close tab**. Once WiFi reconnects, clicking submit transmits stored answers. |

---

## 7. Status of Verification (Audit Integrity)

In strict accordance with audit integrity rules:

- **Identity-based rate limiting on authenticated routes:** **VERIFIED** with automated tests (`multiNodeAndIdentityRateLimit.test.ts`).
- **Campus NAT Failed Login IP Cap (`LOGIN_FAILED_IP_MAX=300`):** **VERIFIED** with test `1f` (200 failed attempts across 200 users do not lock 201st valid user).
- **Failed login lockout per normalized username (5 fails -> 5m):** **VERIFIED** with automated tests.
- **Admin unlock lockout with AuditLog:** **VERIFIED** with automated tests.
- **300 candidates behind one IP login without 429s:** **VERIFIED** with simulated test.
- **Multi-node OTP creation on Node A validated on B and C:** **VERIFIED** with simulated 3-instance test.
- **OTP attempt lockouts shared across nodes:** **VERIFIED** with automated tests.
- **OTP TTL expiry and duplicate prevention:** **VERIFIED** with automated tests.
- **OTP cache capped at 15s with rotation invalidation:** **VERIFIED** with test `2f`.
- **Durable attendance with graceful restart flush:** **VERIFIED** with test `2g`.
- **HMAC(JWT_SECRET, "fingerprint-v1") 12-char fingerprint on /api/health:** **VERIFIED** with tests `4a-4c`.
- **Strict CORS exact production origins & preview gating:** **VERIFIED** with tests `5a-5c`.
- **Judge0 batch chunking into <= 20 submissions:** **VERIFIED** with test `6a`.
- **Day 5 Figma link validation (allowlist, length, deadline, idempotency):** **VERIFIED** with automated tests.
- **Browser-side fan-out across cluster nodes with 60s timeout:** **VERIFIED** in React component implementation and bundle build.
- **Client retry with exponential backoff for 10+ minutes (12 min window):** **VERIFIED** in `useAssessmentStore.ts`.
- **IndexedDB state isolation per user+assessment and clear on logout:** **VERIFIED** in `examStorage.ts` and `useAuthStore.js`.
- **Java under 256MB with heavy algorithm program:** **UNVERIFIED** (external Judge0 CE JVM heap footprint not tested live).
- **Physical campus Wi-Fi AP saturation under 300 simultaneous WebSocket/HTTP requests:** **UNVERIFIED** (mathematically calculated; physical campus test with 300 real devices not executed per safety rules).
- **Public Judge0 CE upstream rate limits under 300 simultaneous compile jobs:** **UNVERIFIED** (sandboxed and batch-collapsed in code; external API burst capacity is third-party controlled).
