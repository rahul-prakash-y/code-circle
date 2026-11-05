import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  limit?: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  disabled?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
  disabled = false,
  className = '',
}) => {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, page || 1), safeTotalPages);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const delta = 1; // Number of pages to show around current page
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= safeTotalPages; i++) {
      if (
        i === 1 ||
        i === safeTotalPages ||
        (i >= safeCurrentPage - delta && i <= safeCurrentPage + delta)
      ) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pages = getPageNumbers();

  const handlePrev = () => {
    if (safeCurrentPage > 1 && !disabled) {
      onPageChange(safeCurrentPage - 1);
    }
  };

  const handleNext = () => {
    if (safeCurrentPage < safeTotalPages && !disabled) {
      onPageChange(safeCurrentPage + 1);
    }
  };

  const handleFirst = () => {
    if (safeCurrentPage !== 1 && !disabled) {
      onPageChange(1);
    }
  };

  const handleLast = () => {
    if (safeCurrentPage !== safeTotalPages && !disabled) {
      onPageChange(safeTotalPages);
    }
  };

  const startItem = limit ? (safeCurrentPage - 1) * limit + 1 : undefined;
  const endItem =
    limit && totalItems !== undefined
      ? Math.min(safeCurrentPage * limit, totalItems)
      : undefined;

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-1 text-[13px] ${className}`}
    >
      {/* Records info & Page Size Selector */}
      <div className="flex items-center gap-3 text-label-secondary w-full sm:w-auto justify-between sm:justify-start">
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Showing <strong className="text-label-primary font-medium">{startItem}</strong>-
            <strong className="text-label-primary font-medium">{endItem}</strong> of{' '}
            <strong className="text-label-primary font-medium">{totalItems}</strong> records
          </span>
        ) : totalItems !== undefined ? (
          <span>
            Total <strong className="text-label-primary font-medium">{totalItems}</strong> records
          </span>
        ) : (
          <span>
            Page <strong className="text-label-primary font-medium">{safeCurrentPage}</strong> of{' '}
            <strong className="text-label-primary font-medium">{safeTotalPages}</strong>
          </span>
        )}

        {onLimitChange && limit && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[12px]">Per page:</span>
            <select
              aria-label="Records per page"
              value={limit}
              disabled={disabled}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-surface-secondary border border-separator rounded-lg px-2 py-1 text-[12px] font-medium text-label-primary focus:outline-none focus:border-accent cursor-pointer transition-colors"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1 self-center sm:self-auto">
        {/* First Page */}
        <button
          type="button"
          onClick={handleFirst}
          disabled={safeCurrentPage === 1 || disabled}
          aria-label="Go to first page"
          title="First page"
          className="p-1.5 rounded-lg border border-separator bg-surface text-label-secondary hover:text-label-primary hover:bg-surface-secondary disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={safeCurrentPage === 1 || disabled}
          aria-label="Go to previous page"
          title="Previous page"
          className="p-1.5 rounded-lg border border-separator bg-surface text-label-secondary hover:text-label-primary hover:bg-surface-secondary disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 px-2.5 font-medium"
        >
          <ChevronLeft size={16} />
          <span className="hidden md:inline">Prev</span>
        </button>

        {/* Numbered Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-label-tertiary select-none font-mono"
                >
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === safeCurrentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => !disabled && onPageChange(pageNum)}
                disabled={disabled}
                aria-current={isActive ? 'page' : undefined}
                className={`min-w-[32px] h-8 px-2 rounded-lg font-medium text-[13px] transition-all flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-accent text-white shadow-xs font-semibold'
                    : 'bg-surface hover:bg-surface-secondary text-label-primary border border-separator'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={handleNext}
          disabled={safeCurrentPage === safeTotalPages || disabled}
          aria-label="Go to next page"
          title="Next page"
          className="p-1.5 rounded-lg border border-separator bg-surface text-label-secondary hover:text-label-primary hover:bg-surface-secondary disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 px-2.5 font-medium"
        >
          <span className="hidden md:inline">Next</span>
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={handleLast}
          disabled={safeCurrentPage === safeTotalPages || disabled}
          aria-label="Go to last page"
          title="Last page"
          className="p-1.5 rounded-lg border border-separator bg-surface text-label-secondary hover:text-label-primary hover:bg-surface-secondary disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
