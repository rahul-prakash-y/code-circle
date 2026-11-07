import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeNoSqlPayload } from '../middleware/sanitizeInput';
import { server } from '../server';

describe('NoSQL Operator Injection Protection Suite', () => {
  before(async () => {
    await server.ready();
  });

  describe('Unit Tests: sanitizeNoSqlPayload', () => {
    test('Strips root-level MongoDB operators ($ne, $gt, $where, $regex)', () => {
      const maliciousPayload = {
        username: 'student123',
        $ne: 'admin',
        $gt: '',
        $where: 'sleep(5000)',
        role: 'Student',
      };

      const sanitized = sanitizeNoSqlPayload(maliciousPayload);

      assert.deepEqual(sanitized, {
        username: 'student123',
        role: 'Student',
      });
      assert.equal((sanitized as any).$ne, undefined);
      assert.equal((sanitized as any).$gt, undefined);
      assert.equal((sanitized as any).$where, undefined);
    });

    test('Recursively sanitizes deeply nested operator payloads', () => {
      const nestedPayload = {
        filter: {
          category: {
            $ne: null,
            $regex: '.*',
          },
          normalField: 'Algorithms',
        },
        items: [{ id: '1', $gt: '0' }, { id: '2' }],
      };

      const sanitized = sanitizeNoSqlPayload(nestedPayload);

      assert.deepEqual(sanitized, {
        filter: {
          category: {},
          normalField: 'Algorithms',
        },
        items: [{ id: '1' }, { id: '2' }],
      });
    });

    test('Preserves safe primitives, dates, and arrays untouched', () => {
      const now = new Date();
      const safePayload = {
        name: 'John Doe',
        score: 95,
        isActive: true,
        tags: ['dsa', 'web'],
        timestamp: now,
      };

      const sanitized = sanitizeNoSqlPayload(safePayload);
      assert.deepEqual(sanitized, safePayload);
      assert.equal(sanitized.timestamp, now);
    });
  });

  describe('Route-Level HTTP Injection Tests', () => {
    test('POST /api/auth/login: Strips operator injection in request body', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          identifier: { $gt: '' },
          password: 'password123',
        },
      });

      // Identifier becomes an empty object after sanitization, failing validation with 400
      assert.equal(res.statusCode, 400);
      assert.match(res.json().error || '', /Email or Roll Number and password are required/i);
    });

    test('POST /api/auth/login: Rejects array or non-string operator injection', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          identifier: [{ $ne: null }],
          password: 'password123',
        },
      });

      assert.equal(res.statusCode, 400);
    });
  });
});
