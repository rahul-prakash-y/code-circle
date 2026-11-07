import * as React from 'react';
import {
  Modal as HeroUIModal,
  ModalBackdrop as HeroUIModalBackdrop,
  ModalContainer as HeroUIModalContainer,
  ModalDialog as HeroUIModalDialog,
  ModalHeader as HeroUIModalHeader,
  ModalHeading as HeroUIModalHeading,
  ModalBody as HeroUIModalBody,
  ModalFooter as HeroUIModalFooter,
  ModalCloseTrigger as HeroUIModalCloseTrigger,
  ModalTrigger as HeroUIModalTrigger,
} from '@heroui/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = ({
  open,
  onOpenChange,
  children,
  ...props
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  return (
    <HeroUIModal isOpen={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </HeroUIModal>
  );
};

export const DialogTrigger = ({ asChild: _asChild, children, ...props }: any) => (
  <HeroUIModalTrigger {...props}>{children}</HeroUIModalTrigger>
);
export const DialogPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DialogOverlay = HeroUIModalBackdrop;

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { style?: React.CSSProperties }
>(({ className, children, ...props }, ref) => (
  <HeroUIModalBackdrop variant="blur" className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
    <HeroUIModalContainer className="w-full flex items-center justify-center">
      <HeroUIModalDialog
        ref={ref as any}
        className={cn(
          'relative w-full max-w-lg rounded-3xl border border-separator bg-surface text-label-primary p-6 shadow-2xl overflow-hidden focus:outline-none flex flex-col max-h-[90dvh]',
          className
        )}
        {...(props as any)}
      >
        {children}
        <HeroUIModalCloseTrigger className="absolute right-4 top-4 rounded-xl min-h-[36px] min-w-[36px] flex items-center justify-center text-label-secondary opacity-70 transition-all hover:opacity-100 hover:bg-surface-secondary active:scale-[0.97] focus:outline-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </HeroUIModalCloseTrigger>
      </HeroUIModalDialog>
    </HeroUIModalContainer>
  </HeroUIModalBackdrop>
));
DialogContent.displayName = 'DialogContent';

export const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <HeroUIModalHeader ref={ref as any} className={cn('flex flex-col space-y-1.5 text-left mb-4', className)} {...props} />
  )
);
DialogHeader.displayName = 'DialogHeader';

export const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <HeroUIModalFooter ref={ref as any} className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4', className)} {...props} />
  )
);
DialogFooter.displayName = 'DialogFooter';

export const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <HeroUIModalHeading ref={ref as any} className={cn('text-xl font-bold tracking-tight text-label-primary', className)} {...props} />
  )
);
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-label-secondary', className)} {...props} />
  )
);
DialogDescription.displayName = 'DialogDescription';

export const DialogClose = ({ asChild: _asChild, children, ...props }: any) => (
  <HeroUIModalCloseTrigger {...props}>{children}</HeroUIModalCloseTrigger>
);

export default Dialog;
