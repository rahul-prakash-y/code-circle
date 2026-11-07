# Exam Staging Rehearsal Results & Threshold Verification

**Environment:** Staging / Rehearsal Cluster (3x Render Free Nodes, MongoDB Atlas M0, Judge0 External API, Vercel Frontend)  
**Rehearsal Target:** 20–30 live test candidates executing full exam lifecycle (Login $\rightarrow$ Attendance $\rightarrow$ MCQ $\rightarrow$ Coding / Figma $\rightarrow$ Submit $\rightarrow$ Failover)  
**Date of Rehearsal:** `[YYYY-MM-DD]`  
**Lead Proctor / Engineer:** `[NAME]`  

---

## 🎯 Mandatory Go/No-Go Rehearsal Thresholds

To authorize the live exam rollout, the staging rehearsal MUST meet 100% of the following criteria:

| Metric / Test Criterion | Required Pass Threshold | Measured Rehearsal Result | Verdict (PASS / FAIL / UNVERIFIED) |
|---|---|---|---|
| **Data Durability on Node Restart** | **0 lost submissions** after abrupt node kill/restart (`SIGTERM` / termination) while items queued | `[Measured: ___ lost]` | `[UNVERIFIED - Awaiting Rehearsal]` |
| **Login Burst Throughput** | **$\ge 99\%$ candidates logged in within 2 minutes** behind shared campus NAT IP | `[Measured: ___% in 2 min]` | `[UNVERIFIED - Awaiting Rehearsal]` |
| **End-to-End Latency** | **p95 API latency < 2.0s** during simultaneous exam submission | `[Measured: ___ ms p95]` | `[UNVERIFIED - Awaiting Rehearsal]` |
| **MongoDB Atlas M0 Load** | **Sustained operations < 80 ops/sec** (peak strictly $\le 100\text{ ops/s}$) | `[Measured Peak: ___ ops/s]` | `[UNVERIFIED - Awaiting Rehearsal]` |
| **Classroom Rate Limiting** | **0 rate limit (HTTP 429) errors** for legitimate candidates during login & submit | `[Measured 429s: ___]` | `[UNVERIFIED - Awaiting Rehearsal]` |
| **Cross-Node Attendance OTP** | **OTP generated on Node A validated on Node B and Node C** across all candidates | `[Node B/C Validations: ___]` | `[UNVERIFIED - Awaiting Rehearsal]` |
| **Admin Cluster Observability** | **Admin panel displays "unknown" (never 0)** when any cluster node is stopped/offline | `[Offline Card Display: ___]` | `[UNVERIFIED - Awaiting Rehearsal]` |

---

## 🧪 Step-by-Step Rehearsal Script

### Phase 1: Pre-Rehearsal Verification (T - 30 minutes)
1. **Cluster Warm-Up:** Send HTTP GET probe to `/api/health` across all 3 nodes (`api-1`, `api-2`, `api-3`). Confirm all 3 respond with HTTP 200 within 500ms.
2. **JWT Secret Parity:** Verify in admin dashboard (`SubmissionQueuePanel.jsx`) that all 3 nodes report identical `jwtFingerprint` HMAC strings.
3. **Queue Health:** Verify `pendingCount = 0` on all 3 nodes.
4. **Database Pre-Check:** Verify Atlas M0 metrics in MongoDB Cloud dashboard. Sustained ops should be $< 5\text{ ops/s}$ baseline.

### Phase 2: Simultaneous Candidate Onboarding (T - 15 minutes)
1. Instruct all 25 test candidates to navigate to the login portal simultaneously over campus WiFi.
2. Monitor server logs for HTTP 429 errors. All 25 must authenticate successfully within 60 seconds without IP lockout.
3. Proctor generates Day 1 Attendance OTP on Node A.
4. Candidates partitioned across Nodes A, B, and C submit attendance OTP.
5. Verify attendance status confirms `saved` on database.

### Phase 3: Active Exam & Submission Queue Under Load (T + 0 to T + 30 minutes)
1. Candidates answer MCQ questions. Confirm local browser IndexedDB saves responses on each answer click.
2. Candidates test page refresh (`F5`) and tab close/reopen. Verify state restores seamlessly from local IndexedDB without server roundtrip.
3. On Day 3/4 rehearsal: 5 candidates execute Python/C code runs simultaneously. Verify cooldown (2s) and max in-flight execution lock (1 per user).
4. At deadline buzzer: All 25 candidates click **Submit Exam** within the same 5-second window.
5. Observe admin panel:
   - Items enqueue into in-memory buffer (`pendingCount` increments).
   - Amber warning banner appears ("DO NOT END EXAM OR DEPLOY").
   - Batch flusher drains queue to MongoDB in 60 docs/sec batches.
   - Candidates observe UI transition from `pending` to `saved`.

### Phase 4: Chaos & Failover Injection (T + 35 minutes)
1. Enqueue submissions, then forcefully stop Node 2 (e.g. Render restart or `SIGTERM`).
2. Verify frontend client automatically retries and fails over to Node 1 or Node 3.
3. Verify admin panel card for Node 2 transitions to **"unknown"**, never "0".
4. When Node 2 restarts, verify `flushAllPending()` preserved all queued items and MongoDB has zero lost submissions.
5. Verify "End Exam" action is safely blocked while any node is in an unreachable/unknown state without explicit modal confirmation.

---

## 📝 Rehearsal Execution Log

```
[Timestamp] Action / Observation / Anomaly
--------------------------------------------------------------------------------
10:00:00 - Rehearsal started with 25 test candidates on campus lab WiFi.
...
```

---

## 🏁 Final Sign-Off & Recommendation

- **Overall Status:** `[READY FOR PRODUCTION / BLOCKED - NEEDS FIXES]`
- **Approved Cohort Size Per Slot:** `[100 / 150 candidates]`
- **Lead Auditor Signature:** `___________________________`
- **Date Signed:** `[YYYY-MM-DD]`
