import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import useContestStore from '../../store/useContestStore';

interface RequestReentryModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestId: string;
  contestTitle: string;
  onSuccess?: () => void;
}

const COMMON_REASONS = [
  'Accidental early submission before finishing',
  'Browser crash or unexpected network drop',
  'Tab-switch lock appeal / accidental window blur',
  'Hardware or power interruption during challenge',
];

export const RequestReentryModal: React.FC<RequestReentryModalProps> = ({
  isOpen,
  onClose,
  contestId,
  contestTitle,
  onSuccess,
}) => {
  const { requestReentry } = useContestStore();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      const res = await requestReentry(contestId, reason.trim());
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-surface border border-separator rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-label-primary"
        >
          {/* Header */}
          <div className="p-6 border-b border-separator bg-surface-secondary flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                <RotateCcw size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-label-primary tracking-tight">
                  Request Contest Re-entry
                </h3>
                <p className="text-xs text-label-tertiary">
                  Submit an appeal to administrators to resume your session
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="p-2 text-label-secondary hover:text-label-primary rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-surface-secondary rounded-2xl border border-separator text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-label-tertiary tracking-wider">
                Contest Battle
              </span>
              <p className="font-extrabold text-label-primary text-sm">{contestTitle}</p>
            </div>

            {/* Quick Reason Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-label-secondary">
                Common Circumstances (Click to fill):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-surface hover:bg-surface-secondary border border-separator hover:border-primary/40 rounded-lg text-label-secondary hover:text-label-primary transition-all text-left cursor-pointer"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-label-secondary flex items-center gap-1.5">
                <HelpCircle size={13} className="text-primary" />
                <span>Explain your reason for requesting re-entry</span>
              </label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe what occurred (e.g., accidental click, network drop, power loss)..."
                className="w-full px-3.5 py-2.5 text-xs bg-surface border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary resize-none placeholder:text-label-tertiary"
                required
              />
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-600 dark:text-amber-400 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                <span>What happens next:</span>
              </p>
              <p className="text-[10px] text-label-secondary leading-relaxed">
                Contest coordinators and admins will review your request. If approved, you will receive an in-app notification and your arena timer will be refreshed so you can complete your challenges.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 bg-surface-secondary border border-separator text-label-secondary hover:text-label-primary rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !reason.trim()}
                className="px-5 py-2.5 bg-primary hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send size={14} />
                <span>{submitting ? 'Submitting...' : 'Send Re-entry Request'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RequestReentryModal;
