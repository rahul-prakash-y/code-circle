import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ShieldCheck,
  Maximize2,
  Minimize2,
  Lock,
} from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import useAssessmentStore from '../../store/useAssessmentStore';
import toast from 'react-hot-toast';
import FullScreenEnforcementOverlay from './FullScreenEnforcementOverlay';
import { isMobileScreenOrDevice } from '../../lib/deviceUtils';
import useAutoSave from '../../hooks/useAutoSave';
import { saveExamState, clearExamState } from '../../utils/examStorage';
import api from '../../lib/axios';

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
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Anti-cheat proctoring state
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => {
    if (typeof document === 'undefined') return false;
    return Boolean(document.fullscreenElement);
  });
  const [isMobileMode, setIsMobileMode] = useState(() => isMobileScreenOrDevice());
  const wasInterruptedRef = useRef(false);
  const maxStrikes = 3;

  // Timer ref to cancel interval safely
  const timerRef = useRef(null);
  const timeLeftRef = useRef(timeLeftSeconds);
  const submissionIdRef = useRef(null);
  useEffect(() => {
    timeLeftRef.current = timeLeftSeconds;
  }, [timeLeftSeconds]);

  // Resiliency: LocalStorage / IndexedDB AutoSave hook
  const autoSaveKey = assessmentId ? `cc_assessment_answers_${assessmentId}` : '';
  const { clearSavedData } = useAutoSave(
    autoSaveKey,
    answers,
    {
      intervalMs: 30000,
      enabled: isOpen && !currentResult && !loading,
      onRestore: useCallback((saved) => {
        if (saved && typeof saved === 'object') {
          const restoredAnswers = saved.answers || saved;
          if (Object.keys(restoredAnswers).length > 0) {
            setAnswers(restoredAnswers);
            if (saved.submissionId) {
              submissionIdRef.current = saved.submissionId;
            }
            toast.success('Restored unsubmitted test answers from local storage!', { id: 'autosave-restore' });
          }
        }
      }, []),
    }
  );

  // Monitor screen size changes for mobile protection
  useEffect(() => {
    const handleDeviceCheck = () => {
      setIsMobileMode(isMobileScreenOrDevice());
    };
    handleDeviceCheck();
    window.addEventListener('resize', handleDeviceCheck);
    window.addEventListener('orientationchange', handleDeviceCheck);
    return () => {
      window.removeEventListener('resize', handleDeviceCheck);
      window.removeEventListener('orientationchange', handleDeviceCheck);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && assessmentId) {
      queueMicrotask(() => {
        if (!isMounted) return;
        clearCurrentResult();
        setAnswers({});
        setCurrentQuestionIndex(0);
        setTabSwitchCount(0);
        setShowTabWarning(false);
        setIsLocked(false);
        setShowExitConfirm(false);
        setLoading(true);
      });

      fetchAssessmentById(assessmentId).then((assessment) => {
        if (!isMounted) return;
        setLoading(false);
        if (!submissionIdRef.current) {
          submissionIdRef.current =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `sub-${Date.now()}`;
        }
        if (assessment) {
          const initialSeconds = (assessment.timeLimitMinutes || 30) * 60;
          setTimeLeftSeconds(initialSeconds);
          setStartTime(Date.now());
        }
      });
    }

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, assessmentId, clearCurrentResult, fetchAssessmentById]);

  // Server-side checkpointing: Disabled by default (serverCheckpointIntervalSeconds = 0)
  useEffect(() => {
    const checkpointInterval = currentAssessment?.serverCheckpointIntervalSeconds ?? 0;
    if (!isOpen || currentResult || loading || checkpointInterval <= 0 || !assessmentId) return;

    const intervalTimer = setInterval(() => {
      api.post(`/assessments/${assessmentId}/checkpoint`, { answers }).catch(() => {});
    }, checkpointInterval * 1000);

    return () => clearInterval(intervalTimer);
  }, [isOpen, currentResult, loading, currentAssessment?.serverCheckpointIntervalSeconds, assessmentId, answers]);

  const executeSubmit = useCallback(async (forcedByViolation = false) => {
    setShowConfirmModal(false);
    setShowTabWarning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const questions = currentAssessment?.questions || [];
    const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    
    // Format answers with questionId and optionId/optionText to evaluate accurately regardless of shuffle order
    const formattedAnswers = Object.entries(answers).map(([qKey, val]) => {
      if (typeof val === 'object' && val !== null) {
        return {
          questionId: val.questionId,
          selectedOptionId: val.selectedOptionId,
          selectedOptionText: val.selectedOptionText,
          questionIndex: val.questionIndex !== undefined ? val.questionIndex : Number(qKey),
          selectedOption: val.selectedOption !== undefined ? val.selectedOption : -1,
        };
      }
      const q = questions[Number(qKey)];
      return {
        questionId: q?._id,
        questionIndex: Number(qKey),
        selectedOption: Number(val),
      };
    });

    const clientSubId =
      submissionIdRef.current ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `sub-${Date.now()}`);
    submissionIdRef.current = clientSubId;

    const res = await submitAssessment(assessmentId, formattedAnswers, timeSpent, clientSubId);
    setIsLocked(false);
    if (res.success && res.status === 'saved') {
      // Clear local IndexedDB/localStorage ONLY after server confirms durable storage
      await clearSavedData();
      if (autoSaveKey) {
        await clearExamState(autoSaveKey);
      }
      if (forcedByViolation) {
        toast.error('Assessment automatically submitted due to tab-switching violations.', { duration: 5000 });
      } else {
        const ptsMsg =
          res.result?.pointsAwarded && res.result.pointsAwarded > 0
            ? ` (+${res.result.pointsAwarded} points awarded!)`
            : '';
        toast.success(`Assessment completed and durably saved!${ptsMsg}`);
      }
    } else if (res.success && res.status === 'pending') {
      toast('Submission queued in server memory. Answers remain safely preserved locally.', {
        icon: '⏳',
        duration: 4000,
      });
    } else {
      toast.error(res.error || 'Failed to submit assessment. Your answers remain safely preserved locally.');
    }
  }, [answers, assessmentId, currentAssessment, startTime, submitAssessment, clearSavedData, autoSaveKey]);

  // Anti-cheat tab visibility and window blur listeners
  useEffect(() => {
    if (!isOpen || currentResult || loading || isLocked) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab was hidden or user switched apps - immediate anti-cheat block
        setIsLocked(true);
        toast.error('You have been blocked for navigating away. Contact Admin.', {
          id: 'tab-switch-block',
          duration: 8000,
        });
      } else {
        if (isMobileMode && wasInterruptedRef.current) {
          wasInterruptedRef.current = false;
        }
      }
    };

    const handleWindowBlur = () => {
      if (isMobileMode) return;
      if (!document.hidden) {
        // App lost focus without switching tab
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= maxStrikes) {
            setIsLocked(true);
            executeSubmit(true);
          } else {
            setShowTabWarning(true);
          }
          return newCount;
        });
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isOpen, currentResult, loading, isLocked, isMobileMode, executeSubmit]);

  // Timer countdown hook with Thundering Herd Submission Jitter Fix
  useEffect(() => {
    if (!isOpen || currentResult || loading || timeLeftRef.current <= 0 || isLocked) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);

          // THUNDERING HERD SUBMISSION FIX:
          // In a room with 300 test-takers, when the auto-submit timer expires, DO NOT send API requests immediately.
          // Jitter delay spreads 300 concurrent submissions over an 8-second window (Math.random() * 8000).
          // This saves Render Free Tier from CPU/OOM crash and MongoDB Atlas M0 from connection starvation.
          const jitterDelayMs = Math.floor(Math.random() * 8000);
          console.log(`[Assessment] Auto-submit timer reached 0. Applying jitter delay of ${jitterDelayMs}ms`);

          toast.error("Time's up! Packaging and auto-submitting your assessment...", {
            id: 'time-up-submit',
            duration: jitterDelayMs + 3000,
          });

          setTimeout(() => {
            executeSubmit(false);
          }, jitterDelayMs);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, currentResult, loading, isLocked, executeSubmit]);

  if (!isOpen) return null;

  const questions = currentAssessment?.questions || [];
  const currentQ = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = timeLeftSeconds > 0 && timeLeftSeconds <= 120; // Last 2 minutes

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optIndex, optId, optText) => {
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [currentQuestionIndex]: {
          questionId: currentQ?._id,
          questionIndex: currentQuestionIndex,
          selectedOptionId: optId || `opt_${optIndex}`,
          selectedOptionText: optText,
          selectedOption: optIndex,
        },
      };
      // Persist in IndexedDB / localStorage on EVERY change
      if (autoSaveKey) {
        saveExamState(autoSaveKey, { answers: updated, submissionId: submissionIdRef.current });
      }
      return updated;
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSafeClose = () => {
    if (!currentResult && answeredCount > 0) {
      setShowExitConfirm(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      onClose();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${currentResult ? 'p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md' : 'p-0 bg-canvas'}`}>
      {/* Permanent Lockout Screen if Student is Blocked for Tab Switch */}
      {isLocked && !currentResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/90 select-none">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl border border-destructive/40 bg-surface/95 shadow-2xl text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 text-red-400">
              <AlertTriangle size={28} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 mb-3">
              Proctoring Violation
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white mb-2">
              Assessment Blocked
            </h3>
            <p className="text-xs sm:text-sm text-red-300/90 mb-6 leading-relaxed">
              You have been blocked for navigating away. Contact Admin.
            </p>
            <Button
              variant="secondary"
              onPress={handleSafeClose}
              className="w-full py-2.5 text-xs font-semibold cursor-pointer rounded-xl"
            >
              Close Assessment
            </Button>
          </div>
        </div>
      )}

      {/* Full-Screen Enforcement Overlay */}
      {!isLocked && !currentResult && !loading && !isFullscreen && (
        <FullScreenEnforcementOverlay
          isFullscreen={isFullscreen}
          onRequestFullscreen={() => {
            const el = document.documentElement;
            if (el.requestFullscreen) {
              el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
            }
          }}
          title="Full Screen Assessment Required"
          description="To ensure exam integrity and proctoring compliance, this assessment must be attended strictly in full screen mode. Navigating away or exiting full screen is strictly monitored."
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className={`relative w-full ${currentResult ? 'max-w-4xl h-[94dvh] rounded-2xl sm:rounded-3xl border border-separator' : 'h-[100dvh] rounded-none border-none'} bg-surface shadow-2xl flex flex-col overflow-hidden`}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        {/* Top Assessment Header */}
        <div className="p-3.5 sm:p-5 md:p-6 border-b border-separator flex items-center justify-between gap-2 sm:gap-4 relative z-10 flex-shrink-0 bg-surface">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <Award size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base font-semibold text-label-primary tracking-tight truncate">
                {currentAssessment?.title || 'Loading assessment...'}
              </h2>
              <p className="text-[11px] text-label-secondary truncate tabular-nums">
                {currentResult ? 'Assessment results & breakdown' : `Question ${currentQuestionIndex + 1} of ${totalQuestions} • Cutoff: ${currentAssessment?.passingScorePercentage}%`}
              </p>
            </div>
          </div>

          {/* Right Header Items: Proctoring Badge, Fullscreen, Timer, Quick Submit & Close */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {!currentResult && (
              <>
                {/* Anti-Cheat Proctoring Badge */}
                <div
                  className={`hidden xs:flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-medium transition-all shrink-0 tabular-nums ${
                    isMobileMode
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : tabSwitchCount === 0
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : tabSwitchCount === 1
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                      : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40 animate-pulse'
                  }`}
                  title={
                    isMobileMode
                      ? 'Mobile Call Protection Active: Phone calls and incoming interruptions will not increase warnings'
                      : 'Anti-cheat proctoring active. Tab switches are strictly monitored.'
                  }
                >
                  {isMobileMode ? (
                    <>
                      <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Call protected</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={13} className={tabSwitchCount > 1 ? 'animate-bounce' : ''} />
                      <span>
                        <span className="hidden sm:inline">Tab switches: </span>
                        <span className="sm:hidden">Switches: </span>
                        {tabSwitchCount} / {maxStrikes}
                      </span>
                    </>
                  )}
                </div>

                {/* Fullscreen Toggle */}
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  onPress={() => {
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen?.().catch(() => {});
                    } else {
                      document.exitFullscreen?.().catch(() => {});
                    }
                  }}
                  className="rounded-xl bg-surface-secondary hover:bg-surface text-label-secondary hover:text-label-primary border border-separator cursor-pointer hidden md:flex shrink-0 min-h-[36px] min-w-[36px]"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </Button>

                {/* Timer */}
                <div
                  className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border transition-all shrink-0 ${
                    isTimeCritical
                      ? 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400 animate-pulse'
                      : 'bg-surface-secondary border-separator text-label-primary'
                  }`}
                >
                  <Clock size={14} className={isTimeCritical ? 'text-red-500' : 'text-accent'} />
                  <span className="font-mono text-xs sm:text-sm font-medium tabular-nums">
                    {formatTime(timeLeftSeconds)}
                  </span>
                </div>

                {/* Always-Visible Direct Submit Button */}
                <Button
                  size="sm"
                  color="success"
                  variant="solid"
                  onPress={() => setShowConfirmModal(true)}
                  className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white shadow-xs transition-all cursor-pointer shrink-0 min-h-[36px]"
                  title="Submit assessment now"
                >
                  <Send size={12} className="sm:w-[13px] sm:h-[13px]" />
                  <span>Submit</span>
                  <span className="hidden xs:inline-block text-[10px] bg-white/20 px-1 rounded font-mono tabular-nums">
                    {answeredCount}/{totalQuestions}
                  </span>
                </Button>
              </>
            )}

            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={handleSafeClose}
              className="rounded-xl bg-surface-secondary hover:bg-surface text-label-secondary hover:text-label-primary border border-separator cursor-pointer shrink-0 min-h-[36px] min-w-[36px]"
              title="Close test"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-10 h-10 rounded-2xl border-2 border-accent border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-label-secondary uppercase tracking-wider font-medium">
              Preparing assessment...
            </p>
          </div>
        ) : currentResult ? (
          /* ========================================================================= */
          /* POST-SUBMISSION SCORE & REVIEW SCREEN */
          /* ========================================================================= */
          <div className="overflow-y-auto custom-scrollbar flex-1 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 relative z-10">
            {/* Score Banner */}
            <div
              className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl border relative overflow-hidden text-center space-y-3 sm:space-y-4 ${
                currentResult.passed
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="inline-flex p-3 sm:p-3.5 rounded-2xl bg-surface border border-separator mx-auto shadow-xs">
                {currentResult.passed ? (
                  <Trophy size={32} className="text-emerald-500" />
                ) : (
                  <AlertTriangle size={32} className="text-amber-500" />
                )}
              </div>

              <div className="space-y-2">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border inline-block ${
                    currentResult.passed
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                  }`}
                >
                  {currentResult.passed ? 'Assessment passed' : 'Needs practice'}
                </span>

                {currentResult.pointsAwarded && currentResult.pointsAwarded > 0 ? (
                  <div className="pt-1 flex items-center justify-center">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium text-xs sm:text-sm tabular-nums">
                      <Award size={15} className="text-amber-500" />
                      <span>+{currentResult.pointsAwarded} club points awarded</span>
                    </div>
                  </div>
                ) : null}

                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-label-primary tabular-nums">
                  {currentResult.score} / {currentResult.totalPoints} points ({currentResult.percentage}%)
                </h3>
                <p className="text-xs sm:text-sm text-label-secondary max-w-prose mx-auto leading-relaxed">
                  {currentResult.passed
                    ? `Outstanding! You achieved ${currentResult.percentage}%, exceeding the ${currentResult.passingScorePercentage}% cutoff requirement.`
                    : `You scored ${currentResult.percentage}%. The passing threshold is ${currentResult.passingScorePercentage}%. Review the explanations below and try again.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-2 text-xs font-medium text-label-secondary tabular-nums">
                <span>Time spent: {formatTime(currentResult.timeSpentSeconds)}</span>
                <span>Total questions: {currentResult.detailedResults.length}</span>
              </div>
            </div>

            {/* Detailed Question Review Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle size={17} className="text-accent shrink-0" />
                <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-label-primary">
                  Answer key & explanations
                </h4>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {currentResult.detailedResults.map((qResult, idx) => (
                  <div
                    key={idx}
                    className={`p-4 sm:p-5 rounded-2xl border space-y-3 transition-all ${
                      qResult.isCorrect
                        ? 'bg-emerald-500/[0.03] border-emerald-500/20'
                        : 'bg-red-500/[0.03] border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {qResult.isCorrect ? (
                          <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                        ) : (
                          <XCircle size={16} className="text-red-500 flex-shrink-0" />
                        )}
                        <span className="text-xs font-medium text-label-secondary uppercase tracking-wider">
                          Question #{idx + 1}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full tabular-nums ${
                          qResult.isCorrect
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {qResult.isCorrect ? `Correct (+${qResult.points || 1})` : 'Incorrect (0)'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-label-primary leading-relaxed break-words">
                      {qResult.questionText}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-surface border border-separator space-y-0.5">
                        <p className="text-[10px] font-medium text-label-secondary uppercase">Your answer:</p>
                        <p className={qResult.isCorrect ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>
                          {qResult.selectedOption >= 0
                            ? `Option ${String.fromCharCode(65 + qResult.selectedOption)}`
                            : 'Unanswered'}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-surface border border-separator space-y-0.5">
                        <p className="text-[10px] font-medium text-label-secondary uppercase">Correct answer:</p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Option {String.fromCharCode(65 + qResult.correctOption)}
                        </p>
                      </div>
                    </div>

                    {qResult.explanation && (
                      <div className="p-3 rounded-xl bg-surface border border-separator text-xs text-label-secondary space-y-1">
                        <span className="font-semibold text-accent block text-[11px] uppercase tracking-wider">Explanation</span>
                        <p className="leading-relaxed font-normal">{qResult.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions for Review Screen */}
            <div className="pt-4 border-t border-separator flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                onPress={() => {
                  clearCurrentResult();
                  setAnswers({});
                  setCurrentQuestionIndex(0);
                  setTimeLeftSeconds((currentAssessment.timeLimitMinutes || 30) * 60);
                  setStartTime(Date.now());
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 w-full sm:w-auto min-h-[42px]"
              >
                <RotateCcw size={14} /> Retake assessment
              </Button>
              <Button
                variant="primary"
                onPress={onClose}
                className="py-2.5 px-6 text-xs font-medium w-full sm:w-auto min-h-[42px]"
              >
                Return to dashboard
              </Button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* LIVE ASSESSMENT TAKING INTERFACE */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col overflow-hidden relative z-10">
            {/* Question Progress Bubbles Bar */}
            <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 bg-surface-secondary/40 border-b border-separator flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar flex-shrink-0">
              {questions.map((_, idx) => {
                const isAnswered = answers[idx] !== undefined;
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-medium transition-all flex items-center justify-center flex-shrink-0 cursor-pointer tabular-nums ${
                      isCurrent
                        ? 'bg-accent text-white shadow-xs'
                        : isAnswered
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-surface text-label-secondary hover:text-label-primary border border-separator'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}

              {/* Direct Jump Submit Pill in Progress Bar */}
              <Button
                size="sm"
                variant="flat"
                color="success"
                onPress={() => setShowConfirmModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 shrink-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer ml-auto min-h-[32px]"
                title="Finish and submit assessment"
              >
                <Send size={11} />
                <span>Submit</span>
              </Button>
            </div>

            {/* Active Question Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              {currentQ ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Question Header & Points */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full tabular-nums">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    <span className="text-[11px] sm:text-xs font-medium text-label-secondary tabular-nums">
                      Worth {currentQ.points || 1} point{(currentQ.points || 1) > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-label-primary leading-snug sm:leading-relaxed break-words tracking-tight">
                    {currentQ.questionText}
                  </h3>

                  {/* Multiple Choice Options */}
                  <div className="space-y-2.5 sm:space-y-3 pt-1 sm:pt-2">
                    {currentQ.options.map((optionItem, optIndex) => {
                      const optText = typeof optionItem === 'object' && optionItem !== null ? optionItem.text : optionItem;
                      const optId = typeof optionItem === 'object' && optionItem !== null ? optionItem.optionId : `opt_${optIndex}`;
                      
                      const currentSelected = answers[currentQuestionIndex];
                      const isSelected =
                        typeof currentSelected === 'object' && currentSelected !== null
                          ? currentSelected.selectedOptionId === optId || currentSelected.selectedOptionText === optText
                          : currentSelected === optIndex;

                      const optionLetter = String.fromCharCode(65 + optIndex);

                      return (
                        <motion.button
                          key={optId || optIndex}
                          whileHover={{ scale: 1.002 }} whileTap={{ scale: 0.97 }}
                          onClick={() => handleSelectOption(optIndex, optId, optText)}
                          className={`w-full min-h-[44px] p-3 sm:p-4 rounded-xl sm:rounded-2xl text-left flex items-center gap-3 sm:gap-4 transition-all duration-150 cursor-pointer border ${
                            isSelected
                              ? 'bg-accent/10 border-accent text-label-primary shadow-xs'
                              : 'bg-surface border-separator text-label-secondary hover:bg-surface-secondary hover:text-label-primary'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all flex-shrink-0 ${
                              isSelected
                                ? 'bg-accent text-white shadow-xs'
                                : 'bg-surface-secondary text-label-secondary'
                            }`}
                          >
                            {optionLetter}
                          </div>

                          <span className="text-xs sm:text-sm font-normal leading-relaxed flex-1 break-words min-w-0">
                            {optText}
                          </span>

                          {isSelected && (
                            <CheckCircle2 size={18} className="text-accent flex-shrink-0" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-label-secondary">No question selected</div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-3 sm:p-4 md:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] border-t border-separator flex items-center justify-between gap-2 sm:gap-3 bg-surface flex-shrink-0">
              <Button
                variant="secondary"
                onPress={handlePrevious}
                isDisabled={currentQuestionIndex === 0}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-medium flex items-center gap-1 sm:gap-1.5 shrink-0 min-h-[38px]"
              >
                <ChevronLeft size={15} />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>

              <div className="text-[11px] sm:text-xs font-medium text-label-secondary text-center px-1 truncate tabular-nums">
                <span className="hidden sm:inline">
                  <span className="text-accent font-semibold">{answeredCount}</span> of {totalQuestions} answered
                </span>
                <span className="sm:hidden">
                  <span className="text-accent font-semibold">{answeredCount}</span>/{totalQuestions} answered
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {currentQuestionIndex < totalQuestions - 1 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    color="success"
                    onPress={() => setShowConfirmModal(true)}
                    className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1 min-h-[38px]"
                    title="Submit assessment now"
                  >
                    <Send size={12} />
                    <span>Submit</span>
                  </Button>
                )}

                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button
                    variant="primary"
                    onPress={handleNext}
                    className="py-2 px-4 text-xs font-medium flex items-center gap-1 min-h-[38px]"
                  >
                    <span>Next</span> <ChevronRight size={15} />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    color="success"
                    onPress={() => setShowConfirmModal(true)}
                    className="py-2 px-5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 min-h-[38px]"
                  >
                    <Send size={13} />
                    <span className="hidden sm:inline">Submit assessment</span>
                    <span className="sm:hidden">Submit</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Submission Dialog */}
        <AnimatePresence>
          {showConfirmModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm sm:max-w-md bg-surface border border-separator p-5 sm:p-7 space-y-4 sm:space-y-5 text-center shadow-2xl rounded-2xl sm:rounded-3xl max-h-[90dvh] overflow-y-auto"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mx-auto">
                  <Send size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-label-primary tracking-tight">Ready to submit?</h3>
                  <p className="text-xs sm:text-[13px] text-label-secondary mt-1.5 leading-relaxed tabular-nums">
                    You have completed{' '}
                    <span className="text-label-primary font-medium">{answeredCount}</span> of{' '}
                    <span className="text-label-primary font-medium">{totalQuestions}</span> questions.
                    {answeredCount < totalQuestions && (
                      <span className="block text-amber-500 mt-1 font-medium">
                        Notice: {totalQuestions - answeredCount} question(s) remain unanswered.
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onPress={() => setShowConfirmModal(false)}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-medium min-h-[42px]"
                  >
                    Back to test
                  </Button>
                  <Button
                    variant="primary"
                    color="success"
                    onPress={() => executeSubmit(false)}
                    isDisabled={submitting}
                    className="w-full sm:flex-1 py-2.5 px-4 text-xs font-medium min-h-[42px]"
                  >
                    {submitting ? 'Submitting...' : 'Yes, submit now'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Anti-Cheat Tab Switch Warning Modal (Strikes 1 & 2) */}
        <AnimatePresence>
          {showTabWarning && !isLocked && !currentResult && (
            <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm sm:max-w-md bg-surface border border-amber-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center space-y-4 sm:space-y-5 shadow-2xl relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto">
                  <ShieldAlert size={28} />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30 tabular-nums">
                    Security warning: Strike {tabSwitchCount} of {maxStrikes}
                  </span>
                  <h3 className="text-lg sm:text-xl font-semibold text-label-primary tracking-tight mt-1.5 sm:mt-2">
                    Tab switching is restricted
                  </h3>
                  <p className="text-xs sm:text-[13px] text-label-secondary leading-relaxed">
                    You have navigated away from the assessment window. Switching tabs, minimizing windows, or running secondary apps during this test is strictly disallowed.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-secondary border border-separator text-xs text-left space-y-1.5 font-normal">
                  <p className="text-destructive font-medium flex items-center gap-1.5 tabular-nums">
                    <AlertTriangle size={14} /> Strike {tabSwitchCount} recorded
                  </p>
                  <p className="text-label-secondary text-[11px] leading-relaxed tabular-nums">
                    If you switch tabs {maxStrikes - tabSwitchCount} more time{maxStrikes - tabSwitchCount > 1 ? 's' : ''}, your assessment will be <strong>automatically locked and submitted</strong> with current answers.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  onPress={() => setShowTabWarning(false)}
                  className="w-full py-2.5 text-xs font-medium min-h-[42px]"
                >
                  I understand, return to test
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Anti-Cheat Max Violations Auto-Submit Modal (Strike 3) */}
        <AnimatePresence>
          {isLocked && (
            <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm sm:max-w-md bg-surface border border-red-500/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center space-y-4 sm:space-y-5 shadow-2xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-destructive mx-auto">
                  <Lock size={28} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-semibold text-label-primary tracking-tight">
                    Assessment session locked
                  </h3>
                  <p className="text-xs text-destructive font-medium uppercase tracking-wider tabular-nums">
                    Exceeded maximum {maxStrikes} tab switch violations
                  </p>
                  <p className="text-xs sm:text-[13px] text-label-secondary mt-2 leading-relaxed">
                    You have repeatedly left the test window. Your session has been locked and your current answers are being submitted to the evaluator.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-label-secondary">
                  <Loader2 size={16} className="animate-spin text-destructive" />
                  <span>Finalizing submission...</span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Safe Exit Confirmation Modal */}
        <AnimatePresence>
          {showExitConfirm && (
            <div className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm sm:max-w-md bg-surface border border-separator p-5 sm:p-6 rounded-2xl sm:rounded-3xl text-center space-y-4 shadow-2xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-destructive flex items-center justify-center mx-auto">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-label-primary tracking-tight">Exit assessment?</h3>
                  <p className="text-xs sm:text-[13px] text-label-secondary mt-1 leading-relaxed">
                    Your test timer is running. If you leave now without submitting, your answers will not be saved.
                  </p>
                </div>
                <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onPress={() => setShowExitConfirm(false)}
                    className="w-full sm:flex-1 py-2.5 rounded-xl text-xs font-medium min-h-[42px]"
                  >
                    Continue test
                  </Button>
                  <Button
                    variant="danger"
                    onPress={() => {
                      setShowExitConfirm(false);
                      if (document.fullscreenElement) {
                        document.exitFullscreen().catch(() => {});
                      }
                      onClose();
                    }}
                    className="w-full sm:flex-1 py-2.5 rounded-xl text-xs font-medium min-h-[42px]"
                  >
                    Exit anyway
                  </Button>
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
