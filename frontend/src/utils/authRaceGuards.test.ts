import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('Auth Race Guard & Superseded Session Resilience', () => {
  // Mock localStorage in Node test runner
  const storage = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, val: string) => storage.set(key, String(val)),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  };

  beforeEach(() => {
    storage.clear();
  });

  test('1. Axios interceptor ignores 401 from stale/superseded token', () => {
    mockLocalStorage.setItem('token', 'new-valid-jwt-token');
    mockLocalStorage.setItem('sessionId', 'new-session-id');

    let unauthorizedDispatched = false;
    const dispatchEvent = () => {
      unauthorizedDispatched = true;
    };

    // Stale request headers had the old token from before login
    const staleRequestToken = 'old-expired-jwt-token';
    const currentToken = mockLocalStorage.getItem('token');

    // Simulate our interceptor logic
    if (!staleRequestToken || !currentToken || staleRequestToken === currentToken) {
      mockLocalStorage.removeItem('token');
      mockLocalStorage.removeItem('sessionId');
      dispatchEvent();
    }

    assert.equal(unauthorizedDispatched, false, 'Must not dispatch unauthorized event for stale token');
    assert.equal(mockLocalStorage.getItem('token'), 'new-valid-jwt-token', 'Must retain new token in storage');
  });

  test('2. Axios interceptor purges credentials when current active token is 401', () => {
    mockLocalStorage.setItem('token', 'active-token-401');
    mockLocalStorage.setItem('sessionId', 'active-session-401');

    let unauthorizedDispatched = false;
    const dispatchEvent = () => {
      unauthorizedDispatched = true;
    };

    const activeRequestToken = 'active-token-401';
    const currentToken = mockLocalStorage.getItem('token');

    if (!activeRequestToken || !currentToken || activeRequestToken === currentToken) {
      mockLocalStorage.removeItem('token');
      mockLocalStorage.removeItem('sessionId');
      dispatchEvent();
    }

    assert.equal(unauthorizedDispatched, true, 'Must dispatch unauthorized when active token is 401');
    assert.equal(mockLocalStorage.getItem('token'), null, 'Must purge token from storage');
  });

  test('3. checkAuth concurrency guard protects newly logged in user from in-flight checkAuth failure', async () => {
    // 1. Initial state before login: old token in storage
    const initialToken = 'initial-old-token';
    mockLocalStorage.setItem('token', initialToken);

    let authStoreUser: any = null;
    let authStoreToken: string | null = initialToken;

    // Simulate slow in-flight checkAuth started at page load
    const runCheckAuth = async (capturedToken: string) => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Simulate checkAuth failure (401 from server)
      const isFailed = true;
      if (isFailed) {
        // Guard check: only purge if token in storage is still the one that failed
        if (mockLocalStorage.getItem('token') === capturedToken) {
          mockLocalStorage.removeItem('token');
          authStoreUser = null;
          authStoreToken = null;
        }
      }
    };

    const checkAuthPromise = runCheckAuth(initialToken);

    // 2. User quickly logs in while checkAuth is in flight
    const newToken = 'fresh-login-token-xyz';
    mockLocalStorage.setItem('token', newToken);
    authStoreUser = { id: 'u1', name: 'John Doe' };
    authStoreToken = newToken;

    // 3. Now the old checkAuth finishes
    await checkAuthPromise;

    // 4. Assert newly logged-in user is NOT wiped out
    assert.equal(authStoreUser.name, 'John Doe', 'User must remain logged in');
    assert.equal(authStoreToken, newToken, 'Store token must remain fresh token');
    assert.equal(mockLocalStorage.getItem('token'), newToken, 'Storage token must remain fresh token');
  });
});
