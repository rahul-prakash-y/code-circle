import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ResponsiveModal from '../ui/ResponsiveModal';
import useDomainStore from '../../store/useDomainStore';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    activeLevel,
    currentDomain,
    submittingQuest,
    lastQuestResult,
    submitQuest,
    resetQuestResult,
    fetchDomainLevels,
    setActiveLevel,
    levels,
  } = useDomainStore();

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);

  const questions = activeLevel?.questQuestions || [];
  const totalQuestions = questions.length;

  // Reset quiz state when modal opens or activeLevel changes
  useEffect(() => {
    if (isOpen) {
      setCurrentQuestionIdx(0);
      setSelectedAnswers(new Array(totalQuestions).fill(-1));
      resetQuestResult();
    }
  }, [isOpen, activeLevel?._id, totalQuestions]);

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers((prev) => {
      const updated = [...prev];
      updated[currentQuestionIdx] = optionIndex;
      return updated;
    });
  };

  const handleNext = () => {
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!activeLevel) return;
    await submitQuest(activeLevel._id, selectedAnswers);
  };

  const handleRetry = () => {
    resetQuestResult();
    setSelectedAnswers(new Array(totalQuestions).fill(-1));
    setCurrentQuestionIdx(0);
  };

  const handleGoToAssessment = () => {
    onClose();
    // Navigate to assessments page
    if (activeLevel?.assessmentId) {
      const assessmentId =
        typeof activeLevel.assessmentId === 'object'
          ? activeLevel.assessmentId._id
          : activeLevel.assessmentId;
      navigate(`/assessments?id=${assessmentId}`);
    } else {
      navigate('/assessments');
    }
  };

  const handleNextLevel = () => {
    if (!lastQuestResult?.nextLevelId) {
      onClose();
      return;
    }
    const nextLvl = levels.find((l) => l._id === lastQuestResult.nextLevelId);
    if (nextLvl) {
      setActiveLevel(nextLvl);
    }
    onClose();
  };

  const currentQ = questions[currentQuestionIdx];
  const allAnswered = selectedAnswers.length === totalQuestions && selectedAnswers.every((ans) => ans !== -1);
  const isSelected = (idx: number) => selectedAnswers[currentQuestionIdx] === idx;

  // Assessment title for display
  const assessmentTitle =
    typeof activeLevel?.assessmentId === 'object' && activeLevel?.assessmentId?.title
      ? activeLevel.assessmentId.title
      : 'Technical MCQ Assessment';

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
            Q{currentQuestionIdx + 1}
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-label-primary">
            Level {activeLevel?.levelNumber}: {activeLevel?.title}
          </span>
        </div>
      }
      description={
        lastQuestResult?.passed ? undefined : (
          <div className="flex items-center justify-between text-xs text-label-secondary mt-1">
            <span>5-Question Verification Quest</span>
            <span>
              Question {currentQuestionIdx + 1} of {totalQuestions}
            </span>
          </div>
        )
      }
      dialogClassName="sm:max-w-xl p-6"
    >
      <div className="py-2">
        {/* SUCCESS STATE */}
        {lastQuestResult && lastQuestResult.passed ? (
          <div className="text-center py-6 px-2 space-y-6">
            {/* Animated Checkmark */}
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-lg shadow-emerald-500/5 relative"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full border border-emerald-500"
              />
              <motion.svg
                className="w-10 h-10 text-emerald-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M20 6L9 17L4 12"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.65, ease: 'easeOut', delay: 0.2 }}
                />
              </motion.svg>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" /> 100% Score Achieved
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-label-primary">
                Quest Completed Successfully!
              </h2>
              <p className="text-sm text-label-secondary max-w-md mx-auto leading-relaxed">
                You scored <span className="font-semibold text-emerald-500">5 out of 5</span>. Your
                mastery has unlocked the official accredited evaluation!
              </p>
            </motion.div>

            {/* Unlocked Assessment Notification Card */}
            {activeLevel?.assessmentId && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="p-4 rounded-2xl bg-surface-secondary border border-separator/60 text-left space-y-2 shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
                  <Award className="w-4 h-4 text-accent" /> Assessment Unlocked
                </div>
                <div className="text-[15px] font-semibold text-label-primary">{assessmentTitle}</div>
                <p className="text-xs text-label-secondary">
                  Ready to test your hands-on code comprehension? Register and take your timed evaluation now.
                </p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleGoToAssessment}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-accent text-white hover:bg-accent-hover active:scale-98 transition shadow-md shadow-accent/20 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                Register for Assessment
              </button>

              {lastQuestResult.nextLevelId ? (
                <button
                  type="button"
                  onClick={handleNextLevel}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold bg-surface border border-separator text-label-primary hover:bg-surface-secondary active:scale-98 transition cursor-pointer"
                >
                  Continue to Next Level
                  <ArrowRight className="w-4 h-4 text-label-secondary" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-medium bg-surface border border-separator text-label-secondary hover:text-label-primary transition cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        ) : lastQuestResult && !lastQuestResult.passed ? (
          /* RETRY / FAILED STATE */
          <div className="text-center py-6 px-2 space-y-6">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <XCircle className="w-8 h-8 text-rose-500" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-label-primary">
                Pass Threshold Not Reached
              </h2>
              <p className="text-sm text-label-secondary max-w-md mx-auto">
                You scored <span className="font-semibold text-rose-500">{lastQuestResult.score} / {lastQuestResult.total}</span>. A perfect 100% score (5/5) is required to unlock the main assessment.
              </p>
            </div>

            {/* Question Breakdown */}
            <div className="max-h-52 overflow-y-auto space-y-2 text-left pr-1">
              {lastQuestResult.feedback?.map((fb, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    fb.isCorrect
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-500/5 border-rose-500/20 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {fb.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-label-primary">{fb.question}</p>
                    <p className="mt-0.5 opacity-90">
                      {fb.isCorrect ? 'Correct!' : 'Incorrect answer chosen.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-accent text-white hover:bg-accent-hover active:scale-98 transition shadow cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Quest
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-medium border border-separator text-label-secondary hover:text-label-primary transition cursor-pointer"
              >
                Review Video
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE QUESTION CARD */
          <div className="space-y-6">
            {/* Step Progress Indicator */}
            <div className="flex items-center gap-1.5 justify-center py-1">
              {questions.map((_, idx) => {
                const isCurrent = idx === currentQuestionIdx;
                const isAnswered = selectedAnswers[idx] !== -1;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                      isCurrent
                        ? 'w-8 bg-accent'
                        : isAnswered
                        ? 'w-3.5 bg-accent/40'
                        : 'w-3.5 bg-separator'
                    }`}
                    aria-label={`Jump to question ${idx + 1}`}
                  />
                );
              })}
            </div>

            {/* Question Prompt */}
            {currentQ && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-surface-secondary border border-separator/60 text-[15px] font-medium text-label-primary leading-relaxed">
                  {currentQ.question}
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {currentQ.options.map((optText, optIdx) => {
                    const selected = isSelected(optIdx);
                    const letter = String.fromCharCode(65 + optIdx);
                    return (
                      <motion.button
                        key={optIdx}
                        type="button"
                        whileHover={{ scale: 1.008 }}
                        whileTap={{ scale: 0.992 }}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-center gap-3 group cursor-pointer ${
                          selected
                            ? 'bg-accent/10 border-accent text-label-primary shadow-sm ring-1 ring-accent/30 font-medium'
                            : 'bg-surface border-separator/80 text-label-primary hover:bg-surface-secondary hover:border-separator-opaque'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                            selected
                              ? 'bg-accent text-white'
                              : 'bg-surface-secondary text-label-secondary group-hover:bg-separator'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="flex-1 text-[14px] leading-snug">{optText}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation & Submit Bar */}
            <div className="pt-3 border-t border-separator flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentQuestionIdx === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-label-secondary hover:text-label-primary disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {currentQuestionIdx < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-surface border border-separator hover:bg-surface-secondary text-label-primary active:scale-98 transition cursor-pointer"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!allAnswered || submittingQuest}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:pointer-events-none active:scale-98 transition shadow cursor-pointer"
                  >
                    {submittingQuest ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Submit Quest
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
};

export default QuestModal;
