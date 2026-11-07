import React, { useState, useEffect } from 'react';
import { Skeleton } from '@heroui/react';

export interface DelayedSkeletonProps {
  /** Delay in milliseconds before showing skeletons to avoid flashing on fast loads (default: 180ms) */
  delay?: number;
  /** Custom fallback skeleton tree */
  children: React.ReactNode;
  /** Keep previous data visible while background refreshing */
  isRefreshing?: boolean;
  /** Active data content to render if already loaded */
  dataContent?: React.ReactNode;
}

/**
 * DelayedSkeleton avoids flickering UI on fast API responses (<180ms)
 * and keeps previous data visible during background refresh operations (stale-while-revalidate).
 */
export const DelayedSkeleton: React.FC<DelayedSkeletonProps> = ({
  delay = 180,
  children,
  isRefreshing = false,
  dataContent,
}) => {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  // If we already have previous data and are just refreshing in background, show data with subtle pulse
  if (isRefreshing && dataContent) {
    return (
      <div className="relative opacity-90 transition-opacity">
        <div
          role="status"
          aria-live="polite"
          className="absolute -top-3 right-2 z-10 text-[10px] bg-accent/15 text-accent border border-accent/20 px-2 py-0.5 rounded-full font-mono flex items-center gap-1.5 backdrop-blur-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span>Refreshing...</span>
        </div>
        {dataContent}
      </div>
    );
  }

  if (!showSkeleton) {
    // Preserve layout space without jarring flash
    return <div className="min-h-[120px] transition-all" aria-hidden="true" />;
  }

  return (
    <div role="status" aria-busy="true" aria-label="Loading content" className="w-full">
      {children}
    </div>
  );
};

/**
 * CardLayoutSkeleton matches the exact grid and card dimensions of
 * EventCards, ContestCards, and AssessmentCards to guarantee 0 Cumulative Layout Shift (CLS).
 */
export const CardGridSkeleton: React.FC<{ count?: number; cols?: 2 | 3 | 4 }> = ({
  count = 4,
  cols = 2,
}) => {
  const colClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cols];

  return (
    <div className={`grid ${colClass} gap-5 w-full`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-surface p-6 sm:p-7 flex flex-col justify-between h-full rounded-3xl min-h-[260px] border border-separator shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-3 w-28 rounded-md" />
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
            <div className="space-y-2 mb-4">
              <Skeleton className="h-6 w-4/5 rounded-lg" />
              <Skeleton className="h-3.5 w-3/5 rounded-md" />
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-36 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
          </div>
          <div className="mt-7 pt-4 flex items-center justify-between border-t border-separator">
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default DelayedSkeleton;
