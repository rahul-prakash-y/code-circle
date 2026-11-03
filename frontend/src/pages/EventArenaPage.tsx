import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Send,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
  HelpCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Trophy,
  Loader2,
  Sparkles,
  ShieldCheck,
  Check,
  Award,
  Layers,
  Building,
  Bus,
  Palette,
  ExternalLink,
  Image as ImageIcon,
  Maximize2,
  FileText,
  CheckCircle,
  Eye,
  Info,
  X,
  Users,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useEventArenaStore, {
  ArenaAssessment,
  ArenaMcqQuestion,
  ArenaCodingProblem,
} from '../store/useEventArenaStore';

const MONACO_LANG_MAP: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  cpp: 'cpp',
  java: 'java',
  c: 'c',
};

const LANG_DISPLAY_NAMES: Record<string, string> = {
  python: 'Python 3',
  javascript: 'JavaScript (Node.js)',
  cpp: 'C++ (GCC)',
  java: 'Java (OpenJDK)',
  c: 'C (GCC)',
};

export const EventArenaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    fetchAssessments,
    fetchStudentAssessmentData,
    startAssessmentSession,
    runAssessmentCode,
    submitAssessmentProblem,
    submitAssessmentFinal,
    submitAssessmentDesign,
    assessments,
    selectedAssessment,
    currentEvent,
    studentMcqs,
    studentCoding,
    studentDesignChallenge,
    studentTeam,
    submission,
    loading,
    actionLoading,
  } = useEventArenaStore();

  // Active Assessment State: null means we are at the Assessment Hub / List view
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);

  // Anti-Cheat: 5% mark reduction per tab switch (No disqualification)
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [studentFigmaLink, setStudentFigmaLink] = useState('');
  const [studentDesignNotes, setStudentDesignNotes] = useState('');
  const [previewReferenceImg, setPreviewReferenceImg] = useState<string | null>(null);

  // Arena session state within active assessment
  const [selectedType, setSelectedType] = useState<'mcq' | 'coding'>('mcq');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Student answers state
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [codingCodes, setCodingCodes] = useState<Record<string, { code: string; language: string }>>({});
  const [currentLanguage, setCurrentLanguage] = useState('python');

  // Execution & Terminal state
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmittingProblem, setIsSubmittingProblem] = useState(false);
  const [runResults, setRunResults] = useState<any[] | null>(null);
  const [problemStatusMap, setProblemStatusMap] = useState<Record<string, any>>({});

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState(3600);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [finalResultModal, setFinalResultModal] = useState<any | null>(null);

  // Initial load: Fetch all assessments for this event
  useEffect(() => {
    if (id) {
      fetchAssessments(id);
    }
  }, [id]);

  // When activeAssessmentId changes, load that assessment's data and start session
  useEffect(() => {
    if (id && activeAssessmentId) {
      fetchStudentAssessmentData(id, activeAssessmentId).then((data) => {
        if (!data?.submission || data.submission.status === 'IN_PROGRESS') {
          startAssessmentSession(id, activeAssessmentId);
        }
        if (
          data?.submission?.status === 'SUBMITTED' ||
          data?.submission?.status === 'AUTO_SUBMITTED'
        ) {
          setFinalResultModal(data.submission);
        }
      });
    }
  }, [id, activeAssessmentId]);

    // Anti-cheat tab switch listener (deducts 5% per switch, no disqualification)
  useEffect(() => {
    if (!activeAssessmentId || submission?.status === 'SUBMITTED' || finalResultModal) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          setShowTabWarning(true);
          toast.error(`Tab switch detected! -5% marks deducted (Total: -${next * 5}%)`, {
            duration: 4000,
            icon: '⚠️',
          });
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [activeAssessmentId, submission?.status, finalResultModal]);

  // Sync starter codes and existing answers
  useEffect(() => {
    if (studentMcqs.length > 0 && selectedType === 'mcq' && selectedIndex >= studentMcqs.length) {
      setSelectedIndex(0);
    }
    if (studentMcqs.length === 0 && studentCoding.length > 0 && selectedType === 'mcq') {
      setSelectedType('coding');
      setSelectedIndex(0);
    }

    if (studentCoding.length > 0) {
      const initialCodes: Record<string, { code: string; language: string }> = {};
      studentCoding.forEach((p) => {
        if (p._id) {
          const starterMap = p.starterCode || {};
          initialCodes[p._id] = {
            code: starterMap[currentLanguage] || '# Write your solution here\n',
            language: currentLanguage,
          };
        }
      });
      setCodingCodes((prev) => ({ ...initialCodes, ...prev }));
    }
  }, [studentMcqs, studentCoding]);

  // Synchronize timer based on submission startedAt
  useEffect(() => {
    if (selectedAssessment && submission) {
      const totalSeconds = (selectedAssessment.durationMinutes || 60) * 60;
      const started = new Date(submission.startedAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - started) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      setRemainingSeconds(remaining);
    }
  }, [selectedAssessment, submission]);

  // Countdown timer loop
  useEffect(() => {
    if (!activeAssessmentId || submission?.status === 'SUBMITTED' || finalResultModal) return;
    if (remainingSeconds <= 0) {
      handleFinalSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, submission?.status, finalResultModal, activeAssessmentId]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Sync Figma submission state when submission changes
  useEffect(() => {
    if (submission?.designSubmission) {
      if (submission.designSubmission.figmaFileUrl) {
        setStudentFigmaLink(submission.designSubmission.figmaFileUrl);
      }
      if (submission.designSubmission.notes) {
        setStudentDesignNotes(submission.designSubmission.notes);
      }
    }
  }, [submission]);

  const currentMcq = studentMcqs[selectedIndex];
  const currentCoding = studentCoding[selectedIndex];

  const handleSelectMcqOption = (questionId: string, optionIndex: number) => {
    setMcqAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleRunCode = async () => {
    if (!id || !activeAssessmentId || !currentCoding?._id) return;
    const currentCode = codingCodes[currentCoding._id]?.code;
    if (!currentCode) return toast.error('Please enter some code to execute');

    setIsExecuting(true);
    setRunResults(null);
    try {
      const res = await runAssessmentCode(id, activeAssessmentId, currentCoding._id, {
        code: currentCode,
        language: currentLanguage,
      });
      if (res && res.testCaseResults) {
        setRunResults(res.testCaseResults);
        if (res.allPassed) {
          toast.success('All public test cases passed! 🎉');
        } else {
          toast.error('Some test cases failed. Check output.');
        }
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmitProblem = async () => {
    if (!id || !activeAssessmentId || !currentCoding?._id) return;
    const currentCode = codingCodes[currentCoding._id]?.code;
    if (!currentCode) return toast.error('Please enter some code to submit');

    setIsSubmittingProblem(true);
    try {
      const res = await submitAssessmentProblem(id, activeAssessmentId, currentCoding._id, {
        code: currentCode,
        language: currentLanguage,
      });
      if (res) {
        setProblemStatusMap((prev) => ({
          ...prev,
          [currentCoding._id!]: res,
        }));
        if (res.status === 'ACCEPTED') {
          toast.success(`Challenge Solved! +${res.pointsEarned} Points`);
        } else {
          toast.error(`Submitted: ${res.passedCount}/${res.totalTestCases} Test cases passed`);
        }
      }
    } finally {
      setIsSubmittingProblem(false);
    }
  };

  const handleFinalSubmit = async (isAuto = false) => {
    if (!id || !activeAssessmentId) return;
    const formattedMcqAnswers = Object.entries(mcqAnswers).map(([qId, ansIdx]) => ({
      questionId: qId,
      selectedOption: ansIdx,
    }));

    try {
      const res = await submitAssessmentFinal(id, activeAssessmentId, {
        mcqAnswers: formattedMcqAnswers,
        tabSwitchCount,
      });
      if (res) {
        setShowSubmitConfirm(false);
        setFinalResultModal(res.results || res);
        toast.success(isAuto ? 'Time up! Assessment auto-submitted.' : 'Assessment submitted successfully!');
      }
    } catch {
      // Handled in store
    }
  };

  const handleStudentDesignSubmit = async () => {
    if (!id || !activeAssessmentId) return;
    if (!studentFigmaLink.trim()) {
      return toast.error('Please paste your Figma file or prototype link.');
    }
    try {
      await submitAssessmentDesign(id, activeAssessmentId, {
        figmaFileUrl: studentFigmaLink.trim(),
        notes: studentDesignNotes.trim(),
      });
    } catch {
      // Handled in store
    }
  };

  const handleReturnToHub = () => {
    setFinalResultModal(null);
    setActiveAssessmentId(null);
    setTabSwitchCount(0);
    setShowTabWarning(false);
    if (id) fetchAssessments(id);
  };

  // -------------------------------------------------------------------------
  // VIEW 1: ARENA ASSESSMENTS HUB / ROUND PICKER (When activeAssessmentId is null)
  // -------------------------------------------------------------------------
  if (!activeAssessmentId) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0A0D] text-white flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b border-white/10 px-4 sm:px-10 flex items-center justify-between shrink-0 bg-[#0F0F14]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/events')}
              className="p-2 min-h-[38px] rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Events</span>
            </button>
            <div className="h-5 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles size={16} />
              </span>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">Event Arena Hub</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {assessments.length} {assessments.length === 1 ? 'Assessment' : 'Assessments'} Available
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <div className="max-w-6xl w-full mx-auto p-4 sm:p-10 space-y-6 sm:space-y-8 flex-1">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <ShieldCheck size={14} />
              <span>Official Event Competition Arena</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {currentEvent?.title || 'Event Arena Assessments'}
            </h2>
            <p className="text-xs sm:text-sm text-white/60 max-w-2xl leading-relaxed">
              Complete each assessment round created by the event coordinators and faculty. Your scores,
              code test-case executions, and performance will be tracked on the live leaderboard.
            </p>
          </div>

          {/* Assessment Cards Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-purple-400" />
              <p className="text-xs text-white/50">Loading event assessments...</p>
            </div>
          ) : assessments.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center space-y-3">
              <Layers size={36} className="mx-auto text-white/30" />
              <h3 className="text-base font-bold text-white">No Assessments Active</h3>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                The event admins have not published any assessments yet. Please check back when the round goes live.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments.map((asm, idx) => {
                const sub = asm.submission;
                const isCompleted = sub?.status === 'SUBMITTED' || sub?.status === 'AUTO_SUBMITTED';
                const isInProgress = sub?.status === 'IN_PROGRESS';

                // Qualification check for Round > 1
                const prevRound = idx > 0 ? assessments[idx - 1] : null;
                const prevCompleted = prevRound?.submission?.status === 'SUBMITTED' || prevRound?.submission?.status === 'AUTO_SUBMITTED';
                const hasCutoff = (asm.qualificationCutoffRank || 0) > 0;
                // If previous round isn't completed, lock next round
                const isLockedBySequence = idx > 0 && !prevCompleted && !isCompleted;

                return (
                  <motion.div
                    key={asm._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="rounded-3xl bg-[#121217] border border-white/10 hover:border-purple-500/40 p-5 sm:p-6 flex flex-col justify-between space-y-5 transition-all shadow-xl group relative overflow-hidden"
                  >
                    {/* Top Glow on hover */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-white/10 text-white/80 border border-white/10">
                          Round {idx + 1} • {asm.type}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {asm.isTeamMode && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                              <Users size={11} />
                              <span>Team Mode ({asm.teamSize || 2})</span>
                            </span>
                          )}

                          {isCompleted ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 size={11} />
                              <span>Completed</span>
                            </span>
                          ) : isInProgress ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Clock size={11} />
                              <span>In Progress</span>
                            </span>
                          ) : isLockedBySequence ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/50 border border-white/10 flex items-center gap-1">
                              <Lock size={11} />
                              <span>Locked</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                              Available
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Qualification info notice if applicable */}
                      {hasCutoff && (
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2 text-[11px] text-purple-300">
                          <Trophy size={13} className="text-amber-400 shrink-0" />
                          <span>Top {asm.qualificationCutoffRank} participants from Round {idx} qualify</span>
                        </div>
                      )}

                      {/* Title & Desc */}
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                          {asm.title}
                        </h3>
                        {asm.description && (
                          <p className="text-xs text-white/60 mt-1 line-clamp-2 leading-relaxed">
                            {asm.description}
                          </p>
                        )}
                      </div>

                      {/* Stats Pills */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-white/70">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-1.5">
                          <Clock size={12} className="text-purple-400 shrink-0" />
                          <span>{asm.durationMinutes || 60} Mins</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-1.5">
                          <Trophy size={12} className="text-amber-400 shrink-0" />
                          <span>{asm.totalPoints || 100} Pts</span>
                        </div>
                      </div>

                      {/* Question Breakdown */}
                      <div className="flex items-center gap-3 text-xs text-white/50 pt-1">
                        {asm.type === 'UI_UX' ? (
                          <span className="text-pink-400 font-semibold flex items-center gap-1.5">
                            <Palette size={13} />
                            <span>🎨 UI/UX Figma Design Challenge</span>
                          </span>
                        ) : (
                          <>
                            {asm.type !== 'CODING' && <span>{asm.mcqCount || 0} MCQs</span>}
                            {asm.type === 'HYBRID' && <span>•</span>}
                            {asm.type !== 'MCQ' && <span>{asm.codingCount || 0} Coding Problems</span>}
                          </>
                        )}
                      </div>

                      {/* Score Result if Completed */}
                      {isCompleted && sub && (
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                          <div className="flex justify-between items-center text-white font-bold">
                            <span>Your Score:</span>
                            <span className="font-mono text-emerald-400">
                              {sub.totalScore} / {sub.maxPossibleScore} ({sub.scorePercentage}%)
                            </span>
                          </div>
                          <p className="text-[10px] text-white/60">
                            Status: <span className="font-bold text-emerald-400">{sub.isPassed ? 'Passed ✓' : 'Participated'}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {isCompleted ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAssessmentId(asm._id);
                          }}
                          className="w-full py-2.5 min-h-[42px] rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Trophy size={13} className="text-amber-400" />
                          <span>View Scorecard</span>
                        </button>
                      ) : isLockedBySequence ? (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 min-h-[42px] rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <Lock size={13} />
                          <span>Complete Round {idx} First</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAssessmentId(asm._id);
                          }}
                          className="w-full py-2.5 min-h-[42px] rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Play size={13} />
                          <span>{isInProgress ? 'Resume Assessment' : 'Start Assessment'}</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // VIEW 2: FULLSCREEN ASSESSMENT WORKSPACE (When activeAssessmentId is chosen)
  // -------------------------------------------------------------------------
  return (
    <div className="h-[100dvh] min-h-[100dvh] w-full flex flex-col bg-[#0A0A0D] text-white overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="min-h-14 py-2 border-b border-white/10 px-3 sm:px-6 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shrink-0 bg-[#0F0F14]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={handleReturnToHub}
            className="px-2.5 py-1.5 min-h-[36px] rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">All Rounds</span>
          </button>
          <div className="h-4 w-[1px] bg-white/10 shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Sparkles size={14} />
            </span>
            <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[120px] sm:max-w-md">
              {selectedAssessment?.title || currentEvent?.title || 'Arena Assessment'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase shrink-0">
              {selectedAssessment?.type || 'HYBRID'}
            </span>
            {studentTeam && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1 shrink-0">
                <Users size={11} />
                <span>Team: {studentTeam.name}</span>
              </span>
            )}
          </div>
        </div>

        {/* Live Timer & Submit */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {tabSwitchCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 min-h-[36px] rounded-xl text-xs font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <ShieldAlert size={14} className="animate-bounce" />
              <span>{tabSwitchCount} Switches (-{tabSwitchCount * 5}%)</span>
            </div>
          )}

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-mono font-bold border transition-colors ${
              remainingSeconds < 300
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 animate-pulse'
                : 'bg-white/5 border-white/10 text-white/90'
            }`}
          >
            <Clock size={13} className={remainingSeconds < 300 ? 'text-rose-400' : 'text-purple-400'} />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitConfirm(true)}
            className="px-3.5 sm:px-4 py-1.5 min-h-[36px] rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send size={13} />
            <span>Finish Round</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      {selectedAssessment?.type === 'UI_UX' ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#0A0A0D]">
          {/* Left Column: Design Brief & Reference Mockup */}
          <div className="w-full lg:w-1/2 border-r border-white/10 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#0A0A0D]">
            {/* Header info */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <Palette size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Design Challenge Brief</h2>
                  <p className="text-[11px] text-white/50">UI/UX Design & Prototype Specification</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/25 text-pink-300 text-xs font-bold">
                  {studentDesignChallenge?.totalPoints || selectedAssessment.totalPoints || 100} Points
                </span>
              </div>
            </div>

            {/* Reference Mockup Image */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-purple-400" />
                  <span>Reference Design Mockup</span>
                </label>
                {studentDesignChallenge?.referenceImageUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewReferenceImg(studentDesignChallenge.referenceImageUrl || null)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer py-1"
                  >
                    <Maximize2 size={12} />
                    <span>Enlarge</span>
                  </button>
                )}
              </div>

              {studentDesignChallenge?.referenceImageUrl ? (
                <div
                  onClick={() => setPreviewReferenceImg(studentDesignChallenge.referenceImageUrl || null)}
                  className="group relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 cursor-zoom-in hover:border-purple-500/40 transition-all max-h-80 flex items-center justify-center"
                >
                  <img
                    src={studentDesignChallenge.referenceImageUrl}
                    alt="Design Challenge Reference Mockup"
                    className="w-full h-full object-contain max-h-80 group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white font-semibold text-xs transition-opacity backdrop-blur-[2px]">
                    <Maximize2 size={16} />
                    <span>Click to Zoom / Lightbox</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-white/5 border border-dashed border-white/15 text-center text-white/40 space-y-1.5">
                  <ImageIcon size={28} className="mx-auto text-white/20" />
                  <p className="text-xs font-semibold text-white/60">No Reference Image Provided</p>
                  <p className="text-[11px] text-white/40">Refer to the problem statement and deliverables below to craft your design.</p>
                </div>
              )}
            </div>

            {/* Starter Figma Kit Link */}
            {studentDesignChallenge?.figmaStarterUrl && (
              <a
                href={studentDesignChallenge.figmaStarterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent border border-purple-500/25 hover:border-purple-500/45 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                    F
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                      Starter Figma Template / Design Kit
                    </p>
                    <p className="text-[10px] text-white/50">Duplicate or copy components to kickstart your work</p>
                  </div>
                </div>
                <ExternalLink size={14} className="text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            )}

            {/* Problem Statement */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText size={13} className="text-blue-400" />
                <span>Problem Statement & Brief</span>
              </label>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 leading-relaxed whitespace-pre-wrap">
                {studentDesignChallenge?.problemStatement || 'No challenge description provided.'}
              </div>
            </div>

            {/* Expected Deliverables */}
            {studentDesignChallenge?.deliverables && studentDesignChallenge.deliverables.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-emerald-400" />
                  <span>Expected Deliverables</span>
                </label>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  {studentDesignChallenge.deliverables.map((del, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-white/80">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{del}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rubric / Evaluation Criteria */}
            {studentDesignChallenge?.rubric && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Info size={13} className="text-amber-400" />
                  <span>Evaluation Criteria & Guidelines</span>
                </label>
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/80 leading-relaxed whitespace-pre-wrap">
                  {studentDesignChallenge.rubric}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Submission & Live Figma Interactive Embed */}
          <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#0D0D11]">
            {/* Header & Status */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h2 className="text-sm font-bold text-white">Your Figma Submission</h2>
                <p className="text-[11px] text-white/50">Submit your prototype link for evaluation</p>
              </div>

              {submission?.designSubmission?.isEvaluated ? (
                <div className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <Award size={13} />
                  <span>Graded: {submission.designSubmission.pointsEarned} / {studentDesignChallenge?.totalPoints || 100} pts</span>
                </div>
              ) : submission?.designSubmission?.submittedAt ? (
                <div className="px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle size={13} />
                  <span>Submitted</span>
                </div>
              ) : (
                <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                  In Progress
                </div>
              )}
            </div>

            {/* Faculty Feedback Banner if evaluated */}
            {submission?.designSubmission?.isEvaluated && submission.designSubmission.feedback && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Award size={13} />
                  <span>Faculty Feedback & Review</span>
                </p>
                <p className="text-xs text-white/80 leading-relaxed">
                  {submission.designSubmission.feedback}
                </p>
              </div>
            )}

            {/* Figma Link & Notes Form */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5 mb-1.5">
                  <ExternalLink size={13} className="text-purple-400" />
                  <span>Figma File / Prototype Share Link</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  value={studentFigmaLink}
                  onChange={(e) => setStudentFigmaLink(e.target.value)}
                  placeholder="https://www.figma.com/file/... or /design/... or /proto/..."
                  className="w-full px-3.5 py-2.5 min-h-[42px] rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-purple-500 font-mono transition-all"
                />
                <p className="text-[10px] text-white/40 mt-1 flex items-center gap-1">
                  <Info size={11} className="text-white/40" />
                  <span>Make sure Figma permissions are set to <strong>"Anyone with the link can view"</strong></span>
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5 mb-1.5">
                  <FileText size={13} className="text-blue-400" />
                  <span>Design Rationale & Notes</span>
                  <span className="text-white/40 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={studentDesignNotes}
                  onChange={(e) => setStudentDesignNotes(e.target.value)}
                  placeholder="Explain your design thinking, component architecture, color choices, and interaction user flow..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-all resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-white/50">
                  {submission?.designSubmission?.submittedAt ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle size={12} /> Previously submitted at {new Date(submission.designSubmission.submittedAt).toLocaleTimeString()}. Updates allowed anytime.
                    </span>
                  ) : (
                    <span>Click submit when your Figma design is ready.</span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleStudentDesignSubmit}
                  className="px-5 py-2.5 min-h-[42px] rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>{submission?.designSubmission?.submittedAt ? 'Update Submission' : 'Submit Figma Link'}</span>
                </button>
              </div>
            </div>

            {/* Live Interactive Figma Embed */}
            <div className="flex-1 min-h-[380px] sm:min-h-[440px] flex flex-col rounded-2xl bg-black/40 border border-white/10 overflow-hidden shadow-inner">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#121216]">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${studentFigmaLink.trim().includes('figma.com') ? 'bg-purple-500 animate-pulse' : 'bg-white/20'}`} />
                  <span className="text-xs font-bold text-white">Live Figma Prototype Preview</span>
                </div>
                {studentFigmaLink.trim().includes('figma.com') && (
                  <a
                    href={studentFigmaLink.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink size={12} />
                    <span>Open in Figma</span>
                  </a>
                )}
              </div>

              {studentFigmaLink.trim().includes('figma.com') ? (
                <div className="flex-1 w-full min-h-[380px] sm:min-h-[440px] relative bg-black">
                  <iframe
                    title="Student Figma Submission Preview"
                    src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(studentFigmaLink.trim())}`}
                    className="w-full h-full min-h-[380px] sm:min-h-[440px] border-0"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/40 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400">
                    <Palette size={26} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/70">No Figma Link Provided Yet</p>
                    <p className="text-[11px] text-white/40 max-w-sm mt-1">
                      Enter your public Figma share link in the field above to interact with and preview your design directly inside the arena.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left / Top Navigation Palette (MCQ vs Coding & Question Buttons) */}
          <div className="w-full md:w-56 lg:w-64 border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-[#0D0D11] shrink-0">
            {/* Section Switcher Tabs (MCQ vs Coding) */}
            <div className="p-2.5 sm:p-3 border-b border-white/10 flex gap-1.5 bg-[#121216]">
              {studentMcqs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType('mcq');
                    setSelectedIndex(0);
                  }}
                  className={`flex-1 py-2 min-h-[36px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedType === 'mcq'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <HelpCircle size={13} />
                  <span>MCQs ({studentMcqs.length})</span>
                </button>
              )}

              {studentCoding.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType('coding');
                    setSelectedIndex(0);
                  }}
                  className={`flex-1 py-2 min-h-[36px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedType === 'coding'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Code2 size={13} />
                  <span>Coding ({studentCoding.length})</span>
                </button>
              )}
            </div>

            {/* Question Palette Grid (Horizontal scroll on mobile, vertical grid on desktop) */}
            <div className="p-3 md:p-4 space-y-2 md:space-y-4 md:flex-1 md:overflow-y-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 hidden md:block">
                {selectedType === 'mcq' ? 'Questions' : 'Challenges'}
              </span>

              <div className="flex md:grid md:grid-cols-4 gap-2 overflow-x-auto custom-scrollbar touch-pan-x pb-1 md:pb-0">
                {selectedType === 'mcq'
                  ? studentMcqs.map((q, idx) => {
                      const isAnswered = q._id && mcqAnswers[q._id] !== undefined;
                      const isCurrent = selectedIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedIndex(idx)}
                          className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                            isCurrent
                              ? 'ring-2 ring-purple-400 bg-purple-600 text-white'
                              : isAnswered
                              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                              : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })
                  : studentCoding.map((p, idx) => {
                      const isPassed = p._id && problemStatusMap[p._id]?.status === 'ACCEPTED';
                      const isCurrent = selectedIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedIndex(idx)}
                          className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                            isCurrent
                              ? 'ring-2 ring-blue-400 bg-blue-600 text-white'
                              : isPassed
                              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                              : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
              </div>
            </div>
          </div>

          {/* Center / Right Content Panel */}
          {selectedType === 'mcq' && currentMcq && (
            <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 md:p-10 bg-[#0F0F14]">
              <div className="max-w-3xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    Question {selectedIndex + 1} of {studentMcqs.length}
                  </span>
                  <span className="text-xs font-mono text-white/60">
                    {currentMcq.points || 10} Points
                  </span>
                </div>

                <div className="p-4 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed break-words">
                    {currentMcq.question}
                  </h3>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentMcq.options.map((opt, optIdx) => {
                    const isSelected =
                      currentMcq._id && mcqAnswers[currentMcq._id] === optIdx;
                    return (
                      <div
                        key={optIdx}
                        onClick={() => currentMcq._id && handleSelectMcqOption(currentMcq._id, optIdx)}
                        className={`p-3.5 sm:p-4 min-h-[46px] rounded-xl border flex items-center gap-3.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/15'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-white/80 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 border ${
                            isSelected
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'border-white/20 text-white/60'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="text-xs sm:text-sm font-medium leading-relaxed break-words min-w-0 flex-1">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Next/Prev Navigation */}
                <div className="pt-6 flex justify-between">
                  <button
                    type="button"
                    disabled={selectedIndex === 0}
                    onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold text-white/70 hover:bg-white/10 disabled:opacity-30 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={selectedIndex >= studentMcqs.length - 1}
                    onClick={() => setSelectedIndex((prev) => Math.min(studentMcqs.length - 1, prev + 1))}
                    className="px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold text-white/70 hover:bg-white/10 disabled:opacity-30 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedType === 'coding' && currentCoding && (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Left Column: Problem Statement */}
              <div className="w-full lg:w-1/2 overflow-y-auto p-4 sm:p-6 space-y-5 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0E0E12] max-h-72 lg:max-h-none shrink-0 lg:shrink">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      Challenge {selectedIndex + 1}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        currentCoding.difficulty === 'Easy'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : currentCoding.difficulty === 'Hard'
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {currentCoding.difficulty}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-white/60">
                    {currentCoding.points || 30} Points
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">{currentCoding.title}</h3>
                  <p className="text-xs text-white/80 mt-2 leading-relaxed whitespace-pre-line">
                    {currentCoding.description}
                  </p>
                </div>

                {currentCoding.inputFormat && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white/80">Input Format</h4>
                    <p className="text-xs text-white/60 font-mono bg-white/5 p-2.5 rounded-xl border border-white/5">
                      {currentCoding.inputFormat}
                    </p>
                  </div>
                )}

                {currentCoding.outputFormat && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white/80">Output Format</h4>
                    <p className="text-xs text-white/60 font-mono bg-white/5 p-2.5 rounded-xl border border-white/5">
                      {currentCoding.outputFormat}
                    </p>
                  </div>
                )}

                {/* Sample I/O */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-bold text-white/70">Sample Input</h4>
                    <pre className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-emerald-400 overflow-x-auto">
                      {currentCoding.sampleInput || '(No input required)'}
                    </pre>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-bold text-white/70">Sample Output</h4>
                    <pre className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-emerald-400 overflow-x-auto">
                      {currentCoding.sampleOutput || ''}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Right Column: Monaco Code Editor & Terminal */}
              <div className="w-full lg:w-1/2 flex flex-col flex-1 bg-[#111114] min-h-[320px]">
                {/* Language Toolbar */}
                <div className="h-11 px-3 sm:px-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#141418]">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[11px] font-bold text-white/60 hidden sm:inline">Language:</span>
                    <select
                      value={currentLanguage}
                      onChange={(e) => setCurrentLanguage(e.target.value)}
                      className="px-2 sm:px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white outline-none cursor-pointer"
                    >
                      {['python', 'javascript', 'cpp', 'java', 'c'].map((lang) => (
                        <option key={lang} value={lang} className="bg-[#1A1A1E]">
                          {LANG_DISPLAY_NAMES[lang]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      disabled={isExecuting}
                      onClick={handleRunCode}
                      className="px-2.5 sm:px-3 py-1.5 min-h-[34px] rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isExecuting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                      <span>Run</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmittingProblem}
                      onClick={handleSubmitProblem}
                      className="px-3 sm:px-3.5 py-1.5 min-h-[34px] rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingProblem ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Send size={12} />
                      )}
                      <span>Submit</span>
                    </button>
                  </div>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1 overflow-hidden min-h-[200px]">
                  <Editor
                    height="100%"
                    language={MONACO_LANG_MAP[currentLanguage] || 'python'}
                    theme="vs-dark"
                    value={
                      currentCoding._id && codingCodes[currentCoding._id]
                        ? codingCodes[currentCoding._id].code
                        : '# Write solution here\n'
                    }
                    onChange={(val) => {
                      if (currentCoding._id) {
                        setCodingCodes((prev) => ({
                          ...prev,
                          [currentCoding._id!]: {
                            code: val || '',
                            language: currentLanguage,
                          },
                        }));
                      }
                    }}
                    options={{
                      fontSize: 13,
                      fontFamily: 'Fira Code, Menlo, Monaco, monospace',
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      lineNumbers: 'on',
                      tabSize: 4,
                    }}
                  />
                </div>

                {/* Terminal / Run Results Drawer */}
                {runResults && (
                  <div className="h-44 border-t border-white/10 bg-[#0C0C0E] p-3 overflow-y-auto space-y-2 shrink-0 font-mono text-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <span className="font-bold text-white/70 flex items-center gap-1.5">
                        <Terminal size={13} />
                        <span>Execution Output</span>
                      </span>
                      <button
                        onClick={() => setRunResults(null)}
                        className="text-white/40 hover:text-white p-1"
                      >
                        ✕
                      </button>
                    </div>

                    {runResults.map((res, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-xl border ${
                          res.passed
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                            : 'bg-red-500/10 border-red-500/25 text-red-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>
                            Test Case #{res.testCaseNumber}: {res.passed ? 'PASSED ✓' : 'FAILED ✗'}
                          </span>
                          <span className="text-[10px] text-white/50">{res.executionTimeMs}ms</span>
                        </div>
                        <div className="mt-1 space-y-0.5 text-[11px] text-white/80">
                          <p>
                            Expected: <span className="text-white">{res.expectedOutput}</span>
                          </p>
                          <p>
                            Output: <span className="text-white">{res.actualOutput || '(Empty)'}</span>
                          </p>
                          {res.error && <p className="text-red-400">Error: {res.error}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-[#141418] border border-white/10 rounded-3xl p-6 w-[min(480px,95vw)] max-h-[90dvh] overflow-y-auto shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Send size={18} className="text-purple-400" />
              <span>Submit Assessment Round?</span>
            </h3>

            <p className="text-xs text-white/70 leading-relaxed">
              {selectedAssessment?.type === 'UI_UX'
                ? `Are you sure you want to finalize "${selectedAssessment?.title}"? Your Figma link and design notes will be recorded for evaluation.`
                : `Are you sure you want to finalize "${selectedAssessment?.title}"? All your MCQ choices and coding submissions will be evaluated and recorded.`}
            </p>

            {selectedAssessment?.type === 'UI_UX' ? (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1.5">
                <div className="flex justify-between text-white/80">
                  <span>Figma Prototype Link:</span>
                  <span className={`font-bold ${studentFigmaLink.trim() ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {studentFigmaLink.trim() ? 'Provided ✓' : 'Missing ✗'}
                  </span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Design Notes:</span>
                  <span className="font-bold text-purple-400">
                    {studentDesignNotes.trim() ? 'Included ✓' : 'None'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1.5">
                <div className="flex justify-between text-white/80">
                  <span>MCQs Answered:</span>
                  <span className="font-bold text-purple-400">
                    {Object.keys(mcqAnswers).length} / {studentMcqs.length}
                  </span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Coding Challenges Evaluated:</span>
                  <span className="font-bold text-blue-400">
                    {Object.keys(problemStatusMap).length} / {studentCoding.length}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 min-h-[40px] rounded-xl text-xs font-semibold text-white/70 hover:text-white cursor-pointer"
              >
                Keep Working
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={async () => {
                  if (selectedAssessment?.type === 'UI_UX') {
                    if (!studentFigmaLink.trim()) {
                      return toast.error('Please enter your Figma link before submitting.');
                    }
                    await handleStudentDesignSubmit();
                    setShowSubmitConfirm(false);
                    handleReturnToHub();
                  } else {
                    handleFinalSubmit(false);
                  }
                }}
                className="px-5 py-2 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                <span>Confirm & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL SCORE & EVALUATION RESULTS MODAL */}
      {finalResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-4">
          <div className="bg-[#141418] border border-white/10 rounded-3xl p-6 sm:p-8 w-[min(480px,95vw)] max-h-[90dvh] overflow-y-auto text-center space-y-5 shadow-2xl">
            <div
              className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-lg border ${
                finalResultModal.isPassed
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-emerald-500/20'
                  : 'bg-amber-500/20 border-amber-500/30 text-amber-400 shadow-amber-500/20'
              }`}
            >
              <Trophy size={32} />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">
                {finalResultModal.isPassed ? 'Congratulations! Round Completed' : 'Assessment Completed'}
              </h3>
              <p className="text-xs text-white/60 mt-1">
                Your submission for "{selectedAssessment?.title}" has been recorded.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div>
                <p className="text-[10px] text-white/50 uppercase font-bold">Total Score</p>
                <p className="text-lg font-black text-white mt-0.5">
                  {finalResultModal.totalScore}
                </p>
                <p className="text-[10px] text-white/40">of {finalResultModal.maxPossibleScore}</p>
              </div>

              <div>
                <p className="text-[10px] text-white/50 uppercase font-bold">Percentage</p>
                <p className="text-lg font-black text-purple-400 mt-0.5">
                  {finalResultModal.scorePercentage}%
                </p>
                <p className="text-[10px] text-white/40">Accuracy</p>
              </div>

              <div>
                <p className="text-[10px] text-white/50 uppercase font-bold">Outcome</p>
                <p
                  className={`text-sm font-black mt-1 ${
                    finalResultModal.isPassed ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {finalResultModal.isPassed ? 'PASSED' : 'PARTICIPATED'}
                </p>
                <p className="text-[10px] text-white/40">Status</p>
              </div>
            </div>

            {/* Anti-cheat tab switch penalty & completion time metrics */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 grid grid-cols-2 gap-3 text-xs">
              <div className="text-left">
                <span className="text-[10px] text-white/50 block font-mono">TAB SWITCHES</span>
                <span className={`font-bold font-mono ${finalResultModal.tabSwitchCount ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {finalResultModal.tabSwitchCount || 0} (-{(finalResultModal.tabSwitchCount || 0) * 5}%)
                </span>
                {finalResultModal.rawTotalScore !== undefined && (
                  <span className="text-[10px] text-white/40 block">Raw: {finalResultModal.rawTotalScore} pts</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/50 block font-mono">TIME TAKEN</span>
                <span className="font-bold font-mono text-purple-300">
                  {Math.floor((finalResultModal.timeTakenSeconds || 0) / 60)}m {(finalResultModal.timeTakenSeconds || 0) % 60}s
                </span>
                <span className="text-[10px] text-white/40 block">Total test duration</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReturnToHub}
              className="w-full py-3 min-h-[44px] rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            >
              Return to Arena Rounds
            </button>
          </div>
        </div>
      )}

      {/* REFERENCE DESIGN IMAGE LIGHTBOX MODAL */}
      {previewReferenceImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col bg-[#141418] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#121216]">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-purple-400" />
                <span className="text-xs font-bold text-white">Reference Design Mockup (Full HD View)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <a
                  href={previewReferenceImg}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 min-h-[34px] rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink size={13} />
                  <span>Open Full Image</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewReferenceImg(null)}
                  className="p-1.5 min-w-[34px] min-h-[34px] rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/70">
              <img
                src={previewReferenceImg}
                alt="Design Mockup Full View"
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventArenaPage;
