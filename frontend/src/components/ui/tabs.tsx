import * as React from 'react';
import {
  Tabs as HeroUITabs,
  TabList as HeroUITabList,
  Tab as HeroUITab,
  TabPanel as HeroUITabPanel,
} from '@heroui/react';
import { cn } from '@/lib/utils';

export const Tabs = HeroUITabs;
export const TabsList = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof HeroUITabList>>(
  ({ className, ...props }, ref) => (
    <HeroUITabList
      ref={ref as any}
      className={cn('inline-flex items-center gap-1 p-1 bg-surface-secondary border border-separator rounded-2xl', className)}
      {...(props as any)}
    />
  )
);
TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof HeroUITab>>(
  ({ className, ...props }, ref) => (
    <HeroUITab
      ref={ref as any}
      className={cn(
        'px-4 py-2 rounded-xl text-xs font-semibold text-label-secondary transition-all cursor-pointer hover:text-label-primary data-[selected=true]:bg-surface data-[selected=true]:text-label-primary data-[selected=true]:shadow-xs',
        className
      )}
      {...(props as any)}
    />
  )
);
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof HeroUITabPanel>>(
  ({ className, ...props }, ref) => (
    <HeroUITabPanel
      ref={ref as any}
      className={cn('mt-4 focus-visible:outline-none', className)}
      {...(props as any)}
    />
  )
);
TabsContent.displayName = 'TabsContent';

export default Tabs;
