import React, { useState } from 'react';
import ResponsiveModal from '../../ui/ResponsiveModal';
import {
  UserCheck,
  XCircle,
  Trash2,
  Clock,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Loader2,
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

  const studentName = submission?.userId?.name || 'Student';
  const studentEmail = submission?.userId?.email || '';
  const studentRoll = submission?.userId?.rollNo || 'N/A';
  const awardedPoints = submission?.awardedClubPoints || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission || !contest) return;
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
    <ResponsiveModal
      open={isOpen && Boolean(submission) && Boolean(contest)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <span>Approve Contest Re-entry</span>
        </div>
      }
      description="Grant re-entry permission and resume student timer."
      dialogClassName="sm:max-w-lg p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Student Info Card */}
        <div className="p-3.5 bg-surface-secondary rounded-2xl border border-separator space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-label-primary">{studentName}</p>
            <span className="text-xs font-mono font-bold text-label-secondary">{studentRoll}</span>
          </div>
          <p className="text-xs text-label-secondary">{studentEmail}</p>
          <div className="pt-1 flex items-center justify-between text-xs border-t border-separator/60">
            <span className="text-label-secondary">Current Score:</span>
            <span className="font-extrabold text-accent">{submission?.totalScore || 0} pts</span>
          </div>
        </div>

        {/* Student's Reason */}
        {submission?.reentryRequest?.reason && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1">
              <RotateCcw size={12} />
              Student's Reason for Request:
            </span>
            <p className="text-xs text-label-primary italic">
              "{submission.reentryRequest.reason}"
            </p>
          </div>
        )}

        {/* Duration Configuration */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={13} className="text-emerald-500" />
            <span>Time Allowed to Resume (Minutes)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={5}
              max={300}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-32 px-4 py-2.5 rounded-xl bg-surface-secondary border border-separator text-sm font-bold text-label-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />
            <span className="text-xs text-label-secondary">minutes remaining for this student</span>
          </div>
        </div>

        {/* Note / Message */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare size={13} className="text-accent" />
            <span>Message / Note to Student</span>
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write an encouraging note or instructions..."
            className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-separator text-sm text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
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
                Safely refunds {awardedPoints} XP from their profile to prevent duplicate score allocation.
              </li>
            )}
            <li>Unblocks contest feature access if previously locked by tab-switch warnings.</li>
            <li>Sends an instant notification alert to the student profile.</li>
          </ul>
        </div>

        {/* Footer Buttons */}
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
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Approving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Approve & Allow Re-entry</span>
              </>
            )}
          </button>
        </div>
      </form>
    </ResponsiveModal>
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

  const studentName = submission?.userId?.name || 'Student';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission || !contest) return;
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
    <ResponsiveModal
      open={isOpen && Boolean(submission) && Boolean(contest)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <XCircle className="w-4 h-4" />
          </div>
          <span>Decline Contest Re-entry</span>
        </div>
      }
      description={`Decline re-entry request for ${studentName}.`}
      dialogClassName="sm:max-w-md p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider block">
            Reason / Explanation to Student *
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain why the appeal cannot be accommodated..."
            className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-separator text-sm text-label-primary focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
            required
          />
        </div>

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
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow transition cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Declining...</span>
              </>
            ) : (
              <>
                <XCircle size={14} />
                <span>Decline Request</span>
              </>
            )}
          </button>
        </div>
      </form>
    </ResponsiveModal>
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

  const studentName = submission?.userId?.name || 'Student';
  const studentRoll = submission?.userId?.rollNo || submission?.userId?.email || 'N/A';
  const awardedPoints = submission?.awardedClubPoints || 0;

  const handleDelete = async () => {
    if (!submission || !contest) return;
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
    <ResponsiveModal
      open={isOpen && Boolean(submission) && Boolean(contest)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Trash2 className="w-4 h-4" />
          </div>
          <span>Delete Student Contest Entry</span>
        </div>
      }
      description="Permanent removal and participation reset."
      dialogClassName="sm:max-w-md p-6"
    >
      <div className="space-y-4 pt-2">
        <div className="p-4 bg-surface-secondary rounded-2xl border border-separator space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-label-primary">{studentName}</span>
            <span className="text-xs font-mono font-bold text-label-secondary">{studentRoll}</span>
          </div>
          <div className="text-xs text-label-secondary space-y-1">
            <p>Contest: <strong className="text-label-primary">{contest?.title}</strong></p>
            <p>Score Earned: <strong className="text-accent font-mono">{submission?.totalScore} pts</strong></p>
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
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow transition cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Confirm Delete Entry</span>
              </>
            )}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};
