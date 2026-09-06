import React from 'react';

export const PageSkeleton = () => {
  return (
    <div className="min-h-[80vh] w-full max-w-7xl mx-auto p-6 md:p-8 animate-pulse space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-border">
        <div className="space-y-3">
          <div className="h-9 w-64 bg-text-muted/10 rounded-2xl"></div>
          <div className="h-4 w-96 max-w-full bg-text-muted/5 rounded-xl"></div>
        </div>
        <div className="h-12 w-40 bg-text-muted/10 rounded-2xl"></div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-8 space-y-6">
            <div className="h-4 w-32 bg-accent/20 rounded-lg"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-10 w-10 bg-text-muted/5 rounded-xl"></div>
                  <div className="h-6 w-20 bg-text-muted/10 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass p-8 h-40"></div>
        </div>

        {/* Right Column Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-2 flex gap-2">
            <div className="h-10 flex-1 bg-text-muted/10 rounded-xl"></div>
            <div className="h-10 flex-1 bg-text-muted/5 rounded-xl"></div>
            <div className="h-10 flex-1 bg-text-muted/5 rounded-xl"></div>
          </div>

          <div className="glass p-8 space-y-4 min-h-[400px]">
            <div className="h-6 w-48 bg-text-muted/10 rounded-xl"></div>
            <div className="h-4 w-full bg-text-muted/5 rounded-lg"></div>
            <div className="h-4 w-5/6 bg-text-muted/5 rounded-lg"></div>
            <div className="h-4 w-4/6 bg-text-muted/5 rounded-lg"></div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-48 bg-text-muted/5 rounded-2xl"></div>
              <div className="h-48 bg-text-muted/5 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="glass p-6 animate-pulse space-y-4">
      <div className="h-6 w-3/4 bg-text-muted/10 rounded-xl"></div>
      <div className="h-4 w-full bg-text-muted/5 rounded-lg"></div>
      <div className="h-4 w-2/3 bg-text-muted/5 rounded-lg"></div>
      <div className="pt-4 flex justify-between items-center">
        <div className="h-8 w-24 bg-text-muted/10 rounded-xl"></div>
        <div className="h-8 w-20 bg-accent/20 rounded-xl"></div>
      </div>
    </div>
  );
};

export default PageSkeleton;
