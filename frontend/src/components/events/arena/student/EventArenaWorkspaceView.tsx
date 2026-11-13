import ArenaWorkspaceSkeleton from './ArenaWorkspaceSkeleton';
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Minimize2,
  FileText,
  CheckCircle,
  Eye,
  Info,
  X,
  Users,
  Lock,
  ShieldAlert,
  Star,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useFullScreenEnforcement } from '@/hooks/useFullScreenEnforcement';
import { useTabSwitchDetection } from '@/hooks/useTabSwitchDetection';
import FullScreenEnforcementOverlay from '@/components/assessments/FullScreenEnforcementOverlay';
import { EmilCard, EmilButton } from '@/components/ui/emil-ui';
import { Button, Link } from '@heroui/react';
import { useShallow } from 'zustand/react/shallow';
import { HeroTabs } from '@/components/ui/hero/HeroTabs';
import HeroUISelect, { HeroUISelectOption } from '@/components/ui/HeroUISelect';
import useAuthStore from '@/store/useAuthStore';
import useProfileStore from '@/store/useProfileStore';
import useEventArenaStore from '@/store/useEventArenaStore';
import { formatISTDateTime } from '@/lib/dateUtils';
import api from '@/lib/axios';

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

export interface EventArenaWorkspaceViewProps {
  eventId: string;
  assessmentId: string;
  isAdmin: boolean;
  onReturnToHub: () => void;
  initialBlockedDetail?: {
    isBlocked?: boolean;
    code?: string;
    blockedType?: string;
    sourceTitle?: string;
    reason?: string;
    error?: string;
  } | null;
}

