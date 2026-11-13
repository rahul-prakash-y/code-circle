import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';

export interface UseTabSwitchDetectionOptions {
  eventId: string;
  enabled?: boolean;
  initialIsBlocked?: boolean;
  initialTabSwitchCount?: number;
  maxStrikes?: number;
  onBlocked?: () => void;
  onStrike?: (count: number, maxStrikes: number) => void;
}

export interface UseTabSwitchDetectionReturn {
  isBlocked: boolean;
  blockedMessage: string;
  isTriggering: boolean;
  tabSwitchCount: number;
  maxStrikes: number;
  showWarning: boolean;
  setShowWarning: (show: boolean) => void;
  blockStudent: (reason?: string) => Promise<void>;
  unblockStudent: (studentId?: string) => Promise<void>;
  checkIfUnblocked: () => Promise<boolean>;
  resetBlocked: () => void;
  setIsBlocked: (val: boolean) => void;
  setTabSwitchCount: React.Dispatch<React.SetStateAction<number>>;
}

export const PERMANENT_BLOCK_MESSAGE =
  'You have been blocked for navigating away. Contact Admin.';

/**
 * useTabSwitchDetection
 * Monitors `document.visibilitychange`. If `document.hidden` becomes true while taking a test,
 * tracks tab switch strikes up to `maxStrikes` (default: 3).
 * Strikes 1 to (maxStrikes - 1) show warning dialogs and record strikes.
 * Upon reaching maxStrikes (3), immediately fires `/api/events/:eventId/block-student`,
 * locks the local UI, and sets a permanent blocked state.
 */
export const useTabSwitchDetection = ({
  eventId,
  enabled = true,
  initialIsBlocked = false,
  initialTabSwitchCount = 0,
  maxStrikes = 3,
  onBlocked,
  onStrike,
}: UseTabSwitchDetectionOptions): UseTabSwitchDetectionReturn => {
  const [isBlocked, setIsBlocked] = useState<boolean>(initialIsBlocked);
  const [blockedMessage, setBlockedMessage] = useState<string>(PERMANENT_BLOCK_MESSAGE);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(initialTabSwitchCount);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const hasTriggeredRef = useRef<boolean>(initialIsBlocked);
  const lastTriggerTimeRef = useRef<number>(0);

  // Sync initial blocked state if it arrives asynchronously
  useEffect(() => {
    if (initialIsBlocked && !isBlocked) {
      setIsBlocked(true);
      hasTriggeredRef.current = true;
    }
  }, [initialIsBlocked, isBlocked]);

  const blockStudent = useCallback(
    async (reason = `Exceeded maximum ${maxStrikes} tab switch violations`): Promise<void> => {
      if (!eventId || hasTriggeredRef.current) return;

      hasTriggeredRef.current = true;
      setIsBlocked(true);
      setShowWarning(false);
      setBlockedMessage(reason || PERMANENT_BLOCK_MESSAGE);
      setIsTriggering(true);

      try {
        await api.post(`/events/${eventId}/block-student`, { reason });
      } catch (err: any) {
        console.error('[Anti-Cheat] Failed to send block request to backend:', err);
      } finally {
        setIsTriggering(false);
      }

      toast.error(reason || PERMANENT_BLOCK_MESSAGE, {
        id: 'anti-cheat-permanent-blocked',
        duration: 10000,
        style: {
          background: 'var(--surface)',
          color: 'var(--destructive)',
          border: '1px solid var(--destructive-subtle)',
          boxShadow: 'var(--shadow-xl)',
        },
      });

      onBlocked?.();
    },
    [eventId, maxStrikes, onBlocked]
  );

  const unblockStudent = useCallback(
    async (studentId?: string): Promise<void> => {
      if (!eventId) return;

      try {
        await api.post(`/events/${eventId}/unblock-student`, { studentId });
        setIsBlocked(false);
        hasTriggeredRef.current = false;
        setTabSwitchCount(0);
        setShowWarning(false);
        toast.success('Student unblocked successfully.');
      } catch (err: any) {
        console.error('[Anti-Cheat] Failed to unblock student:', err);
        toast.error(err.response?.data?.error || 'Failed to unblock student');
      }
    },
    [eventId]
  );

  const checkIfUnblocked = useCallback(async (): Promise<boolean> => {
    if (!eventId) return false;
    try {
      const res = await api.get(`/events/${eventId}/anti-cheat/status`);
      if (res.data?.success && res.data.isBlocked === false) {
        setIsBlocked(false);
        hasTriggeredRef.current = false;
        setTabSwitchCount(0);
        setShowWarning(false);
        toast.success('Your assessment attempt has been unblocked! You may now resume.');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [eventId]);

  const resetBlocked = useCallback(() => {
    setIsBlocked(false);
    hasTriggeredRef.current = false;
    setTabSwitchCount(0);
    setShowWarning(false);
  }, []);

  // Poll backend status periodically while blocked so student screen unlocks as soon as admin clicks Unblock
  useEffect(() => {
    if (!isBlocked || !eventId) return;

    const intervalId = setInterval(async () => {
      await checkIfUnblocked();
    }, 3500);

    return () => clearInterval(intervalId);
  }, [isBlocked, eventId, checkIfUnblocked]);

  useEffect(() => {
    if (!enabled || !eventId || isBlocked) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !hasTriggeredRef.current) {
        const now = Date.now();
        // Debounce against rapid firing
        if (now - lastTriggerTimeRef.current < 1000) return;
        lastTriggerTimeRef.current = now;

        setTabSwitchCount((prev) => {
          const nextCount = prev + 1;
          onStrike?.(nextCount, maxStrikes);

          if (nextCount >= maxStrikes) {
            setShowWarning(false);
            blockStudent(`Exceeded maximum ${maxStrikes} tab switch violations`);
          } else {
            setShowWarning(true);
            toast.error(
              `Security Warning: Strike ${nextCount} of ${maxStrikes}! Tab switching is restricted.`,
              {
                id: 'anti-cheat-strike-warning',
                duration: 6000,
                style: {
                  background: 'var(--surface)',
                  color: 'var(--warning)',
                  border: '1px solid var(--warning-subtle)',
                },
              }
            );
          }
          return nextCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, eventId, isBlocked, maxStrikes, blockStudent, onStrike]);

  return {
    isBlocked,
    blockedMessage,
    isTriggering,
    tabSwitchCount,
    maxStrikes,
    showWarning,
    setShowWarning,
    blockStudent,
    unblockStudent,
    checkIfUnblocked,
    resetBlocked,
    setIsBlocked,
    setTabSwitchCount,
  };
};

export default useTabSwitchDetection;
