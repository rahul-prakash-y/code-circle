# Automated Test Results & Verification Log

**Platform:** Code Circle ⭕  
**Branch:** `audit/production-hardening`  
**Test Runner:** Node.js Native Test Runner via `tsx --test`  
**Date:** November 2026  
**Result:** **18 Tests Executed, 7 Suites, 18 Passed, 0 Failed, 0 Skipped**

---

## 1. Test Execution Command & Terminal Output

### Command Executed:
```bash
npm test
```

### Full Output:
```
> code-circle@1.0.0 test
> npm test --prefix backend

> backend@1.0.0 test
> tsx --test src/**/*.test.ts

TAP version 13
# [dotenv@17.3.1] injecting env (17) from .env
# Subtest: Security Hardening & Regression Suite
    # Subtest: SEC-03: JWT Secret Fail-Closed Enforcement
        # Subtest: Throws fatal error in production when JWT_SECRET is unset
        ok 1 - Throws fatal error in production when JWT_SECRET is unset
          ---
          duration_ms: 1.451
          type: 'test'
          ...
        # Subtest: Returns configured JWT_SECRET when present
        ok 2 - Returns configured JWT_SECRET when present
          ---
          duration_ms: 0.2932
          type: 'test'
          ...
        1..2
    ok 1 - SEC-03: JWT Secret Fail-Closed Enforcement
      ---
      duration_ms: 2.5058
      type: 'suite'
      ...
    # Subtest: SEC-04: CORS Strict Origin Validation
        # Subtest: Allows trusted local development origins
        ok 1 - Allows trusted local development origins
          ---
          duration_ms: 0.4112
          type: 'test'
          ...
        # Subtest: Rejects arbitrary untrusted external origins
        ok 2 - Rejects arbitrary untrusted external origins
          ---
          duration_ms: 0.2817
          type: 'test'
          ...
        # Subtest: Allows configured CLIENT_URL and ALLOWED_ORIGINS
        ok 3 - Allows configured CLIENT_URL and ALLOWED_ORIGINS
          ---
          duration_ms: 0.2877
          type: 'test'
          ...
        1..3
    ok 2 - SEC-04: CORS Strict Origin Validation
      ---
      duration_ms: 1.2633
      type: 'suite'
      ...
    # Subtest: SEC-01: Attendance BOLA and Authentication Logic
        # Subtest: Blocks student from proxy marking attendance for another studentId
        ok 1 - Blocks student from proxy marking attendance for another studentId
          ---
          duration_ms: 0.2264
          type: 'test'
          ...
        # Subtest: Permits administrative staff to mark proxy attendance for another studentId
        ok 2 - Permits administrative staff to mark proxy attendance for another studentId
          ---
          duration_ms: 0.3325
          type: 'test'
          ...
        1..2
    ok 3 - SEC-01: Attendance BOLA and Authentication Logic
      ---
      duration_ms: 0.8224
      type: 'suite'
      ...
    # Subtest: SEC-02: Event Report RBAC Guard
        # Subtest: Prevents students from deleting event reports
        ok 1 - Prevents students from deleting event reports
          ---
          duration_ms: 0.1604
          type: 'test'
          ...
        # Subtest: Permits Faculty and Admin to manage event reports
        ok 2 - Permits Faculty and Admin to manage event reports
          ---
          duration_ms: 0.2377
          type: 'test'
          ...
        1..2
    ok 4 - SEC-02: Event Report RBAC Guard
      ---
      duration_ms: 0.6383
      type: 'suite'
      ...
    # Subtest: SEC-05: Upload Validation Guard
        # Subtest: Rejects dangerous executable extensions disguised with image MIME
        ok 1 - Rejects dangerous executable extensions disguised with image MIME
          ---
          duration_ms: 0.2987
          type: 'test'
          ...
        # Subtest: Rejects invalid MIME types
        ok 2 - Rejects invalid MIME types
          ---
          duration_ms: 0.1159
          type: 'test'
          ...
        # Subtest: Rejects oversize image files (>5MB)
        ok 3 - Rejects oversize image files (>5MB)
          ---
          duration_ms: 0.1416
          type: 'test'
          ...
        # Subtest: Accepts valid PNG within size limit
        ok 4 - Accepts valid PNG within size limit
          ---
          duration_ms: 0.1224
          type: 'test'
          ...
        1..4
    ok 5 - SEC-05: Upload Validation Guard
      ---
      duration_ms: 0.8331
      type: 'suite'
      ...
    # Subtest: SEC-07: Safe Markdown Link Sanitization
        # Subtest: Blocks javascript: URI schemes
        ok 1 - Blocks javascript: URI schemes
          ---
          duration_ms: 0.2042
          type: 'test'
          ...
        # Subtest: Blocks data: URI schemes
        ok 2 - Blocks data: URI schemes
          ---
          duration_ms: 0.0925
          type: 'test'
          ...
        # Subtest: Allows safe https and http URLs
        ok 3 - Allows safe https and http URLs
          ---
          duration_ms: 0.166
          type: 'test'
          ...
        # Subtest: Allows relative internal routes and anchor hashes
        ok 4 - Allows relative internal routes and anchor hashes
          ---
          duration_ms: 0.1039
          type: 'test'
          ...
        1..4
    ok 6 - SEC-07: Safe Markdown Link Sanitization
      ---
      duration_ms: 0.7046
      type: 'suite'
      ...
    1..6
ok 1 - Security Hardening & Regression Suite
  ---
  duration_ms: 7.6987
  type: 'suite'
  ...
# --- Starting Pagination Unit Tests ---
# ✓ Test 1: Default values passed
# ✓ Test 2: Custom valid parameters passed
# ✓ Test 3: Clamping maximum page size passed
# ✓ Test 4: Malformed and negative parameter handling passed
# ✓ Test 5: Sort field whitelisting passed
# ✓ Test 6: Empty collection metadata passed
# ✓ Test 7: Multi-page collection metadata passed
# ✓ Test 8: Last page metadata passed
# ✓ Test 9: Out-of-range page metadata passed
# ✓ Test 10: Response formatting with legacy alias passed
# ✓ Test 11: Cursor encoding and decoding passed
# --- ALL PAGINATION UNIT TESTS PASSED SUCCESSFULLY ---
# Subtest: src\utils\pagination.test.ts
ok 2 - src\utils\pagination.test.ts
  ---
  duration_ms: 336.3089
  type: 'test'
  ...
1..2
# tests 18
# suites 7
# pass 18
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 3141.9037
```

---

## 2. Frontend Linting & Build Verification

### 2.1 ESLint Status:
```bash
npm run lint --prefix frontend
# Output:
> frontend@0.0.0 lint
> eslint .
# Exit code: 0 (0 errors, 0 warnings)
```

### 2.2 TypeScript & Vite Build:
```bash
npm run build --prefix backend
# Output: [tsc && copyJsToDist.js] -> Exit code 0 (19 files copied to dist)

npm run build --prefix frontend
# Output: [vite build] -> Exit code 0 (✓ built in 3.06s, zero chunks exceeding 500 kB)
```
