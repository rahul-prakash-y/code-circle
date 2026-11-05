import React, { useState } from 'react';
import ResponsiveModal from '../ui/ResponsiveModal';
import {
  Send,
  HelpCircle,
  AlertCircle,
  RotateCcw,
  Loader2,
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
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <RotateCcw className="w-4 h-4" />
          </div>
          <span>Request Contest Re-entry</span>
        </div>
      }
      description="Submit an appeal to coordinators & administrators to resume your session."
      dialogClassName="sm:max-w-lg p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="p-3 bg-surface-secondary rounded-2xl border border-separator text-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-label-secondary tracking-wider block">
            Contest Battle
          </span>
          <p className="font-extrabold text-label-primary text-sm">{contestTitle}</p>
        </div>

        {/* Quick Reason Chips */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider block">
            Common Circumstances (Click to auto-fill)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="px-2.5 py-1 text-[11px] font-medium bg-surface hover:bg-surface-secondary border border-separator hover:border-accent/40 rounded-lg text-label-secondary hover:text-label-primary transition-all text-left cursor-pointer"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Reason Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle size={13} className="text-accent" />
            <span>Explain Reason for Re-entry *</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe what occurred (e.g. accidental submission, connection drop, tab blur)..."
            className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-separator text-sm text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none placeholder:text-label-secondary/60"
            required
          />
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-600 dark:text-amber-400 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>What happens next:</span>
          </p>
          <p className="text-[10px] text-label-secondary leading-relaxed">
            Contest coordinators will review your appeal. If approved, your arena timer will refresh and you will receive an in-app confirmation notification.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-separator flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-full text-xs font-medium border border-separator text-label-secondary hover:text-label-primary cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !reason.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition cursor-pointer shadow"
          >
            {submitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Send Re-entry Request</span>
              </>
            )}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
};

export default RequestReentryModal;
