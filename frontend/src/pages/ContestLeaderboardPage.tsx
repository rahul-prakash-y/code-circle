import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Crown,
  Medal,
  Clock,
  ArrowLeft,
  Search,
  User,
  Zap,
  CheckCircle2,
  Sparkles,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import useContestStore, { LeaderboardEntry } from '../store/useContestStore';
import AllocatePointsModal from '../components/admin/contests/AllocatePointsModal';

export const ContestLeaderboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { leaderboard, loading, fetchLeaderboard, bulkAllocatePoints } = useContestStore();
  const [search, setSearch] = useState('');
  const [selectedEntryForPoints, setSelectedEntryForPoints] = useState<LeaderboardEntry | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const isPrivileged =
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin' ||
    user?.role === 'Faculty' ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPERADMIN' ||
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty';

  useEffect(() => {
    if (id) fetchLeaderboard(id);
  }, [id]);

  const filtered = leaderboard.filter(
    (entry) =>
      entry.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      entry.user?.rollNo?.toLowerCase().includes(search.toLowerCase()) ||
      entry.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const top3 = leaderboard.slice(0, 3);
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-separator pb-4">
        <Link
          to="/contests"
          className="flex items-center gap-2 text-xs font-semibold text-label-secondary hover:text-label-primary transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Weekly Battles</span>
        </Link>
        <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-bold">
          Official Tournament Rankings
        </span>
      </div>

      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold uppercase tracking-wider">
          <Trophy size={14} />
          <span>Hall of Fame</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-label-primary tracking-tight">
          Tournament Leaderboard
        </h1>
        <p className="text-xs text-label-tertiary">
          Rankings are calculated based on total score achieved, with faster submission times serving as tie-breakers.
        </p>
      </div>

      {/* --- TOP 3 PODIUM (if participants >= 3) --- */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 items-end max-w-4xl mx-auto">
          {/* 2nd Place */}
          {second && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface rounded-3xl border border-separator p-6 text-center space-y-3 shadow-md order-2 md:order-1 relative"
            >
              <div className="w-12 h-12 rounded-full bg-slate-300/20 text-slate-400 flex items-center justify-center mx-auto border border-slate-300/40">
                <Medal size={24} />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200/20 text-slate-400">
                2nd Place
              </span>
              <h3 className="text-base font-bold text-label-primary truncate">{second.user?.name}</h3>
              <p className="text-2xl font-black text-label-primary">{second.totalScore} pts</p>
              <p className="text-[11px] text-label-tertiary font-mono">{formatSeconds(second.timeTakenSeconds)}</p>
            </motion.div>
          )}

          {/* 1st Place (Champion Spotlight) */}
          {first && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-b from-amber-500/15 via-surface to-surface rounded-3xl border-2 border-amber-500/50 p-8 text-center space-y-4 shadow-2xl order-1 md:order-2 relative"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto border-2 border-amber-500 shadow-lg shadow-amber-500/20">
                <Crown size={32} />
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-500 border border-amber-500/30">
                Champion #1
              </span>
              <div>
                <h3 className="text-xl font-extrabold text-label-primary tracking-tight">{first.user?.name}</h3>
                <p className="text-xs text-label-tertiary font-mono">{first.user?.rollNo || 'Rank #1'}</p>
              </div>
              <p className="text-4xl font-black text-amber-500">{first.totalScore} pts</p>
              <p className="text-xs text-label-tertiary font-mono">{formatSeconds(first.timeTakenSeconds)}</p>
            </motion.div>
          )}

          {/* 3rd Place */}
          {third && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface rounded-3xl border border-separator p-6 text-center space-y-3 shadow-md order-3 relative"
            >
              <div className="w-12 h-12 rounded-full bg-amber-700/20 text-amber-700 flex items-center justify-center mx-auto border border-amber-700/40">
                <Medal size={24} />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-700/20 text-amber-700">
                3rd Place
              </span>
              <h3 className="text-base font-bold text-label-primary truncate">{third.user?.name}</h3>
              <p className="text-2xl font-black text-label-primary">{third.totalScore} pts</p>
              <p className="text-[11px] text-label-tertiary font-mono">{formatSeconds(third.timeTakenSeconds)}</p>
            </motion.div>
          )}
        </div>
      )}

      {/* --- FULL RANKINGS TABLE --- */}
      <div className="bg-surface rounded-3xl border border-separator p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-label-primary uppercase tracking-wider">
              All Participant Standings ({leaderboard.length})
            </h3>
            {isPrivileged && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Admin Evaluation Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isPrivileged && leaderboard.length > 0 && (
              <div className="flex items-center gap-1.5 mr-2">
                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={async () => {
                    if (!confirm('Allocate club points equal to each student’s total score for all participants?')) return;
                    setBulkLoading(true);
                    try {
                      await bulkAllocatePoints(id!, { preset: 'MATCH_SCORE_ALL' });
                    } finally {
                      setBulkLoading(false);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-surface border border-separator hover:bg-surface-secondary text-[11px] font-bold text-label-primary rounded-xl transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
                  title="Auto-credit total score as points for all"
                >
                  <Zap size={12} className="text-amber-500" />
                  <span>Match Scores</span>
                </button>

                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={async () => {
                    const b = prompt('Enter bonus points to add to all participants:', '25');
                    if (!b) return;
                    const bonus = parseInt(b);
                    if (isNaN(bonus) || bonus <= 0) return;
                    setBulkLoading(true);
                    try {
                      await bulkAllocatePoints(id!, { preset: 'ADD_BONUS_ALL', bonusPoints: bonus });
                    } finally {
                      setBulkLoading(false);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-surface border border-separator hover:bg-surface-secondary text-[11px] font-bold text-label-primary rounded-xl transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
                  title="Add bonus XP to all participants"
                >
                  <Sparkles size={12} className="text-indigo-500" />
                  <span>+Bonus All</span>
                </button>
              </div>
            )}

            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-label-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student or roll number..."
                className="pl-8 pr-3 py-1.5 text-xs bg-surface-secondary border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary focus:bg-surface w-52 sm:w-60"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-separator rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary border-b border-separator text-label-secondary font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4 text-center">MCQ Pts</th>
                <th className="py-3 px-4 text-center">Coding Pts</th>
                <th className="py-3 px-4 text-center">Total Score</th>
                <th className="py-3 px-4">Time Taken</th>
                <th className="py-3 px-4 text-center">Awarded Club XP</th>
                {isPrivileged && <th className="py-3 px-4 text-right">Admin Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-separator text-label-primary font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isPrivileged ? 8 : 7} className="py-12 text-center text-label-tertiary">
                    No submissions recorded yet for this contest.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.submissionId} className="hover:bg-surface-secondary/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold">
                      {entry.rank === 1 ? (
                        <span className="text-amber-500 font-black">🥇 #1</span>
                      ) : entry.rank === 2 ? (
                        <span className="text-slate-400 font-black">🥈 #2</span>
                      ) : entry.rank === 3 ? (
                        <span className="text-amber-700 font-black">🥉 #3</span>
                      ) : (
                        `#${entry.rank}`
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-label-primary">{entry.user?.name || 'Anonymous'}</p>
                      <p className="text-[10px] text-label-tertiary font-mono">
                        {entry.user?.rollNo || entry.user?.email}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-label-secondary">{entry.mcqScore}</td>
                    <td className="py-3 px-4 text-center font-mono text-label-secondary">{entry.codingScore}</td>
                    <td className="py-3 px-4 text-center font-mono font-black text-primary text-sm">
                      {entry.totalScore}
                    </td>
                    <td className="py-3 px-4 font-mono text-label-tertiary text-[11px]">
                      {formatSeconds(entry.timeTakenSeconds)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          +{entry.awardedClubPoints} XP
                        </span>
                        {entry.manualPointsAdjustment ? (
                          <span
                            title={entry.manualPointsReason || 'Manual adjustment'}
                            className="text-[9px] font-bold text-amber-500 mt-0.5"
                          >
                            ⚡ {entry.manualPointsAdjustment > 0 ? `+${entry.manualPointsAdjustment}` : entry.manualPointsAdjustment} manual
                          </span>
                        ) : null}
                      </div>
                    </td>
                    {isPrivileged && (
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEntryForPoints(entry)}
                          className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-[11px] font-bold transition-all inline-flex items-center gap-1 shadow-xs"
                          title="Manually allocate or adjust points"
                        >
                          <Zap size={11} className="fill-current" />
                          <span>Allocate</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocate Points Modal */}
      {id && (
        <AllocatePointsModal
          isOpen={Boolean(selectedEntryForPoints)}
          onClose={() => setSelectedEntryForPoints(null)}
          contestId={id}
          entry={selectedEntryForPoints}
          onSuccess={() => fetchLeaderboard(id)}
        />
      )}
    </div>
  );
};

export default ContestLeaderboardPage;
