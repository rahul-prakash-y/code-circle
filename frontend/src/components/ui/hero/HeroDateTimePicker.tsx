import React, { useState, useRef, useId, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmilCard } from '../emil-ui';
import { Calendar, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';
import { HeroUISelect } from '../HeroUISelect';


export interface HeroDateTimePickerProps {
  label?: string;
  placeholder?: string;
  value?: string; // YYYY-MM-DDTHH:mm
  onChange?: (val: string) => void;
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
  timezoneLabel?: string;
  placement?: 'top' | 'bottom' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'auto';
}

export const HeroDateTimePicker: React.FC<HeroDateTimePickerProps> = ({
  label,
  placeholder = 'Select date & time...',
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
  timezoneLabel,
  placement = 'bottom',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dateTimeId = useId();

  const parseVal = (v: string) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  const parsedDate = parseVal(value);

  // Extract date and time parts
  const initialDateStr = value ? value.split('T')[0] : '';
  const initialTimeStr = value && value.includes('T') ? value.split('T')[1]?.slice(0, 5) : '09:00';

  const [selectedDate, setSelectedDate] = useState<string>(initialDateStr);
  const [selectedHour, setSelectedHour] = useState<number>(() => {
    if (!initialTimeStr) return 9;
    const h = parseInt(initialTimeStr.split(':')[0], 10);
    return isNaN(h) ? 9 : h;
  });
  const [selectedMinute, setSelectedMinute] = useState<number>(() => {
    if (!initialTimeStr) return 0;
    const m = parseInt(initialTimeStr.split(':')[1], 10);
    return isNaN(m) ? 0 : m;
  });

  const [viewYear, setViewYear] = useState(() => (parsedDate ? parsedDate.getFullYear() : new Date().getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (parsedDate ? parsedDate.getMonth() : new Date().getMonth()));

  useEffect(() => {
    if (value) {
      const d = parseVal(value);
      if (d) {
        setSelectedDate(value.split('T')[0]);
        const parts = value.split('T')[1]?.slice(0, 5).split(':');
        if (parts && parts.length === 2) {
          setSelectedHour(parseInt(parts[0], 10) || 0);
          setSelectedMinute(parseInt(parts[1], 10) || 0);
        }
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    } else {
      setSelectedDate('');
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

  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (placement?.startsWith('top')) {
        setOpenUpward(true);
        return;
      }
      if (placement?.startsWith('bottom')) {
        setOpenUpward(false);
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpward(spaceBelow < 380 && spaceAbove > spaceBelow);
    }
  }, [isOpen, placement]);

  const isUpward = placement?.startsWith('top') || (placement === 'auto' && openUpward);
  const isRightAligned = placement === 'top-end' || placement === 'bottom-end';

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

  const emitDateTime = (dateStr: string, hour: number, minute: number) => {
    const h = String(hour).padStart(2, '0');
    const m = String(minute).padStart(2, '0');
    const full = `${dateStr}T${h}:${m}`;
    onChange?.(full);
  };

  const handleSelectDay = (day: number) => {
    const y = viewYear;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    setSelectedDate(dateStr);
    emitDateTime(dateStr, selectedHour, selectedMinute);
  };

  const handleHourChange = (newHour: number) => {
    setSelectedHour(newHour);
    const dateStr = selectedDate || new Date().toISOString().split('T')[0];
    if (!selectedDate) setSelectedDate(dateStr);
    emitDateTime(dateStr, newHour, selectedMinute);
  };

  const handleMinuteChange = (newMinute: number) => {
    setSelectedMinute(newMinute);
    const dateStr = selectedDate || new Date().toISOString().split('T')[0];
    if (!selectedDate) setSelectedDate(dateStr);
    emitDateTime(dateStr, selectedHour, newMinute);
  };

  const handleSetNow = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const h = now.getHours();
    const min = Math.floor(now.getMinutes() / 5) * 5;
    setSelectedDate(dateStr);
    setSelectedHour(h);
    setSelectedMinute(min);
    setViewYear(y);
    setViewMonth(now.getMonth());
    emitDateTime(dateStr, h, min);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate('');
    onChange?.('');
  };

  // 12-hour display calculation
  const hour12 = selectedHour % 12 === 0 ? 12 : selectedHour % 12;
  const isPM = selectedHour >= 12;

  let displayValue = '';
  if (selectedDate) {
    const [y, m, d] = selectedDate.split('-').map(Number);
    if (y && m && d) {
      const tempDate = new Date(y, m - 1, d);
      if (!isNaN(tempDate.getTime())) {
        const monthShort = tempDate.toLocaleDateString(undefined, { month: 'short' });
        const timePart = `${String(hour12).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
        displayValue = `${d} ${monthShort} ${y}, ${timePart}`;
      }
    }
  }

  const hourOptions = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1;
    return {
      value: String(h),
      label: `${String(h).padStart(2, '0')} hr`,
    };
  });

  const baseMinutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const minuteList = baseMinutes.includes(selectedMinute)
    ? baseMinutes
    : [...baseMinutes, selectedMinute].sort((a, b) => a - b);

  const minuteOptions = minuteList.map((m) => ({
    value: String(m),
    label: `${String(m).padStart(2, '0')} min`,
  }));

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
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <label htmlFor={dateTimeId} className="block text-xs font-semibold text-label-secondary uppercase tracking-wider">
            {label} {isRequired && <span className="text-destructive">*</span>}
          </label>
          {timezoneLabel && (
            <span className="text-[10px] font-mono font-bold text-accent px-1.5 py-0.5 rounded-md bg-accent-subtle border border-accent/20">
              {timezoneLabel}
            </span>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <div
        id={dateTimeId}
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
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-label-tertiary hover:text-label-primary transition-colors cursor-pointer"
              title="Clear date and time"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {description && !error && (
        <p className="text-[11px] text-label-tertiary mt-1">{description}</p>
      )}
      {error && <p className="text-[11px] text-destructive mt-1 font-medium">{error}</p>}

      {/* Calendar & Time Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isUpward ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: isUpward ? -4 : 4, scale: 1 }}
            exit={{ opacity: 0, y: isUpward ? 6 : -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-[100] ${isUpward ? 'bottom-full mb-2' : 'top-full mt-2'} ${
              isRightAligned ? 'right-0' : 'left-0'
            } w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-surface-raised border border-separator shadow-2xl backdrop-blur-xl p-4`}
          >
            {/* Calendar Header: Month / Year Nav */}
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
            <div className="grid grid-cols-7 gap-1 text-center mb-3">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`blank-${i}`} className="w-8 h-8" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const mStr = String(viewMonth + 1).padStart(2, '0');
                const dStr = String(dayNum).padStart(2, '0');
                const currentFormatted = `${viewYear}-${mStr}-${dStr}`;

                const isSelected = selectedDate === currentFormatted;
                const todayFormatted = new Date().toISOString().split('T')[0];
                const isToday = currentFormatted === todayFormatted;

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

            {/* Time Selector Divider & Controls */}
            <div className="pt-3 border-t border-separator/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-label-secondary uppercase tracking-wider flex items-center gap-1">
                  Time (IST)
                </span>
                <span className="font-mono text-xs font-bold text-accent">
                  {String(hour12).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')} {isPM ? 'PM' : 'AM'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Hours HeroUISelect */}
                <div className="flex-1 min-w-0">
                  <HeroUISelect
                    options={hourOptions}
                    value={String(hour12)}
                    onChange={(val) => {
                      const h12 = parseInt(val, 10);
                      const h24 = isPM ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
                      handleHourChange(h24);
                    }}
                    size="sm"
                    placement="top-start"
                  />
                </div>

                <span className="font-bold text-label-tertiary shrink-0 text-xs">:</span>

                {/* Minutes HeroUISelect */}
                <div className="flex-1 min-w-0">
                  <HeroUISelect
                    options={minuteOptions}
                    value={String(selectedMinute)}
                    onChange={(val) => handleMinuteChange(parseInt(val, 10))}
                    size="sm"
                    placement="top-end"
                  />
                </div>

                {/* AM / PM Toggle */}
                <div className="flex rounded-xl border border-separator overflow-hidden p-0.5 bg-surface-secondary shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (isPM) handleHourChange(selectedHour - 12);
                    }}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                      !isPM ? 'bg-accent text-white shadow-xs' : 'text-label-secondary hover:text-label-primary'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isPM) handleHourChange(selectedHour + 12);
                    }}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                      isPM ? 'bg-accent text-white shadow-xs' : 'text-label-secondary hover:text-label-primary'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-3 mt-3 border-t border-separator/60 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleSetNow}
                className="text-accent hover:underline font-semibold text-[11px] cursor-pointer"
              >
                Set to Now
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1 rounded-xl bg-accent text-white hover:bg-accent/90 text-xs font-semibold shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

