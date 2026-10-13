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
  Calendar,
  Trash2,
  RotateCcw,
  UserCheck,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import useAssessmentStore from '../../store/useAssessmentStore';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

const AssessmentSubmissionsModal = ({ assessmentId, isOpen, onClose }) => {
  const {
    assessmentSubmissions,
    fetchAssessmentSubmissions,
    deleteSubmission,
    allowStudentReappear,
    loading,
  } = useAssessmentStore();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'reappear', subId, studentId, studentName }
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && assessmentId) {
      fetchAssessmentSubmissions(assessmentId);
      setConfirmAction(null);
    }
  }, [isOpen, assessmentId, fetchAssessmentSubmissions]);

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
          toast.success(`Retry submission for ${confirmAction.studentName} deleted successfully.`);
        } else {
          toast.error(res.error || 'Failed to delete retry submission');
        }
      } else if (confirmAction.type === 'reappear') {
        const res = await allowStudentReappear(assessmentId, confirmAction.studentId);
        if (res.success) {
          toast.success(`${confirmAction.studentName} can now reappear for this assessment.`);
        } else {
          toast.error(res.error || 'Failed to allow student to reappear');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred while processing action.');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl my-auto glass border border-border p-6 sm:p-8 relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-6 border-b border-border relative z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-primary tracking-tight">
                Assessment Submissions Roster
              </h2>
              <p className="text-xs text-text-muted">
                Manage student submissions, allow retries / reappear, and delete obsolete attempts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all border border-border cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="pt-5 pb-4 flex items-center justify-between gap-4 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border rounded-2xl focus-within:border-purple-500/40 transition-all flex-1 max-w-sm">
            <Search size={16} className="text-text-muted" />
            <input
              type="text"
              placeholder="Search by student name or roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-xs sm:text-sm text-text-primary focus:outline-none placeholder-slate-600 w-full"
            />
          </div>

          <span className="text-xs font-bold text-text-muted">
            Total Submissions: <span className="text-text-primary font-black">{filteredSubmissions.length}</span>
          </span>
        </div>

        {/* Table / List */}
        <div className="overflow-y-auto custom-scrollbar flex-1 relative z-10">
          {loading ? (
            <div className="py-12 text-center text-xs text-text-muted font-bold flex flex-col items-center gap-3">
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
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-black text-purple-400 text-xs flex-shrink-0">
                        {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text-primary leading-none">
                          {student.name || 'Unknown Student'}
                        </h4>
                        <p className="text-[11px] text-text-muted font-mono mt-1">
                          {student.rollNo || 'NO ROLL'} • {student.department || 'Student'}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          Submitted: {new Date(sub.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Score, Percentage & Pass Status + Management Actions */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-black text-text-primary">
                          {sub.score} / {sub.totalPoints} pts
                        </p>
                        <p className="text-[10px] text-text-muted font-bold">
                          ⏱️ {formatSeconds(sub.timeSpentSeconds)}
                        </p>
                      </div>

                      <div
                        className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border ${
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
                          onClick={() =>
                            setConfirmAction({
                              type: 'reappear',
                              studentId,
                              studentName,
                              subId: sub._id,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/25 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                          title="Reset attempts so this student can reappear cleanly"
                        >
                          <RotateCcw size={12} />
                          <span className="hidden xs:inline">Allow Reappear</span>
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
                          className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all cursor-pointer shadow-sm"
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
                    <Trash2 size={24} />
                  ) : (
                    <RotateCcw size={24} />
                  )}
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-text-primary">
                    {confirmAction.type === 'delete'
                      ? 'Delete Assessment Retry?'
                      : 'Allow Student to Reappear?'}
                  </h3>
                  <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
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
                    className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary bg-surface-elevated hover:bg-surface-elevated border border-border cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleExecuteAction}
                    className={`px-5 py-2 rounded-xl text-xs font-black text-white flex items-center gap-2 cursor-pointer shadow-lg transition-all ${
                      confirmAction.type === 'delete'
                        ? 'bg-red-600 hover:bg-red-500 shadow-red-500/25'
                        : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/25'
                    }`}
                  >
                    {actionLoading && <Loader2 size={13} className="animate-spin" />}
                    <span>
                      {confirmAction.type === 'delete' ? 'Yes, Delete Retry' : 'Yes, Allow Reappear'}
                    </span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AssessmentSubmissionsModal;
