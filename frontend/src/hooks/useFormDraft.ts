import { useState, useEffect, useCallback } from 'react';

/**
 * useFormDraft securely saves typed form input locally so that
 * token expiration, connection loss, or browser refresh never drops work.
 */
export function useFormDraft<T extends Record<string, any>>(
  formKey: string,
  initialValues: T
): [T, (updates: Partial<T> | ((prev: T) => T)) => void, () => void] {
  const storageKey = `code-circle-draft:${formKey}`;

  const [values, setValues] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValues;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        return { ...initialValues, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback to initial values on storage errors
    }
    return initialValues;
  });

  // Debounced auto-save to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(values));
    } catch {
      // Ignore quota or private-browsing errors
    }
  }, [values, storageKey]);

  const updateValues = useCallback(
    (updates: Partial<T> | ((prev: T) => T)) => {
      setValues((prev) => {
        if (typeof updates === 'function') {
          return updates(prev);
        }
        return { ...prev, ...updates };
      });
    },
    []
  );

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    setValues(initialValues);
  }, [storageKey, initialValues]);

  return [values, updateValues, clearDraft];
}

export default useFormDraft;
