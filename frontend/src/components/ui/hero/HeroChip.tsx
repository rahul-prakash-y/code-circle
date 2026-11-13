import React from 'react';
import { X } from 'lucide-react';

export interface HeroChipProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'flat' | 'solid' | 'bordered' | 'dot' | 'faded';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  radius?: 'full' | 'lg' | 'md' | 'sm' | 'none';
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const HeroChip: React.FC<HeroChipProps> = ({
  children,
  variant = 'flat',
  color = 'default',
  size = 'sm',
  radius = 'full',
  startContent,
  endContent,
  onClose,
  className = '',
  onClick,
  ...rest
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2.5 py-0.5 gap-1.5 min-h-[22px]'
      : size === 'lg'
      ? 'text-sm px-4 py-1.5 gap-2.5 min-h-[32px]'
      : 'text-xs px-3 py-1 gap-2 min-h-[26px]';

  const radiusClasses =
    radius === 'none'
      ? 'rounded-none'
      : radius === 'sm'
      ? 'rounded-md'
      : radius === 'md'
      ? 'rounded-lg'
      : radius === 'lg'
      ? 'rounded-xl'
      : 'rounded-full';

  const colorMap: Record<string, Record<string, string>> = {
    default: {
      flat: 'bg-surface-secondary text-label-secondary border border-separator/60',
      solid: 'bg-label-primary text-surface',
      bordered: 'border border-separator text-label-secondary bg-transparent',
      dot: 'text-label-secondary bg-surface-secondary/70 border border-separator/60',
      faded: 'bg-surface/60 border border-separator text-label-secondary shadow-2xs',
    },
    primary: {
      flat: 'bg-primary/10 text-primary border border-primary/20',
      solid: 'bg-primary text-white shadow-xs',
      bordered: 'border border-primary/50 text-primary bg-transparent',
      dot: 'text-primary bg-primary/10 border border-primary/20',
      faded: 'bg-primary/5 border border-primary/20 text-primary',
    },
    accent: {
      flat: 'bg-accent/10 text-accent border border-accent/25',
      solid: 'bg-accent text-white shadow-xs',
      bordered: 'border border-accent/50 text-accent bg-transparent',
      dot: 'text-accent bg-accent/10 border border-accent/20',
      faded: 'bg-accent/5 border border-accent/20 text-accent',
    },
    secondary: {
      flat: 'bg-secondary/10 text-secondary border border-secondary/20',
      solid: 'bg-secondary text-white shadow-xs',
      bordered: 'border border-secondary/50 text-secondary bg-transparent',
      dot: 'text-secondary bg-secondary/10 border border-secondary/20',
      faded: 'bg-secondary/5 border border-secondary/20 text-secondary',
    },
    success: {
      flat: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
      solid: 'bg-emerald-600 text-white shadow-xs',
      bordered: 'border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-transparent',
      dot: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
      faded: 'bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    warning: {
      flat: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30',
      solid: 'bg-amber-500 text-white shadow-xs',
      bordered: 'border border-amber-500/50 text-amber-600 dark:text-amber-400 bg-transparent',
      dot: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20',
      faded: 'bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400',
    },
    danger: {
      flat: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25',
      solid: 'bg-rose-600 text-white shadow-xs',
      bordered: 'border border-rose-500/50 text-rose-600 dark:text-rose-400 bg-transparent',
      dot: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20',
      faded: 'bg-rose-500/5 border border-rose-500/20 text-rose-600 dark:text-rose-400',
    },
  };

  const styleClass = colorMap[color]?.[variant] || colorMap.default.flat;
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium select-none whitespace-nowrap transition-all duration-150 ${sizeClasses} ${radiusClasses} ${styleClass} ${
        isClickable ? 'cursor-pointer hover:brightness-105 active:scale-97' : ''
      } ${className}`}
      {...rest}
    >
      {variant === 'dot' && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            color === 'success'
              ? 'bg-emerald-500'
              : color === 'warning'
              ? 'bg-amber-500'
              : color === 'danger'
              ? 'bg-rose-500'
              : color === 'primary' || color === 'accent'
              ? 'bg-accent'
              : 'bg-label-tertiary'
          }`}
        />
      )}
      {startContent && <span className="shrink-0 flex items-center">{startContent}</span>}
      <span className="truncate">{children}</span>
      {endContent && <span className="shrink-0 flex items-center">{endContent}</span>}
      {onClose && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-0.5 -mr-1 rounded-full hover:bg-black/10 dark:hover:bg-white/15 text-current transition-colors cursor-pointer"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

