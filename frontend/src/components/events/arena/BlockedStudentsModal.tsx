import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';
import BlockedStudentsTab from './BlockedStudentsTab';

export interface BlockedStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle?: string;
  onStudentUnblocked?: () => void;
}

export const BlockedStudentsModal: React.FC<BlockedStudentsModalProps> = React.memo(({
  isOpen,
  onClose,
  eventId,
  eventTitle = 'Event Arena',
  onStudentUnblocked,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-4xl rounded-3xl bg-surface border border-separator/80 p-5 sm:p-7 shadow-2xl space-y-5 my-6 max-h-[92vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-separator/70 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-xs">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-label-primary tracking-tight">
                      Manage Blocked Participants
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      {eventTitle}
                    </span>
                  </div>
                  <p className="text-xs text-label-secondary mt-0.5">
                    Unblock participants to immediately allow them to rejoin or attend Event Arena rounds
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-canvas hover:bg-surface-secondary text-label-tertiary hover:text-label-primary transition-colors cursor-pointer border border-separator/60"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              <BlockedStudentsTab
                eventId={eventId}
                eventTitle={eventTitle}
                onStudentUnblocked={onStudentUnblocked}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

BlockedStudentsModal.displayName = 'BlockedStudentsModal';

export default BlockedStudentsModal;
