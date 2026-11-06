import React, { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X, Search, Sparkles } from 'lucide-react';

export interface HeroUISelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

export interface HeroUISelectProps {
  label?: string;
  placeholder?: string;
  options: (HeroUISelectOption | string)[];
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  className?: string;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'flat' | 'bordered' | 'faded';
  color?: 'primary' | 'accent' | 'purple' | 'emerald';
  startContent?: React.ReactNode;
}

export const HeroUISelect: React.FC<HeroUISelectProps> = ({
  label,
  placeholder = 'Select an option...',
  options = [],
  value = '',
  onChange,
  required = false,
  disabled = false,
  isClearable = false,
  isSearchable = false,
  className = '',
  description,
  error,
  size = 'md',
  color = 'accent',
  startContent,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerId = useId();

  // Normalize options
  const normalizedOptions: HeroUISelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Filter options based on search query
  const filteredOptions = isSearchable && searchQuery.trim()
    ? normalizedOptions.filter((opt) => {
        const query = searchQuery.toLowerCase();
        return (
          opt.label.toLowerCase().includes(query) ||
          (opt.description && opt.description.toLowerCase().includes(query)) ||
          (opt.badge && opt.badge.toLowerCase().includes(query))
        );
      })
    : normalizedOptions;

  // Handle outside click
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

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen, isSearchable]);

  const handleSelect = (val: string, isDisabled?: boolean) => {
    if (isDisabled || disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl min-h-[34px]',
    md: 'px-3.5 py-2.5 text-xs sm:text-sm rounded-2xl min-h-[42px]',
    lg: 'px-4 py-3 text-sm rounded-2xl min-h-[48px]',
  }[size];

  const focusBorderColor = {
    primary: 'focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30',
    accent: 'focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30',
    purple: 'focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/30',
    emerald: 'focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/30',
  }[color];

  return (
    <div ref={containerRef} className={`relative w-full text-left ${className}`}>
      {label && (
        <label
          htmlFor={triggerId}
          className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Main Trigger Button */}
      <div
        id={triggerId}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        className={`w-full flex items-center justify-between gap-2.5 cursor-pointer select-none transition-all duration-150 ${sizeClasses} ${focusBorderColor} ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-400'
            : isOpen
            ? 'bg-white dark:bg-[#1E1E22] border border-zinc-300 dark:border-white/20 shadow-md ring-2 ring-black/5 dark:ring-white/10'
            : 'bg-zinc-50 dark:bg-white/[0.05] hover:bg-zinc-100 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          {startContent && <span className="shrink-0 text-zinc-500 dark:text-zinc-400">{startContent}</span>}
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-zinc-400 dark:text-zinc-500">
          {isClearable && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              title="Clear selection"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-zinc-800 dark:text-zinc-200' : ''}`}
          />
        </div>
      </div>

      {description && !error && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-tight">{description}</p>
      )}

      {error && <p className="text-[11px] text-rose-500 mt-1 font-medium">{error}</p>}

      {/* Popover Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 z-50 overflow-hidden rounded-2xl bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-white/15 shadow-2xl dark:shadow-black/80 backdrop-blur-xl p-1.5"
          >
            {/* Search Input for Autocomplete */}
            {isSearchable && (
              <div className="p-1.5 pb-2 border-b border-zinc-100 dark:border-white/10">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search options..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsOpen(false);
                      if (e.key === 'Enter' && filteredOptions.length > 0) {
                        e.preventDefault();
                        handleSelect(filteredOptions[0].value, filteredOptions[0].disabled);
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto space-y-0.5 p-1 no-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="py-6 px-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
                  No matching options found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt.value, opt.disabled)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm text-left transition-colors cursor-pointer ${
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed text-zinc-400'
                          : isSelected
                          ? 'bg-indigo-600/10 dark:bg-white/15 text-indigo-600 dark:text-white font-semibold'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {opt.icon && <span className="shrink-0 text-zinc-500 dark:text-zinc-400">{opt.icon}</span>}
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{opt.label}</span>
                            {opt.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          {opt.description && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-normal">
                              {opt.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check size={15} className="shrink-0 text-indigo-600 dark:text-emerald-400 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroUISelect;
