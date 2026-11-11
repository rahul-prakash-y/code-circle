import React, { useState, useRef, useId, forwardRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmilCard } from './emil-ui';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, AlertCircle, Calendar, Check } from 'lucide-react';
import { HeroUISelect } from './HeroUISelect';

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
    default: 'ring-2 ring-black/15 dark:ring-white/20 ring-offset-2 ring-offset-surface',
    primary: 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
    success: 'ring-2 ring-success ring-offset-2 ring-offset-surface',
    warning: 'ring-2 ring-warning ring-offset-2 ring-offset-surface',
    danger: 'ring-2 ring-destructive ring-offset-2 ring-offset-surface',
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
      } bg-separator-opaque text-label-primary ${className}`}
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
        <span className="text-sm font-semibold text-label-primary truncate leading-snug">
          {name}
        </span>
        {description && (
          <span className="text-xs text-label-tertiary truncate leading-tight">
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
      className={`inline-flex items-center rounded-2xl bg-surface-secondary border border-black/5 dark:border-white/5 backdrop-blur-md ${containerPadding} ${className}`}
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
                ? 'text-label-primary font-semibold'
                : 'text-label-tertiary hover:text-label-primary'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabBadge"
                className="absolute inset-0 bg-surface-raised rounded-xl shadow-sm border border-black/5 dark:border-white/10 -z-10"
                transition={motionProps.transition}
              />
            )}
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span className="truncate">{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-semibold ${
                  isActive
                    ? 'bg-accent-subtle text-accent'
                    : 'bg-black/5 dark:bg-white/10 text-label-tertiary'
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
          <tr className="border-b border-separator bg-surface-secondary/50">
            {columns.map((col) => {
              const isSorted = sortColumn === col.key;
              return (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-label-tertiary select-none ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  } ${col.sortable ? 'cursor-pointer hover:text-label-primary transition-colors' : ''}`}
                >
                  <div
                    className={`inline-flex items-center gap-1.5 ${
                      col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                    }`}
                  >
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="text-label-tertiary">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-accent" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-accent" />
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
                className="py-12 text-center text-sm text-label-tertiary"
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
                        className={`py-3.5 px-4 text-label-primary ${alignClass}`}
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-separator bg-surface-secondary/30 text-xs text-label-tertiary">
          <span>
            Showing <strong className="text-label-primary">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-label-primary">{Math.min(currentPage * pageSize, sortedData.length)}</strong> of{' '}
            <strong className="text-label-primary">{sortedData.length}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-separator hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
              className="p-1.5 rounded-lg border border-separator hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
      <EmilCard className={`overflow-hidden p-0 border border-separator ${className}`}>
        {tableBody}
      </EmilCard>
    );
  }

  return <div className={`w-full ${className}`}>{tableBody}</div>;
}

/* ══════════════════════════════════════════════════════════════
   7. HERO-UI CHIP (Polished Pill / Badge with Emil Kowalski Micro-Interactions)
   - Variants: 'flat' | 'solid' | 'bordered' | 'dot' | 'faded'
   - Colors: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'accent'
   - Sizes: 'sm' | 'md' | 'lg'
   - Radii: 'full' | 'lg' | 'md' | 'sm'
   ══════════════════════════════════════════════════════════════ */

