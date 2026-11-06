import * as React from 'react';
import { Separator as HeroUISeparator } from '@heroui/react';
import { cn } from '@/lib/utils';

export interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

export const Separator = React.forwardRef<HTMLHRElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
    <HeroUISeparator
      ref={ref as any}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-separator',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
      {...(props as any)}
    />
  )
);
Separator.displayName = 'Separator';

export default Separator;
