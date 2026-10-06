import * as React from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

export interface ResponsiveModalProps {
  /** Controls open state of the modal or bottom sheet */
  open: boolean;
  /** Callback fired when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Primary title header */
  title?: React.ReactNode;
  /** Optional secondary subtitle or description */
  description?: React.ReactNode;
  /** Main body content */
  children: React.ReactNode;
  /** Optional trigger element (rendered with asChild) */
  trigger?: React.ReactNode;
  /** Optional sticky or pinned footer element (e.g. action buttons) */
  footer?: React.ReactNode;
  /** Optional class name applied to both Dialog and Drawer content wrapper */
  className?: string;
  /** Custom class name applied specifically to the desktop DialogContent */
  dialogClassName?: string;
  /** Custom class name applied specifically to the mobile DrawerContent */
  drawerClassName?: string;
  /** Custom class name applied to the scrollable internal container */
  contentClassName?: string;
  /** Optional snap points for mobile drawer (e.g. [0.5, 1] or ['400px', '90vh']) */
  snapPoints?: (number | string)[];
  /** Active snap point value */
  activeSnapPoint?: number | string | null;
  /** Callback when snap point changes */
  setActiveSnapPoint?: (snapPoint: number | string | null) => void;
  /** Whether the underlying background scale effect should run on mobile (default true) */
  shouldScaleBackground?: boolean;
}

const ResponsiveModalContext = React.createContext<{ isDesktop: boolean }>({
  isDesktop: true,
});

export const useResponsiveModal = () => React.useContext(ResponsiveModalContext);

/**
 * ResponsiveModal
 *
 * Automatically renders a centered Shadcn Dialog on desktop (min-width: 768px),
 * and an Apple-inspired swipeable Vaul Drawer (Bottom Sheet) on mobile viewports.
 *
 * Adheres strictly to iOS Apple spatial aesthetics:
 * - Rounded top corners (`rounded-t-[32px]`)
 * - Surface colors `#FFFFFF` (light) / `#161617` (dark) with zero borders
 * - Subtle pill-shaped drag handle (`w-12 h-1.5`)
 * - Deep blur backdrop (`backdrop-blur-md bg-black/40`)
 * - Safe-area inset handling (`pb-8`)
 * - Keyboard-safe scrollable viewport (`overflow-y-auto`)
 */
export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  trigger,
  footer,
  className,
  dialogClassName,
  drawerClassName,
  contentClassName,
  snapPoints,
  activeSnapPoint,
  setActiveSnapPoint,
  shouldScaleBackground = true,
}) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <ResponsiveModalContext.Provider value={{ isDesktop: true }}>
        <Dialog open={open} onOpenChange={onOpenChange}>
          {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
          <DialogContent
            className={cn(
              'sm:max-w-lg border-0 bg-[#FFFFFF] dark:bg-[#161617] rounded-3xl p-6 shadow-2xl',
              dialogClassName,
              className
            )}
          >
            {(title || description) && (
              <DialogHeader className="mb-2">
                {title && (
                  <DialogTitle className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {title}
                  </DialogTitle>
                )}
                {description && (
                  <DialogDescription className="text-sm text-[#86868B] mt-1">
                    {description}
                  </DialogDescription>
                )}
              </DialogHeader>
            )}
            <div
              className={cn(
                'overflow-y-auto max-h-[calc(85vh-8rem)] pr-1',
                contentClassName
              )}
            >
              {children}
            </div>
            {footer && <DialogFooter className="mt-4">{footer}</DialogFooter>}
          </DialogContent>
        </Dialog>
      </ResponsiveModalContext.Provider>
    );
  }

  return (
    <ResponsiveModalContext.Provider value={{ isDesktop: false }}>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={snapPoints}
        activeSnapPoint={activeSnapPoint}
        setActiveSnapPoint={setActiveSnapPoint}
        shouldScaleBackground={shouldScaleBackground}
      >
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent
          className={cn(
            'border-0 bg-[#FFFFFF] dark:bg-[#161617] rounded-t-[32px] shadow-2xl',
            drawerClassName,
            className
          )}
        >
          {(title || description) && (
            <DrawerHeader className="px-6 pt-2 pb-2 text-left shrink-0">
              {title && (
                <DrawerTitle className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {title}
                </DrawerTitle>
              )}
              {description && (
                <DrawerDescription className="text-sm text-[#86868B] mt-1">
                  {description}
                </DrawerDescription>
              )}
            </DrawerHeader>
          )}
          <div
            className={cn(
              'flex-1 overflow-y-auto px-6 overscroll-contain space-y-4 max-h-[80vh]',
              contentClassName
            )}
          >
            {children}
          </div>
          {footer && (
            <DrawerFooter className="px-6 pt-3 pb-2 shrink-0">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    </ResponsiveModalContext.Provider>
  );
};

export const ResponsiveModalClose = ({
  children,
  asChild,
  className,
}: {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}) => {
  const { isDesktop } = useResponsiveModal();
  if (isDesktop) {
    return (
      <DialogClose asChild={asChild} className={className}>
        {children}
      </DialogClose>
    );
  }
  return (
    <DrawerClose asChild={asChild} className={className}>
      {children}
    </DrawerClose>
  );
};

export default ResponsiveModal;
