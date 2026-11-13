import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  Play,
  Download,
  Upload,
  Plus,
  X,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { toast } from 'react-hot-toast';
import HeroUISelect from '../../../ui/HeroUISelect';
import { ArenaCodingProblem } from '../../../../store/useEventArenaStore';

interface CodingManagerTabProps {
  eventId: string;
  assessmentId: string;
  adminCoding: ArenaCodingProblem[];
  canManageSelected: boolean;
  actionLoading: boolean;
  onSaveCoding: (problems: ArenaCodingProblem[]) => Promise<void>;
  onOpenBulkModal: () => void;
  downloadArenaTemplate: (eventId: string, type: 'mcq' | 'coding') => Promise<void>;
  onCloseModal: () => void;
}

export const CodingManagerTab: React.FC<CodingManagerTabProps> = memo(({
  eventId,
  assessmentId,
  adminCoding,
  canManageSelected,
  actionLoading,
  onSaveCoding,
  onOpenBulkModal,
  downloadArenaTemplate,
  onCloseModal,
}) => {
  const navigate = useNavigate();
  const [showAddCoding, setShowAddCoding] = useState(false);
  const [newCodingTitle, setNewCodingTitle] = useState('');
  const [newCodingDesc, setNewCodingDesc] = useState('');
  const [newCodingDiff, setNewCodingDiff] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [newCodingMode, setNewCodingMode] = useState<'BOTH' | 'ONLY_CODE' | 'TEST_CASES'>('BOTH');
  const [newCodingPoints, setNewCodingPoints] = useState(30);
  const [newCodingAllowedLanguages, setNewCodingAllowedLanguages] = useState<string[]>([
    'python',
    'javascript',
    'cpp',
    'java',
    'c',
  ]);
  const [newSampleInput, setNewSampleInput] = useState('');
  const [newSampleOutput, setNewSampleOutput] = useState('');
  const [newHiddenInput, setNewHiddenInput] = useState('');
  const [newHiddenOutput, setNewHiddenOutput] = useState('');
  const [deletingCodingIndex, setDeletingCodingIndex] = useState<number | null>(null);

  const handleAddCoding = async () => {
    if (!newCodingTitle.trim() || !newCodingDesc.trim()) {
      return toast.error('Problem title and description are required');
    }

    const testCases = [
      {
        input: newSampleInput.trim(),
        expectedOutput: newSampleOutput.trim(),
        isHidden: false,
      },
    ];

    if (newHiddenOutput.trim()) {
      testCases.push({
        input: newHiddenInput.trim(),
        expectedOutput: newHiddenOutput.trim(),
        isHidden: true,
      });
    }

    const newProblem: ArenaCodingProblem = {
      title: newCodingTitle.trim(),
      description: newCodingDesc.trim(),
      difficulty: newCodingDiff,
      codingMode: newCodingMode,
      points: Number(newCodingPoints) || 30,
      allowedLanguages:
        newCodingAllowedLanguages.length > 0
          ? newCodingAllowedLanguages
          : ['python', 'javascript', 'cpp', 'java', 'c'],
      sampleInput: newSampleInput.trim(),
      sampleOutput: newSampleOutput.trim(),
      testCases,
    };

    const updated = [...adminCoding, newProblem];
    await onSaveCoding(updated);

    // Reset form
    setNewCodingTitle('');
    setNewCodingDesc('');
    setNewCodingDiff('Medium');
    setNewCodingMode('BOTH');
    setNewCodingPoints(30);
    setNewCodingAllowedLanguages(['python', 'javascript', 'cpp', 'java', 'c']);
    setNewSampleInput('');
    setNewSampleOutput('');
    setNewHiddenInput('');
    setNewHiddenOutput('');
    setShowAddCoding(false);
  };

  const handleDeleteCoding = async (idx: number) => {
    if (!window.confirm('Delete this coding challenge?')) return;
    const updated = adminCoding.filter((_, i) => i !== idx);
    setDeletingCodingIndex(idx);
    try {
      await onSaveCoding(updated);
    } finally {
      setDeletingCodingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-separator flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Code2 size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-label-primary ">Coding Challenges</h4>
            <p className="text-xs text-text-muted">
              {adminCoding.length} Problems • Total{' '}
              {adminCoding.reduce((s, p) => s + (p.points || 30), 0)} Points
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button
            size="sm"
            variant="flat"
            color="secondary"
            startContent={<Play size={13} className="text-purple-400 fill-purple-400" />}
            onPress={() => {
              onCloseModal();
              navigate(`/events/${eventId}/arena?assessmentId=${assessmentId}&preview=true`);
            }}
            className="rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold border border-purple-500/30"
          >
            Preview Test
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => downloadArenaTemplate(eventId, 'coding')}
            startContent={<Download size={13} />}
            className="rounded-xl bg-white/5 hover:bg-white/10 text-label-primary text-xs font-semibold border border-separator"
          >
            Sample Template
          </Button>

          {canManageSelected && (
            <>
              <Button
                size="sm"
                variant="flat"
                onPress={onOpenBulkModal}
                startContent={<Upload size={13} />}
                className="rounded-xl bg-white/5 hover:bg-white/10 text-label-primary text-xs font-semibold border border-separator"
              >
                Bulk Upload Excel
              </Button>

              <Button
                size="sm"
                variant="solid"
                color="primary"
                onPress={() => setShowAddCoding(!showAddCoding)}
                startContent={<Plus size={14} />}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
              >
                Add Problem
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Manual Add Coding Problem Form */}
      <AnimatePresence>
        {showAddCoding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 rounded-2xl bg-white/[0.03] border border-blue-500/30 space-y-4 overflow-visible relative z-20"
          >
            <div className="flex items-center justify-between pb-2 border-b border-separator">
              <h4 className="text-xs font-bold text-label-primary flex items-center gap-2">
                <Plus size={14} className="text-blue-400" />
                <span>Add New Coding Challenge</span>
              </h4>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setShowAddCoding(false)}
                className="text-text-muted hover:text-label-primary min-w-unit-8 w-8 h-8 rounded-lg cursor-pointer"
              >
                <X size={15} />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-30">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1">Problem Title</label>
                <input
                  type="text"
                  value={newCodingTitle}
                  onChange={(e) => setNewCodingTitle(e.target.value)}
                  placeholder="e.g. Invert a Binary Tree or Maximum Subarray"
                  className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <HeroUISelect
                  label="Difficulty"
                  value={newCodingDiff}
                  onChange={(val) => setNewCodingDiff(val as any)}
                  size="sm"
                  color="purple"
                  options={[
                    { value: 'Easy', label: 'Easy', badge: 'Easy' },
                    { value: 'Medium', label: 'Medium', badge: 'Med' },
                    { value: 'Hard', label: 'Hard', badge: 'Hard' },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-label-secondary mb-1">
                Problem Description & Constraints
              </label>
              <textarea
                rows={3}
                value={newCodingDesc}
                onChange={(e) => setNewCodingDesc(e.target.value)}
                placeholder="Describe the challenge problem, input and output expectations..."
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-separator text-xs text-label-primary outline-none resize-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-label-secondary mb-1">Sample Input</label>
                <textarea
                  rows={2}
                  value={newSampleInput}
                  onChange={(e) => setNewSampleInput(e.target.value)}
                  placeholder="Sample stdin input..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-separator text-xs text-label-primary font-mono outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-label-secondary mb-1">
                  Sample Output (Expected)
                </label>
                <textarea
                  rows={2}
                  value={newSampleOutput}
                  onChange={(e) => setNewSampleOutput(e.target.value)}
                  placeholder="Sample expected output..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-separator text-xs text-label-primary font-mono outline-none resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1">
                  Hidden Test Case Input
                </label>
                <textarea
                  rows={2}
                  value={newHiddenInput}
                  onChange={(e) => setNewHiddenInput(e.target.value)}
                  placeholder="Hidden input for grading..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-500/30 text-xs text-label-primary font-mono outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1">
                  Hidden Test Case Expected Output
                </label>
                <textarea
                  rows={2}
                  value={newHiddenOutput}
                  onChange={(e) => setNewHiddenOutput(e.target.value)}
                  placeholder="Hidden expected output..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-500/30 text-xs text-label-primary font-mono outline-none resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-20">
              <div>
                <HeroUISelect
                  label="Coding Mode"
                  value={newCodingMode}
                  onChange={(val) => setNewCodingMode(val as any)}
                  size="sm"
                  color="purple"
                  placement="top-start"
                  options={[
                    {
                      value: 'BOTH',
                      label: 'Both (Student Chooses: Only Code or Test Cases)',
                      badge: 'Choice',
                    },
                    {
                      value: 'ONLY_CODE',
                      label: 'Only Code (Assigned Admin Grades Solution)',
                      badge: 'Manual',
                    },
                    {
                      value: 'TEST_CASES',
                      label: 'Code with Test Cases (Auto-Graded Immediately)',
                      badge: 'Auto',
                    },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1">
                  Points Possible
                </label>
                <input
                  type="number"
                  value={newCodingPoints}
                  onChange={(e) => setNewCodingPoints(Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">
                Allowed Programming Languages
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'python', label: 'Python 3' },
                  { id: 'javascript', label: 'JavaScript' },
                  { id: 'cpp', label: 'C++' },
                  { id: 'java', label: 'Java' },
                  { id: 'c', label: 'C' },
                ].map((lang) => {
                  const isSelected = newCodingAllowedLanguages.includes(lang.id);
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          if (newCodingAllowedLanguages.length > 1) {
                            setNewCodingAllowedLanguages((prev) =>
                              prev.filter((l) => l !== lang.id)
                            );
                          } else {
                            toast.error('At least one programming language must be allowed');
                          }
                        } else {
                          setNewCodingAllowedLanguages((prev) => [...prev, lang.id]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-sm'
                          : 'bg-white/5 text-text-muted border-white/10 hover:border-white/20'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {lang.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                Restricts students to solving with only the selected languages in the Arena.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="light"
                onPress={() => setShowAddCoding(false)}
                className="rounded-xl text-xs font-bold text-text-muted hover:text-label-primary"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="solid"
                color="primary"
                isLoading={actionLoading}
                onPress={handleAddCoding}
                startContent={<CheckCircle2 size={13} />}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
              >
                Save Challenge
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List of Coding Challenges */}
      <div className="space-y-3">
        {adminCoding.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-separator text-center space-y-2">
            <Code2 size={28} className="mx-auto text-label-primary/30" />
            <h4 className="text-sm font-bold text-label-primary ">No Coding Challenges Yet</h4>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Click "Add Problem" above or upload an Excel file containing coding challenges and test cases.
            </p>
          </div>
        ) : (
          adminCoding.map((p, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-separator transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-label-primary ">{p.title}</h5>
                    <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.difficulty === 'Easy'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : p.difficulty === 'Hard'
                        ? 'bg-rose-500/15 text-rose-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {p.difficulty}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-label-secondary">
                    {p.points || 30} pts
                  </span>
                  {canManageSelected && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      isLoading={deletingCodingIndex === idx}
                      isDisabled={deletingCodingIndex === idx}
                      onPress={() => handleDeleteCoding(idx)}
                      className="w-7 h-7 min-w-7 min-h-7 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted pl-8">
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-medium text-label-secondary">
                  Mode: {p.codingMode === 'ONLY_CODE' ? 'Only Code (Admin Graded)' : p.codingMode === 'TEST_CASES' ? 'Test Cases (Auto-Graded)' : 'Both (Student Choice)'}
                </span>
                <span>Test Cases: {(p.testCases || []).length}</span>
                <span>Allowed: {(p.allowedLanguages || []).join(', ')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

CodingManagerTab.displayName = 'CodingManagerTab';
