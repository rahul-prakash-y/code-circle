import React, { useEffect } from 'react';
import { Trophy, Medal, Crown, Star } from 'lucide-react';
import useAnalyticsStore from '../../store/useAnalyticsStore';
import { TableSkeleton } from '../ui/LoadingSkeleton';

const PodiumItem = ({ user, rank }) => {
  const isFirst = rank === 1;

  return (
    <div className={`flex flex-col items-center relative ${isFirst ? 'order-1 sm:order-2 -mt-4' : rank === 2 ? 'order-2 sm:order-1' : 'order-3 sm:order-3'}`}>
      <div className="relative mb-3">
        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border ${isFirst ? 'border-accent shadow-card' : 'border-separator'} p-0.5 overflow-hidden surface`}>
          <div className="w-full h-full rounded-[14px] overflow-hidden bg-surface-elevated flex items-center justify-center">
            {user.profilePicUrl ? (
              <img src={user.profilePicUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-text-secondary">
                {user.name[0]}
              </span>
            )}
          </div>
        </div>

        {/* Subtle Rank indicator */}
        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          isFirst 
            ? 'bg-accent text-white shadow-xs' 
            : 'bg-surface-elevated text-text-secondary border border-separator'
        }`}>
          #{rank}
        </div>
      </div>

      <div className="text-center w-full max-w-[150px] space-y-1 mt-2">
        <h4 className="text-text-primary font-bold text-sm truncate">{user.name}</h4>
        <p className="text-[11px] text-text-muted font-mono">{user.rollNo}</p>
        
        <div className="pt-2">
          <span className="text-lg sm:text-xl font-bold text-text-primary">{user.totalPoints}</span>
          <span className="text-[10px] text-text-muted ml-1 uppercase font-medium">pts</span>
        </div>
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const { leaderboard, loading, fetchLeaderboard } = useAnalyticsStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (loading && leaderboard.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-10 px-4 sm:px-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex p-2.5 rounded-xl bg-surface border border-separator text-accent mb-2">
            <Trophy size={22} strokeWidth={2} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-label-primary tracking-tight">Leaderboard</h1>
          <p className="text-label-secondary text-sm">Loading student rankings…</p>
        </div>
        <div className="surface rounded-[18px] border border-separator p-4">
          <TableSkeleton rows={6} />
        </div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3, 100);

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-10 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex p-2.5 rounded-xl bg-surface border border-separator text-accent mb-2">
          <Trophy size={22} strokeWidth={2} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-label-primary tracking-tight">Leaderboard</h1>
        <p className="text-label-secondary text-sm leading-relaxed">
          Recognizing consistent academic problem-solving, workshop participation, and club contributions.
        </p>
      </div>

      {/* Top 3 Honors */}
      {top3.length > 0 && (
        <div className="surface rounded-[18px] border border-separator shadow-card p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12 pt-2 pb-4">
            {top3[1] && <PodiumItem user={top3[1]} rank={2} />}
            {top3[0] && <PodiumItem user={top3[0]} rank={1} />}
            {top3[2] && <PodiumItem user={top3[2]} rank={3} />}
          </div>
        </div>
      )}

      {/* Rankings Table */}
      <div className="surface rounded-[18px] border border-separator shadow-card overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-3.5 bg-canvas border-b border-separator text-[11px] font-semibold uppercase tracking-wider text-label-secondary">
          <div className="col-span-2 sm:col-span-1">Rank</div>
          <div className="col-span-7 sm:col-span-8">Student</div>
          <div className="col-span-3 text-right">Points</div>
        </div>
        
        <div className="divide-y divide-separator max-h-[500px] overflow-y-auto">
          {others.map((user, index) => (
            <div 
              key={user._id}
              className="grid grid-cols-12 px-6 py-3.5 items-center group cursor-default transition-colors duration-150 hover:bg-canvas/70"
            >
              <div className="col-span-2 sm:col-span-1 font-mono text-xs font-semibold text-label-tertiary select-none">
                #{index + 4}
              </div>
              <div className="col-span-7 sm:col-span-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-canvas border border-separator flex items-center justify-center text-xs font-semibold text-label-secondary shrink-0">
                  {user.profilePicUrl ? (
                    <img src={user.profilePicUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name[0]
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-label-primary font-medium text-xs sm:text-sm truncate group-hover:text-accent transition-colors duration-150">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-label-tertiary font-mono">{user.rollNo}</div>
                </div>
              </div>
              <div className="col-span-3 text-right">
                <span className="text-label-primary font-bold text-sm group-hover:text-accent transition-colors duration-150">
                  {user.totalPoints}
                </span>
                <span className="text-[10px] text-label-tertiary ml-1">pts</span>
              </div>
            </div>
          ))}
          {others.length === 0 && (
            <p className="text-center py-8 text-xs text-label-secondary">No additional rankings to display.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

