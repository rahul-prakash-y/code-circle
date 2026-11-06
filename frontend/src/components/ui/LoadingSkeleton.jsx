import React from 'react';
import { Skeleton } from '@heroui/react';

export const PageSkeleton = () => {
  return (
    <div className="min-h-[70vh] w-full max-w-[1400px] mx-auto py-8 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-3 pb-6 border-b border-separator">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface p-7 min-h-[170px] flex flex-col justify-between rounded-3xl border border-separator shadow-xs">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EventCardSkeleton = () => {
  return (
    <div className="bg-surface p-6 sm:p-7 flex flex-col justify-between h-full rounded-3xl min-h-[260px] border border-separator shadow-xs">
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-3 w-28 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <div className="space-y-2 mb-4">
          <Skeleton className="h-6 w-4/5 rounded-lg" />
          <Skeleton className="h-4 w-3/5 rounded-md" />
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
      </div>
      <div className="mt-7 pt-4 flex items-center justify-between border-t border-separator">
        <div className="space-y-1">
          <Skeleton className="h-2.5 w-12 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
};

export const NewsCardSkeleton = () => {
  return (
    <div className="bg-surface overflow-hidden flex flex-col justify-between rounded-3xl border border-separator shadow-xs">
      <div>
        <Skeleton className="h-44 w-full" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-5 w-5/6 rounded-md" />
          <Skeleton className="h-3.5 w-full rounded-md" />
          <Skeleton className="h-3.5 w-4/5 rounded-md" />
        </div>
      </div>
      <div className="p-5 pt-0 flex items-center justify-between border-t border-separator mt-4">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="h-3 w-16 rounded-md" />
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="divide-y divide-separator">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="grid grid-cols-12 px-6 py-4 items-center gap-3">
          <div className="col-span-1">
            <Skeleton className="h-4 w-6 rounded" />
          </div>
          <div className="col-span-8 flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>
          <div className="col-span-3 flex justify-end">
            <Skeleton className="h-5 w-14 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-10">
      <div className="bg-surface rounded-3xl p-8 border border-separator flex flex-col sm:flex-row items-center gap-6 shadow-xs">
        <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl shrink-0" />
        <div className="space-y-3 flex-1 text-center sm:text-left">
          <Skeleton className="h-7 w-48 rounded-lg mx-auto sm:mx-0" />
          <Skeleton className="h-4 w-64 rounded-md mx-auto sm:mx-0" />
          <div className="flex gap-2 justify-center sm:justify-start">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface rounded-3xl p-8 border border-separator space-y-4 shadow-xs">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="bg-surface rounded-3xl p-8 border border-separator space-y-4 shadow-xs">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const CardSkeleton = EventCardSkeleton;

export default PageSkeleton;
