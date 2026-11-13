import React, { useState, useRef, useId, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmilCard } from '../emil-ui';
import { Calendar, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';

export interface HeroDatePickerProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (dateString: string) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'flat' | 'faded' | 'bordered';
  isClearable?: boolean;
  isRequired?: boolean;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  error?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}

export const HeroDatePicker: React.FC<HeroDatePickerProps> = ({
  label,
  placeholder = 'Select date...',
  value = '',
  onChange,
  size = 'md',
  variant = 'flat',
  isClearable = true,
  isRequired = false,
  minDate,
  maxDate,
  disabled = false,
  className = '',
  description,
  error,
  startContent,
  endContent,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dateId = useId();

  const parsedDate = value ? new Date(value + (value.length === 10 ? 'T00:00:00' : '')) : null;
  const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

  const [viewYear, setViewYear] = useState(() => (isValidDate ? parsedDate.getFullYear() : new Date().getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (isValidDate ? parsedDate.getMonth() : new Date().getMonth()));

  useEffect(() => {
    if (isValidDate) {
      setViewYear(parsedDate.getFullYear());
      setViewMonth(parsedDate.getMonth());
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const y = viewYear;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    onChange?.(dateStr);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    onChange?.(dateStr);
    setViewYear(y);
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
  };

  const displayValue = isValidDate
    ? parsedDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const heightClass =
    size === 'sm' ? 'h-9 px-3 text-xs' : size === 'lg' ? 'h-12 px-4 text-base' : 'h-10 px-3.5 text-sm';

  const variantStyle =
    variant === 'faded'
      ? 'bg-surface/70 border border-separator shadow-sm'
      : variant === 'bordered'
      ? 'bg-transparent border border-separator-opaque'
      : 'bg-surface-secondary/80 border border-transparent';

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-left ${className}`}>
      {label && (
        <label htmlFor={dateId} className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <div
        id={dateId}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 rounded-2xl cursor-pointer select-none transition-all duration-150 ${heightClass} ${variantStyle} ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : isOpen
            ? 'ring-2 ring-accent/20 border-accent bg-surface shadow-md'
            : 'hover:bg-surface hover:border-separator-opaque'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
          <span className="text-label-tertiary shrink-0">
            {startContent || <Calendar size={15} />}
          </span>
          {displayValue ? (
            <span className="font-medium text-label-primary truncate">{displayValue}</span>
          ) : (
            <span className="text-label-tertiary truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-label-tertiary">
          {isClearable && displayValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-label-tertiary hover:text-label-primary transition-colors"
              title="Clear date"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {description && !error && (
        <p className="text-[11px] text-label-tertiary mt-1">{description}</p>
      )}
      {error && <p className="text-[11px] text-danger mt-1 font-medium">{error}</p>}

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 z-50 mt-1 w-72 rounded-2xl bg-surface-raised border border-separator shadow-2xl backdrop-blur-xl p-3.5"
          >
            {/* Header: Month / Year Nav */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-label-primary">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg border border-separator hover:bg-surface-secondary text-label-secondary hover:text-label-primary transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg border border-separator hover:bg-surface-secondary text-label-secondary hover:text-label-primary transition-colors cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Weekday Names */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DAYS.map((d) => (
                <span key={d} className="text-[10px] font-bold text-label-tertiary uppercase">
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`blank-${i}`} className="w-8 h-8" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected =
                  isValidDate &&
                  parsedDate.getFullYear() === viewYear &&
                  parsedDate.getMonth() === viewMonth &&
                  parsedDate.getDate() === dayNum;

                const isToday =
                  new Date().getFullYear() === viewYear &&
                  new Date().getMonth() === viewMonth &&
                  new Date().getDate() === dayNum;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-accent text-white shadow-xs'
                        : isToday
                        ? 'border border-accent/40 text-accent font-bold hover:bg-accent/10'
                        : 'text-label-primary hover:bg-surface-secondary'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-3 mt-2 border-t border-separator/60 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleSelectToday}
                className="text-accent hover:underline font-semibold text-[11px] cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-label-tertiary hover:text-label-primary text-[11px] cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
