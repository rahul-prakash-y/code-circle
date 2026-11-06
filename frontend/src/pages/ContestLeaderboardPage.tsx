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
  FileCode2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@heroui/react';
import { HeroInput } from '../components/ui/HeroUIComponents';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import useContestStore, { LeaderboardEntry, Contest } from '../store/useContestStore';
import AllocatePointsModal from '../components/admin/contests/AllocatePointsModal';
import ContestSubmissionsModal from '../components/admin/contests/ContestSubmissionsModal';
import ContestSubmissionDetailModal from '../components/admin/contests/ContestSubmissionDetailModal';
import Pagination from '../components/common/Pagination';

export const ContestLeaderboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const {
    leaderboard,
    leaderboardPagination,
    loading,
    fetchLeaderboard,
    bulkAllocatePoints,
    fetchSingleSubmissionForAdmin,
    fetchMyContestSubmission,
    fetchContestById,
    activeContest,
  } = useContestStore();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState('');
  const [selectedEntryForPoints, setSelectedEntryForPoints] = useState<LeaderboardEntry | null>(null);
  const [selectedSubmissionForDetails, setSelectedSubmissionForDetails] = useState<any | null>(null);
  const [isSubmissionsRosterOpen, setIsSubmissionsRosterOpen] = useState(false);
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
    if (id) {
      fetchLeaderboard(id, { page, limit });
      fetchContestById(id);
    }
  }, [id, page, limit]);

  const currentUserId = user?._id || user?.id || (user as any)?.userId;
  const myLeaderboardEntry = leaderboard.find(
    (entry) =>
      Boolean(currentUserId) &&
      (entry.user?._id === currentUserId || (entry.user as any)?.id === currentUserId)
  );

  const handleInspectSubmission = async (entry: LeaderboardEntry) => {
    if (!id || !entry.submissionId) return;
    const isMe =
      Boolean(currentUserId) &&
      (entry.user?._id === currentUserId || (entry.user as any)?.id === currentUserId);

    const res =
      isPrivileged && !isMe
        ? await fetchSingleSubmissionForAdmin(id, entry.submissionId)
        : await fetchMyContestSubmission(id);

    if (res.success && res.data) {
      setSelectedSubmissionForDetails(res.data);
    } else {
      toast.error(res.error || 'Failed to load submission details');
    }
  };

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
    <div className="max-w-6xl mx-auto py-2 sm:py-6 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-separator pb-4">
        <Link
          to="/contests"
          className="flex items-center gap-2 text-xs font-medium text-label-secondary hover:text-label-primary transition-colors cursor-pointer py-1"
        >
          <ArrowLeft size={14} />
          <span>Back to weekly battles</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2.5">
          {myLeaderboardEntry && (
            <Button
              size="sm"
              variant="flat"
              color="success"
              onPress={() => handleInspectSubmission(myLeaderboardEntry)}
              className="text-xs font-medium rounded-xl shadow-xs tabular-nums"
              title="View your submitted MCQ answers and code solution"
              startContent={<FileCode2 size={13} />}
            >
              My submission ({myLeaderboardEntry.totalScore} pts)
            </Button>
          )}
          {isPrivileged && (
            <Button
              size="sm"
              variant="flat"
              color="warning"
              onPress={() => setIsSubmissionsRosterOpen(true)}
              className="text-xs font-medium rounded-xl shadow-xs"
              title="Open full student submissions roster & point allocations"
              startContent={<Sliders size={13} />}
            >
              Submissions ledger
            </Button>
          )}
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-medium">
            Official rankings
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-semibold uppercase tracking-wider">
          <Trophy size={13} />
          <span>Hall of fame</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-label-primary tracking-tight leading-[1.15]">
          Tournament leaderboard
        </h1>
        <p className="text-xs sm:text-sm text-label-secondary max-w-prose mx-auto">
          Rankings are calculated based on total score achieved, with faster completion times serving as tie-breakers.
        </p>
      </div>

      {/* --- TOP 3 PODIUM --- */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-6 items-end max-w-4xl mx-auto">
          {/* 2nd Place */}
          {second && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface rounded-3xl border border-separator p-5 sm:p-6 text-center space-y-3 shadow-md order-2 md:order-1 relative"
            >
              <div className="w-12 h-12 rounded-full bg-slate-300/20 text-slate-400 flex items-center justify-center mx-auto border border-slate-300/40">
                <Medal size={22} />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-200/20 text-slate-400">
                2nd place
              </span>
              <h3 className="text-base font-semibold text-label-primary truncate tracking-tight">{second.user?.name}</h3>
              <p className="text-xl sm:text-2xl font-semibold text-label-primary tabular-nums">{second.totalScore} pts</p>
              <p className="text-[11px] text-label-tertiary font-mono tabular-nums">{formatSeconds(second.timeTakenSeconds)}</p>
            </motion.div>
          )}

          {/* 1st Place (Champion Spotlight) */}
          {first && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-b from-amber-500/10 via-surface to-surface rounded-3xl border border-amber-500/40 p-6 sm:p-8 text-center space-y-4 shadow-xl order-1 md:order-2 relative"
            >
              <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto border border-amber-500 shadow-md shadow-amber-500/20">
                <Crown size={28} />
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Champion #1
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-label-primary tracking-tight">{first.user?.name}</h3>
                <p className="text-xs text-label-tertiary font-mono">{first.user?.rollNo || 'Rank #1'}</p>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold text-amber-500 tabular-nums">{first.totalScore} pts</p>
              <p className="text-xs text-label-tertiary font-mono tabular-nums">{formatSeconds(first.timeTakenSeconds)}</p>
            </motion.div>
          )}

          {/* 3rd Place */}
          {third && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface rounded-3xl border border-separator p-5 sm:p-6 text-center space-y-3 shadow-md order-3 relative"
            >
              <div className="w-12 h-12 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-500 flex items-center justify-center mx-auto border border-amber-700/40">
                <Medal size={22} />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-700/20 text-amber-700 dark:text-amber-400">
                3rd place
              </span>
              <h3 className="text-base font-semibold text-label-primary truncate tracking-tight">{third.user?.name}</h3>
              <p className="text-xl sm:text-2xl font-semibold text-label-primary tabular-nums">{third.totalScore} pts</p>
              <p className="text-[11px] text-label-tertiary font-mono tabular-nums">{formatSeconds(third.timeTakenSeconds)}</p>
            </motion.div>
          )}
        </div>
      )}

      {/* --- FULL RANKINGS TABLE --- */}
      <div className="bg-surface rounded-3xl border border-separator p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="text-sm font-semibold text-label-primary uppercase tracking-wider">
              Participant standings ({leaderboard.length})
            </h3>
            {isPrivileged && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {activeContest?.pointAllocationMode || 'AUTOMATIC'} MODE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <HeroInput
                size="sm"
                value={search}
                onValueChange={setSearch}
                placeholder="Search participant..."
                startContent={<Search size={14} className="text-label-tertiary" />}
              />
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="bordered"
              onPress={() => id && fetchLeaderboard(id, { page, limit })}
              isDisabled={loading}
              className="border-separator rounded-xl"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar touch-pan-x border border-separator rounded-2xl">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-surface-secondary border-b border-separator text-label-tertiary font-medium uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Participant</th>
                <th className="py-3 px-4 text-center">MCQ score</th>
                <th className="py-3 px-4 text-center">Code score</th>
                <th className="py-3 px-4 text-center">Total score</th>
                <th className="py-3 px-4">Time taken</th>
                <th className="py-3 px-4 text-center">Awarded XP</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator text-label-primary font-normal">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-label-tertiary">
                    <RefreshCw size={20} className="animate-spin text-primary mx-auto mb-2" />
                    Loading leaderboard standings...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-label-tertiary">
                    No participants found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const isMe =
                    Boolean(currentUserId) &&
                    (entry.user?._id === currentUserId || (entry.user as any)?.id === currentUserId);

                  return (
                    <tr key={entry.submissionId} className="hover:bg-surface-secondary/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium">
                        {entry.rank === 1 ? (
                          <span className="text-amber-500 font-semibold tabular-nums">#1</span>
                        ) : entry.rank === 2 ? (
                          <span className="text-slate-400 font-semibold tabular-nums">#2</span>
                        ) : entry.rank === 3 ? (
                          <span className="text-amber-700 dark:text-amber-400 font-semibold tabular-nums">#3</span>
                        ) : (
                          <span className="text-label-tertiary tabular-nums">#{entry.rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-label-primary flex items-center gap-1.5">
                          <span>{entry.user?.name || 'Anonymous'}</span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                              YOU
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-label-tertiary font-mono">
                          {entry.user?.rollNo || entry.user?.email}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-label-secondary tabular-nums">{entry.mcqScore}</td>
                      <td className="py-3 px-4 text-center font-mono text-label-secondary tabular-nums">{entry.codingScore}</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-primary text-sm tabular-nums">
                        {entry.totalScore}
                      </td>
                      <td className="py-3 px-4 font-mono text-label-tertiary text-[11px] tabular-nums">
                        {formatSeconds(entry.timeTakenSeconds)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
                            +{entry.awardedClubPoints} XP
                          </span>
                          {entry.manualPointsAdjustment ? (
                            <span
                              title={entry.manualPointsReason || 'Manual adjustment'}
                              className="text-[9px] font-medium text-amber-500 mt-0.5 tabular-nums"
                            >
                              {entry.manualPointsAdjustment > 0 ? `+${entry.manualPointsAdjustment}` : entry.manualPointsAdjustment} manual
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {(isPrivileged || isMe) && (
                            <Button
                              size="sm"
                              variant={isMe ? 'flat' : 'bordered'}
                              color={isMe ? 'success' : 'default'}
                              onPress={() => handleInspectSubmission(entry)}
                              className="text-xs font-medium rounded-xl shadow-xs border-separator"
                              title={isMe ? 'View your submission' : 'Inspect student submission (MCQs + Code)'}
                              startContent={<FileCode2 size={12} className={isMe ? 'text-emerald-500' : 'text-primary'} />}
                            >
                              {isMe ? 'My work' : 'Inspect'}
                            </Button>
                          )}

                          {isPrivileged && (
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              onPress={() => setSelectedEntryForPoints(entry)}
                              className="text-xs font-medium rounded-xl shadow-xs"
                              title="Manually allocate or adjust points"
                              startContent={<Zap size={12} className="fill-current" />}
                            >
                              <span className="hidden sm:inline">Allocate</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {leaderboardPagination && leaderboardPagination.totalPages > 1 && (
          <div className="p-4 border-t border-separator">
            <Pagination
              pagination={leaderboardPagination}
              onPageChange={(newPage) => setPage(newPage)}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
              pageSizeOptions={[20, 50, 100]}
            />
          </div>
        )}
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

      {/* Full Submissions Roster Modal (Admin) */}
      {id && (
        <ContestSubmissionsModal
          isOpen={isSubmissionsRosterOpen}
          onClose={() => setIsSubmissionsRosterOpen(false)}
          contest={activeContest || ({ _id: id, title: 'Weekly Contest' } as any)}
        />
      )}

      {/* Detailed Student Submission Review (MCQ + Code) */}
      <ContestSubmissionDetailModal
        isOpen={Boolean(selectedSubmissionForDetails)}
        onClose={() => setSelectedSubmissionForDetails(null)}
        submission={selectedSubmissionForDetails}
        contestTitle={activeContest?.title || 'Weekly Contest'}
        contestType={activeContest?.type}
        isAdminView={isPrivileged}
        onAllocatePoints={(sub) => {
          setSelectedSubmissionForDetails(null);
          setSelectedEntryForPoints({
            submissionId: sub._id,
            user: sub.userId,
            totalScore: sub.totalScore,
            awardedClubPoints: sub.awardedClubPoints || 0,
            manualPointsReason: sub.manualPointsReason,
          } as any);
        }}
      />
    </div>
  );
};

export default ContestLeaderboardPage;
