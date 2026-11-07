import React from 'react';
import { motion } from 'framer-motion';
import {
  Inbox,
  FilterX,
  SearchX,
  ShieldAlert,
  AlertCircle,
  WifiOff,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { UX_COPY } from '@/constants/copy';

export type EmptyStateReason =
  | 'first-use'
  | 'filtered'
  | 'no-match'
  | 'no-permission'
  | 'failed'
  | 'offline';

export interface EmptyStateProps {
  reason?: EmptyStateReason;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const DEFAULT_ICONS: Record<EmptyStateReason, React.ComponentType<{ className?: string }>> = {
  'first-use': Inbox,
  'filtered': FilterX,
  'no-match': SearchX,
  'no-permission': ShieldAlert,
  'failed': AlertCircle,
  'offline': WifiOff,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  reason = 'first-use',
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  className = '',
}) => {
  const IconComp = DEFAULT_ICONS[reason] || Inbox;

  // Resolve default copy based on state reason
  const defaultMeta = {
    'first-use': UX_COPY.empty.firstUse,
    'filtered': UX_COPY.empty.filtered,
    'no-match': UX_COPY.empty.noMatch,
    'no-permission': UX_COPY.empty.noPermission,
    'failed': UX_COPY.empty.failedToLoad,
    'offline': {
      title: 'Offline — no cached records available',
      description: 'You are currently offline and these items were not previously cached. Connect to the internet to load.',
      action: 'Check Connection',
    },
  }[reason];

  const displayTitle = title || defaultMeta.title;
  const displayDescription = description || defaultMeta.description;
  const defaultActionLabel = defaultMeta.action;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as any }}
      role="status"
      aria-live="polite"
      className={`rounded-3xl border border-separator/80 bg-surface/80 backdrop-blur-md p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm flex flex-col items-center justify-center my-6 ${className}`}
    >
      {/* Icon Capsule */}
      <div className="w-14 h-14 rounded-2xl bg-separator/50 flex items-center justify-center text-label-secondary mb-4 ring-1 ring-separator/60">
        {icon ? icon : <IconComp className="w-7 h-7 text-label-secondary stroke-[1.75]" />}
      </div>

      {/* Primary Reason Headline */}
      <h3 className="text-base sm:text-lg font-semibold tracking-tight text-label-primary">
        {displayTitle}
      </h3>

      {/* Explanation of WHY it is empty */}
      <p className="text-xs sm:text-sm text-label-secondary mt-1.5 max-w-md leading-relaxed">
        {displayDescription}
      </p>

      {/* ONE Clear Next Step */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {primaryAction ? (
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
        ) : (
          reason === 'filtered' && (
            <Button
              size="sm"
              variant="flat"
              onPress={() => window.location.reload()}
              startContent={<RotateCcw size={14} />}
              className="font-medium text-xs rounded-full px-5 h-9"
            >
              {defaultActionLabel}
            </Button>
          )
        )}

        {secondaryAction && (
          <Button
            size="sm"
            variant="ghost"
            onPress={secondaryAction.onClick}
            className="font-medium text-xs rounded-full px-4 h-9 text-label-secondary hover:text-label-primary"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default EmptyState;
