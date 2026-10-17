import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  Award,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  User,
} from 'lucide-react';
import useContestStore, { LeaderboardEntry } from '../../../store/useContestStore';

interface AllocatePointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestId: string;
  entry: LeaderboardEntry | null;
  onSuccess?: () => void;
}

export const AllocatePointsModal: React.FC<AllocatePointsModalProps> = ({
  isOpen,
  onClose,
  contestId,
  entry,
  onSuccess,
}) => {
  const { allocateSubmissionPoints } = useContestStore();
  const [points, setPoints] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [mode, setMode] = useState<'direct' | 'bonus'>('direct');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (entry) {
      setPoints(entry.awardedClubPoints ?? entry.totalScore ?? 0);
      setReason(entry.manualPointsReason || '');
      setMode('direct');
    }
  }, [entry]);

  if (!isOpen || !entry) return null;

  const currentAwarded = entry.awardedClubPoints ?? 0;
  const targetAwarded = mode === 'direct' ? Number(points) || 0 : currentAwarded + (Number(points) || 0);
  const delta = targetAwarded - currentAwarded;

  const quickReasons = [
    'Optimal time & space complexity',
    'Clean code architecture & naming',
    'Creative algorithmic solution',
    'Contest podium bonus reward',
    'Manual evaluation approved',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload =
        mode === 'direct'
          ? { awardedClubPoints: Number(points) || 0, reason }
          : { bonusPoints: Number(points) || 0, reason };

      const ok = await allocateSubmissionPoints(contestId, entry.submissionId, payload);
      if (ok) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-surface border border-separator rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-separator flex items-start sm:items-center justify-between gap-3 bg-surface-secondary">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Zap size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold text-label-primary tracking-tight break-words">
                  Manual Point Allocation
                </h3>
                <p className="text-[11px] sm:text-xs text-label-tertiary truncate">
                  Award or adjust student club merit points for this contest
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-label-secondary hover:text-label-primary rounded-xl hover:bg-surface transition-colors cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
            {/* Student Spotlight */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-secondary border border-separator flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/20 text-sm shrink-0">
                  {entry.user?.name ? entry.user.name.charAt(0).toUpperCase() : <User size={16} />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-label-primary truncate">{entry.user?.name || 'Student'}</h4>
                  <p className="text-[11px] text-label-tertiary font-mono truncate">
                    {entry.user?.rollNo || entry.user?.email || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-separator flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                <div>
                  <p className="text-[10px] uppercase font-bold text-label-secondary">Contest Score</p>
                  <p className="text-sm font-black text-primary font-mono">{entry.totalScore} pts</p>
                </div>
                <p className="text-[10px] text-label-tertiary sm:mt-0.5">
                  Current XP: <span className="font-bold text-emerald-600 dark:text-emerald-400">+{currentAwarded}</span>
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                Allocation Method
              </label>
              <div className="grid grid-cols-2 gap-2 bg-surface-secondary p-1 rounded-2xl border border-separator">
                <button
                  type="button"
                  onClick={() => {
                    setMode('direct');
                    setPoints(entry.awardedClubPoints ?? entry.totalScore ?? 0);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    mode === 'direct'
                      ? 'bg-surface text-label-primary shadow-sm border border-separator'
                      : 'text-label-secondary hover:text-label-primary'
                  }`}
                >
                  Direct Points (Override)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('bonus');
                    setPoints(25);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    mode === 'bonus'
                      ? 'bg-surface text-label-primary shadow-sm border border-separator'
                      : 'text-label-secondary hover:text-label-primary'
                  }`}
                >
                  Add Bonus XP (+)
                </button>
              </div>
            </div>

            {/* Points Input & Quick Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                  <Award size={14} className="text-amber-500" />
                  <span>{mode === 'direct' ? 'Total Awarded Club Points' : 'Bonus Points to Add'}</span>
                </label>
                <span className="text-[11px] font-mono font-bold text-primary">
                  {delta >= 0 ? `+${delta}` : delta} profile delta
                </span>
              </div>

              <input
                type="number"
                min="0"
                step="1"
                value={points}
                onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-3 bg-surface-secondary border border-separator rounded-2xl text-lg font-black text-label-primary font-mono focus:outline-none focus:border-primary focus:bg-surface focus:ring-1 focus:ring-primary"
                required
              />

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                {mode === 'direct' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setPoints(entry.totalScore)}
                      className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-surface border border-separator text-label-secondary hover:text-label-primary hover:border-primary/50 transition-colors"
                    >
                      Match Score ({entry.totalScore})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoints(Math.round(entry.totalScore * 1.2))}
                      className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-surface border border-separator text-label-secondary hover:text-label-primary hover:border-primary/50 transition-colors"
                    >
                      +20% Bonus ({Math.round(entry.totalScore * 1.2)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoints(100)}
                      className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-surface border border-separator text-label-secondary hover:text-label-primary hover:border-primary/50 transition-colors"
                    >
                      100 pts
                    </button>
                  </>
                ) : (
                  <>
                    {[10, 25, 50, 100].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setPoints(b)}
                        className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-surface border border-separator text-label-secondary hover:text-label-primary hover:border-primary/50 transition-colors"
                      >
                        +{b} pts
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Reason / Remarks */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-label-primary flex items-center justify-between">
                <span>Reason / Remarks</span>
                <span className="text-[10px] font-normal text-label-tertiary">Optional evaluation note</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Clean algorithmic optimization, contest bonus..."
                className="w-full px-4 py-2.5 bg-surface-secondary border border-separator rounded-xl text-xs text-label-primary focus:outline-none focus:border-primary focus:bg-surface"
              />

              {/* Quick reason suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickReasons.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-surface-secondary border border-separator text-label-secondary hover:text-label-primary hover:border-primary/40 transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Impact Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-600 dark:text-amber-400">
              <Sparkles size={16} className="shrink-0 mt-0.5 text-amber-500" />
              <div className="space-y-0.5 text-[11px]">
                <p className="font-bold">Instant Profile Ledger Sync</p>
                <p className="opacity-90">
                  Submitting will adjust this participant's club points from{' '}
                  <span className="font-bold font-mono">+{currentAwarded}</span> to{' '}
                  <span className="font-bold font-mono">+{targetAwarded} XP</span>, directly updating their permanent user profile score.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-label-secondary hover:text-label-primary rounded-xl hover:bg-surface-secondary transition-colors text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Allocating...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} className="fill-current" />
                    <span>Confirm & Allocate Points</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AllocatePointsModal;
