import React from 'react';

export const PageSkeleton = () => {
  return (
    <div className="min-h-[70vh] w-full max-w-[1400px] mx-auto py-8 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-3 pb-6 border-b border-separator">
        <div className="h-4 w-28 skeleton-calm rounded-full" />
        <div className="h-10 w-72 skeleton-calm rounded-xl" />
        <div className="h-4 w-96 max-w-full skeleton-calm rounded-md" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="surface p-7 min-h-[170px] flex flex-col justify-between rounded-[18px]">
            <div className="w-8 h-8 skeleton-calm rounded-xl" />
            <div className="space-y-2">
              <div className="h-3 w-20 skeleton-calm rounded-md" />
              <div className="h-8 w-24 skeleton-calm rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EventCardSkeleton = () => {
  return (
    <div className="surface p-6 sm:p-7 flex flex-col justify-between h-full rounded-[18px] min-h-[260px]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-28 skeleton-calm rounded-md" />
          <div className="h-4 w-12 skeleton-calm rounded-full" />
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-6 w-4/5 skeleton-calm rounded-lg" />
          <div className="h-4 w-3/5 skeleton-calm rounded-md" />
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-4 w-40 skeleton-calm rounded-md" />
          <div className="h-4 w-32 skeleton-calm rounded-md" />
        </div>
      </div>
      <div className="mt-7 pt-4 flex items-center justify-between border-t border-separator">
        <div className="space-y-1">
          <div className="h-2.5 w-12 skeleton-calm rounded-md" />
          <div className="h-4 w-20 skeleton-calm rounded-md" />
        </div>
        <div className="h-8 w-20 skeleton-calm rounded-full" />
      </div>
    </div>
  );
};

export const NewsCardSkeleton = () => {
  return (
    <div className="surface overflow-hidden flex flex-col justify-between rounded-[18px]">
      <div>
        <div className="h-44 w-full skeleton-calm" />
        <div className="p-5 space-y-3">
          <div className="h-3 w-24 skeleton-calm rounded-md" />
          <div className="h-5 w-5/6 skeleton-calm rounded-md" />
          <div className="h-3.5 w-full skeleton-calm rounded-md" />
          <div className="h-3.5 w-4/5 skeleton-calm rounded-md" />
        </div>
      </div>
      <div className="p-5 pt-0 flex items-center justify-between border-t border-separator/50 mt-4">
        <div className="h-3 w-20 skeleton-calm rounded-md" />
        <div className="h-3 w-16 skeleton-calm rounded-md" />
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
            <div className="h-4 w-6 skeleton-calm rounded" />
          </div>
          <div className="col-span-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg skeleton-calm shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-36 skeleton-calm rounded" />
              <div className="h-3 w-24 skeleton-calm rounded" />
            </div>
          </div>
          <div className="col-span-3 flex justify-end">
            <div className="h-5 w-14 skeleton-calm rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-10">
      <div className="surface rounded-[18px] p-8 border border-separator flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl skeleton-calm shrink-0" />
        <div className="space-y-3 flex-1 text-center sm:text-left">
          <div className="h-7 w-48 skeleton-calm rounded-lg mx-auto sm:mx-0" />
          <div className="h-4 w-64 skeleton-calm rounded-md mx-auto sm:mx-0" />
          <div className="flex gap-2 justify-center sm:justify-start">
            <div className="h-6 w-24 skeleton-calm rounded-md" />
            <div className="h-6 w-20 skeleton-calm rounded-md" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="surface rounded-[18px] p-8 border border-separator space-y-4">
          <div className="h-5 w-32 skeleton-calm rounded" />
          <div className="h-10 w-full skeleton-calm rounded-xl" />
          <div className="h-10 w-full skeleton-calm rounded-xl" />
        </div>
        <div className="surface rounded-[18px] p-8 border border-separator space-y-4">
          <div className="h-5 w-32 skeleton-calm rounded" />
          <div className="h-10 w-full skeleton-calm rounded-xl" />
          <div className="h-10 w-full skeleton-calm rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const CardSkeleton = EventCardSkeleton;

export default PageSkeleton;
