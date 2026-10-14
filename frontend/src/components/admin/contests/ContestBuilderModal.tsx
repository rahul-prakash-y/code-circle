import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Code2,
  HelpCircle,
  Clock,
  Award,
  Zap,
  Sparkles,
  Layers,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  AlertCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileCode,
  FileSpreadsheet,
  Terminal,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useContestStore, {
  Contest,
  MCQQuestion,
  CodingProblem,
  CodingProblemTestCase,
} from '../../../store/useContestStore';
import TutorialButton from '../../common/TutorialButton';
import ContestMcqBulkUploadModal from './ContestMcqBulkUploadModal';
import ContestCodingBulkUploadModal from './ContestCodingBulkUploadModal';

interface ContestBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingContest?: Contest | null;
}

export const ContestBuilderModal: React.FC<ContestBuilderModalProps> = ({
  isOpen,
  onClose,
  editingContest,
}) => {
  const { createContest, updateContest, fetchContestById } = useContestStore();

  const [activeTab, setActiveTab] = useState<'info' | 'mcq' | 'coding'>('info');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showMcqBulkModal, setShowMcqBulkModal] = useState(false);
  const [showCodingBulkModal, setShowCodingBulkModal] = useState(false);

  // Default start: now, end: 7 days from now
  const defaultStart = new Date().toISOString().slice(0, 16);
  const defaultEnd = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16);

  // Form State
  const [title, setTitle] = useState(editingContest?.title || 'Weekly Coding Battle #1');
  const [description, setDescription] = useState(
    editingContest?.description ||
      'Compete with fellow developers in algorithmic challenges and technical problem-solving to climb the campus leaderboard!'
  );
  const [type, setType] = useState<'CODING' | 'MCQ' | 'HYBRID'>(editingContest?.type || 'HYBRID');
  const [difficulty, setDifficulty] = useState<any>(editingContest?.difficulty || 'All Levels');
  const [durationMinutes, setDurationMinutes] = useState(editingContest?.durationMinutes || 60);
  const [totalPoints, setTotalPoints] = useState<number>(editingContest?.totalPoints || 100);
  const [pointAllocationMode, setPointAllocationMode] = useState<'AUTOMATIC' | 'MANUAL' | 'HYBRID'>(
    editingContest?.pointAllocationMode || 'AUTOMATIC'
  );

  const [startTime, setStartTime] = useState(
    editingContest?.startTime ? new Date(editingContest.startTime).toISOString().slice(0, 16) : defaultStart
  );
  const [endTime, setEndTime] = useState(
    editingContest?.endTime ? new Date(editingContest.endTime).toISOString().slice(0, 16) : defaultEnd
  );

  // MCQ Questions
  const [mcqQuestions, setMcqQuestions] = useState<any[]>(
    editingContest?.mcqQuestions || [
      {
        question: 'What is the time complexity of searching in a balanced Binary Search Tree?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
        correctOptionIndex: 2,
        points: 10,
        explanation: 'In a balanced BST, tree height is log2(n), giving O(log n) search operations.',
      },
    ]
  );

  // Coding Problems
  const [codingProblems, setCodingProblems] = useState<any[]>(
    editingContest?.codingProblems || [
      {
        title: 'Two Sum Variant',
        description:
          'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. Output indices space-separated on a single line.',
        difficulty: 'Easy',
        points: 30,
        allowedLanguages: ['python', 'javascript', 'cpp', 'java', 'c'],
        sampleInput: '4\n2 7 11 15\n9',
        sampleOutput: '0 1',
        testCases: [
          { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
          { input: '3\n3 2 4\n6', expectedOutput: '1 2', isHidden: true },
        ],
      },
    ]
  );

  // Reset or populate when editingContest / isOpen changes
  useEffect(() => {
    if (editingContest) {
      setTitle(editingContest.title || '');
      setDescription(editingContest.description || '');
      setType(editingContest.type || 'HYBRID');
      setDifficulty(editingContest.difficulty || 'All Levels');
      setDurationMinutes(editingContest.durationMinutes || 60);
      setTotalPoints(editingContest.totalPoints || 100);
      setPointAllocationMode(editingContest.pointAllocationMode || 'AUTOMATIC');
      setStartTime(
        editingContest.startTime ? new Date(editingContest.startTime).toISOString().slice(0, 16) : defaultStart
      );
      setEndTime(
        editingContest.endTime ? new Date(editingContest.endTime).toISOString().slice(0, 16) : defaultEnd
      );

      // If the contest overview list omitted questions, fetch full contest details to retrieve all coding problems & test cases
      if ((!editingContest.codingProblems || !editingContest.mcqQuestions) && editingContest._id) {
        setLoadingDetails(true);
        fetchContestById(editingContest._id)
          .then((full) => {
            if (full) {
              if (full.mcqQuestions?.length) {
                setMcqQuestions(full.mcqQuestions);
              }
              if (full.codingProblems?.length) {
                setCodingProblems(
                  full.codingProblems.map((p) => ({
                    ...p,
                    testCases:
                      p.testCases && p.testCases.length > 0
                        ? p.testCases
                        : [
                            { input: p.sampleInput || '', expectedOutput: p.sampleOutput || '', isHidden: false },
                            { input: '', expectedOutput: '', isHidden: true },
                          ],
                  }))
                );
              }
            }
          })
          .finally(() => setLoadingDetails(false));
      } else {
        if (editingContest.mcqQuestions?.length) {
          setMcqQuestions(editingContest.mcqQuestions);
        }
        if (editingContest.codingProblems?.length) {
          setCodingProblems(
            editingContest.codingProblems.map((p) => ({
              ...p,
              testCases:
                p.testCases && p.testCases.length > 0
                  ? p.testCases
                  : [
                      { input: p.sampleInput || '', expectedOutput: p.sampleOutput || '', isHidden: false },
                      { input: '', expectedOutput: '', isHidden: true },
                    ],
            }))
          );
        }
      }
    } else {
      setTitle('Weekly Coding Battle #1');
      setDescription(
        'Compete with fellow developers in algorithmic challenges and technical problem-solving to climb the campus leaderboard!'
      );
      setType('HYBRID');
      setDifficulty('All Levels');
      setDurationMinutes(60);
      setTotalPoints(100);
      setPointAllocationMode('AUTOMATIC');
      setStartTime(defaultStart);
      setEndTime(defaultEnd);
      setMcqQuestions([
        {
          question: 'What is the time complexity of searching in a balanced Binary Search Tree?',
          options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
          correctOptionIndex: 2,
          points: 10,
          explanation: 'In a balanced BST, tree height is log2(n), giving O(log n) search operations.',
        },
      ]);
      setCodingProblems([
        {
          title: 'Two Sum Variant',
          description:
            'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. Output indices space-separated on a single line.',
          difficulty: 'Easy',
          points: 30,
          allowedLanguages: ['python', 'javascript', 'cpp', 'java', 'c'],
          sampleInput: '4\n2 7 11 15\n9',
          sampleOutput: '0 1',
          testCases: [
            { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
            { input: '3\n3 2 4\n6', expectedOutput: '1 2', isHidden: true },
          ],
        },
      ]);
    }
  }, [editingContest, isOpen, fetchContestById]);

  // Dynamic sum of question points
  const questionsPointSum =
    (type !== 'CODING' ? mcqQuestions.reduce((sum, q) => sum + (Number(q.points) || 0), 0) : 0) +
    (type !== 'MCQ' ? codingProblems.reduce((sum, p) => sum + (Number(p.points) || 0), 0) : 0);

  if (!isOpen) return null;

  const handleAddMcq = () => {
    setMcqQuestions([
      ...mcqQuestions,
      {
        question: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        points: 10,
        explanation: '',
      },
    ]);
  };

  const handleAddCoding = () => {
    setCodingProblems([
      ...codingProblems,
      {
        title: 'New Coding Challenge',
        description: 'Problem statement description goes here...',
        difficulty: 'Medium',
        points: 30,
        allowedLanguages: ['python', 'javascript', 'cpp', 'java', 'c'],
        sampleInput: '',
        sampleOutput: '',
        testCases: [
          { input: '', expectedOutput: '', isHidden: false },
          { input: '', expectedOutput: '', isHidden: true },
        ],
      },
    ]);
  };

  const handleImportMcqQuestions = (newQuestions: MCQQuestion[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setMcqQuestions(newQuestions);
    } else {
      setMcqQuestions((prev) => [...prev, ...newQuestions]);
    }
  };

  const handleImportCodingProblems = (newProblems: CodingProblem[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setCodingProblems(newProblems);
    } else {
      setCodingProblems((prev) => [...prev, ...newProblems]);
    }
  };

  // Test cases management handlers
  const handleAddTestCase = (problemIdx: number, isHidden: boolean = false) => {
    const updated = [...codingProblems];
    const currentTestCases = updated[problemIdx].testCases || [];
    updated[problemIdx].testCases = [
      ...currentTestCases,
      { input: '', expectedOutput: '', isHidden },
    ];
    setCodingProblems(updated);
  };

  const handleUpdateTestCase = (
    problemIdx: number,
    tcIdx: number,
    field: 'input' | 'expectedOutput' | 'isHidden',
    value: any
  ) => {
    const updated = [...codingProblems];
    const currentTestCases = [...(updated[problemIdx].testCases || [])];
    currentTestCases[tcIdx] = {
      ...currentTestCases[tcIdx],
      [field]: value,
    };
    updated[problemIdx].testCases = currentTestCases;
    setCodingProblems(updated);
  };

  const handleToggleTestCaseHidden = (problemIdx: number, tcIdx: number) => {
    const updated = [...codingProblems];
    const currentTestCases = [...(updated[problemIdx].testCases || [])];
    const currentStatus = Boolean(currentTestCases[tcIdx]?.isHidden);
    currentTestCases[tcIdx] = {
      ...currentTestCases[tcIdx],
      isHidden: !currentStatus,
    };
    updated[problemIdx].testCases = currentTestCases;
    setCodingProblems(updated);
  };

  const handleRemoveTestCase = (problemIdx: number, tcIdx: number) => {
    const updated = [...codingProblems];
    const currentTestCases = (updated[problemIdx].testCases || []).filter((_, idx) => idx !== tcIdx);
    updated[problemIdx].testCases = currentTestCases;
    setCodingProblems(updated);
  };

  const handleDuplicateTestCase = (problemIdx: number, tcIdx: number) => {
    const updated = [...codingProblems];
    const currentTestCases = [...(updated[problemIdx].testCases || [])];
    const itemToClone = currentTestCases[tcIdx];
    currentTestCases.splice(tcIdx + 1, 0, {
      input: itemToClone.input || '',
      expectedOutput: itemToClone.expectedOutput || '',
      isHidden: itemToClone.isHidden ?? true,
    });
    updated[problemIdx].testCases = currentTestCases;
    setCodingProblems(updated);
    toast.success('Test case duplicated!');
  };

  const handleCopySampleToTestCase = (problemIdx: number, isHidden: boolean = false) => {
    const prob = codingProblems[problemIdx];
    if (!prob.sampleInput && !prob.sampleOutput) {
      toast.error('Sample Input and Sample Output are empty. Fill them first!');
      return;
    }
    const updated = [...codingProblems];
    const currentTestCases = updated[problemIdx].testCases || [];
    updated[problemIdx].testCases = [
      ...currentTestCases,
      {
        input: prob.sampleInput || '',
        expectedOutput: prob.sampleOutput || '',
        isHidden,
      },
    ];
    setCodingProblems(updated);
    toast.success(`Added sample as a ${isHidden ? 'hidden' : 'public'} test case!`);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Contest title is required');
      return;
    }

    // Validate Coding Problems test cases
    if (type !== 'MCQ') {
      for (let i = 0; i < codingProblems.length; i++) {
        const p = codingProblems[i];
        if (!p.title?.trim()) {
          toast.error(`Problem #${i + 1} is missing a title.`);
          return;
        }

        const tcs = p.testCases || [];
        if (tcs.length === 0) {
          toast.error(`Problem #${i + 1} ("${p.title}") must have at least one test case.`);
          return;
        }

        for (let j = 0; j < tcs.length; j++) {
          const tc = tcs[j];
          if (!String(tc.expectedOutput ?? '').trim()) {
            toast.error(
              `Problem #${i + 1} ("${p.title}"): Test Case #${j + 1} is missing Expected Output.`
            );
            return;
          }
        }
      }
    }

    const payload = {
      title,
      description,
      type,
      difficulty,
      durationMinutes: Number(durationMinutes),
      totalPoints: Math.max(1, Number(totalPoints) || 100),
      pointAllocationMode,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      mcqQuestions: type === 'CODING' ? [] : mcqQuestions,
      codingProblems:
        type === 'MCQ'
          ? []
          : codingProblems.map((p) => ({
              ...p,
              testCases: (p.testCases || []).map((tc: any) => ({
                input: String(tc.input ?? ''),
                expectedOutput: String(tc.expectedOutput ?? ''),
                isHidden: Boolean(tc.isHidden),
              })),
            })),
    };

    let ok = false;
    if (editingContest?._id) {
      ok = await updateContest(editingContest._id, payload as any);
    } else {
      ok = await createContest(payload as any);
    }

    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-surface dark:bg-[#121214] rounded-3xl border border-separator dark:border-white/10 max-w-5xl w-full p-5 sm:p-7 space-y-5 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-separator dark:border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Award size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-label-primary dark:text-[#F5F5F7] tracking-tight font-heading">
                  {editingContest ? 'Edit Weekly Contest' : 'Create Weekly Contest'}
                </h2>
                {loadingDetails && (
                  <span className="flex items-center gap-1 text-[11px] text-blue-500 font-semibold">
                    <Loader2 size={12} className="animate-spin" /> Loading specs...
                  </span>
                )}
              </div>
              <p className="text-xs text-label-secondary dark:text-[#86868B] mt-0.5">
                Design timed coding challenges, hidden anti-cheat test cases, and technical MCQs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TutorialButton tutorialId="contests" variant="icon" />
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-secondary dark:hover:bg-white/10 rounded-xl text-label-secondary hover:text-label-primary transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-surface-secondary dark:bg-[#1C1C1E] rounded-2xl border border-separator dark:border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'bg-primary text-white shadow-xs'
                : 'text-label-secondary dark:text-[#86868B] hover:text-label-primary'
            }`}
          >
            1. Basic Settings
          </button>
          {type !== 'CODING' && (
            <button
              onClick={() => setActiveTab('mcq')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'mcq'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-label-secondary dark:text-[#86868B] hover:text-label-primary'
              }`}
            >
              2. MCQ Questions ({mcqQuestions.length})
            </button>
          )}
          {type !== 'MCQ' && (
            <button
              onClick={() => setActiveTab('coding')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'coding'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-label-secondary dark:text-[#86868B] hover:text-label-primary'
              }`}
            >
              3. Coding Challenges ({codingProblems.length})
            </button>
          )}
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-label-secondary dark:text-[#86868B]">
                  Contest Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekly Algorithm Arena #12"
                  className="w-full px-4 py-2.5 text-xs bg-surface-secondary dark:bg-[#1C1C1E] border border-separator dark:border-white/10 rounded-xl text-label-primary dark:text-[#F5F5F7] focus:outline-none focus:border-primary font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-label-secondary dark:text-[#86868B]">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 text-xs bg-surface-secondary dark:bg-[#1C1C1E] border border-separator dark:border-white/10 rounded-xl text-label-primary dark:text-[#F5F5F7] focus:outline-none focus:border-primary font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-label-secondary dark:text-[#86868B]">
                    Contest Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-surface-secondary dark:bg-[#1C1C1E] border border-separator dark:border-white/10 rounded-xl text-label-primary dark:text-[#F5F5F7] focus:outline-none cursor-pointer"
                  >
                    <option value="HYBRID">Hybrid (Coding + MCQ)</option>
                    <option value="CODING">Coding Challenges Only</option>
                    <option value="MCQ">MCQ Quiz Only</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-label-secondary dark:text-[#86868B]">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-surface-secondary dark:bg-[#1C1C1E] border border-separator dark:border-white/10 rounded-xl text-label-primary dark:text-[#F5F5F7] focus:outline-none cursor-pointer"
                  >
                    <option value="All Levels">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-label-secondary dark:text-[#86868B]">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    min={5}
                    max={360}
                    className="w-full px-3 py-2 text-xs bg-surface-secondary dark:bg-[#1C1C1E] border border-separator dark:border-white/10 rounded-xl text-label-primary dark:text-[#F5F5F7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Reward Points Controller */}
              <div className="space-y-3 p-4 rounded-2xl bg-surface-secondary dark:bg-[#1C1C1E] border border-separator dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-label-primary dark:text-[#F5F5F7] flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-500 fill-current" />
                      <span>Contest Reward Points (Total XP)</span>
                    </label>
                    <p className="text-[11px] text-label-secondary dark:text-[#86868B] mt-0.5">
                      Default is 100 points. Increase or decrease freely to match tournament stakes.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-mono font-black">
                    {totalPoints} Points
                  </span>
                </div>

                {/* Interactive Stepper & Direct Input */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTotalPoints(Math.max(10, totalPoints - 50))}
                      className="px-2.5 py-2 text-xs font-mono font-bold bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-xl text-label-secondary hover:text-label-primary transition-colors cursor-pointer"
                      title="Decrease by 50"
                    >
                      -50
                    </button>
                    <button
                      type="button"
                      onClick={() => setTotalPoints(Math.max(10, totalPoints - 10))}
                      className="px-2.5 py-2 text-xs font-mono font-bold bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-xl text-label-secondary hover:text-label-primary transition-colors cursor-pointer"
                      title="Decrease by 10"
                    >
                      -10
                    </button>
                  </div>

                  <input
                    type="number"
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(Math.max(1, Number(e.target.value)))}
                    min={1}
                    max={5000}
                    className="flex-1 px-3 py-2 text-xs text-center font-mono font-bold bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-xl text-label-primary dark:text-[#F5F5F7] focus:outline-none focus:border-amber-500"
                  />

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTotalPoints(totalPoints + 10)}
                      className="px-2.5 py-2 text-xs font-mono font-bold bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-xl text-label-secondary hover:text-label-primary transition-colors cursor-pointer"
                      title="Increase by 10"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => setTotalPoints(totalPoints + 50)}
                      className="px-2.5 py-2 text-xs font-mono font-bold bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-xl text-label-secondary hover:text-label-primary transition-colors cursor-pointer"
                      title="Increase by 50"
                    >
                      +50
                    </button>
                  </div>
                </div>
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-label-secondary dark:text-[#86868B] flex items-center gap-1.5">
                    <Clock size={13} className="text-primary" />
                    <span>Contest Start Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-secondary dark:bg-[#1C1C1E] border border-separator dark:border-white/10 rounded-xl text-label-primary dark:text-[#F5F5F7] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-label-secondary dark:text-[#86868B] flex items-center gap-1.5">
                    <Clock size={13} className="text-primary" />
                    <span>Contest End Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-secondary dark:bg-[#1C1C1E] border border-separator dark:border-white/10 rounded-xl text-label-primary dark:text-[#F5F5F7] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MCQ BUILDER */}
          {activeTab === 'mcq' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs font-bold text-label-secondary dark:text-[#86868B] uppercase tracking-wider block">
                    Multiple Choice Questions ({mcqQuestions.length})
                  </span>
                  <span className="text-[11px] text-label-secondary dark:text-[#86868B]">
                    Configure conceptual technical questions, answer keys, and point values.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMcqBulkModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Bulk upload questions via Excel or JSON"
                  >
                    <FileSpreadsheet size={14} />
                    <span>Bulk Upload MCQs</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMcq}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-110 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>

              {mcqQuestions.length === 0 ? (
                <div className="p-8 text-center bg-surface-secondary dark:bg-[#1C1C1E] rounded-2xl border border-dashed border-separator dark:border-white/10 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-label-primary dark:text-[#F5F5F7]">
                      No MCQ Questions Configured
                    </h4>
                    <p className="text-xs text-label-secondary dark:text-[#86868B] max-w-sm mx-auto mt-0.5">
                      Add multiple-choice questions one-by-one or import dozens at once from an Excel template.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowMcqBulkModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet size={14} />
                      <span>Bulk Upload from Excel</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddMcq}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-surface dark:bg-[#121214] hover:bg-surface-secondary border border-separator dark:border-white/10 text-label-primary dark:text-[#F5F5F7] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add Manually</span>
                    </button>
                  </div>
                </div>
              ) : (
                mcqQuestions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-4 sm:p-5 bg-surface-secondary dark:bg-[#1C1C1E] rounded-2xl border border-separator dark:border-white/10 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary font-mono">Question #{qIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setMcqQuestions(mcqQuestions.filter((_, idx) => idx !== qIdx))}
                      className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => {
                      const updated = [...mcqQuestions];
                      updated[qIdx].question = e.target.value;
                      setMcqQuestions(updated);
                    }}
                    placeholder="Enter question statement..."
                    className="w-full px-3 py-2 text-xs bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-xl text-label-primary dark:text-[#F5F5F7] font-medium focus:outline-none"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={q.correctOptionIndex === optIdx}
                          onChange={() => {
                            const updated = [...mcqQuestions];
                            updated[qIdx].correctOptionIndex = optIdx;
                            setMcqQuestions(updated);
                          }}
                          className="accent-primary cursor-pointer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...mcqQuestions];
                            updated[qIdx].options[optIdx] = e.target.value;
                            setMcqQuestions(updated);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          className="w-full px-2.5 py-1.5 text-xs bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-lg text-label-primary dark:text-[#F5F5F7] focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-28">
                      <label className="text-[10px] text-label-secondary dark:text-[#86868B] font-medium">Points</label>
                      <input
                        type="number"
                        value={q.points}
                        onChange={(e) => {
                          const updated = [...mcqQuestions];
                          updated[qIdx].points = Number(e.target.value);
                          setMcqQuestions(updated);
                        }}
                        className="w-full px-2 py-1 text-xs bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-lg text-label-primary dark:text-[#F5F5F7] focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-label-secondary dark:text-[#86868B] font-medium">Explanation</label>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={(e) => {
                          const updated = [...mcqQuestions];
                          updated[qIdx].explanation = e.target.value;
                          setMcqQuestions(updated);
                        }}
                        placeholder="Why is this option correct?"
                        className="w-full px-2.5 py-1 text-xs bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-lg text-label-primary dark:text-[#F5F5F7] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>
          )}

          {/* TAB 3: CODING PROBLEMS BUILDER WITH HIDDEN TEST CASES */}
          {activeTab === 'coding' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs font-bold text-label-secondary dark:text-[#86868B] uppercase tracking-wider block">
                    Coding Challenges ({codingProblems.length})
                  </span>
                  <p className="text-[11px] text-label-secondary dark:text-[#86868B]">
                    Configure problem statements, sample test cases, and hidden anti-cheat grading test cases.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCodingBulkModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Bulk upload coding challenges via Excel or JSON"
                  >
                    <FileSpreadsheet size={14} />
                    <span>Bulk Upload Challenges</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCoding}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-110 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Challenge</span>
                  </button>
                </div>
              </div>

              {codingProblems.length === 0 ? (
                <div className="p-8 text-center bg-surface-secondary dark:bg-[#1C1C1E] rounded-2xl border border-dashed border-separator dark:border-white/10 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <FileCode size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-label-primary dark:text-[#F5F5F7]">
                      No Coding Challenges Configured
                    </h4>
                    <p className="text-xs text-label-secondary dark:text-[#86868B] max-w-sm mx-auto mt-0.5">
                      Design problems with hidden test cases or upload complete challenges via our Excel template.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCodingBulkModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet size={14} />
                      <span>Bulk Upload from Excel</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCoding}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-surface dark:bg-[#121214] hover:bg-surface-secondary border border-separator dark:border-white/10 text-label-primary dark:text-[#F5F5F7] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add Manually</span>
                    </button>
                  </div>
                </div>
              ) : (
                codingProblems.map((p, pIdx) => {
                const testCases = p.testCases || [];
                const publicCount = testCases.filter((tc: any) => !tc.isHidden).length;
                const hiddenCount = testCases.filter((tc: any) => tc.isHidden).length;

                return (
                  <div
                    key={pIdx}
                    className="p-5 sm:p-6 bg-surface-secondary dark:bg-[#18181A] rounded-3xl border border-separator dark:border-white/10 space-y-4 shadow-sm"
                  >
                    {/* Problem Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-separator dark:border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold font-mono text-xs flex items-center justify-center border border-blue-500/20">
                          #{pIdx + 1}
                        </span>
                        <span className="font-extrabold text-sm text-label-primary dark:text-[#F5F5F7]">
                          {p.title || `Coding Challenge #${pIdx + 1}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCodingProblems(codingProblems.filter((_, idx) => idx !== pIdx))}
                        className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Delete Problem"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Problem Meta: Title, Difficulty, Points */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-label-secondary dark:text-[#86868B] font-bold uppercase tracking-wider block mb-1">
                          Problem Title *
                        </label>
                        <input
                          type="text"
                          value={p.title}
                          onChange={(e) => {
                            const updated = [...codingProblems];
                            updated[pIdx].title = e.target.value;
                            setCodingProblems(updated);
                          }}
                          placeholder="e.g. Invert Binary Tree / Subarray Max"
                          className="w-full px-3 py-2 text-xs bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-xl text-label-primary dark:text-[#F5F5F7] font-medium focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-label-secondary dark:text-[#86868B] font-bold uppercase tracking-wider block mb-1">
                          Difficulty
                        </label>
                        <select
                          value={p.difficulty || 'Medium'}
                          onChange={(e) => {
                            const updated = [...codingProblems];
                            updated[pIdx].difficulty = e.target.value;
                            setCodingProblems(updated);
                          }}
                          className="w-full px-3 py-2 text-xs bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-xl text-label-primary dark:text-[#F5F5F7] font-medium focus:outline-none cursor-pointer"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-label-secondary dark:text-[#86868B] font-bold uppercase tracking-wider block mb-1">
                          Points
                        </label>
                        <input
                          type="number"
                          value={p.points}
                          onChange={(e) => {
                            const updated = [...codingProblems];
                            updated[pIdx].points = Number(e.target.value);
                            setCodingProblems(updated);
                          }}
                          className="w-full px-3 py-2 text-xs bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-xl text-label-primary dark:text-[#F5F5F7] font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Problem Statement */}
                    <div>
                      <label className="text-[10px] text-label-secondary dark:text-[#86868B] font-bold uppercase tracking-wider block mb-1">
                        Problem Statement (Markdown / Plain Text)
                      </label>
                      <textarea
                        rows={3}
                        value={p.description}
                        onChange={(e) => {
                          const updated = [...codingProblems];
                          updated[pIdx].description = e.target.value;
                          setCodingProblems(updated);
                        }}
                        placeholder="Describe the problem, input constraints, and expected logic..."
                        className="w-full px-3 py-2 text-xs bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-xl resize-none text-label-primary dark:text-[#F5F5F7] focus:outline-none leading-relaxed"
                      />
                    </div>

                    {/* Sample Input & Output */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-surface/50 dark:bg-[#121214]/60 border border-separator dark:border-white/10">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-label-secondary dark:text-[#86868B] font-bold uppercase tracking-wider">
                            Sample Input (Console Stdin)
                          </label>
                        </div>
                        <textarea
                          rows={2}
                          value={p.sampleInput || ''}
                          onChange={(e) => {
                            const updated = [...codingProblems];
                            updated[pIdx].sampleInput = e.target.value;
                            setCodingProblems(updated);
                          }}
                          placeholder="e.g. 4\n2 7 11 15\n9"
                          className="w-full font-mono text-xs px-2.5 py-1.5 bg-surface dark:bg-[#161617] border border-separator dark:border-white/10 rounded-xl resize-none text-label-primary dark:text-[#F5F5F7] focus:outline-none"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-label-secondary dark:text-[#86868B] font-bold uppercase tracking-wider">
                            Sample Expected Output (Console Stdout)
                          </label>
                        </div>
                        <textarea
                          rows={2}
                          value={p.sampleOutput || ''}
                          onChange={(e) => {
                            const updated = [...codingProblems];
                            updated[pIdx].sampleOutput = e.target.value;
                            setCodingProblems(updated);
                          }}
                          placeholder="e.g. 0 1"
                          className="w-full font-mono text-xs px-2.5 py-1.5 bg-surface dark:bg-[#161617] border border-separator dark:border-white/10 rounded-xl resize-none text-label-primary dark:text-[#F5F5F7] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* ============================================================= */}
                    {/* TEST CASES SUITE MANAGER (VISIBLE & HIDDEN TEST CASES)        */}
                    {/* ============================================================= */}
                    <div className="pt-3 border-t border-separator dark:border-white/10 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-label-primary dark:text-[#F5F5F7] flex items-center gap-1.5">
                            <Terminal size={14} className="text-primary" />
                            <span>Evaluation Test Cases Suite</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface dark:bg-[#202023] border border-separator dark:border-white/10 text-label-secondary dark:text-[#86868B]">
                            {testCases.length} Total
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {publicCount} Public
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {hiddenCount} Hidden (Anti-Cheat)
                          </span>
                        </div>

                        {/* Quick Test Case Addition Toolbar */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {(p.sampleInput || p.sampleOutput) && (
                            <button
                              type="button"
                              onClick={() => handleCopySampleToTestCase(pIdx, false)}
                              className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-label-secondary hover:text-label-primary transition-colors flex items-center gap-1 cursor-pointer"
                              title="Import sample input & output as public test case"
                            >
                              <Copy size={12} />
                              <span>Import Sample</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleAddTestCase(pIdx, false)}
                            className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={12} />
                            <Eye size={12} />
                            <span>+ Public Case</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddTestCase(pIdx, true)}
                            className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={12} />
                            <EyeOff size={12} />
                            <span>+ Hidden Case</span>
                          </button>
                        </div>
                      </div>

                      {/* Informational Hint Card */}
                      <div className="p-3 rounded-2xl bg-amber-500/[0.06] dark:bg-amber-500/[0.08] border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2.5 leading-relaxed">
                        <ShieldAlert size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-amber-700 dark:text-amber-300">
                            Hidden Test Cases Engine:
                          </strong>{' '}
                          Hidden test cases are evaluated strictly during final grading by the sandbox runner.
                          Their inputs and expected outputs are concealed from students to prevent hardcoding
                          and assess large edge cases. Public test cases run during live sandbox tests.
                        </div>
                      </div>

                      {/* List of Test Cases */}
                      <div className="space-y-3 pt-1">
                        {testCases.length === 0 ? (
                          <div className="p-6 text-center rounded-2xl border border-dashed border-separator dark:border-white/10 space-y-2">
                            <Terminal size={22} className="text-label-tertiary mx-auto" />
                            <p className="text-xs font-bold text-label-primary dark:text-[#F5F5F7]">
                              No Test Cases Configured
                            </p>
                            <p className="text-[11px] text-label-secondary dark:text-[#86868B]">
                              Click "+ Public Case" or "+ Hidden Case" above to add grading tests.
                            </p>
                          </div>
                        ) : (
                          testCases.map((tc: any, tcIdx: number) => {
                            const isHidden = Boolean(tc.isHidden);

                            return (
                              <div
                                key={tcIdx}
                                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                                  isHidden
                                    ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.04] border-amber-500/25'
                                    : 'bg-surface dark:bg-[#141416] border-separator dark:border-white/10'
                                }`}
                              >
                                {/* Top Row: Index, Visibility Switch, Actions */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-black text-xs text-label-primary dark:text-[#F5F5F7]">
                                      Test Case #{tcIdx + 1}
                                    </span>

                                    {/* Toggle Pill for Hidden vs Public */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleTestCaseHidden(pIdx, tcIdx)}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                                        isHidden
                                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25 shadow-sm'
                                          : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/25 shadow-sm'
                                      }`}
                                      title="Click to switch between Public and Hidden"
                                    >
                                      {isHidden ? (
                                        <>
                                          <EyeOff size={12} className="text-amber-600 dark:text-amber-400" />
                                          <span>Hidden (Final Grading Only)</span>
                                        </>
                                      ) : (
                                        <>
                                          <Eye size={12} className="text-blue-600 dark:text-blue-400" />
                                          <span>Public (Visible in Run Code)</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicateTestCase(pIdx, tcIdx)}
                                      className="p-1.5 rounded-lg text-label-secondary hover:text-label-primary hover:bg-surface-secondary dark:hover:bg-white/10 transition-colors cursor-pointer"
                                      title="Duplicate Test Case"
                                    >
                                      <Copy size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTestCase(pIdx, tcIdx)}
                                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                      title="Delete Test Case"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* Inputs Grid: Stdin & Stdout */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] text-label-secondary dark:text-[#86868B] font-bold uppercase tracking-wider block mb-1">
                                      Standard Input (stdin)
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={tc.input || ''}
                                      onChange={(e) =>
                                        handleUpdateTestCase(pIdx, tcIdx, 'input', e.target.value)
                                      }
                                      placeholder="Raw stdin input lines..."
                                      className="w-full font-mono text-xs px-3 py-2 bg-surface dark:bg-[#1A1A1D] border border-separator dark:border-white/10 rounded-xl resize-none text-label-primary dark:text-[#F5F5F7] focus:outline-none focus:border-primary"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-label-secondary dark:text-[#86868B] font-bold uppercase tracking-wider block mb-1 flex items-center justify-between">
                                      <span>Expected Output (stdout) *</span>
                                      <span className="text-[10px] text-primary lowercase font-medium">
                                        exact match
                                      </span>
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={tc.expectedOutput || ''}
                                      onChange={(e) =>
                                        handleUpdateTestCase(pIdx, tcIdx, 'expectedOutput', e.target.value)
                                      }
                                      placeholder="Exact expected terminal output..."
                                      className="w-full font-mono text-xs px-3 py-2 bg-surface dark:bg-[#1A1A1D] border border-separator dark:border-white/10 rounded-xl resize-none text-label-primary dark:text-[#F5F5F7] focus:outline-none focus:border-primary"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-separator dark:border-white/10 shrink-0">
          <div className="text-xs text-label-secondary dark:text-[#86868B]">
            Total Reward: <strong className="text-amber-500 font-mono font-bold">{totalPoints} XP</strong>
            {questionsPointSum > 0 && (
              <span className="ml-1 text-[11px] text-label-tertiary">
                ({questionsPointSum} configured in challenges)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-label-secondary hover:text-label-primary bg-surface-secondary dark:bg-[#1C1C1E] border border-separator dark:border-white/10 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save size={15} />
              <span>{editingContest ? 'Update Contest' : 'Publish Contest'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Bulk Upload Modals */}
      <ContestMcqBulkUploadModal
        isOpen={showMcqBulkModal}
        onClose={() => setShowMcqBulkModal(false)}
        onImport={handleImportMcqQuestions}
        currentQuestionsCount={mcqQuestions.length}
      />
      <ContestCodingBulkUploadModal
        isOpen={showCodingBulkModal}
        onClose={() => setShowCodingBulkModal(false)}
        onImport={handleImportCodingProblems}
        currentProblemsCount={codingProblems.length}
      />
    </div>
  );
};

export default ContestBuilderModal;

