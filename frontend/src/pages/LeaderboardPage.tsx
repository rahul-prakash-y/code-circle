import React from 'react';
import Leaderboard from '../components/dashboard/Leaderboard';

export const LeaderboardPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-2 border-b border-separator">
        <p className="meta-editorial mb-1 text-label-secondary">Competition</p>
        <h1 className="display-headline text-label-primary">Leaderboard</h1>
        <p className="text-[14px] text-label-secondary mt-1">
          Top performers, algorithmic rankings, and academic contribution points.
        </p>
      </div>

      {/* Main Leaderboard */}
      <Leaderboard />
    </div>
  );
};

export default LeaderboardPage;
