import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-40 active:translate-y-[1px] active:opacity-90 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-white shadow-sm hover:bg-accent-hover shadow-accent/20',
        destructive:
          'bg-destructive text-white shadow-sm hover:bg-destructive/90',
        outline:
          'border border-border bg-transparent hover:bg-separator hover:text-text-primary',
        secondary:
          'bg-surface text-text-primary border border-border hover:bg-separator',
        ghost: 
          'hover:bg-separator text-text-secondary hover:text-text-primary',
        link: 
          'text-accent underline-offset-4 hover:underline',
        glass:
          'bg-surface text-text-primary border border-border hover:bg-separator',
        accent:
          'bg-accent text-white shadow-sm hover:bg-accent-hover',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
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
