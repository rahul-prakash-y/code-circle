import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Set up mock window, localStorage, and IndexedDB in Node environment before importing examStorage
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

const mockLS = new MockLocalStorage();

// Simple in-memory mock for IndexedDB
class MockIDBStore {
  data: Map<string, any> = new Map();

  put(record: any) {
    this.data.set(record.key, record);
    const req: any = { onsuccess: null, onerror: null, result: record.key };
    setTimeout(() => req.onsuccess?.({ target: req }), 0);
    return req;
  }

  get(key: string) {
    const record = this.data.get(key);
    const req: any = { onsuccess: null, onerror: null, result: record };
    setTimeout(() => req.onsuccess?.({ target: req }), 0);
    return req;
  }

  delete(key: string) {
    this.data.delete(key);
    const req: any = { onsuccess: null, onerror: null, result: undefined };
    setTimeout(() => req.onsuccess?.({ target: req }), 0);
    return req;
  }

  clear() {
    this.data.clear();
    const req: any = { onsuccess: null, onerror: null, result: undefined };
    setTimeout(() => req.onsuccess?.({ target: req }), 0);
    return req;
  }
}

const mockIDBStoreInstance = new MockIDBStore();

const mockIDBDatabase: any = {
  objectStoreNames: {
    contains: (name: string) => name === 'exam_state',
  },
  transaction: () => ({
    objectStore: () => mockIDBStoreInstance,
  }),
};

const mockIndexedDB: any = {
  open: () => {
    const req: any = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockIDBDatabase,
    };
    setTimeout(() => {
      req.onsuccess?.({ target: req });
    }, 0);
    return req;
  },
};

(global as any).window = {
  localStorage: mockLS,
  indexedDB: mockIndexedDB,
  addEventListener: () => {},
};

(global as any).document = {
  visibilityState: 'visible',
};

// Dynamic import after globals are populated
const {
  saveExamState,
  getExamState,
  clearExamState,
  clearAllExamState,
  getExamStorageKey,
  flushPendingExamWrites,
} = await import('./examStorage.ts');

describe('examStorage Verification Test Suite', () => {
  beforeEach(() => {
    mockLS.clear();
    mockIDBStoreInstance.data.clear();
  });

  test('Test Case 1: Answer then immediate reload restores the answer via flush', async () => {
    const user = 'student_42';
    const exam = 'asm_midterm_1';
    const key = getExamStorageKey(user, exam);

    const testAnswers = {
      mcqAnswers: { 'q-101': 2, 'q-102': 0 },
      code: 'def solution():\n    return 42',
      language: 'python',
    };

    // Save exam state with debounced localStorage
    await saveExamState(key, testAnswers, true);

    // Immediate flush triggers (e.g., pagehide, visibilitychange, or reload)
    flushPendingExamWrites();

    // Verify localStorage has persisted mirror record
    const lsRaw = mockLS.getItem(key);
    assert.ok(lsRaw, 'LocalStorage must have the flushed answer payload');
    const parsed = JSON.parse(lsRaw);
    assert.deepEqual(parsed.data, testAnswers, 'Payload in localStorage matches saved answers');

    // Verify recovery via getExamState (IndexedDB primary or localStorage fallback)
    const recovered = await getExamState(key);
    assert.deepEqual(recovered, testAnswers, 'getExamState recovers complete student answers');
  });

  test('Test Case 2: Two users on one browser stay strictly isolated', async () => {
    const userA = 'student_alice';
    const userB = 'student_bob';
    const exam = 'assessment_final_round';

    const keyAlice = getExamStorageKey(userA, exam);
    const keyBob = getExamStorageKey(userB, exam);

    assert.notEqual(keyAlice, keyBob, 'Storage keys must be unique per user');

    const aliceAnswers = { answer: 'Alice Secret Code', score: 100 };
    const bobAnswers = { answer: 'Bob Independent Code', score: 95 };

    await saveExamState(keyAlice, aliceAnswers, false);
    await saveExamState(keyBob, bobAnswers, false);

    const retrievedAlice = await getExamState(keyAlice);
    const retrievedBob = await getExamState(keyBob);

    assert.deepEqual(retrievedAlice, aliceAnswers, "Alice's state matches Alice's answers");
    assert.deepEqual(retrievedBob, bobAnswers, "Bob's state matches Bob's answers");
    assert.notEqual(retrievedAlice.answer, retrievedBob.answer, 'No answer leakage between users');
  });

  test('Test Case 3: Logout clears all exam state from both IndexedDB and LocalStorage', async () => {
    const key1 = getExamStorageKey('user_1', 'exam_1');
    const key2 = getExamStorageKey('user_2', 'exam_2');
    const key3 = 'arena_mcq_event_123_asm_456';

    await saveExamState(key1, { val: 1 }, false);
    await saveExamState(key2, { val: 2 }, false);
    mockLS.setItem(key3, JSON.stringify({ q1: 1 }));

    // Verify items are stored
    assert.ok(mockLS.getItem(key1));
    assert.ok(mockLS.getItem(key2));
    assert.ok(mockLS.getItem(key3));

    // Execute logout clear
    await clearAllExamState();

    // Verify localStorage is wiped of all exam keys
    assert.equal(mockLS.getItem(key1), null, 'key1 must be cleared');
    assert.equal(mockLS.getItem(key2), null, 'key2 must be cleared');
    assert.equal(mockLS.getItem(key3), null, 'key3 must be cleared');

    // Verify IndexedDB store is cleared
    assert.equal(mockIDBStoreInstance.data.size, 0, 'IndexedDB store must be empty');
  });

  test('Test Case 4: Flushes pending writes before submit and removes single key on server confirmation', async () => {
    const key = getExamStorageKey('student_99', 'exam_final');
    await saveExamState(key, { submitted: true }, true);

    // Call flush before submit
    flushPendingExamWrites();

    // Verify written
    const beforeClear = await getExamState(key);
    assert.ok(beforeClear);

    // Server confirms MongoDB write -> clear key
    await clearExamState(key);

    const afterClear = await getExamState(key);
    assert.equal(afterClear, null, 'Key cleared from both stores after server confirmation');
  });
});
