import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive';
  glow?: 'violet' | 'blue' | 'emerald' | 'amber' | 'rose' | 'teal' | 'none';
  className?: string;
  noPadding?: boolean;
}

const glowColors = {
  violet: 'hover:border-violet-500/30 dark:hover:border-violet-500/30',
  blue: 'hover:border-blue-500/30 dark:hover:border-blue-500/30',
  emerald: 'hover:border-emerald-500/30 dark:hover:border-emerald-500/30',
  amber: 'hover:border-amber-500/30 dark:hover:border-amber-500/30',
  rose: 'hover:border-rose-500/30 dark:hover:border-rose-500/30',
  teal: 'hover:border-teal-500/30 dark:hover:border-teal-500/30',
  none: '',
};

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, variant = 'default', glow = 'none', className, noPadding = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base glass styling
          variant === 'elevated' ? 'glass-elevated' : 'glass',
          // Padding
          !noPadding && 'p-6',
          // Interactive variant adds hover effects
          variant === 'interactive' && 'hover-lift cursor-pointer glow-border',
          // Glow color
          glowColors[glow],
          // Transition
          'transition-all duration-300',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
