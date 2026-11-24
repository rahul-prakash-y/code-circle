import { test, describe, before, mock } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { server } from '../server';
import User from '../models/userModel';
import {
  getJwtSecret,
  userSessionCache,
  getCachedUser,
  setCachedUser,
  invalidateUserSession,
} from '../middleware/authMiddleware';

describe('Single-Device Session Cache & Cross-Node Synchronization Test Suite', () => {
  const secret = getJwtSecret();
  const testUserId = '507f1f77bcf86cd799439055';

  let currentDbSessionId = 'sess-initial-1';

  before(async () => {
    await server.ready();

    // Mock User.findById so it returns the current DB ground truth with .select() support
    mock.method(User, 'findById', (id: any) => {
      const doc = String(id) === testUserId ? {
        _id: new mongoose.Types.ObjectId(testUserId),
        id: testUserId,
        role: 'Student',
        email: 'sessiontest@example.com',
        name: 'Session Test User',
        isBlocked: false,
        activeSessionId: currentDbSessionId,
      } : null;

      const queryObj: any = Promise.resolve(doc);
      queryObj.select = () => Promise.resolve(doc);
      return queryObj;
    });
  });

  test('1. Normal flow: user is cached and matching token succeeds', async () => {
    currentDbSessionId = 'sess-initial-1';
    invalidateUserSession(testUserId);

    const token = jwt.sign(
      { id: testUserId, sessionId: 'sess-initial-1' },
      secret,
      { expiresIn: '1h' }
    );

    const res = await server.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });

    assert.equal(res.statusCode, 200);
    // User should now be cached
    const cached = getCachedUser(testUserId);
    assert.ok(cached, 'User should be in session cache');
    assert.equal(cached.activeSessionId, 'sess-initial-1');
  });

  test('2. Stale cache self-healing: when cache has old session but DB has new session, verifyToken heals cache without 401', async () => {
    // Simulate: Cache has old session ID from 5 seconds ago
    userSessionCache.set(testUserId, {
      user: {
        _id: new mongoose.Types.ObjectId(testUserId),
        id: testUserId,
        role: 'Student',
        email: 'sessiontest@example.com',
        name: 'Session Test User',
        isBlocked: false,
        activeSessionId: 'sess-old-stale',
      },
      cachedAt: Date.now(),
    });

    // DB was updated by login on this node or another cluster node
    currentDbSessionId = 'sess-new-login';

    const newToken = jwt.sign(
      { id: testUserId, sessionId: 'sess-new-login' },
      secret,
      { expiresIn: '1h' }
    );

    // Request with the new token should NOT fail with 401!
    const res = await server.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${newToken}` },
    });

    assert.equal(res.statusCode, 200, 'Stale cache must be healed by checking DB, avoiding false 401');
    const updatedCache = getCachedUser(testUserId);
    assert.equal(updatedCache.activeSessionId, 'sess-new-login', 'Cache should be refreshed with new session ID');
  });

  test('3. True concurrent session conflict: returns 401 when DB confirms session was superseded', async () => {
    // Current DB has sess-device-b
    currentDbSessionId = 'sess-device-b';
    invalidateUserSession(testUserId);

    // Old token from device A has sess-device-a
    const oldDeviceToken = jwt.sign(
      { id: testUserId, sessionId: 'sess-device-a' },
      secret,
      { expiresIn: '1h' }
    );

    const res = await server.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${oldDeviceToken}` },
    });

    assert.equal(res.statusCode, 401);
    assert.match(res.json().error, /Another login was detected/i);
  });

  test('4. InvalidateUserSession purges cache on logout or password change', async () => {
    setCachedUser(testUserId, { activeSessionId: 'sess-logout-test' });
    assert.ok(getCachedUser(testUserId));

    invalidateUserSession(testUserId);
    assert.equal(getCachedUser(testUserId), null);
  });
});
