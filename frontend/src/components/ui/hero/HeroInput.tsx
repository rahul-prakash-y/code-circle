import React, { useState, useRef, useId, forwardRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmilCard } from '../emil-ui';
import { X, AlertCircle } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   1. HERO-UI INPUT (Apple Glass Feel + Floating Inside Label + Emil Motion)
   - Variant: 'flat' (borderless glass) or 'faded' (subtle hairline border)
   - labelPlacement: 'inside' (floating label) or 'outside'
   - text-[16px] on mobile to prevent iOS zooming
   - startContent / endContent icons
   ══════════════════════════════════════════════════════════════ */

export interface HeroInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  labelPlacement?: 'inside' | 'outside';
  variant?: 'flat' | 'faded' | 'bordered';
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  isClearable?: boolean;
  onClear?: () => void;
  error?: string;
  description?: string;
  isRequired?: boolean;
  size?: 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full' | string;
  onValueChange?: (val: string) => void;
}

export const HeroInput = forwardRef<HTMLInputElement, HeroInputProps>(
  (
    {
      label,
      labelPlacement = 'inside',
      variant = 'flat',
      startContent,
      endContent,
      isClearable = false,
      onClear,
      error,
      description,
      isRequired,
      size = 'md',
      radius,
      onValueChange,
      className = '',
      placeholder,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      type = 'text',
      disabled,
      ...rest
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalVal, setInternalVal] = useState(defaultValue ?? '');
    const currentVal = value !== undefined ? value : internalVal;
    const hasValue = Boolean(currentVal !== '' && currentVal !== undefined && currentVal !== null);
    const inputId = useId();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) setInternalVal(e.target.value);
      onChange?.(e);
      onValueChange?.(e.target.value);
    };

    const handleClear = () => {
      if (value === undefined) setInternalVal('');
      if (onClear) onClear();
      else if (onChange) {
        const syntheticEvent = {
          target: { value: '' },
          currentTarget: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
      onValueChange?.('');
    };

    const isFloating = isFocused || hasValue || Boolean(placeholder && isFocused);

    // Sizing heights
    const heightClass =
      labelPlacement === 'inside' && label
        ? size === 'sm'
          ? 'h-12'
          : size === 'lg'
          ? 'h-16'
          : 'h-14'
        : size === 'sm'
        ? 'h-9'
        : size === 'lg'
        ? 'h-12'
        : 'h-11';

    // Variant backgrounds & borders
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
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-wide text-label-secondary mb-1.5 px-0.5"
          >
            {label}
            {isRequired && <span className="text-destructive ml-0.5">*</span>}
          </label>
        )}

        <div
          className={`relative w-full flex items-center rounded-2xl transition-all duration-200 backdrop-blur-md ${heightClass} ${variantStyle} ${
            isFocused
              ? 'ring-2 ring-accent/25 border-accent/40 shadow-sm'
              : error
              ? 'border-destructive/60 ring-2 ring-destructive/20'
              : 'hover:border-black/15 dark:hover:border-white/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {startContent && (
            <div className="pl-3.5 pr-1.5 flex items-center justify-center text-label-tertiary shrink-0">
              {startContent}
            </div>
          )}

          <div className="relative flex-1 h-full flex flex-col justify-center px-3.5 min-w-0">
            {label && labelPlacement === 'inside' && (
              <span
                className={`absolute left-3.5 pointer-events-none transition-all duration-200 origin-top-left font-medium select-none truncate max-w-[85%] ${
                  isFloating
                    ? 'top-2 text-[10.5px] uppercase tracking-wider font-semibold text-label-tertiary'
                    : 'top-1/2 -translate-y-1/2 text-sm text-label-tertiary'
                } ${isFocused ? 'text-accent' : ''} ${error ? 'text-destructive' : ''}`}
              >
                {label}
                {isRequired && <span className="text-destructive ml-0.5">*</span>}
              </span>
            )}

            <input
              ref={ref}
              id={inputId}
              type={type}
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
              className={`w-full bg-transparent outline-none focus:outline-none border-none text-label-primary placeholder:text-label-tertiary font-normal leading-normal ${
                labelPlacement === 'inside' && label ? 'pt-3.5 pb-0.5' : ''
              } text-[16px] md:text-sm !outline-none !shadow-none`}
              style={{ outline: 'none', boxShadow: 'none' }}
              {...rest}
            />
          </div>

          <div className="flex items-center gap-1.5 pr-3.5 shrink-0">
            {isClearable && hasValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full text-label-tertiary hover:text-label-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {endContent && (
              <div className="text-label-tertiary flex items-center">
                {endContent}
              </div>
            )}
          </div>
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
HeroInput.displayName = 'HeroInput';
export { HeroInput as Input };
export default HeroInput;
