import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { HeroUISelect } from '../ui/HeroUISelect';

export interface PaginationProps {
  page?: number;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  limit?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  pageSizeOptions?: number[];
  disabled?: boolean;
  className?: string;
  pagination?: {
    page?: number;
    totalPages?: number;
    total?: number;
    totalItems?: number;
    limit?: number;
  };
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  currentPage,
  totalPages,
  totalItems,
  limit,
  itemsPerPage,
  onPageChange,
  onLimitChange,
  limitOptions,
  pageSizeOptions,
  disabled = false,
  className = '',
  pagination,
}) => {
  const actualPage = page ?? currentPage ?? pagination?.page ?? 1;
  const actualTotalPages = Math.max(1, (totalPages ?? pagination?.totalPages ?? 1));
  const actualTotalItems = totalItems ?? pagination?.totalItems ?? pagination?.total;
  const actualLimit = limit ?? itemsPerPage ?? pagination?.limit;
  const actualLimitOptions = limitOptions ?? pageSizeOptions ?? [10, 20, 50, 100];

  const safeTotalPages = actualTotalPages;
  const safeCurrentPage = Math.min(Math.max(1, actualPage), safeTotalPages);

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

  const startItem = actualLimit ? (safeCurrentPage - 1) * actualLimit + 1 : undefined;
  const endItem =
    actualLimit && actualTotalItems !== undefined
      ? Math.min(safeCurrentPage * actualLimit, actualTotalItems)
      : undefined;

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-1 text-[13px] ${className}`}
    >
      {/* Records info & Page Size Selector */}
      <div className="flex items-center gap-3 text-label-secondary w-full sm:w-auto justify-between sm:justify-start">
        {actualTotalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Showing <strong className="text-label-primary font-medium">{startItem}</strong>-
            <strong className="text-label-primary font-medium">{endItem}</strong> of{' '}
            <strong className="text-label-primary font-medium">{actualTotalItems}</strong> records
          </span>
        ) : actualTotalItems !== undefined ? (
          <span>
            Total <strong className="text-label-primary font-medium">{actualTotalItems}</strong> records
          </span>
        ) : (
          <span>
            Page <strong className="text-label-primary font-medium">{safeCurrentPage}</strong> of{' '}
            <strong className="text-label-primary font-medium">{safeTotalPages}</strong>
          </span>
        )}

        {onLimitChange && actualLimit && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[12px] text-label-secondary whitespace-nowrap">Per page:</span>
            <div className="w-[84px]">
              <HeroUISelect
                size="sm"
                placement='top-start'
                value={String(actualLimit)}
                disabled={disabled}
                onChange={(val) => onLimitChange(Number(val))}
                options={actualLimitOptions.map((opt) => ({
                  value: String(opt),
                  label: String(opt),
                }))}
                className="w-full"
              />
            </div>
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
