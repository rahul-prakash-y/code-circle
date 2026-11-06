import * as React from 'react';
import {
  Avatar as HeroUIAvatar,
  AvatarImage as HeroUIAvatarImage,
  AvatarFallback as HeroUIAvatarFallback,
} from '@heroui/react';
import { cn } from '@/lib/utils';

export const Avatar = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof HeroUIAvatar>>(
  ({ className, ...props }, ref) => (
    <HeroUIAvatar
      ref={ref as any}
      className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-separator', className)}
      {...(props as any)}
    />
  )
);
Avatar.displayName = 'Avatar';

export const AvatarImage = React.forwardRef<HTMLImageElement, React.ComponentProps<typeof HeroUIAvatarImage>>(
  ({ className, ...props }, ref) => (
    <HeroUIAvatarImage
      ref={ref as any}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...(props as any)}
    />
  )
);
AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof HeroUIAvatarFallback>>(
  ({ className, ...props }, ref) => (
    <HeroUIAvatarFallback
      ref={ref as any}
      className={cn('flex h-full w-full items-center justify-center rounded-full bg-surface-secondary text-label-secondary font-medium text-xs', className)}
      {...(props as any)}
    />
  )
);
AvatarFallback.displayName = 'AvatarFallback';

export default Avatar;
