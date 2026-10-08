import React, { useState, useEffect } from 'react';
import ResponsiveModal from '../ui/ResponsiveModal';
import useDomainStore from '../../store/useDomainStore';
import useAssessmentStore from '../../store/useAssessmentStore';
import api from '../../lib/axios';
import { ILevel, IQuestQuestion, IStudyMaterial } from '../../types/domain';
import {
  Compass,
  Play,
  Award,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Code,
  Code2,
  Link,
  FileText,
  Loader2,
} from 'lucide-react';

interface LevelEditorModalProps {
  isOpen: boolean;
  domainId: string;
  levelToEdit?: ILevel | null;
  onClose: () => void;
}

const extractYouTubeId = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  // If it's already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : trimmed;
};

const createDefaultQuestions = (): IQuestQuestion[] => [
  {
    question: 'What is the primary concept covered in this video lecture?',
    options: ['Core conceptual foundation', 'Secondary side-effect', 'Legacy syntax', 'Deprecated runtime rule'],
    correctOption: 0,
  },
  {
    question: 'Which method or approach yields optimal runtime performance?',
    options: ['Synchronous blocking loop', 'Asynchronous non-blocking architecture', 'Thread sleep polling', 'Manual memory deallocation'],
    correctOption: 1,
  },
  {
    question: 'How should state or parameters be organized across components?',
    options: ['Direct DOM alteration', 'Declarative state flow and strict immutability', 'Global window variables', 'Unchecked event dispatchers'],
    correctOption: 1,
  },
  {
    question: 'What architectural safeguard prevents production regressions?',
    options: ['Automated verification suites and strict type validation', 'Disabling strict mode', 'Suppressing all error logs', 'Hardcoding secret credentials'],
    correctOption: 0,
  },
  {
    question: 'What is the recommended production deployment practice?',
    options: ['Unminified single server scripts', 'Containerized multi-stage image orchestration', 'Manual FTP copy over HTTP', 'Direct root server access'],
    correctOption: 1,
  },
];

