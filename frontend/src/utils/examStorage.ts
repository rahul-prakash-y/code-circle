/**
 * Exam Local Storage Engine: IndexedDB with transparent LocalStorage Fallback.
 * Persists student assessment answers, coding buffers, and submission tracking state
 * locally in the browser on every single change. State survives page refreshes and browser crashes,
 * and is cleared ONLY after the server confirms durable persistence in MongoDB.
 */

const DB_NAME = 'CodeCircleExamDB';
const DB_VERSION = 1;
const STORE_NAME = 'exam_state';

export interface StoredExamRecord<T = any> {
  key: string;
  data: T;
  timestamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
}

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!isIndexedDBSupported()) {
      return reject(new Error('IndexedDB is not supported in this browser environment'));
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB database'));
      };
    } catch (err) {
      reject(err);
    }
  });

  return dbPromise;
}

// In-memory queue of pending writes for debounced mirroring
const pendingPayloads = new Map<string, StoredExamRecord>();
const lsWriteTimers = new Map<string, any>();

/**
 * Immediately flushes any pending debounced writes to localStorage.
 * Guaranteed to be called on visibilitychange, pagehide, beforeunload, and before final exam submission.
 */
export function flushPendingExamWrites(): void {
  if (typeof window === 'undefined') return;

  for (const [key, timer] of lsWriteTimers.entries()) {
    clearTimeout(timer);
  }
  lsWriteTimers.clear();

  for (const [key, payload] of pendingPayloads.entries()) {
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch (lsErr) {
      console.warn('[ExamStorage] Flush LocalStorage write warning:', lsErr);
    }
  }
  pendingPayloads.clear();
}

// Attach lifecycle listeners for automatic flush on tab blur, minimize, or pagehide
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingExamWrites();
    }
  });
  window.addEventListener('pagehide', () => {
    flushPendingExamWrites();
  });
  window.addEventListener('beforeunload', () => {
    flushPendingExamWrites();
  });
}

/**
 * Persists exam state immediately to IndexedDB (as primary storage engine)
 * with a debounced synchronous localStorage mirror for instant crash recovery.
 */
export async function saveExamState<T = any>(key: string, data: T, debounceLocalStorage = true): Promise<void> {
  if (!key || typeof window === 'undefined') return;

  const payload: StoredExamRecord<T> = {
    key,
    data,
    timestamp: Date.now(),
  };

  pendingPayloads.set(key, payload);

  // 1. Debounced mirror in localStorage to prevent blocking the JavaScript main thread
  if (debounceLocalStorage) {
    if (lsWriteTimers.has(key)) {
      clearTimeout(lsWriteTimers.get(key));
    }
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(payload));
        pendingPayloads.delete(key);
      } catch (lsErr) {
        console.warn('[ExamStorage] LocalStorage mirror write warning:', lsErr);
      } finally {
        lsWriteTimers.delete(key);
      }
    }, 300);
    lsWriteTimers.set(key, timer);
  } else {
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
      pendingPayloads.delete(key);
    } catch (lsErr) {
      console.warn('[ExamStorage] LocalStorage mirror write warning:', lsErr);
    }
  }

  // 2. Primary durable storage in IndexedDB (non-blocking async)
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(payload);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (idbErr) {
    // If IndexedDB fails (e.g. strict private mode or quota), immediately flush localStorage
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
      pendingPayloads.delete(key);
    } catch {
      // Ignore
    }
    console.warn('[ExamStorage] IndexedDB write fallback to localStorage:', idbErr);
  }
}

/**
 * Retrieves saved exam state from IndexedDB (falling back to localStorage).
 */
export async function getExamState<T = any>(key: string): Promise<T | null> {
  if (!key || typeof window === 'undefined') return null;

  // 1. Try IndexedDB first
  try {
    const db = await openDatabase();
    const result = await new Promise<StoredExamRecord<T> | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    if (result && result.data !== undefined) {
      return result.data;
    }
  } catch (idbErr) {
    console.warn('[ExamStorage] IndexedDB read failed, attempting localStorage fallback:', idbErr);
  }

  // 2. Fallback to localStorage
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed: StoredExamRecord<T> = JSON.parse(raw);
      if (parsed && parsed.data !== undefined) {
        return parsed.data;
      }
    }
  } catch (lsErr) {
    console.warn('[ExamStorage] LocalStorage read failed:', lsErr);
  }

  return null;
}

/**
 * Clears saved exam state from BOTH IndexedDB and localStorage.
 * MUST only be called AFTER the server confirms durable MongoDB persistence!
 */
export async function clearExamState(key: string): Promise<void> {
  if (!key || typeof window === 'undefined') return;

  if (lsWriteTimers.has(key)) {
    clearTimeout(lsWriteTimers.get(key));
    lsWriteTimers.delete(key);
  }
  pendingPayloads.delete(key);

  // Clear from localStorage
  try {
    window.localStorage.removeItem(key);
  } catch (lsErr) {
    console.warn('[ExamStorage] LocalStorage remove warning:', lsErr);
  }

  // Clear from IndexedDB
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    console.log(`[ExamStorage] Cleared durable exam state for key: ${key}`);
  } catch (idbErr) {
    console.warn('[ExamStorage] IndexedDB delete warning:', idbErr);
  }
}

/**
 * Generates an isolated storage key scoped strictly per user and assessment.
 * Ensures student answers cannot leak across accounts on shared classroom/lab computers.
 */
export function getExamStorageKey(userId: string, assessmentId: string): string {
  const cleanUser = String(userId || 'anonymous').trim();
  const cleanAssessment = String(assessmentId || 'unassigned').trim();
  return `cc_exam_${cleanUser}_${cleanAssessment}`;
}

/**
 * Clears ALL stored exam states across all assessments and users from both IndexedDB and localStorage.
 * Triggered on user logout to prevent exam state retention on shared classroom terminals.
 */
export async function clearAllExamState(): Promise<void> {
  if (typeof window === 'undefined') return;

  flushPendingExamWrites();

  // 1. Purge exam keys from localStorage
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith('cc_exam_') || k.startsWith('cc_assessment_') || k.startsWith('arena_mcq_') || k.startsWith('arena_coding_'))) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      window.localStorage.removeItem(k);
    }
  } catch (lsErr) {
    console.warn('[ExamStorage] LocalStorage bulk clear warning:', lsErr);
  }

  // 2. Clear IndexedDB object store
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    console.log('[ExamStorage] Cleared all exam state from IndexedDB on logout.');
  } catch (idbErr) {
    console.warn('[ExamStorage] IndexedDB store clear warning:', idbErr);
  }
}

export default {
  saveExamState,
  getExamState,
  clearExamState,
  clearAllExamState,
  getExamStorageKey,
  flushPendingExamWrites,
};
