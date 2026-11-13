import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import { Button } from '@heroui/react';

interface GraceTimeIndividualModalProps {
  graceModalSub: any | null;
  isGrantingGrace: boolean;
  onClose: () => void;
  onGrant: (submissionId: string, minutes: number, clearAnswers: boolean) => Promise<void>;
}

export const GraceTimeIndividualModal: React.FC<GraceTimeIndividualModalProps> = memo(({
  graceModalSub,
  isGrantingGrace,
  onClose,
  onGrant,
}) => {
  const [graceMinutesInput, setGraceMinutesInput] = useState<number>(10);
  const [graceClearAnswers, setGraceClearAnswers] = useState<boolean>(false);

  if (!graceModalSub) return null;

  const handleGrant = async () => {
    await onGrant(graceModalSub._id, graceMinutesInput, graceClearAnswers);
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
                <h4 className="text-sm font-bold text-label-primary">Grant Grace Time & Resume</h4>
                <p className="text-xs text-text-muted">
                  Candidate: <span className="text-label-primary font-semibold">{graceModalSub.userId?.name || 'Student'}</span> ({graceModalSub.userId?.rollNo || graceModalSub.userId?.email || 'N/A'})
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

          {/* Candidate Info Box */}
          <div className="p-3 rounded-xl bg-surface-secondary border border-separator text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-label-secondary">Current Status:</span>
              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                graceModalSub.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400' :
                graceModalSub.status === 'AUTO_SUBMITTED' ? 'bg-amber-500/15 text-amber-400' :
                graceModalSub.status === 'IN_PROGRESS' ? 'bg-blue-500/15 text-blue-400' :
                'bg-white/10 text-label-secondary'
              }`}>
                {graceModalSub.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-label-secondary">Current Grace Time:</span>
              <span className="text-label-primary font-mono font-bold">
                +{graceModalSub.graceMinutes || 0} mins
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-label-secondary">Integrity Status:</span>
              <span className={graceModalSub.isBlocked ? 'text-destructive font-bold' : 'text-emerald-500 font-medium'}>
                {graceModalSub.isBlocked ? 'Blocked (will be unblocked)' : 'Active / Allowed'}
              </span>
            </div>
          </div>

          {/* Time selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-label-primary block">
              Additional Minutes to Grant
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setGraceMinutesInput(mins)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    graceMinutesInput === mins
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
                value={graceMinutesInput}
                onChange={(e) => setGraceMinutesInput(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-1.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Preservation Option */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
            <div className="flex items-start gap-2.5">
              <input
                type="radio"
                id="keepAnswersRadio"
                name="graceAnswerOption"
                checked={!graceClearAnswers}
                onChange={() => setGraceClearAnswers(false)}
                className="mt-0.5 accent-emerald-500 cursor-pointer"
              />
              <label htmlFor="keepAnswersRadio" className="text-xs cursor-pointer">
                <span className="font-bold text-emerald-400 block">
                  Keep previously submitted answers (Recommended)
                </span>
                <span className="text-text-muted text-[11px] leading-relaxed block">
                  All MCQ selections, coding drafts/submissions, and design links remain intact. The student resumes right where they left off.
                </span>
              </label>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
              <input
                type="radio"
                id="clearAnswersRadio"
                name="graceAnswerOption"
                checked={graceClearAnswers}
                onChange={() => setGraceClearAnswers(true)}
                className="mt-0.5 accent-destructive cursor-pointer"
              />
              <label htmlFor="clearAnswersRadio" className="text-xs cursor-pointer">
                <span className="font-bold text-destructive block">
                  Clear all answers (Fresh Restart)
                </span>
                <span className="text-text-muted text-[11px] leading-relaxed block">
                  Wipes all MCQ and coding solutions for a completely fresh attempt.
                </span>
              </label>
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
              isLoading={isGrantingGrace}
              isDisabled={isGrantingGrace}
              startContent={!isGrantingGrace ? <Clock size={13} /> : undefined}
              onPress={handleGrant}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Grant +{graceMinutesInput}m & Resume
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

GraceTimeIndividualModal.displayName = 'GraceTimeIndividualModal';
