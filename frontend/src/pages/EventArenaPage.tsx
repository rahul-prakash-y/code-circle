import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
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
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useEventArenaStore, {
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
    fetchStudentArenaData,
    startArenaSession,
    runArenaCode,
    submitArenaProblem,
    submitArenaFinal,
    currentEvent,
    studentMcqs,
    studentCoding,
    submission,
    loading,
    actionLoading,
  } = useEventArenaStore();

  // Arena session state
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

  // Load arena data
  useEffect(() => {
    if (id) {
      fetchStudentArenaData(id).then((data) => {
        if (!data?.submission || data.submission.status === 'IN_PROGRESS') {
          startArenaSession(id);
        }
        if (data?.submission?.status === 'SUBMITTED' || data?.submission?.status === 'AUTO_SUBMITTED') {
          setFinalResultModal(data.submission);
        }
      });
    }
  }, [id]);

  // Sync starter codes and existing answers
  useEffect(() => {
    if (studentMcqs.length > 0 && selectedType === 'mcq' && selectedIndex >= studentMcqs.length) {
      setSelectedIndex(0);
    }
    if (studentMcqs.length === 0 && studentCoding.length > 0 && selectedType === 'mcq') {
      setSelectedType('coding');
      setSelectedIndex(0);
    }

    // Set initial starter codes for coding problems
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
    if (currentEvent && submission) {
      const totalSeconds = (currentEvent.arenaDurationMinutes || 60) * 60;
      const started = new Date(submission.startedAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - started) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      setRemainingSeconds(remaining);
    }
  }, [currentEvent, submission]);

  // Countdown timer loop
  useEffect(() => {
    if (submission?.status === 'SUBMITTED' || finalResultModal) return;
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
  }, [remainingSeconds, submission?.status, finalResultModal]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentMcq: ArenaMcqQuestion | undefined = studentMcqs[selectedIndex];
  const currentCoding: ArenaCodingProblem | undefined = studentCoding[selectedIndex];

  const handleSelectMcqOption = (questionId: string, optionIdx: number) => {
    setMcqAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleRunCode = async () => {
    if (!id || !currentCoding?._id) return;
    const currentEntry = codingCodes[currentCoding._id];
    const code = currentEntry?.code || '';

    setIsExecuting(true);
    setRunResults(null);
    try {
      const res = await runArenaCode(id, currentCoding._id, currentLanguage, code);
      setRunResults(res.results || []);
      if (res.allPassed) {
        toast.success('All visible test cases passed!');
      } else {
        toast.error('Some test cases failed.');
      }
    } catch {
      // handled
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmitProblem = async () => {
    if (!id || !currentCoding?._id) return;
    const currentEntry = codingCodes[currentCoding._id];
    const code = currentEntry?.code || '';

    setIsSubmittingProblem(true);
    try {
      const res = await submitArenaProblem(id, currentCoding._id, currentLanguage, code);
      setProblemStatusMap((prev) => ({
        ...prev,
        [currentCoding._id!]: res,
      }));
    } catch {
      // handled
    } finally {
      setIsSubmittingProblem(false);
    }
  };

  const handleFinalSubmit = async (auto = false) => {
    if (!id) return;
    try {
      const formattedAnswers = Object.entries(mcqAnswers).map(([questionId, selectedOptionIndex]) => ({
        questionId,
        selectedOptionIndex,
      }));

      const res = await submitArenaFinal(id, formattedAnswers);
      setShowSubmitConfirm(false);
      setFinalResultModal(res.results);
      if (auto) {
        toast('Time is up! Your assessment was submitted automatically.', { icon: '⏰' });
      }
    } catch {
      // handled
    }
  };

  if (loading && !currentEvent) {
    return (
      <div className="min-h-screen bg-[#0C0C0E] flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 size={36} className="animate-spin text-indigo-500" />
        <p className="text-xs font-semibold tracking-wider uppercase text-label-secondary">
          Initializing Event Arena...
        </p>
      </div>
    );
  }

  const isLowTime = remainingSeconds < 300; // less than 5 mins

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F5F5F7] flex flex-col font-sans select-none">
      {/* ================================================================= */}
      {/* TOP ARENA NAVIGATION BAR                                          */}
      {/* ================================================================= */}
      <header className="h-14 px-4 sm:px-6 border-b border-white/10 bg-[#121215]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Back to Events"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight text-white truncate max-w-xs sm:max-w-md">
                {currentEvent?.title || 'Event Arena'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Event Arena
              </span>
            </div>
          </div>
        </div>

        {/* Center: Question Navigation Pills */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto max-w-xl px-2">
          {studentMcqs.map((q, idx) => {
            const isAnswered = q._id ? mcqAnswers[q._id] !== undefined : false;
            const isSelected = selectedType === 'mcq' && selectedIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedType('mcq');
                  setSelectedIndex(idx);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : isAnswered
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>MCQ {idx + 1}</span>
                {isAnswered && <Check size={11} strokeWidth={3} />}
              </button>
            );
          })}

          {studentCoding.map((p, idx) => {
            const status = p._id ? problemStatusMap[p._id] : null;
            const isAccepted = status?.status === 'ACCEPTED';
            const isSelected = selectedType === 'coding' && selectedIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedType('coding');
                  setSelectedIndex(idx);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : isAccepted
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : status
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>Code {idx + 1}</span>
                {isAccepted && <Check size={11} strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        {/* Right: Timer & Submit Action */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs font-black transition-colors ${
              isLowTime
                ? 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'
                : 'bg-white/5 text-white border-white/10'
            }`}
          >
            <Clock size={14} className={isLowTime ? 'text-red-400' : 'text-indigo-400'} />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitConfirm(true)}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send size={13} />
            <span className="hidden sm:inline">Finish & Submit</span>
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* MAIN ARENA WORKSPACE BODY                                         */}
      {/* ================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* MCQ QUESTION WORKSPACE */}
        {selectedType === 'mcq' && currentMcq && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-3xl bg-[#141418] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle size={15} />
                  <span>Question {selectedIndex + 1} of {studentMcqs.length}</span>
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                  {currentMcq.points || 10} Points
                </span>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentMcq.question}
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentMcq.options.map((opt, optIdx) => {
                  const isSelected = currentMcq._id
                    ? mcqAnswers[currentMcq._id] === optIdx
                    : false;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => currentMcq._id && handleSelectMcqOption(currentMcq._id, optIdx)}
                      className={`p-4 rounded-2xl border flex items-center gap-3.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-white/80 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'border-white/10 text-white/60 bg-white/5'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="text-sm font-medium">{opt}</span>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  type="button"
                  disabled={selectedIndex === 0}
                  onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5 disabled:opacity-30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft size={15} />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  disabled={selectedIndex >= studentMcqs.length - 1}
                  onClick={() => setSelectedIndex((prev) => prev + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm disabled:opacity-30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CODING PROBLEM WORKSPACE */}
        {selectedType === 'coding' && currentCoding && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left: Problem Details Panel */}
            <div className="w-full lg:w-1/2 border-r border-white/10 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#0E0E11]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                    <Code2 size={15} />
                    <span>Challenge {selectedIndex + 1}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      currentCoding.difficulty === 'Easy'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : currentCoding.difficulty === 'Hard'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    {currentCoding.difficulty}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">
                  {currentCoding.points || 30} Points
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-white">{currentCoding.title}</h2>
                <p className="text-xs text-white/70 mt-2 leading-relaxed whitespace-pre-line">
                  {currentCoding.description}
                </p>
              </div>

              {currentCoding.inputFormat && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white/90">Input Format</h4>
                  <p className="text-xs text-white/60 font-mono bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                    {currentCoding.inputFormat}
                  </p>
                </div>
              )}

              {currentCoding.outputFormat && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white/90">Output Format</h4>
                  <p className="text-xs text-white/60 font-mono bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                    {currentCoding.outputFormat}
                  </p>
                </div>
              )}

              {currentCoding.constraints && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white/90">Constraints</h4>
                  <p className="text-xs text-white/60 font-mono bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                    {currentCoding.constraints}
                  </p>
                </div>
              )}

              {/* Sample I/O */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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

            {/* Right: Monaco Code Editor & Terminal */}
            <div className="w-full lg:w-1/2 flex flex-col bg-[#111114]">
              {/* Language Toolbar */}
              <div className="h-11 px-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#141418]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-white/60">Language:</span>
                  <select
                    value={currentLanguage}
                    onChange={(e) => setCurrentLanguage(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white outline-none"
                  >
                    {['python', 'javascript', 'cpp', 'java', 'c'].map((lang) => (
                      <option key={lang} value={lang} className="bg-[#1A1A1E]">
                        {LANG_DISPLAY_NAMES[lang]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isExecuting}
                    onClick={handleRunCode}
                    className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isExecuting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                    <span>Run Code</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittingProblem}
                    onClick={handleSubmitProblem}
                    className="px-3.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingProblem ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    <span>Submit Code</span>
                  </button>
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 overflow-hidden">
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
                      className="text-white/40 hover:text-white"
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
                        <span>Test Case {res.testCaseIndex}: {res.passed ? 'PASSED ✓' : 'FAILED ✗'}</span>
                        <span className="text-[10px] text-white/50">{res.executionTimeMs}ms</span>
                      </div>
                      <div className="mt-1 space-y-0.5 text-[11px] text-white/80">
                        <p>Expected: <span className="text-white">{res.expectedOutput}</span></p>
                        <p>Output: <span className="text-white">{res.actualOutput || '(Empty)'}</span></p>
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

      {/* ================================================================= */}
      {/* FINAL SUBMIT CONFIRMATION MODAL                                    */}
      {/* ================================================================= */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-[#141418] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Send size={18} className="text-indigo-400" />
              <span>Submit Event Assessment?</span>
            </h3>

            <p className="text-xs text-white/70 leading-relaxed">
              Are you sure you want to finalize your assessment? All your MCQ choices and coding submissions will be graded and recorded.
            </p>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1.5">
              <div className="flex justify-between text-white/80">
                <span>MCQs Answered:</span>
                <span className="font-bold text-indigo-400">
                  {Object.keys(mcqAnswers).length} / {studentMcqs.length}
                </span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Coding Challenges Evaluated:</span>
                <span className="font-bold text-purple-400">
                  {Object.keys(problemStatusMap).length} / {studentCoding.length}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white"
              >
                Keep Working
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleFinalSubmit(false)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                <span>Confirm & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* FINAL SCORE & EVALUATION RESULTS MODAL                            */}
      {/* ================================================================= */}
      {finalResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-4">
          <div className="bg-[#141418] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-2xl">
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
                {finalResultModal.isPassed ? 'Congratulations! Arena Completed' : 'Assessment Completed'}
              </h3>
              <p className="text-xs text-white/60 mt-1">
                Your event arena assessment has been evaluated and recorded.
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
                <p className="text-lg font-black text-indigo-400 mt-0.5">
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

            <button
              type="button"
              onClick={() => navigate('/events')}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Back to Events Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventArenaPage;
