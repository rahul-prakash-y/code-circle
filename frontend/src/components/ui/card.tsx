import * as React from 'react';
import {
  Card as HeroCard,
  CardHeader as HeroCardHeader,
  CardTitle as HeroCardTitle,
  CardDescription as HeroCardDescription,
  CardContent as HeroCardContent,
  CardFooter as HeroCardFooter,
} from '@heroui/react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <HeroCard
      ref={ref}
      className={cn('rounded-3xl border border-separator bg-surface text-label-primary shadow-xs transition-all', className)}
      {...(props as any)}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <HeroCardHeader
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...(props as any)}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <HeroCardTitle
      ref={ref as any}
      className={cn('text-xl font-bold tracking-tight text-label-primary', className)}
      {...(props as any)}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <HeroCardDescription
      ref={ref as any}
      className={cn('text-sm text-label-secondary', className)}
      {...(props as any)}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <HeroCardContent
      ref={ref}
      className={cn('p-6 pt-0', className)}
      {...(props as any)}
    />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <HeroCardFooter
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...(props as any)}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export default Card;
