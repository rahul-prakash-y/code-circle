import * as React from 'react';
import {
  Dropdown as HeroUIDropdown,
  DropdownTrigger as HeroUIDropdownTrigger,
  DropdownMenu as HeroUIDropdownMenu,
  DropdownItem as HeroUIDropdownItem,
  DropdownSection as HeroUIDropdownSection,
  DropdownPopover as HeroUIDropdownPopover,
} from '@heroui/react';
import { cn } from '@/lib/utils';

export const DropdownMenu = HeroUIDropdown;
export const DropdownMenuTrigger = HeroUIDropdownTrigger;
export const DropdownMenuPopover = HeroUIDropdownPopover;
export const DropdownMenuContent = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof HeroUIDropdownMenu>>(
  ({ className, children, ...props }, ref) => (
    <HeroUIDropdownPopover className="z-50 min-w-[8rem] overflow-hidden rounded-2xl border border-separator bg-surface p-1.5 text-label-primary shadow-xl">
      <HeroUIDropdownMenu ref={ref as any} className={cn('outline-none space-y-0.5', className)} {...(props as any)}>
        {children}
      </HeroUIDropdownMenu>
    </HeroUIDropdownPopover>
  )
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof HeroUIDropdownItem>>(
  ({ className, ...props }, ref) => (
    <HeroUIDropdownItem
      ref={ref as any}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-label-primary outline-none transition-colors hover:bg-surface-secondary focus:bg-surface-secondary data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...(props as any)}
    />
  )
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-label-tertiary', className)} {...props} />
);

export const DropdownMenuSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('-mx-1 my-1 h-px bg-separator', className)} {...props} />
);

export const DropdownMenuGroup = HeroUIDropdownSection;

export default DropdownMenu;
