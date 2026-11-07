# Live Exam Day Operational Checklist & Runbook

**Platform:** Code Circle ⭕  
**Branch:** `audit/production-hardening`  
**Target Infrastructure:** Vercel (Frontend), 3x Render Free Tier (Backend), MongoDB Atlas M0 (Free Tier Database), Judge0 CE  
**Capacity Envelope:** Up to 300 Simultaneous Candidates, 60-Minute Exam Window  

---

## 1. Pre-Exam Preparation (T-60 to T-15 Minutes)

- [ ] **1.1 Deploy Freeze Enforcement**
  - Absolute code freeze across `main` and production environments.
  - No pull requests, package updates, or configuration changes may be merged within 2 hours of exam start.
  - Disable automatic Render branch deployments during the exam duration.

- [ ] **1.2 Pre-Warm All 3 Render Backend Instances**
  - Render free tier instances spin down after 15 minutes of inactivity (taking 50-90s to spin up on cold start).
  - Verify UptimeRobot pings are actively hitting `/api/health` across all 3 nodes:
    - Node 1: `https://<render-node-1-url>/api/health`
    - Node 2: `https://<render-node-2-url>/api/health`
    - Node 3: `https://<render-node-3-url>/api/health`
  - Send test HTTP GET requests to each node 15 minutes before students log in to ensure warm memory state.

- [ ] **1.3 Database Connection & Quota Verification**
  - Log in to MongoDB Atlas Console:
    - Verify cluster status is **HEALTHY** (Atlas M0 limit: 100 ops/sec, 50 socket connections).
    - Ensure active connection count is `< 15` before candidate ingress.
  - Verify compound unique index `{ user: 1, assessment: 1, submissionId: 1 }` exists on `assessmentsubmissions` collection.

- [ ] **1.4 Assessment Configuration Audit**
  - Navigate to Assessment Settings in Faculty Dashboard:
    - **`serverCheckpointIntervalSeconds`**: Set to `0` (default: off). Server-side autosave is removed from client by default to prevent write saturation; students use client-side IndexedDB persistence.
    - **`submissionGraceWindowSeconds`**: Configured to `120` (default: 120s grace period). Late submissions inside 120s are accepted and flagged `late` for faculty review; submissions after 120s are rejected (`DEADLINE_EXCEEDED`).
    - **`deadline`**: Set exact official end time. Server enforces deadline using UTC clock (`Date.now()`); client device clocks are never trusted.

---

## 2. Live Exam Monitoring (T-0 to T+60 Minutes)

- [ ] **2.1 Admin Submission Queue Panel Monitoring**
  - Log in as Faculty/Admin and open the **Submission Queue Panel** at the top of the `/assessments` page.
  - The dashboard auto-polls every 3 seconds, monitoring:
    - `Node ID`: Identifies which of the 3 Render instances is responding.
    - `Pending in Queue`: Number of submissions currently waiting in memory for the 1s flusher.
    - `Oldest Pending Age`: Elapsed time of oldest item waiting in memory (should remain `< 5s`).
    - `Failed Queue Count`: Submissions that encountered write errors (target: 0).
    - `Last Successful Flush`: Timestamp of most recent batch write to MongoDB.

- [ ] **2.2 In-Flight Warning Banner Awareness**
  - If `pendingCount > 0`, the dashboard displays a prominent Amber Warning Banner:
    > `⚠️ WARNING: [N] submission(s) pending durable write in memory. Do not end exam or deploy!`
  - Ensure all proctors and administrators observe this banner and do not restart servers while pending items exist.

- [ ] **2.3 Client-Side Storage Verification**
  - Student browsers automatically save every code keystroke and MCQ option selection to local **IndexedDB** (fallback `localStorage`).
  - Advise students:
    - Refreshing the page or accidental browser close will safely restore all answers from local IndexedDB.
    - Browser cache/storage is only cleared **after** receiving `status: 'saved'` from the backend.

---

## 3. Post-Exam Window & Closing Procedures (T+60 to T+75 Minutes)

