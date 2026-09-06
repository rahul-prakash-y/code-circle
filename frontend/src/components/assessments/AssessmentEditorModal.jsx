import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Clock,
  Award,
  AlertCircle,
  Save,
  Layers,
  ChevronDown,
} from 'lucide-react';
import useAssessmentStore from '../../store/useAssessmentStore';
import useEventStore from '../../store/useEventStore';
import toast from 'react-hot-toast';

const categories = ['Technical', 'Web Development', 'Algorithms', 'General', 'System Design'];

const AssessmentEditorModal = ({ isOpen, assessmentToEdit, onClose }) => {
  const { createAssessment, updateAssessment, submitting } = useAssessmentStore();
  const { events, fetchEvents } = useEventStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technical');
  const [eventId, setEventId] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [passingScorePercentage, setPassingScorePercentage] = useState(60);
  const [isPublished, setIsPublished] = useState(true);

  // Dynamic Questions Array
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', ''],
      correctOptionIndex: 0,
      explanation: '',
      points: 1,
    },
  ]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (assessmentToEdit) {
      setTitle(assessmentToEdit.title || '');
      setDescription(assessmentToEdit.description || '');
      setCategory(assessmentToEdit.category || 'Technical');
      setEventId(
        assessmentToEdit.eventId?._id || assessmentToEdit.eventId || ''
      );
      setTimeLimitMinutes(assessmentToEdit.timeLimitMinutes || 30);
      setPassingScorePercentage(assessmentToEdit.passingScorePercentage || 60);
      setIsPublished(assessmentToEdit.isPublished ?? true);

      if (assessmentToEdit.questions && assessmentToEdit.questions.length > 0) {
        setQuestions(
          assessmentToEdit.questions.map((q) => ({
            questionText: q.questionText || '',
            options: q.options && q.options.length > 0 ? [...q.options] : ['', ''],
            correctOptionIndex: q.correctOptionIndex ?? 0,
            explanation: q.explanation || '',
            points: q.points || 1,
          }))
        );
      }
    } else {
      // Default new state
      setTitle('');
      setDescription('');
      setCategory('Technical');
      setEventId('');
      setTimeLimitMinutes(30);
      setPassingScorePercentage(60);
      setIsPublished(true);
      setQuestions([
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          explanation: '',
          points: 1,
        },
      ]);
    }
  }, [assessmentToEdit, isOpen]);

  if (!isOpen) return null;

  // Question Management Helpers
  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        explanation: '',
        points: 1,
      },
    ]);
  };

  const handleRemoveQuestion = (qIndex) => {
    if (questions.length <= 1) {
      toast.error('Assessment must have at least one question');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== qIndex));
  };

  const handleQuestionTextChange = (qIndex, text) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].questionText = text;
      return updated;
    });
  };

  const handleQuestionPointsChange = (qIndex, points) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].points = Math.max(1, parseInt(points) || 1);
      return updated;
    });
  };

  const handleQuestionExplanationChange = (qIndex, explanation) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].explanation = explanation;
      return updated;
    });
  };

  // Option Management Helpers
  const handleAddOption = (qIndex) => {
    setQuestions((prev) => {
      const updated = [...prev];
      if (updated[qIndex].options.length >= 6) {
        toast.error('Maximum 6 options allowed per MCQ');
        return prev;
      }
      updated[qIndex].options.push('');
      return updated;
    });
  };

  const handleRemoveOption = (qIndex, optIndex) => {
    setQuestions((prev) => {
      const updated = [...prev];
      if (updated[qIndex].options.length <= 2) {
        toast.error('At least 2 options are required per MCQ');
        return prev;
      }
      updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== optIndex);
      if (updated[qIndex].correctOptionIndex >= updated[qIndex].options.length) {
        updated[qIndex].correctOptionIndex = 0;
      }
      return updated;
    });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].options[optIndex] = value;
      return updated;
    });
  };

  const handleSetCorrectOption = (qIndex, optIndex) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].correctOptionIndex = optIndex;
      return updated;
    });
  };

  // Form Submission Validation & Execution
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter an assessment title');
      return;
    }

    if (questions.length === 0) {
      toast.error('Assessment must contain at least one question');
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Question #${i + 1} has empty text`);
        return;
      }
      if (q.options.length < 2) {
        toast.error(`Question #${i + 1} must have at least 2 options`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          toast.error(`Question #${i + 1}, Option ${String.fromCharCode(65 + j)} is empty`);
          return;
        }
      }
      if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
        toast.error(`Question #${i + 1} has an invalid answer selection`);
        return;
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      eventId: eventId || null,
      timeLimitMinutes: Number(timeLimitMinutes) || 30,
      passingScorePercentage: Number(passingScorePercentage) || 60,
      isPublished,
      questions: questions.map((q) => ({
        questionText: q.questionText.trim(),
        options: q.options.map((opt) => opt.trim()),
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation.trim(),
        points: q.points || 1,
      })),
    };

    let res;
    if (assessmentToEdit) {
      res = await updateAssessment(assessmentToEdit._id, payload);
    } else {
      res = await createAssessment(payload);
    }

    if (res.success) {
      toast.success(
        assessmentToEdit
          ? 'Assessment updated successfully!'
          : 'Assessment created and published!'
      );
      onClose();
    } else {
      toast.error(res.error || 'Failed to save assessment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl my-auto stellar-glass border border-white/10 p-6 sm:p-8 relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] max-h-[90vh] flex flex-col"
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 -mr-24 -mt-24 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-center pb-6 border-b border-white/10 relative z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Award size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {assessmentToEdit ? 'Edit MCQ Assessment' : 'Create New MCQ Assessment'}
              </h2>
              <p className="text-xs text-slate-400">
                Design custom multiple choice challenges with dynamic questions and automated scoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar flex-1 py-6 space-y-6 relative z-10 pr-1">
          {/* Top Assessment Meta Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Assessment Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Fastify & Modern REST Architecture Benchmark"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all placeholder-slate-600"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Description & Instructions
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what this assessment tests, rules, or prerequisites..."
                rows={2}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all placeholder-slate-600 resize-none"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Category Track
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-[#0d121f] border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Linked Event */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Associate With Event (Optional)
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full px-4 py-3 bg-[#0d121f] border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all"
              >
                <option value="">None (Standalone Assessment)</option>
                {events?.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title} ({new Date(ev.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Time Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock size={14} className="text-purple-400" />
                Time Limit (Minutes) *
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                required
              />
            </div>

            {/* Passing Percentage */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Passing Score Cutoff (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={passingScorePercentage}
                onChange={(e) => setPassingScorePercentage(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                required
              />
            </div>

            {/* Status Toggle */}
            <div className="md:col-span-2 flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-white/5 border-white/20 cursor-pointer"
              />
              <label htmlFor="isPublished" className="text-xs font-bold text-white cursor-pointer select-none">
                Publish Assessment immediately (visible to students in assessment catalogue)
              </label>
            </div>
          </div>

          {/* Dynamic Multiple Choice Questions Section */}
          <div className="space-y-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-purple-400" />
                <h3 className="text-base font-black text-white">Dynamic MCQ Questions ({questions.length})</h3>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
              >
                <Plus size={14} /> Add Question
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div
                  key={qIndex}
                  className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 relative group hover:border-purple-500/30 transition-all"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center text-xs font-black">
                        #{qIndex + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Question {qIndex + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>Points:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={q.points}
                          onChange={(e) => handleQuestionPointsChange(qIndex, e.target.value)}
                          className="w-12 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-xs text-center focus:outline-none"
                        />
                      </div>

                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Remove Question"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <textarea
                    value={q.questionText}
                    onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                    placeholder="Enter question text or code snippet prompt..."
                    rows={2}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all placeholder-slate-600 resize-none font-sans"
                    required
                  />

                  {/* Dynamic Options */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Options (Mark the radio circle for the correct answer)</span>
                      {q.options.length < 6 && (
                        <button
                          type="button"
                          onClick={() => handleAddOption(qIndex)}
                          className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-bold lowercase tracking-normal"
                        >
                          <Plus size={12} /> add option
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIndex) => {
                        const isCorrect = q.correctOptionIndex === optIndex;
                        const optionLetter = String.fromCharCode(65 + optIndex);

                        return (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${
                              isCorrect
                                ? 'bg-emerald-500/5 border-emerald-500/30'
                                : 'bg-white/5 border-white/5'
                            }`}
                          >
                            {/* Correct Radio Selector */}
                            <label className="cursor-pointer flex items-center gap-2 pl-2">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={isCorrect}
                                onChange={() => handleSetCorrectOption(qIndex, optIndex)}
                                className="w-4 h-4 text-emerald-500 bg-white/5 border-white/20 focus:ring-emerald-400 cursor-pointer"
                              />
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                                  isCorrect
                                    ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                    : 'bg-white/10 text-slate-400'
                                }`}
                              >
                                {optionLetter}
                              </span>
                            </label>

                            {/* Option Text Input */}
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              placeholder={`Option ${optionLetter} content...`}
                              className="flex-1 bg-transparent border-none text-white text-xs sm:text-sm focus:outline-none placeholder-slate-600 px-1"
                              required
                            />

                            {/* Remove Option Button (if more than 2) */}
                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(qIndex, optIndex)}
                                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                title="Remove this choice"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation (Optional) */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <HelpCircle size={12} className="text-slate-500" />
                      Answer Explanation (Revealed to student after submission)
                    </label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => handleQuestionExplanationChange(qIndex, e.target.value)}
                      placeholder="Why is this answer correct? (Optional context)"
                      className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500/30 transition-all placeholder-slate-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddQuestion}
              className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-purple-400 hover:text-purple-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={16} /> Add Another Question
            </button>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="stellar-btn py-2.5 px-6 text-xs font-black flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50"
            >
              <Save size={16} />
              {submitting ? 'Saving Assessment...' : assessmentToEdit ? 'Save Changes' : 'Publish Assessment'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AssessmentEditorModal;
