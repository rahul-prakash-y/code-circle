import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { isMobileScreenOrDevice } from '../lib/deviceUtils';

export interface IntegrityEvent {
  type: string;
  timestamp: string;
  warningNumber: number;
  details?: Record<string, any>;
}

export interface UseVisibilityChangeOptions {
  maxWarnings?: number;
  isActive?: boolean;
  problemId?: string;
  context?: 'assessment' | 'contest';
  exemptMobile?: boolean; // Default true: protects mobile phones and screens from phone-call tab switch warnings
  onLockTriggered?: (events: IntegrityEvent[]) => void;
}

export const useVisibilityChange = ({
  maxWarnings = 3,
  isActive = true,
  problemId,
  context = 'assessment',
  exemptMobile = true,
  onLockTriggered,
}: UseVisibilityChangeOptions = {}) => {
  const [warnings, setWarnings] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [integrityEvents, setIntegrityEvents] = useState<IntegrityEvent[]>([]);
  const [isMobileProtected, setIsMobileProtected] = useState<boolean>(() => isMobileScreenOrDevice());
  const wasInterruptedRef = useRef<boolean>(false);

  // Keep ref to latest onLockTriggered to prevent stale closures in event listeners
  const onLockRef = useRef(onLockTriggered);
  onLockRef.current = onLockTriggered;

  // Dynamically update mobile protection on resize or orientation change
  useEffect(() => {
    const handleDeviceCheck = () => {
      setIsMobileProtected(isMobileScreenOrDevice());
    };
    handleDeviceCheck();
    window.addEventListener('resize', handleDeviceCheck);
    window.addEventListener('orientationchange', handleDeviceCheck);
    return () => {
      window.removeEventListener('resize', handleDeviceCheck);
      window.removeEventListener('orientationchange', handleDeviceCheck);
    };
  }, []);

  const logIntegrityEvent = useCallback(
    async (warningNum: number, _currentEvents: IntegrityEvent[]) => {
      try {
        if (problemId) {
          await api.post('/assessments/code/integrity-event', {
            problemId,
            type: 'VISIBILITY_CHANGE',
            warningNumber: warningNum,
            timestamp: new Date().toISOString(),
          });
        }

        // Call universal integrity violation route to enforce restriction when warnings >= 3
        await api.post('/users/integrity-violation', {
          context: context || 'assessment',
          details: `Tab switch detected (${warningNum}/${maxWarnings}) in ${context} session.`,
          warningCount: warningNum,
        });
      } catch (err) {
        // Deterrent log failures shouldn't interrupt student workflow
        console.warn('[IntegrityAudit] Failed to send audit event:', err);
      }
    },
    [problemId, context, maxWarnings]
  );

  const handleVisibilityChange = useCallback(() => {
    if (!isActive || isLocked) return;

    const isMobileMode = exemptMobile && (isMobileProtected || isMobileScreenOrDevice());

    if (document.hidden) {
      if (isMobileMode) {
        // Mobile screen protection: Incoming phone calls, WhatsApp calls, and system overlays
        // cause the browser window to be backgrounded. Do NOT increment warnings or lock workspace!
        wasInterruptedRef.current = true;
        return;
      }

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
            `Warning 1/${maxWarnings}: Window switch detected. Tab switching is strictly prohibited!`,
            {
              icon: '⚠️',
              duration: 5000,
              style: {
                background: '#1C1C1E',
                color: '#FF9F0A',
                border: '1px solid rgba(255, 159, 10, 0.3)',
              },
            }
          );
        } else if (next === 2) {
          toast(
            `Warning 2/${maxWarnings}: Final warning! 1 more tab switch will BLOCK your account from all assessments & contests.`,
            {
              icon: '🚨',
              duration: 6000,
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
            `Warning 3/3 reached: You have been BLOCKED from attending assessments and contests. An admin must unblock your account.`,
            {
              duration: 8000,
            }
          );
          if (onLockRef.current) {
            onLockRef.current(updatedEvents);
          }
        }

        // Fire server audit log and restriction enforcement
        logIntegrityEvent(next, updatedEvents);

        return next;
      });
    } else {
      // Document returned to active/visible state
      if (isMobileMode && wasInterruptedRef.current) {
        wasInterruptedRef.current = false;
        toast(
          'Incoming call / interruption detected. Protected mode: Warning count unchanged.',
          {
            id: 'mobile-call-protection-toast',
            duration: 3500,
            style: {
              background: '#1C1C1E',
              color: '#34D399',
              border: '1px solid rgba(52, 211, 153, 0.3)',
            },
          }
        );
      }
    }
  }, [isActive, isLocked, exemptMobile, isMobileProtected, maxWarnings, integrityEvents, logIntegrityEvent]);

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
    isMobileProtected,
    resetWarnings,
    manuallyLock,
  };
};

export default useVisibilityChange;

