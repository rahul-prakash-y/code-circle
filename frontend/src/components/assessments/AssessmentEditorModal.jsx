import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Clock,
  Award,
  Save,
  Layers,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import useAssessmentStore from '../../store/useAssessmentStore';
import useEventStore from '../../store/useEventStore';
import toast from 'react-hot-toast';
import ResponsiveModal from '../ui/ResponsiveModal';
import McqBulkUploadModal from './McqBulkUploadModal';
import TutorialButton from '../common/TutorialButton';

const categories = ['Technical', 'Web Development', 'Algorithms', 'General', 'System Design'];

const AssessmentEditorModal = ({ isOpen, assessmentToEdit, onClose }) => {
  const { createAssessment, updateAssessment, submitting, fetchAssessments } = useAssessmentStore();
  const { events, fetchEvents } = useEventStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technical');
  const [eventId, setEventId] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [passingScorePercentage, setPassingScorePercentage] = useState(60);
  const [customPoints, setCustomPoints] = useState(50);
  const [isPublished, setIsPublished] = useState(true);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

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

  const [prevAssessmentToEdit, setPrevAssessmentToEdit] = useState(assessmentToEdit);

  if (assessmentToEdit !== prevAssessmentToEdit) {
    setPrevAssessmentToEdit(assessmentToEdit);
    if (assessmentToEdit) {
      setTitle(assessmentToEdit.title || '');
      setDescription(assessmentToEdit.description || '');
      setCategory(assessmentToEdit.category || 'Technical');
      setEventId(
        assessmentToEdit.eventId?._id || assessmentToEdit.eventId || ''
      );
      setTimeLimitMinutes(assessmentToEdit.timeLimitMinutes || 30);
      setPassingScorePercentage(assessmentToEdit.passingScorePercentage || 60);
      setCustomPoints(
        typeof assessmentToEdit.customPoints === 'number' && assessmentToEdit.customPoints >= 0
          ? assessmentToEdit.customPoints
          : 50
      );
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
      setCustomPoints(50);
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
  }

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
      customPoints: Math.max(0, Number(customPoints) || 50),
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
          ? 'Assessment updated successfully'
          : 'Assessment created and published'
      );
      onClose();
    } else {
      toast.error(res.error || 'Failed to save assessment');
    }
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center justify-between w-full pr-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-subtle border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-label-primary tracking-tight leading-tight">
                {assessmentToEdit ? 'Edit MCQ assessment' : 'Create MCQ assessment'}
              </h2>
              <p className="text-xs text-label-secondary font-normal mt-0.5">
                Design custom multiple choice challenges with dynamic questions and automated scoring
              </p>
            </div>
          </div>
          <TutorialButton tutorialId="assessment-editor" variant="icon" />
        </div>
      }
      dialogClassName="sm:max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Top Assessment Meta Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-label-secondary">
                Assessment title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Fastify & Modern REST Architecture Benchmark"
                className="w-full px-4 py-3 bg-surface-secondary border border-separator rounded-2xl text-label-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring transition-all placeholder-label-tertiary font-normal"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-label-secondary">
                Description & instructions
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what this assessment tests, rules, or prerequisites..."
                rows={2}
                className="w-full px-4 py-3 bg-surface-secondary border border-separator rounded-2xl text-label-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring transition-all placeholder-label-tertiary resize-none font-normal"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-label-secondary">
                Category track
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-surface-secondary border border-separator rounded-2xl text-label-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring transition-all font-normal"
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
              <label className="text-[11px] font-semibold uppercase tracking-wider text-label-secondary">
                Associate with event (optional)
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full px-4 py-3 bg-surface-secondary border border-separator rounded-2xl text-label-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring transition-all font-normal"
              >
                <option value="">None (Standalone assessment)</option>
                {events?.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title} ({new Date(ev.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Time Limit */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-label-secondary flex items-center gap-1.5">
                <Clock size={14} className="text-accent" />
                Time limit (minutes) *
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
                className="w-full px-4 py-3 bg-surface-secondary border border-separator rounded-2xl text-label-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring transition-all tabular-nums font-normal"
                required
              />
            </div>

            {/* Passing Percentage */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-label-secondary flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success" />
                Passing score cutoff (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={passingScorePercentage}
                onChange={(e) => setPassingScorePercentage(e.target.value)}
                className="w-full px-4 py-3 bg-surface-secondary border border-separator rounded-2xl text-label-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring transition-all tabular-nums font-normal"
                required
              />
            </div>

            {/* Custom Points Reward */}
            <div className="space-y-2 md:col-span-2 p-4 rounded-2xl bg-warning-subtle border border-warning/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-warning flex items-center gap-1.5">
                  <Award size={15} className="text-warning" />
                  Custom points awarded on passing *
                </label>
                <span className="text-[11px] font-normal text-label-secondary">
                  Credited to student&apos;s club points profile upon passing
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="relative w-36">
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={customPoints}
                    onChange={(e) => setCustomPoints(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3.5 py-2 bg-surface border border-warning/30 rounded-xl text-label-primary text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-warning/30"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-warning">
                    PTS
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[25, 50, 75, 100, 150].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomPoints(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium tabular-nums transition-all cursor-pointer ${
                        customPoints === preset
                          ? 'bg-warning text-white shadow-xs font-semibold'
                          : 'bg-surface-secondary border border-separator text-label-secondary hover:text-label-primary hover:bg-surface-raised'
                      }`}
                    >
                      {preset} pts
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Toggle */}
            <div className="md:col-span-2 flex items-center gap-3 p-3.5 rounded-2xl bg-surface-secondary border border-separator">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent-ring bg-surface border-separator cursor-pointer"
              />
              <label htmlFor="isPublished" className="text-xs font-medium text-label-primary cursor-pointer select-none">
                Publish assessment immediately (visible to students in assessment catalogue)
              </label>
            </div>
          </div>

          {/* Dynamic Multiple Choice Questions Section */}
          <div className="space-y-6 pt-4 border-t border-separator">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-accent" />
                <h3 className="text-base font-semibold text-label-primary tracking-tight tabular-nums">
                  Dynamic MCQ questions ({questions.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  color="success"
                  onPress={() => setIsBulkUploadOpen(true)}
                  className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  title="Import or append questions from Excel sheet"
                >
                  <FileSpreadsheet size={14} /> Bulk import (Excel)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onPress={handleAddQuestion}
                  className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                >
                  <Plus size={14} /> Add question
                </Button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div
                  key={qIndex}
                  className="p-5 sm:p-6 rounded-2xl bg-surface border border-separator space-y-4 relative group hover:border-accent/30 transition-all"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-accent-subtle border border-accent/30 text-accent flex items-center justify-center text-xs font-semibold tabular-nums">
                        #{qIndex + 1}
                      </span>
                      <span className="text-[11px] font-semibold text-label-secondary uppercase tracking-wider tabular-nums">
                        Question {qIndex + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-label-secondary">
                        <span>Points:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={q.points}
                          onChange={(e) => handleQuestionPointsChange(qIndex, e.target.value)}
                          className="w-12 px-2 py-1 bg-surface-secondary border border-separator rounded-lg text-label-primary text-xs text-center tabular-nums focus:outline-none"
                        />
                      </div>

                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="p-1.5 text-destructive hover:opacity-80 hover:bg-destructive-subtle rounded-lg transition-all"
                          title="Remove question"
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
                    className="w-full px-4 py-3 bg-surface-secondary border border-separator rounded-xl text-label-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring transition-all placeholder-label-tertiary resize-none font-sans"
                    required
                  />

                  {/* Dynamic Options */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-label-secondary uppercase tracking-wider">
                      <span>Options (select correct answer radio button)</span>
                      {q.options.length < 6 && (
                        <button
                          type="button"
                          onClick={() => handleAddOption(qIndex)}
                          className="text-accent hover:opacity-90 flex items-center gap-1 font-medium lowercase tracking-normal"
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
                                ? 'bg-success-subtle border-success/30'
                                : 'bg-surface-secondary border-separator'
                            }`}
                          >
                            {/* Correct Radio Selector */}
                            <label className="cursor-pointer flex items-center gap-2 pl-2">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={isCorrect}
                                onChange={() => handleSetCorrectOption(qIndex, optIndex)}
                                className="w-4 h-4 text-success bg-surface-secondary border-separator focus:ring-success cursor-pointer"
                              />
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold ${
                                  isCorrect
                                    ? 'bg-success text-white shadow-xs'
                                    : 'bg-surface text-label-secondary'
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
                              className="flex-1 bg-transparent border-none text-label-primary text-xs sm:text-sm focus:outline-none placeholder-label-tertiary px-1 font-normal"
                              required
                            />

                            {/* Remove Option Button */}
                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(qIndex, optIndex)}
                                className="p-1.5 text-label-secondary hover:text-destructive transition-colors"
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
                    <label className="text-[11px] font-semibold text-label-secondary uppercase tracking-wider flex items-center gap-1">
                      <HelpCircle size={12} className="text-label-tertiary" />
                      Answer explanation (revealed to student after submission)
                    </label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => handleQuestionExplanationChange(qIndex, e.target.value)}
                      placeholder="Why is this answer correct? (Optional context)"
                      className="w-full px-3 py-2 bg-surface-secondary border border-separator rounded-xl text-label-primary text-xs focus:outline-none focus:border-accent/40 transition-all placeholder-label-tertiary font-normal"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddQuestion}
              className="w-full py-3 rounded-2xl bg-surface-secondary hover:bg-surface-raised border border-separator text-accent hover:opacity-90 font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
            >
              <Plus size={16} /> Add another question
            </button>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-6 border-t border-separator flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onPress={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isDisabled={submitting}
              className="py-2.5 px-6 text-xs font-medium rounded-xl shadow-xs flex items-center gap-2"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" color="default" />
                  <span>Saving assessment...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save size={16} />
                  <span>{assessmentToEdit ? 'Save changes' : 'Publish assessment'}</span>
                </div>
              )}
            </Button>
          </div>
        </form>

        {/* Excel Bulk Upload Modal */}
        {isBulkUploadOpen && (
          <McqBulkUploadModal
            isOpen={isBulkUploadOpen}
            onClose={() => setIsBulkUploadOpen(false)}
            targetAssessmentId={assessmentToEdit?._id}
            targetAssessmentTitle={assessmentToEdit?.title}
            onSuccess={() => {
              fetchAssessments();
              onClose();
            }}
          />
        )}
    </ResponsiveModal>
  );
};

export default AssessmentEditorModal;
