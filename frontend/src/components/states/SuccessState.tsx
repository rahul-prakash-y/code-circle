import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@heroui/react';
import { UX_COPY } from '@/constants/copy';

export interface SuccessStateProps {
  title?: string;
  description?: string;
  reassurance?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  onUndo?: () => void;
  timeline?: Array<{ label: string; time?: string; done?: boolean }>;
  className?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title = UX_COPY.success.submitted,
  description,
  reassurance = 'No further action is required from you.',
  primaryAction,
  onUndo,
  timeline,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      role="status"
      aria-live="polite"
      className={`rounded-3xl border border-emerald-500/30 bg-surface/90 backdrop-blur-md p-8 sm:p-12 text-center max-w-lg mx-auto shadow-md flex flex-col items-center justify-center my-6 ${className}`}
    >
      {/* Icon Capsule */}
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 ring-1 ring-emerald-500/20">
        <CheckCircle2 className="w-7 h-7 stroke-[1.75]" />
      </div>

      <h3 className="text-base sm:text-lg font-semibold tracking-tight text-label-primary">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-label-secondary mt-1.5 max-w-md leading-relaxed">
          {description}
        </p>
      )}

      {/* Reassurance pill */}
      {reassurance && (
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <span>✓</span>
          <span>{reassurance}</span>
        </div>
      )}

      {/* Next Step Guidance Timeline */}
      {timeline && timeline.length > 0 && (
        <div className="mt-6 pt-4 border-t border-separator/60 w-full text-left">
          <p className="text-[11px] font-semibold text-label-tertiary uppercase tracking-wider mb-3 text-center">
            {UX_COPY.success.actionNext}
          </p>
          <div className="space-y-2.5">
            {timeline.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.done ? 'bg-emerald-500' : 'bg-separator'
                    }`}
                  />
                  <span className={item.done ? 'text-label-primary font-medium' : 'text-label-tertiary'}>
                    {item.label}
                  </span>
                </div>
                {item.time && <span className="font-mono text-[10px] text-label-tertiary">{item.time}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Controls */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {primaryAction && (
          <Button
            size="sm"
            variant="solid"
            color="primary"
            onPress={primaryAction.onClick}
            startContent={primaryAction.icon || <ArrowRight size={14} />}
            className="font-medium text-xs rounded-full px-5 h-9 shadow-sm"
          >
            {primaryAction.label}
          </Button>
        )}

        {onUndo && (
          <Button
            size="sm"
            variant="ghost"
            onPress={onUndo}
            startContent={<RotateCcw size={13} />}
            className="font-medium text-xs rounded-full px-4 h-9 text-label-secondary hover:text-label-primary"
          >
            {UX_COPY.success.undo}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default SuccessState;
