import React from 'react';
import { motion } from 'framer-motion';
import { Clock, RotateCcw, XCircle, Gauge } from 'lucide-react';
import { Button } from '@heroui/react';
import { UX_COPY } from '@/constants/copy';

export interface SlowNetworkNoticeProps {
  onRetry?: () => void;
  onCancel?: () => void;
  onDataSaverToggle?: () => void;
  isDataSaverActive?: boolean;
  className?: string;
}

export const SlowNetworkNotice: React.FC<SlowNetworkNoticeProps> = ({
  onRetry,
  onCancel,
  onDataSaverToggle,
  isDataSaverActive = false,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      aria-live="polite"
      className={`rounded-2xl border border-warning/40 bg-warning/10 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-warning-700 dark:text-warning-300 ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <Clock size={16} className="shrink-0 mt-0.5 text-warning-600 dark:text-warning-400 animate-spin" />
        <div>
          <p className="font-semibold">{UX_COPY.slowNetwork.takingLonger}</p>
          <p className="text-[11px] opacity-90 mt-0.5">{UX_COPY.slowNetwork.explanation}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        {onRetry && (
          <Button
            size="sm"
            variant="flat"
            onPress={onRetry}
            startContent={<RotateCcw size={12} />}
            className="h-7 text-[11px] px-3 font-medium bg-warning/20 hover:bg-warning/30 text-warning-800 dark:text-warning-200"
          >
            {UX_COPY.slowNetwork.retryAction}
          </Button>
        )}

        {onCancel && (
          <Button
            size="sm"
            variant="ghost"
            onPress={onCancel}
            startContent={<XCircle size={12} />}
            className="h-7 text-[11px] px-2.5 font-medium text-label-secondary hover:text-label-primary"
          >
            {UX_COPY.slowNetwork.cancelAction}
          </Button>
        )}

        {onDataSaverToggle && (
          <Button
            size="sm"
            variant={isDataSaverActive ? 'solid' : 'bordered'}
            onPress={onDataSaverToggle}
            startContent={<Gauge size={12} />}
            className="h-7 text-[11px] px-2.5 font-medium"
          >
            Data-Saver
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default SlowNetworkNotice;
