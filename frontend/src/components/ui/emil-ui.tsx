import ResponsiveModal from './ResponsiveModal';
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
   1. COORDINATED EMIL TOOLTIP SYSTEM
   - Delay initial tooltip (~350ms)
   - Zero-delay (0ms) for consecutive tooltips in same group
   - Apple Liquid Glass styling with dark mode shadow suppression
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
            className={`absolute z-50 pointer-events-none px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-none dark:ring-1 dark:ring-white/10 backdrop-blur-xl bg-[#FFFFFF] dark:bg-[#161617] text-[#1D1D1F] dark:text-[#F5F5F7] border border-black/5 dark:border-white/10 ${getPositionClasses()}`}
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
   - Apple HIG tonal variants
   - 0.97 tactile feedback
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
      solid: 'bg-primary text-white font-medium shadow-sm dark:shadow-none hover:opacity-95 active:opacity-90',
      flat: 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#1D1D1F] dark:text-[#F5F5F7] font-medium',
      outline: 'border border-black/10 dark:border-white/15 bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] font-medium',
      ghost: 'bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] font-medium',
      danger: 'bg-destructive text-white font-medium hover:opacity-90 active:opacity-85',
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
   3. EMIL CARD (Scale 0.95 Entrance, Tap Feedback, OLED Black Contrast)
   - Light: bg-[#FFFFFF], shadow-[0_8px_30px_rgb(0,0,0,0.04)]
   - Dark: bg-[#161617], shadow-none, ring-1 ring-white/10
══════════════════════════════════════════════════════════════ */

export interface EmilCardProps extends HTMLMotionProps<'div'> {
  isPressable?: boolean;
  isHoverable?: boolean;
}

export const EmilCard = forwardRef<HTMLDivElement, EmilCardProps>(
  (
    {
      children,
      isPressable = false,
      isHoverable = true,
      className = '',
      initial,
      animate,
      exit,
      whileTap,
      whileHover,
      transition,
      variants,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        variants={variants}
        initial={variants ? undefined : initial !== undefined ? initial : { opacity: 0, scale: 0.95 }}
        animate={variants ? undefined : animate !== undefined ? animate : { opacity: 1, scale: 1 }}
        exit={variants ? undefined : exit !== undefined ? exit : { opacity: 0, scale: 0.95 }}
        whileTap={whileTap !== undefined ? whileTap : isPressable ? { scale: 0.97 } : undefined}
        whileHover={whileHover}
        transition={transition !== undefined ? transition : { duration: 0.2, ease: EMIL_EASE_OUT }}
        className={`rounded-2xl border border-black/5 dark:border-white/10 bg-[#FFFFFF] dark:bg-[#161617] text-[#1D1D1F] dark:text-[#F5F5F7] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:ring-1 dark:ring-white/10 transition-all duration-200 ${
          isHoverable ? 'hover:shadow-[0_12px_36px_rgb(0,0,0,0.06)] dark:hover:shadow-none hover:border-black/10 dark:hover:ring-white/20' : ''
        } ${isPressable ? 'cursor-pointer select-none' : ''} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
EmilCard.displayName = 'EmilCard';

/* ══════════════════════════════════════════════════════════════
   4. EMIL DROPDOWN (Origin-Aware, Liquid Glass, Sub-180ms)
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

export const EmilDropdownTrigger: React.FC<{
  children: React.ReactElement<{
    onClick?: (e: React.MouseEvent) => void;
    'aria-expanded'?: boolean;
    [key: string]: any;
  }>;
}> = ({ children }) => {
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
          className={`absolute top-full mt-1.5 z-50 min-w-[200px] p-1.5 rounded-2xl bg-white/80 dark:bg-[#161617]/90 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.08)] dark:shadow-none dark:ring-1 dark:ring-white/10 outline-none ${alignClasses} ${className}`}
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
          : 'text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10'
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </motion.button>
  );
};

/* ══════════════════════════════════════════════════════════════
   5. EMIL MODAL (Centered, Backdrop-Blur-Xl, Never scale(0))
   - Light: bg-[#FFFFFF], shadow-[0_24px_60px_rgba(0,0,0,0.12)]
   - Dark: bg-[#161617], dark:shadow-none, dark:ring-1 dark:ring-white/10
══════════════════════════════════════════════════════════════ */

export interface EmilModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export const EmilModal: React.FC<EmilModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'sm:max-w-lg',
  className = '',
}) => {
  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={title}
      description={description}
      maxWidth={maxWidth}
      dialogClassName={className}
    >
      {children}
    </ResponsiveModal>
  );
};

/* ══════════════════════════════════════════════════════════════
   6. EMIL INPUT & TEXTAREA (Apple Form Ergonomics)
   - Light: bg-[#FFFFFF], border-black/10, placeholder-[#86868B]
   - Dark: bg-[#1C1C1E], border-white/10, placeholder-[#86868B]
══════════════════════════════════════════════════════════════ */

export interface EmilInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const EmilInput = forwardRef<HTMLInputElement, EmilInputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-3.5 py-2.5 rounded-xl text-[14px] bg-[#FFFFFF] dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] border ${
          error ? 'border-destructive' : 'border-black/10 dark:border-white/10 focus:border-primary'
        } placeholder-[#86868B] dark:placeholder-[#86868B] outline-none transition-all duration-150 focus:ring-2 focus:ring-primary/20 ${className}`}
        {...props}
      />
    );
  }
);
EmilInput.displayName = 'EmilInput';

export interface EmilTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const EmilTextarea = forwardRef<HTMLTextAreaElement, EmilTextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full px-3.5 py-2.5 rounded-xl text-[14px] bg-[#FFFFFF] dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] border ${
          error ? 'border-destructive' : 'border-black/10 dark:border-white/10 focus:border-primary'
        } placeholder-[#86868B] dark:placeholder-[#86868B] outline-none transition-all duration-150 focus:ring-2 focus:ring-primary/20 ${className}`}
        {...props}
      />
    );
  }
);
EmilTextarea.displayName = 'EmilTextarea';
