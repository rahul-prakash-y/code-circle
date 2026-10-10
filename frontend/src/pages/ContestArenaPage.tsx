import React, { useEffect, useState, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Terminal,
  Trophy,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useContestStore, {
  Contest,
  ContestSession,
  MCQQuestion,
  CodingProblem,
} from '../store/useContestStore';

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
  } = useContestStore();

  const [sessionStarted, setSessionStarted] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'mcq' | 'coding'>('mcq');
  const [currentMcqIdx, setCurrentMcqIdx] = useState(0);
  const [currentCodingIdx, setCurrentCodingIdx] = useState(0);

  // Student Answers State
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [codingCodes, setCodingCodes] = useState<Record<string, string>>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');

  // Terminal & Run Output
  const [consoleOutput, setConsoleOutput] = useState<{
    stdout?: string;
    stderr?: string;
    isPassed?: boolean;
    timeMs?: number;
  } | null>(null);

  // Time remaining countdown in seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submissionCompleteData, setSubmissionCompleteData] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;
    const init = async () => {
      const c = await fetchContestById(id);
      if (c) {
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

          // Populate starter code
          const starterMap: Record<string, string> = {};
          (c.codingProblems || []).forEach((p) => {
            const starter =
              (p.starterCode as any)?.get?.('python') ||
              (p.starterCode as any)?.python ||
              '# Write your solution here\n';
            starterMap[p._id] = starter;
          });
          setCodingCodes(starterMap);

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
      setIsSubmitModalOpen(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
          className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
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

  const timerColor =
    secondsRemaining < 300
      ? 'text-rose-500 bg-rose-500/10 border-rose-500/20 animate-pulse'
      : secondsRemaining < 900
      ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      : 'text-primary bg-primary/10 border-primary/20';

  return (
    <div className="h-screen flex flex-col bg-background font-sans overflow-hidden">
      {/* 1. TOP ARENA APP BAR */}
      <header className="h-14 border-b border-separator bg-surface px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Leave arena? Your timer will continue running.')) navigate('/contests');
            }}
            className="p-1.5 hover:bg-surface-raised rounded-xl text-label-secondary"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xs sm:text-sm font-extrabold text-label-primary tracking-tight truncate max-w-[200px] sm:max-w-md">
              {activeContest.title}
            </h1>
            <p className="text-[10px] text-label-tertiary font-mono uppercase tracking-wider">
              {activeContest.type} ARENA · {activeContest.totalPoints} PTS
            </p>
          </div>
        </div>

        {/* Section Switcher (if Hybrid) */}
        {activeContest.type === 'HYBRID' && (
          <div className="flex items-center gap-1 p-1 bg-surface-raised border border-separator rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedSection('mcq')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedSection === 'mcq' ? 'bg-primary text-white shadow-xs' : 'text-label-tertiary'
              }`}
            >
              MCQs ({mcqs.length})
            </button>
            <button
              onClick={() => setSelectedSection('coding')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedSection === 'coding' ? 'bg-primary text-white shadow-xs' : 'text-label-tertiary'
              }`}
            >
              Coding ({codings.length})
            </button>
          </div>
        )}

        {/* Countdown & Submit Button */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-mono font-bold ${timerColor}`}
          >
            <Clock size={13} />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            disabled={submitting}
            className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Send size={13} />
            <span>Submit Contest</span>
          </button>
        </div>
      </header>

      {/* 2. ARENA CONTENT BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* --- SECTION A: MCQ ARENA --- */}
        {selectedSection === 'mcq' && currentMcq && (
          <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
            {/* Left Question Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 max-w-3xl mx-auto w-full">
              <div className="flex items-center justify-between border-b border-separator pb-4">
                <span className="text-xs font-mono font-bold text-primary">
                  Question {currentMcqIdx + 1} of {mcqs.length}
                </span>
                <span className="text-xs font-mono text-label-tertiary">
                  +{currentMcq.points} Points
                </span>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-label-primary leading-relaxed">
                  {currentMcq.question}
                </h2>

                {/* Options List */}
                <div className="space-y-3 pt-4">
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
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 text-xs font-medium ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-label-primary shadow-xs ring-1 ring-primary'
                            : 'bg-surface border-separator hover:border-primary/40 text-label-secondary'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center font-bold font-mono text-[11px] shrink-0 ${
                            isSelected
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface-raised border-separator text-label-tertiary'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-separator">
                <button
                  disabled={currentMcqIdx === 0}
                  onClick={() => setCurrentMcqIdx(currentMcqIdx - 1)}
                  className="px-4 py-2 bg-surface-raised border border-separator rounded-xl text-xs font-semibold disabled:opacity-30 hover:bg-surface flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <button
                  disabled={currentMcqIdx === mcqs.length - 1}
                  onClick={() => setCurrentMcqIdx(currentMcqIdx + 1)}
                  className="px-4 py-2 bg-surface-raised border border-separator rounded-xl text-xs font-semibold disabled:opacity-30 hover:bg-surface flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Right Question Navigation Matrix */}
            <div className="w-full sm:w-64 border-t sm:border-t-0 sm:border-l border-separator bg-surface p-6 space-y-4 shrink-0">
              <h3 className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                Question Matrix
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {mcqs.map((q, idx) => {
                  const isAnswered = mcqAnswers[q._id] !== undefined;
                  const isCurrent = idx === currentMcqIdx;
                  return (
                    <button
                      key={q._id}
                      onClick={() => setCurrentMcqIdx(idx)}
                      className={`h-10 rounded-xl text-xs font-mono font-bold transition-all border ${
                        isCurrent
                          ? 'ring-2 ring-primary border-primary text-primary bg-primary/10'
                          : isAnswered
                          ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                          : 'bg-surface-raised border-separator text-label-tertiary hover:border-primary/40'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-separator space-y-1.5 text-[11px] text-label-tertiary">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/30" />
                  <span>Answered ({Object.keys(mcqAnswers).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-surface-raised border border-separator" />
                  <span>Unanswered ({mcqs.length - Object.keys(mcqAnswers).length})</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- SECTION B: CODING ARENA --- */}
        {selectedSection === 'coding' && currentCoding && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left: Problem Details */}
            <div className="w-full lg:w-1/2 border-r border-separator overflow-y-auto p-6 space-y-6">
              {/* Problem tabs if multiple problems */}
              {codings.length > 1 && (
                <div className="flex items-center gap-2 pb-2 border-b border-separator">
                  {codings.map((p, idx) => (
                    <button
                      key={p._id}
                      onClick={() => setCurrentCodingIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        currentCodingIdx === idx
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-raised text-label-secondary'
                      }`}
                    >
                      Problem {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
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

              <div className="text-xs text-label-secondary leading-relaxed whitespace-pre-line">
                {currentCoding.description}
              </div>

              {/* Sample Test Case Preview */}
              {currentCoding.sampleInput && (
                <div className="space-y-3 pt-2">
                  <div>
                    <span className="text-[10px] font-bold text-label-tertiary uppercase tracking-wider">
                      Sample Input
                    </span>
                    <pre className="mt-1 p-3 bg-surface-raised rounded-xl font-mono text-xs text-label-primary border border-separator">
                      {currentCoding.sampleInput}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-label-tertiary uppercase tracking-wider">
                      Sample Output
                    </span>
                    <pre className="mt-1 p-3 bg-surface-raised rounded-xl font-mono text-xs text-label-primary border border-separator">
                      {currentCoding.sampleOutput}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Monaco Code Editor & Execution Panel */}
            <div className="w-full lg:w-1/2 flex flex-col bg-[#1e1e1e] overflow-hidden">
              {/* Language Toolbar */}
              <div className="h-10 bg-[#252526] px-4 flex items-center justify-between border-b border-[#333] shrink-0 text-xs">
                <div className="flex items-center gap-2">
                  <Code2 size={14} className="text-primary" />
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="bg-[#1e1e1e] text-slate-200 text-xs px-2 py-1 rounded-md border border-[#444] focus:outline-none"
                  >
                    <option value="python">Python 3</option>
                    <option value="javascript">JavaScript (Node.js)</option>
                    <option value="cpp">C++ (GCC)</option>
                    <option value="java">Java (OpenJDK)</option>
                    <option value="c">C (GCC)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (!activeContest || !currentCoding) return;
                      const code = codingCodes[currentCoding._id] || '';
                      const res = await runCode(
                        activeContest._id,
                        currentCoding._id,
                        code,
                        selectedLanguage
                      );
                      if (res) setConsoleOutput(res);
                    }}
                    disabled={executing}
                    className="px-3 py-1 bg-[#333] hover:bg-[#444] text-slate-200 rounded-md transition-colors flex items-center gap-1.5 font-bold"
                  >
                    <Play size={12} className={executing ? 'animate-spin' : ''} />
                    <span>Run</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (!activeContest || !currentCoding) return;
                      const code = codingCodes[currentCoding._id] || '';
                      await submitProblemCode(
                        activeContest._id,
                        currentCoding._id,
                        code,
                        selectedLanguage
                      );
                    }}
                    disabled={executing}
                    className="px-3 py-1 bg-primary text-white rounded-md hover:brightness-110 transition-all font-bold"
                  >
                    <span>Submit</span>
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                <Editor
                  theme="vs-dark"
                  language={selectedLanguage}
                  value={codingCodes[currentCoding._id] || ''}
                  onChange={(val) =>
                    setCodingCodes({
                      ...codingCodes,
                      [currentCoding._id]: val || '',
                    })
                  }
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: 'JetBrains Mono, monospace',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>

              {/* Console Output Drawer */}
              {consoleOutput && (
                <div className="h-40 bg-[#181818] border-t border-[#333] p-3 text-xs font-mono overflow-y-auto space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-[#282828]">
                    <span>Execution Output ({consoleOutput.timeMs || 0} ms)</span>
                    <span
                      className={
                        consoleOutput.isPassed ? 'text-emerald-400 font-bold' : 'text-rose-400'
                      }
                    >
                      {consoleOutput.isPassed ? '✓ Sample Output Matched' : 'Output Mismatch'}
                    </span>
                  </div>
                  {consoleOutput.stdout && (
                    <pre className="text-slate-200 whitespace-pre-wrap">{consoleOutput.stdout}</pre>
                  )}
                  {consoleOutput.stderr && (
                    <pre className="text-rose-400 whitespace-pre-wrap">{consoleOutput.stderr}</pre>
                  )}
                </div>
              )}
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
                You have answered {Object.keys(mcqAnswers).length} of {mcqs.length} MCQs. Once submitted, your score will be computed and permanent club points will be added to your profile!
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="py-2.5 bg-surface-raised border border-separator rounded-xl text-xs font-semibold text-label-secondary"
                >
                  Back to Arena
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-110"
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
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
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
              <div className="p-4 bg-surface-raised rounded-2xl border border-separator space-y-1">
                <p className="text-[10px] font-bold text-label-tertiary uppercase tracking-wider">
                  Total Score Earned
                </p>
                <p className="text-3xl font-black text-primary">
                  {submissionCompleteData.totalScore} PTS
                </p>
                <p className="text-xs text-emerald-500 font-bold">
                  +{submissionCompleteData.awardedClubPoints} Club XP Added to Profile!
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => navigate('/contests')}
                  className="flex-1 py-2.5 bg-surface-raised border border-separator rounded-xl text-xs font-semibold text-label-secondary"
                >
                  All Battles
                </button>
                <button
                  onClick={() => navigate(`/contests/${activeContest._id}/leaderboard`)}
                  className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:brightness-110"
                >
                  View Rankings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContestArenaPage;
