import React, { useState, useMemo } from 'react';
import { EmilCard } from '../emil-ui';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Check } from 'lucide-react';

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
