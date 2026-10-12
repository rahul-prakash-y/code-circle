import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';

export interface IntegrityEvent {
  type: string;
  timestamp: string;
  warningNumber: number;
  details?: Record<string, any>;
}

interface UseVisibilityChangeOptions {
  maxWarnings?: number;
  isActive?: boolean;
  problemId?: string;
  onLockTriggered?: (events: IntegrityEvent[]) => void;
}

export const useVisibilityChange = ({
  maxWarnings = 3,
  isActive = true,
  problemId,
  onLockTriggered,
}: UseVisibilityChangeOptions = {}) => {
  const [warnings, setWarnings] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [integrityEvents, setIntegrityEvents] = useState<IntegrityEvent[]>([]);

  // Keep ref to latest onLockTriggered to prevent stale closures in event listeners
  const onLockRef = useRef(onLockTriggered);
  onLockRef.current = onLockTriggered;

  const logIntegrityEvent = useCallback(
    async (warningNum: number, currentEvents: IntegrityEvent[]) => {
      if (!problemId) return;
      try {
        await api.post('/assessments/code/integrity-event', {
          problemId,
          type: 'VISIBILITY_CHANGE',
          warningNumber: warningNum,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        // Deterrent log failures shouldn't interrupt student workflow
        console.warn('[IntegrityAudit] Failed to send audit event:', err);
      }
    },
    [problemId]
  );

  const handleVisibilityChange = useCallback(() => {
    if (!isActive || isLocked) return;

    if (document.hidden) {
      setWarnings((prev) => {
        const next = prev + 1;
        const newEvent: IntegrityEvent = {
          type: 'VISIBILITY_CHANGE',
          timestamp: new Date().toISOString(),
          warningNumber: next,
          details: {
            visibilityState: document.visibilityState,
            userAgent: navigator.userAgent,
          },
        };

        const updatedEvents = [...integrityEvents, newEvent];
        setIntegrityEvents(updatedEvents);

        // Dispatched deterrent notification
        if (next === 1) {
          toast(
            `Warning 1/${maxWarnings}: Assessment window changed. Please return to the assessment.`,
            {
              icon: '⚠️',
              duration: 4500,
              style: {
                background: '#1C1C1E',
                color: '#FF9F0A',
                border: '1px solid rgba(255, 159, 10, 0.3)',
              },
            }
          );
        } else if (next === 2) {
          toast(
            `Warning 2/${maxWarnings}: Leaving the assessment window again will submit your assessment.`,
            {
              icon: '🚨',
              duration: 5000,
              style: {
                background: '#1C1C1E',
                color: '#FF453A',
                border: '1px solid rgba(255, 69, 58, 0.4)',
              },
            }
          );
        } else if (next >= maxWarnings) {
          setIsLocked(true);
          toast.error(
            `Warning ${maxWarnings}/${maxWarnings}: Final warning exceeded. Submitting and locking workspace.`,
            {
              duration: 6000,
            }
          );
          if (onLockRef.current) {
            onLockRef.current(updatedEvents);
          }
        }

        // Fire-and-forget server audit log
        logIntegrityEvent(next, updatedEvents);

        return next;
      });
    }
  }, [isActive, isLocked, maxWarnings, integrityEvents, logIntegrityEvent]);

  useEffect(() => {
    if (!isActive || isLocked) return;

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange, isActive, isLocked]);

  const resetWarnings = useCallback(() => {
    setWarnings(0);
    setIsLocked(false);
    setIntegrityEvents([]);
  }, []);

  const manuallyLock = useCallback(() => {
    setIsLocked(true);
  }, []);

  return {
    warnings,
    isLocked,
    integrityEvents,
    resetWarnings,
    manuallyLock,
  };
};

export default useVisibilityChange;
