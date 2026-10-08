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
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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
  /** Optional presentation variant on desktop: 'dialog' (default centered) or 'slideover' (drawer/slide-over from right) */
  variant?: 'dialog' | 'slideover';
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
 * Full dark mode support using CSS variables (`var(--surface)` / `var(--text-primary)`).
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
  variant = 'dialog',
  snapPoints,
  activeSnapPoint,
  setActiveSnapPoint,
  shouldScaleBackground = true,
}) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    if (variant === 'slideover') {
      return (
        <ResponsiveModalContext.Provider value={{ isDesktop: true }}>
          {trigger && <div onClick={() => onOpenChange(true)}>{trigger}</div>}
          <AnimatePresence>
            {open && (
              <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onOpenChange(false)}
                  className="fixed inset-0 bg-black/40 backdrop-blur-[4px]"
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 32, stiffness: 350 }}
                  className={cn(
                    'relative z-50 h-full w-full max-w-2xl bg-surface text-text-primary shadow-2xl flex flex-col',
                    dialogClassName,
                    className
                  )}
                  style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}
                >
                  {(title || description) && (
                    <div className="flex items-center justify-between p-6 pb-4 border-b border-separator/40 shrink-0">
                      <div>
                        {title && (
                          <h2
                            className="text-xl font-bold tracking-tight text-text-primary"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {title}
                          </h2>
                        )}
                        {description && (
                          <p
                            className="text-sm text-text-muted mt-1"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-text-muted hover:text-text-primary"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  <div
                    className={cn(
                      'overflow-y-auto flex-1 p-6 pr-4',
                      contentClassName
                    )}
                  >
                    {children}
                  </div>
                  {footer && (
                    <div className="p-6 pt-4 border-t border-separator/40 shrink-0">
                      {footer}
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </ResponsiveModalContext.Provider>
      );
    }

    return (
      <ResponsiveModalContext.Provider value={{ isDesktop: true }}>
        <Dialog open={open} onOpenChange={onOpenChange}>
          {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
          <DialogContent
            className={cn(
              'sm:max-w-lg border border-separator bg-surface text-text-primary rounded-3xl p-6 shadow-2xl',
              dialogClassName,
              className
            )}
            style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}
          >
            {(title || description) && (
              <DialogHeader className="mb-2">
                {title && (
                  <DialogTitle
                    className="text-xl font-bold tracking-tight text-text-primary"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {title}
                  </DialogTitle>
                )}
                {description && (
                  <DialogDescription
                    className="text-sm text-text-muted mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
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
            'border-0 bg-surface text-text-primary rounded-t-[32px] shadow-2xl',
            drawerClassName,
            className
          )}
          style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}
        >
          {(title || description) && (
            <DrawerHeader className="px-6 pt-2 pb-2 text-left shrink-0">
              {title && (
                <DrawerTitle
                  className="text-xl font-bold tracking-tight text-text-primary"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {title}
                </DrawerTitle>
              )}
              {description && (
                <DrawerDescription
                  className="text-sm text-text-muted mt-1"
                  style={{ color: 'var(--text-muted)' }}
                >
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
