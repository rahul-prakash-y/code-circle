import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserCheck,
  XCircle,
  Trash2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import useContestStore, { Contest } from '../../../store/useContestStore';

interface ApproveReentryModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any | null;
  contest: Contest | null;
  onSuccess: () => void;
}

export const ApproveReentryModal: React.FC<ApproveReentryModalProps> = ({
  isOpen,
  onClose,
  submission,
  contest,
  onSuccess,
}) => {
  const { approveReentry } = useContestStore();
  const defaultDuration = contest?.durationMinutes || 60;
  const [durationMinutes, setDurationMinutes] = useState<number>(defaultDuration);
  const [note, setNote] = useState<string>('Your re-entry request has been approved. You may now resume your contest session.');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !submission || !contest) return null;

  const studentName = submission.userId?.name || 'Student';
  const studentEmail = submission.userId?.email || '';
  const studentRoll = submission.userId?.rollNo || 'N/A';
  const awardedPoints = submission.awardedClubPoints || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await approveReentry(contest._id, submission._id, {
        durationMinutes: Number(durationMinutes) || defaultDuration,
        note: note.trim(),
      });
      if (res.success) {
        onSuccess();
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
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-label-primary tracking-tight">
                  Approve Contest Re-entry
                </h3>
                <p className="text-xs text-label-tertiary">
                  Grant re-entry permission and resume student timer
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
            {/* Student Info Card */}
            <div className="p-3.5 bg-surface-secondary rounded-2xl border border-separator space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-label-primary">{studentName}</p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                  Roll: {studentRoll}
                </span>
              </div>
              <p className="text-xs text-label-tertiary">{studentEmail}</p>
              {submission.reentryReason && (
                <div className="mt-2 pt-2 border-t border-separator/60">
                  <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                    Student's Appeal / Request Reason:
                  </p>
                  <p className="text-xs text-label-secondary italic mt-0.5 bg-surface p-2 rounded-xl border border-separator">
                    "{submission.reentryReason}"
                  </p>
                </div>
              )}
            </div>

            {/* Time Allowance Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-label-secondary flex items-center gap-1.5">
                <Clock size={13} className="text-primary" />
                <span>Active Session Timer for Re-entry (Minutes)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="360"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(5, parseInt(e.target.value) || 0))}
                  className="flex-1 px-3.5 py-2.5 bg-surface border border-separator rounded-xl text-sm font-mono font-bold text-label-primary focus:outline-none focus:border-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setDurationMinutes(defaultDuration)}
                  className="px-3 py-2.5 bg-surface-secondary hover:bg-surface border border-separator rounded-xl text-xs font-bold text-label-secondary transition-colors cursor-pointer"
                  title="Reset to contest standard duration"
                >
                  Standard ({defaultDuration}m)
                </button>
              </div>
              <p className="text-[11px] text-label-tertiary">
                The student's countdown will start with this duration immediately upon re-entering the arena.
              </p>
            </div>

            {/* Admin Note Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-label-secondary flex items-center gap-1.5">
                <MessageSquare size={13} className="text-primary" />
                <span>Message / Note to Student</span>
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write an encouraging note or instructions..."
                className="w-full px-3.5 py-2 text-xs bg-surface border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Safety & System Explanations */}
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-700 dark:text-emerald-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck size={14} className="shrink-0" />
                <span>Automatic Integrity & Points Safeguards</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-label-secondary">
                {awardedPoints > 0 && (
                  <li>
                    Safely refunds {awardedPoints} XP from their profile to prevent double score allocation.
                  </li>
                )}
                <li>Unblocks contest feature access if previously locked by tab-switch warnings.</li>
                <li>Sends an instant notification alert to the student profile.</li>
              </ul>
            </div>

            {/* Footer Buttons */}
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
                disabled={submitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                <span>{submitting ? 'Approving...' : 'Approve & Allow Re-entry'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface RejectReentryModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any | null;
  contest: Contest | null;
  onSuccess: () => void;
}

export const RejectReentryModal: React.FC<RejectReentryModalProps> = ({
  isOpen,
  onClose,
  submission,
  contest,
  onSuccess,
}) => {
  const { rejectReentry } = useContestStore();
  const [note, setNote] = useState<string>('Your re-entry request could not be approved at this time.');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !submission || !contest) return null;

  const studentName = submission.userId?.name || 'Student';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await rejectReentry(contest._id, submission._id, note.trim());
      if (res.success) {
        onSuccess();
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
          className="bg-surface border border-separator rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-label-primary"
        >
          <div className="p-6 border-b border-separator bg-surface-secondary flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center">
                <XCircle size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-label-primary tracking-tight">
                  Decline Re-entry Request
                </h3>
                <p className="text-xs text-label-tertiary">
                  Reject request from {studentName}
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
            {submission.reentryReason && (
              <div className="p-3 bg-surface-secondary rounded-2xl border border-separator">
                <p className="text-[10px] font-bold text-label-tertiary uppercase">Student Appeal:</p>
                <p className="text-xs text-label-secondary italic mt-0.5">"{submission.reentryReason}"</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-label-secondary">
                Reason for Rejection (sent to student)
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explain why the re-entry was declined..."
                className="w-full px-3.5 py-2.5 text-xs bg-surface border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary resize-none"
                required
              />
            </div>

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
                disabled={submitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle size={14} />
                <span>{submitting ? 'Declining...' : 'Decline Request'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface DeleteSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any | null;
  contest: Contest | null;
  onSuccess: () => void;
}

export const DeleteSubmissionModal: React.FC<DeleteSubmissionModalProps> = ({
  isOpen,
  onClose,
  submission,
  contest,
  onSuccess,
}) => {
  const { deleteSubmission } = useContestStore();
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !submission || !contest) return null;

  const studentName = submission.userId?.name || 'Student';
  const studentRoll = submission.userId?.rollNo || submission.userId?.email || 'N/A';
  const awardedPoints = submission.awardedClubPoints || 0;

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await deleteSubmission(contest._id, submission._id);
      if (res.success) {
        onSuccess();
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
          className="bg-surface border border-rose-500/30 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-label-primary"
        >
          {/* Header */}
          <div className="p-6 border-b border-separator bg-rose-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-label-primary tracking-tight">
                  Delete Student Contest Entry
                </h3>
                <p className="text-xs text-rose-500 font-semibold">
                  Permanent removal & participation reset
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

          <div className="p-6 space-y-4">
            <div className="p-4 bg-surface-secondary rounded-2xl border border-separator space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-label-primary">{studentName}</span>
                <span className="text-xs font-mono font-bold text-label-tertiary">{studentRoll}</span>
              </div>
              <div className="text-xs text-label-secondary space-y-1">
                <p>Contest: <strong className="text-label-primary">{contest.title}</strong></p>
                <p>Score Earned: <strong className="text-primary font-mono">{submission.totalScore} pts</strong></p>
                {awardedPoints > 0 && (
                  <p className="text-rose-500 font-bold">
                    Profile Club Points to Refund: -{awardedPoints} XP
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[11px] text-rose-600 dark:text-rose-400 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle size={14} className="shrink-0" />
                <span>What happens when you delete this entry:</span>
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-label-secondary">
                <li>The submission record is permanently deleted from database and leaderboard.</li>
                {awardedPoints > 0 && <li>{awardedPoints} XP will be deducted from the student's profile points.</li>}
                <li>The contest total participant count is decremented by 1.</li>
                <li>The student will be able to enter fresh if the contest is still active.</li>
              </ul>
            </div>

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
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={14} />
                <span>{submitting ? 'Deleting...' : 'Confirm Delete Entry'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
