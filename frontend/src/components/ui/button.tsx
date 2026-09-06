import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-white shadow-sm hover:bg-accent/90 hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/20',
        destructive:
          'bg-destructive text-white shadow-sm hover:bg-destructive/90 hover:scale-[1.02]',
        outline:
          'border border-border bg-transparent shadow-sm hover:bg-surface-elevated hover:border-border-hover hover:scale-[1.02]',
        secondary:
          'bg-surface-elevated text-text-primary border border-border shadow-sm hover:bg-surface-elevated/80 hover:scale-[1.02]',
        ghost: 
          'hover:bg-surface-elevated text-text-secondary hover:text-text-primary',
        link: 
          'text-accent underline-offset-4 hover:underline',
        glass:
          'glass text-text-primary font-semibold hover:scale-[1.02] hover:shadow-lg',
        accent:
          'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.02] hover:brightness-110',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-2xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
