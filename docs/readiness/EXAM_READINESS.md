# System Architecture & Exam Readiness Verdict

**Platform:** Code Circle ⭕  
**Target Environment:** 3x Render Free Instances (512MB RAM, 0.1 CPU, UptimeRobot Ping), MongoDB Atlas M0 (Free Tier, 100 ops/sec cap, 50-socket connection limit), Judge0 CE External API, Vercel Frontend.  
**Branch:** `audit/production-hardening`  
**Date:** November 2026  
**Auditor:** Senior Infrastructure, Security & Reliability Engineering  

---

## 🚦 VERDICT: CONDITIONAL GO

The platform is **CONDITIONAL GO** for live examination delivery, strictly subject to:
1. **Slot Sizing:** Maximum **100 to 150 concurrent candidates per slot** (or 300 candidates split into two staggered batches of 150).
2. **Rehearsal Gate:** Passing the staging dry-run thresholds specified in [`REHEARSAL_RESULTS.md`](./REHEARSAL_RESULTS.md) with 20–30 test users.
3. **Execution Freeze:** No production code or configuration deployments during active exam windows. Deploys permitted only between exam days after confirming `pending = 0` on all cluster nodes and exporting JSON queue backups.

---

## 📊 Capacity Calculation & Resource Budget

### 1. MongoDB Atlas M0 (Free Tier) Boundaries
- **Atlas M0 Hard Throughput Cap:** **100 operations/sec** (combined reads + writes across all collections).
- **Socket Connection Limit:** **50 concurrent TCP connections** (hard cap before connection queuing/rejection).
- **Storage Limit:** **512 MB** total data + indexes.

### 2. Peak Operations/Sec Breakdown (Per 100 vs 300 Candidates)

| Event / Phase | Operation Type | Calculation (100 Students) | Calculation (300 Students Burst) | Atlas M0 Status |
|---|---|---|---|---|
| **Login Burst (over 60s)** | Read (User) + Read (Lockout) + Write (Session) + Write (Lockout) = 4 ops/student | $\frac{100 \times 4}{60} = \mathbf{6.7\text{ ops/s}}$ | $\frac{300 \times 4}{30} = \mathbf{40.0\text{ ops/s}}$ | ✅ Safe (< 100 ops/s) |
| **Session Validation** | In-memory cache (`userSessionCache`, 15s TTL). 1 read per 15s per student | $\frac{100}{15} = \mathbf{6.7\text{ ops/s}}$ | $\frac{300}{15} = \mathbf{20.0\text{ ops/s}}$ | ✅ Safe |
| **Question Autosave** | Local IndexedDB persistence on client; `serverCheckpointIntervalSeconds: 0` (OFF) | $\mathbf{0\text{ ops/s}}$ | $\mathbf{0\text{ ops/s}}$ | ✅ Safe (0 DB load) |
| **Attendance OTP Submit** | In-memory cache check, 1 lockout check, 1 durable write | $\frac{100 \times 2}{120} = \mathbf{1.7\text{ ops/s}}$ | $\frac{300 \times 2}{60} = \mathbf{10.0\text{ ops/s}}$ | ✅ Safe |
| **Deadline Submission Burst** | Capped by `SUBMISSION_FLUSH_CAP` (`SubmissionQueueService` batch flush) | Capped at $\mathbf{60\text{ writes/s}}$ max | Capped at $\mathbf{60\text{ writes/s}}$ max | ✅ Safe |
| **Simultaneous Peak Total** | Flusher Writes (60) + Cached Session Reads (6.7) + Polling (5) | $\mathbf{71.7\text{ ops/s}}$ | $\mathbf{85.0\text{ ops/s}}$ (Peak up to $95$) | ⚠️ **300 students leaves < 5% margin** |

> [!IMPORTANT]
> **Why 100–150 Candidates Per Slot?**  
> At 100 candidates, maximum concurrent throughput peaks at **~72 ops/sec**, reserving a **28% safety cushion** beneath the Atlas M0 100 ops/sec hard ceiling. At 300 simultaneous candidates, any accidental un-cached read spike pushes Atlas M0 into throttling (`429 / Atlas M0 saturation`), which increases latency and queues writes. Therefore, **100–150 students per slot is mathematically safe**.

### 3. Backend Render Instance Resources (3x Nodes)
- **RAM:** 512 MB per node.
  - Node process baseline: ~75 MB.
  - Submission Queue (1,000 items in memory): ~2.5 MB.
  - User session cache & OTP buffer: ~1.2 MB.
  - Max heap memory footprint under load: ~180 MB (< 35% of 512MB limit).
- **CPU:** 0.1 vCPU.
  - Node.js event loop remains unblocked because password hashing (`bcrypt`) is rate limited, and code execution is offloaded externally to Judge0.
