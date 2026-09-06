import React from 'react';
import useThemeStore from '../../store/useThemeStore';

/**
 * Apple-spec background: flat canvas color only.
 * Minimal single blue tone in dark mode, pure flat in light.
 * NO purple, NO pink, NO violet, NO visible gradients.
 */
const BackgroundGradient = () => {
  const { theme } = useThemeStore();

  return (
    <div
      className="fixed inset-0 -z-20"
      style={{ backgroundColor: 'var(--canvas)' }}
    >
      {theme === 'dark' ? (
        /* Dark: single very subtle blue bleed — top-left only, barely perceptible */
        <div
          className="absolute top-0 left-0 w-[50%] h-[40%] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top left, rgba(41,151,255,0.05) 0%, transparent 70%)',
          }}
        />
      ) : (
        /* Light: pure #F5F5F7 — Apple off-white, no color contamination */
        null
      )}
    </div>
  );
};

export default BackgroundGradient;
