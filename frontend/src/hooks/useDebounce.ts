import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a fast-updating value.
 *
 * @template T - The type of value being debounced.
 * @param {T} value - The input value to debounce.
 * @param {number} [delay=500] - The debounce delay period in milliseconds (default: 500ms).
 * @returns {T} - The lagging debounced value that only updates once `delay` ms have passed without changes.
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
