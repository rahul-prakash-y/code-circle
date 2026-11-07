import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, AlertTriangle, ArrowRight } from 'lucide-react';
import { EmilCard, EmilButton } from '../ui/emil-ui';
import { EMIL_EASE_OUT, DURATION_MODAL, DURATION_MICRO } from '../../lib/motion';

export interface FullScreenEnforcementOverlayProps {
  isFullscreen: boolean;
  onRequestFullscreen: () => void | Promise<void>;
  title?: string;
  description?: string;
  buttonText?: string;
  className?: string;
}

/**
 * FullScreenEnforcementOverlay
 * Strictly renders a blocking EmilCard overlay (backdrop-blur-3xl, absolute z-50 over the whole screen)
 * with an EmilButton saying "Enter Full Screen to Continue".
 * Hides all assessment content underneath while fullscreen is not active.
 */
export const FullScreenEnforcementOverlay: React.FC<FullScreenEnforcementOverlayProps> = ({
  isFullscreen,
  onRequestFullscreen,
  title = 'Full Screen Required',
  description = 'To ensure testing integrity and proctoring compliance, this assessment must be completed in full screen mode. Navigating away or exiting full screen will flag and block your attempt.',
  buttonText = 'Enter Full Screen to Continue',
  className = '',
}) => {
  if (isFullscreen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
        className={`fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 backdrop-blur-3xl bg-black/85 select-none ${className}`}
      >
        <EmilCard
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: DURATION_MODAL, ease: EMIL_EASE_OUT }}
          className="w-full max-w-md p-6 sm:p-8 rounded-3xl border border-separator bg-surface shadow-2xl text-center relative"
        >
          <div className="mx-auto w-14 h-14 rounded-2xl bg-accent-subtle border border-accent/20 flex items-center justify-center mb-5 text-accent">
            <Maximize2 size={28} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-warning-subtle text-warning border border-warning/20 mb-3">
            <AlertTriangle size={12} /> Proctoring Requirement
          </div>

          <h3 className="text-xl font-bold tracking-tight text-label-primary mb-2">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-label-secondary  mb-6 leading-relaxed">
            {description}
          </p>

          <EmilButton
            variant="solid"
            size="lg"
            onClick={async () => {
              try {
                if (onRequestFullscreen) {
                  await onRequestFullscreen();
                } else if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
                  await document.documentElement.requestFullscreen();
                }
              } catch (err) {
                console.warn('[FullScreenEnforcement] Failed to request fullscreen:', err);
              }
            }}
            className="w-full font-semibold shadow-md gap-2 cursor-pointer"
          >
            <span>{buttonText}</span>
            <ArrowRight size={16} />
          </EmilButton>
        </EmilCard>
      </motion.div>
    </AnimatePresence>
  );
};

export default FullScreenEnforcementOverlay;

