import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Send,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Code2,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Trophy,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Lock,
  FileCode2,
  RotateCcw,
  FileText,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useContestStore, {
  Contest,
  ContestSession,
  MCQQuestion,
  CodingProblem,
} from '../store/useContestStore';
import { useVisibilityChange } from '../hooks/useVisibilityChange';
import { useMediaQuery } from '../hooks/useMediaQuery';
import ContestSubmissionDetailModal from '../components/admin/contests/ContestSubmissionDetailModal';
import RequestReentryModal from '../components/contests/RequestReentryModal';

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

const ACCESSORY_KEYS = [
  { label: 'Tab', value: '    ' },
  { label: '{ }', value: '{}' },
  { label: '( )', value: '()' },
  { label: '[ ]', value: '[]' },
  { label: ':', value: ':' },
  { label: ';', value: ';' },
  { label: '=', value: ' = ' },
  { label: '==', value: ' == ' },
  { label: '"', value: '"' },
  { label: "'", value: "'" },
  { label: '+', value: ' + ' },
  { label: '-', value: ' - ' },
  { label: '*', value: ' * ' },
  { label: '/', value: ' / ' },
  { label: '<', value: ' < ' },
  { label: '>', value: ' > ' },
  { label: '!', value: '!' },
  { label: '_', value: '_' },
];

const getDefaultStarterCode = (lang: string): string => {
  switch (lang) {
    case 'python':
      return '# Write your Python solution here\n';
    case 'javascript':
      return '// Write your JavaScript solution here\n';
    case 'cpp':
      return '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ solution here\n    return 0;\n}\n';
    case 'java':
      return 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your Java solution here\n    }\n}\n';
    case 'c':
      return '#include <stdio.h>\n\nint main() {\n    // Write your C solution here\n    return 0;\n}\n';
    default:
      return `// Solution in ${lang}\n`;
  }
};

const getFileExtension = (lang: string): string => {
  switch (lang) {
    case 'python':
      return 'py';
    case 'javascript':
      return 'js';
    case 'cpp':
      return 'cpp';
    case 'java':
      return 'java';
    case 'c':
      return 'c';
    default:
      return 'txt';
  }
};

