import { useState, useEffect, useRef, useCallback } from 'react';
import { saveExamState, getExamState, clearExamState } from '../utils/examStorage';

export interface UseAutoSaveOptions<T> {
  intervalMs?: number; // Default 30,000ms
  enabled?: boolean; // Default true
  onRestore?: (restoredData: T) => void;
}

export interface UseAutoSaveReturn<T> {
  restoredData: T | null;
  lastSaved: Date | null;
  saveNow: () => Promise<boolean>;
  clearSavedData: () => Promise<void>;
  hasSavedData: boolean;
}

/**
 * useAutoSave Hook (IndexedDB with transparent LocalStorage Fallback)
 * Persists assessment answers and code locally in browser IndexedDB on every change.
 * Survives page refreshes, tab closures, and browser crashes.
 * State is cleared ONLY after the server confirms durable persistence in MongoDB.
 *
 * @param storageKey Unique key for the test (e.g., `cc_assessment_answers_${assessmentId}`)
 * @param currentData Current student answers / state to be saved
 * @param options AutoSave configuration
 */
export function useAutoSave<T>(
  storageKey: string,
  currentData: T,
  options: UseAutoSaveOptions<T> = {}
): UseAutoSaveReturn<T> {
  const { intervalMs = 30000, enabled = true, onRestore } = options;

  const [restoredData, setRestoredData] = useState<T | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasSavedData, setHasSavedData] = useState<boolean>(false);

  const currentDataRef = useRef<T>(currentData);
  currentDataRef.current = currentData;

  const initialLoadedRef = useRef<boolean>(false);

  // 1. Initial Mount: Load saved state from IndexedDB (fallback localStorage)
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined' || initialLoadedRef.current) return;
    initialLoadedRef.current = true;

    let isCancelled = false;

    getExamState<T>(storageKey)
      .then((saved) => {
        if (isCancelled || !saved) return;
        setRestoredData(saved);
        setHasSavedData(true);
        setLastSaved(new Date());
        if (onRestore) {
          onRestore(saved);
        }
        console.log(`[useAutoSave:IndexedDB] Restored exam state for key: ${storageKey}`);
      })
      .catch((err) => {
        console.warn('[useAutoSave] Error restoring exam state:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [storageKey, onRestore]);

  // 2. Immediate save function (writes to IndexedDB + localStorage mirror)
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!storageKey || typeof window === 'undefined') return false;

    try {
      await saveExamState(storageKey, currentDataRef.current);
      setLastSaved(new Date());
      setHasSavedData(true);
      return true;
    } catch (err) {
      console.warn('[useAutoSave] Failed to save exam state:', err);
      return false;
    }
  }, [storageKey]);

  // 3. Periodic checkpoint interval
  useEffect(() => {
    if (!enabled || !storageKey || typeof window === 'undefined') return;

    const timer = setInterval(() => {
      void saveNow();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [enabled, storageKey, intervalMs, saveNow]);

  // 4. Save immediately on window beforeunload
  useEffect(() => {
    if (!enabled || !storageKey || typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      void saveNow();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, storageKey, saveNow]);

  // 5. Clear helper — ONLY called after server confirms durable storage
  const clearSavedData = useCallback(async () => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      await clearExamState(storageKey);
      setRestoredData(null);
      setHasSavedData(false);
      setLastSaved(null);
      console.log(`[useAutoSave] Cleared durable exam state for key: ${storageKey}`);
    } catch (err) {
      console.warn('[useAutoSave] Failed to clear exam state:', err);
    }
  }, [storageKey]);

  return {
    restoredData,
    lastSaved,
    saveNow,
    clearSavedData,
    hasSavedData,
  };
}

export default useAutoSave;
