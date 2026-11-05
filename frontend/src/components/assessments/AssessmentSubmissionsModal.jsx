import ResponsiveModal from '../ui/ResponsiveModal';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  RotateCcw,
  Trash2,
  Loader2,
  Sparkles,
  FileText,
  Download,
} from 'lucide-react';
import useAssessmentStore from '../../store/useAssessmentStore';
import usePointsStore from '../../store/usePointsStore';
import TutorialButton from '../common/TutorialButton';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';
import { formatISTDateTime } from '../../lib/dateUtils';
import Pagination from '../common/Pagination';
import AssessmentSubmissionDetailModal from './AssessmentSubmissionDetailModal';

const AssessmentSubmissionsModal = ({ assessmentId, assessment, isOpen, onClose }) => {
  const {
    assessmentSubmissions,
    activeAssessmentDetails,
    submissionsPagination,
    fetchAssessmentSubmissions,
    exportAssessmentSubmissionsCsv,
    deleteSubmission,
    allowStudentReappear,
    loading,
  } = useAssessmentStore();

  const { awardBonusPoints } = usePointsStore();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'reappear', subId, studentId, studentName }
  const [actionLoading, setActionLoading] = useState(false);
  const [inspectingSubmission, setInspectingSubmission] = useState(null);

  // Award custom points dialog state
  const [awardPointsTarget, setAwardPointsTarget] = useState(null); // { studentId, studentName, score, totalPoints, percentage }
  const [awardAmount, setAwardAmount] = useState(50);
  const [awardTitle, setAwardTitle] = useState('');
  const [awardDesc, setAwardDesc] = useState('');
  const [awardingLoading, setAwardingLoading] = useState(false);

  useEffect(() => {
    if (isOpen && assessmentId) {
      fetchAssessmentSubmissions(assessmentId, { page });
      setConfirmAction(null);
      setAwardPointsTarget(null);
    }
  }, [isOpen, assessmentId, page, fetchAssessmentSubmissions]);

  const filteredSubmissions = useMemo(() => {
    if (!debouncedSearch.trim()) return assessmentSubmissions;
    const query = debouncedSearch.toLowerCase().trim();
    return assessmentSubmissions.filter((sub) => {
      const student = sub.user || {};
      return (
        (student.name || '').toLowerCase().includes(query) ||
        (student.rollNo || '').toLowerCase().includes(query) ||
        (student.email || '').toLowerCase().includes(query)
      );
    });
  }, [assessmentSubmissions, debouncedSearch]);

  if (!isOpen) return null;

  const formatSeconds = (sec) => {
    const mins = Math.floor((sec || 0) / 60);
    const s = (sec || 0) % 60;
    return `${mins}m ${s}s`;
  };

  const handleExecuteAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);

    try {
      if (confirmAction.type === 'delete') {
        const res = await deleteSubmission(assessmentId, confirmAction.subId);
        if (res.success) {
          toast.success(`Retry submission for ${confirmAction.studentName} deleted successfully`);
        } else {
          toast.error(res.error || 'Failed to delete retry submission');
        }
      } else if (confirmAction.type === 'reappear') {
        const res = await allowStudentReappear(assessmentId, confirmAction.studentId);
        if (res.success) {
          toast.success(`${confirmAction.studentName} can now reappear for this assessment`);
        } else {
          toast.error(res.error || 'Failed to allow student to reappear');
        }
      }
    } catch {
      toast.error('An unexpected error occurred while processing action.');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleAwardCustomPoints = async (e) => {
    e?.preventDefault();
    if (!awardPointsTarget || !awardPointsTarget.studentId) return;
    const num = parseInt(awardAmount, 10);
    if (isNaN(num) || num <= 0) {
      toast.error('Please enter a valid positive points amount');
      return;
    }
    if (!awardTitle.trim()) {
      toast.error('Please enter a reason or title');
      return;
    }

    setAwardingLoading(true);
    try {
      const ok = await awardBonusPoints({
        studentId: awardPointsTarget.studentId,
        amount: num,
        category: 'Assessment',
        title: awardTitle.trim(),
        description:
          awardDesc.trim() ||
          `Custom points awarded for ${assessment?.title || 'assessment'} performance (${awardPointsTarget.score}/${awardPointsTarget.totalPoints} pts, ${awardPointsTarget.percentage}%).`,
      });

      if (ok) {
        toast.success(`Successfully awarded ${num} points to ${awardPointsTarget.studentName}`);
        setAwardPointsTarget(null);
      } else {
        toast.error('Failed to award points');
      }
    } catch (err) {
      toast.error(err.message || 'Error awarding points');
    } finally {
      setAwardingLoading(false);
    }
  };

  return (
    <>
      <ResponsiveModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title={
          <div className="flex items-center justify-between w-full pr-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span>Assessment Submissions Roster</span>
            </div>
            <TutorialButton tutorialId="assessment-submissions" variant="icon" />
          </div>
        }
        description="Manage student submissions, allow retries, and award bonus performance points."
        dialogClassName="sm:max-w-4xl p-6"
      >
        <div className="space-y-4 pt-2">
        {/* Filter Bar */}
        <div className="pt-5 pb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border rounded-2xl focus-within:border-purple-500/40 transition-all flex-1 max-w-sm">
            <Search size={15} className="text-text-muted" />
            <input
              type="text"
              placeholder="Search by student name or roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-xs sm:text-sm text-text-primary focus:outline-none placeholder-slate-600 w-full font-normal"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => exportAssessmentSubmissionsCsv(assessmentId)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Download full assessment report as CSV"
            >
              <Download size={14} className="text-emerald-400" />
              <span>Export all (CSV)</span>
            </button>
            <span className="text-xs font-medium text-text-muted">
              Total submissions: <span className="text-text-primary font-semibold tabular-nums">{filteredSubmissions.length}</span>
            </span>
          </div>
        </div>

        {/* Table / List */}
        <div className="overflow-y-auto custom-scrollbar flex-1 relative z-10">
          {loading ? (
            <div className="py-12 text-center text-xs text-text-muted font-medium flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              <span>Loading student submissions...</span>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs">
              No submissions recorded for this assessment yet.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((sub) => {
                const student = sub.user || {};
                const studentId = student._id || student.id || (typeof sub.user === 'string' ? sub.user : '');
                const studentName = student.name || 'Student';

                return (
                  <div
                    key={sub._id}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-border hover:border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    {/* Student Info */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-semibold text-purple-400 text-xs flex-shrink-0">
                        {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary leading-none">
                          {student.name || 'Unknown Student'}
                        </h4>
                        <p className="text-[11px] text-text-muted font-mono mt-1 tabular-nums">
                          {student.rollNo || 'NO ROLL'} • {student.department || 'Student'}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          Submitted: {formatISTDateTime(sub.createdAt, { showYear: false })}
                        </p>
                      </div>
                    </div>

                    {/* Score, Percentage & Pass Status + Management Actions */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-semibold text-text-primary tabular-nums">
                          {sub.score} / {sub.totalPoints} pts
                        </p>
                        <p className="text-[10px] text-text-muted font-medium tabular-nums">
                          Time: {formatSeconds(sub.timeSpentSeconds)}
                        </p>
                      </div>

                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium tabular-nums flex items-center gap-1.5 border ${
                          sub.passed
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}
                      >
                        {sub.passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        {sub.percentage}%
                      </div>

                      {/* Management Action Buttons */}
                      <div className="flex items-center gap-1.5 ml-2 border-l border-border/80 pl-3">
                        <button
                          type="button"
                          onClick={() => setInspectingSubmission(sub)}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[11px] font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          title="View detailed questions and answers report"
                        >
                          <FileText size={12} className="text-purple-400" />
                          <span>View report</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAwardPointsTarget({
                              studentId,
                              studentName,
                              score: sub.score,
                              totalPoints: sub.totalPoints,
                              percentage: sub.percentage,
                            });
                            setAwardAmount(assessment?.customPoints || 50);
                            setAwardTitle(`Assessment: ${assessment?.title || 'Performance Award'}`);
                            setAwardDesc(
                              `Custom points awarded for ${sub.score}/${sub.totalPoints} pts (${sub.percentage}%).`
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                          title="Award custom points directly to this student"
                        >
                          <Sparkles size={12} className="text-amber-400" />
                          <span className="hidden xs:inline">Award points</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              type: 'reappear',
                              studentId,
                              studentName,
                              subId: sub._id,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/25 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                          title="Reset attempts so this student can reappear cleanly"
                        >
                          <RotateCcw size={12} />
                          <span className="hidden xs:inline">Allow reappear</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              type: 'delete',
                              studentId,
                              studentName,
                              subId: sub._id,
                            })
                          }
                          className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all cursor-pointer shadow-xs"
                          title="Delete this retry attempt"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submissions Pagination */}
        {submissionsPagination && submissionsPagination.totalPages > 1 && (
          <div className="pt-3 border-t border-border flex justify-center flex-shrink-0">
            <Pagination
              pagination={submissionsPagination}
              onPageChange={(p) => setPage(p)}
              onLimitChange={(l) => {
                setPage(1);
                fetchAssessmentSubmissions(assessmentId, { page: 1, limit: l });
              }}
              pageSizeOptions={[10, 25, 50]}
            />
          </div>
        )}

        {/* Confirmation Modal Overlay */}
        <AnimatePresence>
          {confirmAction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="glass p-6 sm:p-7 rounded-3xl border border-border max-w-md w-full text-center space-y-4 shadow-2xl"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
                    confirmAction.type === 'delete'
                      ? 'bg-red-500/15 border-red-500/30 text-red-400'
                      : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                  }`}
                >
                  {confirmAction.type === 'delete' ? (
                    <Trash2 size={22} />
                  ) : (
                    <RotateCcw size={22} />
                  )}
                </div>

                <div>
                  <h3 className="text-base font-semibold text-text-primary tracking-tight">
                    {confirmAction.type === 'delete'
                      ? 'Delete assessment retry?'
                      : 'Allow student to reappear?'}
                  </h3>
                  <p className="text-xs text-text-muted mt-1.5 leading-relaxed font-normal">
                    {confirmAction.type === 'delete'
                      ? `Are you sure you want to delete this retry attempt for ${confirmAction.studentName}? This will permanently remove the record.`
                      : `This will reset all assessment submission locks for ${confirmAction.studentName}, allowing them to retake and reappear for this assessment immediately.`}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setConfirmAction(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary bg-surface-elevated hover:bg-surface-elevated border border-border cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleExecuteAction}
                    className={`px-5 py-2 rounded-xl text-xs font-medium text-white flex items-center gap-2 cursor-pointer shadow-xs transition-all ${
                      confirmAction.type === 'delete'
                        ? 'bg-red-600 hover:bg-red-500'
                        : 'bg-purple-600 hover:bg-purple-500'
                    }`}
                  >
                    {actionLoading && <Loader2 size={13} className="animate-spin" />}
                    <span>
                      {confirmAction.type === 'delete' ? 'Delete retry' : 'Allow reappear'}
                    </span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Award Custom Points Modal Overlay */}
        <AnimatePresence>
          {awardPointsTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="glass p-6 sm:p-7 rounded-3xl border border-border max-w-md w-full space-y-4 shadow-2xl relative"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-text-primary tracking-tight">
                        Award custom points
                      </h3>
                      <p className="text-[11px] text-text-muted">
                        Target:{' '}
                        <span className="text-text-primary font-medium">
                          {awardPointsTarget.studentName}
                        </span>{' '}
                        <span className="tabular-nums">({awardPointsTarget.score}/{awardPointsTarget.totalPoints} pts)</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAwardPointsTarget(null)}
                    className="p-1.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAwardCustomPoints} className="space-y-4 pt-1">
                  {/* Preset Buttons */}
                  <div>
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
                      Select preset or enter custom points
                    </label>
                    <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                      {[25, 50, 75, 100, 150].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAwardAmount(preset)}
                          className={`py-1.5 px-1 rounded-xl text-xs font-medium tabular-nums transition-all cursor-pointer border text-center ${
                            awardAmount === preset
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                              : 'bg-surface-elevated text-text-muted hover:text-text-primary border-border'
                          }`}
                        >
                          +{preset}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-surface-elevated border border-border rounded-xl focus-within:border-amber-500/50">
                      <span className="text-xs font-medium text-amber-400">Points:</span>
                      <input
                        type="number"
                        min="1"
                        max="5000"
                        value={awardAmount}
                        onChange={(e) =>
                          setAwardAmount(Math.max(1, parseInt(e.target.value, 10) || 0))
                        }
                        className="bg-transparent border-none text-sm text-text-primary font-mono font-medium tabular-nums focus:outline-none w-full"
                        required
                      />
                    </div>
                  </div>

                  {/* Title / Reason */}
                  <div>
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
                      Reason or title *
                    </label>
                    <input
                      type="text"
                      value={awardTitle}
                      onChange={(e) => setAwardTitle(e.target.value)}
                      placeholder="e.g. Assessment performance reward"
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-normal"
                      required
                    />
                  </div>

                  {/* Optional Note */}
                  <div>
                    <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
                      Ledger note (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={awardDesc}
                      onChange={(e) => setAwardDesc(e.target.value)}
                      placeholder="Remarks, score detail, or feedback..."
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none font-normal"
                    />
                  </div>

                  {/* Submit / Cancel */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={awardingLoading}
                      onClick={() => setAwardPointsTarget(null)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary bg-surface-elevated hover:bg-surface-elevated border border-border cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={awardingLoading}
                      className="px-5 py-2 rounded-xl text-xs font-medium text-amber-950 bg-amber-400 hover:bg-amber-300 tabular-nums shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                    >
                      {awardingLoading && <Loader2 size={13} className="animate-spin text-amber-950" />}
                      <span>Award {awardAmount} points</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        </div>
      </ResponsiveModal>

      {/* Detailed Report Modal */}
      {inspectingSubmission && (
        <AssessmentSubmissionDetailModal
          isOpen={Boolean(inspectingSubmission)}
          onClose={() => setInspectingSubmission(null)}
          submission={inspectingSubmission}
          assessment={assessment || activeAssessmentDetails}
        />
      )}
    </>
  );
};

export default AssessmentSubmissionsModal;