- [ ] **3.1 MANDATORY: Verify Pending Count = 0 on ALL Nodes Before Ending Exam**
  - When the deadline expires, up to 300 students submit their final exams simultaneously.
  - The bounded in-memory flusher processes up to 60 doc writes/sec (draining 300 submissions across ~5 seconds).
  - **CRITICAL STEP:** **DO NOT** end the assessment or terminate exam sessions until the Submission Queue Panel confirms:
    - **`Pending in Queue: 0`**
    - **`Warning Banner: Cleared (Normal State)`**
  - If running across multiple Render nodes, check the panel through each node endpoint or wait at least 30 seconds after the final student submits to guarantee all background flush intervals have settled.

- [ ] **3.2 Handle Failed Submissions (If Any)**
  - If `Failed Queue Count > 0`:
    1. Inspect the error messages in the Failed Items viewer.
    2. Click the **"Retry Failed"** button.
    3. The failed items will re-enter the pending queue and flush to MongoDB automatically.
    4. Verify `Failed Queue Count` drops back to 0.

- [ ] **3.3 Manual Flush Verification**
  - If any items remain pending after 10 seconds, click **"Flush Now"** to immediately trigger an out-of-band bulk write batch to MongoDB.
  - The flusher is completely idempotent: multiple clicks create zero duplicate documents in the database.

- [ ] **3.4 MANDATORY: Click "Download Backup" Before Any Deploy or Server Restart**
  - **CRITICAL PROTOCOL:** Before restarting any Render instance, updating environment variables, or triggering a new deployment:
    1. Click the **"Download Backup"** button on the Submission Queue Panel.
    2. Save the generated `queue-backup-<nodeId>-<timestamp>.json` file to local faculty storage.
    3. This file contains a complete JSON snapshot of all pending submissions, answers, scores, and evaluation results held in process memory.
    4. Repeat this step for each active backend node if instances are managed individually.

- [ ] **3.5 Review Late Submissions**
  - Submissions submitted within the 120-second grace window are marked with `isLate: true` and `submissionStatus: 'late'`.
  - Faculty review committee may filter submissions by `submissionStatus === 'late'` to approve or penalize late submissions based on institutional policy.

---

## 4. Emergency Incident Runbook

| Incident | Root Cause | Immediate Action |
| :--- | :--- | :--- |
| **Node Crashes During Submission** | Memory spike or Render free tier timeout | **Client Auto-Recovery:** The student's browser holds all answers and UUID `submissionId` in IndexedDB. When connection resumes or student reloads, client auto-retries. MongoDB unique compound index `{ user, assessment, submissionId }` guarantees exactly 1 stored document without duplicate scoring. |
| **Queue Overflow (HTTP 503)** | Burst exceeds 1,000 pending items | **Backpressure Engaged:** Server returns `503 Service Unavailable` with `Retry-After: 2`. Student UI automatically displays a countdown toast and retries after 2 seconds. Faculty clicks **"Flush Now"** to immediately relieve memory pressure. |
| **MongoDB Atlas Free Tier Throttling** | Atlas M0 exceeds 100 ops/sec | The flusher is hard-capped at **60 doc writes/sec**, preventing Atlas quota breach. If an external query spike occurs, flusher places transient failures into `failedQueue`. Once DB recovers, click **"Retry Failed"**. |
| **Student Lost Internet at Deadline** | Local Wi-Fi disconnect | Answers remain safe in student's browser IndexedDB. Instruct student **NOT to clear browser cookies/history**. Once internet reconnects, opening the exam page allows them to submit or export local answers. |

---

## 5. Verification Sign-Off

| Milestone | Verified By | Timestamp | Status |
| :--- | :--- | :--- | :--- |
| Pre-Warm All 3 Render Instances | Proctors | T-15m | `[ ] PASS` |
| Atlas M0 Connections Healthy (<15) | Faculty Admin | T-10m | `[ ] PASS` |
| Exam Deadline Triggered | Server Clock | T+60m | `[ ] PASS` |
| **Queue Pending Count = 0 Verified** | Faculty Admin | T+62m | `[ ] PASS` |
| **"Download Backup" Exported to Disk** | Faculty Admin | T+65m | `[ ] PASS` |
| Assessment Concluded | Faculty Lead | T+75m | `[ ] COMPLETE` |
