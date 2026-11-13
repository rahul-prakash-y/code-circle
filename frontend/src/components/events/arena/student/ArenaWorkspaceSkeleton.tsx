import React from 'react';

export const ArenaWorkspaceSkeleton: React.FC = () => (
  <div
    className="flex-1 flex flex-col md:flex-row overflow-hidden animate-pulse bg-canvas select-none"
    role="status"
    aria-label="Loading assessment workspace data..."
  >
    {/* Left / Top Navigation Palette Skeleton */}
    <div className="w-full md:w-56 lg:w-64 border-b md:border-b-0 md:border-r border-separator flex flex-col bg-canvas shrink-0">
      <div className="p-2 sm:p-2.5 border-b border-separator flex gap-2 bg-surface-secondary">
        <div className="h-8 flex-1 rounded-xl bg-surface/70" />
        <div className="h-8 flex-1 rounded-xl bg-surface/70" />
      </div>
      <div className="p-3 md:p-4 space-y-3 md:space-y-4 md:flex-1">
        <div className="h-3 w-20 rounded bg-surface-secondary/70 hidden md:block" />
        <div className="flex md:grid md:grid-cols-4 gap-2 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div
              key={i}
              className="w-9 h-9 min-w-9 min-h-9 rounded-xl bg-surface-secondary/70 shrink-0"
            />
          ))}
        </div>
      </div>
    </div>

    {/* Right Assessment Workspace Skeleton */}
    <div className="flex-1 flex flex-col overflow-hidden bg-canvas">
      {/* Top Header / Bar */}
      <div className="p-4 sm:p-6 border-b border-separator flex items-center justify-between bg-surface-secondary/20">
        <div className="flex items-center gap-3">
          <div className="h-6 w-28 rounded-full bg-surface-secondary/80" />
          <div className="h-5 w-20 rounded-full bg-surface-secondary/60" />
        </div>
        <div className="h-5 w-24 rounded-md bg-surface-secondary/60" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Question / Problem Specs */}
        <div className="w-full lg:w-1/2 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-separator space-y-5 overflow-y-auto">
          <div className="h-7 w-3/4 rounded-xl bg-surface-secondary/90" />
          <div className="space-y-2.5 pt-1">
            <div className="h-4 w-full rounded bg-surface-secondary/70" />
            <div className="h-4 w-11/12 rounded bg-surface-secondary/70" />
            <div className="h-4 w-4/5 rounded bg-surface-secondary/70" />
          </div>

          <div className="pt-3 space-y-3">
            <div className="h-4 w-28 rounded bg-surface-secondary/80" />
            <div className="h-16 w-full rounded-2xl bg-surface-secondary/40 border border-separator/50" />
          </div>

          <div className="pt-2 space-y-3">
            <div className="h-4 w-32 rounded bg-surface-secondary/80" />
            <div className="h-16 w-full rounded-2xl bg-surface-secondary/40 border border-separator/50" />
          </div>
        </div>

        {/* Right Side: Code Editor Workspace / Options Pane */}
        <div className="w-full lg:w-1/2 flex flex-col p-4 sm:p-6 bg-surface-secondary/10 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-separator">
            <div className="h-8 w-32 rounded-xl bg-surface-secondary/80" />
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded-xl bg-surface-secondary/80" />
              <div className="h-8 w-24 rounded-xl bg-purple-500/20" />
            </div>
          </div>

          {/* Editor Placeholder with Line Shimmers */}
          <div className="flex-1 rounded-2xl bg-surface-secondary/30 border border-separator/60 p-4 space-y-3 font-mono">
            <div className="h-3.5 w-1/4 rounded bg-purple-400/20" />
            <div className="h-3.5 w-1/2 rounded bg-surface-secondary/60 ml-4" />
            <div className="h-3.5 w-2/5 rounded bg-surface-secondary/60 ml-8" />
            <div className="h-3.5 w-3/4 rounded bg-surface-secondary/60 ml-8" />
            <div className="h-3.5 w-1/3 rounded bg-surface-secondary/60 ml-4" />
            <div className="h-3.5 w-2/3 rounded bg-surface-secondary/60 ml-4" />
            <div className="h-3.5 w-1/6 rounded bg-purple-400/20" />
          </div>

          {/* Console / Test Runner Footer Skeleton */}
          <div className="h-24 rounded-2xl bg-surface-secondary/40 border border-separator/60 p-3 space-y-2">
            <div className="h-4 w-28 rounded bg-surface-secondary/80" />
            <div className="h-3.5 w-3/4 rounded bg-surface-secondary/60" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default React.memo(ArenaWorkspaceSkeleton);
