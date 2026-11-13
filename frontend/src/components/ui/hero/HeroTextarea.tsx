import React, { useState, useRef, useId, forwardRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmilCard } from '../emil-ui';
import { X, AlertCircle } from 'lucide-react';
/* ══════════════════════════════════════════════════════════════
   2. HERO-UI TEXTAREA (Apple Glass Floating Label)
   ══════════════════════════════════════════════════════════════ */

export interface HeroTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelPlacement?: 'inside' | 'outside';
  variant?: 'flat' | 'faded' | 'bordered';
  error?: string;
  description?: string;
  isRequired?: boolean;
  minRows?: number;
  maxRows?: number;
  onValueChange?: (val: string) => void;
}

export const HeroTextarea = forwardRef<HTMLTextAreaElement, HeroTextareaProps>(
  (
    {
      label,
      labelPlacement = 'inside',
      variant = 'flat',
      error,
      description,
      isRequired,
      className = '',
      placeholder,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      rows = 4,
      minRows,
      maxRows,
      onValueChange,
      disabled,
      ...rest
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalVal, setInternalVal] = useState(defaultValue ?? '');
    const currentVal = value !== undefined ? value : internalVal;
    const hasValue = Boolean(currentVal !== '' && currentVal !== undefined && currentVal !== null);
    const textareaId = useId();

    const effectiveRows = minRows || rows;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (value === undefined) setInternalVal(e.target.value);
      onChange?.(e);
      onValueChange?.(e.target.value);
    };

    const isFloating = isFocused || hasValue || Boolean(placeholder && isFocused);

    const variantStyle =
      variant === 'faded'
        ? 'bg-surface/70 border border-separator shadow-sm'
        : variant === 'bordered'
        ? 'bg-transparent border border-separator-opaque'
        : 'bg-surface-secondary/80 border border-transparent';

    return (
      <div className={`w-full group ${className}`}>
        {label && labelPlacement === 'outside' && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold tracking-wide text-label-secondary mb-1.5 px-0.5"
          >
            {label}
            {isRequired && <span className="text-destructive ml-0.5">*</span>}
          </label>
        )}

        <div
          className={`relative w-full rounded-2xl transition-all duration-200 backdrop-blur-md p-3.5 ${variantStyle} ${
            isFocused
              ? 'ring-2 ring-accent/25 border-accent/40 shadow-sm'
              : error
              ? 'border-destructive/60 ring-2 ring-destructive/20'
              : 'hover:border-black/15 dark:hover:border-white/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {label && labelPlacement === 'inside' && (
            <span
              className={`block pointer-events-none transition-all duration-200 font-medium select-none truncate ${
                isFloating
                  ? 'text-[10.5px] uppercase tracking-wider font-semibold text-label-tertiary mb-1'
                  : 'text-sm text-label-tertiary mb-1'
              } ${isFocused ? 'text-accent' : ''} ${error ? 'text-destructive' : ''}`}
            >
              {label}
              {isRequired && <span className="text-destructive ml-0.5">*</span>}
            </span>
          )}

          <textarea
            ref={ref}
            id={textareaId}
            rows={rows}
            value={currentVal}
            disabled={disabled}
            placeholder={labelPlacement === 'inside' && !isFocused && !hasValue ? '' : placeholder}
            onChange={handleChange}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            className="w-full bg-transparent outline-none focus:outline-none border-none resize-none text-label-primary placeholder:text-label-tertiary font-normal leading-relaxed text-[16px] md:text-sm !outline-none !shadow-none"
            style={{ outline: 'none', boxShadow: 'none' }}
            {...rest}
          />
        </div>

        {(error || description) && (
          <div className="mt-1.5 px-1 flex items-center gap-1.5 text-xs">
            {error ? (
              <p className="text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {error}
              </p>
            ) : description ? (
              <p className="text-label-tertiary">{description}</p>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);
HeroTextarea.displayName = 'HeroTextarea';
export { HeroTextarea as Textarea };
export default HeroTextarea;
