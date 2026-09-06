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
} from 'lucide-react';
import useAssessmentStore from '../../store/useAssessmentStore';
import useAuthStore from '../../store/useAuthStore';
import useProfileStore from '../../store/useProfileStore';
import toast from 'react-hot-toast';
import TakeAssessmentModal from './TakeAssessmentModal';
import AssessmentEditorModal from './AssessmentEditorModal';
import AssessmentSubmissionsModal from './AssessmentSubmissionsModal';

const categories = ['All', 'Technical', 'Web Development', 'Algorithms', 'General', 'System Design'];

export const AssessmentList = () => {
  const {
    assessments,
    loading,
    fetchAssessments,
    deleteAssessment,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
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
  const [submissionsAssessmentId, setSubmissionsAssessmentId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

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

  return (
    <div className="space-y-6">
      {/* Top Header & Search / Filter Controls */}
      <div className="glass p-6 sm:p-7 relative overflow-hidden rounded-3xl border border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-purple-400">
                <Award size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight font-heading">
                    MCQ Assessments
                  </h2>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    Engine
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Evaluate conceptual comprehension, competitive logic, and track scores in real time
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 px-3.5 py-2 bg-surface-elevated border border-border rounded-xl focus-within:border-purple-500/40 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
              <Search size={15} className="text-text-muted" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-text-primary focus:outline-none placeholder-text-muted/70 w-36 sm:w-48"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-surface-elevated border border-border rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-purple-600 text-white'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-purple-600 text-white'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="Table View"
                aria-label="Table View"
              >
                <List size={15} />
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={handleOpenCreate}
                className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 cursor-pointer"
              >
                <Plus size={15} />
                Create Assessment
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 mt-5 pt-5 border-t border-border/60 overflow-x-auto custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/15'
                  : 'bg-surface-elevated text-text-muted hover:text-text-primary border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
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
                  className="glass p-6 sm:p-7 flex flex-col justify-between group hover:border-purple-500/35 transition-all duration-300 relative overflow-hidden rounded-3xl"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                          {assessment.category}
                        </span>

                        {assessment.eventId && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center gap-1">
                            <Calendar size={11} />
                            {assessment.eventId.title || 'Linked Event'}
                          </span>
                        )}

                        {!assessment.isPublished && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            Draft / Hidden
                          </span>
                        )}
                      </div>

                      {hasTaken && (
                        <div
                          className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            isPassed
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}
                        >
                          {isPassed ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
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
                    <div className="grid grid-cols-3 gap-3 py-3 border-y border-border/60 text-center">
                      <div className="p-2 rounded-xl bg-surface-elevated/40">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Questions</p>
                        <p className="text-sm font-bold text-text-primary mt-0.5">
                          {assessment.questionsCount || assessment.questions?.length || 0} MCQs
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-surface-elevated/40">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Time Limit</p>
                        <p className="text-sm font-bold text-text-primary mt-0.5 flex items-center justify-center gap-1">
                          <Clock size={12} className="text-purple-400" />
                          {assessment.timeLimitMinutes}m
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-surface-elevated/40">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Pass Cutoff</p>
                        <p className="text-sm font-bold text-emerald-400 mt-0.5">
                          {assessment.passingScorePercentage}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-2 flex items-center justify-between gap-3">
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

                    <button
                      onClick={() => setSelectedAssessmentToTake(assessment)}
                      className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
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

                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {assessment.category}
                          </span>
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
          isOpen={Boolean(submissionsAssessmentId)}
          onClose={() => setSubmissionsAssessmentId(null)}
        />
      )}
    </div>
  );
};

export default AssessmentList;