- **Failover & Connection Sockets:**
  - Fastify Mongoose connection pool: configured at `maxPoolSize: 10` per node.
  - 3 nodes $\times 10 = 30$ active sockets $\le 50$ Atlas M0 connection limit.

---

## 📋 Comprehensive Readiness Scorecard

| Area | Status | Evidence / Implementation |
|---|---|---|
| **Authentication & Login Burst** | **PASS** | Identity-based rate limiting on preHandler (`user:${id}`); `LOGIN_FAILED_IP_MAX` default 300/min protects campus NAT; shared MongoDB `AuthLockout` with TTL; 300 students behind one IP verified in test `1e` and `1f`. |
| **Authorization & BOLA** | **PASS** | Strict route-level JWT authorization; proxy attendance blocked; student submissions bound to `request.user.id`; admin routes locked to `isAdminOrFaculty`. |
| **Exam Integrity & Deadlines** | **PASS** | Server-side UTC deadline check (`receivedAt`); 120s grace period flags `late`, outside grace rejected with 400 `DEADLINE_EXCEEDED`; client clock never trusted. |
| **Code Execution Limits** | **PASS** | Single in-flight execution lock (`globalUserExecutionLocks`); 15 runs per student cap; 2s run cooldown; 5s submit cooldown; Judge0 sandbox (`enable_network: false`, 256MB memory cap, 1MB file cap); batch chunking capped at 20 test cases. |
| **Data Consistency Across Nodes** | **PASS** | Deterministic node routing by `hash(username)` with automatic health-check failover; shared `EventOtp` and `AttendanceLockout` collections in MongoDB with TTL. |
| **Database Capacity & Protection** | **PASS** | In-memory session cache (15s TTL) slashes Atlas M0 reads by ~90%; client-side autosave moved to IndexedDB; submission flusher capped at 60 doc writes/sec. |
| **Reliability & Cold Starts** | **RISK** | Render free tier spins down after 15 minutes of inactivity. Kept awake via UptimeRobot pinging `/api/health` every 5 minutes. Node restart test verifies queue drainage on SIGTERM. |
| **Data Safety & Backups** | **PASS** | Dual-write IndexedDB on client; bounded server-side queue (1,000 items); admin JSON backup download per node and cluster-wide; nightly `mongodump` procedure. |
| **Security Headers & Secrets** | **PASS** | Production fail-closed JWT secret verification; 12-char HMAC fingerprint on `/api/health` for authenticated admins only; strict CORS allowlist with preview flag. |
| **Monitoring & Runbook** | **PASS** | Multi-node admin dashboard (`SubmissionQueuePanel.jsx`) with 60s timeout fan-out; amber banner when pending > 0; "End Exam" safety blocker; offline nodes display "unknown" (never 0). |
| **Java 256MB Execution** | **UNVERIFIED** | Judge0 CE JVM heap overhead under 256MB with heavy algorithms has not been stress-tested on external provider. |

---

## 🚫 REMAINING BLOCKERS & MITIGATIONS

### Blocker 1: Atlas M0 100 Ops/Sec Boundary
- **Impact:** 300 students submitting simultaneously at the exact deadline could saturate 100 ops/sec if reads and writes overlap.
- **Free Mitigation:**  
  1. Enforce **100–150 students per slot** (Slot 1: 09:00, Slot 2: 10:30).
  2. Submission queue flusher caps writes at 60 docs/sec.
  3. Client answers persist in IndexedDB and poll with exponential backoff up to 12 minutes.

### Blocker 2: Render Free Tier Spin-Down
- **Impact:** A cold node takes 30–50 seconds to boot, causing student connection timeouts if UptimeRobot misses a cycle.
- **Free Mitigation:**  
  1. Pre-warm all 3 nodes 30 minutes before exam start via manual curl / browser hits.
  2. Frontend `useServerStore.ts` automatically fails over to remaining warm nodes if health check times out (>3.5s).

### Blocker 3: External Judge0 CE Free API Rate Limits (Days 3 & 4)
- **Impact:** RapidAPI / Judge0 CE free tier rate limits code execution bursts.
- **Free Mitigation:**  
  1. Hard limit of 15 code runs per student per problem.
  2. 2-second cooldown on Run Code, 5-second cooldown on Submit.
  3. Batch chunking (20 test cases per batch POST) reduces provider roundtrips by up to 80%.
  4. Per-user execution lock blocks rapid multi-click submissions.

---

## 🛠️ Free Mitigations Summary

1. **Slots:** Divide cohort into 150-student slots.
2. **Early Login Window:** Open login 15 minutes prior to exam start.
3. **Client-Side Storage:** Answers saved continuously in browser IndexedDB; server-side autosave checkpoint disabled (`0`).
4. **Session Cache:** Fastify in-memory cache (15s TTL) prevents database read storms.
5. **Durable Buffer:** In-memory queue flushes in 60-document batches with graceful SIGTERM drain.
