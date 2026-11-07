import * as React from 'react';
import { Tooltip as HeroUITooltip } from '@heroui/react';
import { cn } from '@/lib/utils';

export const Tooltip = Object.assign(
  ({
    children,
    content,
    delay = 200,
    className,
    ...props
  }: {
    children: React.ReactNode;
    content?: React.ReactNode;
    delay?: number;
    className?: string;
    [key: string]: any;
  }) => {
    if (content) {
      return (
        <HeroUITooltip delay={delay} {...(props as any)}>
          <HeroUITooltip.Trigger>{children as React.ReactElement}</HeroUITooltip.Trigger>
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
    }

    return (
      <HeroUITooltip delay={delay} {...(props as any)}>
        {children as any}
      </HeroUITooltip>
    );
  },
  {
    Trigger: ({ asChild: _asChild, children, ...props }: any) => (
      <HeroUITooltip.Trigger {...props}>{children}</HeroUITooltip.Trigger>
    ),
    Content: ({ side: _side, className, children, ...props }: any) => (
      <HeroUITooltip.Content
        className={cn(
          'z-50 rounded-xl border border-separator bg-surface px-3 py-1.5 text-xs font-medium text-label-primary shadow-lg',
          className
        )}
        {...props}
      >
        {children}
      </HeroUITooltip.Content>
    ),
  }
);

export const TooltipTrigger = ({ asChild: _asChild, children, ...props }: any) => (
  <HeroUITooltip.Trigger {...props}>{children}</HeroUITooltip.Trigger>
);

export const TooltipContent = ({ side: _side, className, children, ...props }: any) => (
  <HeroUITooltip.Content
    className={cn(
      'z-50 rounded-xl border border-separator bg-surface px-3 py-1.5 text-xs font-medium text-label-primary shadow-lg',
      className
    )}
    {...props}
  >
    {children}
  </HeroUITooltip.Content>
);

export const TooltipProvider = ({ children, delayDuration: _d, ..._props }: any) => <>{children}</>;

export default Tooltip;
