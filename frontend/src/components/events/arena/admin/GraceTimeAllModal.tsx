import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@heroui/react';

interface GraceTimeAllModalProps {
  isOpen: boolean;
  isGrantingGraceAll: boolean;
  onClose: () => void;
  onGrantAll: (minutes: number) => Promise<void>;
}

export const GraceTimeAllModal: React.FC<GraceTimeAllModalProps> = memo(({
  isOpen,
  isGrantingGraceAll,
  onClose,
  onGrantAll,
}) => {
  const [graceAllMinutes, setGraceAllMinutes] = useState<number>(10);

  if (!isOpen) return null;

  const handleGrant = async () => {
    await onGrantAll(graceAllMinutes);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md rounded-2xl bg-surface border border-separator p-5 sm:p-6 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-separator pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Clock size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-label-primary">Grant Grace Time to All Candidates</h4>
                <p className="text-xs text-text-muted">
                  Extend round deadline & session duration for all students
                </p>
              </div>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white min-w-unit-8 w-8 h-8 cursor-pointer"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-400 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              All existing answers will be preserved!
            </p>
            <p className="text-text-muted text-[11px] leading-relaxed">
              This adds extra time to the round deadline and extends the countdown for all ongoing and auto-submitted candidates. Candidates can immediately re-enter and finish their work without losing any code or MCQ selections.
            </p>
          </div>

          {/* Time selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-label-primary block">
              Additional Minutes to Grant (All Candidates)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setGraceAllMinutes(mins)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    graceAllMinutes === mins
                      ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-surface-secondary text-label-secondary border-separator hover:border-amber-500/50 hover:text-amber-500'
                  }`}
                >
                  +{mins}m
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-label-secondary shrink-0">Custom minutes:</span>
              <input
                type="number"
                min={1}
                max={180}
                value={graceAllMinutes}
                onChange={(e) => setGraceAllMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-1.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-separator">
            <Button
              size="sm"
              variant="light"
              onPress={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-label-secondary hover:bg-white/10 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              color="warning"
              isLoading={isGrantingGraceAll}
              isDisabled={isGrantingGraceAll}
              startContent={!isGrantingGraceAll ? <Clock size={13} /> : undefined}
              onPress={handleGrant}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Grant +{graceAllMinutes}m to All
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

GraceTimeAllModal.displayName = 'GraceTimeAllModal';
