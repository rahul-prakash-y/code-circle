import * as React from 'react';
import { Skeleton as HeroUISkeleton } from '@heroui/react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  animationType = 'pulse',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { animationType?: 'pulse' | 'wave' | 'none' }) {
  return (
    <HeroUISkeleton
      animationType={animationType}
      className={cn('rounded-xl bg-surface-secondary', className)}
      {...(props as any)}
    />
  );
}

export default Skeleton;
