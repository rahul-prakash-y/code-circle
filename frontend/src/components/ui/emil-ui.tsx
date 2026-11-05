import React, { createContext, useContext, useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import {
  EMIL_EASE_OUT,
  EMIL_EASE_IN_OUT,
  DURATION_MICRO,
  DURATION_DROPDOWN,
  DURATION_MODAL,
  emilMicroTap,
  emilMicroTapSubtle,
  createDropdownVariants,
  emilModalVariants,
  emilBackdropVariants,
  PopoverOrigin,
} from '../../lib/motion';

/* ══════════════════════════════════════════════════════════════
   1. COORDINTATED EMIL TOOLTIP SYSTEM
   - Delay initial tooltip (~350ms)
   - Zero-delay (0ms) for consecutive tooltips in same group
══════════════════════════════════════════════════════════════ */

interface TooltipGroupContextType {
  isWarm: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const TooltipGroupContext = createContext<TooltipGroupContextType>({
  isWarm: false,
  onOpen: () => {},
  onClose: () => {},
});

export const EmilTooltipGroup: React.FC<{ children: React.ReactNode; timeout?: number }> = ({
  children,
  timeout = 500,
}) => {
  const [isWarm, setIsWarm] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const onOpen = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsWarm(true);
  };

  const onClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsWarm(false);
    }, timeout);
  };

  return (
    <TooltipGroupContext.Provider value={{ isWarm, onOpen, onClose }}>
      {children}
    </TooltipGroupContext.Provider>
  );
};

export interface EmilTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const EmilTooltip: React.FC<EmilTooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 350,
}) => {
  const { isWarm, onOpen, onClose } = useContext(TooltipGroupContext);
  const [isOpen, setIsOpen] = useState(false);
  const openTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (isWarm) {
      // Instant transition for subsequent tooltips in the group
      setIsOpen(true);
      onOpen();
    } else {
      openTimerRef.current = setTimeout(() => {
        setIsOpen(true);
        onOpen();
      }, delay);
    }
  };

  const handleMouseLeave = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    setIsOpen(false);
    onClose();
  };

  const getPositionClasses = () => {
    switch (placement) {
      case 'bottom':
        return 'top-full mt-2 left-1/2 -translate-x-1/2 origin-top';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2 origin-right';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2 origin-left';
      case 'top':
      default:
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2 origin-bottom';
    }
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: isWarm ? 0.08 : 0.14,
              ease: EMIL_EASE_OUT,
            }}
            className={`absolute z-50 pointer-events-none px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap shadow-md backdrop-blur-md ${getPositionClasses()}`}
            style={{
              background: 'var(--surface-raised, #1C1C1E)',
              color: 'var(--label-primary, #FFFFFF)',
              border: '1px solid var(--separator, rgba(255,255,255,0.1))',
            }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   2. EMIL BUTTON (Strict Micro-interaction: scale 0.97)
══════════════════════════════════════════════════════════════ */

export interface EmilButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'flat' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isIconOnly?: boolean;
  isLoading?: boolean;
}

export const EmilButton = forwardRef<HTMLButtonElement, EmilButtonProps>(
  (
    {
      children,
      variant = 'solid',
      size = 'md',
      isIconOnly = false,
      isLoading = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: isIconOnly ? 'w-8 h-8 rounded-lg' : 'h-8 px-3 text-[12px] rounded-lg gap-1.5',
      md: isIconOnly ? 'w-9 h-9 rounded-xl' : 'h-9 px-4 text-[13px] rounded-xl gap-2',
      lg: isIconOnly ? 'w-11 h-11 rounded-2xl' : 'h-11 px-5 text-[14px] rounded-2xl gap-2.5',
    }[size];

    const variantClasses = {
      solid: 'bg-primary text-white font-medium shadow-sm hover:opacity-95',
      flat: 'bg-separator/40 hover:bg-separator/70 text-label-primary font-medium',
      outline: 'border border-separator bg-transparent hover:bg-separator/30 text-label-primary font-medium',
      ghost: 'bg-transparent hover:bg-separator/30 text-label-secondary hover:text-label-primary font-medium',
      danger: 'bg-destructive text-white font-medium hover:opacity-90',
    }[variant];

    return (
      <motion.button
        ref={ref}
        whileTap={disabled || isLoading ? undefined : { scale: 0.97 }}
        transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center select-none cursor-pointer outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
        {...(props as any)}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </motion.button>
    );
  }
);
EmilButton.displayName = 'EmilButton';

