import * as React from 'react';
import { Input as HeroUIInput } from '@heroui/react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isInvalid?: boolean;
  errorMessage?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', isInvalid, errorMessage, ...props }, ref) => {
    return (
      <HeroUIInput
        ref={ref}
        type={type}
        className={cn(
          'w-full rounded-2xl border border-separator bg-surface-secondary px-4 py-2.5 text-sm text-label-primary placeholder:text-label-tertiary focus:border-accent focus:ring-1 focus:ring-accent-ring transition-all outline-none',
          isInvalid && 'border-destructive focus:border-destructive focus:ring-destructive/30',
          className
        )}
        {...(props as any)}
      />
    );
  }
);
Input.displayName = 'Input';

export { HeroInput } from './HeroUIComponents';
export default Input;
