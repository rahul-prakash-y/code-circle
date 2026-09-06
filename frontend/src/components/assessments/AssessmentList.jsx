import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Clock,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Play,
  Edit3,
  Trash2,
  Users,
  Search,
  Calendar,
  Sparkles,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import useAssessmentStore from '../../store/useAssessmentStore';
import useAuthStore from '../../store/useAuthStore';
import useProfileStore from '../../store/useProfileStore';
import toast from 'react-hot-toast';
import TakeAssessmentModal from './TakeAssessmentModal';
import AssessmentEditorModal from './AssessmentEditorModal';
import AssessmentSubmissionsModal from './AssessmentSubmissionsModal';

const categories = ['All', 'Technical', 'Web Development', 'Algorithms', 'General', 'System Design'];

const AssessmentList = () => {
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
      <div className="stellar-glass p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Award size={22} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  MCQ Assessments
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    Engine
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Evaluate conceptual comprehension, competitive logic, and track scores in real time
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl focus-within:border-purple-500/40 transition-all">
              <Search size={16} className="text-slate-500" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs sm:text-sm text-white focus:outline-none placeholder-slate-600 w-36 sm:w-48"
              />
            </div>

            {isAdmin && (
              <button
                onClick={handleOpenCreate}
                className="stellar-btn py-2.5 px-5 text-xs font-black flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:brightness-110"
              >
                <Plus size={16} />
                Create Assessment
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-white/5 overflow-x-auto custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Assessment Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stellar-glass p-6 animate-pulse space-y-4">
              <div className="h-6 bg-white/10 rounded-lg w-2/3" />
              <div className="h-4 bg-white/5 rounded-lg w-full" />
              <div className="h-10 bg-white/5 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <div className="stellar-glass p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Award size={32} />
          </div>
          <h3 className="text-lg font-black text-white">No Assessments Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'No assessments match your active filter criteria. Try resetting filters.'
              : 'There are currently no active MCQ assessments published. Check back soon!'}
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="stellar-btn py-2.5 px-6 text-xs font-black inline-flex items-center gap-2 mt-2"
            >
              <Plus size={16} /> Create First Assessment
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {assessments.map((assessment) => {
              const mySub = assessment.mySubmission;
              const hasTaken = Boolean(mySub);
              const isPassed = mySub?.passed;

              return (
                <motion.div
                  key={assessment._id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="stellar-glass p-6 sm:p-7 flex flex-col justify-between group hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Category & Status Badges */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                          {assessment.category}
                        </span>

                        {assessment.eventId && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center gap-1.5">
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

                      {/* Student Submission Status Pill */}
                      {hasTaken && (
                        <div
                          className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
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
                      <h3 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                        {assessment.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {assessment.description || 'Test conceptual clarity and competitive aptitude.'}
                      </p>
                    </div>

                    {/* Meta Stats Row */}
                    <div className="grid grid-cols-3 gap-3 py-3 border-y border-white/5 text-center">
                      <div className="p-2 rounded-xl bg-white/[0.02]">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Questions</p>
                        <p className="text-sm font-black text-white mt-0.5">
                          {assessment.questionsCount || assessment.questions?.length || 0} MCQs
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.02]">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Time Limit</p>
                        <p className="text-sm font-black text-white mt-0.5 flex items-center justify-center gap-1">
                          <Clock size={12} className="text-purple-400" />
                          {assessment.timeLimitMinutes}m
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/[0.02]">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Passing Cutoff</p>
                        <p className="text-sm font-black text-emerald-400 mt-0.5">
                          {assessment.passingScorePercentage}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-6 pt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(assessment)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
                            title="Edit Assessment & Questions"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => setSubmissionsAssessmentId(assessment._id)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-purple-300 transition-all border border-white/5"
                            title="View Student Submissions"
                          >
                            <Users size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(assessment._id, assessment.title)}
                            className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-all border border-red-500/10"
                            title="Delete Assessment"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedAssessmentToTake(assessment)}
                      className={`py-2 px-5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                        hasTaken
                          ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      }`}
                    >
                      {hasTaken ? (
                        <>
                          <RotateCcw size={14} />
                          Retake Assessment
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          Take Assessment
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Take Assessment Modal */}
      {selectedAssessmentToTake && (
        <TakeAssessmentModal
          assessmentId={selectedAssessmentToTake._id}
          isOpen={Boolean(selectedAssessmentToTake)}
          onClose={() => setSelectedAssessmentToTake(null)}
        />
      )}

      {/* Assessment Builder / Editor Modal */}
      {isEditorOpen && (
        <AssessmentEditorModal
          isOpen={isEditorOpen}
          assessmentToEdit={assessmentToEdit}
          onClose={() => setIsEditorOpen(false)}
        />
      )}

      {/* Submissions Roster Modal */}
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
