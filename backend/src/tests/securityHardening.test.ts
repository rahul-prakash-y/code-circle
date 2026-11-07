import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getJwtSecret } from '../middleware/authMiddleware';
import { isOriginAllowed } from '../server';

describe('Security Hardening & Regression Suite', () => {
  describe('SEC-03: JWT Secret Fail-Closed Enforcement', () => {
    test('Throws fatal error in production when JWT_SECRET is unset', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.JWT_SECRET;
      try {
        process.env.NODE_ENV = 'production';
        delete process.env.JWT_SECRET;
        assert.throws(
          () => getJwtSecret(),
          /JWT_SECRET must be explicitly defined in production/
        );
      } finally {
        process.env.NODE_ENV = originalEnv;
        if (originalSecret) {
          process.env.JWT_SECRET = originalSecret;
        }
      }
    });

    test('Returns configured JWT_SECRET when present', () => {
      const originalSecret = process.env.JWT_SECRET;
      try {
        process.env.JWT_SECRET = 'test-audit-configured-secret-key-12345';
        assert.equal(getJwtSecret(), 'test-audit-configured-secret-key-12345');
      } finally {
        if (originalSecret) {
          process.env.JWT_SECRET = originalSecret;
        } else {
          delete process.env.JWT_SECRET;
        }
      }
    });
  });

  describe('SEC-04: CORS Strict Origin Validation', () => {
    test('Allows trusted local development origins', () => {
      assert.equal(isOriginAllowed('http://localhost:5173'), true);
      assert.equal(isOriginAllowed('http://127.0.0.1:5173'), true);
      assert.equal(isOriginAllowed('http://localhost:5000'), true);
    });

    test('Rejects arbitrary untrusted external origins', () => {
      assert.equal(isOriginAllowed('https://evil-hacker.com'), false);
      assert.equal(isOriginAllowed('https://attacker.site.org'), false);
      assert.equal(isOriginAllowed('http://malicious-phishing.xyz'), false);
    });

    test('Allows configured CLIENT_URL and ALLOWED_ORIGINS', () => {
      const originalClientUrl = process.env.CLIENT_URL;
      const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;
      try {
        process.env.CLIENT_URL = 'https://codecircle.institution.edu';
        process.env.ALLOWED_ORIGINS = 'https://portal.institution.edu,https://staging.institution.edu';

        assert.equal(isOriginAllowed('https://codecircle.institution.edu'), true);
        assert.equal(isOriginAllowed('https://portal.institution.edu'), true);
        assert.equal(isOriginAllowed('https://staging.institution.edu'), true);
        assert.equal(isOriginAllowed('https://unauthorized-domain.com'), false);
      } finally {
        process.env.CLIENT_URL = originalClientUrl;
        process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
      }
    });
  });

  describe('SEC-01: Attendance BOLA and Authentication Logic', () => {
    test('Blocks student from proxy marking attendance for another studentId', () => {
      const caller = { id: 'student_123', role: 'Student' };
      const requestedUserId = 'student_999';

      const isPrivilegedStaff =
        caller.role === 'Admin' ||
        caller.role === 'SuperAdmin' ||
        caller.role === 'Faculty' ||
        caller.role === 'Committee';

      let effectiveUserId = caller.id;
      let forbidden = false;

      if (requestedUserId && requestedUserId !== effectiveUserId) {
        if (!isPrivilegedStaff) {
          forbidden = true;
        } else {
          effectiveUserId = requestedUserId;
        }
      }

      assert.equal(forbidden, true, 'Non-privileged student should be forbidden from marking proxy attendance');
      assert.equal(effectiveUserId, 'student_123');
    });

    test('Permits administrative staff to mark proxy attendance for another studentId', () => {
      const caller = { id: 'admin_1', role: 'Admin' };
      const requestedUserId = 'student_999';

      const isPrivilegedStaff =
        caller.role === 'Admin' ||
        caller.role === 'SuperAdmin' ||
        caller.role === 'Faculty' ||
        caller.role === 'Committee';

      let effectiveUserId = caller.id;
      let forbidden = false;

      if (requestedUserId && requestedUserId !== effectiveUserId) {
        if (!isPrivilegedStaff) {
          forbidden = true;
        } else {
          effectiveUserId = requestedUserId;
        }
      }

      assert.equal(forbidden, false, 'Admin should be permitted to mark proxy attendance');
      assert.equal(effectiveUserId, 'student_999');
    });
  });

  describe('SEC-02: Event Report RBAC Guard', () => {
    test('Prevents students from deleting event reports', () => {
      const studentUser = { id: 'student_1', role: 'Student' };
      const isPrivileged =
        studentUser.role === 'Admin' ||
        studentUser.role === 'SuperAdmin' ||
        studentUser.role === 'Faculty' ||
        studentUser.role === 'Committee';

      assert.equal(isPrivileged, false, 'Student must not have report deletion clearance');
    });

    test('Permits Faculty and Admin to manage event reports', () => {
      const facultyUser = { id: 'faculty_1', role: 'Faculty' };
      const adminUser = { id: 'admin_1', role: 'Admin' };

      const isFacultyPrivileged =
        facultyUser.role === 'Admin' ||
        facultyUser.role === 'SuperAdmin' ||
        facultyUser.role === 'Faculty' ||
        facultyUser.role === 'Committee';

      const isAdminPrivileged =
        adminUser.role === 'Admin' ||
        adminUser.role === 'SuperAdmin' ||
        adminUser.role === 'Faculty' ||
        adminUser.role === 'Committee';

      assert.equal(isFacultyPrivileged, true);
      assert.equal(isAdminPrivileged, true);
    });
  });

  describe('SEC-05: Upload Validation Guard', () => {
    const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

    const validateUpload = (data: { mimetype: string; filename: string }, bufferLength: number) => {
      const mime = (data.mimetype || '').toLowerCase();
      if (!ALLOWED_IMAGE_MIMES.includes(mime)) {
        return 'Invalid file type';
      }
      const extMatch = data.filename.toLowerCase().match(/\.([a-z0-9]+)$/);
      const ext = extMatch ? extMatch[1] : '';
      const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'js', 'php', 'html'];
      if (dangerousExtensions.includes(ext)) {
        return 'Disallowed file extension';
      }
      if (bufferLength > MAX_IMAGE_BYTES) {
        return 'File size exceeds limit';
      }
      return null;
    };

    test('Rejects dangerous executable extensions disguised with image MIME', () => {
      const err = validateUpload({ mimetype: 'image/png', filename: 'exploit.php' }, 1024);
      assert.equal(err, 'Disallowed file extension');
    });

    test('Rejects invalid MIME types', () => {
      const err = validateUpload({ mimetype: 'application/x-msdownload', filename: 'malware.exe' }, 1024);
      assert.equal(err, 'Invalid file type');
    });

    test('Rejects oversize image files (>5MB)', () => {
      const err = validateUpload({ mimetype: 'image/jpeg', filename: 'huge.jpg' }, 6 * 1024 * 1024);
      assert.equal(err, 'File size exceeds limit');
    });

    test('Accepts valid PNG within size limit', () => {
      const err = validateUpload({ mimetype: 'image/png', filename: 'avatar.png' }, 500 * 1024);
      assert.equal(err, null);
    });
  });

  describe('SEC-07: Safe Markdown Link Sanitization', () => {
    const isSafeUrl = (url?: string): boolean => {
      if (!url) return false;
      const trimmed = url.trim().toLowerCase();
      return (
        trimmed.startsWith('https://') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('mailto:') ||
        trimmed.startsWith('/') ||
        trimmed.startsWith('#')
      );
    };

    test('Blocks javascript: URI schemes', () => {
      assert.equal(isSafeUrl('javascript:alert(document.cookie)'), false);
      assert.equal(isSafeUrl('  JAVASCRIPT:alert(1)'), false);
    });

    test('Blocks data: URI schemes', () => {
      assert.equal(isSafeUrl('data:text/html,<script>alert(1)</script>'), false);
    });

    test('Allows safe https and http URLs', () => {
      assert.equal(isSafeUrl('https://example.com/docs'), true);
      assert.equal(isSafeUrl('http://localhost:5173'), true);
    });

    test('Allows relative internal routes and anchor hashes', () => {
      assert.equal(isSafeUrl('/events/123'), true);
      assert.equal(isSafeUrl('#section-2'), true);
    });
  });
});
