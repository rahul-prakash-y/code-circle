import React from 'react';
import Leaderboard from '../components/dashboard/Leaderboard';
import { Trophy, Sparkles } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Page Header with Accent Touch */}
      <div className="relative pb-6 border-b border-separator">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold tracking-wide uppercase">
              <Trophy size={11} />
              <span>Academic Competition & Honors</span>
            </div>
            <h1 className="display-headline text-label-primary tracking-tight">
              Club Leaderboard
            </h1>
            <p className="text-sm text-label-secondary max-w-2xl leading-relaxed">
              Recognizing top engineering problem-solvers, active workshop attendees, and standout community contributors.
            </p>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Component */}
      <Leaderboard />
    </div>
  );
};

export default LeaderboardPage;
