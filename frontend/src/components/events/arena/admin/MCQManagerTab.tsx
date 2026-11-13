import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
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
import { ArenaMcqQuestion } from '../../../../store/useEventArenaStore';

interface MCQManagerTabProps {
  eventId: string;
  assessmentId: string;
  adminMcqs: ArenaMcqQuestion[];
  canManageSelected: boolean;
  actionLoading: boolean;
  onSaveMcqs: (mcqs: ArenaMcqQuestion[]) => Promise<void>;
  onOpenBulkModal: () => void;
  downloadArenaTemplate: (eventId: string, type: 'mcq' | 'coding') => Promise<void>;
  onCloseModal: () => void;
}

export const MCQManagerTab: React.FC<MCQManagerTabProps> = memo(({
  eventId,
  assessmentId,
  adminMcqs,
  canManageSelected,
  actionLoading,
  onSaveMcqs,
  onOpenBulkModal,
  downloadArenaTemplate,
  onCloseModal,
}) => {
  const navigate = useNavigate();
  const [showAddMcq, setShowAddMcq] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '', '', '']);
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);
  const [newMcqPoints, setNewMcqPoints] = useState(10);
  const [newExplanation, setNewExplanation] = useState('');
  const [deletingMcqIndex, setDeletingMcqIndex] = useState<number | null>(null);

  const handleAddMcq = async () => {
    if (!newQuestionText.trim()) return toast.error('Question text is required');
    const validOptions = newOptions.filter((opt) => opt.trim() !== '');
    if (validOptions.length < 2) return toast.error('At least 2 options are required');

    const newQuestion: ArenaMcqQuestion = {
      question: newQuestionText.trim(),
      options: newOptions.map((o) => o.trim()),
      correctOptionIndex: newCorrectIndex,
      points: Number(newMcqPoints) || 10,
      explanation: newExplanation.trim(),
    };

    const updated = [...adminMcqs, newQuestion];
    await onSaveMcqs(updated);

    // Reset form
    setNewQuestionText('');
    setNewOptions(['', '', '', '']);
    setNewCorrectIndex(0);
    setNewMcqPoints(10);
    setNewExplanation('');
    setShowAddMcq(false);
  };

  const handleDeleteMcq = async (idx: number) => {
    if (!window.confirm('Delete this question?')) return;
    const updated = adminMcqs.filter((_, i) => i !== idx);
    setDeletingMcqIndex(idx);
    try {
      await onSaveMcqs(updated);
    } finally {
      setDeletingMcqIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-separator flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <HelpCircle size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-label-primary ">MCQ Question Bank</h4>
            <p className="text-xs text-text-muted">
              {adminMcqs.length} Questions • Total {adminMcqs.reduce((s, q) => s + (q.points || 10), 0)} Points
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
            onPress={() => downloadArenaTemplate(eventId, 'mcq')}
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
                color="secondary"
                onPress={() => setShowAddMcq(!showAddMcq)}
                startContent={<Plus size={14} />}
                className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30"
              >
                Add Question
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Manual Add MCQ Form */}
      <AnimatePresence>
        {showAddMcq && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 rounded-2xl bg-white/[0.03] border border-purple-500/30 space-y-4 overflow-visible relative z-20"
          >
            <div className="flex items-center justify-between pb-2 border-b border-separator">
              <h4 className="text-xs font-bold text-label-primary flex items-center gap-2">
                <Plus size={14} className="text-purple-400" />
                <span>Add New Multiple Choice Question</span>
              </h4>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setShowAddMcq(false)}
                className="text-text-muted hover:text-label-primary min-w-unit-8 w-8 h-8 rounded-lg cursor-pointer"
              >
                <X size={15} />
              </Button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">Question Text</label>
              <textarea
                rows={2}
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Enter the question prompt..."
                className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none resize-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {newOptions.map((opt, optIdx) => (
                <div key={optIdx} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-label-primary/70">
                    <span>Option {String.fromCharCode(65 + optIdx)}</span>
                    <label className="flex items-center gap-1 text-emerald-400 cursor-pointer">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={newCorrectIndex === optIdx}
                        onChange={() => setNewCorrectIndex(optIdx)}
                        className="accent-purple-500 cursor-pointer"
                      />
                      <span>Correct Answer</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...newOptions];
                      updated[optIdx] = e.target.value;
                      setNewOptions(updated);
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-separator text-xs text-label-primary outline-none focus:border-purple-500"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-label-secondary mb-1">Points</label>
                <input
                  type="number"
                  min={1}
                  value={newMcqPoints}
                  onChange={(e) => setNewMcqPoints(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-separator text-xs text-label-primary outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-label-secondary mb-1">Explanation (Optional)</label>
                <input
                  type="text"
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  placeholder="Explanation shown after submission..."
                  className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-separator text-xs text-label-primary outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="light"
                onPress={() => setShowAddMcq(false)}
                className="rounded-xl text-xs font-bold text-text-muted hover:text-label-primary"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="solid"
                color="secondary"
                isLoading={actionLoading}
                onPress={handleAddMcq}
                startContent={<CheckCircle2 size={13} />}
                className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30"
              >
                Save Question
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List of MCQs */}
      <div className="space-y-3">
        {adminMcqs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-separator text-center space-y-2">
            <HelpCircle size={28} className="mx-auto text-label-primary/30" />
            <h4 className="text-sm font-bold text-label-primary ">No MCQ Questions Yet</h4>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Click "Add Question" above or upload an Excel file containing questions and options.
            </p>
          </div>
        ) : (
          adminMcqs.map((q, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-separator transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-label-primary leading-relaxed">{q.question}</h5>
                    {q.explanation && (
                      <p className="text-[11px] text-text-muted italic mt-1">{q.explanation}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-label-secondary">
                    {q.points || 10} pts
                  </span>
                  {canManageSelected && (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      isLoading={deletingMcqIndex === idx}
                      isDisabled={deletingMcqIndex === idx}
                      onPress={() => handleDeleteMcq(idx)}
                      className="w-7 h-7 min-w-7 min-h-7 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-8">
                {q.options.map((opt, optIdx) => {
                  const isCorrect = q.correctOptionIndex === optIdx;
                  return (
                    <div
                      key={optIdx}
                      className={`px-3 py-1.5 rounded-lg border text-xs flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                          : 'bg-white/[0.01] border-white/5 text-label-primary/70'
                      }`}
                    >
                      <span>
                        {String.fromCharCode(65 + optIdx)}. {opt}
                      </span>
                      {isCorrect && (
                        <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          <span>Correct</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

MCQManagerTab.displayName = 'MCQManagerTab';
