import { useState, useEffect, useCallback } from 'react';

const useAntiCheat = (maxWarnings = 3, onLock) => {
  const [warnings, setWarnings] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden' && !isLocked) {
      setWarnings((prev) => {
        const newWarnings = prev + 1;
        if (newWarnings >= maxWarnings) {
          setIsLocked(true);
          if (onLock) onLock();
        }
        return newWarnings;
      });
    }
  }, [isLocked, maxWarnings, onLock]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  const resetWarnings = () => {
    setWarnings(0);
    setIsLocked(false);
  };

  return { warnings, isLocked, resetWarnings };
};

export default useAntiCheat;