export const EventArenaWorkspaceView: React.FC<EventArenaWorkspaceViewProps> = ({
  eventId: id,
  assessmentId: activeAssessmentId,
  isAdmin,
  onReturnToHub,
  initialBlockedDetail = null,
}) => {
  const {
    fetchStudentAssessmentData,
    startAssessmentSession,
    runAssessmentCode,
    submitAssessmentProblem,
    submitAssessmentFinal,
    submitAssessmentDesign,
    selectedAssessment,
    studentMcqs,
    studentCoding,
    studentDesignChallenge,
    studentDesignChallenges,
    studentTeam,
    submission,
    currentEvent,
    loading,
    actionLoading,
  } = useEventArenaStore(
    useShallow((state) => ({
      fetchStudentAssessmentData: state.fetchStudentAssessmentData,
      startAssessmentSession: state.startAssessmentSession,
      runAssessmentCode: state.runAssessmentCode,
      submitAssessmentProblem: state.submitAssessmentProblem,
      submitAssessmentFinal: state.submitAssessmentFinal,
      submitAssessmentDesign: state.submitAssessmentDesign,
      selectedAssessment: state.selectedAssessment,
      studentMcqs: state.studentMcqs,
      studentCoding: state.studentCoding,
      studentDesignChallenge: state.studentDesignChallenge,
      studentDesignChallenges: state.studentDesignChallenges,
      studentTeam: state.studentTeam,
      submission: state.submission,
      currentEvent: state.currentEvent,
      loading: state.loading,
      actionLoading: state.actionLoading,
    }))
  );

  const currentUser = useAuthStore((s: any) => s.user);
  const profile = useProfileStore((s: any) => s.profile);
  const [finalResultModal, setFinalResultModal] = useState<any | null>(null);
  const [apiBlocked, setApiBlocked] = useState(false);
  const [isUnblockingSelf, setIsUnblockingSelf] = useState(false);
  const [isCheckingUnblockStatus, setIsCheckingUnblockStatus] = useState(false);
  const [blockedDetail, setBlockedDetail] = useState<any | null>(initialBlockedDetail);
  const [_unused, _setUnused] = useState<{
    isBlocked?: boolean;
    code?: string;
    blockedType?: string;
    sourceTitle?: string;
    reason?: string;
    error?: string;
  } | null>(null);

  const isDesignRound = selectedAssessment?.type === 'UI_UX';

  // Anti-Cheat & Full-Screen Enforcement Hooks
  const { isFullscreen, requestFullscreen, exitFullscreen, toggleFullscreen } = useFullScreenEnforcement();
  const {
    isBlocked: tabSwitchBlocked,
    blockedMessage,
    unblockStudent,
    checkIfUnblocked,
    resetBlocked,
    setIsBlocked: setTabSwitchBlocked,
    tabSwitchCount,
    setTabSwitchCount,
    maxStrikes,
    showWarning: showTabWarning,
    setShowWarning: setShowTabWarning,
  } = useTabSwitchDetection({
    eventId: id || '',
    enabled: Boolean(
      !isAdmin &&
      !isDesignRound &&
      activeAssessmentId &&
      submission?.status !== 'SUBMITTED' &&
      !finalResultModal
    ),
    maxStrikes: 3,
  });
  const isAssessmentBlocked = !isDesignRound && (tabSwitchBlocked || apiBlocked || Boolean(blockedDetail?.isBlocked && activeAssessmentId));

  // Sync tabSwitchCount if student previously recorded switches on this submission
  useEffect(() => {
    if (submission?.tabSwitchCount && submission.tabSwitchCount > 0) {
      setTabSwitchCount((prev) => Math.max(prev, submission.tabSwitchCount));
    }
  }, [submission?.tabSwitchCount, setTabSwitchCount]);

  const [selectedDesignIdx, setSelectedDesignIdx] = useState(0);
  const [studentFigmaLink, setStudentFigmaLink] = useState('');
  const [studentDesignNotes, setStudentDesignNotes] = useState('');
  const [previewReferenceImg, setPreviewReferenceImg] = useState<string | null>(null);

  // Arena session state within active assessment
  const [selectedType, setSelectedType] = useState<'mcq' | 'coding'>('mcq');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Student answers state
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const mcqAnswersRef = useRef<Record<string, number>>({});
  const [codingCodes, setCodingCodes] = useState<Record<string, { code: string; language: string }>>({});
  const [currentLanguage, setCurrentLanguage] = useState('python');

  // Keep ref continuously in sync with state
  useEffect(() => {
    mcqAnswersRef.current = mcqAnswers;
  }, [mcqAnswers]);

  // Restore cached answers from localStorage on round selection
  useEffect(() => {
    if (!id || !activeAssessmentId) return;
    try {
      const storageKey = `arena_mcq_${id}_${activeAssessmentId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setMcqAnswers((prev) => {
            const merged = { ...parsed, ...prev };
            mcqAnswersRef.current = merged;
            return merged;
          });
        }
      }
    } catch (e) {
      console.warn('[Arena] Failed to parse cached local answers', e);
    }
  }, [id, activeAssessmentId]);

  // Execution & Terminal state
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmittingProblem, setIsSubmittingProblem] = useState(false);
  const [runResults, setRunResults] = useState<any[] | null>(null);
  const [problemStatusMap, setProblemStatusMap] = useState<Record<string, any>>({});
  const [codingModeMap, setCodingModeMap] = useState<Record<string, 'ONLY_CODE' | 'TEST_CASES'>>({});
  const [customInputMap, setCustomInputMap] = useState<Record<string, string>>({});
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState(3600);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const handleFinalSubmitRef = useRef<(isAuto?: boolean) => Promise<void>>(() => Promise.resolve());

  // Active assessment data loaded via assessmentId prop

  // Check anti-cheat / external block status on mount
  useEffect(() => {
    if (!id || isAdmin) return;
    api
      .get(`/events/${id}/anti-cheat/status`)
      .then((res) => {
        if (res.data?.success && res.data.isBlocked) {
          setBlockedDetail({
            isBlocked: true,
            code: res.data.blockedType === 'THIS_EVENT' ? 'STUDENT_ASSESSMENT_BLOCKED' : 'BLOCKED_BY_OTHER_ACTIVITY',
            blockedType: res.data.blockedType,
            sourceTitle: res.data.sourceTitle,
            reason: res.data.reason,
            error: res.data.error,
          });
          if (res.data.blockedType === 'THIS_EVENT') {
            setApiBlocked(true);
          }
        } else {
          setBlockedDetail(null);
        }
      })
      .catch(() => {});
  }, [id, isAdmin]);

  // When activeAssessmentId changes, load that assessment's data and start session
  useEffect(() => {
    if (id && activeAssessmentId) {
      fetchStudentAssessmentData(id, activeAssessmentId)
        .then((data) => {
          setApiBlocked(false);
          setBlockedDetail(null);
          const hasGrace = Boolean(
            data?.submission?.reentryAllowed ||
            (data?.submission?.expiresAt && new Date(data.submission.expiresAt).getTime() > Date.now()) ||
            ((data?.submission?.graceMinutes || 0) > 0 && data?.submission?.status === 'IN_PROGRESS')
          );
          if (!data?.submission || data.submission.status === 'IN_PROGRESS' || hasGrace) {
            startAssessmentSession(id, activeAssessmentId);
          }
          if (
            (data?.submission?.status === 'SUBMITTED' || data?.submission?.status === 'AUTO_SUBMITTED') &&
            !hasGrace
          ) {
            setFinalResultModal(data.submission);
          } else {
            setFinalResultModal(null);
          }
        })
        .catch((err: any) => {
          if (err.response?.data?.isDisqualifiedByRank) {
            toast.error(err.response?.data?.error || 'Your rank did not meet the cutoff for this round.');
            handleReturnToHub();
            return;
          }
          if (
            err.response?.status === 403 &&
            (err.response?.data?.isBlocked ||
              err.response?.data?.code === 'STUDENT_ASSESSMENT_BLOCKED' ||
              err.response?.data?.code === 'BLOCKED_BY_OTHER_ACTIVITY')
          ) {
            setApiBlocked(true);
            setBlockedDetail({
              isBlocked: true,
              code: err.response.data?.code,
              blockedType: err.response.data?.blockedType,
              sourceTitle: err.response.data?.sourceTitle,
              reason: err.response.data?.reason,
              error: err.response.data?.error,
            });
          }
        });
    }
  }, [id, activeAssessmentId]);

  // Old 5% deduction listener replaced by strict anti-cheat blocking hook

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
          const pLangs = p.allowedLanguages && p.allowedLanguages.length > 0 ? p.allowedLanguages : ['python', 'javascript', 'cpp', 'java', 'c'];
          const defaultLang = pLangs.includes(currentLanguage) ? currentLanguage : pLangs[0] || 'python';
          initialCodes[p._id] = {
            code: starterMap[defaultLang] || (defaultLang === 'python' ? '# Write your solution here\n' : '// Write your solution here\n'),
            language: defaultLang,
          };
        }
      });
      setCodingCodes((prev) => ({ ...initialCodes, ...prev }));
    }
  }, [studentMcqs, studentCoding]);

  // Synchronize timer based on submission startedAt and scheduled assessment deadline
  useEffect(() => {
    if (!activeAssessmentId || submission?.status === 'SUBMITTED' || finalResultModal) return;

    const calcRemaining = () => {
      const now = Date.now();
      const expiresTime = submission?.expiresAt ? new Date(submission.expiresAt).getTime() : null;

      // If submission has an explicit expiration timestamp in the future (includes any admin grace time extensions), respect it directly
      if (expiresTime && !isNaN(expiresTime)) {
        if (expiresTime > now) {
          return Math.max(0, Math.floor((expiresTime - now) / 1000));
        }
        // If expiresTime is in the past, but reentryAllowed / graceMinutes was just granted, give at least graceMinutes
        if (submission?.reentryAllowed && (submission?.graceMinutes || 0) > 0) {
          return (submission.graceMinutes || 10) * 60;
        }
      }

      const totalSeconds = (selectedAssessment?.durationMinutes || 60) * 60;
      const started = submission?.startedAt ? new Date(submission.startedAt).getTime() : now;
      const elapsed = Math.floor((now - started) / 1000);

      const graceExtraMs = (selectedAssessment?.graceMinutes || 0) * 60 * 1000;
      const assessmentEndTime = selectedAssessment?.endTime
        ? new Date(selectedAssessment.endTime).getTime() + graceExtraMs
        : selectedAssessment?.startTime
        ? new Date(selectedAssessment.startTime).getTime() + (selectedAssessment.durationMinutes || 60) * 60 * 1000 + graceExtraMs
        : null;

      if (assessmentEndTime && !isNaN(assessmentEndTime)) {
        const remainingFromDeadline = Math.max(0, Math.floor((assessmentEndTime - now) / 1000));
        return Math.min(Math.max(0, totalSeconds - elapsed), remainingFromDeadline);
      }
      return Math.max(0, totalSeconds - elapsed);
    };

    const initial = calcRemaining();
    setRemainingSeconds(initial);
    if (initial <= 0 && activeAssessmentId && submission?.status === 'IN_PROGRESS' && !submission?.reentryAllowed) {
      handleFinalSubmitRef.current(true);
      return;
    }

    const timer = setInterval(() => {
      const rem = calcRemaining();
      setRemainingSeconds(rem);
      if (rem <= 0) {
        clearInterval(timer);
        handleFinalSubmitRef.current(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedAssessment, submission, activeAssessmentId, finalResultModal]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Sync Figma & Coding submission state when submission changes
  useEffect(() => {
    if (submission?.designSubmission) {
      if (submission.designSubmission.figmaFileUrl || (submission.designSubmission as any).figmaLink) {
        setStudentFigmaLink(submission.designSubmission.figmaFileUrl || (submission.designSubmission as any).figmaLink);
      }
      if (submission.designSubmission.notes) {
        setStudentDesignNotes(submission.designSubmission.notes);
      }
      if ((submission.designSubmission as any).selectedChallengeTitle && studentDesignChallenges?.length) {
        const found = studentDesignChallenges.findIndex((c: any) => c.title === (submission.designSubmission as any).selectedChallengeTitle);
        if (found !== -1) setSelectedDesignIdx(found);
      }
    }

    if (submission?.codingSubmissions && submission.codingSubmissions.length > 0) {
      const map: Record<string, any> = {};
      const modeMap: Record<string, 'ONLY_CODE' | 'TEST_CASES'> = {};
      const existingCodes: Record<string, { code: string; language: string }> = {};

      submission.codingSubmissions.forEach((cs) => {
        if (cs.problemId) {
          map[cs.problemId] = cs;
          if (cs.codingMode) {
            modeMap[cs.problemId] = cs.codingMode;
          }
          if (cs.code) {
            existingCodes[cs.problemId] = {
              code: cs.code,
              language: cs.language || 'python',
            };
          }
        }
      });
      setProblemStatusMap((prev) => ({ ...map, ...prev }));
      setCodingModeMap((prev) => ({ ...modeMap, ...prev }));
      setCodingCodes((prev) => ({ ...existingCodes, ...prev }));
    }

    // Restore previous MCQ answers if resuming a submission with grace time
    if (submission?.mcqAnswers && submission.mcqAnswers.length > 0) {
      const restoredMcq: Record<string, number> = {};
      submission.mcqAnswers.forEach((ans: any) => {
        if (ans.questionId && typeof ans.selectedOptionIndex === 'number' && ans.selectedOptionIndex >= 0) {
          restoredMcq[ans.questionId] = ans.selectedOptionIndex;
        }
      });
      setMcqAnswers((prev) => {
        const merged = { ...restoredMcq, ...prev };
        mcqAnswersRef.current = merged;
        if (id && activeAssessmentId) {
          try {
            localStorage.setItem(`arena_mcq_${id}_${activeAssessmentId}`, JSON.stringify(merged));
          } catch {
            // ignore
          }
        }
        return merged;
      });
    }
  }, [submission, id, activeAssessmentId]);

  const currentMcq = studentMcqs[selectedIndex];
  const currentCoding = studentCoding[selectedIndex];

  // Derive allowed programming languages for current coding problem
  const currentAllowedLanguages = useMemo(() => {
    if (
      currentCoding?.allowedLanguages &&
      Array.isArray(currentCoding.allowedLanguages) &&
      currentCoding.allowedLanguages.length > 0
    ) {
      return currentCoding.allowedLanguages;
    }
    return ['python', 'javascript', 'cpp', 'java', 'c'];
  }, [currentCoding]);

  // Options for HeroUISelect programming language dropdown
  const languageOptions: HeroUISelectOption[] = useMemo(() => {
    return currentAllowedLanguages.map((lang) => ({
      value: lang,
      label: LANG_DISPLAY_NAMES[lang] || lang,
    }));
  }, [currentAllowedLanguages]);

  // Derive public test cases for the current problem (always shown, including ONLY_CODE mode)
  const publicTestCases = useMemo(() => {
    if (!currentCoding) return [];
    const visible = (currentCoding.testCases || []).filter((tc: any) => !tc.isHidden);
    if (visible.length > 0) return visible;
    if (currentCoding.sampleInput || currentCoding.sampleOutput) {
      return [
        {
          input: currentCoding.sampleInput || '',
          expectedOutput: currentCoding.sampleOutput || '',
          isHidden: false,
        },
      ];
    }
    return [];
  }, [currentCoding]);

  // Ensure active language is valid for the current coding problem's allowed languages
  useEffect(() => {
    if (selectedType === 'coding' && currentCoding) {
      const allowed =
        currentCoding.allowedLanguages && currentCoding.allowedLanguages.length > 0
          ? currentCoding.allowedLanguages
          : ['python', 'javascript', 'cpp', 'java', 'c'];

      const currentProblemSaved = currentCoding._id ? codingCodes[currentCoding._id] : undefined;
      const savedLang = currentProblemSaved?.language;

      if (savedLang && allowed.includes(savedLang)) {
        if (currentLanguage !== savedLang) {
          setCurrentLanguage(savedLang);
        }
      } else if (!allowed.includes(currentLanguage)) {
        const nextLang = allowed[0] || 'python';
        setCurrentLanguage(nextLang);
        if (currentCoding._id) {
          const starterMap = currentCoding.starterCode || {};
          setCodingCodes((prev) => ({
            ...prev,
            [currentCoding._id!]: {
              code: starterMap[nextLang] || (nextLang === 'python' ? '# Write your solution here\n' : '// Write your solution here\n'),
              language: nextLang,
            },
          }));
        }
      }
    }
  }, [selectedIndex, selectedType, currentCoding, currentLanguage]);

  // Derive active coding mode: only code vs code with test cases
  const configuredMode = currentCoding?.codingMode || 'BOTH';
  const activeCodingMode: 'ONLY_CODE' | 'TEST_CASES' =
    configuredMode === 'ONLY_CODE'
      ? 'ONLY_CODE'
      : configuredMode === 'TEST_CASES'
      ? 'TEST_CASES'
      : (currentCoding?._id && codingModeMap[currentCoding._id]) || 'ONLY_CODE';

  const handleSelectMcqOption = (questionId: string, optionIndex: number) => {
    setMcqAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: optionIndex,
      };
      mcqAnswersRef.current = updated;
      if (id && activeAssessmentId) {
        try {
          localStorage.setItem(`arena_mcq_${id}_${activeAssessmentId}`, JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return updated;
    });
  };

  const handleRunCode = async () => {
    if (!id || !activeAssessmentId || !currentCoding?._id) return;
    const currentCode = codingCodes[currentCoding._id]?.code;
    if (!currentCode) return toast.error('Please enter some code to execute');

    setIsExecuting(true);
    setRunResults(null);
    try {
      const customInput = activeCodingMode === 'ONLY_CODE' ? (customInputMap[currentCoding._id] ?? '') : undefined;
      const res = await runAssessmentCode(
        id,
        activeAssessmentId,
        currentCoding._id,
        currentLanguage,
        currentCode,
        customInput
      );
      if (res && res.testCaseResults) {
        setRunResults(res.testCaseResults);
        if (res.allPassed) {
          toast.success(activeCodingMode === 'ONLY_CODE' ? 'Code executed successfully!' : 'All public test cases passed!');
        } else {
          toast.error(activeCodingMode === 'ONLY_CODE' ? 'Execution completed with issues. Check terminal.' : 'Some test cases failed. Check output.');
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
      const res = await submitAssessmentProblem(
        id,
        activeAssessmentId,
        currentCoding._id,
        currentLanguage,
        currentCode,
        activeCodingMode
      );
      if (res) {
        setProblemStatusMap((prev) => ({
          ...prev,
          [currentCoding._id!]: res,
        }));
        if (activeCodingMode === 'ONLY_CODE') {
          toast.success('Code submitted for manual admin evaluation!');
        } else if (res.status === 'ACCEPTED') {
          toast.success(
            isAdmin && res.pointsEarned !== undefined
              ? `Challenge Solved! +${res.pointsEarned} Points awarded!`
              : 'Challenge Solved! All test cases passed.'
          );
        } else {
          toast.error(
            isAdmin && res.pointsEarned !== undefined
              ? `Submitted: ${res.passedCount}/${res.totalTestCases} Test cases passed (+${res.pointsEarned} pts)`
              : `Submitted: ${res.passedCount}/${res.totalTestCases} test cases passed.`
          );
        }
      }
    } finally {
      setIsSubmittingProblem(false);
    }
  };

  const handleFinalSubmit = async (isAuto = false) => {
    if (!id || !activeAssessmentId) return;

    // Guaranteed latest answers: check ref first, then state, then localStorage
    let currentAnswers = mcqAnswersRef.current;
    if (!currentAnswers || Object.keys(currentAnswers).length === 0) {
      currentAnswers = mcqAnswers;
    }
    if (!currentAnswers || Object.keys(currentAnswers).length === 0) {
      try {
        const saved = localStorage.getItem(`arena_mcq_${id}_${activeAssessmentId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') currentAnswers = parsed;
        }
      } catch {
        // ignore
      }
    }

    const formattedMcqAnswers = Object.entries(currentAnswers || {}).map(([qId, ansIdx]) => ({
      questionId: qId,
      selectedOptionIndex: ansIdx,
      selectedOption: ansIdx,
    }));

    try {
      const res = await submitAssessmentFinal(id, activeAssessmentId, {
        mcqAnswers: formattedMcqAnswers,
        tabSwitchCount,
      });
      if (res) {
        try {
          localStorage.removeItem(`arena_mcq_${id}_${activeAssessmentId}`);
        } catch {
          // ignore
        }
        setShowSubmitConfirm(false);
        setFinalResultModal(res.results || res);
        toast.success(isAuto ? 'Time up! Assessment auto-submitted.' : 'Assessment submitted successfully!');
      }
    } catch {
      // Handled in store
    }
  };

  handleFinalSubmitRef.current = handleFinalSubmit;

  const handleStudentDesignSubmit = async () => {
    if (!id || !activeAssessmentId) return;
    if (!studentFigmaLink.trim()) {
      return toast.error('Please paste your Figma file or prototype link.');
    }
    try {
      await submitAssessmentDesign(id, activeAssessmentId, {
        figmaLink: studentFigmaLink.trim(),
        figmaFileUrl: studentFigmaLink.trim(),
        notes: studentDesignNotes.trim(),
      });
    } catch {
      // Handled in store
    }
  };


  const handleReturnToHub = () => {
    setFinalResultModal(null);
    setTabSwitchCount(0);
    setShowTabWarning(false);
    resetBlocked();
    setApiBlocked(false);
    onReturnToHub();
  };
  return (
    <div className="h-[100dvh] min-h-[100dvh] w-full flex flex-col bg-canvas text-label-primary overflow-hidden select-none relative">
      {/* 1. Permanent Block Screen if Assessment is Blocked */}
      {isAssessmentBlocked && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-3xl bg-black/90 select-none">
          <EmilCard className="w-full max-w-md p-6 sm:p-8 rounded-3xl border border-red-500/40 bg-surface/95 shadow-[0_20px_50px_rgba(239,68,68,0.35)] text-center relative">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 text-red-400">
              <ShieldAlert size={28} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 mb-3">
              {blockedDetail?.blockedType && blockedDetail.blockedType !== 'THIS_EVENT'
                ? `Cross-Activity Lock: ${blockedDetail.blockedType}`
                : 'Proctoring Violation'}
            </div>

            <h3 className="text-xl font-bold tracking-tight text-label-primary mb-2">
              {blockedDetail?.blockedType && blockedDetail.blockedType !== 'THIS_EVENT'
                ? `Blocked by ${blockedDetail.sourceTitle || 'Other Activity'}`
                : 'Assessment Locked'}
            </h3>

            <p className="text-xs sm:text-sm text-red-300/90 mb-5 leading-relaxed">
              {blockedDetail?.blockedType && blockedDetail.blockedType !== 'THIS_EVENT' ? (
                <>
                  You are currently restricted by{' '}
                  <span className="font-bold text-white">
                    {blockedDetail.sourceTitle || 'another activity'}
                  </span>
                  . {blockedDetail.reason || ''}
                  <span className="block mt-2 font-bold text-amber-300">
                    Please unblock that first before taking this Event Arena assessment.
                  </span>
                </>
              ) : (
                blockedMessage ||
                blockedDetail?.reason ||
                'You have been blocked for navigating away. Contact Admin.'
              )}
            </p>

            <div className="p-3 mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 text-[11px] text-red-300">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span>
                {blockedDetail?.blockedType && blockedDetail.blockedType !== 'THIS_EVENT'
                  ? `Please unblock ${blockedDetail.sourceTitle || 'external activity'} first, then check status below.`
                  : 'Real-time listener active: Screen unlocks automatically once Admin unblocks you'}
              </span>
            </div>

            <div className="space-y-3">
              <Button
                color="primary"
                variant="solid"
                isLoading={isCheckingUnblockStatus}
                isDisabled={isCheckingUnblockStatus}
                onPress={async () => {
                  setIsCheckingUnblockStatus(true);
                  try {
                    const res = await api.get(`/events/${id}/anti-cheat/status`);
                    if (res.data?.success && !res.data.isBlocked) {
                      setBlockedDetail(null);
                      setApiBlocked(false);
                      resetBlocked();
                      toast.success('Your block has been cleared! Resuming assessment...');
                      if (id && activeAssessmentId) {
                        fetchStudentAssessmentData(id, activeAssessmentId);
                      }
                    } else if (res.data?.isBlocked) {
                      setBlockedDetail({
                        isBlocked: true,
                        blockedType: res.data.blockedType,
                        sourceTitle: res.data.sourceTitle,
                        reason: res.data.reason,
                      });
                      toast.error(
                        res.data.sourceTitle
                          ? `Still blocked by ${res.data.sourceTitle}. Please unblock that first.`
                          : 'Your attempt is still locked. Please ask your event admin/faculty to unblock you.'
                      );
                    }
                  } catch {
                    toast.error('Could not verify unblock status.');
                  } finally {
                    setIsCheckingUnblockStatus(false);
                  }
                }}
                className="w-full min-h-[42px] rounded-xl text-white text-xs font-bold shadow-lg shadow-primary/30 cursor-pointer"
                startContent={!isCheckingUnblockStatus ? <RefreshCw size={14} /> : undefined}
              >
                {isCheckingUnblockStatus ? 'Checking Status...' : 'Check if Unblocked'}
              </Button>

              {isAdmin && (
                <Button
                  color="secondary"
                  variant="solid"
                  isLoading={isUnblockingSelf}
                  isDisabled={isUnblockingSelf}
                  onPress={async () => {
                    setIsUnblockingSelf(true);
                    try {
                      await unblockStudent(currentUser?._id || currentUser?.id);
                      setApiBlocked(false);
                      resetBlocked();
                      if (id && activeAssessmentId) {
                        fetchStudentAssessmentData(id, activeAssessmentId);
                      }
                    } finally {
                      setIsUnblockingSelf(false);
                    }
                  }}
                  className="w-full min-h-[42px] rounded-xl text-white text-xs font-bold shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  Admin Override: Unblock My Attempt
                </Button>
              )}

              <Button
                variant="flat"
                onPress={handleReturnToHub}
                className="w-full min-h-[42px] rounded-xl text-white text-xs font-bold"
              >
                Return to Events Hub
              </Button>
            </div>
          </EmilCard>
        </div>
      )}

      {/* 1.5. Tab Switch Strike Warning Modal (Strikes 1 & 2 of 3) */}
      <AnimatePresence>
        {showTabWarning && !isAssessmentBlocked && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm sm:max-w-md bg-surface border border-amber-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-center space-y-4 shadow-2xl relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto">
                <ShieldAlert size={28} />
              </div>

              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30 tabular-nums">
                  Security Warning: Strike {tabSwitchCount} of {maxStrikes}
                </span>
                <h3 className="text-lg sm:text-xl font-semibold text-label-primary tracking-tight mt-2">
                  Tab Switching is Restricted
                </h3>
                <p className="text-xs sm:text-[13px] text-label-secondary leading-relaxed">
                  You have navigated away from the assessment window. Switching tabs, minimizing windows, or running external applications during this test is strictly monitored.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-secondary border border-separator text-xs text-left space-y-1.5 font-normal">
                <p className="text-amber-400 font-medium flex items-center gap-1.5 tabular-nums">
                  <AlertTriangle size={14} /> Strike {tabSwitchCount} of {maxStrikes} recorded (-{tabSwitchCount * 5}% score penalty)
                </p>
                <p className="text-label-secondary text-[11px] leading-relaxed tabular-nums">
                  If you switch tabs {Math.max(0, maxStrikes - tabSwitchCount)} more time{maxStrikes - tabSwitchCount === 1 ? '' : 's'}, your assessment will be <strong>permanently locked</strong> and you will need to contact an administrator.
                </p>
              </div>

              <Button
                type="button"
                color="warning"
                variant="solid"
                onPress={() => setShowTabWarning(false)}
                className="w-full py-2.5 text-xs font-bold text-black bg-amber-500 hover:bg-amber-600 min-h-[42px] rounded-xl cursor-pointer shadow-lg shadow-amber-500/20"
              >
                I Understand, Return to Test
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Full-Screen Enforcement Overlay (Enforced for students; bypassed for admins in preview) */}
      {!isAdmin && !isAssessmentBlocked && (
        <FullScreenEnforcementOverlay
          isFullscreen={isFullscreen}
          onRequestFullscreen={requestFullscreen}
          title="Full Screen Arena Required"
          description="To ensure exam integrity and proctoring compliance, this assessment must be attended strictly in full screen mode. Navigating away or exiting full screen is strictly monitored."
        />
      )}
      {/* Top Header Bar */}
      <header className="min-h-14 py-2 border-b border-separator px-3 sm:px-6 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shrink-0 bg-canvas/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            size="sm"
            variant="light"
            onPress={handleReturnToHub}
            className="rounded-xl text-label-secondary hover:text-label-primary text-xs font-semibold shrink-0"
            startContent={<ChevronLeft size={16} />}
          >
            <span className="hidden sm:inline">All Rounds</span>
          </Button>
          <div className="h-4 w-[1px] bg-surface-secondary shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Sparkles size={14} />
            </span>
            <span className="font-bold text-xs sm:text-sm text-label-primary truncate max-w-[120px] sm:max-w-md">
              {selectedAssessment?.title || currentEvent?.title || 'Arena Assessment'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase shrink-0">
              {selectedAssessment?.type || 'HYBRID'}
            </span>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0">
                <Eye size={11} />
                <span>Admin Preview</span>
              </span>
            )}
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
              <span>
                {tabSwitchCount} / {maxStrikes} Switches (-{tabSwitchCount * 5}%)
              </span>
            </div>
          )}

          {selectedAssessment?.endTime && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 min-h-[36px] rounded-xl text-[11px] font-mono text-label-secondary bg-surface-secondary border border-separator">
              <span className="text-purple-400 font-bold">Ends:</span>
              <span>{formatISTDateTime(selectedAssessment.endTime)}</span>
            </div>
          )}

          {/* Grace Time Active Badge */}
          {Boolean((submission?.graceMinutes && submission.graceMinutes > 0) || (selectedAssessment?.graceMinutes && selectedAssessment.graceMinutes > 0)) && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 min-h-[36px] rounded-xl text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-500">
              <Sparkles size={12} className="text-amber-500" />
              <span>+{submission?.graceMinutes || selectedAssessment?.graceMinutes}m Grace Time</span>
            </div>
          )}

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-mono font-bold border transition-colors ${
              remainingSeconds < 300
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 animate-pulse'
                : 'bg-surface-secondary border-separator text-label-primary'
            }`}
          >
            <Clock size={13} className={remainingSeconds < 300 ? 'text-rose-400' : 'text-purple-400'} />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          {/* Fullscreen Toggle */}
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={toggleFullscreen}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            className="rounded-xl text-label-secondary hover:text-label-primary shrink-0"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>

          <Button
            size="sm"
            color="secondary"
            variant="solid"
            onPress={() => setShowSubmitConfirm(true)}
            className="rounded-xl text-white text-xs font-bold shadow-md shadow-purple-600/30"
            startContent={<Send size={13} />}
          >
            Finish Round
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      {loading ? (
        <ArenaWorkspaceSkeleton />
      ) : selectedAssessment?.type === 'UI_UX' ? (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-canvas">
          {/* Left Column: Design Brief & Reference Mockup */}
          <div className="w-full lg:w-1/2 border-r border-separator flex flex-col overflow-y-auto p-4 sm:p-6 space-y-6 bg-surface">
            {/* Tab switch permitted notice for Figma */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-300">
              <Sparkles size={15} className="text-emerald-400 shrink-0" />
              <span><strong>Figma / UI-UX Round:</strong> Tab switching restrictions are disabled. You can freely switch between this page and Figma to create your design.</span>
            </div>

            {/* Multiple Challenge Picker (If admin configured multiple options) */}
            {(() => {
              const allChallenges = studentDesignChallenges?.length ? studentDesignChallenges : (studentDesignChallenge ? [studentDesignChallenge] : []);
              if (allChallenges.length <= 1) return null;
              return (
                <div className="p-3.5 rounded-2xl bg-surface-secondary border border-separator space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                      <Palette size={13} className="text-pink-400" /> Choose 1 Design Challenge ({allChallenges.length} Options)
                    </span>
                    <span className="text-[10px] text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-full font-semibold">
                      Select any 1 to solve
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allChallenges.map((ch: any, chIdx: number) => {
                      const isSelected = selectedDesignIdx === chIdx;
                      const isPrevChosen = (submission?.designSubmission as any)?.selectedChallengeTitle === ch.title;
                      return (
                        <button
                          type="button"
                          key={chIdx}
                          onClick={() => setSelectedDesignIdx(chIdx)}
                          className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1.5 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                            isSelected
                              ? 'bg-pink-500/15 border-pink-500/50 text-white shadow-xs'
                              : 'bg-surface-secondary border-separator text-label-secondary hover:bg-surface-secondary'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className="text-xs font-bold line-clamp-1">Option {chIdx + 1}: {ch.title}</span>
                            {isSelected && <CheckCircle size={13} className="text-pink-400 shrink-0" />}
                          </div>
                          {ch.description && (
                            <p className="text-[10px] text-label-tertiary line-clamp-1">{ch.description}</p>
                          )}
                          {isPrevChosen && (
                            <span className="text-[9px] text-emerald-400 font-bold inline-flex items-center gap-1">
                              <Star size={10} className="fill-emerald-400 text-emerald-400 shrink-0" />
                              <span>Selected for submission</span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {/* Header info */}
            {(() => {
              const allChallenges = studentDesignChallenges?.length ? studentDesignChallenges : (studentDesignChallenge ? [studentDesignChallenge] : []);
              const currentChallenge = allChallenges[selectedDesignIdx] || studentDesignChallenge;
              return (
                <div className="flex items-center justify-between pb-4 border-b border-separator">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                      <Palette size={18} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-label-primary">{currentChallenge?.title || 'Design Challenge Brief'}</h2>
                      <p className="text-[11px] text-label-tertiary">UI/UX Design & Prototype Specification</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/25 text-pink-300 text-xs font-bold">
                      {currentChallenge?.totalPoints || currentChallenge?.points || selectedAssessment?.totalPoints || 100} Points
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Reference Mockup Image */}
            {(() => {
              const allChallenges = studentDesignChallenges?.length ? studentDesignChallenges : (studentDesignChallenge ? [studentDesignChallenge] : []);
              const currentChallenge = allChallenges[selectedDesignIdx] || studentDesignChallenge;
              const refImg = currentChallenge?.referenceImageUrl || currentChallenge?.designImageUrl;
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                      <ImageIcon size={13} className="text-purple-400" />
                      <span>Reference Design Mockup</span>
                    </label>
                    {refImg && (
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => setPreviewReferenceImg(refImg)}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold p-1 h-auto"
                        startContent={<Maximize2 size={12} />}
                      >
                        Enlarge
                      </Button>
                    )}
                  </div>

                  {refImg ? (
                    <button
                      type="button"
                      aria-label="Click to Zoom / Lightbox"
                      onClick={() => setPreviewReferenceImg(refImg)}
                      className="group relative rounded-2xl overflow-hidden border border-separator bg-black/40 cursor-zoom-in hover:border-purple-500/40 transition-all max-h-80 flex items-center justify-center w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    >
                      <img
                        src={refImg}
                        alt="Design Challenge Reference Mockup"
                        className="w-full h-full object-contain max-h-80 group-hover:scale-[1.02] transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white font-semibold text-xs transition-opacity backdrop-blur-[2px]">
                        <Maximize2 size={16} />
                        <span>Click to Zoom / Lightbox</span>
                      </div>
                    </button>
                  ) : (
                    <div className="p-8 rounded-2xl bg-surface-secondary border border-dashed border-separator text-center text-label-tertiary space-y-1.5">
                      <ImageIcon size={28} className="mx-auto text-label-tertiary" />
                      <p className="text-xs font-semibold text-label-secondary">No Reference Image Provided</p>
                      <p className="text-[11px] text-label-tertiary">Refer to the problem statement and deliverables below to craft your design.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Starter Figma Kit Link */}
            {studentDesignChallenge?.figmaStarterUrl && (
              <Link
                target="_blank" rel="noopener noreferrer"
                href={studentDesignChallenge.figmaStarterUrl}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent border border-purple-500/25 hover:border-purple-500/45 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                    F
                  </div>
                  <div>
                    <p className="text-xs font-bold text-label-primary group-hover:text-purple-300 transition-colors">
                      Starter Figma Template / Design Kit
                    </p>
                    <p className="text-[10px] text-label-tertiary">Duplicate or copy components to kickstart your work</p>
                  </div>
                </div>
                <ExternalLink size={14} className="text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            )}

            {/* Problem Statement */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                <FileText size={13} className="text-blue-400" />
                <span>Problem Statement & Brief</span>
              </label>
              <div className="p-4 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary leading-relaxed whitespace-pre-wrap">
                {studentDesignChallenge?.problemStatement || 'No challenge description provided.'}
              </div>
            </div>

            {/* Expected Deliverables */}
            {studentDesignChallenge?.deliverables && studentDesignChallenge.deliverables.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-emerald-400" />
                  <span>Expected Deliverables</span>
                </label>
                <div className="p-4 rounded-2xl bg-surface-secondary border border-separator space-y-2">
                  {studentDesignChallenge.deliverables.map((del, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-label-primary">
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
                <label className="text-xs font-bold text-label-primary flex items-center gap-1.5">
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
          <div className="w-full lg:w-1/2 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-5 bg-canvas">
            {/* Header & Status */}
            <div className="flex items-center justify-between pb-4 border-b border-separator">
              <div>
                <h2 className="text-sm font-bold text-label-primary">Your Figma Submission</h2>
                <p className="text-[11px] text-label-tertiary">Submit your prototype link for evaluation</p>
              </div>

              {submission?.designSubmission?.isEvaluated ? (
                <div className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <Award size={13} />
                  <span>{isAdmin ? `Graded: ${submission.designSubmission.pointsEarned} / ${studentDesignChallenge?.totalPoints || 100} pts` : 'Evaluated by Faculty'}</span>
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
                <p className="text-xs text-label-primary leading-relaxed">
                  {submission.designSubmission.feedback}
                </p>
              </div>
            )}

            {/* Figma Link & Notes Form */}
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-secondary border border-separator space-y-4">
              <div>
                <label className="text-xs font-bold text-label-primary flex items-center gap-1.5 mb-1.5">
                  <ExternalLink size={13} className="text-purple-400" />
                  <span>Figma File / Prototype Share Link</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  value={studentFigmaLink}
                  onChange={(e) => setStudentFigmaLink(e.target.value)}
                  placeholder="https://www.figma.com/file/... or /design/... or /proto/..."
                  className="w-full px-3.5 py-2.5 min-h-10.5 rounded-xl bg-surface-secondary border border-separator text-label-primary text-xs placeholder:text-label-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring font-mono transition-all"
                />
                <p className="text-[10px] text-label-tertiary mt-1 flex items-center gap-1">
                  <Info size={11} className="text-label-tertiary" />
                  <span>Make sure Figma permissions are set to <strong>"Anyone with the link can view"</strong></span>
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-label-primary flex items-center gap-1.5 mb-1.5">
                  <FileText size={13} className="text-blue-400" />
                  <span>Design Rationale & Notes</span>
                  <span className="text-label-tertiary font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={studentDesignNotes}
                  onChange={(e) => setStudentDesignNotes(e.target.value)}
                  placeholder="Explain your design thinking, component architecture, color choices, and interaction user flow..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-label-primary text-xs placeholder:text-label-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring transition-all resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-label-tertiary">
                  {submission?.designSubmission?.submittedAt ? (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle size={12} /> Previously submitted at {new Date(submission.designSubmission.submittedAt).toLocaleTimeString()}. Updates allowed anytime.
                    </span>
                  ) : (
                    <span>Click submit when your Figma design is ready.</span>
                  )}
                </div>

                <Button
                  color="secondary"
                  variant="solid"
                  isDisabled={actionLoading}
                  isLoading={actionLoading}
                  onPress={handleStudentDesignSubmit}
                  className="min-h-10.5 rounded-xl text-white text-xs font-bold shadow-lg shadow-purple-600/30 shrink-0"
                  startContent={!actionLoading ? <Send size={13} /> : undefined}
                >
                  {submission?.designSubmission?.submittedAt ? 'Update Submission' : 'Submit Figma Link'}
                </Button>
              </div>
            </div>

            {/* Live Interactive Figma Embed */}
            <div className="flex-1 min-h-95 sm:min-h-110 flex flex-col rounded-2xl bg-black/40 border border-separator overflow-hidden shadow-inner">
              <div className="px-4 py-3 border-b border-separator flex items-center justify-between bg-surface-secondary">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${studentFigmaLink.trim().includes('figma.com') ? 'bg-purple-500 animate-pulse' : 'bg-white/20'}`} />
                  <span className="text-xs font-bold text-label-primary">Live Figma Prototype Preview</span>
                </div>
                {studentFigmaLink.trim().includes('figma.com') && (
                  <Link
                    target="_blank" rel="noopener noreferrer"
                    href={studentFigmaLink.trim()}
                    className="px-3 py-1.5 rounded-lg bg-surface-secondary hover:bg-surface-secondary text-label-primary hover:text-label-primary text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink size={12} />
                    <span>Open in Figma</span>
                  </Link>
                )}
              </div>

              {studentFigmaLink.trim().includes('figma.com') ? (
                <div className="flex-1 w-full min-h-95 sm:min-h-110 relative bg-black">
                  <iframe
                    title="Student Figma Submission Preview"
                    src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(studentFigmaLink.trim())}`}
                    className="w-full h-full min-h-95 sm:min-h-110 border-0"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-label-tertiary space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-surface-secondary border border-separator flex items-center justify-center text-purple-400">
                    <Palette size={26} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-label-secondary">No Figma Link Provided Yet</p>
                    <p className="text-[11px] text-label-tertiary max-w-sm mt-1">
                      Enter your public Figma share link in the field above to interact with and preview your design directly inside the arena.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : loading ? (
        <ArenaWorkspaceSkeleton />
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left / Top Navigation Palette (MCQ vs Coding & Question Buttons) */}
          <div className="w-full md:w-56 lg:w-64 border-b md:border-b-0 md:border-r border-separator flex flex-col bg-canvas shrink-0">
            {/* Section Switcher Tabs (MCQ vs Coding) with Emil Kowalski sub-300ms spring physics */}
            <div className="p-2 sm:p-2.5 border-b border-separator flex justify-center bg-surface-secondary">
              <HeroTabs
                size="sm"
                selectedKey={selectedType}
                onSelectionChange={(key) => {
                  setSelectedType(key as 'mcq' | 'coding');
                  setSelectedIndex(0);
                }}
                motionProps={{ transition: { type: 'spring', stiffness: 260, damping: 30 } }}
                className="w-full flex"
                items={[
                  ...(studentMcqs.length > 0
                    ? [{ id: 'mcq', label: `MCQs (${studentMcqs.length})`, icon: <HelpCircle size={13} /> }]
                    : []),
                  ...(studentCoding.length > 0
                    ? [{ id: 'coding', label: `Coding (${studentCoding.length})`, icon: <Code2 size={13} /> }]
                    : []),
                ]}
              />
            </div>

            {/* Question Palette Grid (Horizontal scroll on mobile, vertical grid on desktop) */}
            <div className="p-3 md:p-4 space-y-2 md:space-y-4 md:flex-1 md:overflow-y-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-label-tertiary hidden md:block">
                {selectedType === 'mcq' ? 'Questions' : 'Challenges'}
              </span>

              <div className="flex md:grid md:grid-cols-4 gap-2 overflow-x-auto custom-scrollbar touch-pan-x pb-1 md:pb-0">
                {selectedType === 'mcq'
                  ? studentMcqs.map((q, idx) => {
                      const isAnswered = q._id && mcqAnswers[q._id] !== undefined;
                      const isCurrent = selectedIndex === idx;
                      return (
                        <Button
                          key={idx}
                          isIconOnly
                          size="sm"
                          variant={isCurrent ? 'solid' : isAnswered ? 'flat' : 'bordered'}
                          color={isCurrent ? 'secondary' : isAnswered ? 'success' : 'default'}
                          onPress={() => setSelectedIndex(idx)}
                          className={`w-9 h-9 min-w-9 min-h-9 rounded-xl text-xs font-bold font-mono shrink-0 ${
                            isCurrent
                              ? 'ring-2 ring-purple-400'
                              : !isAnswered
                              ? 'border-separator text-label-secondary hover:bg-surface-secondary'
                              : ''
                          }`}
                        >
                          {idx + 1}
                        </Button>
                      );
                    })
                  : studentCoding.map((p, idx) => {
                      const pStatus = p._id ? problemStatusMap[p._id] : null;
                      const isPassed = pStatus?.status === 'ACCEPTED';
                      const isSubmittedOnlyCode = pStatus?.status === 'SUBMITTED' || pStatus?.codingMode === 'ONLY_CODE';
                      const isCurrent = selectedIndex === idx;
                      return (
                        <Button
                          key={idx}
                          isIconOnly
                          size="sm"
                          variant={isCurrent ? 'solid' : isPassed || isSubmittedOnlyCode ? 'flat' : 'bordered'}
                          color={isCurrent ? 'primary' : isPassed ? 'success' : isSubmittedOnlyCode ? 'secondary' : 'default'}
                          onPress={() => setSelectedIndex(idx)}
                          className={`w-9 h-9 min-w-9 min-h-9 rounded-xl text-xs font-bold font-mono shrink-0 ${
                            isCurrent
                              ? 'ring-2 ring-blue-400'
                              : !isPassed && !isSubmittedOnlyCode
                              ? 'border-separator text-label-secondary hover:bg-surface-secondary'
                              : ''
                          }`}
                        >
                          {idx + 1}
                        </Button>
                      );
                    })}
              </div>
            </div>
          </div>

          {/* Center / Right Content Panel */}
          {selectedType === 'mcq' && currentMcq && (
            <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 md:p-10 bg-canvas">
              <div className="max-w-3xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-separator">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    Question {selectedIndex + 1} of {studentMcqs.length}
                  </span>
                  <span className="text-xs font-mono text-label-secondary">
                    {currentMcq.points || 10} Points
                  </span>
                </div>

                <div className="p-4 sm:p-6 rounded-2xl bg-white/2 border border-separator space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-label-primary leading-relaxed wrap-break-word">
                    {currentMcq.question}
                  </h3>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentMcq.options.map((opt, optIdx) => {
                    const isSelected =
                      currentMcq._id && mcqAnswers[currentMcq._id] === optIdx;
                    return (
                      <button
                        type="button"
                        key={optIdx}
                        onClick={() => currentMcq._id && handleSelectMcqOption(currentMcq._id, optIdx)}
                        className={`w-full text-left p-3.5 sm:p-4 min-h-11.5 rounded-xl border flex items-center gap-3.5 cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                          isSelected
                            ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/15'
                            : 'bg-white/2 border-separator hover:border-separator text-label-primary hover:bg-white/4'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 border ${
                            isSelected
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'border-separator text-label-secondary'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="text-xs sm:text-sm font-medium leading-relaxed break-words min-w-0 flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Next/Prev Navigation */}
                <div className="pt-6 flex justify-between">
                  <Button
                    size="sm"
                    variant="bordered"
                    isDisabled={selectedIndex === 0}
                    onPress={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                    className="min-h-10 rounded-xl text-xs font-bold text-label-secondary border-separator hover:bg-surface-secondary"
                    startContent={<ChevronLeft size={16} />}
                  >
                    Previous
                  </Button>

                  <Button
                    size="sm"
                    variant="bordered"
                    isDisabled={selectedIndex >= studentMcqs.length - 1}
                    onPress={() => setSelectedIndex((prev) => Math.min(studentMcqs.length - 1, prev + 1))}
                    className="min-h-10 rounded-xl text-xs font-bold text-label-secondary border-separator hover:bg-surface-secondary"
                    endContent={<ChevronRight size={16} />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}

          {selectedType === 'coding' && currentCoding && (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Left Column: Problem Statement & Test Case / Custom Input Details */}
              <div className="w-full lg:w-1/2 overflow-y-auto p-4 sm:p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-separator bg-surface max-h-72 lg:max-h-none shrink-0 lg:shrink">
                {/* Mode Selector (Only Code vs Code with Test Cases) */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-2xl bg-surface-secondary/80 border border-separator">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentCoding._id && configuredMode !== 'TEST_CASES') {
                          setCodingModeMap((prev) => ({ ...prev, [currentCoding._id!]: 'ONLY_CODE' }));
                        }
                      }}
                      disabled={configuredMode === 'TEST_CASES'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeCodingMode === 'ONLY_CODE'
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : configuredMode === 'TEST_CASES'
                          ? 'opacity-40 cursor-not-allowed text-label-tertiary'
                          : 'text-label-secondary hover:text-label-primary hover:bg-white/5'
                      }`}
                    >
                      <Code2 size={13} />
                      <span>Only Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentCoding._id && configuredMode !== 'ONLY_CODE') {
                          setCodingModeMap((prev) => ({ ...prev, [currentCoding._id!]: 'TEST_CASES' }));
                        }
                      }}
                      disabled={configuredMode === 'ONLY_CODE'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeCodingMode === 'TEST_CASES'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : configuredMode === 'ONLY_CODE'
                          ? 'opacity-40 cursor-not-allowed text-label-tertiary'
                          : 'text-label-secondary hover:text-label-primary hover:bg-white/5'
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      <span>Code with Test Cases</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-separator text-label-tertiary">
                    {configuredMode === 'BOTH'
                      ? 'Student Choice'
                      : configuredMode === 'ONLY_CODE'
                      ? 'Admin Graded'
                      : 'Auto-Graded'}
                  </span>
                </div>

                {/* Mode Explanation Notice */}
                {activeCodingMode === 'ONLY_CODE' ? (
                  <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-start gap-2.5 text-xs text-purple-200">
                    <ShieldCheck size={16} className="text-purple-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-purple-300">Only Code Mode (Assigned Admin Evaluation)</p>
                      <p className="text-[11px] text-purple-200/80 leading-relaxed">
                        Submit your code directly. The assigned admin will review your solution logic and assign your score manually. Automated test cases are not executed for pass/fail points.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs text-emerald-200">
                    <Sparkles size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-emerald-300">Test Case Completion Mode (Immediate Points)</p>
                      <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                        Automated evaluation. Submit your solution to test against all test cases. Points are awarded immediately based on test cases passed!
                      </p>
                    </div>
                  </div>
                )}

                {/* Problem Submission Status Banner if already submitted */}
                {currentCoding._id && problemStatusMap[currentCoding._id] && (
                  <div className="p-3 rounded-2xl bg-surface-secondary border border-separator flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                      <span className="font-bold text-label-primary">
                        {problemStatusMap[currentCoding._id].codingMode === 'ONLY_CODE'
                          ? 'Submitted for Admin Review'
                          : problemStatusMap[currentCoding._id].status === 'ACCEPTED'
                          ? 'Challenge Accepted'
                          : 'Submitted with Test Cases'}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {problemStatusMap[currentCoding._id].codingMode === 'ONLY_CODE'
                        ? problemStatusMap[currentCoding._id].isEvaluated
                          ? (isAdmin ? `Graded: ${problemStatusMap[currentCoding._id].pointsEarned} pts` : 'Evaluated by Admin')
                          : 'Pending Admin Grade'
                        : isAdmin && problemStatusMap[currentCoding._id].pointsEarned !== undefined
                        ? `${problemStatusMap[currentCoding._id].testCasesPassed ?? problemStatusMap[currentCoding._id].passedCount ?? 0}/${problemStatusMap[currentCoding._id].totalTestCases || 1} Passed (+${problemStatusMap[currentCoding._id].pointsEarned} pts)`
                        : `${problemStatusMap[currentCoding._id].testCasesPassed ?? problemStatusMap[currentCoding._id].passedCount ?? 0}/${problemStatusMap[currentCoding._id].totalTestCases || 1} Passed`}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pb-2 border-b border-separator">
                  <div className="flex items-center gap-2 flex-wrap">
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
                    {currentCoding.allowedLanguages && currentCoding.allowedLanguages.length > 0 && currentCoding.allowedLanguages.length < 5 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30">
                        Allowed: {currentCoding.allowedLanguages.map((l) => LANG_DISPLAY_NAMES[l] || l).join(', ')}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-label-secondary">
                    {currentCoding.points || 30} Points
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-label-primary">{currentCoding.title}</h3>
                  <p className="text-xs text-label-primary mt-2 leading-relaxed whitespace-pre-line">
                    {currentCoding.description}
                  </p>
                </div>

                {currentCoding.inputFormat && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-label-primary">Input Format</h4>
                    <p className="text-xs text-label-secondary font-mono bg-surface-secondary p-2.5 rounded-xl border border-separator">
                      {currentCoding.inputFormat}
                    </p>
                  </div>
                )}

                {currentCoding.outputFormat && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-label-primary">Output Format</h4>
                    <p className="text-xs text-label-secondary font-mono bg-surface-secondary p-2.5 rounded-xl border border-separator">
                      {currentCoding.outputFormat}
                    </p>
                  </div>
                )}

                {/* Public Test Cases (Always visible, Custom Input is hidden in only code mode) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-label-secondary flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>Public Test Cases</span>
                    </h4>
                    {activeCodingMode === 'ONLY_CODE' && (
                      <span className="text-[10px] text-purple-400 font-semibold">Reference for code submission</span>
                    )}
                  </div>

                  {publicTestCases.length > 0 ? (
                    <div className="space-y-3">
                      {publicTestCases.map((tc: any, tcIdx: number) => (
                        <div
                          key={tcIdx}
                          className="p-3 rounded-xl bg-surface-secondary/70 border border-separator space-y-2"
                        >
                          {publicTestCases.length > 1 && (
                            <div className="text-[11px] font-bold text-label-secondary">
                              Test Case {tcIdx + 1}
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold text-label-tertiary uppercase tracking-wider">
                                Sample Input
                              </span>
                              <pre className="p-2.5 rounded-lg bg-surface dark:bg-black/40 border border-separator text-xs font-mono text-label-primary overflow-x-auto whitespace-pre-wrap">
                                {tc.input || '(No input required)'}
                              </pre>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold text-label-tertiary uppercase tracking-wider">
                                Expected Output
                              </span>
                              <pre className="p-2.5 rounded-lg bg-surface dark:bg-black/40 border border-separator text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                                {tc.expectedOutput || ''}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (currentCoding.sampleInput || currentCoding.sampleOutput) ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-bold text-label-secondary">Sample Input</h4>
                        <pre className="p-3 rounded-xl bg-surface-secondary dark:bg-black/40 border border-separator text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                          {currentCoding.sampleInput || '(No input required)'}
                        </pre>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-bold text-label-secondary">Sample Output</h4>
                        <pre className="p-3 rounded-xl bg-surface-secondary dark:bg-black/40 border border-separator text-xs font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                          {currentCoding.sampleOutput || ''}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-surface-secondary/40 border border-separator text-xs text-label-tertiary italic">
                      No public test cases specified for this challenge.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Monaco Code Editor & Terminal */}
              <div className="w-full lg:w-1/2 flex flex-col flex-1 bg-surface min-h-80">
                {/* Language Toolbar */}
                <div className="min-h-12 px-3 sm:px-4 py-1.5 border-b border-separator flex flex-wrap items-center justify-between gap-2 shrink-0 bg-surface relative z-30">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[11px] font-bold text-label-secondary hidden sm:inline">Language:</span>
                    <HeroUISelect
                      value={currentLanguage}
                      onChange={(newLang) => {
                        setCurrentLanguage(newLang);
                        if (currentCoding?._id) {
                          const starterMap = currentCoding.starterCode || {};
                          setCodingCodes((prev) => ({
                            ...prev,
                            [currentCoding._id!]: {
                              code: starterMap[newLang] || (newLang === 'python' ? '# Write your solution here\n' : '// Write your solution here\n'),
                              language: newLang,
                            },
                          }));
                        }
                      }}
                      options={languageOptions}
                      size="sm"
                      color="purple"
                      placement="bottom-start"
                      className="w-44 sm:w-52"
                    />
                    {currentAllowedLanguages.length < 5 && (
                      <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-md hidden md:inline-flex items-center gap-1">
                        Restricted ({currentAllowedLanguages.length} lang allowed)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {activeCodingMode !== 'ONLY_CODE' && (
                      <Button
                        size="sm"
                        variant="flat"
                        isDisabled={isExecuting}
                        isLoading={isExecuting}
                        onPress={handleRunCode}
                        className="rounded-xl text-white text-xs font-bold"
                        startContent={!isExecuting ? <Play size={12} /> : undefined}
                      >
                        Run
                      </Button>
                    )}

                    <Button
                      size="sm"
                      color={activeCodingMode === 'ONLY_CODE' ? 'secondary' : 'success'}
                      variant="solid"
                      isDisabled={isSubmittingProblem}
                      isLoading={isSubmittingProblem}
                      onPress={handleSubmitProblem}
                      className={`rounded-xl text-white text-xs font-bold shadow-md ${
                        activeCodingMode === 'ONLY_CODE'
                          ? 'shadow-purple-600/20'
                          : 'shadow-emerald-600/20'
                      }`}
                      startContent={!isSubmittingProblem ? <Send size={12} /> : undefined}
                    >
                      {activeCodingMode === 'ONLY_CODE' ? 'Submit Code' : 'Submit Challenge'}
                    </Button>
                  </div>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1 overflow-hidden min-h-50">
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
                      fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace",
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
                  <div className="h-44 border-t border-separator bg-canvas p-3 overflow-y-auto space-y-2 shrink-0 font-mono text-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-separator">
                      <span className="font-bold text-label-secondary flex items-center gap-1.5">
                        <Terminal size={13} />
                        <span>Execution Output</span>
                      </span>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        aria-label="Close execution output"
                        onPress={() => setRunResults(null)}
                        className="text-label-tertiary hover:text-label-primary p-1 min-w-6 h-6"
                      >
                        <X size={14} />
                      </Button>
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
                            Test Case #{res.testCaseNumber}: {res.passed ? 'PASSED' : 'FAILED'}
                          </span>
                          <span className="text-[10px] text-label-tertiary">{res.executionTimeMs}ms</span>
                        </div>
                        <div className="mt-1 space-y-0.5 text-[11px] text-label-primary">
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
          <div className="bg-surface border border-separator rounded-3xl p-6 w-[min(480px,95vw)] max-h-[90dvh] overflow-y-auto shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-label-primary flex items-center gap-2">
              <Send size={18} className="text-purple-400" />
              <span>Submit Assessment Round?</span>
            </h3>

            <p className="text-xs text-label-secondary leading-relaxed">
              {selectedAssessment?.type === 'UI_UX'
                ? `Are you sure you want to finalize "${selectedAssessment?.title}"? Your Figma link and design notes will be recorded for evaluation.`
                : `Are you sure you want to finalize "${selectedAssessment?.title}"? All your MCQ choices and coding submissions will be evaluated and recorded.`}
            </p>

            {selectedAssessment?.type === 'UI_UX' ? (
              <div className="p-3 rounded-2xl bg-surface-secondary border border-separator text-xs space-y-1.5">
                <div className="flex justify-between text-label-primary">
                  <span>Figma Prototype Link:</span>
                  <span className={`font-bold ${studentFigmaLink.trim() ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {studentFigmaLink.trim() ? 'Provided' : 'Missing'}
                  </span>
                </div>
                <div className="flex justify-between text-label-primary">
                  <span>Design Notes:</span>
                  <span className="font-bold text-purple-400">
                    {studentDesignNotes.trim() ? 'Included' : 'None'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-surface-secondary border border-separator text-xs space-y-1.5">
                <div className="flex justify-between text-label-primary">
                  <span>MCQs Answered:</span>
                  <span className="font-bold text-purple-400">
                    {Object.keys(mcqAnswers).length} / {studentMcqs.length}
                  </span>
                </div>
                <div className="flex justify-between text-label-primary">
                  <span>Coding Challenges Evaluated:</span>
                  <span className="font-bold text-blue-400">
                    {Object.keys(problemStatusMap).length} / {studentCoding.length}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="light"
                onPress={() => setShowSubmitConfirm(false)}
                className="min-h-10 rounded-xl text-xs font-semibold text-label-secondary hover:text-label-primary"
              >
                Keep Working
              </Button>
              <Button
                size="sm"
                color="success"
                variant="solid"
                isDisabled={actionLoading}
                isLoading={actionLoading}
                onPress={async () => {
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
                className="min-h-10 rounded-xl text-label-primary font-bold text-xs shadow-md shadow-emerald-500/20"
                startContent={!actionLoading ? <CheckCircle2 size={13} /> : undefined}
              >
                Confirm & Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL SCORE & EVALUATION RESULTS MODAL */}
      {finalResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-4">
          <div className="bg-surface border border-separator rounded-3xl p-6 sm:p-8 w-[min(480px,95vw)] max-h-[90dvh] overflow-y-auto text-center space-y-5 shadow-2xl">
            <div
              className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-lg border ${
                isAdmin && finalResultModal.isPassed
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-emerald-500/20'
                  : 'bg-purple-500/20 border-purple-500/30 text-purple-300 shadow-purple-500/20'
              }`}
            >
              {isAdmin && finalResultModal.isPassed ? <Trophy size={32} /> : <CheckCircle2 size={32} />}
            </div>

            <div>
              <h3 className="text-xl font-black text-white">
                {isAdmin
                  ? (finalResultModal.isPassed ? 'Congratulations! Round Completed' : 'Assessment Completed')
                  : 'Assessment Completed'}
              </h3>
              <p className="text-xs text-label-secondary mt-1">
                Your submission for "{selectedAssessment?.title}" has been recorded.
              </p>
            </div>

            {/* Score Metrics (Visible ONLY to admins; Hidden from students) */}
            {isAdmin && finalResultModal.totalScore !== undefined ? (
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-surface-secondary border border-separator text-center">
                <div>
                  <p className="text-[10px] text-label-tertiary uppercase font-bold">Total Score</p>
                  <p className="text-lg font-black text-white mt-0.5">
                    {finalResultModal.totalScore}
                  </p>
                  <p className="text-[10px] text-label-tertiary">of {finalResultModal.maxPossibleScore}</p>
                </div>

                <div>
                  <p className="text-[10px] text-label-tertiary uppercase font-bold">Percentage</p>
                  <p className="text-lg font-black text-purple-400 mt-0.5">
                    {finalResultModal.scorePercentage}%
                  </p>
                  <p className="text-[10px] text-label-tertiary">Accuracy</p>
                </div>

                <div>
                  <p className="text-[10px] text-label-tertiary uppercase font-bold">Outcome</p>
                  <p
                    className={`text-sm font-black mt-1 ${
                      finalResultModal.isPassed ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {finalResultModal.isPassed ? 'PASSED' : 'PARTICIPATED'}
                  </p>
                  <p className="text-[10px] text-label-tertiary">Status</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 size={16} />
                  <span>Submission Successfully Recorded</span>
                </div>
                <p className="text-xs text-label-secondary max-w-sm mx-auto leading-relaxed">
                  Your attempt has been recorded. Points scored will be credited to your profile upon verification.
                </p>
              </div>
            )}

            {/* Anti-cheat tab switch penalty & duration metrics (detailed for admin, clean summary for student) */}
            {isAdmin ? (
              <div className="p-3.5 rounded-2xl bg-white/3 border border-separator grid grid-cols-2 gap-3 text-xs">
                <div className="text-left">
                  <span className="text-[10px] text-label-tertiary block font-mono">TAB SWITCHES</span>
                  <span
                    className={`font-bold font-mono ${
                      finalResultModal.tabSwitchCount ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {finalResultModal.tabSwitchCount || 0} (-{(finalResultModal.tabSwitchCount || 0) * 5}%)
                  </span>
                  {finalResultModal.rawTotalScore !== undefined && (
                    <span className="text-[10px] text-label-tertiary block">
                      Raw: {finalResultModal.rawTotalScore} pts
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-label-tertiary block font-mono">TIME TAKEN</span>
                  <span className="font-bold font-mono text-purple-300">
                    {Math.floor((finalResultModal.timeTakenSeconds || 0) / 60)}m{' '}
                    {(finalResultModal.timeTakenSeconds || 0) % 60}s
                  </span>
                  <span className="text-[10px] text-label-tertiary block">Total test duration</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white/3 border border-separator flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-label-tertiary block font-mono">TIME TAKEN</span>
                  <span className="font-bold font-mono text-purple-300">
                    {Math.floor((finalResultModal.timeTakenSeconds || 0) / 60)}m{' '}
                    {(finalResultModal.timeTakenSeconds || 0) % 60}s
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-label-tertiary block font-mono">STATUS</span>
                  <span className="font-bold text-emerald-400">Recorded Securely</span>
                </div>
              </div>
            )}

            <Button
              color="secondary"
              variant="solid"
              onPress={handleReturnToHub}
              className="w-full min-h-11 rounded-xl text-label-primary font-bold text-xs shadow-md shadow-purple-600/30"
            >
              Return to Arena Rounds
            </Button>
          </div>
        </div>
      )}

      {/* REFERENCE DESIGN IMAGE LIGHTBOX MODAL */}
      {previewReferenceImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col bg-surface border border-separator rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-separator flex items-center justify-between bg-surface-secondary">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-purple-400" />
                <span className="text-xs font-bold text-label-primary">Reference Design Mockup (Full HD View)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Link
                  target="_blank" rel="noopener noreferrer"
                  href={previewReferenceImg}
                  className="px-3 py-1.5 min-h-8.5 rounded-xl bg-surface-secondary hover:bg-surface-secondary text-label-primary hover:text-label-primary text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink size={13} />
                  <span>Open Full Image</span>
                </Link>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => setPreviewReferenceImg(null)}
                  className="min-w-8.5 min-h-8.5 rounded-xl text-label-secondary hover:text-label-primary"
                >
                  <X size={16} />
                </Button>
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

export default EventArenaWorkspaceView;
