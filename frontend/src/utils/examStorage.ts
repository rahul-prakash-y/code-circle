/**
 * Exam Local Storage Engine: IndexedDB with transparent LocalStorage Fallback.
 * Persists student assessment answers, coding buffers, and submission tracking state
 * locally in the browser on every single change. State survives page refreshes and browser crashes,
 * and is cleared ONLY after the server confirms durable persistence in MongoDB.
 */

const DB_NAME = 'CodeCircleExamDB';
const DB_VERSION = 1;
const STORE_NAME = 'exam_state';

interface StoredExamRecord<T = any> {
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

/**
 * Persists exam state immediately to IndexedDB with localStorage fallback.
 */
export async function saveExamState<T = any>(key: string, data: T): Promise<void> {
  if (!key || typeof window === 'undefined') return;

  const payload: StoredExamRecord<T> = {
    key,
    data,
    timestamp: Date.now(),
  };

  // Always mirror in localStorage for immediate sync access if needed
  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch (lsErr) {
    console.warn('[ExamStorage] LocalStorage mirror write warning:', lsErr);
  }

  // Primary durable storage in IndexedDB
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
    // If IndexedDB fails (e.g. private mode or quota), localStorage is already updated
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

export default {
  saveExamState,
  getExamState,
  clearExamState,
};
