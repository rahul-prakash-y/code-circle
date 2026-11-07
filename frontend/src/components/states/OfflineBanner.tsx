import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Info, CheckCircle2 } from 'lucide-react';
import useNetworkStatus from '@/hooks/useNetworkStatus';
import { UX_COPY } from '@/constants/copy';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.aside
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
          className="sticky top-0 z-50 w-full bg-amber-500/95 dark:bg-amber-600/95 text-white backdrop-blur-md px-4 py-2 text-xs shadow-md border-b border-amber-600/40"
        >
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-full bg-black/20 shrink-0">
                <WifiOff size={13} className="text-white" />
              </span>
              <span className="font-semibold">{UX_COPY.offline.badge}:</span>
              <span className="opacity-95">{UX_COPY.offline.banner}</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 shrink-0 text-[11px] bg-black/15 px-2.5 py-1 rounded-full font-mono">
              <CheckCircle2 size={12} className="text-emerald-300" />
              <span>Drafts & Local Cache Saved</span>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
