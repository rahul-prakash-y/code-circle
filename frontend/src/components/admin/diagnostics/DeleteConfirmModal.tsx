import React, { useState } from 'react';
import ResponsiveModal from '../../ui/ResponsiveModal';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
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
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span>Delete Document Record</span>
        </div>
      }
      description={`Permanent deletion from collection '${collectionName}'.`}
      dialogClassName="sm:max-w-md p-6"
    >
      <div className="space-y-4 pt-2">
        {/* Record Overview Card */}
        <div className="p-3.5 sm:p-4 bg-surface-secondary rounded-2xl border border-separator space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-label-tertiary font-mono">_id</span>
            <span className="font-mono text-accent font-bold truncate max-w-[200px]">{doc._id}</span>
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

        <p className="text-xs text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 font-medium leading-relaxed">
          Warning: This action cannot be undone. The document will be permanently purged from MongoDB Atlas.
        </p>

        {/* Actions */}
        <div className="pt-4 border-t border-separator flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-full text-xs font-medium border border-separator text-label-secondary hover:text-label-primary cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-destructive text-white hover:opacity-90 disabled:opacity-50 transition cursor-pointer shadow"
          >
            {deleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={13} />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default DeleteConfirmModal;
