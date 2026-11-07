import { useState, useEffect } from 'react';
import useNetworkStatus from './useNetworkStatus';

export interface UseSlowNetworkOptions {
  /** Threshold in ms before flagging as slow (default: 3500ms) */
  thresholdMs?: number;
  /** Pass the loading flag of the current active request */
  isLoading: boolean;
}

export const useSlowNetwork = ({
  thresholdMs = 3500,
  isLoading,
}: UseSlowNetworkOptions) => {
  const [isSlow, setIsSlow] = useState(false);
  const { saveData, effectiveType } = useNetworkStatus();

  // If browser reports slow connection (2g/slow-2g) or saveData mode, flag earlier
  const isConstrainedConnection =
    saveData || effectiveType === '2g' || effectiveType === 'slow-2g';

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (isLoading) {
      const delay = isConstrainedConnection ? Math.min(thresholdMs, 2000) : thresholdMs;
      timer = setTimeout(() => {
        setIsSlow(true);
      }, delay);
    } else {
      setIsSlow(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, thresholdMs, isConstrainedConnection]);

  return { isSlow, isConstrainedConnection };
};

export default useSlowNetwork;
