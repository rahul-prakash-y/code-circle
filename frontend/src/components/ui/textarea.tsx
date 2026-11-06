import * as React from 'react';
import { TextArea as HeroUITextArea } from '@heroui/react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isInvalid?: boolean;
  errorMessage?: React.ReactNode;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, isInvalid, errorMessage, ...props }, ref) => {
    return (
      <HeroUITextArea
        ref={ref}
        className={cn(
          'w-full min-h-[90px] rounded-2xl border border-separator bg-surface-secondary p-4 text-sm text-label-primary placeholder:text-label-tertiary focus:border-accent focus:ring-1 focus:ring-accent-ring transition-all outline-none resize-none leading-relaxed',
          isInvalid && 'border-destructive focus:border-destructive focus:ring-destructive/30',
          className
        )}
        {...(props as any)}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export default Textarea;
