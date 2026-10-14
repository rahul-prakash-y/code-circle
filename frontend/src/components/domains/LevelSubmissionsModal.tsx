import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  Terminal,
  Award,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  Filter,
  User,
  GraduationCap,
  Sparkles,
  FileCode,
  AlertTriangle,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'react-hot-toast';
import { ILevel } from '../../types/domain';

interface LevelSubmissionsModalProps {
  isOpen: boolean;
  level: ILevel;
  onClose: () => void;
}

interface StudentSubmissionRecord {
  student: {
    _id: string;
    name: string;
    email: string;
    rollNo: string;
    department: string;
    avatar?: string;
  };
  levelCompleted: boolean;
  questCompleted: boolean;
  sessions: any[];
  submissions: {
    challengeTitle: string;
    language: string;
    code: string;
    status: string;
    score: number;
    passed: number;
    total: number;
    submittedAt?: string;
    details?: any;
  }[];
  bestScore: number;
  verdict: 'passed' | 'failed' | 'in_progress' | 'unattempted';
  totalAttempts: number;
  lastActivityAt: string;
}

export const LevelSubmissionsModal: React.FC<LevelSubmissionsModalProps> = ({
  isOpen,
  level,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentSubmissionRecord[]>([]);
  const [passedCount, setPassedCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [search, setSearch] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<'all' | 'passed' | 'failed' | 'in_progress'>('all');
  
  // Selected student submission for detailed code inspection
  const [inspectingStudent, setInspectingStudent] = useState<StudentSubmissionRecord | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const fetchSubmissions = async () => {
    if (!level?._id) return;
    setLoading(true);
    try {
      const res = await api.get(`/levels/${level._id}/submissions`);
      if (res.data.success) {
        setStudents(res.data.students || []);
        setPassedCount(res.data.passedCount || 0);
        setTotalStudents(res.data.totalStudents || 0);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch level submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && level?._id) {
      fetchSubmissions();
    }
  }, [isOpen, level?._id]);

  if (!isOpen) return null;

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student?.rollNo?.toLowerCase().includes(search.toLowerCase()) ||
      s.student?.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.student?.department?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (verdictFilter === 'all') return true;
    if (verdictFilter === 'passed') return s.verdict === 'passed' || s.levelCompleted;
    if (verdictFilter === 'failed') return s.verdict === 'failed' && !s.levelCompleted;
    if (verdictFilter === 'in_progress') return s.verdict === 'in_progress';
    return true;
  });

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-surface rounded-3xl border border-separator shadow-2xl overflow-hidden"
      >
        {/* Header Banner */}
        <div className="p-5 sm:p-6 border-b border-separator flex items-center justify-between gap-4 bg-surface-raised shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent border border-accent/25">
                Level {level.levelNumber}
              </span>
              <span className="text-xs text-label-tertiary">Course Level Submissions Ledger</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-label-primary tracking-tight mt-1 truncate">
              {level.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSubmissions}
              disabled={loading}
              className="p-2 text-label-secondary hover:text-label-primary bg-surface hover:bg-surface-raised border border-separator rounded-xl transition-all"
              title="Refresh submissions"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-label-tertiary hover:text-label-primary bg-surface hover:bg-surface-raised border border-separator rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 border-b border-separator bg-surface shrink-0">
          <div className="p-3 bg-surface-raised rounded-2xl border border-separator/80">
            <p className="text-[10px] uppercase font-bold text-label-secondary tracking-wider">
              Total Students
            </p>
            <p className="text-xl sm:text-2xl font-black text-label-primary mt-0.5">
              {totalStudents}
            </p>
          </div>

          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
              Passed Students
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {passedCount}
            </p>
          </div>

          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
              Pass Rate
            </p>
            <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {totalStudents > 0 ? `${Math.round((passedCount / totalStudents) * 100)}%` : '0%'}
            </p>
          </div>

          <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
            <p className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">
              Points Available
            </p>
            <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
              {level.points || 50} pts
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-separator bg-surface-raised flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3.5 top-3 text-label-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, roll no, department..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'passed', 'failed', 'in_progress'] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setVerdictFilter(filterKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                  verdictFilter === filterKey
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface border border-separator text-label-secondary hover:text-label-primary'
                }`}
              >
                {filterKey === 'all' ? `All (${students.length})` : filterKey.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-18 bg-surface-raised rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <GraduationCap className="w-12 h-12 mx-auto text-label-tertiary stroke-1 opacity-60" />
              <h3 className="text-base font-bold text-label-primary">No Student Submissions Found</h3>
              <p className="text-xs text-label-tertiary max-w-sm mx-auto">
                {search
                  ? 'No submissions matched your search query. Try clearing filters.'
                  : 'Students have not submitted any quests or coding challenges for this level yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredStudents.map((rec) => {
                const isPassed = rec.verdict === 'passed' || rec.levelCompleted;
                const isFailed = rec.verdict === 'failed' && !rec.levelCompleted;
                const hasCode = rec.submissions && rec.submissions.length > 0;

                return (
                  <div
                    key={rec.student._id}
                    className="p-4 bg-surface rounded-2xl border border-separator hover:border-separator-focus transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                  >
                    {/* Student Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-xs uppercase shrink-0">
                        {rec.student.avatar ? (
                          <img
                            src={rec.student.avatar}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          rec.student.name.slice(0, 2)
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-label-primary truncate">
                            {rec.student.name}
                          </h4>
                          {rec.student.rollNo && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-surface-raised border border-separator text-label-secondary font-medium">
                              {rec.student.rollNo}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-label-tertiary mt-0.5">
                          <span>{rec.student.email}</span>
                          {rec.student.department && (
                            <>
                              <span>•</span>
                              <span>{rec.student.department}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Submissions & Verdict Badges */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      {/* Quest Status */}
                      {rec.questCompleted && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Quest Done
                        </span>
                      )}

                      {/* Best Score */}
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-raised border border-separator text-label-primary">
                        Score: {rec.bestScore} pts
                      </span>

                      {/* Verdict Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                          isPassed
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : isFailed
                            ? 'bg-destructive/15 text-destructive border border-destructive/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {isPassed ? (
                          <>
                            <CheckCircle2 size={13} /> Passed
                          </>
                        ) : isFailed ? (
                          <>
                            <XCircle size={13} /> Failed
                          </>
                        ) : (
                          <>
                            <Clock size={13} /> In Progress
                          </>
                        )}
                      </span>

                      {/* Code Viewer Action */}
                      {hasCode && (
                        <button
                          onClick={() => {
                            setInspectingStudent(rec);
                            setActiveCodeTab(0);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent/90 shadow-sm shadow-accent/20 transition-all flex items-center gap-1.5"
                        >
                          <Code2 size={14} />
                          <span>View Code ({rec.submissions.length})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Footer Note */}
        <div className="p-4 border-t border-separator bg-surface-raised text-center text-xs text-label-tertiary shrink-0">
          Admin Level Inspector · Viewing {filteredStudents.length} of {totalStudents} student record(s)
        </div>
      </motion.div>

      {/* Code Inspector Sub-Modal */}
      <AnimatePresence>
        {inspectingStudent && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-950 text-white rounded-3xl border border-white/10 shadow-2xl overflow-hidden font-sans"
            >
              {/* Code Inspector Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between gap-4 bg-slate-900/60 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/20 text-primary">
                    <FileCode size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>{inspectingStudent.student.name}</span>
                      {inspectingStudent.student.rollNo && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/70">
                          {inspectingStudent.student.rollNo}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-white/60">
                      Level {level.levelNumber}: {level.title} · Coding Solution
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setInspectingStudent(null)}
                  className="p-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Multiple Submissions Selector Tabs */}
              {inspectingStudent.submissions.length > 1 && (
                <div className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900/40 border-b border-white/10 overflow-x-auto shrink-0">
                  {inspectingStudent.submissions.map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveCodeTab(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        activeCodeTab === idx
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      Attempt #{idx + 1} ({sub.language}) - {sub.status}
                    </button>
                  ))}
                </div>
              )}

              {/* Code Inspector Body */}
              {(() => {
                const activeSub = inspectingStudent.submissions[activeCodeTab] || inspectingStudent.submissions[0];
                if (!activeSub) return null;

                return (
                  <div className="flex-1 overflow-y-auto flex flex-col p-5 space-y-4">
                    {/* Execution Metrics Banner */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[10px] text-white/50 uppercase font-mono">Language</span>
                        <p className="text-xs font-bold text-primary uppercase font-mono mt-0.5">
                          {activeSub.language || 'python'}
                        </p>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[10px] text-white/50 uppercase font-mono">Verdict</span>
                        <p
                          className={`text-xs font-bold uppercase font-mono mt-0.5 ${
                            activeSub.status === 'passed'
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {activeSub.status}
                        </p>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[10px] text-white/50 uppercase font-mono">Test Cases</span>
                        <p className="text-xs font-bold text-white font-mono mt-0.5">
                          {activeSub.passed} / {activeSub.total || 0} passed
                        </p>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-[10px] text-white/50 uppercase font-mono">Score Awarded</span>
                        <p className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                          +{activeSub.score} pts
                        </p>
                      </div>
                    </div>

                    {/* Source Code Container */}
                    <div className="relative rounded-2xl bg-black/60 border border-white/15 overflow-hidden flex-1 flex flex-col min-h-[300px]">
                      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-xs text-white/60 font-mono">
                        <span>source_code.{activeSub.language === 'python' ? 'py' : activeSub.language === 'cpp' ? 'cpp' : activeSub.language === 'java' ? 'java' : 'js'}</span>
                        <button
                          onClick={() => handleCopyCode(activeSub.code)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <pre className="p-4 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto flex-1 select-text selection:bg-primary/30">
                        <code>{activeSub.code || '// No code submitted in this attempt'}</code>
                      </pre>
                    </div>

                    {/* Error diagnostics if any */}
                    {activeSub.details?.error && (
                      <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-rose-300 text-xs font-mono space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-400">
                          <AlertTriangle size={14} />
                          <span>Compiler / Runtime Diagnostics:</span>
                        </div>
                        <pre className="whitespace-pre-wrap">{activeSub.details.error}</pre>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LevelSubmissionsModal;
