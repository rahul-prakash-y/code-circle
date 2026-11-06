import { useState, useEffect, useCallback } from 'react';

export interface UseFullScreenEnforcementReturn {
  isFullscreen: boolean;
  isSupported: boolean;
  requestFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
}

/**
 * useFullScreenEnforcement
 * Enforces fullscreen browser mode during proctored assessments.
 * Uses `document.documentElement.requestFullscreen()` and listens to `fullscreenchange`.
 */
export const useFullScreenEnforcement = (options?: {
  onExitFullscreen?: () => void;
  onEnterFullscreen?: () => void;
  autoEnforce?: boolean;
}): UseFullScreenEnforcementReturn => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return Boolean(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  });

  const isSupported =
    typeof document !== 'undefined' &&
    Boolean(
      document.documentElement.requestFullscreen ||
      (document.documentElement as any).webkitRequestFullscreen ||
      (document.documentElement as any).mozRequestFullScreen ||
      (document.documentElement as any).msRequestFullscreen
    );

  const requestFullscreen = useCallback(async (): Promise<void> => {
    if (typeof document === 'undefined') return;

    const docEl = document.documentElement as any;
    try {
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }
    } catch (err) {
      console.warn('[FullScreenEnforcement] Failed to enter fullscreen:', err);
    }
  }, []);

  const exitFullscreen = useCallback(async (): Promise<void> => {
    if (typeof document === 'undefined') return;

    const doc = document as any;
    try {
      if (
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      ) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('[FullScreenEnforcement] Failed to exit fullscreen:', err);
    }
  }, []);

  const toggleFullscreen = useCallback(async (): Promise<void> => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await requestFullscreen();
    }
  }, [isFullscreen, exitFullscreen, requestFullscreen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleFullscreenChange = () => {
      const active = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      setIsFullscreen(active);

      if (active) {
        options?.onEnterFullscreen?.();
      } else {
        options?.onExitFullscreen?.();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [options]);

  useEffect(() => {
    if (options?.autoEnforce && !isFullscreen) {
      requestFullscreen().catch(() => {});
    }
  }, [options?.autoEnforce, isFullscreen, requestFullscreen]);

  return {
    isFullscreen,
    isSupported,
    requestFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
};

export default useFullScreenEnforcement;
