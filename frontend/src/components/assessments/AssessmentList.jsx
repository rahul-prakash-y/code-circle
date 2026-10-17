import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Play,
  Edit3,
  Trash2,
  Users,
  Search,
  Calendar,
  RotateCcw,
  LayoutGrid,
  List,
  FileSpreadsheet,
  Sparkles,
  Layers,
  HelpCircle,
  X,
  Zap,
} from 'lucide-react';
import useAssessmentStore from '../../store/useAssessmentStore';
import useAuthStore from '../../store/useAuthStore';
import useProfileStore from '../../store/useProfileStore';
import toast from 'react-hot-toast';
import TakeAssessmentModal from './TakeAssessmentModal';
import AssessmentEditorModal from './AssessmentEditorModal';
import AssessmentSubmissionsModal from './AssessmentSubmissionsModal';
import McqBulkUploadModal from './McqBulkUploadModal';
import { useDebounce } from '../../hooks/useDebounce';
import Pagination from '../common/Pagination';

const categories = ['All', 'Technical', 'Web Development', 'Algorithms', 'General', 'System Design'];

export const AssessmentList = () => {
  const {
    assessments,
    assessmentsPagination,
    loading,
    fetchAssessments,
    deleteAssessment,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    resetMySubmission,
  } = useAssessmentStore();

  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const isAdmin =
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty' ||
    profile?.role === 'Committee' ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin';

  const [selectedAssessmentToTake, setSelectedAssessmentToTake] = useState(null);
  const [assessmentToEdit, setAssessmentToEdit] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [submissionsAssessmentId, setSubmissionsAssessmentId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [resettingId, setResettingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    fetchAssessments({ page, category: selectedCategory, search: debouncedSearch });
  }, [fetchAssessments, page]);

  useEffect(() => {
    setPage(1);
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to permanently delete the assessment "${title}"?`)) {
      const res = await deleteAssessment(id);
      if (res.success) {
        toast.success('Assessment deleted successfully');
      } else {
        toast.error(res.error || 'Failed to delete assessment');
      }
    }
  };

  const handleOpenCreate = () => {
    setAssessmentToEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (assessment) => {
    setAssessmentToEdit(assessment);
    setIsEditorOpen(true);
  };

  const handleResetAndReappear = async (assessment) => {
    if (!assessment?._id) return;
    setResettingId(assessment._id);
    try {
      const res = await resetMySubmission(assessment._id);
      if (res.success) {
        toast.success('Previous attempt reset! Reappearing for assessment...');
        setSelectedAssessmentToTake(assessment);
      } else {
        toast.error(res.error || 'Failed to reset retry attempt');
      }
    } catch {
      toast.error('Failed to reset assessment retry');
    } finally {
      setResettingId(null);
    }
  };

  const totalQuestions = assessments.reduce(
    (acc, a) => acc + (a.questionsCount || a.questions?.length || 0),
    0
  );
  const myCompletedCount = assessments.filter((a) => Boolean(a.mySubmission)).length;

  const getCategoryCount = (cat) => {
    if (cat === 'All') return assessments.length;
    return assessments.filter((a) => a.category === cat).length;
  };

  return (
    <div className="space-y-6">
      {/* ── FLAGSHIP SHOWCASE HERO BANNER ───────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-9 border transition-all duration-300 bg-gradient-to-br from-white via-purple-50/40 to-indigo-50/50 dark:from-[#110e20] dark:via-[#0c0e1e] dark:to-[#080911] border-purple-200/70 dark:border-white/[0.08] shadow-[0_12px_40px_-10px_rgba(99,102,241,0.08)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]">
        {/* Ambient Glow Orbs & Subtle Micro-Grid */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-purple-500/25 via-indigo-500/15 to-transparent blur-3xl opacity-75 dark:opacity-40" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-fuchsia-500/15 via-blue-500/10 to-transparent blur-3xl opacity-60 dark:opacity-30" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(120,119,198,0.12)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          {/* Left Column: Heading & Editorial */}
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 shadow-xs backdrop-blur-md">
              <Sparkles size={12} className="text-amber-500" />
              <span>Adaptive Evaluation Engine</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-heading leading-tight">
              Conceptual Mastery &{' '}
              <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 dark:from-purple-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent">
                MCQ Assessments
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              Evaluate competitive logic, master core architecture, and benchmark technical comprehension with timed challenges, automated scoring, and real-time retakes.
            </p>
          </div>

          {/* Right Column: Live Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 sm:gap-3.5 shrink-0 w-full lg:w-auto">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-purple-200/60 dark:border-white/[0.08] backdrop-blur-md shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <Award size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {loading ? '—' : assessments.length}
                </p>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Assessments
                </p>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-indigo-200/60 dark:border-white/[0.08] backdrop-blur-md shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <HelpCircle size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {loading ? '—' : `${totalQuestions}+`}
                </p>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Questions
                </p>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-blue-200/60 dark:border-white/[0.08] backdrop-blur-md shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Layers size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {categories.length - 1}
                </p>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tracks
                </p>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-emerald-200/60 dark:border-white/[0.08] backdrop-blur-md shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {myCompletedCount}
                </p>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Completed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH, ACTION CONTROLS & CATEGORY TRACKS BAR ────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-raised border border-border shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
          {/* Apple-style Search Input with clear button */}
          <div className="relative flex-1 max-w-md">
            <div className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 bg-surface-secondary border border-border hover:border-purple-500/40 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/15 rounded-xl sm:rounded-2xl transition-all shadow-inner">
              <Search size={15} className="text-text-muted shrink-0" />
              <input
                type="text"
                placeholder="Search assessments by title, track, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-xs text-text-primary focus:outline-none placeholder-text-muted/70 w-full"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-text-muted hover:text-text-primary transition-all cursor-pointer"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons & View Mode Controls */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* View Mode Toggle Pill */}
            <div className="flex items-center gap-1 p-1 bg-surface-secondary border border-border rounded-xl shrink-0 shadow-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="Table View"
                aria-label="Table View"
              >
                <List size={14} />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBulkUploadOpen(true)}
                  className="py-2 px-3.5 sm:px-4 text-xs font-bold flex items-center gap-2 rounded-xl sm:rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer shadow-xs shrink-0 active:scale-95"
                  title="Bulk Upload MCQ Assessments from Excel"
                >
                  <FileSpreadsheet size={15} className="text-emerald-500 shrink-0" />
                  <span className="hidden sm:inline">Bulk Upload (Excel)</span>
                  <span className="sm:hidden">Bulk</span>
                </button>

                <button
                  onClick={handleOpenCreate}
                  className="py-2 px-4 sm:px-5 text-xs font-bold flex items-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:brightness-110 text-white shadow-md shadow-purple-500/25 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Create Assessment</span>
                  <span className="sm:hidden">Create</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter Pills with counts */}
        <div className="flex items-center gap-1.5 sm:gap-2 pt-3 border-t border-border overflow-x-auto custom-scrollbar">
          {categories.map((cat) => {
            const count = getCategoryCount(cat);
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl sm:rounded-full text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/20'
                    : 'bg-surface-secondary text-text-muted hover:text-text-primary hover:bg-surface border border-border'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 dark:bg-white/10 text-text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assessment Content View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass p-6 animate-pulse space-y-4 rounded-3xl">
              <div className="h-6 bg-surface-elevated rounded-lg w-2/3" />
              <div className="h-4 bg-surface-elevated rounded-lg w-full" />
              <div className="h-10 bg-surface-elevated rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <div className="glass p-14 text-center space-y-4 rounded-3xl border border-border">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Award size={32} />
          </div>
          <h3 className="text-lg font-bold text-text-primary">No Assessments Found</h3>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'No assessments match your active filter criteria. Try resetting filters.'
              : 'There are currently no active MCQ assessments published. Check back soon!'}
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="btn-primary py-2 px-5 text-xs font-bold inline-flex items-center gap-1.5 mt-2 cursor-pointer"
            >
              <Plus size={15} /> Create First Assessment
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View with popLayout AnimatePresence */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {assessments.map((assessment) => {
              const mySub = assessment.mySubmission;
              const hasTaken = Boolean(mySub);
              const isPassed = mySub?.passed;

              return (
                <motion.div
                  key={assessment._id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.25 }}
                  className="glass p-4 sm:p-7 flex flex-col justify-between group hover:border-purple-500/35 transition-all duration-300 relative overflow-hidden rounded-2xl sm:rounded-3xl"
                >
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                          {assessment.category}
                        </span>

                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center gap-1">
                          <Award size={11} className="text-amber-500" />
                          <span>+{assessment.customPoints ?? 50} pts</span>
                        </span>

                        {assessment.eventId && (
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center gap-1">
                            <Calendar size={11} />
                            {assessment.eventId.title || 'Linked Event'}
                          </span>
                        )}

                        {!assessment.isPublished && (
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            Draft / Hidden
                          </span>
                        )}
                      </div>

                      {hasTaken && (
                        <div
                          className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full border shrink-0 ${
                            isPassed
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}
                        >
                          {isPassed ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                          {isPassed ? `Passed: ${mySub.percentage}%` : `Score: ${mySub.percentage}%`}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-text-primary group-hover:text-purple-300 transition-colors font-heading">
                        {assessment.title}
                      </h3>
                      <p className="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">
                        {assessment.description || 'Test conceptual clarity and competitive aptitude.'}
                      </p>
                    </div>

                    {/* Meta Stats Row */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-3 py-2.5 sm:py-3 border-y border-border/60 text-center">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-surface-elevated/40">
                        <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-text-muted">Questions</p>
                        <p className="text-xs sm:text-sm font-bold text-text-primary mt-0.5">
                          {assessment.questionsCount || assessment.questions?.length || 0} MCQs
                        </p>
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-surface-elevated/40">
                        <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-text-muted">Time Limit</p>
                        <p className="text-xs sm:text-sm font-bold text-text-primary mt-0.5 flex items-center justify-center gap-1">
                          <Clock size={11} className="text-purple-400 sm:w-3 sm:h-3" />
                          {assessment.timeLimitMinutes}m
                        </p>
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-surface-elevated/40">
                        <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-text-muted">Pass Cutoff</p>
                        <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">
                          {assessment.passingScorePercentage}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 sm:mt-5 pt-2 flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(assessment)}
                            className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all border border-border cursor-pointer"
                            title="Edit Assessment & Questions"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setSubmissionsAssessmentId(assessment._id)}
                            className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated text-text-muted hover:text-purple-300 transition-all border border-border cursor-pointer"
                            title="View Student Submissions"
                          >
                            <Users size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(assessment._id, assessment.title)}
                            className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-all border border-red-500/10 cursor-pointer"
                            title="Delete Assessment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {hasTaken && (
                        <button
                          type="button"
                          disabled={resettingId === assessment._id}
                          onClick={() => handleResetAndReappear(assessment)}
                          className="py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25"
                          title="Delete previous retry and reappear fresh"
                        >
                          <RotateCcw size={12} className={resettingId === assessment._id ? 'animate-spin' : ''} />
                          Reappear
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedAssessmentToTake(assessment)}
                        className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          hasTaken
                            ? 'bg-surface-elevated hover:bg-surface-elevated text-text-primary border border-border'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-500/25'
                        }`}
                      >
                        {hasTaken ? (
                          <>
                            <RotateCcw size={13} />
                            Retake
                          </>
                        ) : (
                          <>
                            <Play size={13} />
                            Take Challenge
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Data Table View with AnimatePresence and inline hover action buttons */
        <div className="glass overflow-hidden border-border/80 rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-elevated/60 border-b border-border/60">
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Assessment</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Questions & Cutoff</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Duration</th>
                  <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {assessments.map((assessment) => {
                    const mySub = assessment.mySubmission;
                    const hasTaken = Boolean(mySub);
                    return (
                      <motion.tr
                        key={assessment._id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10, transition: { duration: 0.25 } }}
                        transition={{ duration: 0.2 }}
                        className="group border-b border-border/40 even:bg-surface-elevated/25 odd:bg-transparent hover:bg-purple-500/5 transition-colors"
                      >
                        {/* Title & Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
                              <Award size={18} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-text-primary truncate font-heading group-hover:text-purple-300 transition-colors">
                                {assessment.title}
                              </h4>
                              <p className="text-xs text-text-muted truncate mt-0.5">
                                {assessment.description || 'MCQ skill challenge'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category & Points */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              {assessment.category}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500">
                              <Award size={10} /> +{assessment.customPoints ?? 50} pts
                            </span>
                          </div>
                        </td>

                        {/* Questions & Cutoff */}
                        <td className="px-6 py-4 text-xs font-semibold text-text-secondary">
                          <span>{assessment.questionsCount || assessment.questions?.length || 0} MCQs</span>
                          <span className="text-text-muted mx-1.5">•</span>
                          <span className="text-emerald-400 font-bold">{assessment.passingScorePercentage}% pass</span>
                        </td>

                        {/* Duration */}
                        <td className="px-6 py-4 text-xs font-semibold text-text-secondary whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-purple-400" />
                            {assessment.timeLimitMinutes} min
                          </span>
                        </td>

                        {/* Actions - fade in on hover */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(assessment)}
                                  className="p-2 rounded-xl bg-surface-elevated text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-all cursor-pointer"
                                  title="Edit Assessment"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => setSubmissionsAssessmentId(assessment._id)}
                                  className="p-2 rounded-xl bg-surface-elevated text-text-muted hover:text-purple-300 hover:bg-surface-elevated transition-all cursor-pointer"
                                  title="View Submissions"
                                >
                                  <Users size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(assessment._id, assessment.title)}
                                  className="p-2 rounded-xl bg-surface-elevated text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                  title="Delete Assessment"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}

                            {hasTaken && (
                              <button
                                type="button"
                                disabled={resettingId === assessment._id}
                                onClick={() => handleResetAndReappear(assessment)}
                                className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 cursor-pointer flex items-center gap-1 transition-all"
                                title="Delete previous retry and reappear fresh"
                              >
                                <RotateCcw size={11} className={resettingId === assessment._id ? 'animate-spin' : ''} />
                                Reappear
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedAssessmentToTake(assessment)}
                              className="btn-primary py-1.5 px-3 text-xs font-bold bg-purple-600 hover:bg-purple-500 cursor-pointer"
                            >
                              {hasTaken ? 'Retake' : 'Start'}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {assessmentsPagination && assessmentsPagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            pagination={assessmentsPagination}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setPage(1);
              fetchAssessments({ page: 1, limit: l, category: selectedCategory, search: debouncedSearch });
            }}
            pageSizeOptions={[12, 24, 48]}
          />
        </div>
      )}

      {/* Modals */}
      {selectedAssessmentToTake && (
        <TakeAssessmentModal
          assessmentId={selectedAssessmentToTake._id}
          isOpen={Boolean(selectedAssessmentToTake)}
          onClose={() => setSelectedAssessmentToTake(null)}
        />
      )}

      {isEditorOpen && (
        <AssessmentEditorModal
          isOpen={isEditorOpen}
          assessmentToEdit={assessmentToEdit}
          onClose={() => setIsEditorOpen(false)}
        />
      )}

      {submissionsAssessmentId && (
        <AssessmentSubmissionsModal
          assessmentId={submissionsAssessmentId}
          assessment={assessments.find((a) => a._id === submissionsAssessmentId)}
          isOpen={Boolean(submissionsAssessmentId)}
          onClose={() => setSubmissionsAssessmentId(null)}
        />
      )}

      {isBulkUploadOpen && (
        <McqBulkUploadModal
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
          onSuccess={() => fetchAssessments()}
        />
      )}
    </div>
  );
};

export default AssessmentList;
