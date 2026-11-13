import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, X, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button, Link } from '@heroui/react';

interface DesignEvaluationModalProps {
  evaluatingSub: any | null;
  totalPoints: number;
  actionLoading: boolean;
  onClose: () => void;
  onSave: (points: number, feedback: string) => Promise<void>;
}

export const DesignEvaluationModal: React.FC<DesignEvaluationModalProps> = memo(({
  evaluatingSub,
  totalPoints,
  actionLoading,
  onClose,
  onSave,
}) => {
  const [evalPoints, setEvalPoints] = useState<number>(0);
  const [evalFeedback, setEvalFeedback] = useState<string>('');

  useEffect(() => {
    if (evaluatingSub) {
      setEvalPoints(evaluatingSub.designSubmission?.pointsEarned || 0);
      setEvalFeedback(evaluatingSub.designSubmission?.feedback || '');
    } else {
      setEvalPoints(0);
      setEvalFeedback('');
    }
  }, [evaluatingSub]);

  if (!evaluatingSub) return null;

  const handleSave = async () => {
    await onSave(evalPoints, evalFeedback);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-surface border border-separator p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-separator pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Award size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-label-primary ">Evaluate Figma Design</h4>
                <p className="text-xs text-text-muted">
                  Student: <span className="text-label-primary font-semibold">{evaluatingSub.userId?.name}</span> ({evaluatingSub.userId?.rollNo || evaluatingSub.userId?.email})
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

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Submitted Figma Link:</span>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                href={evaluatingSub.designSubmission?.figmaLink}
                className="text-pink-400 hover:text-pink-300 font-mono underline inline-flex items-center gap-1"
              >
                <span>Open Figma</span>
                <ExternalLink size={11} />
              </Link>
            </div>
            {evaluatingSub.designSubmission?.notes && (
              <div className="pt-1 text-xs">
                <span className="text-text-muted block text-[10px] uppercase font-bold tracking-wider mb-0.5">Student Notes:</span>
                <p className="text-label-secondary bg-white/5 p-2 rounded-lg text-[11px] leading-relaxed">
                  {evaluatingSub.designSubmission.notes}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-label-primary ">Awarded Points</label>
                <span className="text-xs font-mono font-bold text-pink-400">
                  {evalPoints} / {totalPoints || 100} pts
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={totalPoints || 100}
                value={evalPoints}
                onChange={(e) => setEvalPoints(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted font-mono mt-1">
                <span>0 pts</span>
                <span>{Math.round((totalPoints || 100) / 2)} pts</span>
                <span>{totalPoints || 100} pts</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-label-primary mb-1.5">
                Reviewer Feedback / Comments
              </label>
              <textarea
                rows={3}
                value={evalFeedback}
                onChange={(e) => setEvalFeedback(e.target.value)}
                placeholder="e.g. Excellent layout spacing, responsive auto-layout implemented cleanly. Typography hierarchy is on point!"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-pink-500 outline-none resize-none leading-relaxed"
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
              color="secondary"
              isDisabled={actionLoading}
              isLoading={actionLoading}
              startContent={!actionLoading ? <CheckCircle2 size={13} /> : undefined}
              onPress={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30 cursor-pointer"
            >
              Save Evaluation
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

DesignEvaluationModal.displayName = 'DesignEvaluationModal';
