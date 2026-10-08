import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import toast from 'react-hot-toast';
import {
  Play,
  Send,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Terminal,
  Code2,
  Lock,
  ChevronLeft,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';

import api from '../../lib/axios';
import { useVisibilityChange, IntegrityEvent } from '../../hooks/useVisibilityChange';

export interface TestCaseSummary {
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
}

export interface ChallengeData {
  id: string;
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  allowedLanguages: string[];
  starterCode: Record<string, string>;
  visibleTestCases: TestCaseSummary[];
  timeLimitMinutes: number;
  hasSubmitted: boolean;
  isLocked: boolean;
  previousSubmission?: {
    score: number;
    status: string;
    passed: number;
    total: number;
    submittedAt: string;
  } | null;
}

export interface ExecutionResultItem {
  testCase: number;
  passed: boolean;
  stdout: string;
  stderr: string;
}

export interface ExecutionResponseData {
  success: boolean;
  results: ExecutionResultItem[];
  passed: number;
  total: number;
  compilationError?: boolean;
  error?: string;
}

export interface SubmissionResponseData {
  submitted: boolean;
  score: number;
  passed: number;
  total: number;
  status: 'passed' | 'failed' | 'compilation_error' | 'runtime_error' | 'timeout';
  levelCompleted?: boolean;
  unlockedNextLevel?: boolean;
  nextLevelId?: string | null;
  domainId?: string | null;
  error?: string;
}

const MONACO_LANG_MAP: Record<string, string> = {
  c: 'c',
  cpp: 'cpp',
  python: 'python',
  java: 'java',
  javascript: 'javascript',
};

const LANG_DISPLAY_NAMES: Record<string, string> = {
  c: 'C',
  cpp: 'C++',
  python: 'Python',
  java: 'Java',
  javascript: 'JavaScript',
};

export const CodingAssessmentWorkspace: React.FC = () => {
  const { id, problemId: routeProblemId } = useParams<{ id?: string; problemId?: string }>();
  const activeProblemId = id || routeProblemId;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryDomainId = searchParams.get('domainId');

  // Challenge and code state
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [loadingChallenge, setLoadingChallenge] = useState<boolean>(true);
  const [errorChallenge, setErrorChallenge] = useState<string | null>(null);

  const [activeLanguage, setActiveLanguage] = useState<string>('python');
  const [codeByLanguage, setCodeByLanguage] = useState<Record<string, string>>({});

  // Execution & Submission state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResults, setExecutionResults] = useState<ExecutionResponseData | null>(null);
  const [selectedTestCaseTab, setSelectedTestCaseTab] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionVerdict, setSubmissionVerdict] = useState<SubmissionResponseData | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [runCooldown, setRunCooldown] = useState<number>(0);

  // Layout & UI state
  const [activeLeftTab, setActiveLeftTab] = useState<'problem' | 'testcases'>('problem');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'terminal' | 'cases'>('cases');
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState<number>(45 * 60);

  // Reference to current active code and language for auto-submit
  const currentCodeRef = useRef<string>('');
  const currentLangRef = useRef<string>('python');

  // Anti-cheating hook
  const {
    warnings,
    isLocked: antiCheatLocked,
    integrityEvents,
    manuallyLock,
  } = useVisibilityChange({
    maxWarnings: 3,
    isActive: Boolean(challenge && !submissionVerdict && !challenge.isLocked),
    problemId: activeProblemId,
    onLockTriggered: (events) => {
      handleAutoSubmitOnLock(events);
    },
  });

  const isWorkspaceLocked = Boolean(
    antiCheatLocked ||
    (challenge && challenge.isLocked) ||
    (submissionVerdict && submissionVerdict.submitted)
  );

  // Fetch challenge data
  const fetchChallenge = useCallback(async () => {
    if (!activeProblemId) {
      setErrorChallenge('No problem identifier provided in URL route.');
      setLoadingChallenge(false);
      return;
    }

    try {
      setLoadingChallenge(true);
      setErrorChallenge(null);
      const res = await api.get(`/assessments/code/${activeProblemId}`);
      const data: ChallengeData = res.data.data;
      setChallenge(data);

      // Determine initial language
      const initialLang = data.allowedLanguages[0] || 'python';
      setActiveLanguage(initialLang);
      currentLangRef.current = initialLang;

      // Seed starter codes
      const initialCodeMap: Record<string, string> = {};
      data.allowedLanguages.forEach((lang) => {
        initialCodeMap[lang] = data.starterCode[lang] || `// Write your ${lang} code here\n`;
      });

      setCodeByLanguage(initialCodeMap);
      currentCodeRef.current = initialCodeMap[initialLang] || '';

      // Set initial timer
      if (data.timeLimitMinutes) {
        setRemainingSeconds(data.timeLimitMinutes * 60);
      }

      // Check if already locked from a previous session
      if (data.isLocked && data.previousSubmission) {
        setSubmissionVerdict({
          submitted: true,
          score: data.previousSubmission.score,
          passed: data.previousSubmission.passed,
          total: data.previousSubmission.total,
          status: data.previousSubmission.status as any,
        });
        manuallyLock();
      }
    } catch (err: any) {
      console.error('[Workspace] Failed to fetch challenge:', err);
      setErrorChallenge(
        err.response?.data?.error ||
          err.message ||
          'Failed to load the coding assessment challenge.'
      );
    } finally {
      setLoadingChallenge(false);
    }
  }, [activeProblemId, manuallyLock]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  // Timer countdown
  useEffect(() => {
    if (!challenge || isWorkspaceLocked) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Time limit reached! Submitting your assessment...');
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge, isWorkspaceLocked]);

  // 10-second Run button cooldown timer
  useEffect(() => {
    if (runCooldown <= 0) return;
    const interval = setInterval(() => {
      setRunCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [runCooldown]);

  // Keep references synced
  const handleCodeChange = (newCode?: string) => {
    if (isWorkspaceLocked) return;
    const val = newCode ?? '';
    currentCodeRef.current = val;
    setCodeByLanguage((prev) => ({
      ...prev,
      [activeLanguage]: val,
    }));
  };

  const handleLanguageChange = (newLang: string) => {
    if (isWorkspaceLocked || isExecuting || isSubmitting) return;
    setActiveLanguage(newLang);
    currentLangRef.current = newLang;

    // If no code exists yet for this language, initialize with starter code
    if (!codeByLanguage[newLang] && challenge) {
      const defaultCode = challenge.starterCode[newLang] || `// Solution in ${newLang}\n`;
      setCodeByLanguage((prev) => ({
        ...prev,
        [newLang]: defaultCode,
      }));
      currentCodeRef.current = defaultCode;
    } else {
      currentCodeRef.current = codeByLanguage[newLang] || '';
    }
  };

  // Run Code against visible test cases
  const handleRunCode = async () => {
    if (isExecuting || isSubmitting || isWorkspaceLocked || runCooldown > 0 || !challenge) return;

    const code = currentCodeRef.current;
    if (!code || !code.trim()) {
      toast.error('Source code cannot be empty');
      return;
    }

    try {
      setIsExecuting(true);
      setRunCooldown(10); // Enforce 10-second cooldown on Run Code button
      setActiveConsoleTab('cases');
      toast.loading('Running visible test cases...', { id: 'run-code' });


      const res = await api.post('/assessments/code/execute', {
        problemId: challenge.id,
        language: activeLanguage,
        code,
      });

      const data: ExecutionResponseData = res.data;
      setExecutionResults(data);

      if (data.compilationError) {
        toast.error('Compilation failed. Check terminal output.', { id: 'run-code' });
        setConsoleOutput(data.error || 'Compilation error occurred.');
        setActiveConsoleTab('terminal');
      } else if (data.passed === data.total) {
        toast.success(`Passed all ${data.total} visible test cases!`, { id: 'run-code' });
        setConsoleOutput(`Success: All ${data.total} public test cases passed!`);
      } else {
        toast(`Passed ${data.passed}/${data.total} visible test cases`, {
          icon: '⚠️',
          id: 'run-code',
        });
        setConsoleOutput(`Verdict: ${data.passed}/${data.total} passed.`);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Execution error';
      toast.error(errMsg, { id: 'run-code' });
      setConsoleOutput(`Execution Error: ${errMsg}`);
      setActiveConsoleTab('terminal');
    } finally {
      setIsExecuting(false);
    }
  };

  // Final submit handler
  const handleFinalSubmit = async (customIntegrityEvents?: IntegrityEvent[]) => {
    if (isSubmitting || !challenge) return;

    const code = currentCodeRef.current;
    const eventsToSend = customIntegrityEvents || integrityEvents;

    try {
      setIsSubmitting(true);
      setShowSubmitModal(false);
      toast.loading('Submitting code for official evaluation...', { id: 'submit-assessment' });

      const res = await api.post('/assessments/code/submit', {
        problemId: challenge.id,
        language: activeLanguage,
        code,
        integrityEvents: eventsToSend,
      });

      const verdict: SubmissionResponseData = res.data;
      setSubmissionVerdict(verdict);
      manuallyLock();

      if (verdict.status === 'passed') {
        toast.success(`Submission Accepted! Score: ${verdict.score}%`, {
          id: 'submit-assessment',
          duration: 6000,
        });
      } else {
        toast(
          `Assessment Submitted. Score: ${verdict.score}% (${verdict.passed}/${verdict.total} passed)`,
          {
            icon: '📋',
            id: 'submit-assessment',
            duration: 6000,
          }
        );
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Submission failed';
      toast.error(msg, { id: 'submit-assessment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Automatic submission when 3 anti-cheat warnings occur
  const handleAutoSubmitOnLock = (events: IntegrityEvent[]) => {
    toast.error('Anti-cheat limit exceeded. Auto-submitting assessment...', {
      duration: 6000,
    });
    handleFinalSubmit(events);
  };

  // Reset starter code
  const handleResetStarterCode = () => {
    if (isWorkspaceLocked || !challenge) return;
    const starter = challenge.starterCode[activeLanguage] || '';
    currentCodeRef.current = starter;
    setCodeByLanguage((prev) => ({
      ...prev,
      [activeLanguage]: starter,
    }));
    toast.success(`Reset ${LANG_DISPLAY_NAMES[activeLanguage]} to starter template`);
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loadingChallenge) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#000000] text-white space-y-4">
        <Loader2 className="w-9 h-9 animate-spin text-blue-500" />
        <p className="text-sm font-medium tracking-wide text-neutral-400">
          Loading Live Assessment Environment...
        </p>
      </div>
    );
  }

  if (errorChallenge || !challenge) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#000000] text-white p-6">
        <div className="max-w-md w-full bg-neutral-900/90 border border-neutral-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Assessment Unavailable
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {errorChallenge || 'Problem details could not be loaded.'}
          </p>
          <button
            onClick={() => navigate('/assessments')}
            className="w-full py-2.5 rounded-full text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-white transition-all border border-neutral-700"
          >
            Return to Assessments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#000000] text-neutral-100 flex flex-col overflow-hidden font-sans select-none antialiased">
      {/* ── Top Apple Spatial Control Bar ────────────────────────────── */}
      <header className="h-14 border-b border-white/[0.08] bg-black/60 backdrop-blur-2xl flex items-center justify-between px-5 shrink-0 z-40">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/assessments')}
            title="Leave Assessment"
            className="p-1.5 rounded-xl hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="h-4 w-[1px] bg-white/[0.12]" />

          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-semibold tracking-tight text-white truncate max-w-[220px] md:max-w-[340px]">
              {challenge.title}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                challenge.difficulty === 'Easy'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  : challenge.difficulty === 'Hard'
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
              }`}
            >
              {challenge.difficulty}
            </span>
          </div>
        </div>

        {/* Center: Live Timer & Anti-Cheat Warnings Pill */}
        <div className="flex items-center gap-2">
          {/* Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-tight transition-colors ${
              remainingSeconds < 300
                ? 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse'
                : 'bg-white/[0.06] text-neutral-300 border border-white/[0.08]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* Anti-Cheat Deterrent Warning Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              warnings === 0
                ? 'bg-white/[0.04] text-neutral-400 border border-white/[0.06]'
                : warnings === 1
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : warnings === 2
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 animate-pulse'
                : 'bg-red-500/25 text-red-300 border border-red-500/50'
            }`}
            title="Integrity Deterrent: Leaving assessment window counts warnings"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="text-[11px]">
              {isWorkspaceLocked
                ? 'Locked'
                : `Warnings: ${warnings}/3`}
            </span>
          </div>
        </div>

        {/* Right: Glass Language Selector, Run & Submit Actions */}
        <div className="flex items-center gap-2.5">
          {/* Glass Style Language Selector */}
          <div className="relative">
            <select
              value={activeLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isWorkspaceLocked || isExecuting || isSubmitting}
              className="appearance-none bg-white/[0.06] hover:bg-white/[0.09] active:bg-white/[0.12] disabled:opacity-50 disabled:cursor-not-allowed border border-white/[0.1] rounded-full px-3.5 py-1.5 text-xs font-medium text-neutral-200 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/50 pr-7"
            >
              {challenge.allowedLanguages.map((lang) => (
                <option key={lang} value={lang} className="bg-neutral-900 text-white">
                  {LANG_DISPLAY_NAMES[lang] || lang.toUpperCase()}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">
              ▼
            </span>
          </div>

          {/* Reset Template Button */}
          <button
            onClick={handleResetStarterCode}
            disabled={isWorkspaceLocked || isExecuting || isSubmitting}
            title="Reset to starter code"
            className="p-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 text-neutral-400 hover:text-white transition-all border border-white/[0.06]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Run Code Button (10s Cooldown Enforced) */}
          <button
            onClick={handleRunCode}
            disabled={isExecuting || isSubmitting || isWorkspaceLocked || runCooldown > 0}
            title={runCooldown > 0 ? `Cooldown active (${runCooldown}s remaining)` : 'Run Code'}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.08] hover:bg-white/[0.14] active:bg-white/[0.18] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all border border-white/[0.1] shadow-sm"
          >
            {isExecuting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-300" />
            ) : runCooldown > 0 ? (
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
            )}
            <span>
              {isExecuting
                ? 'Running...'
                : runCooldown > 0
                ? `Run Code (${runCooldown}s)`
                : 'Run Code'}
            </span>
          </button>


          {/* Submit Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={isExecuting || isSubmitting || isWorkspaceLocked}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-blue-600/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{isSubmitting ? 'Evaluating...' : 'Submit'}</span>
          </button>
        </div>
      </header>

      {/* ── Main Workspace Body (Resizable Split Layout) ─────────────── */}
      <div className="flex-1 relative overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* ════════ LEFT PANEL: Problem, Constraints & Test Cases ════════ */}
          <Panel defaultSize={42} minSize={25}>
            <div className="h-full flex flex-col bg-neutral-950/60 border-r border-white/[0.08] backdrop-blur-md">
              {/* Left Sub-Header Tabs */}
              <div className="h-10 border-b border-white/[0.06] flex items-center px-4 gap-2 shrink-0">
                <button
                  onClick={() => setActiveLeftTab('problem')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeLeftTab === 'problem'
                      ? 'bg-white/[0.12] text-white'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Problem</span>
                </button>
                <button
                  onClick={() => setActiveLeftTab('testcases')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeLeftTab === 'testcases'
                      ? 'bg-white/[0.12] text-white'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Test Cases ({challenge.visibleTestCases.length})</span>
                </button>
              </div>

              {/* Left Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-neutral-300 leading-relaxed scrollbar-thin scrollbar-thumb-neutral-800">
                {activeLeftTab === 'problem' ? (
                  <>
                    {/* Problem Title & Description */}
                    <div className="space-y-3">
                      <h1 className="text-xl font-bold tracking-tight text-white">
                        {challenge.title}
                      </h1>
                      <div className="text-[13px] text-neutral-300 whitespace-pre-wrap leading-relaxed">
                        {challenge.description}
                      </div>
                    </div>

                    {/* Input Format */}
                    {challenge.inputFormat && (
                      <div className="space-y-1.5">
                        <h3 className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
                          Input Format
                        </h3>
                        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-neutral-300 whitespace-pre-wrap">
                          {challenge.inputFormat}
                        </div>
                      </div>
                    )}

                    {/* Output Format */}
                    {challenge.outputFormat && (
                      <div className="space-y-1.5">
                        <h3 className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
                          Output Format
                        </h3>
                        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-neutral-300 whitespace-pre-wrap">
                          {challenge.outputFormat}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {challenge.constraints && (
                      <div className="space-y-1.5">
                        <h3 className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
                          Constraints
                        </h3>
                        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-neutral-300 whitespace-pre-wrap">
                          {challenge.constraints}
                        </div>
                      </div>
                    )}

                    {/* Sample Input & Output */}
                    {challenge.sampleInput && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
                          Sample Example
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[11px] text-neutral-500 font-medium">Sample Input</span>
                            <pre className="p-3 rounded-2xl bg-black border border-white/[0.08] text-xs font-mono text-neutral-300 overflow-x-auto">
                              {challenge.sampleInput}
                            </pre>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] text-neutral-500 font-medium">Sample Output</span>
                            <pre className="p-3 rounded-2xl bg-black border border-white/[0.08] text-xs font-mono text-emerald-400 overflow-x-auto">
                              {challenge.sampleOutput}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Public Test Cases Tab */
                  <div className="space-y-4">
                    <p className="text-xs text-neutral-400">
                      These are the visible public test cases used during "Run Code". Hidden test cases will only be evaluated upon final submission.
                    </p>

                    <div className="space-y-3">
                      {challenge.visibleTestCases.map((tc, idx) => (
                        <div
                          key={tc.testCaseIndex}
                          className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-300">
                              Test Case #{idx + 1}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 bg-white/[0.05] px-2 py-0.5 rounded-full">
                              Public
                            </span>
                          </div>

                          <div className="space-y-2 text-xs font-mono">
                            <div>
                              <div className="text-[11px] text-neutral-500 mb-1">Input:</div>
                              <pre className="p-2.5 rounded-xl bg-black border border-white/[0.06] text-neutral-300 overflow-x-auto">
                                {tc.input || '(empty)'}
                              </pre>
                            </div>

                            <div>
                              <div className="text-[11px] text-neutral-500 mb-1">Expected Output:</div>
                              <pre className="p-2.5 rounded-xl bg-black border border-white/[0.06] text-emerald-400 overflow-x-auto">
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
            </div>
          </Panel>

          {/* Resizable Divider */}
          <PanelResizeHandle className="w-1.5 bg-black hover:bg-blue-500/50 transition-colors relative group cursor-col-resize">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/[0.08] group-hover:bg-blue-400" />
          </PanelResizeHandle>

          {/* ════════ RIGHT PANEL: Monaco Editor & OLED Terminal ════════ */}
          <Panel defaultSize={58} minSize={30}>
            <PanelGroup direction="vertical">
              {/* Monaco Code Editor Sub-Panel */}
              <Panel defaultSize={68} minSize={30}>
                <div className="h-full flex flex-col bg-[#050505] relative">
                  {/* Subtle glass header over editor */}
                  <div className="h-9 border-b border-white/[0.06] flex items-center justify-between px-4 bg-black/40 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-xs font-mono text-neutral-400">
                        solution.{activeLanguage === 'python' ? 'py' : activeLanguage === 'javascript' ? 'js' : activeLanguage === 'java' ? 'java' : activeLanguage === 'cpp' ? 'cpp' : 'c'}
                      </span>
                    </div>

                    {isWorkspaceLocked && (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Lock className="w-3 h-3" />
                        Editor Locked
                      </span>
                    )}
                  </div>

                  {/* Monaco Editor Container */}
                  <div className="flex-1 relative overflow-hidden">
                    <Editor
                      height="100%"
                      language={MONACO_LANG_MAP[activeLanguage] || 'python'}
                      value={codeByLanguage[activeLanguage] || ''}
                      theme="vs-dark"
                      onChange={handleCodeChange}
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: true,
                        readOnly: isWorkspaceLocked || isExecuting || isSubmitting,
                        domReadOnly: isWorkspaceLocked,
                        bracketPairColorization: { enabled: true },
                        automaticLayout: true,
                        padding: { top: 14, bottom: 14 },
                        fontFamily:
                          "'SF Mono', 'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
                        fontLigatures: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true,
                        renderLineHighlight: 'all',
                        overviewRulerBorder: false,
                        hideCursorInOverviewRuler: true,
                      }}
                    />

                    {/* Locked Spatial Glass Overlay if assessment submitted or anti-cheat triggered */}
                    {isWorkspaceLocked && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
                        <div className="w-12 h-12 rounded-full bg-neutral-800/80 border border-white/10 flex items-center justify-center mb-3">
                          <Lock className="w-6 h-6 text-neutral-300" />
                        </div>
                        <h3 className="text-base font-semibold text-white tracking-tight mb-1">
                          Assessment Locked
                        </h3>
                        <p className="text-xs text-neutral-400 max-w-sm leading-relaxed mb-4">
                          {submissionVerdict
                            ? 'Your official assessment code has been submitted and locked for grading.'
                            : 'Assessment editor is disabled. Your submission is finalized.'}
                        </p>
                        {submissionVerdict && (
                          <div className="px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-xs font-mono text-neutral-200">
                            Score: <span className="text-blue-400 font-bold">{submissionVerdict.score}%</span> ({submissionVerdict.passed}/{submissionVerdict.total} passed)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              {/* Vertical Resize Divider */}
              <PanelResizeHandle className="h-1.5 bg-black hover:bg-blue-500/50 transition-colors relative group cursor-row-resize">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/[0.08] group-hover:bg-blue-400" />
              </PanelResizeHandle>

              {/* ════════ OLED BLACK EXECUTION OUTPUT TERMINAL ════════ */}
              <Panel defaultSize={32} minSize={15}>
                <div className="h-full flex flex-col bg-[#000000] text-neutral-200 border-t border-white/[0.08]">
                  {/* Terminal Header Tabs */}
                  <div className="h-9 border-b border-white/[0.08] flex items-center justify-between px-4 bg-black/80 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveConsoleTab('cases')}
                        className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium transition-all ${
                          activeConsoleTab === 'cases'
                            ? 'bg-white/[0.12] text-white'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Test Results</span>
                      </button>

                      <button
                        onClick={() => setActiveConsoleTab('terminal')}
                        className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium transition-all ${
                          activeConsoleTab === 'terminal'
                            ? 'bg-white/[0.12] text-white'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <Terminal className="w-3 h-3 text-neutral-400" />
                        <span>Console Output</span>
                      </button>
                    </div>

                    {executionResults && (
                      <span className="text-[11px] font-mono text-neutral-400">
                        {executionResults.passed} / {executionResults.total} Passed
                      </span>
                    )}
                  </div>

                  {/* Terminal Content Body (True OLED Black #000000) */}
                  <div className="flex-1 overflow-y-auto p-4 bg-[#000000] font-mono text-xs scrollbar-thin scrollbar-thumb-neutral-900">
                    {activeConsoleTab === 'cases' ? (
                      executionResults ? (
                        <div className="space-y-4">
                          {/* Test Case Pill Tabs */}
                          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
                            {executionResults.results.map((r, i) => (
                              <button
                                key={r.testCase}
                                onClick={() => setSelectedTestCaseTab(i)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                                  selectedTestCaseTab === i
                                    ? 'bg-white/[0.12] text-white border border-white/[0.1]'
                                    : 'bg-white/[0.02] text-neutral-400 hover:text-white border border-transparent'
                                }`}
                              >
                                {r.passed ? (
                                  <CheckCircle2 className="w-3 h-3 text-[#34C759]" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-[#FF453A]" />
                                )}
                                <span>Case {r.testCase}</span>
                              </button>
                            ))}
                          </div>

                          {/* Selected Case Detail */}
                          {executionResults.results[selectedTestCaseTab] && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-neutral-400">Status:</span>
                                {executionResults.results[selectedTestCaseTab].passed ? (
                                  <span className="text-[#34C759] font-bold">Passed</span>
                                ) : (
                                  <span className="text-[#FF453A] font-bold">Wrong Answer</span>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-[11px] text-neutral-500 mb-1">Your Output (stdout):</div>
                                  <pre className="p-3 rounded-xl bg-neutral-950 border border-white/[0.06] text-neutral-200 overflow-x-auto min-h-[48px]">
                                    {executionResults.results[selectedTestCaseTab].stdout || '(no output)'}
                                  </pre>
                                </div>

                                <div>
                                  <div className="text-[11px] text-neutral-500 mb-1">Expected Output:</div>
                                  <pre className="p-3 rounded-xl bg-neutral-950 border border-white/[0.06] text-[#34C759] overflow-x-auto min-h-[48px]">
                                    {challenge.visibleTestCases[selectedTestCaseTab]?.expectedOutput || ''}
                                  </pre>
                                </div>
                              </div>

                              {executionResults.results[selectedTestCaseTab].stderr && (
                                <div>
                                  <div className="text-[11px] text-rose-400 mb-1">Stderr:</div>
                                  <pre className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-[#FF453A] overflow-x-auto">
                                    {executionResults.results[selectedTestCaseTab].stderr}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-neutral-600 text-xs">
                          Press "Run Code" to compile and execute against visible test cases.
                        </div>
                      )
                    ) : (
                      /* Console / Raw Terminal Output */
                      <pre className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
                        {consoleOutput || '$ Ready for code execution...'}
                      </pre>
                    )}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* ── Submit Confirmation Modal ────────────────────────────────── */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-neutral-950 border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Submit Assessment Solution
                </h3>
                <p className="text-xs text-neutral-400">
                  Confirm your final assessment submission.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-neutral-300 space-y-2">
              <p>
                • Your solution in <span className="font-semibold text-blue-400">{LANG_DISPLAY_NAMES[activeLanguage]}</span> will be compiled and evaluated against all visible and hidden test cases.
              </p>
              <p>
                • Resubmission will be <span className="font-semibold text-amber-400">locked</span> once submitted.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-full text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleFinalSubmit()}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submission Result Modal ──────────────────────────────────── */}
      {submissionVerdict && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-neutral-950 border border-white/[0.12] rounded-3xl p-7 shadow-2xl space-y-6 text-center">
            <div
              className={`w-14 h-14 rounded-3xl flex items-center justify-center mx-auto ${
                submissionVerdict.score >= 60
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {submissionVerdict.score >= 60 ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <XCircle className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-white">
                {submissionVerdict.score >= 60
                  ? 'Assessment Passed!'
                  : 'Assessment Completed'}
              </h2>
              <p className="text-xs text-neutral-400">
                Official evaluation across all test cases
              </p>
            </div>

            {/* Score Metric Card */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Final Score:</span>
                <span className="text-lg font-mono font-bold text-white">
                  {submissionVerdict.score}%
                </span>
              </div>
              <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    submissionVerdict.score >= 60 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${submissionVerdict.score}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                <span>Test Cases Passed:</span>
                <span>
                  {submissionVerdict.passed} / {submissionVerdict.total}
                </span>
              </div>
            </div>

            {/* Level Completion Feedback */}
            {submissionVerdict.levelCompleted && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-1">
                <div className="font-bold flex items-center justify-center gap-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Level Completed!
                </div>
                <p className="text-[11px] text-emerald-300/90">
                  {submissionVerdict.unlockedNextLevel
                    ? 'All requirements satisfied! The next level in this course has been unlocked.'
                    : 'All requirements satisfied! Course progress updated.'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setSubmissionVerdict(null)}
                className="flex-1 py-2.5 rounded-full text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-neutral-200 transition-all border border-white/[0.08]"
              >
                Review Code
              </button>
              {submissionVerdict.domainId || queryDomainId ? (
                <button
                  onClick={() => navigate(`/courses/${submissionVerdict.domainId || queryDomainId}`)}
                  className="flex-1 py-2.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
                >
                  Return to Course
                </button>
              ) : (
                <button
                  onClick={() => navigate('/courses')}
                  className="flex-1 py-2.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30"
                >
                  Return to Courses
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingAssessmentWorkspace;
