import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  Sparkles,
  Trophy,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import useAssessmentStore from '../../store/useAssessmentStore';
import toast from 'react-hot-toast';

const TakeAssessmentModal = ({ assessmentId, isOpen, onClose }) => {
  const {
    fetchAssessmentById,
    submitAssessment,
    currentAssessment,
    currentResult,
    clearCurrentResult,
    submitting,
  } = useAssessmentStore();

  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qIndex]: selectedOptionIndex }
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  // Timer ref to cancel interval safely
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen && assessmentId) {
      clearCurrentResult();
      setReviewMode(false);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setLoading(true);

      fetchAssessmentById(assessmentId).then((assessment) => {
        setLoading(false);
        if (assessment) {
          const initialSeconds = (assessment.timeLimitMinutes || 30) * 60;
          setTimeLeftSeconds(initialSeconds);
          setStartTime(Date.now());
        }
      });
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, assessmentId, fetchAssessmentById, clearCurrentResult]);

  // Live Timer Countdown Effect
  useEffect(() => {
    if (!loading && currentAssessment && !currentResult && timeLeftSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [loading, currentAssessment, currentResult]);

  if (!isOpen) return null;

  const handleAutoSubmit = () => {
    toast.error('Time is up! Submitting your assessment automatically...');
    executeSubmit();
  };

  const handleSelectOption = (optIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optIndex,
    }));
  };

  const handleNext = () => {
    if (currentAssessment && currentQuestionIndex < currentAssessment.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const executeSubmit = async () => {
    setShowConfirmModal(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    const formattedAnswers = Object.entries(answers).map(([qIndex, optIndex]) => ({
      questionIndex: Number(qIndex),
      selectedOption: Number(optIndex),
    }));

    const res = await submitAssessment(assessmentId, formattedAnswers, timeSpent);
    if (res.success) {
      toast.success(res.result?.passed ? 'Congratulations! You passed!' : 'Assessment completed!');
    } else {
      toast.error(res.error || 'Failed to submit assessment');
    }
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const questions = currentAssessment?.questions || [];
  const currentQ = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = timeLeftSeconds < 180 && timeLeftSeconds > 0; // Under 3 mins

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-4xl my-auto stellar-glass border border-white/10 relative overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.9)] max-h-[92vh] flex flex-col"
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

        {/* Top Assessment Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between gap-4 relative z-10 flex-shrink-0 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white line-clamp-1">
                {currentAssessment?.title || 'Loading Assessment...'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {currentResult ? 'Assessment Results & Breakdown' : `Question ${currentQuestionIndex + 1} of ${totalQuestions} • Passing Cutoff: ${currentAssessment?.passingScorePercentage}%`}
              </p>
            </div>
          </div>

          {/* Right Header Items: Timer & Close */}
          <div className="flex items-center gap-3">
            {!currentResult && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                  isTimeCritical
                    ? 'bg-red-500/15 border-red-500/40 text-red-400 animate-pulse'
                    : 'bg-white/5 border-white/10 text-white'
                }`}
              >
                <Clock size={16} className={isTimeCritical ? 'text-red-400' : 'text-purple-400'} />
                <span className="font-mono text-sm font-black tabular-nums">
                  {formatTime(timeLeftSeconds)}
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-400 uppercase tracking-widest font-black">
              Preparing Assessment...
            </p>
          </div>
        ) : currentResult ? (
          /* ========================================================================= */
          /* POST-SUBMISSION SCORE & REVIEW SCREEN */
          /* ========================================================================= */
          <div className="overflow-y-auto custom-scrollbar flex-1 p-6 sm:p-8 space-y-8 relative z-10">
            {/* Score Banner */}
            <div
              className={`p-8 rounded-3xl border relative overflow-hidden text-center space-y-4 ${
                currentResult.passed
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="inline-flex p-4 rounded-3xl bg-white/5 border border-white/10 mx-auto">
                {currentResult.passed ? (
                  <Trophy size={40} className="text-emerald-400 animate-bounce" />
                ) : (
                  <AlertTriangle size={40} className="text-amber-400" />
                )}
              </div>

              <div>
                <span
                  className={`text-[11px] font-black uppercase tracking-[0.25em] px-3.5 py-1 rounded-full border ${
                    currentResult.passed
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-red-500/20 text-red-400 border-red-500/40'
                  }`}
                >
                  {currentResult.passed ? 'Assessment Passed' : 'Needs Practice'}
                </span>
                <h3 className="text-3xl sm:text-4xl font-black text-white mt-3">
                  {currentResult.score} / {currentResult.totalPoints} Points ({currentResult.percentage}%)
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto mt-2">
                  {currentResult.passed
                    ? `Outstanding! You achieved ${currentResult.percentage}%, exceeding the ${currentResult.passingScorePercentage}% requirement.`
                    : `You scored ${currentResult.percentage}%. The passing threshold is ${currentResult.passingScorePercentage}%. Review the explanations below and try again!`}
                </p>
              </div>

              <div className="flex items-center justify-center gap-6 pt-2 text-xs font-bold text-slate-400">
                <span>⏱️ Time Spent: {formatTime(currentResult.timeSpentSeconds)}</span>
                <span>📋 Total Questions: {currentResult.detailedResults.length}</span>
              </div>
            </div>

            {/* Detailed Question Review Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-purple-400" />
                <h4 className="text-sm font-black uppercase tracking-wider text-white">
                  Answer Key & Comprehensive Explanations
                </h4>
              </div>

              <div className="space-y-4">
                {currentResult.detailedResults.map((qResult, idx) => (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border space-y-3 transition-all ${
                      qResult.isCorrect
                        ? 'bg-emerald-500/[0.03] border-emerald-500/20'
                        : 'bg-red-500/[0.03] border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {qResult.isCorrect ? (
                          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                        ) : (
                          <XCircle size={18} className="text-red-400 flex-shrink-0" />
                        )}
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Question #{idx + 1}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          qResult.isCorrect
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {qResult.isCorrect ? 'Correct (+1)' : 'Incorrect (0)'}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-white leading-relaxed">
                      {qResult.questionText}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Your Choice:</p>
                        <p className={qResult.isCorrect ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {qResult.selectedOption >= 0
                            ? `Option ${String.fromCharCode(65 + qResult.selectedOption)}`
                            : 'Unanswered'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Correct Answer:</p>
                        <p className="text-emerald-400 font-bold">
                          Option {String.fromCharCode(65 + qResult.correctOptionIndex)}
                        </p>
                      </div>
                    </div>

                    {qResult.explanation && (
                      <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15 text-xs text-purple-300 leading-relaxed">
                        <span className="font-bold text-purple-400">Explanation: </span>
                        {qResult.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Post-result Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  clearCurrentResult();
                  setAnswers({});
                  setCurrentQuestionIndex(0);
                  setTimeLeftSeconds((currentAssessment.timeLimitMinutes || 30) * 60);
                  setStartTime(Date.now());
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 flex items-center gap-2 border border-white/10 transition-all"
              >
                <RotateCcw size={14} /> Retake Assessment
              </button>
              <button
                onClick={onClose}
                className="stellar-btn py-2.5 px-6 text-xs font-black"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* LIVE ASSESSMENT TAKING INTERFACE */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col overflow-hidden relative z-10">
            {/* Question Progress Bubbles Bar */}
            <div className="px-6 py-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-2 overflow-x-auto custom-scrollbar flex-shrink-0">
              {questions.map((_, idx) => {
                const isAnswered = answers[idx] !== undefined;
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all flex items-center justify-center flex-shrink-0 ${
                      isCurrent
                        ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105'
                        : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Active Question Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">
              {currentQ ? (
                <div className="space-y-6">
                  {/* Question Header & Points */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Worth {currentQ.points || 1} Point{(currentQ.points || 1) > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <h3 className="text-lg sm:text-xl font-black text-white leading-relaxed">
                    {currentQ.questionText}
                  </h3>

                  {/* Multiple Choice Options */}
                  <div className="space-y-3 pt-2">
                    {currentQ.options.map((optText, optIndex) => {
                      const isSelected = answers[currentQuestionIndex] === optIndex;
                      const optionLetter = String.fromCharCode(65 + optIndex);

                      return (
                        <motion.button
                          key={optIndex}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleSelectOption(optIndex)}
                          className={`w-full p-4 sm:p-5 rounded-2xl text-left flex items-center gap-4 transition-all duration-200 cursor-pointer border ${
                            isSelected
                              ? 'bg-purple-600/15 border-purple-500 text-white shadow-[0_0_25px_rgba(168,85,247,0.25)]'
                              : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all flex-shrink-0 ${
                              isSelected
                                ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                                : 'bg-white/10 text-slate-400'
                            }`}
                          >
                            {optionLetter}
                          </div>

                          <span className="text-xs sm:text-sm font-medium leading-relaxed flex-1">
                            {optText}
                          </span>

                          {isSelected && (
                            <CheckCircle2 size={20} className="text-purple-400 flex-shrink-0" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500">No question selected</div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-4 sm:p-6 border-t border-white/10 flex items-center justify-between gap-3 bg-white/[0.01] flex-shrink-0">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 transition-all"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <div className="text-xs font-bold text-slate-400">
                <span className="text-purple-400 font-black">{answeredCount}</span> of {totalQuestions} answered
              </div>

              <div className="flex items-center gap-2">
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <button
                    onClick={handleNext}
                    className="stellar-btn py-2.5 px-5 text-xs font-black flex items-center gap-1.5"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="stellar-btn py-2.5 px-6 text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2"
                  >
                    <Send size={15} /> Submit Assessment
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Submission Dialog */}
        <AnimatePresence>
          {showConfirmModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md stellar-glass border border-white/10 p-6 sm:p-7 space-y-5 text-center shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                  <Send size={26} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Ready to submit?</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    You have completed{' '}
                    <span className="text-white font-bold">{answeredCount}</span> of{' '}
                    <span className="text-white font-bold">{totalQuestions}</span> questions.
                    {answeredCount < totalQuestions && (
                      <span className="block text-amber-400 mt-1 font-bold">
                        ⚠️ Note: {totalQuestions - answeredCount} question(s) remain unanswered!
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                  >
                    Back to Test
                  </button>
                  <button
                    onClick={executeSubmit}
                    disabled={submitting}
                    className="stellar-btn py-2.5 px-6 text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 disabled:opacity-50"
                  >
                    {submitting ? 'Calculating Score...' : 'Yes, Submit Now'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default TakeAssessmentModal;
