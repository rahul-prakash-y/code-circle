import { useState, useEffect } from 'react';

/**
 * Custom hook to detect media query matches (e.g. `(min-width: 768px)`).
 * Provides SSR safety and updates dynamically on viewport changes.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);
    const updateMatches = (e: MediaQueryListEvent | MediaQueryList) => {
      setMatches(e.matches);
    };

    setMatches(mediaQueryList.matches);

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', updateMatches);
      return () => mediaQueryList.removeEventListener('change', updateMatches);
    } else {
      mediaQueryList.addListener(updateMatches);
      return () => mediaQueryList.removeListener(updateMatches);
    }
  }, [query]);

  return matches;
}

export default useMediaQuery;