export const ContestArenaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    activeContest,
    activeSession,
    loading,
    executing,
    submitting,
    fetchContestById,
    startSession,
    runCode,
    submitProblemCode,
    submitContest,
    fetchMyContestSubmission,
  } = useContestStore();

  const [sessionStarted, setSessionStarted] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'mcq' | 'coding'>('mcq');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReentryModalOpen, setIsReentryModalOpen] = useState(false);
  const [detailedSubmission, setDetailedSubmission] = useState<any | null>(null);
  const [currentMcqIdx, setCurrentMcqIdx] = useState(0);
  const [currentCodingIdx, setCurrentCodingIdx] = useState(0);

  // Student Answers State
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [codeStore, setCodeStore] = useState<Record<string, Record<string, string>>>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');

  // Terminal & Run Output
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'cases' | 'terminal'>('cases');
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState<number>(0);

  // Left Panel Sub-tab on Desktop: 'problem' | 'testcases'
  const [activeLeftTab, setActiveLeftTab] = useState<'problem' | 'testcases'>('problem');

  // Mobile navigation tabs (< 1024px): 'problem' | 'code' | 'testcases' | 'console'
  const [mobileTab, setMobileTab] = useState<'problem' | 'code' | 'testcases' | 'console'>('problem');

  // Run cooldown in seconds
  const [runCooldown, setRunCooldown] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Editor instance ref for accessory keys
  const editorRef = useRef<any>(null);

  // Responsive Breakpoint check
  const isMobile = useMediaQuery('(max-width: 1023px)');

  // Time remaining countdown in seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionCompleteData, setSubmissionCompleteData] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;
    const init = async () => {
      const c = await fetchContestById(id);
      if (c) {
        // If student already finalized this contest, show results dialog immediately
        if (c.mySubmission?.status === 'SUBMITTED') {
          setSubmissionCompleteData({
            totalScore: c.mySubmission.totalScore,
            awardedClubPoints: c.mySubmission.awardedClubPoints,
            submission: c.mySubmission,
          });
          setDetailedSubmission(c.mySubmission);
          return;
        }

        if (c.type === 'CODING') setSelectedSection('coding');
        else setSelectedSection('mcq');

        // Check or start session
        const sess = await startSession(c._id);
        if (sess) {
          setSessionStarted(true);

          // Populate existing mcq answers
          const savedAnswers: Record<string, number> = {};
          (sess.mcqAnswers || []).forEach((a) => {
            savedAnswers[a.questionId] = a.selectedOption;
          });
          setMcqAnswers(savedAnswers);

          // Populate starter codes per problem and language
          const initialStore: Record<string, Record<string, string>> = {};
          const supportedLangs = ['python', 'javascript', 'cpp', 'java', 'c'];

          (c.codingProblems || []).forEach((p) => {
            initialStore[p._id] = {};
            const allowed = p.allowedLanguages && p.allowedLanguages.length > 0
              ? p.allowedLanguages
              : supportedLangs;

            allowed.forEach((lang) => {
              const starter =
                (p.starterCode as any)?.[lang] ||
                (p.starterCode as any)?.get?.(lang) ||
                getDefaultStarterCode(lang);
              initialStore[p._id][lang] = starter;
            });
          });

          // Restore saved coding submissions if any
          (sess.codingSubmissions || []).forEach((cs: any) => {
            const pId = cs.problemId?.toString();
            if (pId && cs.code) {
              if (!initialStore[pId]) initialStore[pId] = {};
              const lang = cs.language || 'python';
              initialStore[pId][lang] = cs.code;
            }
          });

          setCodeStore(initialStore);

          // Calculate initial remaining seconds
          const diff = Math.max(0, Math.floor((new Date(sess.expiresAt).getTime() - Date.now()) / 1000));
          setSecondsRemaining(diff);
        }
      }
    };
    init();
  }, [id]);

  // Unstoppable Countdown Timer
  useEffect(() => {
    if (!sessionStarted || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStarted, secondsRemaining]);

  // Run cooldown timer
  useEffect(() => {
    if (runCooldown <= 0) return;
    const interval = setInterval(() => {
      setRunCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [runCooldown]);

  const handleAutoSubmit = async () => {
    toast('Contest time elapsed! Submitting automatically...', { icon: '⏳' });
    await handleFinalSubmit();
  };

  const handleFinalSubmit = async () => {
    if (!activeContest) return;

    const formattedAnswers = Object.entries(mcqAnswers).map(([qId, optionIdx]) => ({
      questionId: qId,
      selectedOption: optionIdx,
    }));

    const result = await submitContest(activeContest._id, formattedAnswers);
    if (result) {
      setSubmissionCompleteData(result);
      const enrichedRes = await fetchMyContestSubmission(activeContest._id);
      if (enrichedRes.success && enrichedRes.data) {
        setDetailedSubmission(enrichedRes.data);
      }
      setIsSubmitModalOpen(false);
    }
  };

  // Proctored Anti-Cheat: 3 tab switch warnings lock workspace and block account
  const { warnings, isLocked: antiCheatLocked, isMobileProtected } = useVisibilityChange({
    maxWarnings: 3,
    isActive: Boolean(sessionStarted && !submissionCompleteData && secondsRemaining > 0),
    problemId: id,
    context: 'contest',
    onLockTriggered: () => {
      toast.error(
        'Maximum 3 tab switches reached! You have been BLOCKED from attending contests and assessments. Submitting contest now...',
        { duration: 8000 }
      );
      handleFinalSubmit();
    },
  });

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  const insertAccessorySnippet = (snippet: string) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const selection = editor.getSelection();
    if (selection) {
      editor.executeEdits('mobile-keyboard', [
        {
          range: selection,
          text: snippet,
          forceMoveMarkers: true,
        },
      ]);
      editor.focus();
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading && !activeContest) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-label-tertiary">
        <RefreshCw size={24} className="animate-spin text-primary mr-2" />
        <span>Loading contest arena...</span>
      </div>
    );
  }

  if (!activeContest) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background text-center p-4">
        <p className="text-sm font-bold text-label-secondary">Contest not found or closed.</p>
        <button
          onClick={() => navigate('/contests')}
          className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          Return to Contests
        </button>
      </div>
    );
  }

  const mcqs = activeContest.mcqQuestions || [];
  const codings = activeContest.codingProblems || [];
  const currentMcq = mcqs[currentMcqIdx];
  const currentCoding = codings[currentCodingIdx];

  const currentCode =
    (currentCoding && codeStore[currentCoding._id]?.[selectedLanguage]) ??
    (currentCoding
      ? (currentCoding.starterCode as any)?.[selectedLanguage] ||
        (currentCoding.starterCode as any)?.get?.(selectedLanguage) ||
        getDefaultStarterCode(selectedLanguage)
      : '');

  const handleCodeChange = (val?: string) => {
    if (!currentCoding || antiCheatLocked || submitting) return;
    const newCode = val ?? '';
    setCodeStore((prev) => ({
      ...prev,
      [currentCoding._id]: {
        ...(prev[currentCoding._id] || {}),
        [selectedLanguage]: newCode,
      },
    }));
  };

  const handleResetStarterCode = () => {
    if (!currentCoding || antiCheatLocked || executing || submitting) return;
    const starter =
      (currentCoding.starterCode as any)?.[selectedLanguage] ||
      (currentCoding.starterCode as any)?.get?.(selectedLanguage) ||
      getDefaultStarterCode(selectedLanguage);
    handleCodeChange(starter);
    toast.success(`Reset code to ${LANG_DISPLAY_NAMES[selectedLanguage] || selectedLanguage} template`);
  };

  const handleLanguageChange = (lang: string) => {
    if (antiCheatLocked || executing || submitting) return;
    setSelectedLanguage(lang);
    if (currentCoding) {
      if (!codeStore[currentCoding._id]?.[lang]) {
        const starter =
          (currentCoding.starterCode as any)?.[lang] ||
          (currentCoding.starterCode as any)?.get?.(lang) ||
          getDefaultStarterCode(lang);
        setCodeStore((prev) => ({
          ...prev,
          [currentCoding._id]: {
            ...(prev[currentCoding._id] || {}),
            [lang]: starter,
          },
        }));
      }
    }
  };

  const handleSwitchCodingProblem = (idx: number) => {
    if (idx === currentCodingIdx || idx < 0 || idx >= codings.length) return;
    setCurrentCodingIdx(idx);
    setExecutionResult(null);
    setSelectedTestCaseIdx(0);
  };

  const handleRunCode = async () => {
    if (!activeContest || !currentCoding || executing || submitting || antiCheatLocked || runCooldown > 0) return;
    if (!currentCode.trim()) {
      toast.error('Source code cannot be empty');
      return;
    }
    setRunCooldown(8);
    setActiveConsoleTab('cases');
    if (isMobile) setMobileTab('testcases');

    const res = await runCode(activeContest._id, currentCoding._id, currentCode, selectedLanguage);
    if (res) {
      setExecutionResult({
        source: 'run',
        isPassed: res.isSamplePassed,
        stdout: res.stdout || '',
        stderr: res.stderr || '',
        timeMs: res.executionTimeMs || 0,
        expectedOutput: res.expectedOutput || currentCoding.sampleOutput || '',
        input: currentCoding.sampleInput || '',
      });
      setConsoleOutput(
        res.stderr
          ? `Stderr:\n${res.stderr}\n\nStdout:\n${res.stdout || '(no stdout)'}`
          : res.stdout || '$ Program executed successfully with no stdout output.'
      );
      if (res.isSamplePassed) {
        toast.success('Sample test case passed!');
      } else if (res.stderr) {
        toast.error('Runtime error or compilation error');
        if (isMobile) setMobileTab('console');
      } else {
        toast.error('Sample output mismatch');
      }
    }
  };

  const handleSubmitProblemCode = async () => {
    if (!activeContest || !currentCoding || executing || submitting || antiCheatLocked) return;
    if (!currentCode.trim()) {
      toast.error('Source code cannot be empty');
      return;
    }
    setActiveConsoleTab('cases');
    if (isMobile) setMobileTab('testcases');

    const res = await submitProblemCode(activeContest._id, currentCoding._id, currentCode, selectedLanguage);
    if (res) {
      setExecutionResult({
        source: 'submit',
        problemId: res.problemId,
        passedCount: res.passedCount,
        totalTests: res.totalTests,
        pointsEarned: res.pointsEarned,
        maxPoints: res.maxPoints,
        status: res.status,
        testCaseResults: res.testCaseResults || [],
      });
      setConsoleOutput(
        `Evaluation complete: ${res.passedCount}/${res.totalTests} test cases passed (+${res.pointsEarned} pts)\nStatus: ${res.status}`
      );
    }
  };

  const timerColor =
    secondsRemaining < 300
      ? 'text-rose-500 bg-rose-500/10 border-rose-500/20 animate-pulse'
      : secondsRemaining < 900
      ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      : 'text-primary bg-primary/10 border-primary/20';

  // Visible public test cases for problem
  const publicTestCases = (currentCoding?.testCases || []).filter((tc) => !tc.isHidden);
  const displayTestCases =
    publicTestCases.length > 0
      ? publicTestCases
      : currentCoding?.sampleInput
      ? [{ input: currentCoding.sampleInput, expectedOutput: currentCoding.sampleOutput || '', isHidden: false }]
      : [];

  return (
    <div className="h-screen w-full flex flex-col bg-background font-sans overflow-hidden select-none antialiased">
      {/* 1. TOP ARENA APP BAR */}
      <header className="h-14 border-b border-separator bg-surface px-3 sm:px-6 flex items-center justify-between gap-2 shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => {
              if (confirm('Leave arena? Your timer will continue running.')) navigate('/contests');
            }}
            className="p-1.5 hover:bg-surface-raised rounded-xl text-label-secondary shrink-0 cursor-pointer"
            title="Return to Contests"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold text-label-primary tracking-tight truncate max-w-[120px] sm:max-w-xs md:max-w-md">
              {activeContest.title}
            </h1>
            <p className="text-[9px] sm:text-[10px] text-label-tertiary font-mono uppercase tracking-wider truncate">
              {activeContest.type} ARENA · {activeContest.totalPoints} PTS
            </p>
          </div>
        </div>

        {/* Section Switcher (if Hybrid) */}
        {activeContest.type === 'HYBRID' && (
          <div className="flex items-center gap-1 p-1 bg-surface-secondary border border-separator rounded-xl text-xs font-bold shrink-0">
            <button
              onClick={() => setSelectedSection('mcq')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                selectedSection === 'mcq'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              MCQs ({mcqs.length})
            </button>
            <button
              onClick={() => setSelectedSection('coding')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                selectedSection === 'coding'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              Coding ({codings.length})
            </button>
          </div>
        )}

        {/* Problem Switcher in Top Bar (Desktop >= 1024px, when Coding section active & >1 problem) */}
        {selectedSection === 'coding' && codings.length > 1 && (
          <div className="hidden lg:flex items-center gap-1 p-0.5 rounded-xl bg-surface-secondary border border-separator">
            {codings.map((p, idx) => {
              const submission = (activeSession?.codingSubmissions || []).find(
                (cs) => cs.problemId?.toString() === p._id.toString()
              );
              const isPassed =
                submission?.status === 'ACCEPTED' ||
                (submission?.passedTestCases === submission?.totalTestCases && (submission?.totalTestCases || 0) > 0);
              const isActive = currentCodingIdx === idx;
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => handleSwitchCodingProblem(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-label-secondary hover:text-label-primary'
                  }`}
                >
                  <span>{`Problem ${idx + 1}`}</span>
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : submission ? (
                    <span className="text-[10px] text-amber-500 font-mono">
                      ({submission.pointsEarned}p)
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-separator" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Countdown, Anti-cheat & Final Submit Button */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {isMobileProtected ? (
            <div
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              title="Mobile Call Protection Active: Phone calls and incoming interruptions will not increase warnings"
            >
              <ShieldCheck size={12} className="sm:w-[13px] sm:h-[13px]" />
              <span className="hidden xs:inline">Call Protected</span>
            </div>
          ) : warnings > 0 ? (
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
              <AlertTriangle size={12} className="sm:w-[13px] sm:h-[13px]" />
              <span>Warnings: {warnings}/3</span>
            </div>
          ) : null}

          <div
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-xl border text-[11px] sm:text-xs font-mono font-bold ${timerColor}`}
          >
            <Clock size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={submitting || antiCheatLocked}
            className="px-2.5 sm:px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send size={12} className="sm:w-[13px] sm:h-[13px]" />
            <span className="hidden sm:inline">Submit Contest</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </header>

      {/* 2. ARENA CONTENT BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* ════════ SECTION A: MCQ ARENA ════════ */}
        {selectedSection === 'mcq' && currentMcq && (
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
            {/* Left Question Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 space-y-4 sm:space-y-6 max-w-3xl mx-auto w-full">
              <div className="flex items-center justify-between border-b border-separator pb-3 sm:pb-4">
                <span className="text-xs font-mono font-bold text-primary">
                  Question {currentMcqIdx + 1} of {mcqs.length}
                </span>
                <span className="text-xs font-mono text-label-secondary font-semibold">
                  +{currentMcq.points} Points
                </span>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-base sm:text-xl font-bold text-label-primary leading-relaxed break-words">
                  {currentMcq.question}
                </h2>

                {/* Options List */}
                <div className="space-y-2.5 sm:space-y-3 pt-2 sm:pt-4">
                  {currentMcq.options.map((opt: string, optIdx: number) => {
                    const isSelected = mcqAnswers[currentMcq._id] === optIdx;
                    return (
                      <div
                        key={optIdx}
                        onClick={() =>
                          setMcqAnswers({
                            ...mcqAnswers,
                            [currentMcq._id]: optIdx,
                          })
                        }
                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all flex items-center gap-3 sm:gap-3.5 text-xs font-medium ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-label-primary shadow-xs ring-1 ring-primary'
                            : 'bg-surface border-separator hover:border-primary/40 text-label-secondary'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center font-bold font-mono text-[11px] shrink-0 ${
                            isSelected
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface-secondary border-separator text-label-secondary'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1 break-words min-w-0">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-separator">
                <button
                  disabled={currentMcqIdx === 0}
                  onClick={() => setCurrentMcqIdx(currentMcqIdx - 1)}
                  className="px-3 sm:px-4 py-2 bg-surface border border-separator rounded-xl text-xs font-semibold text-label-secondary hover:text-label-primary disabled:opacity-30 hover:bg-surface-secondary transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <button
                  disabled={currentMcqIdx === mcqs.length - 1}
                  onClick={() => setCurrentMcqIdx(currentMcqIdx + 1)}
                  className="px-3 sm:px-4 py-2 bg-surface border border-separator rounded-xl text-xs font-semibold text-label-secondary hover:text-label-primary disabled:opacity-30 hover:bg-surface-secondary transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Right Question Navigation Matrix */}
            <div className="w-full sm:w-64 border-t sm:border-t-0 sm:border-l border-separator bg-surface p-3.5 sm:p-6 space-y-3 sm:space-y-4 shrink-0 max-h-48 sm:max-h-none overflow-y-auto sm:overflow-visible">
              <h3 className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                Question Matrix
              </h3>
              <div className="grid grid-cols-6 sm:grid-cols-4 gap-1.5 sm:gap-2">
                {mcqs.map((q, idx) => {
                  const isAnswered = mcqAnswers[q._id] !== undefined;
                  const isCurrent = idx === currentMcqIdx;
                  return (
                    <button
                      key={q._id}
                      onClick={() => setCurrentMcqIdx(idx)}
                      className={`h-8 sm:h-10 rounded-lg sm:rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                        isCurrent
                          ? 'ring-2 ring-primary border-primary text-primary bg-primary/10'
                          : isAnswered
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-surface-secondary border-separator text-label-secondary hover:border-primary/40 hover:text-label-primary'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 sm:pt-4 border-t border-separator space-y-1 sm:space-y-1.5 text-[10px] sm:text-[11px] text-label-tertiary">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-md bg-emerald-500/20 border border-emerald-500/30" />
                  <span>Answered ({Object.keys(mcqAnswers).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-md bg-surface-secondary border border-separator" />
                  <span>Unanswered ({mcqs.length - Object.keys(mcqAnswers).length})</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ SECTION B: CODING ARENA (MATCHES NORMAL ASSESSMENT LAYOUT) ════════ */}
        {selectedSection === 'coding' && currentCoding && (
          <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
            {/* ── DESKTOP CODING WORKSPACE (>= 1024px) ── */}
            <div className="hidden lg:flex flex-1 h-full w-full overflow-hidden">
              <PanelGroup direction="horizontal" className="h-full w-full overflow-hidden">
                {/* 1. LEFT PANEL: Problem, Constraints, Examples & Public Test Cases */}
                <Panel defaultSize={42} minSize={25} className="flex flex-col bg-surface border-r border-separator overflow-hidden">
                  {/* Left Tabs Bar */}
                  <div className="h-10 border-b border-separator flex items-center px-4 gap-2 shrink-0 bg-surface">
                    <button
                      type="button"
                      onClick={() => setActiveLeftTab('problem')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        activeLeftTab === 'problem'
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-label-secondary hover:text-label-primary'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Problem</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLeftTab('testcases')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        activeLeftTab === 'testcases'
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-label-secondary hover:text-label-primary'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Test Cases ({displayTestCases.length})</span>
                    </button>
                  </div>

                  {/* Left Tab Content Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-label-secondary leading-relaxed scrollbar-thin">
                    {activeLeftTab === 'problem' ? (
                      <>
                        {/* Title, Difficulty & Points */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                currentCoding.difficulty === 'Easy'
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : currentCoding.difficulty === 'Hard'
                                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              }`}
                            >
                              {currentCoding.difficulty}
                            </span>
                            <span className="text-xs font-mono font-bold text-amber-500">
                              +{currentCoding.points} Points
                            </span>
                          </div>
                          <h2 className="text-xl font-extrabold text-label-primary tracking-tight">
                            {currentCoding.title}
                          </h2>
                        </div>

                        {/* Problem Description */}
                        <div className="text-xs text-label-secondary leading-relaxed whitespace-pre-line">
                          {currentCoding.description}
                        </div>

                        {/* Input Format */}
                        {currentCoding.inputFormat && (
                          <div className="space-y-1.5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-label-tertiary">
                              Input Format
                            </h3>
                            <div className="p-3 rounded-xl bg-surface-secondary border border-separator font-mono text-xs text-label-primary whitespace-pre-wrap">
                              {currentCoding.inputFormat}
                            </div>
                          </div>
                        )}

                        {/* Output Format */}
                        {currentCoding.outputFormat && (
                          <div className="space-y-1.5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-label-tertiary">
                              Output Format
                            </h3>
                            <div className="p-3 rounded-xl bg-surface-secondary border border-separator font-mono text-xs text-label-primary whitespace-pre-wrap">
                              {currentCoding.outputFormat}
                            </div>
                          </div>
                        )}

                        {/* Constraints */}
                        {currentCoding.constraints && (
                          <div className="space-y-1.5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-label-tertiary">
                              Constraints
                            </h3>
                            <div className="p-3 rounded-xl bg-surface-secondary border border-separator font-mono text-xs text-label-primary whitespace-pre-wrap">
                              {currentCoding.constraints}
                            </div>
                          </div>
                        )}

                        {/* Sample Example */}
                        {currentCoding.sampleInput && (
                          <div className="space-y-3 pt-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-label-tertiary">
                              Sample Example
                            </h3>
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] text-label-tertiary">
                                  <span>Sample Input</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(currentCoding.sampleInput || '', 'sample-in')}
                                    className="flex items-center gap-1 text-[10px] text-label-secondary hover:text-label-primary cursor-pointer"
                                  >
                                    {copiedKey === 'sample-in' ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                    <span>{copiedKey === 'sample-in' ? 'Copied' : 'Copy'}</span>
                                  </button>
                                </div>
                                <pre className="p-3 bg-surface-secondary rounded-xl font-mono text-xs text-label-primary border border-separator overflow-x-auto">
                                  {currentCoding.sampleInput}
                                </pre>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] text-label-tertiary">
                                  <span>Sample Output</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(currentCoding.sampleOutput || '', 'sample-out')}
                                    className="flex items-center gap-1 text-[10px] text-label-secondary hover:text-label-primary cursor-pointer"
                                  >
                                    {copiedKey === 'sample-out' ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                    <span>{copiedKey === 'sample-out' ? 'Copied' : 'Copy'}</span>
                                  </button>
                                </div>
                                <pre className="p-3 bg-surface-secondary rounded-xl font-mono text-xs text-emerald-500 dark:text-emerald-400 border border-separator overflow-x-auto">
                                  {currentCoding.sampleOutput}
                                </pre>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Public Test Cases Tab */
                      <div className="space-y-4">
                        <p className="text-xs text-label-tertiary">
                          These visible test cases are validated during execution. Final grading includes additional hidden test cases.
                        </p>
                        <div className="space-y-3">
                          {displayTestCases.map((tc, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-2xl bg-surface-secondary border border-separator space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-label-primary font-mono">
                                  Test Case #{idx + 1}
                                </span>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-label-tertiary bg-surface px-2 py-0.5 rounded-full border border-separator">
                                  Public
                                </span>
                              </div>
                              <div className="space-y-2 font-mono text-xs">
                                <div>
                                  <span className="text-[10px] text-label-tertiary uppercase">Input:</span>
                                  <pre className="mt-1 p-2 bg-surface rounded-lg border border-separator text-label-primary overflow-x-auto">
                                    {tc.input || '(empty)'}
                                  </pre>
                                </div>
                                <div>
                                  <span className="text-[10px] text-label-tertiary uppercase">Expected Output:</span>
                                  <pre className="mt-1 p-2 bg-surface rounded-lg border border-separator text-emerald-500 dark:text-emerald-400 overflow-x-auto">
                                    {tc.expectedOutput}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>

                {/* Resizable Divider Between Problem & Editor */}
                <PanelResizeHandle className="w-1.5 bg-black hover:bg-primary/50 transition-colors relative group cursor-col-resize">
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/[0.08] group-hover:bg-primary" />
                </PanelResizeHandle>

                {/* 2. RIGHT PANEL: Resizable Monaco Editor & OLED Terminal */}
                <Panel defaultSize={58} minSize={30} className="flex flex-col overflow-hidden bg-[#050505]">
                  <PanelGroup direction="vertical" className="h-full w-full overflow-hidden">
                    {/* Monaco Code Editor Sub-Panel */}
                    <Panel defaultSize={65} minSize={30} className="flex flex-col bg-[#050505] relative overflow-hidden">
                      {/* Editor Sub-Header Toolbar */}
                      <div className="h-10 border-b border-white/[0.08] bg-black/60 px-4 flex items-center justify-between shrink-0 text-xs">
                        {/* Filename & Problem Indicator */}
                        <div className="flex items-center gap-2">
                          <Code2 className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="text-xs font-mono text-neutral-300">
                            solution.{getFileExtension(selectedLanguage)}
                          </span>
                          {antiCheatLocked && (
                            <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              <Lock className="w-2.5 h-2.5" /> Locked
                            </span>
                          )}
                        </div>

                        {/* Actions: Language, Reset, Run, Submit */}
                        <div className="flex items-center gap-2">
                          {/* Language Selector */}
                          <div className="relative">
                            <select
                              value={selectedLanguage}
                              onChange={(e) => handleLanguageChange(e.target.value)}
                              disabled={antiCheatLocked || executing || submitting}
                              className="appearance-none bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-50 border border-white/[0.12] rounded-xl px-3 py-1 text-xs font-medium text-neutral-200 transition-all cursor-pointer focus:outline-none pr-6"
                            >
                              <option value="python" className="bg-neutral-900 text-white">Python 3</option>
                              <option value="javascript" className="bg-neutral-900 text-white">JavaScript</option>
                              <option value="cpp" className="bg-neutral-900 text-white">C++ (GCC)</option>
                              <option value="java" className="bg-neutral-900 text-white">Java</option>
                              <option value="c" className="bg-neutral-900 text-white">C (GCC)</option>
                            </select>
                            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-neutral-400">
                              ▼
                            </span>
                          </div>

                          {/* Reset Template */}
                          <button
                            type="button"
                            onClick={handleResetStarterCode}
                            disabled={antiCheatLocked || executing || submitting}
                            title="Reset code template"
                            className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white transition-all border border-white/[0.08] cursor-pointer disabled:opacity-40"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* Run Code */}
                          <button
                            type="button"
                            onClick={handleRunCode}
                            disabled={executing || submitting || antiCheatLocked || runCooldown > 0}
                            title={runCooldown > 0 ? `Cooldown (${runCooldown}s)` : 'Run Code against sample'}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.2] disabled:opacity-40 text-neutral-200 transition-all border border-white/[0.1] cursor-pointer"
                          >
                            {executing ? (
                              <Loader2 className="w-3 h-3 animate-spin text-neutral-300" />
                            ) : runCooldown > 0 ? (
                              <Clock className="w-3 h-3 text-neutral-400" />
                            ) : (
                              <Play className="w-3 h-3 fill-current text-emerald-400" />
                            )}
                            <span>
                              {executing ? 'Running...' : runCooldown > 0 ? `Run (${runCooldown}s)` : 'Run'}
                            </span>
                          </button>

                          {/* Submit Problem Code */}
                          <button
                            type="button"
                            onClick={handleSubmitProblemCode}
                            disabled={executing || submitting || antiCheatLocked}
                            className="flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-bold bg-primary hover:brightness-110 active:scale-95 disabled:opacity-40 text-white transition-all shadow-xs cursor-pointer"
                          >
                            {executing ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            <span>Submit</span>
                          </button>
                        </div>
                      </div>

                      {/* Monaco Code Editor Container (100% Height Guaranteed) */}
                      <div className="flex-1 relative overflow-hidden min-h-0">
                        <Editor
                          height="100%"
                          theme="vs-dark"
                          language={MONACO_LANG_MAP[selectedLanguage] || 'python'}
                          value={currentCode}
                          onMount={handleEditorMount}
                          onChange={handleCodeChange}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, Consolas, monospace",
                            fontLigatures: true,
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            lineNumbers: 'on',
                            lineNumbersMinChars: 3,
                            roundedSelection: true,
                            readOnly: antiCheatLocked || executing || submitting,
                            domReadOnly: antiCheatLocked,
                            bracketPairColorization: { enabled: true },
                            padding: { top: 12, bottom: 12 },
                            cursorBlinking: 'smooth',
                            renderLineHighlight: 'all',
                            overviewRulerBorder: false,
                            hideCursorInOverviewRuler: true,
                          }}
                        />

                        {/* Locked Spatial Glass Overlay */}
                        {antiCheatLocked && (
                          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
                            <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center mb-3">
                              <Lock className="w-6 h-6 text-neutral-300" />
                            </div>
                            <h3 className="text-sm font-bold text-white mb-1">
                              Contest Blocked & Workspace Locked
                            </h3>
                            <p className="text-xs text-neutral-400 max-w-sm">
                              Maximum tab switches reached. Editor is locked and contest has been submitted.
                            </p>
                          </div>
                        )}
                      </div>
                    </Panel>

                    {/* Vertical Resizable Divider */}
                    <PanelResizeHandle className="h-1.5 bg-black hover:bg-primary/50 transition-colors relative group cursor-row-resize">
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/[0.08] group-hover:bg-primary" />
                    </PanelResizeHandle>

                    {/* OLED Execution Output Terminal Sub-Panel */}
                    <Panel defaultSize={35} minSize={15} className="flex flex-col bg-[#000000] text-neutral-200 overflow-hidden border-t border-white/[0.08]">
                      {/* Terminal Header Tabs */}
                      <div className="h-9 border-b border-white/[0.08] bg-black/80 px-4 flex items-center justify-between shrink-0 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveConsoleTab('cases')}
                            className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              activeConsoleTab === 'cases'
                                ? 'bg-white/[0.14] text-white'
                                : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Test Results</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveConsoleTab('terminal')}
                            className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              activeConsoleTab === 'terminal'
                                ? 'bg-white/[0.14] text-white'
                                : 'text-neutral-400 hover:text-neutral-200'
                            }`}
                          >
                            <Terminal className="w-3 h-3 text-neutral-400" />
                            <span>Console Output</span>
                          </button>
                        </div>

                        {executionResult && (
                          <span className="text-[11px] font-mono text-neutral-400">
                            {executionResult.source === 'submit'
                              ? `${executionResult.passedCount} / ${executionResult.totalTests} Passed`
                              : `${executionResult.timeMs || 0} ms`}
                          </span>
                        )}
                      </div>

                      {/* Terminal Body */}
                      <div className="flex-1 overflow-y-auto p-4 bg-[#000000] font-mono text-xs scrollbar-thin">
                        {activeConsoleTab === 'cases' ? (
                          executionResult ? (
                            executionResult.source === 'run' ? (
                              /* Run Code Result (Sample Test Case) */
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02]">
                                  <div className="flex items-center gap-2">
                                    {executionResult.isPassed ? (
                                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                        <CheckCircle2 size={14} /> ✓ Sample Output Matched
                                      </span>
                                    ) : (
                                      <span className="text-rose-400 font-bold flex items-center gap-1.5">
                                        <XCircle size={14} /> Output Mismatch
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-neutral-400">
                                    Execution: {executionResult.timeMs || 0} ms
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
                                      Your Output (stdout):
                                    </div>
                                    <pre className="p-2.5 rounded-xl bg-neutral-950 border border-white/[0.08] text-neutral-200 overflow-x-auto min-h-[44px]">
                                      {executionResult.stdout || '(no output)'}
                                    </pre>
                                  </div>

                                  <div>
                                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
                                      Expected Output:
                                    </div>
                                    <pre className="p-2.5 rounded-xl bg-neutral-950 border border-white/[0.08] text-emerald-400 overflow-x-auto min-h-[44px]">
                                      {executionResult.expectedOutput || '(none)'}
                                    </pre>
                                  </div>
                                </div>

                                {executionResult.stderr && (
                                  <div>
                                    <div className="text-[10px] text-rose-400 uppercase tracking-wider mb-1">
                                      Stderr:
                                    </div>
                                    <pre className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/25 text-rose-300 overflow-x-auto">
                                      {executionResult.stderr}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Problem Submission Result (All Test Cases) */
                              <div className="space-y-4">
                                <div
                                  className={`p-3 rounded-xl border flex items-center justify-between ${
                                    executionResult.status === 'ACCEPTED'
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 font-bold text-xs">
                                    {executionResult.status === 'ACCEPTED' ? (
                                      <CheckCircle2 size={16} />
                                    ) : (
                                      <XCircle size={16} />
                                    )}
                                    <span>
                                      {executionResult.status === 'ACCEPTED'
                                        ? `Accepted! All ${executionResult.passedCount}/${executionResult.totalTests} passed (+${executionResult.pointsEarned} pts)`
                                        : `Passed ${executionResult.passedCount}/${executionResult.totalTests} test cases (+${executionResult.pointsEarned} pts)`}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-mono opacity-80 uppercase">
                                    {executionResult.status}
                                  </span>
                                </div>

                                {/* Test Case Tab Pills */}
                                <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-2 overflow-x-auto">
                                  {executionResult.testCaseResults.map((tc: any, i: number) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => setSelectedTestCaseIdx(i)}
                                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                        selectedTestCaseIdx === i
                                          ? 'bg-white/[0.14] text-white border border-white/[0.15]'
                                          : 'bg-white/[0.03] text-neutral-400 hover:text-white border border-transparent'
                                      }`}
                                    >
                                      {tc.passed ? (
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <XCircle className="w-3 h-3 text-rose-400" />
                                      )}
                                      <span>Case {i + 1}</span>
                                      {tc.isHidden && (
                                        <span className="text-[9px] opacity-60">(Hidden)</span>
                                      )}
                                    </button>
                                  ))}
                                </div>

                                {/* Selected Test Case Breakdown */}
                                {executionResult.testCaseResults[selectedTestCaseIdx] && (
                                  <div className="space-y-3">
                                    {executionResult.testCaseResults[selectedTestCaseIdx].isHidden ? (
                                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neutral-400 text-xs">
                                        Hidden test case evaluated. Output details are suppressed to preserve contest integrity.
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
                                            Your Output:
                                          </div>
                                          <pre className="p-2.5 rounded-xl bg-neutral-950 border border-white/[0.08] text-neutral-200 overflow-x-auto min-h-[44px]">
                                            {executionResult.testCaseResults[selectedTestCaseIdx].actualOutput || '(no output)'}
                                          </pre>
                                        </div>
                                        <div>
                                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">
                                            Expected Output:
                                          </div>
                                          <pre className="p-2.5 rounded-xl bg-neutral-950 border border-white/[0.08] text-emerald-400 overflow-x-auto min-h-[44px]">
                                            {executionResult.testCaseResults[selectedTestCaseIdx].expectedOutput || '(none)'}
                                          </pre>
                                        </div>
                                      </div>
                                    )}

                                    {executionResult.testCaseResults[selectedTestCaseIdx].error && (
                                      <div>
                                        <div className="text-[10px] text-rose-400 uppercase tracking-wider mb-1">
                                          Stderr / Exception:
                                        </div>
                                        <pre className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/25 text-rose-300 overflow-x-auto">
                                          {executionResult.testCaseResults[selectedTestCaseIdx].error}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          ) : (
                            <div className="h-full flex items-center justify-center text-neutral-500 text-xs py-8">
                              Press "Run" to test against sample test case or "Submit" to evaluate all problem test cases.
                            </div>
                          )
                        ) : (
                          /* Console / Raw Terminal Output */
                          <pre className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
                            {consoleOutput || '$ Ready for code execution...'}
                          </pre>
                        )}
                      </div>
                    </Panel>
                  </PanelGroup>
                </Panel>
              </PanelGroup>
            </div>

            {/* ── MOBILE CODING WORKSPACE (< 1024px) ── */}
            <div className="flex lg:hidden flex-col flex-1 h-full w-full overflow-hidden bg-[#000000]">
              {/* Multi-Problem Switcher Bar on Mobile (if >1 problem) */}
              {codings.length > 1 && (
                <div className="px-3 py-2 bg-neutral-950 border-b border-white/[0.08] flex items-center gap-1.5 overflow-x-auto shrink-0 z-20">
                  {codings.map((p, idx) => {
                    const submission = (activeSession?.codingSubmissions || []).find(
                      (cs) => cs.problemId?.toString() === p._id.toString()
                    );
                    const isPassed =
                      submission?.status === 'ACCEPTED' ||
                      (submission?.passedTestCases === submission?.totalTestCases && (submission?.totalTestCases || 0) > 0);
                    const isActive = currentCodingIdx === idx;
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => handleSwitchCodingProblem(idx)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-white/[0.04] text-neutral-400 hover:text-white'
                        }`}
                      >
                        <span>{`Problem ${idx + 1}`}</span>
                        {isPassed ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : submission ? (
                          <span className="text-[10px] text-amber-400 font-mono">
                            ({submission.pointsEarned}p)
                          </span>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Segmented Mobile Tab Navigation Bar */}
              <div className="px-2.5 py-1.5 bg-black/95 border-b border-white/[0.08] grid grid-cols-4 gap-1 shrink-0 z-20">
                <button
                  type="button"
                  onClick={() => setMobileTab('problem')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    mobileTab === 'problem'
                      ? 'bg-white/[0.14] text-white shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Problem</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMobileTab('code')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    mobileTab === 'code'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMobileTab('testcases')}
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    mobileTab === 'testcases'
                      ? 'bg-white/[0.14] text-white shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {executionResult?.isPassed || executionResult?.status === 'ACCEPTED' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span>Tests</span>
                  {executionResult?.source === 'submit' && (
                    <span className="text-[9px] px-1 rounded font-mono font-bold bg-white/10">
                      {executionResult.passedCount}/{executionResult.totalTests}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMobileTab('console')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    mobileTab === 'console'
                      ? 'bg-white/[0.14] text-white shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Console</span>
                </button>
              </div>

              {/* Mobile Tab Views */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* TAB 1: Mobile Problem Description */}
                {mobileTab === 'problem' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-neutral-300 leading-relaxed">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {currentCoding.difficulty}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-500">
                          +{currentCoding.points} Points
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-white tracking-tight">
                        {currentCoding.title}
                      </h2>
                    </div>

                    <div className="whitespace-pre-line leading-relaxed text-neutral-300">
                      {currentCoding.description}
                    </div>

                    {currentCoding.constraints && (
                      <div className="space-y-1.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                          Constraints
                        </h3>
                        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] font-mono text-xs whitespace-pre-wrap text-neutral-200">
                          {currentCoding.constraints}
                        </div>
                      </div>
                    )}

                    {currentCoding.sampleInput && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                          Sample Example
                        </h3>
                        <div className="space-y-1">
                          <span className="text-[11px] text-neutral-500 font-medium">Sample Input</span>
                          <pre className="p-2.5 rounded-xl bg-neutral-950 border border-white/[0.08] font-mono text-xs text-neutral-200 overflow-x-auto">
                            {currentCoding.sampleInput}
                          </pre>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] text-neutral-500 font-medium">Sample Output</span>
                          <pre className="p-2.5 rounded-xl bg-neutral-950 border border-white/[0.08] font-mono text-xs text-emerald-400 overflow-x-auto">
                            {currentCoding.sampleOutput}
                          </pre>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 pb-4">
                      <button
                        type="button"
                        onClick={() => setMobileTab('code')}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-primary text-white flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Code2 className="w-4 h-4" />
                        <span>Write Code in Editor →</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: Mobile Code Editor & Accessory Keyboard Row (100% Height Guaranteed) */}
                {mobileTab === 'code' && (
                  <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505] relative">
                    {/* Filename Bar */}
                    <div className="h-8 border-b border-white/[0.06] bg-black/40 px-3 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Code2 className="w-3 h-3 text-neutral-400" />
                        <span className="text-[11px] font-mono text-neutral-300">
                          solution.{getFileExtension(selectedLanguage)}
                        </span>
                      </div>
                      {antiCheatLocked && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          <Lock className="w-2.5 h-2.5" /> Locked
                        </span>
                      )}
                    </div>

                    {/* Monaco Editor Container */}
                    <div className="flex-1 relative overflow-hidden min-h-0">
                      <Editor
                        height="100%"
                        language={MONACO_LANG_MAP[selectedLanguage] || 'python'}
                        value={currentCode}
                        theme="vs-dark"
                        onMount={handleEditorMount}
                        onChange={handleCodeChange}
                        options={{
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 13,
                          lineNumbers: 'on',
                          lineNumbersMinChars: 3,
                          roundedSelection: true,
                          readOnly: antiCheatLocked || executing || submitting,
                          domReadOnly: antiCheatLocked,
                          bracketPairColorization: { enabled: true },
                          automaticLayout: true,
                          padding: { top: 10, bottom: 10 },
                          fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Monaco, Consolas, monospace",
                          fontLigatures: true,
                          cursorBlinking: 'smooth',
                          renderLineHighlight: 'all',
                          overviewRulerBorder: false,
                          hideCursorInOverviewRuler: true,
                        }}
                      />

                      {/* Locked Spatial Glass Overlay */}
                      {antiCheatLocked && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-30">
                          <div className="w-10 h-10 rounded-2xl bg-neutral-800/80 border border-white/10 flex items-center justify-center mb-2">
                            <Lock className="w-5 h-5 text-neutral-300" />
                          </div>
                          <h3 className="text-sm font-semibold text-white">Contest Blocked</h3>
                          <p className="text-[11px] text-neutral-400 mt-1 max-w-xs">
                            Maximum warnings reached. Contest editor disabled.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Mobile Quick Coding Accessory Keyboard Row */}
                    <div className="h-10 border-t border-white/[0.08] bg-neutral-950 px-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 z-20">
                      {ACCESSORY_KEYS.map((acc, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => insertAccessorySnippet(acc.value)}
                          disabled={antiCheatLocked || executing || submitting}
                          className="h-7 px-2.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] active:bg-white/[0.22] text-xs font-mono font-medium text-neutral-200 border border-white/[0.08] transition-all shrink-0 cursor-pointer disabled:opacity-40"
                        >
                          {acc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: Mobile Test Cases & Execution Results */}
                {mobileTab === 'testcases' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono text-neutral-200">
                    {executionResult ? (
                      executionResult.source === 'run' ? (
                        <div className="space-y-3">
                          <div
                            className={`p-3 rounded-xl border flex items-center justify-between ${
                              executionResult.isPassed
                                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 font-bold text-xs">
                              {executionResult.isPassed ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Sample Passed</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4" />
                                  <span>Output Mismatch</span>
                                </>
                              )}
                            </div>
                            <span className="text-[10px] font-mono opacity-80">
                              {executionResult.timeMs || 0} ms
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                              Your Output:
                            </span>
                            <pre className="p-2.5 rounded-xl bg-black border border-white/[0.08] text-neutral-200 overflow-x-auto text-xs">
                              {executionResult.stdout || '(no output)'}
                            </pre>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                              Expected Output:
                            </span>
                            <pre className="p-2.5 rounded-xl bg-black border border-white/[0.08] text-emerald-400 overflow-x-auto text-xs">
                              {executionResult.expectedOutput}
                            </pre>
                          </div>

                          {executionResult.stderr && (
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                                Error:
                              </span>
                              <pre className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/25 text-rose-300 overflow-x-auto text-xs">
                                {executionResult.stderr}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Submit Problem Results on Mobile */
                        <div className="space-y-3">
                          <div
                            className={`p-3 rounded-xl border flex items-center justify-between ${
                              executionResult.status === 'ACCEPTED'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 font-bold text-xs">
                              {executionResult.status === 'ACCEPTED' ? (
                                <CheckCircle2 size={16} />
                              ) : (
                                <XCircle size={16} />
                              )}
                              <span>
                                {executionResult.passedCount}/{executionResult.totalTests} Passed (+{executionResult.pointsEarned} pts)
                              </span>
                            </div>
                            <span className="text-[10px] font-mono opacity-80 uppercase">
                              {executionResult.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {executionResult.testCaseResults.map((tc: any, i: number) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setSelectedTestCaseIdx(i)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
                                  selectedTestCaseIdx === i
                                    ? 'bg-white/[0.14] text-white border border-white/[0.15]'
                                    : 'bg-white/[0.03] text-neutral-400 hover:text-white border border-transparent'
                                }`}
                              >
                                {tc.passed ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-rose-400" />
                                )}
                                <span>Case {i + 1}</span>
                              </button>
                            ))}
                          </div>

                          {executionResult.testCaseResults[selectedTestCaseIdx] && (
                            <div className="space-y-2">
                              {executionResult.testCaseResults[selectedTestCaseIdx].isHidden ? (
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neutral-400 text-xs">
                                  Hidden test case evaluated. Output details are suppressed.
                                </div>
                              ) : (
                                <>
                                  <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                                      Your Output:
                                    </span>
                                    <pre className="p-2.5 rounded-xl bg-black border border-white/[0.08] text-neutral-200 overflow-x-auto text-xs">
                                      {executionResult.testCaseResults[selectedTestCaseIdx].actualOutput || '(no output)'}
                                    </pre>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                                      Expected Output:
                                    </span>
                                    <pre className="p-2.5 rounded-xl bg-black border border-white/[0.08] text-emerald-400 overflow-x-auto text-xs">
                                      {executionResult.testCaseResults[selectedTestCaseIdx].expectedOutput || '(none)'}
                                    </pre>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-neutral-400 text-xs text-center space-y-2">
                        <p>No executions yet for this problem.</p>
                        <button
                          type="button"
                          onClick={handleRunCode}
                          disabled={executing || submitting || antiCheatLocked || runCooldown > 0}
                          className="text-primary font-bold hover:underline cursor-pointer"
                        >
                          Run sample code now →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: Mobile Terminal Console Output */}
                {mobileTab === 'console' && (
                  <div className="flex-1 overflow-y-auto p-4 bg-[#000000] font-mono text-xs text-neutral-300 scrollbar-thin">
                    <pre className="whitespace-pre-wrap leading-relaxed">
                      {consoleOutput || '$ Ready for code execution...'}
                    </pre>
                  </div>
                )}
              </div>

              {/* Mobile Sticky Bottom Action Dock */}
              <div className="px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.6rem)] bg-neutral-950/95 backdrop-blur-2xl border-t border-white/[0.08] flex items-center justify-between gap-2 shrink-0 z-30">
                {/* Language Selector */}
                <div className="relative shrink-0">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    disabled={antiCheatLocked || executing || submitting}
                    className="appearance-none bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.12] rounded-xl px-2.5 py-2 text-xs font-semibold text-neutral-200 transition-all cursor-pointer focus:outline-none pr-6"
                  >
                    <option value="python" className="bg-neutral-900 text-white">Python 3</option>
                    <option value="javascript" className="bg-neutral-900 text-white">JS</option>
                    <option value="cpp" className="bg-neutral-900 text-white">C++</option>
                    <option value="java" className="bg-neutral-900 text-white">Java</option>
                    <option value="c" className="bg-neutral-900 text-white">C</option>
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-neutral-400">
                    ▼
                  </span>
                </div>

                {/* Reset Template */}
                <button
                  type="button"
                  onClick={handleResetStarterCode}
                  disabled={antiCheatLocked || executing || submitting}
                  title="Reset code template"
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white transition-all border border-white/[0.08] shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Run Code */}
                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={executing || submitting || antiCheatLocked || runCooldown > 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.2] disabled:opacity-40 text-white transition-all border border-white/[0.1] cursor-pointer"
                >
                  {executing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-300" />
                  ) : runCooldown > 0 ? (
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                  )}
                  <span>
                    {executing ? 'Running...' : runCooldown > 0 ? `Run (${runCooldown}s)` : 'Run'}
                  </span>
                </button>

                {/* Submit Problem Code */}
                <button
                  type="button"
                  onClick={handleSubmitProblemCode}
                  disabled={executing || submitting || antiCheatLocked}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold bg-primary hover:brightness-110 active:scale-98 disabled:opacity-40 text-white transition-all shadow-xs cursor-pointer"
                >
                  {executing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{executing ? 'Evaluating...' : 'Submit'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-3xl border border-separator max-w-md w-full p-6 space-y-4 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Send size={24} />
              </div>
              <h3 className="text-lg font-bold text-label-primary">Finalize Contest Submission?</h3>
              <p className="text-xs text-label-tertiary leading-relaxed">
                {activeContest.type === 'HYBRID' ? (
                  <>
                    You answered {Object.keys(mcqAnswers).length} of {mcqs.length} MCQs and submitted {
                      (activeSession?.codingSubmissions || []).filter((s) => s.passedTestCases > 0 || s.pointsEarned > 0).length
                    } of {codings.length} coding problems.
                  </>
                ) : activeContest.type === 'CODING' ? (
                  <>
                    You submitted {
                      (activeSession?.codingSubmissions || []).filter((s) => s.passedTestCases > 0 || s.pointsEarned > 0).length
                    } of {codings.length} coding problems.
                  </>
                ) : (
                  <>
                    You answered {Object.keys(mcqAnswers).length} of {mcqs.length} MCQs.
                  </>
                )}
                {' '}Once submitted, your final score will be recorded and rankings finalized!
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="py-2.5 bg-surface-secondary border border-separator rounded-xl text-xs font-semibold text-label-secondary hover:text-label-primary hover:bg-surface transition-colors cursor-pointer"
                >
                  Back to Arena
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  Confirm & Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submission Success Dialog */}
      <AnimatePresence>
        {submissionCompleteData && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface rounded-3xl border border-emerald-500/30 max-w-md w-full p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-bounce">
                <Trophy size={32} />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Contest Completed
                </span>
                <h3 className="text-2xl font-black text-label-primary tracking-tight mt-2">
                  Battle Finalized!
                </h3>
                <p className="text-xs text-label-tertiary mt-1">
                  Congratulations on finishing {activeContest.title}.
                </p>
              </div>

              {/* Score Highlight Card */}
              <div className="p-4 bg-surface-secondary rounded-2xl border border-separator space-y-1">
                <p className="text-[10px] font-bold text-label-tertiary uppercase tracking-wider">
                  Total Score Earned
                </p>
                <p className="text-3xl font-black text-primary">
                  {submissionCompleteData.totalScore} PTS
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  +{submissionCompleteData.awardedClubPoints} Club XP Added to Profile!
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!detailedSubmission && activeContest) {
                      const res = await fetchMyContestSubmission(activeContest._id);
                      if (res.success && res.data) {
                        setDetailedSubmission(res.data);
                      }
                    }
                    setIsDetailModalOpen(true);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileCode2 size={14} />
                  <span>Review MCQ & Code Solutions</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/contests')}
                    className="flex-1 py-2.5 bg-surface-secondary border border-separator rounded-xl text-xs font-semibold text-label-secondary hover:text-label-primary hover:bg-surface transition-colors cursor-pointer"
                  >
                    All Battles
                  </button>
                  <button
                    onClick={() => navigate(`/contests/${activeContest._id}/leaderboard`)}
                    className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    View Rankings
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsReentryModalOpen(true)}
                  className="w-full py-2 bg-surface-secondary hover:bg-surface border border-separator hover:border-primary/40 text-label-secondary hover:text-primary text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Appeal / Request Contest Re-entry</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Student Submission Modal in Arena */}
      <ContestSubmissionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        submission={detailedSubmission || submissionCompleteData?.submission || activeContest?.mySubmission}
        contestTitle={activeContest?.title}
        contestType={activeContest?.type}
        isAdminView={false}
      />

      {/* Proctored Lock Overlay on 3 Warnings Reached */}
      {antiCheatLocked && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl shadow-red-500/10">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Contest Blocked & Workspace Locked</h2>
            <p className="text-sm text-neutral-300 leading-relaxed mb-6">
              You exceeded 3 tab switch warnings during this contest session. Your submission has been finalized and your account is now{' '}
              <span className="text-red-400 font-semibold">restricted from attending any assessments or contests</span> until an administrator unblocks your restrictions.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => setIsReentryModalOpen(true)}
                className="flex-1 py-3 px-4 bg-surface hover:bg-surface-raised border border-separator text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={14} className="text-amber-400" />
                <span>Appeal & Re-entry</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/contests')}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-red-500/20 cursor-pointer"
              >
                Exit to Contests
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Contest Re-entry Request Modal */}
      <RequestReentryModal
        isOpen={isReentryModalOpen}
        onClose={() => setIsReentryModalOpen(false)}
        contestId={activeContest?._id || ''}
        contestTitle={activeContest?.title || ''}
        onSuccess={() => {
          toast.success('Your re-entry appeal has been submitted for administrator review.');
        }}
      />
    </div>
  );
};

export default ContestArenaPage;
