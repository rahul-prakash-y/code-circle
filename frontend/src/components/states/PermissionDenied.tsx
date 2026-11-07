import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Bell, ShieldX, Settings, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@heroui/react';
import { UX_COPY } from '@/constants/copy';

export type PermissionKind = 'camera' | 'notifications' | 'app-403';

export interface PermissionDeniedProps {
  kind?: PermissionKind;
  title?: string;
  description?: string;
  howToEnable?: string;
  onContinueWithout?: () => void;
  onGoBack?: () => void;
  onRequestAccess?: () => void;
  className?: string;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  kind = 'camera',
  title,
  description,
  howToEnable,
  onContinueWithout,
  onGoBack,
  onRequestAccess,
  className = '',
}) => {
  const isAppForbidden = kind === 'app-403';

  const defaultMeta = isAppForbidden
    ? UX_COPY.permission.appForbidden
    : kind === 'camera'
    ? UX_COPY.permission.browser.camera
    : UX_COPY.permission.browser.notifications;

  const displayTitle = title || defaultMeta.title;
  const displayDescription = description || defaultMeta.description;
  const displayHowTo =
    howToEnable || ('howToEnable' in defaultMeta ? defaultMeta.howToEnable : undefined);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      role="alert"
      aria-live="polite"
      className={`rounded-3xl border border-separator/80 bg-surface/90 backdrop-blur-md p-8 sm:p-12 text-center max-w-lg mx-auto shadow-md flex flex-col items-center justify-center my-6 ${className}`}
    >
      {/* Icon Capsule */}
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 ring-1 ring-amber-500/20">
        {kind === 'camera' ? (
          <Camera className="w-7 h-7 stroke-[1.75]" />
        ) : kind === 'notifications' ? (
          <Bell className="w-7 h-7 stroke-[1.75]" />
        ) : (
          <ShieldX className="w-7 h-7 stroke-[1.75] text-danger" />
        )}
      </div>

      {/* Permission Type Tag */}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-surface-secondary border border-separator text-label-secondary mb-2">
        {isAppForbidden ? 'Authorization Required (403)' : 'Browser Device Permission'}
      </span>

      <h3 className="text-base sm:text-lg font-semibold tracking-tight text-label-primary">
        {displayTitle}
      </h3>

      <p className="text-xs sm:text-sm text-label-secondary mt-1.5 max-w-md leading-relaxed">
        {displayDescription}
      </p>

      {/* Clear How to Re-enable in Browser Settings */}
      {displayHowTo && (
        <div className="mt-4 p-3 rounded-xl bg-surface-secondary/70 border border-separator/60 text-left text-xs text-label-secondary w-full">
          <p className="font-semibold text-label-primary mb-1 flex items-center gap-1.5">
            <Settings size={13} className="text-accent" />
            <span>How to re-enable in settings:</span>
          </p>
          <p className="text-[11px] leading-relaxed">{displayHowTo}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onGoBack && (
          <Button
            size="sm"
            variant="solid"
            color="primary"
            onPress={onGoBack}
            startContent={<ArrowLeft size={14} />}
            className="font-medium text-xs rounded-full px-5 h-9 shadow-sm"
          >
            Go Back
          </Button>
        )}

        {onContinueWithout && (
          <Button
            size="sm"
            variant="flat"
            onPress={onContinueWithout}
            className="font-medium text-xs rounded-full px-4 h-9"
          >
            Continue Without It
          </Button>
        )}

        {isAppForbidden && onRequestAccess && (
          <Button
            size="sm"
            variant="solid"
            color="primary"
            onPress={onRequestAccess}
            startContent={<ExternalLink size={14} />}
            className="font-medium text-xs rounded-full px-5 h-9"
          >
            Request Access
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default PermissionDenied;
