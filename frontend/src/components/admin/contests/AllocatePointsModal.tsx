import ResponsiveModal from '../../ui/ResponsiveModal';
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
import { Button, Spinner } from '@heroui/react';
import { HeroUISelect } from '@/components/ui/HeroUISelect';
import { HeroChip as Chip } from '@/components/ui/hero/HeroChip';
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
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <span>Manual Point Allocation</span>
        </div>
      }
      description="Award or adjust student club merit points for this contest"
      dialogClassName="sm:max-w-lg p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
            <div className="flex items-center gap-1.5 sm:mt-1">
              <span className="text-[10px] text-label-tertiary">Current XP:</span>
              <Chip size="sm" color="success" variant="flat" className="font-bold font-mono">
                +{currentAwarded}
              </Chip>
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
            Allocation Method
          </label>
          <div className="grid grid-cols-2 gap-2 bg-surface-secondary p-1 rounded-2xl border border-separator">
            <Button
              type="button"
              variant={mode === 'direct' ? 'primary' : 'secondary'}
              onPress={() => {
                setMode('direct');
                setPoints(entry.awardedClubPoints ?? entry.totalScore ?? 0);
              }}
              className="py-2 px-3 rounded-xl text-xs font-bold min-h-[38px]"
            >
              Direct Points (Override)
            </Button>
            <Button
              type="button"
              variant={mode === 'bonus' ? 'primary' : 'secondary'}
              onPress={() => {
                setMode('bonus');
                setPoints(25);
              }}
              className="py-2 px-3 rounded-xl text-xs font-bold min-h-[38px]"
            >
              Add Bonus XP (+)
            </Button>
          </div>
        </div>

        {/* Numeric Point Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
              {mode === 'direct' ? 'Total Club Points' : 'Bonus Points to Add'}
            </label>
            <span className="text-[11px] font-mono text-label-tertiary">
              Result: <strong className="text-primary">{targetAwarded} pts</strong> ({delta >= 0 ? `+${delta}` : delta})
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={1000}
              value={points}
              onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-separator text-sm font-mono font-bold text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-label-tertiary">
              PTS
            </span>
          </div>
        </div>

        {/* Reason / Note Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
            Evaluation Note / Justification (Optional)
          </label>
          <HeroUISelect
            placeholder="Select a preset justification..."
            value={quickReasons.includes(reason) ? reason : ''}
            onChange={(val) => setReason(val)}
            options={quickReasons.map((qr) => ({ value: qr, label: qr }))}
            size="sm"
            isClearable
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Or type custom justification..."
            className="w-full px-4 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />

          {/* Quick presets Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {quickReasons.map((qr) => (
              <Chip
                key={qr}
                size="sm"
                color={reason === qr ? 'accent' : 'default'}
                variant={reason === qr ? 'solid' : 'flat'}
                onClick={() => setReason(qr)}
                className="text-[10px] cursor-pointer"
              >
                {qr}
              </Chip>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-separator flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onPress={onClose}
            className="px-4 py-2 rounded-full text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isDisabled={submitting || (mode === 'bonus' && Number(points) === 0)}
            className="px-5 py-2 rounded-full text-xs font-semibold shadow"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <Spinner size="sm" color="default" />
                <span>Updating...</span>
              </div>
            ) : (
              'Confirm Allocation'
            )}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
};

export default AllocatePointsModal;

