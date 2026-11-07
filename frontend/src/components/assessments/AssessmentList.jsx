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
import { DelayedSkeleton, CardGridSkeleton, EmptyState, NoSearchResults } from '../states';
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
  }, [fetchAssessments, page, selectedCategory, debouncedSearch]);

  useEffect(() => {
    setPage(1);
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, selectedCategory, setSearchQuery]);

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
        toast.success('Previous attempt reset. Ready to retake assessment.');
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
      {/* ── SHOWCASE HERO BANNER ───────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-8 md:p-9 border transition-all duration-300 bg-surface border-separator shadow-xs">
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          {/* Left Column: Heading & Editorial */}
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-accent/10 border border-accent/20 text-accent">
              <Sparkles size={12} className="text-amber-500" />
              <span>Technical assessments</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-label-primary leading-[1.15]">
              Conceptual mastery & technical challenges
            </h2>

            <p className="text-sm sm:text-[15px] text-label-secondary leading-relaxed max-w-prose">
              Evaluate competitive logic, master core architecture, and benchmark technical comprehension with timed challenges and automated evaluations.
            </p>
          </div>

          {/* Right Column: Live Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 sm:gap-3.5 shrink-0 w-full lg:w-auto">
            <div className="p-3 sm:p-4 rounded-2xl bg-surface-secondary/70 border border-separator shadow-xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                <Award size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-semibold text-label-primary tracking-tight tabular-nums">
                  {loading ? '—' : assessments.length}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-label-tertiary truncate">
                  Assessments
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-surface-secondary/70 border border-separator shadow-xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                <HelpCircle size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-semibold text-label-primary tracking-tight tabular-nums">
                  {loading ? '—' : `${totalQuestions}+`}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-label-tertiary truncate">
                  Total questions
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-surface-secondary/70 border border-separator shadow-xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                <Layers size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-semibold text-label-primary tracking-tight tabular-nums">
                  {categories.length - 1}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-label-tertiary truncate">
                  Tracks
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-surface-secondary/70 border border-separator shadow-xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-semibold text-label-primary tracking-tight tabular-nums">
                  {myCompletedCount}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-label-tertiary truncate">
                  Completed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH, ACTION CONTROLS & CATEGORY TRACKS BAR ────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface border border-separator shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
          {/* Search Input with clear button */}
          <div className="relative flex-1 max-w-md">
            <div className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 bg-surface-secondary border border-separator focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15 rounded-xl transition-all shadow-2xs min-h-[42px]">
              <Search size={15} className="text-label-tertiary shrink-0" />
              <input
                type="text"
                placeholder="Search assessments by title, track, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-xs text-label-primary focus:outline-none placeholder-label-tertiary w-full font-normal"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-label-tertiary hover:text-label-primary transition-all cursor-pointer min-h-[28px] min-w-[28px] flex items-center justify-center"
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
            <div className="flex items-center gap-1 p-1 bg-surface-secondary border border-separator rounded-xl shrink-0 shadow-2xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 min-h-[34px] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 sm:px-2.5 sm:py-1.5 min-h-[34px] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-label-secondary hover:text-label-primary'
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
                  className="py-2 px-3.5 sm:px-4 min-h-[40px] text-xs font-medium flex items-center gap-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-all cursor-pointer shadow-xs shrink-0 active:scale-98"
                  title="Bulk upload MCQ assessments from Excel"
                >
                  <FileSpreadsheet size={15} className="text-emerald-500 shrink-0" />
                  <span className="hidden sm:inline">Bulk upload</span>
                  <span className="sm:hidden">Bulk</span>
                </button>

                <button
                  onClick={handleOpenCreate}
                  className="py-2 px-4 sm:px-5 min-h-[40px] text-xs font-medium flex items-center gap-2 rounded-xl bg-accent hover:bg-accent-hover text-white shadow-sm transition-all cursor-pointer shrink-0 active:scale-98"
                >
                  <Plus size={15} strokeWidth={2} />
                  <span className="hidden sm:inline">Create assessment</span>
                  <span className="sm:hidden">Create</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter Pills with counts */}
        <div className="flex items-center gap-1.5 sm:gap-2 pt-3 border-t border-separator overflow-x-auto no-scrollbar max-w-full">
          {categories.map((cat) => {
            const count = getCategoryCount(cat);
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 sm:px-3.5 py-1.5 min-h-[32px] rounded-xl sm:rounded-full text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 touch-manipulation ${
                  isSelected
                    ? 'bg-accent text-white shadow-xs'
                    : 'bg-surface-secondary text-label-secondary hover:text-label-primary hover:bg-surface border border-separator'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium tabular-nums ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 dark:bg-white/10 text-label-tertiary'
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
        <DelayedSkeleton>
          <CardGridSkeleton count={4} />
        </DelayedSkeleton>
      ) : assessments.length === 0 ? (
        searchQuery ? (
          <NoSearchResults
            query={searchQuery}
            onClearFilters={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
          />
        ) : (
          <EmptyState
            reason={selectedCategory !== 'All' ? 'filtered' : 'first-use'}
            title={selectedCategory !== 'All' ? 'No assessments in this category' : 'No assessments found'}
            description={
              selectedCategory !== 'All'
                ? 'Try selecting "All" or a different category to see available quizzes.'
                : 'There are currently no active MCQ assessments published. Check back soon!'
            }
            primaryAction={
              selectedCategory !== 'All'
                ? { label: 'Show all assessments', onClick: () => setSelectedCategory('All') }
                : isAdmin
                ? { label: 'Create assessment', onClick: handleOpenCreate }
                : undefined
            }
          />
        )
      ) : viewMode === 'grid' ? (
        /* Grid View with popLayout AnimatePresence */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
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
                  className="surface p-4 sm:p-7 flex flex-col justify-between group hover:border-accent/35 transition-all duration-300 relative overflow-hidden rounded-2xl sm:rounded-3xl"
                >
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-[10px] font-medium uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
                          {assessment.category}
                        </span>

                        <span className="text-[10px] font-medium uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center gap-1 tabular-nums">
                          <Award size={11} className="text-amber-500" />
                          <span>+{assessment.customPoints ?? 50} pts</span>
                        </span>

                        {assessment.eventId && (
                          <span className="text-[10px] font-medium uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center gap-1">
                            <Calendar size={11} />
                            {assessment.eventId.title || 'Linked Event'}
                          </span>
                        )}

                        {!assessment.isPublished && (
                          <span className="text-[10px] font-medium uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                            Draft / Hidden
                          </span>
                        )}
                      </div>

                      {hasTaken && (
                        <div
                          className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full border shrink-0 tabular-nums ${
                            isPassed
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-500'
                          }`}
                        >
                          {isPassed ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                          {isPassed ? `Passed: ${mySub.percentage}%` : `Score: ${mySub.percentage}%`}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-label-primary group-hover:text-accent transition-colors tracking-tight">
                        {assessment.title}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-label-secondary mt-1 line-clamp-2 leading-relaxed font-normal">
                        {assessment.description || 'Test conceptual clarity and competitive aptitude.'}
                      </p>
                    </div>

                    {/* Meta Stats Row */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-3 py-2.5 sm:py-3 border-y border-separator text-center">
                      <div className="p-1.5 sm:p-2 rounded-xl bg-surface-secondary/70">
                        <p className="text-[9px] font-medium uppercase tracking-wider text-label-tertiary">Questions</p>
                        <p className="text-xs sm:text-sm font-medium text-label-primary mt-0.5 tabular-nums">
                          {assessment.questionsCount || assessment.questions?.length || 0} MCQs
                        </p>
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-surface-secondary/70">
                        <p className="text-[9px] font-medium uppercase tracking-wider text-label-tertiary">Time limit</p>
                        <p className="text-xs sm:text-sm font-medium text-label-primary mt-0.5 flex items-center justify-center gap-1 tabular-nums">
                          <Clock size={11} className="text-accent sm:w-3 sm:h-3" />
                          {assessment.timeLimitMinutes}m
                        </p>
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-xl bg-surface-secondary/70">
                        <p className="text-[9px] font-medium uppercase tracking-wider text-label-tertiary">Pass cutoff</p>
                        <p className="text-xs sm:text-sm font-medium text-label-primary mt-0.5 tabular-nums">
                          {assessment.passingScorePercentage || 70}%
                        </p>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(assessment)}
                              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-surface-secondary hover:bg-surface border border-separator text-label-secondary hover:text-label-primary transition-all cursor-pointer"
                              title="Edit assessment"
                              aria-label="Edit assessment"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => setSubmissionsAssessmentId(assessment._id)}
                              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-surface-secondary hover:bg-surface border border-separator text-label-secondary hover:text-accent transition-all cursor-pointer"
                              title="View submissions"
                              aria-label="View submissions"
                            >
                              <Users size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(assessment._id, assessment.title)}
                              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-surface-secondary hover:bg-red-500/10 border border-separator text-label-secondary hover:text-red-500 transition-all cursor-pointer"
                              title="Delete assessment"
                              aria-label="Delete assessment"
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
                            className="py-2 px-3 min-h-[36px] rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                            title="Reset previous attempt and retake fresh"
                          >
                            <RotateCcw size={12} className={resettingId === assessment._id ? 'animate-spin' : ''} />
                            Reset attempt
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedAssessmentToTake(assessment)}
                          className={`py-2 px-3.5 sm:px-4 min-h-[36px] rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                            hasTaken
                              ? 'bg-surface-secondary hover:bg-surface text-label-primary border border-separator'
                              : 'bg-accent hover:bg-accent-hover text-white shadow-xs'
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
                              Start quiz
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* Data Table View */
        <div className="surface overflow-hidden border-separator rounded-3xl">
          <div className="overflow-x-auto custom-scrollbar touch-pan-x">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-surface-secondary border-b border-separator">
                  <th className="px-6 py-3.5 text-[11px] font-medium text-label-tertiary uppercase tracking-wider">Assessment</th>
                  <th className="px-6 py-3.5 text-[11px] font-medium text-label-tertiary uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3.5 text-[11px] font-medium text-label-tertiary uppercase tracking-wider">Questions & cutoff</th>
                  <th className="px-6 py-3.5 text-[11px] font-medium text-label-tertiary uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3.5 text-[11px] font-medium text-label-tertiary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator">
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
                        className="group hover:bg-surface-secondary/50 transition-colors"
                      >
                        {/* Title & Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                              <Award size={16} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-medium text-label-primary truncate group-hover:text-accent transition-colors">
                                {assessment.title}
                              </h4>
                              <p className="text-xs text-label-secondary truncate mt-0.5 font-normal">
                                {assessment.description || 'MCQ skill challenge'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category & Points */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-accent/10 text-accent border border-accent/20">
                              {assessment.category}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-500 tabular-nums">
                              <Award size={10} /> +{assessment.customPoints ?? 50} pts
                            </span>
                          </div>
                        </td>

                        {/* Questions & Cutoff */}
                        <td className="px-6 py-4 text-xs font-normal text-label-secondary tabular-nums">
                          <span>{assessment.questionsCount || assessment.questions?.length || 0} MCQs</span>
                          <span className="text-label-tertiary mx-1.5">•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{assessment.passingScorePercentage}% pass</span>
                        </td>

                        {/* Duration */}
                        <td className="px-6 py-4 text-xs font-normal text-label-secondary whitespace-nowrap tabular-nums">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-accent" />
                            {assessment.timeLimitMinutes} min
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(assessment)}
                                  className="p-2 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl bg-surface-secondary text-label-secondary hover:text-label-primary hover:bg-surface border border-separator transition-all cursor-pointer"
                                  title="Edit assessment"
                                  aria-label="Edit assessment"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => setSubmissionsAssessmentId(assessment._id)}
                                  className="p-2 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl bg-surface-secondary text-label-secondary hover:text-accent hover:bg-surface border border-separator transition-all cursor-pointer"
                                  title="View submissions"
                                  aria-label="View submissions"
                                >
                                  <Users size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(assessment._id, assessment.title)}
                                  className="p-2 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl bg-surface-secondary text-label-secondary hover:text-red-500 hover:bg-red-500/10 border border-separator transition-all cursor-pointer"
                                  title="Delete assessment"
                                  aria-label="Delete assessment"
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
                                className="py-1.5 px-2.5 min-h-[34px] rounded-xl text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 cursor-pointer flex items-center gap-1 transition-all"
                                title="Reset previous attempt and retake fresh"
                              >
                                <RotateCcw size={11} className={resettingId === assessment._id ? 'animate-spin' : ''} />
                                Reset
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (typeof document !== 'undefined' && !document.fullscreenElement && document.documentElement.requestFullscreen) {
                                  document.documentElement.requestFullscreen().catch(() => {});
                                }
                                setSelectedAssessmentToTake(assessment);
                              }}
                              className="btn-primary py-1.5 px-3 min-h-[34px] text-xs font-medium bg-accent hover:bg-accent-hover cursor-pointer"
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
