import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-5xl my-auto bg-surface border border-separator rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-5 border-b border-separator shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-label-primary tracking-tight">
                Submissions Roster: {challengeTitle || 'Coding Assessment'}
              </h2>
              <p className="text-xs text-label-secondary">
                Review student source code, evaluated test cases, and anti-cheating audit trail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-label-secondary hover:text-label-primary hover:bg-surface-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

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

                      <td className="p-3.5 text-label-secondary text-[11px]">
                        {new Date(sub.submittedAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="p-3.5 pr-4 text-right">
                        <button
                          onClick={() => setInspectSubmission(sub)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-surface-secondary hover:bg-surface-raised border border-separator text-label-primary transition-all shadow-sm"
                        >
                          <Code2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>View Code</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Code Inspection Modal */}
        {inspectSubmission && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Code Submission: {inspectSubmission.student?.name || 'Student'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Language: <span className="text-blue-400 font-mono uppercase">{inspectSubmission.language}</span> • Score: {inspectSubmission.score}% ({inspectSubmission.passed}/{inspectSubmission.total} test cases)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(inspectSubmission.code)}
                    className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                    title="Copy Code"
                  >
                    {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={() => setInspectSubmission(null)}
                    className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Code display */}
              <div className="flex-1 overflow-y-auto my-4 rounded-2xl bg-black border border-neutral-800 p-4">
                <pre className="font-mono text-xs text-neutral-200 leading-relaxed overflow-x-auto whitespace-pre">
                  {inspectSubmission.code}
                </pre>
              </div>

              {/* Test Cases Results Detail */}
              <div className="shrink-0 pt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                <span>
                  Submitted on {new Date(inspectSubmission.submittedAt).toLocaleString()}
                </span>
                <span className="font-mono text-emerald-400">
                  Passed {inspectSubmission.passed} of {inspectSubmission.total} Cases
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingSubmissionsModal;
