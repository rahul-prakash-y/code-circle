import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, ShieldAlert, Lock, AlertTriangle, ArrowRight } from 'lucide-react';
import { EmilCard, EmilButton } from '../ui/emil-ui';
import { useFullScreenEnforcement } from '../../hooks/useFullScreenEnforcement';
import { useTabSwitchDetection, PERMANENT_BLOCK_MESSAGE } from '../../hooks/useTabSwitchDetection';
import { EMIL_EASE_OUT, DURATION_MODAL, DURATION_MICRO } from '../../lib/motion';

export interface AssessmentAntiCheatGuardProps {
  eventId: string;
  isTakingTest: boolean;
  initialIsBlocked?: boolean;
  children: React.ReactNode;
  onExit?: () => void;
  className?: string;
}

/**
 * AssessmentAntiCheatGuard
 * Strictly enforces full-screen execution and proctored tab-switch deterrence.
 *
 * 1. Fullscreen Enforcement:
 *    If `!document.fullscreenElement`, renders a blocking EmilCard overlay
 *    (backdrop-blur-3xl, absolute/fixed z-50 over the whole screen) with an EmilButton
 *    saying "Enter Full Screen to Continue". All assessment content is hidden underneath.
 *
 * 2. Tab Switch Lockout:
 *    If the student navigates away or hides the window while taking a test,
 *    triggers /api/events/:eventId/block-student and locks into permanent error state:
 *    "You have been blocked for navigating away. Contact Admin."
 */
export const AssessmentAntiCheatGuard: React.FC<AssessmentAntiCheatGuardProps> = ({
  eventId,
  isTakingTest,
  initialIsBlocked = false,
  children,
  onExit,
  className = '',
}) => {
  const { isFullscreen, requestFullscreen } = useFullScreenEnforcement();

  const { isBlocked } = useTabSwitchDetection({
    eventId,
    enabled: isTakingTest && isFullscreen,
    initialIsBlocked,
  });

  return (
    <div className={`relative w-full h-full min-h-[500px] overflow-hidden ${className}`}>
      {/* ══════════════════════════════════════════════════════════════
          1. PERMANENT LOCKED STATE (If student navigated away / cheated)
          ══════════════════════════════════════════════════════════════ */}
      {isBlocked ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-3xl bg-black/90  select-none">
          <EmilCard
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DURATION_MODAL, ease: EMIL_EASE_OUT }}
            className="w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-red-500/20 bg-surface text-white shadow-[0_25px_60px_-15px_rgba(239,68,68,0.25)] text-center relative overflow-hidden"
          >
            {/* Ambient Red Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 text-red-500 shadow-inner">
              <ShieldAlert size={36} className="animate-pulse" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 mb-3">
              <Lock size={12} /> Proctoring Violation
            </span>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              Assessment Locked
            </h2>

            <p className="text-sm font-medium text-red-400/95 mb-6 px-2">
              {PERMANENT_BLOCK_MESSAGE}
            </p>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-left text-xs text-white/60 mb-6 space-y-2">
              <div className="flex justify-between items-center text-white/80">
                <span>Security Engine</span>
                <span className="font-mono text-emerald-400">Strict Enforcement Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Violation Type</span>
                <span className="font-mono text-red-400">Tab Switch / Blur</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Event Target</span>
                <span className="font-mono text-white/70 truncate max-w-[180px]">{eventId}</span>
              </div>
            </div>

            {onExit && (
              <EmilButton
                variant="flat"
                size="md"
                onClick={onExit}
                className="w-full text-white/80 hover:text-white"
              >
                Return to Overview
              </EmilButton>
            )}
          </EmilCard>
        </div>
      ) : !isFullscreen && isTakingTest ? (
        /* ══════════════════════════════════════════════════════════════
           2. FULL-SCREEN ENFORCEMENT OVERLAY
           (Active whenever fullscreen is exited during a test)
           ══════════════════════════════════════════════════════════════ */
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-3xl bg-black/75 dark:bg-canvas/90 select-none"
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
                Full Screen Required
              </h3>

              <p className="text-xs sm:text-sm text-label-secondary  mb-6 leading-relaxed">
                To guarantee assessment integrity, this test workspace must be taken in full screen mode.
                Exiting full screen or navigating to another application will block your attempt.
              </p>

              <EmilButton
                variant="solid"
                size="lg"
                onClick={requestFullscreen}
                className="w-full font-semibold shadow-md gap-2"
              >
                <span>Enter Full Screen to Continue</span>
                <ArrowRight size={16} />
              </EmilButton>
            </EmilCard>
          </motion.div>
        </AnimatePresence>
      ) : (
        /* ══════════════════════════════════════════════════════════════
           3. ASSESSMENT WORKSPACE (Rendered safely when in fullscreen)
           ══════════════════════════════════════════════════════════════ */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: DURATION_MODAL, ease: EMIL_EASE_OUT }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

export default AssessmentAntiCheatGuard;

