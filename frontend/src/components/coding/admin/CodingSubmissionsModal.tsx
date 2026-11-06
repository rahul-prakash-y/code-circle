import ResponsiveModal from '../../ui/ResponsiveModal';
import React, { useState, useEffect, useMemo } from 'react';
import { Button, Spinner } from '@heroui/react';
import {
  X,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  Calendar,
  Code2,
  ShieldAlert,
  Loader2,
  Copy,
  Check,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { formatISTDateTime } from '../../../lib/dateUtils';

interface StudentInfo {
  _id: string;
  name: string;
  email: string;
  rollNo?: string;
  department?: string;
  profilePicUrl?: string;
}

interface IntegrityEvent {
  type: string;
  timestamp: string;
  warningNumber: number;
}

interface TestCaseResult {
  testCaseIndex: number;
  passed: boolean;
  stdout?: string;
  stderr?: string;
  isHidden: boolean;
  executionTimeMs?: number;
}

interface SubmissionItem {
  _id: string;
  student: StudentInfo;
  language: string;
  code: string;
  score: number;
  passed: number;
  total: number;
  status: 'passed' | 'failed' | 'compilation_error' | 'runtime_error' | 'timeout';
  isLocked: boolean;
  results: TestCaseResult[];
  integrityEvents: IntegrityEvent[];
  submittedAt: string;
}

interface CodingSubmissionsModalProps {
  challengeId: string | null;
  challengeTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CodingSubmissionsModal: React.FC<CodingSubmissionsModalProps> = ({
  challengeId,
  challengeTitle,
  isOpen,
  onClose,
}) => {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');

  // Selected submission for code inspection
  const [inspectSubmission, setInspectSubmission] = useState<SubmissionItem | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Reappear / Delete Retry management action states
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'reappear';
    subId?: string;
    studentId?: string;
    studentName?: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const handleExecuteAction = async () => {
    if (!confirmAction || !challengeId) return;
    setActionLoading(true);

    try {
      if (confirmAction.type === 'delete') {
        await api.delete(`/assessments/code/challenges/${challengeId}/submissions/${confirmAction.subId}`);
        setSubmissions((prev) => prev.filter((s) => s._id !== confirmAction.subId));
        toast.success(`Coding retry submission for ${confirmAction.studentName} deleted successfully.`);
      } else if (confirmAction.type === 'reappear') {
        await api.post(`/assessments/code/challenges/${challengeId}/reappear/${confirmAction.studentId}`);
        setSubmissions((prev) => prev.filter((s) => (s.student?._id || s.student) !== confirmAction.studentId));
        toast.success(`${confirmAction.studentName} can now reappear for this challenge.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to process submission action');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  useEffect(() => {
    if (!isOpen || !challengeId) return;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assessments/code/admin/challenges/${challengeId}/submissions`);
        setSubmissions(res.data.data || []);
      } catch (err: any) {
        console.error('Failed to fetch coding submissions:', err);
        toast.error(err.response?.data?.error || 'Failed to load submissions roster');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [isOpen, challengeId]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const student = sub.student || {};
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (student.name || '').toLowerCase().includes(query) ||
        (student.rollNo || '').toLowerCase().includes(query) ||
        (student.email || '').toLowerCase().includes(query) ||
        (sub.language || '').toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'passed' && sub.status === 'passed') ||
        (statusFilter === 'failed' && sub.status !== 'passed');

      return matchesSearch && matchesStatus;
    });
  }, [submissions, search, statusFilter]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const passed = submissions.filter((s) => s.status === 'passed').length;
    const avgScore =
      total > 0
        ? Math.round(submissions.reduce((acc, s) => acc + s.score, 0) / total)
        : 0;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { total, passed, avgScore, passRate };
  }, [submissions]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <ResponsiveModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span>Submissions Roster: {challengeTitle || 'Coding Assessment'}</span>
          </div>
        }
        description="Review student source code, evaluated test cases, and anti-cheating audit trail."
        dialogClassName="sm:max-w-5xl p-6"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-label-secondary font-medium tabular-nums">
              Showing {filteredSubmissions.length} of {submissions.length} submission{submissions.length === 1 ? '' : 's'}
            </span>
            <Button
              type="button"
              variant="flat"
              onPress={onClose}
              className="rounded-xl text-xs font-semibold px-4"
            >
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 shrink-0">
          <div className="p-3.5 rounded-2xl bg-surface-secondary border border-separator/80">
            <span className="text-[11px] font-semibold text-label-secondary uppercase tracking-wider">
              Total Submissions
            </span>
            <p className="text-xl font-bold text-label-primary mt-0.5">{stats.total}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-secondary border border-separator/80">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Passed Students
            </span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats.passed}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-secondary border border-separator/80">
            <span className="text-[11px] font-semibold text-label-secondary uppercase tracking-wider">
              Average Score
            </span>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {stats.avgScore}%
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-secondary border border-separator/80">
            <span className="text-[11px] font-semibold text-label-secondary uppercase tracking-wider">
              Pass Rate
            </span>
            <p className="text-xl font-bold text-label-primary mt-0.5">{stats.passRate}%</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary border border-separator rounded-xl flex-1 max-w-sm">
            <Search size={14} className="text-label-tertiary" />
            <input
              type="text"
              placeholder="Search student, roll no, or language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-xs text-label-primary focus:outline-none placeholder-label-tertiary w-full"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-surface-secondary rounded-xl border border-separator">
            {(['all', 'passed', 'failed'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setStatusFilter(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === mode
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions Table Area */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-separator bg-surface">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
              <p className="text-xs text-label-secondary">Loading submissions roster...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-20 text-center text-xs text-label-secondary">
              No submissions found matching your search.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-separator bg-surface-secondary text-label-secondary font-semibold">
                  <th className="p-3.5 pl-4">Student</th>
                  <th className="p-3.5">Language</th>
                  <th className="p-3.5">Score</th>
                  <th className="p-3.5">Test Cases</th>
                  <th className="p-3.5">Integrity Events</th>
                  <th className="p-3.5">Submitted</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator/60">
                {filteredSubmissions.map((sub) => {
                  const student = sub.student || {};
                  const isPassed = sub.status === 'passed';
                  const integrityCount = sub.integrityEvents?.length || 0;

                  return (
                    <tr
                      key={sub._id}
                      className="hover:bg-surface-secondary/50 transition-colors"
                    >
                      <td className="p-3.5 pl-4">
                        <div className="font-semibold text-label-primary">
                          {student.name || 'Anonymous Student'}
                        </div>
                        <div className="text-[11px] text-label-secondary">
                          {student.rollNo || student.email || 'N/A'}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-surface-secondary border border-separator font-mono text-[11px] font-semibold text-label-secondary uppercase">
                          {sub.language}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isPassed
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isPassed ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{sub.score}%</span>
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-label-secondary">
                        {sub.passed} / {sub.total}
                      </td>

                      <td className="p-3.5">
                        {integrityCount > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            title={`${integrityCount} tab-change / window blur warnings detected`}
                          >
                            <ShieldAlert className="w-3 h-3" />
                            <span>{integrityCount} warning{integrityCount > 1 ? 's' : ''}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-label-tertiary">Clean</span>
                        )}
                      </td>

                      <td className="p-3.5 text-label-secondary text-[11px] font-mono">
                        {formatISTDateTime(sub.submittedAt, { showYear: false })}
                      </td>

                      <td className="p-3.5 pr-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => setInspectSubmission(sub)}
                            className="rounded-xl text-xs font-semibold h-7 px-2.5 bg-surface-secondary hover:bg-surface-raised border border-separator text-label-primary cursor-pointer"
                            startContent={<Code2 className="w-3.5 h-3.5 text-blue-500" />}
                          >
                            <span className="hidden sm:inline">View Code</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="flat"
                            color="secondary"
                            onPress={() => {
                              const sId = student._id || (typeof sub.student === 'string' ? sub.student : (sub as any).userId || (sub as any).studentId || '');
                              setConfirmAction({
                                type: 'reappear',
                                studentId: sId,
                                studentName: student.name || 'Student',
                                subId: sub._id,
                              });
                            }}
                            className="rounded-xl text-xs font-bold h-7 px-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 cursor-pointer"
                            startContent={<RotateCcw className="w-3.5 h-3.5" />}
                            title="Reset attempts so this student can reappear cleanly"
                          >
                            <span className="hidden md:inline">Allow Reappear</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            isIconOnly
                            onPress={() => {
                              const sId = student._id || (typeof sub.student === 'string' ? sub.student : (sub as any).userId || (sub as any).studentId || '');
                              setConfirmAction({
                                type: 'delete',
                                studentId: sId,
                                studentName: student.name || 'Student',
                                subId: sub._id,
                              });
                            }}
                            className="rounded-xl h-7 w-7 min-w-7 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer"
                            title="Delete this retry submission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        </div>
      </ResponsiveModal>

      {/* Code Inspection Modal */}
      <ResponsiveModal
        open={Boolean(inspectSubmission)}
        onOpenChange={(open) => {
          if (!open) setInspectSubmission(null);
        }}
        title={
          <div className="flex items-center justify-between w-full pr-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="truncate">Code Submission: {inspectSubmission?.student?.name || 'Student'}</span>
            </div>
            {inspectSubmission && (
              <Button
                size="sm"
                variant="flat"
                isIconOnly
                onPress={() => handleCopyCode(inspectSubmission.code)}
                title="Copy code"
                className="rounded-xl shrink-0"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </Button>
            )}
          </div>
        }
        description={
          inspectSubmission
            ? `Language: ${inspectSubmission.language.toUpperCase()} • Score: ${inspectSubmission.score}% (${inspectSubmission.passed}/${inspectSubmission.total} test cases)`
            : ''
        }
        dialogClassName="sm:max-w-3xl p-6"
        footer={
          inspectSubmission && (
            <div className="flex items-center justify-between w-full text-xs text-label-secondary font-medium">
              <span>Submitted: {formatISTDateTime(inspectSubmission.submittedAt)}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Passed {inspectSubmission.passed} of {inspectSubmission.total} test cases
              </span>
            </div>
          )
        }
      >
        {inspectSubmission && (
          <div className="my-2 rounded-2xl bg-black/95 border border-separator p-4 overflow-hidden">
            <pre className="font-mono text-xs text-neutral-200 leading-relaxed overflow-x-auto whitespace-pre max-h-[50vh]">
              {inspectSubmission.code}
            </pre>
          </div>
        )}
      </ResponsiveModal>

      {/* Action Confirmation Modal */}
      <ResponsiveModal
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                confirmAction?.type === 'delete'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                  : 'bg-purple-500/15 border-purple-500/30 text-purple-500'
              }`}
            >
              {confirmAction?.type === 'delete' ? (
                <Trash2 size={16} />
              ) : (
                <RotateCcw size={16} />
              )}
            </div>
            <span>
              {confirmAction?.type === 'delete'
                ? 'Delete Coding Retry Submission?'
                : 'Allow Student to Reappear?'}
            </span>
          </div>
        }
        description={
          confirmAction?.type === 'delete'
            ? `Are you sure you want to delete this retry attempt for ${confirmAction.studentName}? This will permanently clear this record.`
            : `This will reset all coding challenge submission locks for ${confirmAction?.studentName}, allowing them to reappear and solve this challenge again.`
        }
        dialogClassName="sm:max-w-md p-6"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              type="button"
              variant="flat"
              isDisabled={actionLoading}
              onPress={() => setConfirmAction(null)}
              className="rounded-xl px-4 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              color={confirmAction?.type === 'delete' ? 'danger' : 'secondary'}
              variant="solid"
              isDisabled={actionLoading}
              isLoading={actionLoading}
              onPress={handleExecuteAction}
              className={`rounded-xl text-xs font-bold shadow-md px-5 cursor-pointer ${
                confirmAction?.type === 'delete'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/25'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/25'
              }`}
            >
              {confirmAction?.type === 'delete' ? 'Yes, Delete Retry' : 'Yes, Allow Reappear'}
            </Button>
          </div>
        }
      >
        <div className="py-2">
          <div className="p-4 rounded-2xl bg-surface-secondary border border-separator space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-label-secondary">Target Student:</p>
            <p className="text-sm font-bold text-label-primary">{confirmAction?.studentName || 'Student'}</p>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
};

export default CodingSubmissionsModal;
