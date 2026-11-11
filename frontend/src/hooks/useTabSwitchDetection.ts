import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';

export interface UseTabSwitchDetectionOptions {
  eventId: string;
  enabled?: boolean;
  initialIsBlocked?: boolean;
  onBlocked?: () => void;
}

export interface UseTabSwitchDetectionReturn {
  isBlocked: boolean;
  blockedMessage: string;
  isTriggering: boolean;
  blockStudent: (reason?: string) => Promise<void>;
  unblockStudent: (studentId?: string) => Promise<void>;
  checkIfUnblocked: () => Promise<boolean>;
  resetBlocked: () => void;
  setIsBlocked: (val: boolean) => void;
}

export const PERMANENT_BLOCK_MESSAGE =
  'You have been blocked for navigating away. Contact Admin.';

/**
 * useTabSwitchDetection
 * Monitors `document.visibilitychange`. If `document.hidden` becomes true while taking a test,
 * immediately fires `/api/events/:eventId/block-student`, locks the local UI, and sets a permanent error state.
 */
export const useTabSwitchDetection = ({
  eventId,
  enabled = true,
  initialIsBlocked = false,
  onBlocked,
}: UseTabSwitchDetectionOptions): UseTabSwitchDetectionReturn => {
  const [isBlocked, setIsBlocked] = useState<boolean>(initialIsBlocked);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const hasTriggeredRef = useRef<boolean>(initialIsBlocked);

  // Sync initial blocked state if it arrives asynchronously
  useEffect(() => {
    if (initialIsBlocked && !isBlocked) {
      setIsBlocked(true);
      hasTriggeredRef.current = true;
    }
  }, [initialIsBlocked, isBlocked]);

  const blockStudent = useCallback(
    async (reason = 'Tab switch or window navigation detected'): Promise<void> => {
      if (!eventId || hasTriggeredRef.current) return;

      hasTriggeredRef.current = true;
      setIsBlocked(true);
      setIsTriggering(true);

      try {
        await api.post(`/events/${eventId}/block-student`, { reason });
      } catch (err: any) {
        console.error('[Anti-Cheat] Failed to send block request to backend:', err);
      } finally {
        setIsTriggering(false);
      }

      toast.error(PERMANENT_BLOCK_MESSAGE, {
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
    [eventId, onBlocked]
  );

  const unblockStudent = useCallback(
    async (studentId?: string): Promise<void> => {
      if (!eventId) return;

      try {
        await api.post(`/events/${eventId}/unblock-student`, { studentId });
        setIsBlocked(false);
        hasTriggeredRef.current = false;
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
        blockStudent('Navigated away or switched tab');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, eventId, isBlocked, blockStudent]);

  return {
    isBlocked,
    blockedMessage: PERMANENT_BLOCK_MESSAGE,
    isTriggering,
    blockStudent,
    unblockStudent,
    checkIfUnblocked,
    resetBlocked,
    setIsBlocked,
  };
};

export default useTabSwitchDetection;

