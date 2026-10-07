import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Loader2,
  Plus,
  Edit3,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import useAuthStore from '../../store/useAuthStore';
import CodingChallengeEditorModal from './admin/CodingChallengeEditorModal';
import CodingSubmissionsModal from './admin/CodingSubmissionsModal';

interface StudentSubmissionInfo {
  score: number;
  passed: number;
  total: number;
  status: string;
  submittedAt: string;
  isLocked: boolean;
}

interface CodingChallengeItem {
  _id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  allowedLanguages: string[];
  timeLimitMinutes: number;
  isPublished?: boolean;
  createdAt: string;
  submission?: StudentSubmissionInfo | null;
  // Admin aggregated metrics
  totalSubmissions?: number;
  passedSubmissions?: number;
  passRate?: number;
  avgScore?: number;
  testCasesCount?: number;
}

export const CodingChallengeList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isAdmin =
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin' ||
    user?.role === 'Faculty' ||
    user?.role === 'Committee';

  const [challenges, setChallenges] = useState<CodingChallengeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  // Modals state
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editingChallengeId, setEditingChallengeId] = useState<string | null>(null);

  const [submissionsModalOpen, setSubmissionsModalOpen] = useState<boolean>(false);
  const [submissionsChallengeId, setSubmissionsChallengeId] = useState<string | null>(null);
  const [submissionsChallengeTitle, setSubmissionsChallengeTitle] = useState<string>('');

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = isAdmin
        ? '/assessments/code/admin/challenges'
        : '/assessments/code/challenges';

      const res = await api.get(endpoint);
      setChallenges(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch coding challenges:', err);
      setError(err.response?.data?.error || err.message || 'Unable to load coding challenges');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" and all its student submissions?`)) {
      return;
    }

    try {
      await api.delete(`/assessments/code/admin/challenges/${id}`);
      toast.success('Coding challenge deleted successfully');
      fetchChallenges();
    } catch (err: any) {
      console.error('Failed to delete challenge:', err);
      toast.error(err.response?.data?.error || 'Failed to delete challenge');
    }
  };

  const handleOpenCreate = () => {
    setEditingChallengeId(null);
    setEditorOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    setEditingChallengeId(id);
    setEditorOpen(true);
  };

  const handleOpenSubmissions = (id: string, title: string) => {
    setSubmissionsChallengeId(id);
    setSubmissionsChallengeTitle(title);
    setSubmissionsModalOpen(true);
  };

  const filteredChallenges = challenges.filter((c) => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.difficulty.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Action / Search Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary border border-separator rounded-full flex-1 max-w-md shadow-sm">
          <Search size={15} className="text-label-tertiary" />
          <input
            type="text"
            placeholder="Search problems by title, difficulty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-label-primary focus:outline-none placeholder-label-tertiary w-full"
          />
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-accent hover:bg-accent-hover text-white transition-all shadow-md shadow-accent/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Create Coding Challenge</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-medium text-label-secondary">
            Loading Live Coding Assessments...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive text-center">
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className="py-20 text-center space-y-3 p-8 rounded-3xl border border-separator bg-surface">
          <Code2 className="w-12 h-12 mx-auto text-label-tertiary" />
          <h3 className="text-base font-semibold text-label-primary">
            No Coding Challenges Found
          </h3>
          <p className="text-xs text-label-secondary max-w-sm mx-auto">
            {isAdmin
              ? 'Click "Create Coding Challenge" to launch a new sandboxed programming track.'
              : 'No live programming assessments are scheduled right now.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChallenges.map((challenge) => {
            const hasSubmission = Boolean(challenge.submission);
            const isPassed = challenge.submission?.status === 'passed';
            const submissionScore = challenge.submission?.score;

            return (
              <div
                key={challenge._id}
                className="group relative rounded-3xl p-6 bg-surface border border-separator hover:border-accent/40 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          challenge.difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : challenge.difficulty === 'Hard'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {challenge.difficulty}
                      </span>

                      {/* Admin status tag */}
                      {isAdmin && challenge.isPublished === false && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-500/10 text-neutral-500 border border-neutral-500/20">
                          Draft
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-label-secondary">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{challenge.timeLimitMinutes || 45} mins</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-label-primary group-hover:text-accent transition-colors tracking-tight">
                      {challenge.title}
                    </h3>
                    <p className="text-xs text-label-secondary mt-1.5 line-clamp-3 leading-relaxed">
                      {challenge.description}
                    </p>
                  </div>

                  {/* Supported Languages */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-label-tertiary">
                      Languages
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {challenge.allowedLanguages.map((lang) => (
                        <span
                          key={lang}
                          className="px-2 py-0.5 rounded-lg bg-surface-secondary border border-separator text-[11px] font-mono font-medium text-label-secondary"
                        >
                          {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JS' : lang.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Student Submission Status Badge (Student View) */}
                  {!isAdmin && hasSubmission && (
                    <div className="p-3 rounded-2xl bg-surface-secondary border border-separator/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                        <span className="text-xs font-semibold text-label-primary">
                          {isPassed ? 'Solved' : 'Attempted'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-label-primary">
                        Score: {submissionScore}%
                      </span>
                    </div>
                  )}

                  {/* Admin Metrics Summary (Admin View) */}
                  {isAdmin && (
                    <div className="p-3 rounded-2xl bg-surface-secondary border border-separator/80 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-[10px] font-medium text-label-tertiary uppercase">Submissions</span>
                        <p className="text-xs font-bold text-label-primary mt-0.5">
                          {challenge.totalSubmissions ?? 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-label-tertiary uppercase">Pass Rate</span>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {challenge.passRate ?? 0}%
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-label-tertiary uppercase">Avg Score</span>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                          {challenge.avgScore ?? 0}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-5 mt-4 border-t border-separator/60 flex items-center justify-between gap-2">
                  {isAdmin ? (
                    /* Admin Actions */
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenSubmissions(challenge._id, challenge.title)}
                          title="View Student Submissions"
                          className="p-2 rounded-xl bg-surface-secondary hover:bg-surface-raised border border-separator text-blue-500 transition-colors"
                        >
                          <Users size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(challenge._id)}
                          title="Edit Challenge"
                          className="p-2 rounded-xl bg-surface-secondary hover:bg-surface-raised border border-separator text-label-secondary hover:text-label-primary transition-colors"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(challenge._id, challenge.title)}
                          title="Delete Challenge"
                          className="p-2 rounded-xl bg-surface-secondary hover:bg-surface-raised border border-separator text-destructive transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <button
                        onClick={() => navigate(`/assessments/code/${challenge._id}`)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-accent hover:bg-accent-hover text-white transition-all shadow-sm"
                      >
                        <span>Workspace</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  ) : (
                    /* Student Action */
                    <>
                      <div className="flex items-center gap-1.5 text-[11px] text-label-secondary font-medium">
                        <Shield className="w-3.5 h-3.5 text-blue-500" />
                        <span>Sandboxed</span>
                      </div>

                      <button
                        onClick={() => navigate(`/assessments/code/${challenge._id}`)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-accent hover:bg-accent-hover text-white transition-all shadow-sm group-hover:shadow group-hover:translate-x-0.5"
                      >
                        <span>
                          {hasSubmission && challenge.submission?.isLocked
                            ? 'View Workspace (Locked)'
                            : hasSubmission
                            ? 'Resume Assessment'
                            : 'Start Assessment'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Challenge Editor Modal */}
      {editorOpen && (
        <CodingChallengeEditorModal
          challengeId={editingChallengeId}
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSuccess={fetchChallenges}
        />
      )}

      {/* Admin Submissions Roster Modal */}
      {submissionsModalOpen && (
        <CodingSubmissionsModal
          challengeId={submissionsChallengeId}
          challengeTitle={submissionsChallengeTitle}
          isOpen={submissionsModalOpen}
          onClose={() => setSubmissionsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CodingChallengeList;