/* ══════════════════════════════════════════════════════════════
   3. EMIL CARD (Scale 0.95 Entrance, Tap Feedback)
══════════════════════════════════════════════════════════════ */

export interface EmilCardProps extends React.HTMLAttributes<HTMLDivElement> {
  isPressable?: boolean;
  isHoverable?: boolean;
}

export const EmilCard = forwardRef<HTMLDivElement, EmilCardProps>(
  ({ children, isPressable = false, isHoverable = true, className = '', ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileTap={isPressable ? { scale: 0.97 } : undefined}
        transition={{ duration: 0.2, ease: EMIL_EASE_OUT }}
        className={`rounded-2xl border border-separator bg-surface text-label-primary p-4 shadow-card transition-shadow duration-200 ${
          isHoverable ? 'hover:shadow-card-elevated hover:border-separator-opaque' : ''
        } ${isPressable ? 'cursor-pointer select-none' : ''} ${className}`}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }
);
EmilCard.displayName = 'EmilCard';

/* ══════════════════════════════════════════════════════════════
   4. EMIL DROPDOWN (Origin-Aware, Never scale(0), Sub-180ms)
══════════════════════════════════════════════════════════════ */

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  origin: PopoverOrigin;
}

const DropdownContext = createContext<DropdownContextType>({
  isOpen: false,
  setIsOpen: () => {},
  origin: 'top right',
});

export const EmilDropdownRoot: React.FC<{
  children: React.ReactNode;
  origin?: PopoverOrigin;
}> = ({ children, origin = 'top right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
      return () => document.removeEventListener('mousedown', handleOutside);
    }
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, origin }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export const EmilDropdownTrigger: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isOpen, setIsOpen } = useContext(DropdownContext);
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      children.props.onClick?.(e);
      setIsOpen(!isOpen);
    },
    'aria-expanded': isOpen,
  });
};

export const EmilDropdownMenu: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}> = ({ children, className = '', align = 'right' }) => {
  const { isOpen, origin } = useContext(DropdownContext);

  const alignClasses = align === 'right' ? 'right-0' : 'left-0';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={createDropdownVariants(origin)}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`absolute top-full mt-1.5 z-50 min-w-[200px] p-1.5 rounded-2xl bg-surface/95 backdrop-blur-md border border-separator shadow-xl outline-none ${alignClasses} ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const EmilDropdownItem: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  isDestructive?: boolean;
  className?: string;
}> = ({ children, onClick, icon, isDestructive = false, className = '' }) => {
  const { setIsOpen } = useContext(DropdownContext);

  const handleClick = () => {
    onClick?.();
    setIsOpen(false);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
      onClick={handleClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-left cursor-pointer transition-colors duration-100 ${
        isDestructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-label-primary hover:bg-separator/40 hover:text-label-primary'
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </motion.button>
  );
};

/* ══════════════════════════════════════════════════════════════
   5. EMIL MODAL (Centered, Backdrop-Blur-Md, Never scale(0))
══════════════════════════════════════════════════════════════ */

export interface EmilModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export const EmilModal: React.FC<EmilModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}) => {
  // Close on Escape key (instant keyboard action)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with backdrop-blur-md */}
          <motion.div
            variants={emilBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
          />

          {/* Centered Dialog: enters from scale(0.95), strong ease-out, sub-220ms */}
          <motion.div
            variants={emilModalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`relative z-10 w-full ${maxWidth} rounded-3xl bg-surface border border-separator shadow-2xl p-6 overflow-hidden`}
          >
            {title && (
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-separator">
                <div className="text-[17px] font-semibold text-label-primary tracking-tight">
                  {title}
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-label-secondary hover:text-label-primary bg-separator/40 hover:bg-separator/80 cursor-pointer transition-colors"
                  aria-label="Close dialog"
                >
                  ✕
                </motion.button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
