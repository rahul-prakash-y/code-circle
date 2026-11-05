/**
 * Device and viewport detection utilities for proctoring and responsive layouts.
 * Specifically designed to differentiate mobile devices and mobile screen viewports
 * from desktop workstations to prevent false-positive tab-switch / anti-cheat warnings
 * during incoming cellular calls, VoIP interruptions, and mobile OS system dialogs.
 */

export const isMobileScreenOrDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  // 1. Mobile & tablet user agent detection
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
    ua
  );

  // 2. Touch screen hardware detection
  const hasTouch =
    'ontouchstart' in window ||
    Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    Boolean((navigator as any).msMaxTouchPoints && (navigator as any).msMaxTouchPoints > 0);

  // 3. Compact viewport width check (covers mobile phones and tablets up to 1024px)
  const isCompactViewport =
    window.innerWidth <= 1024 ||
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 1024px)').matches);

  // A device is considered mobile if:
  // - It has a mobile User Agent string, OR
  // - It is a touch device with a compact/tablet screen, OR
  // - The active screen viewport is in mobile/compact view (<= 1024px)
  return Boolean(isMobileUA || (hasTouch && isCompactViewport) || isCompactViewport);
};

export default isMobileScreenOrDevice;
