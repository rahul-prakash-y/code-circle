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
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useContestStore, { Contest, MCQQuestion, CodingProblem } from '../../../store/useContestStore';

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
  const { createContest, updateContest } = useContestStore();

  const [activeTab, setActiveTab] = useState<'info' | 'mcq' | 'coding'>('info');

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
      if (editingContest.mcqQuestions?.length) {
        setMcqQuestions(editingContest.mcqQuestions);
      }
      if (editingContest.codingProblems?.length) {
        setCodingProblems(editingContest.codingProblems);
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
    }
  }, [editingContest, isOpen]);

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
        testCases: [{ input: '', expectedOutput: '', isHidden: false }],
      },
    ]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Contest title is required');
      return;
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
      codingProblems: type === 'MCQ' ? [] : codingProblems,
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface rounded-3xl border border-separator max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-separator pb-4">
          <div>
            <h2 className="text-lg font-bold text-label-primary flex items-center gap-2">
              <Award size={20} className="text-primary" />
              <span>{editingContest ? 'Edit Weekly Contest' : 'Create Weekly Contest'}</span>
            </h2>
            <p className="text-xs text-label-tertiary mt-0.5">
              Design timed coding challenges and MCQ quests for collegiate students.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-secondary rounded-xl text-label-secondary hover:text-label-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-surface-secondary rounded-2xl border border-separator shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'info'
                ? 'bg-primary text-white shadow-xs'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            1. Basic Settings
          </button>
          {type !== 'CODING' && (
            <button
              onClick={() => setActiveTab('mcq')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'mcq'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              2. MCQ Questions ({mcqQuestions.length})
            </button>
          )}
          {type !== 'MCQ' && (
            <button
              onClick={() => setActiveTab('coding')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'coding'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              3. Coding Challenges ({codingProblems.length})
            </button>
          )}
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-label-secondary">Contest Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekly Algorithm Arena #12"
                  className="w-full px-4 py-2.5 text-xs bg-surface-secondary border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary focus:bg-surface font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-label-secondary">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 text-xs bg-surface-secondary border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary focus:bg-surface font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-label-secondary">Contest Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-surface-secondary border border-separator rounded-xl text-label-primary focus:outline-none focus:bg-surface"
                  >
                    <option value="HYBRID">Hybrid (Coding + MCQ)</option>
                    <option value="CODING">Coding Challenges Only</option>
                    <option value="MCQ">MCQ Quiz Only</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-label-secondary">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-surface-secondary border border-separator rounded-xl text-label-primary focus:outline-none focus:bg-surface"
                  >
                    <option value="All Levels">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-label-secondary">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    min={5}
                    max={360}
                    className="w-full px-3 py-2 text-xs bg-surface-secondary border border-separator rounded-xl text-label-primary focus:outline-none focus:bg-surface"
                  />
                </div>
              </div>

              {/* Total Reward Points Controller */}
              <div className="space-y-3 p-4 rounded-2xl bg-surface-secondary border border-separator">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-500 fill-current" />
                      <span>Contest Reward Points (Total XP)</span>
                    </label>
                    <p className="text-[11px] text-label-tertiary mt-0.5">
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
                      className="px-2.5 py-2 text-xs font-mono font-bold bg-surface border border-separator rounded-xl text-label-secondary hover:text-label-primary hover:border-primary/50 transition-colors"
                      title="Decrease by 50"
                    >
                      -50
                    </button>
                    <button
                      type="button"
                      onClick={() => setTotalPoints(Math.max(5, totalPoints - 10))}
                      className="px-2.5 py-2 text-xs font-mono font-bold bg-surface border border-separator rounded-xl text-label-secondary hover:text-label-primary hover:border-primary/50 transition-colors"
                      title="Decrease by 10"
                    >
                      -10
                    </button>
                  </div>

                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={1}
                      step={5}
                      value={totalPoints}
                      onChange={(e) => setTotalPoints(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full px-4 py-2 text-center text-base font-black text-primary font-mono bg-surface border border-separator rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTotalPoints(totalPoints + 10)}
                      className="px-2.5 py-2 text-xs font-mono font-bold bg-surface border border-separator rounded-xl text-label-secondary hover:text-label-primary hover:border-primary/50 transition-colors"
                      title="Increase by 10"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => setTotalPoints(totalPoints + 50)}
                      className="px-2.5 py-2 text-xs font-mono font-bold bg-surface border border-separator rounded-xl text-label-secondary hover:text-label-primary hover:border-primary/50 transition-colors"
                      title="Increase by 50"
                    >
                      +50
                    </button>
                    <button
                      type="button"
                      onClick={() => setTotalPoints(totalPoints + 100)}
                      className="px-2.5 py-2 text-xs font-mono font-bold bg-surface border border-separator rounded-xl text-label-secondary hover:text-label-primary hover:border-primary/50 transition-colors"
                      title="Increase by 100"
                    >
                      +100
                    </button>
                  </div>
                </div>

                {/* Quick Presets & Questions Sum Sync */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-separator/60">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-label-tertiary mr-1 font-medium">Quick Presets:</span>
                    {[25, 50, 100, 150, 200, 300, 500].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setTotalPoints(pts)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                          totalPoints === pts
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-surface border border-separator text-label-secondary hover:text-label-primary'
                        }`}
                      >
                        {pts} pts{pts === 100 ? ' (Default)' : ''}
                      </button>
                    ))}
                  </div>

                  {questionsPointSum > 0 && (
                    <button
                      type="button"
                      onClick={() => setTotalPoints(questionsPointSum)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border border-indigo-500/20 font-bold transition-colors inline-flex items-center gap-1"
                      title="Set contest total points to the exact sum of all MCQ and Coding questions"
                    >
                      <Sparkles size={11} />
                      <span>Sync Questions ({questionsPointSum} pts)</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-label-secondary">Start Window Time</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-secondary border border-separator rounded-xl text-label-primary focus:outline-none focus:bg-surface font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-label-secondary">End Window Time</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-secondary border border-separator rounded-xl text-label-primary focus:outline-none focus:bg-surface font-medium"
                  />
                </div>
              </div>

              {/* Point Allocation Policy */}
              <div className="space-y-1.5 p-4 rounded-2xl bg-surface-secondary border border-separator">
                <label className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                  <Award size={14} className="text-amber-500" />
                  <span>Point Allocation Policy</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPointAllocationMode('AUTOMATIC')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      pointAllocationMode === 'AUTOMATIC'
                        ? 'bg-surface border-primary shadow-xs ring-1 ring-primary'
                        : 'bg-surface/50 border-separator hover:border-separator/80'
                    }`}
                  >
                    <p className="text-xs font-bold text-label-primary flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-500" />
                      <span>Automatic</span>
                    </p>
                    <p className="text-[10px] text-label-tertiary mt-1 leading-tight">
                      System automatically awards earned points upon contest submit.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPointAllocationMode('MANUAL')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      pointAllocationMode === 'MANUAL'
                        ? 'bg-surface border-primary shadow-xs ring-1 ring-primary'
                        : 'bg-surface/50 border-separator hover:border-separator/80'
                    }`}
                  >
                    <p className="text-xs font-bold text-label-primary flex items-center gap-1">
                      <Layers size={12} className="text-indigo-500" />
                      <span>Manual Review</span>
                    </p>
                    <p className="text-[10px] text-label-tertiary mt-1 leading-tight">
                      Admin evaluates solutions and manually allocates points.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPointAllocationMode('HYBRID')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      pointAllocationMode === 'HYBRID'
                        ? 'bg-surface border-primary shadow-xs ring-1 ring-primary'
                        : 'bg-surface/50 border-separator hover:border-separator/80'
                    }`}
                  >
                    <p className="text-xs font-bold text-label-primary flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      <span>Hybrid</span>
                    </p>
                    <p className="text-[10px] text-label-tertiary mt-1 leading-tight">
                      Auto-credits base score with full support for manual bonuses.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MCQ BUILDER */}
          {activeTab === 'mcq' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                  Multiple Choice Questions ({mcqQuestions.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddMcq}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-110"
                >
                  <Plus size={14} />
                  <span>Add Question</span>
                </button>
              </div>

              {mcqQuestions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-5 bg-surface-secondary rounded-2xl border border-separator space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary font-mono">Question #{qIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setMcqQuestions(mcqQuestions.filter((_, idx) => idx !== qIdx))}
                      className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors"
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
                    className="w-full px-3 py-2 text-xs bg-surface border border-separator rounded-xl text-label-primary font-medium"
                  />

                  <div className="grid grid-cols-2 gap-2 pt-1">
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
                          className="accent-primary"
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
                          className="w-full px-2.5 py-1.5 text-xs bg-surface border border-separator rounded-lg text-label-primary"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-28">
                      <label className="text-[10px] text-label-secondary font-medium">Points</label>
                      <input
                        type="number"
                        value={q.points}
                        onChange={(e) => {
                          const updated = [...mcqQuestions];
                          updated[qIdx].points = Number(e.target.value);
                          setMcqQuestions(updated);
                        }}
                        className="w-full px-2 py-1 text-xs bg-surface border border-separator rounded-lg text-label-primary"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-label-secondary font-medium">Explanation (Revealed after contest)</label>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={(e) => {
                          const updated = [...mcqQuestions];
                          updated[qIdx].explanation = e.target.value;
                          setMcqQuestions(updated);
                        }}
                        placeholder="Why is this option correct?"
                        className="w-full px-2.5 py-1 text-xs bg-surface border border-separator rounded-lg text-label-primary"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: CODING PROBLEMS BUILDER */}
          {activeTab === 'coding' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                  Coding Challenges ({codingProblems.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddCoding}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-110"
                >
                  <Plus size={14} />
                  <span>Add Problem</span>
                </button>
              </div>

              {codingProblems.map((p, pIdx) => (
                <div
                  key={pIdx}
                  className="p-5 bg-surface-secondary rounded-2xl border border-separator space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary font-mono">Problem #{pIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setCodingProblems(codingProblems.filter((_, idx) => idx !== pIdx))}
                      className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] text-label-secondary font-medium">Problem Title</label>
                      <input
                        type="text"
                        value={p.title}
                        onChange={(e) => {
                          const updated = [...codingProblems];
                          updated[pIdx].title = e.target.value;
                          setCodingProblems(updated);
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-surface border border-separator rounded-xl text-label-primary font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-label-secondary font-medium">Points</label>
                      <input
                        type="number"
                        value={p.points}
                        onChange={(e) => {
                          const updated = [...codingProblems];
                          updated[pIdx].points = Number(e.target.value);
                          setCodingProblems(updated);
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-surface border border-separator rounded-xl text-label-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-label-secondary font-medium">Problem Statement</label>
                    <textarea
                      rows={3}
                      value={p.description}
                      onChange={(e) => {
                        const updated = [...codingProblems];
                        updated[pIdx].description = e.target.value;
                        setCodingProblems(updated);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-surface border border-separator rounded-xl resize-none text-label-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-label-secondary font-medium">Sample Input</label>
                      <textarea
                        rows={2}
                        value={p.sampleInput || ''}
                        onChange={(e) => {
                          const updated = [...codingProblems];
                          updated[pIdx].sampleInput = e.target.value;
                          setCodingProblems(updated);
                        }}
                        placeholder="e.g. 5\n1 2 3 4 5"
                        className="w-full font-mono text-xs px-2.5 py-1.5 bg-surface border border-separator rounded-xl resize-none text-label-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-label-secondary font-medium">Sample Expected Output</label>
                      <textarea
                        rows={2}
                        value={p.sampleOutput || ''}
                        onChange={(e) => {
                          const updated = [...codingProblems];
                          updated[pIdx].sampleOutput = e.target.value;
                          setCodingProblems(updated);
                        }}
                        placeholder="e.g. 15"
                        className="w-full font-mono text-xs px-2.5 py-1.5 bg-surface border border-separator rounded-xl resize-none text-label-primary"
                      />
                    </div>
                  </div>

                  {/* Test Cases Count */}
                  <div className="text-[11px] text-label-tertiary">
                    {p.testCases?.length || 1} test case(s) configured for automatic sandbox grading.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-separator">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-label-secondary hover:text-label-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
          >
            <Save size={15} />
            <span>{editingContest ? 'Update Contest' : 'Publish Contest'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ContestBuilderModal;
