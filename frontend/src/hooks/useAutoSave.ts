import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseAutoSaveOptions<T> {
  intervalMs?: number; // Default 30,000ms (30 seconds)
  enabled?: boolean; // Default true
  onRestore?: (restoredData: T) => void;
}

export interface UseAutoSaveReturn<T> {
  restoredData: T | null;
  lastSaved: Date | null;
  saveNow: () => boolean;
  clearSavedData: () => void;
  hasSavedData: boolean;
}

interface StoredPayload<T> {
  data: T;
  timestamp: number;
  version?: number;
}

/**
 * useAutoSave Hook
 * Resiliency hook that persists assessment answers to browser localStorage every 30 seconds.
 * On page refresh or reconnection after wifi / server drop, reloads state so students never lose their work.
 *
 * @param storageKey Unique key for the test (e.g., `assessment_answers_${assessmentId}_${userId}`)
 * @param currentData Current student state / answers to be saved
 * @param options AutoSave configuration (intervalMs, enabled, onRestore)
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

  // Keep a ref of currentData so interval callback always accesses freshest state without resetting timer
  const currentDataRef = useRef<T>(currentData);
  currentDataRef.current = currentData;

  const initialLoadedRef = useRef<boolean>(false);

  // 1. Initial Mount: Load saved answers from localStorage if available
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined' || initialLoadedRef.current) return;
    initialLoadedRef.current = true;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed: StoredPayload<T> = JSON.parse(raw);
        if (parsed && parsed.data !== undefined) {
          setRestoredData(parsed.data);
          setHasSavedData(true);
          if (parsed.timestamp) {
            setLastSaved(new Date(parsed.timestamp));
          }
          if (onRestore) {
            onRestore(parsed.data);
          }
          console.log(`[useAutoSave] Successfully restored saved test state for key: ${storageKey}`);
        }
      }
    } catch (err) {
      console.warn('[useAutoSave] Failed to restore from localStorage:', err);
    }
  }, [storageKey, onRestore]);

  // 2. Immediate save function
  const saveNow = useCallback((): boolean => {
    if (!storageKey || typeof window === 'undefined') return false;

    try {
      const payload: StoredPayload<T> = {
        data: currentDataRef.current,
        timestamp: Date.now(),
        version: 1,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
      const now = new Date();
      setLastSaved(now);
      setHasSavedData(true);
      return true;
    } catch (err) {
      console.warn('[useAutoSave] Failed to save to localStorage (quota or disabled):', err);
      return false;
    }
  }, [storageKey]);

  // 3. Periodic interval: save every 30 seconds
  useEffect(() => {
    if (!enabled || !storageKey || typeof window === 'undefined') return;

    const timer = setInterval(() => {
      saveNow();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [enabled, storageKey, intervalMs, saveNow]);

  // 4. Save immediately on window beforeunload (refresh, tab close)
  useEffect(() => {
    if (!enabled || !storageKey || typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      saveNow();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, storageKey, saveNow]);

  // 5. Clean up helper when submission succeeds
  const clearSavedData = useCallback(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(storageKey);
      setRestoredData(null);
      setHasSavedData(false);
      setLastSaved(null);
      console.log(`[useAutoSave] Cleared auto-saved state for key: ${storageKey}`);
    } catch (err) {
      console.warn('[useAutoSave] Failed to clear localStorage key:', err);
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