export interface HeroChipProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'flat' | 'solid' | 'bordered' | 'dot' | 'faded';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  radius?: 'full' | 'lg' | 'md' | 'sm' | 'none';
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const HeroChip: React.FC<HeroChipProps> = ({
  children,
  variant = 'flat',
  color = 'default',
  size = 'sm',
  radius = 'full',
  startContent,
  endContent,
  onClose,
  className = '',
  onClick,
  ...rest
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2.5 py-0.5 gap-1.5 min-h-[22px]'
      : size === 'lg'
      ? 'text-sm px-4 py-1.5 gap-2.5 min-h-[32px]'
      : 'text-xs px-3 py-1 gap-2 min-h-[26px]';

  const radiusClasses =
    radius === 'none'
      ? 'rounded-none'
      : radius === 'sm'
      ? 'rounded-md'
      : radius === 'md'
      ? 'rounded-lg'
      : radius === 'lg'
      ? 'rounded-xl'
      : 'rounded-full';

  const colorMap: Record<string, Record<string, string>> = {
    default: {
      flat: 'bg-surface-secondary text-label-secondary border border-separator/60',
      solid: 'bg-label-primary text-surface',
      bordered: 'border border-separator text-label-secondary bg-transparent',
      dot: 'text-label-secondary bg-surface-secondary/70 border border-separator/60',
      faded: 'bg-surface/60 border border-separator text-label-secondary shadow-2xs',
    },
    primary: {
      flat: 'bg-primary/10 text-primary border border-primary/20',
      solid: 'bg-primary text-white shadow-xs',
      bordered: 'border border-primary/50 text-primary bg-transparent',
      dot: 'text-primary bg-primary/10 border border-primary/20',
      faded: 'bg-primary/5 border border-primary/20 text-primary',
    },
    accent: {
      flat: 'bg-accent/10 text-accent border border-accent/25',
      solid: 'bg-accent text-white shadow-xs',
      bordered: 'border border-accent/50 text-accent bg-transparent',
      dot: 'text-accent bg-accent/10 border border-accent/20',
      faded: 'bg-accent/5 border border-accent/20 text-accent',
    },
    secondary: {
      flat: 'bg-secondary/10 text-secondary border border-secondary/20',
      solid: 'bg-secondary text-white shadow-xs',
      bordered: 'border border-secondary/50 text-secondary bg-transparent',
      dot: 'text-secondary bg-secondary/10 border border-secondary/20',
      faded: 'bg-secondary/5 border border-secondary/20 text-secondary',
    },
    success: {
      flat: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
      solid: 'bg-emerald-600 text-white shadow-xs',
      bordered: 'border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-transparent',
      dot: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
      faded: 'bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    warning: {
      flat: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30',
      solid: 'bg-amber-500 text-white shadow-xs',
      bordered: 'border border-amber-500/50 text-amber-600 dark:text-amber-400 bg-transparent',
      dot: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20',
      faded: 'bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400',
    },
    danger: {
      flat: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25',
      solid: 'bg-rose-600 text-white shadow-xs',
      bordered: 'border border-rose-500/50 text-rose-600 dark:text-rose-400 bg-transparent',
      dot: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20',
      faded: 'bg-rose-500/5 border border-rose-500/20 text-rose-600 dark:text-rose-400',
    },
  };

  const styleClass = colorMap[color]?.[variant] || colorMap.default.flat;
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium select-none whitespace-nowrap transition-all duration-150 ${sizeClasses} ${radiusClasses} ${styleClass} ${
        isClickable ? 'cursor-pointer hover:brightness-105 active:scale-97' : ''
      } ${className}`}
      {...rest}
    >
      {variant === 'dot' && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            color === 'success'
              ? 'bg-emerald-500'
              : color === 'warning'
              ? 'bg-amber-500'
              : color === 'danger'
              ? 'bg-rose-500'
              : color === 'primary' || color === 'accent'
              ? 'bg-accent'
              : 'bg-label-tertiary'
          }`}
        />
      )}
      {startContent && <span className="shrink-0 flex items-center">{startContent}</span>}
      <span className="truncate">{children}</span>
      {endContent && <span className="shrink-0 flex items-center">{endContent}</span>}
      {onClose && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-0.5 -mr-1 rounded-full hover:bg-black/10 dark:hover:bg-white/15 text-current transition-colors cursor-pointer"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   8. HERO-UI DATE PICKER (Apple Calendar Dropdown + Emil Motion)
   - Works with standard ISO YYYY-MM-DD string value / onChange
   - Clean month / year navigation with day grid
   - Quick "Today" shortcut and clear button
   ══════════════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════════════
   8. HERO-UI DATETIME PICKER (Date + Time Selector + HeroUISelect)
   - Value: 'YYYY-MM-DDTHH:mm'
   - Time selection: Hours & Minutes via HeroUISelect, AM/PM Toggle
   - Placement: 'top' | 'bottom' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'auto'
   - Calendar date picker with month/year navigation
   - Apple spatial blur dropdown with z-[100]
   ══════════════════════════════════════════════════════════════ */

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

// Named Aliases for HeroUI Standard Directives
export { HeroInput as Input };
export { HeroTextarea as Textarea };
export { HeroTabs as Tabs };
export { HeroTable as Table };
export { HeroAvatar as Avatar };
export { HeroUser as User };
export { HeroChip as Chip };
export { HeroDatePicker as DatePicker };
export { HeroDateTimePicker as DateTimePicker };
export { HeroUISelect as Select } from './HeroUISelect';
export { HeroUISelect } from './HeroUISelect';



