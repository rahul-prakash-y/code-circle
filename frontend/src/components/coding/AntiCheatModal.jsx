import React from 'react';
import ResponsiveModal from '../ui/ResponsiveModal';
import { AlertCircle, Lock } from 'lucide-react';

export const AntiCheatModal = ({
  warnings = 1,
  isLocked = false,
  isOpen = true,
  onClose,
}) => {
  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && onClose && !isLocked) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isLocked
                ? 'bg-rose-500/10 text-rose-500'
                : 'bg-amber-500/10 text-amber-500'
            }`}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          </div>
          <span className={isLocked ? 'text-rose-500 font-bold' : 'text-amber-500 font-bold'}>
            {isLocked ? 'Workspace Locked' : 'Anti-Cheat Proctoring Alert'}
          </span>
        </div>
      }
      description={
        isLocked
          ? 'You have exceeded the maximum allowed tab switches. Your session has been locked.'
          : `Switching tabs or minimizing the window is monitored. Warning ${warnings} of 3.`
      }
      dialogClassName="sm:max-w-md p-6"
    >
      <div className="space-y-4 pt-2">
        <div
          className={`p-4 rounded-2xl border ${
            isLocked
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
          } text-xs leading-relaxed`}
        >
          {isLocked
            ? 'Progress has been timestamped and saved. Please reach out to your club coordinator or exam administrator to appeal for re-entry.'
            : 'Please keep this workspace active and in focus. Additional window switches will result in immediate session locking.'}
        </div>

        <div className="pt-2 flex justify-end gap-3">
          {isLocked ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex items-center justify-center py-2.5 px-5 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow transition cursor-pointer"
            >
              Contact Administrator
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex items-center justify-center py-2.5 px-5 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover shadow transition cursor-pointer"
            >
              I Understand, Continue
            </button>
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default AntiCheatModal;
