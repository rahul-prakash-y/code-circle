import { useState, useEffect, useCallback, useRef } from 'react';
import { isMobileScreenOrDevice } from '../lib/deviceUtils';
import toast from 'react-hot-toast';

const useAntiCheat = (maxWarnings = 3, onLock) => {
  const [warnings, setWarnings] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const wasInterruptedRef = useRef(false);

  const handleVisibilityChange = useCallback(() => {
    // Exempt mobile screens and mobile phones from tab-switch lockouts
    // Incoming phone calls and system dialogs trigger visibility change
    if (isMobileScreenOrDevice()) {
      if (document.visibilityState === 'visible' && wasInterruptedRef.current) {
        wasInterruptedRef.current = false;
        toast('Call / interruption detected. Protected mode: Warning count unchanged.', {
          id: 'mobile-call-protection-toast',
          duration: 3500,
          style: {
            background: '#1C1C1E',
            color: '#34D399',
            border: '1px solid rgba(52, 211, 153, 0.3)',
          },
        });
      } else if (document.visibilityState === 'hidden') {
        wasInterruptedRef.current = true;
      }
      return;
    }

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

