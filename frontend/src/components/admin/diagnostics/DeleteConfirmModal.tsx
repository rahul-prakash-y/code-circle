import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Lock } from 'lucide-react';
import { UserBadge } from './UserBadge';
import { UserLookupItem } from '../../../store/useDiagnosticsStore';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  collectionName: string;
  doc: any;
  userMap?: Record<string, UserLookupItem>;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  collectionName,
  doc,
  userMap = {},
  onClose,
  onConfirm,
}) => {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !doc) return null;

  // Find user reference if any
  const userId =
    collectionName === 'users'
      ? doc._id
      : doc.userId || doc.user || doc.studentId || doc.student || doc.createdBy || doc.author;

  const titleOrName =
    doc.title || doc.name || doc.email || doc.username || doc.code || doc.sessionId || '';

  const handleDelete = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-surface rounded-3xl border border-destructive/30 max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-5"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-label-primary">Delete Document Record</h3>
              <p className="text-xs text-label-tertiary">
                Permanent deletion from collection '{collectionName}'
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-secondary rounded-xl text-label-tertiary hover:text-label-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Record Overview Card */}
        <div className="p-4 bg-surface-secondary rounded-2xl border border-separator space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-label-tertiary font-mono">_id</span>
            <span className="font-mono text-primary font-bold">{doc._id}</span>
          </div>

          {titleOrName && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-label-tertiary">Record Label</span>
              <span className="font-semibold text-label-primary truncate max-w-[200px]">
                {titleOrName}
              </span>
            </div>
          )}

          {userId && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-separator/50">
              <span className="text-label-tertiary">Associated User</span>
              <UserBadge userId={String(userId)} userMap={userMap} />
            </div>
          )}

          {doc.createdAt && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-separator/50">
              <span className="text-label-tertiary">Created At</span>
              <span className="text-label-secondary font-mono text-[11px]">
                {new Date(doc.createdAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 font-medium">
          Warning: This action cannot be undone. The document will be permanently purged from MongoDB Atlas.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-xs font-bold text-label-secondary hover:text-label-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2.5 bg-destructive text-white text-xs font-bold rounded-xl shadow-md shadow-destructive/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 size={14} className={deleting ? 'animate-spin' : ''} />
            <span>{deleting ? 'Deleting...' : 'Delete Permanently'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteConfirmModal;
