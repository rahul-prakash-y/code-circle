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

  const handleOpenMySubmission = async (contest: Contest) => {
    // If submission already enriched with mcqAnswers or codingSubmissions
    if (contest.mySubmission?.mcqAnswers?.length || contest.mySubmission?.codingSubmissions?.length) {
      setActiveStudentSubmission({ contest, submission: contest.mySubmission });
      return;
    }
    const res = await fetchMyContestSubmission(contest._id);
    if (res.success && res.data) {
      setActiveStudentSubmission({ contest, submission: res.data });
    } else {
      toast.error(res.error || 'Failed to load your contest submission');
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const liveContests = contests.filter((c) => c.status === 'LIVE');
  const upcomingContests = contests.filter((c) => c.status === 'UPCOMING');
  const pastContests = contests.filter((c) => c.status === 'ENDED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Account Restriction Notice */}
      <RestrictionBanner feature="contests" />

      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-separator pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <Flame size={16} className="text-amber-500 animate-pulse" />
            <span>Competitive Assessment Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-label-primary tracking-tight">
            Weekly Coding & MCQ Contests
          </h1>
          <p className="text-xs text-label-tertiary mt-1 max-w-xl">
            Test your algorithmic proficiency and technical knowledge in timed competitive rounds. Earn points to climb the campus leaderboard!
          </p>
        </div>

        {/* View Switcher for Admins */}
        <div className="flex items-start gap-3 flex-col pb-1">
          {isPrivileged && (
            <div className="flex items-center p-1 bg-surface-secondary border border-separator rounded-2xl shadow-xs shrink-0">
              <button
                onClick={() => setViewMode('arena')}
                className={`flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'arena'
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <Trophy size={15} />
                <span>Arena Hub</span>
              </button>
              <button
                onClick={() => setViewMode('manage')}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'manage'
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <Award size={15} />
                <span>Manage Contests</span>
              </button>
            </div>
          )}

          {isPrivileged && viewMode === 'manage' && (
            <button
              onClick={() => {
                setEditingContest(null);
                setIsBuilderOpen(true);
              }}
              className="flex items-center whitespace-nowrap gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus size={15} />
              <span>New Contest</span>
            </button>
          )}
        </div>
      </div>

      {/* --- VIEW MODE 1: STUDENT ARENA HUB --- */}
      {viewMode === 'arena' && (
        <div className="space-y-10">
          {/* 1. LIVE CONTESTS (Spotlight) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-label-primary uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Active Live Battles ({liveContests.length})</span>
              </h2>
            </div>

            {liveContests.length === 0 ? (
              <div className="p-8 rounded-2xl bg-surface border border-separator text-center text-label-tertiary text-xs">
                No active live contests running right now. Check upcoming battles below!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveContests.map((c) => (
                  <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-surface rounded-2xl sm:rounded-3xl border border-separator hover:border-primary/40 p-4 sm:p-6 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Subtle decorative glow in top right */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="space-y-4 relative z-10">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>LIVE ARENA</span>
                        </span>
                        <span
                          className="text-xs font-mono font-bold text-label-secondary flex items-center gap-1.5"
                          title={`Scheduled contest closing time: ${formatISTDateTime(c.endTime)}`}
                        >
                          <Clock size={13} className="text-primary shrink-0" />
                          <span className="truncate">{formatRemainingTime(c.endTime)} • Closes {formatISTTime(c.endTime)}</span>
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg sm:text-2xl font-black text-label-primary tracking-tight break-words">
                          {c.title}
                        </h3>
                        <p className="text-xs text-label-tertiary mt-1.5 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium text-label-secondary pt-1 sm:pt-2">
                        <span className="flex items-center gap-1.5 bg-surface-secondary px-2.5 py-1 rounded-xl border border-separator/80">
                          <Zap size={13} className="text-amber-500" />
                          <span>{c.totalPoints} Reward Points</span>
                        </span>
                        <span className="flex items-center gap-1.5 bg-surface-secondary px-2.5 py-1 rounded-xl border border-separator/80">
                          <Clock size={13} className="text-primary" />
                          <span>{c.durationMinutes} Mins</span>
                        </span>
                        <span className="flex items-center gap-1.5 bg-surface-secondary px-2.5 py-1 rounded-xl border border-separator/80">
                          <Users size={13} className="text-indigo-500" />
                          <span>{c.participantsCount} Joined</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-separator/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-10">
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <button
                          onClick={() => navigate(`/contests/${c._id}/leaderboard`)}
                          className="text-xs font-bold text-label-secondary hover:text-label-primary transition-colors flex items-center gap-1 cursor-pointer py-1.5"
                        >
                          <Trophy size={14} className="text-amber-500" />
                          <span>Leaderboard</span>
                        </button>

                        {isPrivileged && (
                          <button
                            type="button"
                            onClick={() => setSelectedContestForSubmissions(c)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-1 cursor-pointer"
                            title="Submissions & Point Allocation"
                          >
                            <Sliders size={13} />
                            <span>Submissions</span>
                          </button>
                        )}
                      </div>

                      {c.mySubmission?.status === 'SUBMITTED' ? (
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleOpenMySubmission(c)}
                            className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            title="View your submitted MCQ choices and code solutions"
                          >
                            <FileCode2 size={14} />
                            <span>My Submission ({c.mySubmission.totalScore} pts)</span>
                          </button>
                          {c.mySubmission?.reentryStatus === 'PENDING' ? (
                            <span
                              className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs font-bold flex items-center gap-1.5"
                              title="Your re-entry request is awaiting administrator approval"
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                              <span>Re-entry Pending</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedContestForReentry(c)}
                              className="px-3 py-2.5 bg-surface-secondary hover:bg-surface border border-separator hover:border-primary/40 text-label-secondary hover:text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Request administrator approval to re-enter this contest"
                            >
                              <RotateCcw size={13} />
                              <span className="hidden sm:inline">Request Re-entry</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (user?.isRestricted && user?.restrictedFeatures?.includes('contests')) {
                              toast.error('You are restricted from entering contests. You can request re-entry/appeal from administrators.');
                              setSelectedContestForReentry(c);
                              return;
                            }
                            navigate(`/contests/${c._id}/arena`);
                          }}
                          className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Play size={14} className="fill-current" />
                          <span>{c.mySubmission ? 'Resume Contest' : 'Enter Arena'}</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* 2. UPCOMING CONTESTS */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-label-primary uppercase tracking-wider flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              <span>Upcoming Scheduled Battles ({upcomingContests.length})</span>
            </h2>

            {upcomingContests.length === 0 ? (
              <p className="text-xs text-label-tertiary">No upcoming battles scheduled. New challenges drop every week!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {upcomingContests.map((c) => (
                  <div
                    key={c._id}
                    className="bg-surface rounded-2xl border border-separator p-6 space-y-4 shadow-sm hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {c.type}
                      </span>
                      <span
                        className="text-label-secondary font-semibold"
                        title={`Contest opens: ${formatISTDateTime(c.startTime)}`}
                      >
                        Starts {formatISTDateTime(c.startTime, { showYear: false })}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-label-primary tracking-tight line-clamp-1">
                        {c.title}
                      </h4>
                      <p className="text-xs text-label-tertiary mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-separator text-xs">
                      <span className="font-bold text-amber-500 font-mono">{c.totalPoints} Points</span>
                      <span className="text-label-secondary font-medium">{c.durationMinutes} Minutes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. PAST COMPLETED CONTESTS */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-label-primary uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Completed Battles & Archives ({pastContests.length})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pastContests.map((c) => (
                <div
                  key={c._id}
                  className="bg-surface rounded-2xl border border-separator p-6 space-y-4 shadow-sm hover:border-primary/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="uppercase font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                        {c.difficulty}
                      </span>
                      <span
                        className="text-label-secondary"
                        title={`Contest concluded: ${formatISTDateTime(c.endTime)}`}
                      >
                        Ended {formatISTDateTime(c.endTime, { showYear: false })}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-label-primary tracking-tight">{c.title}</h4>
                    <p className="text-xs text-label-tertiary line-clamp-2 leading-relaxed">{c.description}</p>
                  </div>

                  <div className="pt-3 border-t border-separator flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-label-secondary font-medium">
                      {c.participantsCount} Participants
                    </span>
                    <div className="flex items-center gap-2">
                      {c.mySubmission && (
                        <button
                          type="button"
                          onClick={() => handleOpenMySubmission(c)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
                          title="View your submitted MCQ choices and code solutions"
                        >
                          <FileCode2 size={13} />
                          <span>My Submission</span>
                        </button>
                      )}
                      {isPrivileged && (
                        <button
                          type="button"
                          onClick={() => setSelectedContestForSubmissions(c)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-1 cursor-pointer"
                          title="Submissions & Point Allocation"
                        >
                          <Sliders size={13} />
                          <span>Submissions</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigate(`/contests/${c._id}/leaderboard`)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trophy size={13} />
                        <span>Rankings</span>
                      </button>
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
        <div className="bg-surface rounded-3xl border border-separator p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-label-primary flex items-center gap-2">
              <Award size={18} className="text-primary" />
              <span>Weekly Contest Management Ledger</span>
            </h3>
            <span className="text-xs text-label-tertiary font-mono">{contests.length} total contests</span>
          </div>

          <div className="overflow-x-auto border border-separator rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-secondary border-b border-separator text-label-secondary font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Title & Slug</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Schedule Window</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Points</th>
                  <th className="py-3 px-4">Participants</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator text-label-primary font-medium">
                {contests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-label-tertiary">
                      No contests found. Click "New Contest" above to launch a weekly challenge!
                    </td>
                  </tr>
                ) : (
                  contests.map((c) => (
                    <tr key={c._id} className="hover:bg-surface-secondary/60 transition-colors">
                      <td className="py-3 px-4 ">
                        <p className="font-bold text-label-primary whitespace-nowrap">{c.title}</p>
                        <p className="text-[10px] text-label-tertiary font-mono whitespace-nowrap">{c.slug}</p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                          {c.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-label-secondary font-mono whitespace-nowrap">
                        {formatISTRange(c.startTime, c.endTime)}
                      </td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap">{c.durationMinutes}m</td>
                      <td className="py-3 px-4 font-bold font-mono text-amber-500 whitespace-nowrap">{c.totalPoints} pts</td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap">{c.participantsCount}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => setSelectedContestForSubmissions(c)}
                          className="p-1.5 hover:bg-amber-500/10 text-amber-500 rounded-lg transition-colors"
                          title="Submissions & Point Allocation"
                        >
                          <Sliders size={14} />
                        </button>
                        <button
                          onClick={() => navigate(`/contests/${c._id}/leaderboard`)}
                          className="p-1.5 hover:bg-surface-secondary text-amber-500 rounded-lg transition-colors"
                          title="Leaderboard"
                        >
                          <Trophy size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingContest(c);
                            setIsBuilderOpen(true);
                          }}
                          className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete contest "${c.title}"?`)) deleteContest(c._id);
                          }}
                          className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
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
