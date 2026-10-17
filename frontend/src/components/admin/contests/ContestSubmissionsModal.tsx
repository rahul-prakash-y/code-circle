import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  Award,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  Code2,
  Clock,
  Sparkles,
  RefreshCw,
  Edit3,
  Sliders,
  HelpCircle,
  UserCheck,
  RotateCcw,
  Trash2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import useContestStore, { Contest } from '../../../store/useContestStore';
import AllocatePointsModal from './AllocatePointsModal';
import ContestSubmissionDetailModal from './ContestSubmissionDetailModal';
import {
  ApproveReentryModal,
  RejectReentryModal,
  DeleteSubmissionModal,
} from './ContestReentryActionModals';
import TutorialButton from '../../common/TutorialButton';
import Pagination from '../../common/Pagination';

interface ContestSubmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contest: Contest | null;
}

export const ContestSubmissionsModal: React.FC<ContestSubmissionsModalProps> = ({
  isOpen,
  onClose,
  contest,
}) => {
  const { fetchContestSubmissions, bulkAllocatePoints } = useContestStore();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'REENTRY_REQUESTS' | 'ALLOCATED' | 'PENDING'>('ALL');
  const [selectedSubmissionForPoints, setSelectedSubmissionForPoints] = useState<any | null>(null);
  const [selectedSubmissionForDetails, setSelectedSubmissionForDetails] = useState<any | null>(null);
  const [selectedSubmissionForApproveReentry, setSelectedSubmissionForApproveReentry] = useState<any | null>(null);
  const [selectedSubmissionForRejectReentry, setSelectedSubmissionForRejectReentry] = useState<any | null>(null);
  const [selectedSubmissionForDelete, setSelectedSubmissionForDelete] = useState<any | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadData = async (targetPage = page) => {
    if (!contest) return;
    setLoading(true);
    const res = await fetchContestSubmissions(contest._id, {
      page: targetPage,
      limit,
      search: search.trim() || undefined,
      filterMode,
    });
    if (res.success && res.data) {
      setSubmissions(res.data);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && contest) {
      loadData(page);
    }
  }, [isOpen, contest, page, limit, filterMode]);

  useEffect(() => {
    if (!isOpen || !contest) return;
    const timer = setTimeout(() => {
      setPage(1);
      loadData(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  if (!isOpen || !contest) return null;

  const pendingReentryCount = pagination?.total
    ? submissions.filter((s) => s.reentryStatus === 'PENDING').length
    : 0;

  const filtered = submissions;

  const handleBulkMatchScores = async () => {
    if (!confirm(`Allocate club points equal to each student's earned contest score for all participants?`)) {
      return;
    }
    setBulkLoading(true);
    try {
      await bulkAllocatePoints(contest._id, { preset: 'MATCH_SCORE_ALL' });
      await loadData();
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkBonus = async () => {
    const bonusStr = prompt('Enter bonus points to add to all submitted participants:', '25');
    if (!bonusStr) return;
    const bonus = parseInt(bonusStr);
    if (isNaN(bonus) || bonus <= 0) return;

    setBulkLoading(true);
    try {
      await bulkAllocatePoints(contest._id, { preset: 'ADD_BONUS_ALL', bonusPoints: bonus });
      await loadData();
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-surface border border-separator rounded-2xl sm:rounded-3xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-separator flex items-start sm:items-center justify-between gap-3 bg-surface-secondary">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Sliders size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-label-primary tracking-tight break-words">
                    Submissions & Student Re-entry
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {contest.pointAllocationMode || 'AUTOMATIC'} MODE
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-label-tertiary truncate max-w-xl">
                  {contest.title} • Review student submissions, evaluate code, approve re-entry, or delete entries
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <TutorialButton tutorialId="contests" variant="icon" />
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-label-secondary hover:text-label-primary rounded-xl hover:bg-surface transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="p-3 sm:p-4 border-b border-separator bg-surface-secondary/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
              <div className="relative w-full sm:max-w-xs">
                <Search size={14} className="absolute left-3 top-2.5 text-label-tertiary" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter student or roll no..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary"
                />
              </div>

              {/* Status Pills */}
              <div className="flex items-center bg-surface p-1 rounded-xl border border-separator text-[11px] overflow-x-auto no-scrollbar flex-nowrap shrink-0">
                {(['ALL', 'REENTRY_REQUESTS', 'ALLOCATED', 'PENDING'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      filterMode === mode
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-label-tertiary hover:text-label-secondary'
                    }`}
                  >
                    <span>
                      {mode === 'ALL'
                        ? 'All'
                        : mode === 'REENTRY_REQUESTS'
                        ? 'Re-entry Requests'
                        : mode === 'ALLOCATED'
                        ? 'Allocated'
                        : 'Pending'}
                    </span>
                    {mode === 'REENTRY_REQUESTS' && pendingReentryCount > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black ${
                          filterMode === mode
                            ? 'bg-white text-primary'
                            : 'bg-amber-500 text-white animate-pulse'
                        }`}
                      >
                        {pendingReentryCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
              <button
                type="button"
                onClick={handleBulkMatchScores}
                disabled={bulkLoading || submissions.length === 0}
                className="px-3 py-1.5 bg-surface border border-separator hover:bg-surface-secondary text-label-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                title="Automatically set awarded points = student's total score"
              >
                <Zap size={13} className="text-amber-500" />
                <span>Match Scores</span>
              </button>
              <button
                type="button"
                onClick={handleBulkBonus}
                disabled={bulkLoading || submissions.length === 0}
                className="px-3 py-1.5 bg-surface border border-separator hover:bg-surface-secondary text-label-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles size={13} className="text-indigo-500" />
                <span>Bulk +Bonus</span>
              </button>
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="p-1.5 text-label-secondary hover:text-label-primary rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw size={24} className="animate-spin text-primary mx-auto" />
                <p className="text-xs text-label-tertiary">Loading contest submissions...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center space-y-2 border border-dashed border-separator rounded-2xl">
                <Users size={32} className="text-label-tertiary mx-auto opacity-50" />
                <p className="text-sm font-bold text-label-secondary">No submissions matching criteria</p>
                <p className="text-xs text-label-tertiary">
                  Students will appear here once they participate in this weekly contest.
                </p>
              </div>
            ) : (
              <div className="border border-separator rounded-2xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-xs min-w-[720px]">
                    <thead className="bg-surface-secondary border-b border-separator text-label-secondary font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4 text-center">Score Earned</th>
                        <th className="py-3 px-4 text-center">MCQ Breakdown</th>
                        <th className="py-3 px-4 text-center">Code Solutions</th>
                        <th className="py-3 px-4 text-center">Awarded Points</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-separator text-label-primary font-medium">
                    {filtered.map((s) => {
                      const mcqCorrect = (s.mcqAnswers || []).filter((a: any) => a.isCorrect).length;
                      const mcqTotal = s.mcqAnswers?.length || 0;
                      const codingCount = s.codingSubmissions?.length || 0;

                      return (
                        <tr key={s._id} className="hover:bg-surface-secondary/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-label-primary">{s.userId?.name || 'Anonymous'}</p>
                              {s.status === 'IN_PROGRESS' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                  In Arena
                                </span>
                              )}
                              {s.status === 'SUBMITTED' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  Submitted
                                </span>
                              )}
                              {s.status === 'AUTO_EXPIRED' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                  Expired
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-label-tertiary font-mono">
                              {s.userId?.rollNo || s.userId?.email || 'N/A'}
                            </p>

                            {/* Reentry Indicators */}
                            {s.reentryStatus === 'PENDING' && (
                              <div className="mt-1.5 p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5 max-w-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                                <span className="truncate" title={s.reentryReason}>
                                  Appeal: "{s.reentryReason || 'Re-entry requested'}"
                                </span>
                              </div>
                            )}
                            {s.reentryStatus === 'APPROVED' && (
                              <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md w-fit">
                                <CheckCircle2 size={10} />
                                <span>Re-entry Approved ({s.reentryCount || 1}x)</span>
                              </div>
                            )}
                            {s.reentryStatus === 'REJECTED' && (
                              <div
                                className="mt-1 flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md w-fit"
                                title={s.reentryReviewNote}
                              >
                                <XCircle size={10} />
                                <span>Re-entry Declined</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="font-mono font-extrabold text-primary text-sm">
                              {s.totalScore} pts
                            </span>
                            <p className="text-[10px] text-label-tertiary font-mono">
                              {Math.floor((s.timeTakenSeconds || 0) / 60)}m {((s.timeTakenSeconds || 0) % 60)}s
                            </p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedSubmissionForDetails(s)}
                              className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-surface-secondary hover:bg-primary/10 border border-separator hover:border-primary/30 text-label-secondary hover:text-primary transition-all inline-flex items-center gap-1 cursor-pointer"
                              title="Click to view MCQ answers"
                            >
                              <HelpCircle size={11} />
                              <span>{mcqCorrect}/{mcqTotal} correct</span>
                            </button>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {codingCount === 0 ? (
                              <span className="text-[10px] text-label-tertiary">None</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedSubmissionForDetails(s)}
                                className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="Click to view code solutions"
                              >
                                <Code2 size={11} />
                                <span>{codingCount} codes</span>
                              </button>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black ${
                                  s.pointsAwarded && (s.awardedClubPoints || 0) > 0
                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                }`}
                              >
                                {s.awardedClubPoints || 0} XP
                              </span>
                              {s.manualPointsAdjustment ? (
                                <span
                                  title={s.manualPointsReason || 'Manual adjustment'}
                                  className="text-[9px] text-amber-500 font-bold mt-0.5"
                                >
                                  {s.manualPointsAdjustment > 0 ? `+${s.manualPointsAdjustment}` : s.manualPointsAdjustment} manual
                                </span>
                              ) : null}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Re-entry Action Buttons */}
                              {s.reentryStatus === 'PENDING' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSubmissionForApproveReentry(s)}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer shadow-xs shadow-emerald-500/20"
                                    title="Approve Re-entry Request"
                                  >
                                    <UserCheck size={12} />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSubmissionForRejectReentry(s)}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all cursor-pointer border border-rose-500/20"
                                    title="Decline Re-entry Request"
                                  >
                                    <XCircle size={12} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubmissionForApproveReentry(s)}
                                  className="px-2 py-1.5 bg-surface-secondary hover:bg-surface border border-separator hover:border-emerald-500/40 text-label-secondary hover:text-emerald-500 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                                  title="Allow Re-entry & Resume Session"
                                >
                                  <RotateCcw size={12} />
                                  <span className="hidden lg:inline">Re-entry</span>
                                </button>
                              )}

                              {/* Inspect Submission */}
                              <button
                                type="button"
                                onClick={() => setSelectedSubmissionForDetails(s)}
                                className="px-2 py-1.5 bg-surface-secondary hover:bg-surface border border-separator hover:border-primary/40 text-label-secondary hover:text-label-primary rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="Inspect Complete Submission (MCQs + Code)"
                              >
                                <FileCode2 size={12} className="text-primary" />
                                <span className="hidden md:inline">Inspect</span>
                              </button>

                              {/* Allocate Points */}
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedSubmissionForPoints({
                                    submissionId: s._id,
                                    user: s.userId,
                                    totalScore: s.totalScore,
                                    awardedClubPoints: s.awardedClubPoints || 0,
                                    manualPointsReason: s.manualPointsReason,
                                  })
                                }
                                className="px-2 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="Manual Points Allocation"
                              >
                                <Zap size={12} className="fill-current" />
                                <span className="hidden md:inline">Points</span>
                              </button>

                              {/* Delete Student Entry */}
                              <button
                                type="button"
                                onClick={() => setSelectedSubmissionForDelete(s)}
                                className="p-1.5 bg-surface-secondary hover:bg-rose-500/10 text-label-tertiary hover:text-rose-500 rounded-xl transition-all cursor-pointer border border-separator hover:border-rose-500/30"
                                title="Delete Student Contest Entry"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>

          {/* Footer & Pagination */}
          <div className="p-4 border-t border-separator bg-surface-secondary flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-label-secondary">
            <div className="w-full sm:w-auto">
              {pagination && pagination.totalPages > 1 && (
                <Pagination
                  pagination={pagination}
                  onPageChange={(p) => setPage(p)}
                  onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1);
                  }}
                  pageSizeOptions={[10, 20, 50]}
                />
              )}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span>
                Total: {pagination?.total ?? submissions.length} participant{pagination?.total === 1 ? '' : 's'}
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-surface border border-separator rounded-xl font-bold text-label-primary hover:bg-surface-secondary transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Comprehensive Student Submission Review Modal (MCQ + Coding) */}
      <ContestSubmissionDetailModal
        isOpen={Boolean(selectedSubmissionForDetails)}
        onClose={() => setSelectedSubmissionForDetails(null)}
        submission={selectedSubmissionForDetails}
        contestTitle={contest.title}
        contestType={contest.type}
        isAdminView={true}
        onAllocatePoints={(sub) => {
          setSelectedSubmissionForDetails(null);
          setSelectedSubmissionForPoints({
            submissionId: sub._id,
            user: sub.userId,
            totalScore: sub.totalScore,
            awardedClubPoints: sub.awardedClubPoints || 0,
            manualPointsReason: sub.manualPointsReason,
          });
        }}
        onApproveReentry={(sub) => {
          setSelectedSubmissionForDetails(null);
          setSelectedSubmissionForApproveReentry(sub);
        }}
        onDeleteSubmission={(sub) => {
          setSelectedSubmissionForDetails(null);
          setSelectedSubmissionForDelete(sub);
        }}
      />

      {/* Allocate Points Modal */}
      <AllocatePointsModal
        isOpen={Boolean(selectedSubmissionForPoints)}
        onClose={() => setSelectedSubmissionForPoints(null)}
        contestId={contest._id}
        entry={selectedSubmissionForPoints}
        onSuccess={loadData}
      />

      {/* Approve Re-entry Modal */}
      <ApproveReentryModal
        isOpen={Boolean(selectedSubmissionForApproveReentry)}
        onClose={() => setSelectedSubmissionForApproveReentry(null)}
        submission={selectedSubmissionForApproveReentry}
        contest={contest}
        onSuccess={loadData}
      />

      {/* Reject Re-entry Modal */}
      <RejectReentryModal
        isOpen={Boolean(selectedSubmissionForRejectReentry)}
        onClose={() => setSelectedSubmissionForRejectReentry(null)}
        submission={selectedSubmissionForRejectReentry}
        contest={contest}
        onSuccess={loadData}
      />

      {/* Delete Submission Modal */}
      <DeleteSubmissionModal
        isOpen={Boolean(selectedSubmissionForDelete)}
        onClose={() => setSelectedSubmissionForDelete(null)}
        submission={selectedSubmissionForDelete}
        contest={contest}
        onSuccess={loadData}
      />
    </AnimatePresence>
  );
};

export default ContestSubmissionsModal;
