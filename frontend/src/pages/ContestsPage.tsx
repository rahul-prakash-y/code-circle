import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Award,
  Play,
  Clock,
  Calendar,
  Sparkles,
  Zap,
  Code2,
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  ChevronRight,
  Flame,
  Users,
  CheckCircle2,
  Sliders,
  FileCode2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { EmptyState, CardGridSkeleton } from '../components/states';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import useContestStore, { Contest } from '../store/useContestStore';
import ContestBuilderModal from '../components/admin/contests/ContestBuilderModal';
import ContestSubmissionsModal from '../components/admin/contests/ContestSubmissionsModal';
import ContestSubmissionDetailModal from '../components/admin/contests/ContestSubmissionDetailModal';
import RequestReentryModal from '../components/contests/RequestReentryModal';
import {
  formatISTDateTime,
  formatISTTime,
  formatISTRange,
  formatRemainingTime,
} from '../lib/dateUtils';
import RestrictionBanner from '../components/common/RestrictionBanner';
import { toast } from 'react-hot-toast';

export const ContestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { contests, loading, fetchContests, deleteContest, fetchMyContestSubmission } =
    useContestStore();

  const isPrivileged =
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin' ||
    user?.role === 'Faculty' ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPERADMIN' ||
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty';

  const [viewMode, setViewMode] = useState<'arena' | 'manage'>('arena');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [selectedContestForSubmissions, setSelectedContestForSubmissions] = useState<Contest | null>(null);
  const [selectedContestForReentry, setSelectedContestForReentry] = useState<Contest | null>(null);
  const [activeStudentSubmission, setActiveStudentSubmission] = useState<{
    contest: Contest;
    submission: any;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingSubmissionId, setLoadingSubmissionId] = useState<string | null>(null);

  const handleDeleteContest = async (contest: Contest) => {
    if (!confirm(`Delete contest "${contest.title}"?`)) return;
    setDeletingId(contest._id);
    try {
      await deleteContest(contest._id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenMySubmission = async (contest: Contest) => {
    if (contest.mySubmission?.mcqAnswers?.length || contest.mySubmission?.codingSubmissions?.length) {
      setActiveStudentSubmission({ contest, submission: contest.mySubmission });
      return;
    }
    setLoadingSubmissionId(contest._id);
    try {
      const res = await fetchMyContestSubmission(contest._id);
      if (res.success && res.data) {
        setActiveStudentSubmission({ contest, submission: res.data });
      } else {
        toast.error(res.error || 'Failed to load your contest submission');
      }
    } finally {
      setLoadingSubmissionId(null);
    }
  };

  useEffect(() => {
    fetchContests();
    const handleFocus = () => {
      fetchContests();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const liveContests = contests.filter((c) => c.status === 'LIVE');
  const upcomingContests = contests.filter((c) => c.status === 'UPCOMING');
  const pastContests = contests.filter((c) => c.status === 'ENDED');

  return (
    <div className="max-w-7xl mx-auto py-2 sm:py-6 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Account Restriction Notice */}
      <RestrictionBanner feature="contests" />

      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-separator pb-5 sm:pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-xs uppercase tracking-wider mb-1">
            <Flame size={15} className="text-amber-500" />
            <span>Competitive assessment arena</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-label-primary tracking-tight leading-[1.15]">
            Weekly coding & technical contests
          </h1>
          <p className="text-xs sm:text-sm text-label-secondary mt-1 max-w-prose leading-relaxed">
            Test your algorithmic proficiency and technical knowledge in timed competitive rounds. Earn points to climb the campus leaderboard.
          </p>
        </div>

        {/* View Switcher for Admins */}
        <div className="flex items-start sm:items-end gap-3 flex-col pb-1 w-full sm:w-auto">
          {isPrivileged && (
            <div className="flex items-center p-1 bg-surface-secondary border border-separator rounded-2xl shadow-2xs shrink-0 w-full sm:w-auto">
              <Button
                size="sm"
                variant={viewMode === 'arena' ? 'solid' : 'light'}
                color={viewMode === 'arena' ? 'primary' : 'default'}
                onPress={() => setViewMode('arena')}
                className={`flex-1 sm:flex-initial text-xs font-medium rounded-xl ${
                  viewMode === 'arena'
                    ? 'shadow-xs'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
                startContent={<Trophy size={15} />}
              >
                Arena hub
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'manage' ? 'solid' : 'light'}
                color={viewMode === 'manage' ? 'primary' : 'default'}
                onPress={() => setViewMode('manage')}
                className={`flex-1 sm:flex-initial text-xs font-medium rounded-xl ${
                  viewMode === 'manage'
                    ? 'shadow-xs'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
                startContent={<Award size={15} />}
              >
                Manage contests
              </Button>
            </div>
          )}

          {isPrivileged && viewMode === 'manage' && (
            <Button
              size="sm"
              color="primary"
              variant="solid"
              onPress={() => {
                setEditingContest(null);
                setIsBuilderOpen(true);
              }}
              className="w-full sm:w-auto text-xs font-medium rounded-xl shadow-sm"
              startContent={<Plus size={15} />}
            >
              New contest
            </Button>
          )}
        </div>
      </div>

      {/* --- VIEW MODE 1: STUDENT ARENA HUB --- */}
      {viewMode === 'arena' && (
        <div className="space-y-8 sm:space-y-10">
          {/* 1. LIVE CONTESTS (Spotlight) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-label-primary uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active live contests ({liveContests.length})</span>
              </h2>
            </div>

            {loading ? (
              <CardGridSkeleton count={2} cols={2} />
            ) : liveContests.length === 0 ? (
              <EmptyState
                reason="first-use"
                title="No live contests running right now"
                description="Weekly coding and MCQ battles go live according to scheduled tournament rounds. Check upcoming sessions below."
                primaryAction={{
                  label: 'View Upcoming Contests',
                  onClick: () => {
                    document.getElementById('upcoming-contests-section')?.scrollIntoView({ behavior: 'smooth' });
                  },
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveContests.map((c) => (
                  <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-surface rounded-2xl sm:rounded-3xl border border-separator hover:border-primary/40 p-5 sm:p-6 md:p-8 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Subtle decorative glow in top right */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="space-y-4 relative z-10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="w-fit px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Live arena</span>
                        </span>
                        <span
                          className="text-xs font-mono font-medium text-label-secondary flex items-center gap-1.5 tabular-nums"
                          title={`Scheduled contest closing time: ${formatISTDateTime(c.endTime)}`}
                        >
                          <Clock size={13} className="text-primary shrink-0" />
                          <span className="truncate">{formatRemainingTime(c.endTime)} • Closes {formatISTTime(c.endTime)}</span>
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-label-primary tracking-tight break-words">
                          {c.title}
                        </h3>
                        <p className="text-xs sm:text-[13px] text-label-secondary mt-1.5 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium text-label-secondary pt-1">
                        <span className="flex items-center gap-1.5 bg-surface-secondary px-2.5 py-1 rounded-xl border border-separator tabular-nums">
                          <Zap size={13} className="text-amber-500" />
                          <span>{c.totalPoints} reward points</span>
                        </span>
                        <span className="flex items-center gap-1.5 bg-surface-secondary px-2.5 py-1 rounded-xl border border-separator tabular-nums">
                          <Clock size={13} className="text-blue-500" />
                          <span>{c.durationMinutes} minutes</span>
                        </span>
                        <span className="flex items-center gap-1.5 bg-surface-secondary px-2.5 py-1 rounded-xl border border-separator">
                          <Code2 size={13} className="text-purple-500" />
                          <span>{c.type} format</span>
                        </span>
                        <span className="flex items-center gap-1.5 bg-surface-secondary px-2.5 py-1 rounded-xl border border-separator tabular-nums">
                          <Users size={13} className="text-emerald-500" />
                          <span>{c.participantsCount} joined</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-separator flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10">
                      <Button
                        size="sm"
                        variant="bordered"
                        onPress={() => navigate(`/contests/${c._id}/leaderboard`)}
                        className="text-xs font-medium text-label-secondary hover:text-label-primary border-separator rounded-xl"
                        startContent={<Trophy size={14} className="text-amber-500" />}
                      >
                        Live rankings
                      </Button>

                      <div className="flex items-center gap-2">
                        {(() => {
                          const sub = c.mySubmission;
                          const canEnterOrResume =
                            !sub ||
                            sub.status === 'IN_PROGRESS' ||
                            sub.reentryStatus === 'APPROVED' ||
                            Boolean(sub.canReenter);

                          if (canEnterOrResume) {
                            return (
                              <Button
                                size="sm"
                                color="primary"
                                variant="solid"
                                onPress={() => navigate(`/contests/${c._id}/arena`)}
                                className="w-full sm:w-auto text-xs font-medium rounded-xl shadow-sm"
                                startContent={<Play size={14} className="fill-current" />}
                              >
                                {sub?.status === 'IN_PROGRESS' ? 'Resume battle' : 'Enter arena'}
                              </Button>
                            );
                          }

                          if (sub.reentryStatus === 'PENDING') {
                            return (
                              <div className="w-full sm:w-auto px-4 py-2 min-h-[42px] rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center justify-center gap-1.5">
                                <Clock size={14} className="animate-spin" />
                                <span>Re-entry pending review</span>
                              </div>
                            );
                          }

                          if (sub.reentryStatus === 'REJECTED') {
                            return (
                              <div className="w-full sm:w-auto px-4 py-2 min-h-[42px] rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center justify-center gap-1.5">
                                <span>Re-entry declined</span>
                              </div>
                            );
                          }

                          return (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <Button
                                size="sm"
                                variant="bordered"
                                onPress={() => handleOpenMySubmission(c)}
                                isLoading={loadingSubmissionId === c._id}
                                isDisabled={loadingSubmissionId === c._id}
                                className="flex-1 sm:flex-initial rounded-xl bg-surface-secondary hover:bg-surface border-separator text-xs font-medium text-label-secondary hover:text-label-primary"
                                title="Review submitted choices and code"
                                startContent={<FileCode2 size={14} />}
                              >
                                Review work
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                color="warning"
                                onPress={() => setSelectedContestForReentry(c)}
                                className="flex-1 sm:flex-initial rounded-xl text-xs font-medium"
                                title="Request administrator permission to resume session"
                                startContent={<RotateCcw size={14} />}
                              >
                                Request re-entry
                              </Button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* 2. UPCOMING CONTESTS */}
          <div id="upcoming-contests-section" className="space-y-4">
            <h2 className="text-sm font-semibold text-label-primary uppercase tracking-wider flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              <span>Upcoming scheduled contests ({upcomingContests.length})</span>
            </h2>

            {upcomingContests.length === 0 ? (
              <EmptyState
                reason="first-use"
                title="No upcoming contests scheduled"
                description="New coding challenges and MCQ sprints drop every week. Check past leaderboard records in the meantime."
                primaryAction={{
                  label: 'View Contests Leaderboard',
                  onClick: () => navigate('/leaderboard'),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {upcomingContests.map((c) => (
                  <div
                    key={c._id}
                    className="bg-surface rounded-2xl border border-separator p-5 sm:p-6 space-y-4 shadow-xs hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono font-medium">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {c.type}
                      </span>
                      <span
                        className="text-label-secondary"
                        title={`Contest opens: ${formatISTDateTime(c.startTime)}`}
                      >
                        Starts {formatISTDateTime(c.startTime, { showYear: false })}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-semibold text-label-primary tracking-tight line-clamp-1">
                        {c.title}
                      </h4>
                      <p className="text-xs text-label-secondary mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-separator text-xs">
                      <span className="font-medium text-amber-500 font-mono tabular-nums">{c.totalPoints} points</span>
                      <span className="text-label-secondary font-medium tabular-nums">{c.durationMinutes} minutes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. PAST COMPLETED CONTESTS */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-label-primary uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Completed contests & archives ({pastContests.length})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pastContests.map((c) => (
                <div
                  key={c._id}
                  className="bg-surface rounded-2xl border border-separator p-5 sm:p-6 space-y-4 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="uppercase font-medium text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                        {c.difficulty}
                      </span>
                      <span
                        className="text-label-secondary"
                        title={`Contest concluded: ${formatISTDateTime(c.endTime)}`}
                      >
                        Ended {formatISTDateTime(c.endTime, { showYear: false })}
                      </span>
                    </div>
                    <h4 className="text-base font-semibold text-label-primary tracking-tight">{c.title}</h4>
                    <p className="text-xs text-label-secondary line-clamp-2 leading-relaxed">{c.description}</p>
                  </div>

                  <div className="pt-3 border-t border-separator flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-label-secondary font-medium tabular-nums">
                      {c.participantsCount} participants
                    </span>
                    <div className="flex items-center gap-2">
                      {c.mySubmission && (
                        <Button
                          size="sm"
                          variant="flat"
                          color="success"
                          onPress={() => handleOpenMySubmission(c)}
                          isLoading={loadingSubmissionId === c._id}
                          isDisabled={loadingSubmissionId === c._id}
                          className="text-xs font-medium rounded-lg"
                          title="View your submitted MCQ choices and code solutions"
                          startContent={<FileCode2 size={13} />}
                        >
                          My submission
                        </Button>
                      )}
                      {isPrivileged && (
                        <Button
                          size="sm"
                          variant="flat"
                          color="warning"
                          onPress={() => setSelectedContestForSubmissions(c)}
                          className="text-xs font-medium rounded-lg"
                          title="Submissions & Point Allocation"
                          startContent={<Sliders size={13} />}
                        >
                          Submissions
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        onPress={() => navigate(`/contests/${c._id}/leaderboard`)}
                        className="text-xs font-medium"
                        startContent={<Trophy size={13} />}
                      >
                        Rankings
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW MODE 2: ADMIN MANAGEMENT --- */}
      {viewMode === 'manage' && (
        <div className="bg-surface rounded-3xl border border-separator p-4 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-label-primary flex items-center gap-2 tracking-tight">
              <Award size={18} className="text-primary" />
              <span>Weekly contest management ledger</span>
            </h3>
            <span className="text-xs text-label-secondary font-mono tabular-nums">{contests.length} total contests</span>
          </div>

          <div className="overflow-x-auto border border-separator rounded-2xl custom-scrollbar touch-pan-x">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-surface-secondary border-b border-separator text-label-tertiary font-medium uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Title & slug</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Schedule window</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Points</th>
                  <th className="py-3 px-4">Participants</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator text-label-primary font-normal">
                {contests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8">
                      <EmptyState
                        reason="first-use"
                        title="No contests configured in directory"
                        description="Configure a new coding battle or MCQ sprint with automated test evaluation."
                        primaryAction={{
                          label: 'Create Contest',
                          onClick: () => setIsBuilderOpen(true),
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  contests.map((c) => (
                    <tr key={c._id} className="hover:bg-surface-secondary/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-label-primary whitespace-nowrap">{c.title}</p>
                        <p className="text-[11px] text-label-tertiary font-mono whitespace-nowrap">{c.slug}</p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                          {c.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-label-secondary font-mono whitespace-nowrap tabular-nums">
                        {formatISTRange(c.startTime, c.endTime)}
                      </td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap tabular-nums">{c.durationMinutes}m</td>
                      <td className="py-3 px-4 font-medium font-mono text-amber-500 whitespace-nowrap tabular-nums">{c.totalPoints} pts</td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap tabular-nums">{c.participantsCount}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                            c.status === 'LIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : c.status === 'UPCOMING'
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                              : 'bg-surface-secondary text-label-secondary border border-separator'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="warning"
                            onPress={() => setSelectedContestForSubmissions(c)}
                            title="Submissions & point allocation"
                          >
                            <Sliders size={14} />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="warning"
                            onPress={() => navigate(`/contests/${c._id}/leaderboard`)}
                            title="Leaderboard"
                          >
                            <Trophy size={14} />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => {
                              setEditingContest(c);
                              setIsBuilderOpen(true);
                            }}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            isLoading={deletingId === c._id}
                            isDisabled={deletingId === c._id}
                            onPress={() => handleDeleteContest(c)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Builder Modal */}
      <ContestBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        editingContest={editingContest}
      />

      {/* Submissions & Manual Point Allocation Ledger */}
      <ContestSubmissionsModal
        isOpen={Boolean(selectedContestForSubmissions)}
        onClose={() => setSelectedContestForSubmissions(null)}
        contest={selectedContestForSubmissions}
      />

      {/* Student Personal Submission Review Modal */}
      <ContestSubmissionDetailModal
        isOpen={Boolean(activeStudentSubmission)}
        onClose={() => setActiveStudentSubmission(null)}
        submission={activeStudentSubmission?.submission}
        contestTitle={activeStudentSubmission?.contest?.title}
        contestType={activeStudentSubmission?.contest?.type}
        isAdminView={false}
      />

      {/* Student Contest Re-entry Request Modal */}
      <RequestReentryModal
        isOpen={Boolean(selectedContestForReentry)}
        onClose={() => setSelectedContestForReentry(null)}
        contestId={selectedContestForReentry?._id || ''}
        contestTitle={selectedContestForReentry?.title || ''}
        onSuccess={() => fetchContests()}
      />
    </div>
  );
};

export default ContestsPage;
