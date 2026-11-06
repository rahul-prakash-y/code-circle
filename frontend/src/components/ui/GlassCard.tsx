import React from 'react';
import { Card as HeroUICard } from '@heroui/react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive';
  glow?: 'violet' | 'blue' | 'emerald' | 'amber' | 'rose' | 'teal' | 'none';
  className?: string;
  noPadding?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, variant = 'default', glow = 'none', className, noPadding = false, ...props }, ref) => {
    return (
      <HeroUICard
        ref={ref as any}
        className={cn(
          'rounded-3xl border border-separator bg-surface text-label-primary shadow-xs transition-all',
          !noPadding && 'p-6',
          variant === 'interactive' && 'hover:scale-[1.01] hover:border-accent/40 active:scale-[0.99] cursor-pointer',
          className
        )}
        {...(props as any)}
      >
        {children}
      </HeroUICard>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
