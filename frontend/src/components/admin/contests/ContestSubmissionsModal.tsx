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
} from 'lucide-react';
import useContestStore, { Contest } from '../../../store/useContestStore';
import AllocatePointsModal from './AllocatePointsModal';

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
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'ALLOCATED' | 'PENDING'>('ALL');
  const [selectedSubmissionForPoints, setSelectedSubmissionForPoints] = useState<any | null>(null);
  const [viewingCodeProblem, setViewingCodeProblem] = useState<any | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadData = async () => {
    if (!contest) return;
    setLoading(true);
    const res = await fetchContestSubmissions(contest._id);
    if (res.success && res.data) {
      setSubmissions(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && contest) {
      loadData();
    }
  }, [isOpen, contest]);

  if (!isOpen || !contest) return null;

  const filtered = submissions.filter((s) => {
    const matchesSearch =
      s.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.userId?.rollNo?.toLowerCase().includes(search.toLowerCase()) ||
      s.userId?.email?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'ALLOCATED') return s.pointsAwarded && (s.awardedClubPoints || 0) > 0;
    if (filterMode === 'PENDING') return !s.pointsAwarded || (s.awardedClubPoints || 0) === 0;
    return true;
  });

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-surface border border-separator rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-separator flex items-center justify-between bg-surface-secondary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                <Sliders size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-label-primary tracking-tight">
                    Submissions & Point Allocation
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {contest.pointAllocationMode || 'AUTOMATIC'} MODE
                  </span>
                </div>
                <p className="text-xs text-label-tertiary">
                  {contest.title} • Review student submissions and allocate merit points
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-label-secondary hover:text-label-primary rounded-xl hover:bg-surface-secondary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="p-4 border-b border-separator bg-surface-secondary/50 flex flex-wrap items-center justify-between gap-4">
            {/* Search & Filter */}
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 max-w-xs">
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
              <div className="flex items-center bg-surface p-1 rounded-xl border border-separator text-[11px]">
                {(['ALL', 'ALLOCATED', 'PENDING'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      filterMode === mode
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-label-tertiary hover:text-label-secondary'
                    }`}
                  >
                    {mode === 'ALL' ? 'All' : mode === 'ALLOCATED' ? 'Allocated' : 'Pending'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkMatchScores}
                disabled={bulkLoading || submissions.length === 0}
                className="px-3 py-1.5 bg-surface border border-separator hover:bg-surface-secondary text-label-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="Automatically set awarded points = student's total score"
              >
                <Zap size={13} className="text-amber-500" />
                <span>Match Total Scores</span>
              </button>
              <button
                type="button"
                onClick={handleBulkBonus}
                disabled={bulkLoading || submissions.length === 0}
                className="px-3 py-1.5 bg-surface border border-separator hover:bg-surface-secondary text-label-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles size={13} className="text-indigo-500" />
                <span>Bulk +Bonus</span>
              </button>
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="p-1.5 text-label-secondary hover:text-label-primary rounded-xl hover:bg-surface-secondary transition-colors"
                title="Refresh"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                <table className="w-full text-left text-xs">
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
                            <p className="font-bold text-label-primary">{s.userId?.name || 'Anonymous'}</p>
                            <p className="text-[10px] text-label-tertiary font-mono">
                              {s.userId?.rollNo || s.userId?.email || 'N/A'}
                            </p>
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
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-secondary border border-separator text-label-secondary">
                              {mcqCorrect}/{mcqTotal} correct
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {codingCount === 0 ? (
                              <span className="text-[10px] text-label-tertiary">None</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setViewingCodeProblem(s)}
                                className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors inline-flex items-center gap-1"
                              >
                                <Code2 size={12} />
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
                              className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
                            >
                              <Zap size={12} className="fill-current" />
                              <span>Allocate Points</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-separator bg-surface-secondary flex items-center justify-between text-xs text-label-secondary">
            <span>
              Showing {filtered.length} of {submissions.length} participants
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-surface border border-separator rounded-xl font-bold text-label-primary hover:bg-surface-secondary transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>

      {/* Code Viewer Modal */}
      {viewingCodeProblem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface border border-separator rounded-3xl max-w-3xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-separator pb-4">
              <div>
                <h4 className="text-sm font-bold text-label-primary">
                  Submitted Code • {viewingCodeProblem.userId?.name}
                </h4>
                <p className="text-xs text-label-tertiary">Inspection of participant solution</p>
              </div>
              <button
                onClick={() => setViewingCodeProblem(null)}
                className="p-1.5 text-label-secondary hover:text-label-primary rounded-xl hover:bg-surface-secondary transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {viewingCodeProblem.codingSubmissions?.map((cs: any, idx: number) => (
                <div key={idx} className="border border-separator rounded-2xl p-4 bg-surface-secondary space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-label-primary font-mono uppercase">{cs.language} Solution</span>
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {cs.passedTestCases}/{cs.totalTestCases} Tests Passed (+{cs.pointsEarned} pts)
                    </span>
                  </div>
                  <pre className="p-3 bg-zinc-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto border border-zinc-800">
                    {cs.code || '// No code submitted'}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Allocate Points Modal */}
      <AllocatePointsModal
        isOpen={Boolean(selectedSubmissionForPoints)}
        onClose={() => setSelectedSubmissionForPoints(null)}
        contestId={contest._id}
        entry={selectedSubmissionForPoints}
        onSuccess={loadData}
      />
    </AnimatePresence>
  );
};

export default ContestSubmissionsModal;
