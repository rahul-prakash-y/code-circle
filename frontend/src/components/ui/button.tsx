import * as React from 'react';
import { Button as HeroButton } from '@heroui/react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger' | 'destructive' | 'link' | 'glass';
  size?: 'default' | 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', fullWidth, isDisabled, disabled, ...props }, ref) => {
    // Map variants to HeroUI variants
    let heroVariant: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger' = 'secondary';
    if (variant === 'default' || variant === 'primary') heroVariant = 'primary';
    else if (variant === 'destructive' || variant === 'danger') heroVariant = 'danger';
    else if (variant === 'outline') heroVariant = 'outline';
    else if (variant === 'ghost' || variant === 'link') heroVariant = 'ghost';
    else if (variant === 'secondary' || variant === 'glass') heroVariant = 'secondary';

    const heroSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';

    return (
      <HeroButton
        ref={ref}
        variant={heroVariant}
        size={heroSize}
        fullWidth={fullWidth}
        isDisabled={Boolean(isDisabled || disabled)}
        className={cn(className)}
        {...(props as any)}
      />
    );
  }
);
Button.displayName = 'Button';

export default Button;