export const LevelEditorModal: React.FC<LevelEditorModalProps> = ({
  isOpen,
  domainId,
  levelToEdit,
  onClose,
}) => {
  const { createLevel, updateLevel, levels } = useDomainStore();
  const { assessments, fetchAssessments } = useAssessmentStore();

  const [levelNumber, setLevelNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [codingChallengeId, setCodingChallengeId] = useState<string>('');
  const [codingChallenges, setCodingChallenges] = useState<any[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<IStudyMaterial[]>([]);
  const [questQuestions, setQuestQuestions] = useState<IQuestQuestion[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'materials' | 'questions'>('info');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssessments();
    api.get('/assessments/code/challenges')
      .then((res) => {
        if (res.data?.success) {
          setCodingChallenges(res.data.data || []);
        }
      })
      .catch((err) => console.error('Failed to load coding challenges', err));
  }, [fetchAssessments]);

  useEffect(() => {
    if (levelToEdit) {
      setLevelNumber(levelToEdit.levelNumber || 1);
      setTitle(levelToEdit.title || '');
      setVideoInput(levelToEdit.youtubeVideoId || '');
      const assId =
        typeof levelToEdit.assessmentId === 'object' && levelToEdit.assessmentId !== null
          ? levelToEdit.assessmentId._id
          : levelToEdit.assessmentId || '';
      setAssessmentId(assId);
      const codeId =
        typeof levelToEdit.codingChallengeId === 'object' && levelToEdit.codingChallengeId !== null
          ? levelToEdit.codingChallengeId._id
          : levelToEdit.codingChallengeId || '';
      setCodingChallengeId(codeId);
      setStudyMaterials(levelToEdit.studyMaterials ? [...levelToEdit.studyMaterials] : []);
      setQuestQuestions(
        levelToEdit.questQuestions && levelToEdit.questQuestions.length > 0
          ? [...levelToEdit.questQuestions]
          : createDefaultQuestions()
      );
    } else {
      setLevelNumber(levels.length + 1);
      setTitle('');
      setVideoInput('aircAruvnKk');
      setAssessmentId('');
      setCodingChallengeId('');
      setStudyMaterials([
        {
          title: 'Core Concepts & Cheatsheet',
          type: 'notes',
          content: 'Key architectural rules and takeaways covered in this lecture.',
        },
        {
          title: 'Official Documentation',
          type: 'link',
          url: 'https://developer.mozilla.org',
          content: 'Comprehensive technical documentation and specs.',
        },
      ]);
      setQuestQuestions(createDefaultQuestions());
    }
  }, [levelToEdit, isOpen, levels.length]);

  // Question editing helpers
  const handleUpdateQuestion = (qIdx: number, field: keyof IQuestQuestion, val: any) => {
    setQuestQuestions((prev) => {
      const next = [...prev];
      next[qIdx] = { ...next[qIdx], [field]: val };
      return next;
    });
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    setQuestQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[qIdx].options];
      opts[optIdx] = val;
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  };

  const handleAddQuestion = () => {
    setQuestQuestions((prev) => [
      ...prev,
      {
        question: '',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctOption: 0,
      },
    ]);
  };

  const handleRemoveQuestion = (qIdx: number) => {
    if (questQuestions.length <= 1) {
      alert('A quest must contain at least 1 question.');
      return;
    }
    setQuestQuestions((prev) => prev.filter((_, idx) => idx !== qIdx));
  };

  // Study material helpers
  const handleAddMaterial = (type: 'notes' | 'link' | 'code' = 'notes') => {
    setStudyMaterials((prev) => [
      ...prev,
      {
        title: type === 'code' ? 'Code Snippet' : type === 'link' ? 'Reference Link' : 'Study Notes',
        type,
        url: type === 'link' ? 'https://' : '',
        content: '',
      },
    ]);
  };

  const handleUpdateMaterial = (idx: number, field: keyof IStudyMaterial, val: any) => {
    setStudyMaterials((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleRemoveMaterial = (idx: number) => {
    setStudyMaterials((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoInput.trim()) return;

    const youtubeVideoId = extractYouTubeId(videoInput);

    setSubmitting(true);
    let success = false;
    const payload = {
      levelNumber: Number(levelNumber),
      title: title.trim(),
      youtubeVideoId,
      studyMaterials,
      questQuestions,
      assessmentId: assessmentId || null,
      codingChallengeId: codingChallengeId || null,
    };

    if (levelToEdit?._id) {
      success = await updateLevel(levelToEdit._id, payload);
    } else {
      success = await createLevel(domainId, payload);
    }
    setSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <span>{levelToEdit ? `Edit Level ${levelNumber}` : 'Add Milestone Level'}</span>
        </div>
      }
      description="Configure lecture video, student study notes, linked MCQ assessment, and 5 quest questions."
      dialogClassName="sm:max-w-2xl p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-surface-secondary border border-separator text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'info'
                ? 'bg-surface text-label-primary shadow-sm'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            1. Lecture & Assessment
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'materials'
                ? 'bg-surface text-label-primary shadow-sm'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            2. Study Materials ({studyMaterials.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-surface text-label-primary shadow-sm'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            3. Quest Questions ({questQuestions.length})
          </button>
        </div>

        {/* TAB 1: INFO & LECTURE */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-1 space-y-1">
                <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
                  Level #
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={levelNumber}
                  onChange={(e) => setLevelNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-sm text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
                  Level Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Neural Networks & Perceptrons"
                  className="w-full px-4 py-2 rounded-xl bg-surface-secondary border border-separator text-sm text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider flex items-center justify-between">
                <span>YouTube Video ID or URL *</span>
                <span className="text-[11px] font-mono lowercase text-accent">Auto-detects ID</span>
              </label>
              <input
                type="text"
                required
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="e.g. aircAruvnKk or https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2 rounded-xl bg-surface-secondary border border-separator text-sm text-label-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>

            {/* Mapped Coding Assessment (Gated Progression) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                  <Code2 className="w-3.5 h-3.5" />
                  Mapped Coding Assessment (Gated Progression)
                </span>
                <span className="text-[11px] font-normal text-blue-600 dark:text-blue-400">
                  Optional
                </span>
              </label>
              <select
                value={codingChallengeId}
                onChange={(e) => setCodingChallengeId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-separator text-sm text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent cursor-pointer"
              >
                <option value="">None (MCQ Quest passes level directly)</option>
                {codingChallenges.map((challenge) => (
                  <option key={challenge._id} value={challenge._id}>
                    {challenge.title} [{challenge.difficulty || 'Medium'}] - {challenge.timeLimitMinutes || 45} mins
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-label-secondary">
                If mapped, students must score at least 70% on the MCQ quest to open this coding assessment. The next level will only be unlocked after this coding assessment is completed!
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider flex items-center justify-between">
                <span>Linked MCQ Assessment (Unlocked on Pass)</span>
                <span className="text-[11px] font-normal text-purple-600 dark:text-purple-400">
                  Optional
                </span>
              </label>
              <select
                value={assessmentId}
                onChange={(e) => setAssessmentId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-secondary border border-separator text-sm text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent cursor-pointer"
              >
                <option value="">None (Advances to next level only)</option>
                {assessments.map((ass) => (
                  <option key={ass._id} value={ass._id}>
                    {ass.title} ({ass.category || 'General'}) - {ass.questions?.length || 0} Questions
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-label-secondary">
                Students will be awarded and granted direct access to this evaluation upon passing this level's requirements.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: STUDY MATERIALS */}
        {activeTab === 'materials' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-label-secondary">
                Provide notes, cheat sheets, and technical links for students to study alongside the video.
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddMaterial('notes')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/20 transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Notes
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMaterial('link')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-secondary border border-separator text-label-primary hover:bg-separator transition cursor-pointer flex items-center gap-1"
                >
                  <Link className="w-3 h-3" /> Link
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMaterial('code')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-secondary border border-separator text-label-primary hover:bg-separator transition cursor-pointer flex items-center gap-1"
                >
                  <Code className="w-3 h-3" /> Code
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {studyMaterials.map((mat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-separator/80 bg-surface-secondary/60 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <select
                        value={mat.type}
                        onChange={(e) => handleUpdateMaterial(idx, 'type', e.target.value)}
                        className="px-2 py-1 rounded-lg bg-surface border border-separator text-xs font-semibold text-label-primary"
                      >
                        <option value="notes">Notes</option>
                        <option value="link">Link</option>
                        <option value="code">Code</option>
                        <option value="article">Article</option>
                        <option value="pdf">PDF</option>
                      </select>
                      <input
                        type="text"
                        value={mat.title}
                        onChange={(e) => handleUpdateMaterial(idx, 'title', e.target.value)}
                        placeholder="Material Title"
                        className="flex-1 px-3 py-1 rounded-lg bg-surface border border-separator font-medium text-label-primary"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(idx)}
                      className="text-rose-500 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {mat.type === 'link' && (
                    <input
                      type="url"
                      value={mat.url || ''}
                      onChange={(e) => handleUpdateMaterial(idx, 'url', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-1 rounded-lg bg-surface border border-separator font-mono text-xs"
                    />
                  )}

                  <textarea
                    rows={mat.type === 'code' ? 4 : 2}
                    value={mat.content || ''}
                    onChange={(e) => handleUpdateMaterial(idx, 'content', e.target.value)}
                    placeholder={
                      mat.type === 'code'
                        ? 'Paste code snippet here...'
                        : 'Notes, key bullet points, or summary...'
                    }
                    className={`w-full px-3 py-1.5 rounded-lg bg-surface border border-separator text-xs text-label-primary resize-none ${
                      mat.type === 'code' ? 'font-mono' : ''
                    }`}
                  />
                </div>
              ))}

              {studyMaterials.length === 0 && (
                <div className="text-center py-8 text-label-secondary border border-dashed border-separator rounded-xl">
                  No study materials added yet. Click above to add notes or code snippets.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: 5 QUEST QUESTIONS */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-label-secondary">
                Configure verification questions ({questQuestions.length} total). Any number of questions can be configured.
              </span>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3 h-3" /> Add Question
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-4 pr-1">
              {questQuestions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-3.5 rounded-xl border border-separator/80 bg-surface-secondary/50 space-y-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-accent/10 text-accent font-bold flex items-center justify-center shrink-0">
                      {qIdx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      value={q.question}
                      onChange={(e) => handleUpdateQuestion(qIdx, 'question', e.target.value)}
                      placeholder={`Question ${qIdx + 1} Prompt`}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-surface border border-separator font-medium text-label-primary text-xs"
                    />
                    {questQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="p-1 text-rose-500 hover:text-rose-600 transition"
                        title="Remove Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 pl-7">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correctOption === optIdx;
                      return (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correctOption-${qIdx}`}
                            checked={isCorrect}
                            onChange={() => handleUpdateQuestion(qIdx, 'correctOption', optIdx)}
                            className="cursor-pointer accent-accent"
                            title="Mark as correct option"
                          />
                          <span className="w-4 font-semibold text-label-secondary text-[11px]">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            className={`flex-1 px-2.5 py-1 rounded-md text-xs border ${
                              isCorrect
                                ? 'bg-emerald-500/5 border-emerald-500/40 text-emerald-900 dark:text-emerald-300 font-medium'
                                : 'bg-surface border-separator text-label-primary'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-separator flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab !== 'info' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'questions' ? 'materials' : 'info')}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-separator text-label-secondary hover:text-label-primary cursor-pointer"
              >
                Back
              </button>
            )}
            {activeTab !== 'questions' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'info' ? 'materials' : 'questions')}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface border border-separator hover:bg-surface-secondary text-label-primary cursor-pointer"
              >
                Next
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium border border-separator text-label-secondary hover:text-label-primary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !videoInput.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition cursor-pointer shadow"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : levelToEdit ? (
                'Save Changes'
              ) : (
                'Add Level'
              )}
            </button>
          </div>
        </div>
      </form>
    </ResponsiveModal>
  );
};

export default LevelEditorModal;
