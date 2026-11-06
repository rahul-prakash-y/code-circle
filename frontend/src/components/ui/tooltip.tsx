import * as React from 'react';
import { Tooltip as HeroUITooltip } from '@heroui/react';
import { cn } from '@/lib/utils';

export const Tooltip = ({
  children,
  content,
  delay = 200,
  className,
  ...props
}: {
  children: React.ReactElement;
  content?: React.ReactNode;
  delay?: number;
  className?: string;
} & React.ComponentProps<typeof HeroUITooltip>) => {
  if (!content) return children;

  return (
    <HeroUITooltip delay={delay} {...props}>
      <HeroUITooltip.Trigger>{children}</HeroUITooltip.Trigger>
      <HeroUITooltip.Content
        className={cn(
          'z-50 rounded-xl border border-separator bg-surface px-3 py-1.5 text-xs font-medium text-label-primary shadow-lg',
          className
        )}
      >
        {content}
      </HeroUITooltip.Content>
    </HeroUITooltip>
  );
};

export const TooltipTrigger = HeroUITooltip.Trigger;
export const TooltipContent = HeroUITooltip.Content;
export const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default Tooltip;
