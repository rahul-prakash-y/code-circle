import React, { useState, useRef, useId, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmilCard } from './emil-ui';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';

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
        ? 'bg-[#FFFFFF]/70 dark:bg-[#161617]/70 border border-black/10 dark:border-white/10 shadow-sm'
        : variant === 'bordered'
        ? 'bg-transparent border border-black/15 dark:border-white/15'
        : 'bg-[#F2F2F7]/80 dark:bg-[#1C1C1E]/80 border border-transparent';

    return (
      <div className={`w-full group ${className}`}>
        {label && labelPlacement === 'outside' && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-wide text-[#6E6E73] dark:text-[#A1A1A6] mb-1.5 px-0.5"
          >
            {label}
            {isRequired && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div
          className={`relative w-full flex items-center rounded-2xl transition-all duration-200 backdrop-blur-md ${heightClass} ${variantStyle} ${
            isFocused
              ? 'ring-2 ring-[#0071E3]/25 dark:ring-[#2997FF]/30 border-[#0071E3]/40 dark:border-[#2997FF]/50 shadow-sm'
              : error
              ? 'border-red-500/60 ring-2 ring-red-500/20'
              : 'hover:border-black/15 dark:hover:border-white/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {startContent && (
            <div className="pl-3.5 pr-1.5 flex items-center justify-center text-[#86868B] dark:text-[#A1A1A6] shrink-0">
              {startContent}
            </div>
          )}

          <div className="relative flex-1 h-full flex flex-col justify-center px-3.5 min-w-0">
            {label && labelPlacement === 'inside' && (
              <span
                className={`absolute left-3.5 pointer-events-none transition-all duration-200 origin-top-left font-medium select-none truncate max-w-[85%] ${
                  isFloating
                    ? 'top-2 text-[10.5px] uppercase tracking-wider font-semibold text-[#86868B] dark:text-[#A1A1A6]'
                    : 'top-1/2 -translate-y-1/2 text-sm text-[#86868B] dark:text-[#8E8E93]'
                } ${isFocused ? 'text-[#0071E3] dark:text-[#2997FF]' : ''} ${error ? 'text-red-500' : ''}`}
              >
                {label}
                {isRequired && <span className="text-red-500 ml-0.5">*</span>}
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
              className={`w-full bg-transparent outline-none border-none text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#8E8E93] dark:placeholder-[#6E6E73] font-normal leading-normal ${
                labelPlacement === 'inside' && label ? 'pt-3.5 pb-0.5' : ''
              } text-[16px] md:text-sm`}
              {...rest}
            />
          </div>

          <div className="flex items-center gap-1.5 pr-3.5 shrink-0">
            {isClearable && hasValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {endContent && (
              <div className="text-[#86868B] dark:text-[#A1A1A6] flex items-center">
                {endContent}
              </div>
            )}
          </div>
        </div>

        {(error || description) && (
          <div className="mt-1.5 px-1 flex items-center gap-1.5 text-xs">
            {error ? (
              <p className="text-red-500 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {error}
              </p>
            ) : description ? (
              <p className="text-[#86868B] dark:text-[#A1A1A6]">{description}</p>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);
HeroInput.displayName = 'HeroInput';

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

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (value === undefined) setInternalVal(e.target.value);
      onChange?.(e);
    };

    const isFloating = isFocused || hasValue || Boolean(placeholder && isFocused);

    const variantStyle =
      variant === 'faded'
        ? 'bg-[#FFFFFF]/70 dark:bg-[#161617]/70 border border-black/10 dark:border-white/10 shadow-sm'
        : variant === 'bordered'
        ? 'bg-transparent border border-black/15 dark:border-white/15'
        : 'bg-[#F2F2F7]/80 dark:bg-[#1C1C1E]/80 border border-transparent';

    return (
      <div className={`w-full group ${className}`}>
        {label && labelPlacement === 'outside' && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold tracking-wide text-[#6E6E73] dark:text-[#A1A1A6] mb-1.5 px-0.5"
          >
            {label}
            {isRequired && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div
          className={`relative w-full rounded-2xl transition-all duration-200 backdrop-blur-md p-3.5 ${variantStyle} ${
            isFocused
              ? 'ring-2 ring-[#0071E3]/25 dark:ring-[#2997FF]/30 border-[#0071E3]/40 dark:border-[#2997FF]/50 shadow-sm'
              : error
              ? 'border-red-500/60 ring-2 ring-red-500/20'
              : 'hover:border-black/15 dark:hover:border-white/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {label && labelPlacement === 'inside' && (
            <span
              className={`block pointer-events-none transition-all duration-200 font-medium select-none truncate ${
                isFloating
                  ? 'text-[10.5px] uppercase tracking-wider font-semibold text-[#86868B] dark:text-[#A1A1A6] mb-1'
                  : 'text-sm text-[#86868B] dark:text-[#8E8E93] mb-1'
              } ${isFocused ? 'text-[#0071E3] dark:text-[#2997FF]' : ''} ${error ? 'text-red-500' : ''}`}
            >
              {label}
              {isRequired && <span className="text-red-500 ml-0.5">*</span>}
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
            className="w-full bg-transparent outline-none border-none resize-none text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#8E8E93] dark:placeholder-[#6E6E73] font-normal leading-relaxed text-[16px] md:text-sm"
            {...rest}
          />
        </div>

        {(error || description) && (
          <div className="mt-1.5 px-1 flex items-center gap-1.5 text-xs">
            {error ? (
              <p className="text-red-500 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {error}
              </p>
            ) : description ? (
              <p className="text-[#86868B] dark:text-[#A1A1A6]">{description}</p>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);
HeroTextarea.displayName = 'HeroTextarea';

/* ══════════════════════════════════════════════════════════════
   3. HERO-UI AVATAR & USER (Concentric Rings, Status, Apple Typography)
   - Avatar: <Avatar isBordered color="primary" />
   - User: <User name="..." description="..." avatarProps={{ ... }} />
   ══════════════════════════════════════════════════════════════ */

export interface HeroAvatarProps {
  src?: string | null;
  name?: string;
  fallback?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isBordered?: boolean;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const HeroAvatar: React.FC<HeroAvatarProps> = ({
  src,
  name,
  fallback,
  size = 'md',
  isBordered = false,
  color = 'primary',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }[size];

  const ringClasses = {
    default: 'ring-2 ring-black/15 dark:ring-white/20 ring-offset-2 ring-offset-[#FFFFFF] dark:ring-offset-[#161617]',
    primary: 'ring-2 ring-[#0071E3] dark:ring-[#2997FF] ring-offset-2 ring-offset-[#FFFFFF] dark:ring-offset-[#161617]',
    success: 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#FFFFFF] dark:ring-offset-[#161617]',
    warning: 'ring-2 ring-amber-500 ring-offset-2 ring-offset-[#FFFFFF] dark:ring-offset-[#161617]',
    danger: 'ring-2 ring-red-500 ring-offset-2 ring-offset-[#FFFFFF] dark:ring-offset-[#161617]',
  }[color];

  const getInitials = (n?: string) => {
    if (!n) return '•';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none overflow-hidden font-semibold transition-transform duration-150 ${sizeClasses} ${
        isBordered ? ringClasses : ''
      } bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] ${className}`}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : fallback ? (
        fallback
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

export interface HeroUserProps {
  name: string;
  description?: React.ReactNode;
  avatarProps?: HeroAvatarProps;
  className?: string;
  onClick?: () => void;
}

export const HeroUser: React.FC<HeroUserProps> = ({
  name,
  description,
  avatarProps,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 text-left ${
        onClick ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''
      } ${className}`}
    >
      <HeroAvatar name={name} {...avatarProps} />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate leading-snug">
          {name}
        </span>
        {description && (
          <span className="text-xs text-[#86868B] dark:text-[#A1A1A6] truncate leading-tight">
            {description}
          </span>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   4. HERO-UI TABS (Emil Kowalski sub-300ms Spring Motion)
   - Spring Physics: { type: "spring", stiffness: 260, damping: 30 }
   ══════════════════════════════════════════════════════════════ */

export interface HeroTabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface HeroTabsProps {
  items?: HeroTabItem[];
  selectedKey?: string;
  defaultSelectedKey?: string;
  onSelectionChange?: (key: string) => void;
  motionProps?: any;
  variant?: 'solid' | 'bordered' | 'light' | 'underlined';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export const HeroTabs: React.FC<HeroTabsProps> = ({
  items = [],
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  motionProps = { transition: { type: 'spring', stiffness: 260, damping: 30 } },
  variant = 'solid',
  size = 'md',
  className = '',
  children,
}) => {
  const [internalKey, setInternalKey] = useState<string>(
    defaultSelectedKey || (items[0]?.id ?? '')
  );
  const activeKey = selectedKey !== undefined ? selectedKey : internalKey;

  const handleSelect = (key: string) => {
    if (selectedKey === undefined) setInternalKey(key);
    onSelectionChange?.(key);
  };

  const containerPadding = size === 'sm' ? 'p-1' : size === 'lg' ? 'p-1.5' : 'p-1';
  const tabPadding =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs'
      : size === 'lg'
      ? 'px-5 py-2.5 text-sm'
      : 'px-4 py-2 text-xs md:text-sm';

  return (
    <div
      className={`inline-flex items-center rounded-2xl bg-[#F2F2F7] dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 backdrop-blur-md ${containerPadding} ${className}`}
    >
      {items.map((tab) => {
        const isActive = activeKey === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => handleSelect(tab.id)}
            className={`relative flex items-center justify-center gap-2 font-medium transition-colors select-none z-10 rounded-xl ${tabPadding} ${
              tab.disabled
                ? 'opacity-40 cursor-not-allowed'
                : isActive
                ? 'text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold'
                : 'text-[#86868B] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabBadge"
                className="absolute inset-0 bg-[#FFFFFF] dark:bg-[#2C2C2E] rounded-xl shadow-sm border border-black/5 dark:border-white/10 -z-10"
                transition={motionProps.transition}
              />
            )}
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span className="truncate">{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-semibold ${
                  isActive
                    ? 'bg-[#0071E3]/10 dark:bg-[#2997FF]/20 text-[#0071E3] dark:text-[#2997FF]'
                    : 'bg-black/5 dark:bg-white/10 text-[#86868B]'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
      {children}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   5. HERO-UI DATA TABLE (EmilCard Wrapped + Apple Monochrome Selection)
   - Built-in pagination, sorting, selectionMode="single" | "multiple"
   - removeWrapper: eliminates raw borders and integrates into EmilCard
   - color="default" monochrome Apple look
   ══════════════════════════════════════════════════════════════ */

export interface HeroTableColumn<T = any> {
  key: string;
  label: React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface HeroTableProps<T = any> {
  columns: HeroTableColumn<T>[];
  data: T[];
  keyField?: string;
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  removeWrapper?: boolean;
  color?: 'default' | 'primary';
  pageSize?: number;
  emptyContent?: React.ReactNode;
  className?: string;
  rowClassName?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
}

export function HeroTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = 'id',
  selectionMode = 'single',
  selectedKeys,
  onSelectionChange,
  removeWrapper = true,
  color = 'default',
  pageSize = 10,
  emptyContent = 'No data available',
  className = '',
  rowClassName,
  onRowClick,
}: HeroTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());

  const currentSelected = selectedKeys !== undefined ? selectedKeys : internalSelected;

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Sorting
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : 1;
      } else {
        return aVal > bVal ? -1 : 1;
      }
    });
  }, [data, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleRowSelect = (rowKey: string) => {
    if (selectionMode === 'none') return;
    const nextSelected = new Set(currentSelected);
    if (selectionMode === 'single') {
      if (nextSelected.has(rowKey)) {
        nextSelected.clear();
      } else {
        nextSelected.clear();
        nextSelected.add(rowKey);
      }
    } else {
      if (nextSelected.has(rowKey)) {
        nextSelected.delete(rowKey);
      } else {
        nextSelected.add(rowKey);
      }
    }
    if (selectedKeys === undefined) setInternalSelected(nextSelected);
    onSelectionChange?.(nextSelected);
  };

  const tableBody = (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-black/[0.06] dark:border-white/[0.08] bg-[#FAFAFC]/50 dark:bg-[#161617]/50">
            {columns.map((col) => {
              const isSorted = sortColumn === col.key;
              return (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-[#86868B] dark:text-[#A1A1A6] select-none ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  } ${col.sortable ? 'cursor-pointer hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors' : ''}`}
                >
                  <div
                    className={`inline-flex items-center gap-1.5 ${
                      col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                    }`}
                  >
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="text-[#86868B]">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#2997FF]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#2997FF]" />
                          )
                        ) : (
                          <div className="flex flex-col opacity-30 hover:opacity-100">
                            <ChevronUp className="w-2.5 h-2.5 -mb-1" />
                            <ChevronDown className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
          {paginatedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 text-center text-sm text-[#86868B] dark:text-[#A1A1A6]"
              >
                {emptyContent}
              </td>
            </tr>
          ) : (
            paginatedData.map((row, index) => {
              const rowKey = String(row[keyField] ?? index);
              const isSelected = currentSelected.has(rowKey);
              const customClass = rowClassName ? rowClassName(row, index) : '';

              return (
                <tr
                  key={rowKey}
                  onClick={() => {
                    handleRowSelect(rowKey);
                    onRowClick?.(row);
                  }}
                  className={`group transition-colors duration-150 ${
                    selectionMode !== 'none' || onRowClick ? 'cursor-pointer' : ''
                  } ${
                    isSelected
                      ? 'bg-black/[0.04] dark:bg-white/[0.08] font-medium'
                      : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                  } ${customClass}`}
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left';

                    return (
                      <td
                        key={col.key}
                        className={`py-3.5 px-4 text-[#1D1D1F] dark:text-[#F5F5F7] ${alignClass}`}
                      >
                        {col.render ? col.render(row, index) : row[col.key]}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#FAFAFC]/30 dark:bg-[#161617]/30 text-xs text-[#86868B]">
          <span>
            Showing <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">{Math.min(currentPage * pageSize, sortedData.length)}</strong> of{' '}
            <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">{sortedData.length}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (removeWrapper) {
    return (
      <EmilCard className={`overflow-hidden p-0 border border-black/10 dark:border-white/10 ${className}`}>
        {tableBody}
      </EmilCard>
    );
  }

  return <div className={`w-full ${className}`}>{tableBody}</div>;
}

// Named Aliases for HeroUI Standard Directives
export { HeroInput as Input };
export { HeroTextarea as Textarea };
export { HeroTabs as Tabs };
export { HeroTable as Table };
export { HeroAvatar as Avatar };
export { HeroUser as User };
export { HeroUISelect as Select } from './HeroUISelect';
