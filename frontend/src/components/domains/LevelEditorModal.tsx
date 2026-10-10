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
  Film,
  FileSpreadsheet,
  Sparkles,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import CodingBulkUploadModal from '../coding/admin/CodingBulkUploadModal';

interface IVideoField {
  id: string;
  title: string;
  url: string;
}

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

const getDefaultPointsForLevel = (levelNumber: number): number => {
  const num = Number(levelNumber) || 1;
  if (num <= 3) return 25;
  if (num <= 7) return 50;
  return 100;
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
  const [points, setPoints] = useState<number>(50);
  const [videoFields, setVideoFields] = useState<IVideoField[]>([
    { id: '1', title: 'Main Lecture', url: '' },
  ]);
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [codingChallengeId, setCodingChallengeId] = useState<string>('');
  const [codingChallenges, setCodingChallenges] = useState<any[]>([]);
  const [codingPool, setCodingPool] = useState<any[]>([]);
  const [candidateChallengeId, setCandidateChallengeId] = useState<string>('');
  const [bulkUploadOpen, setBulkUploadOpen] = useState<boolean>(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState<boolean>(false);
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

  const fetchLevelPool = async () => {
    if (levelToEdit?._id) {
      try {
        const res = await api.get(`/assessments/code/level/${levelToEdit._id}/pool`);
        if (res.data?.success && res.data?.data?.challenges) {
          setCodingPool(res.data.data.challenges);
        }
      } catch (err) {
        console.warn('Failed to load level pool', err);
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const res = await api.get('/assessments/code/admin/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'coding_challenges_sample_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Sample template downloaded successfully');
    } catch (err: any) {
      toast.error('Failed to download sample template');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleAddToPool = (challengeId: string) => {
    if (!challengeId) return;
    const challenge = codingChallenges.find((c) => c._id === challengeId);
    if (!challenge) return;
    if (codingPool.some((c) => (typeof c === 'object' ? c._id : c) === challengeId)) {
      toast.error('Question is already in pool');
      return;
    }
    setCodingPool([...codingPool, challenge]);
    setCandidateChallengeId('');
    toast.success(`Added "${challenge.title}" to pool`);
  };

  const handleRemoveFromPool = (index: number) => {
    setCodingPool((prev) => prev.filter((_, idx) => idx !== index));
    toast.success('Question removed from pool');
  };

  useEffect(() => {
    if (levelToEdit) {
      setLevelNumber(levelToEdit.levelNumber || 1);
      setTitle(levelToEdit.title || '');
      setPoints(
        typeof levelToEdit.points === 'number' && levelToEdit.points >= 0
          ? levelToEdit.points
          : getDefaultPointsForLevel(levelToEdit.levelNumber || 1)
      );

      if (Array.isArray(levelToEdit.videos) && levelToEdit.videos.length > 0) {
        setVideoFields(
          levelToEdit.videos.map((v, i) => ({
            id: String(i + 1),
            title: v.title || `Part ${i + 1}`,
            url: v.youtubeVideoId || '',
          }))
        );
      } else if (
        Array.isArray(levelToEdit.youtubeVideoIds) &&
        levelToEdit.youtubeVideoIds.length > 0
      ) {
        setVideoFields(
          levelToEdit.youtubeVideoIds.map((vid, i) => ({
            id: String(i + 1),
            title: `Part ${i + 1}`,
            url: vid,
          }))
        );
      } else {
        setVideoFields([
          {
            id: '1',
            title: 'Main Lecture',
            url: levelToEdit.youtubeVideoId || '',
          },
        ]);
      }

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

      // Initialize coding pool from levelToEdit
      const initialPool: any[] = [];
      if (Array.isArray(levelToEdit.codingChallengePool) && levelToEdit.codingChallengePool.length > 0) {
        levelToEdit.codingChallengePool.forEach((c: any) => {
          if (c) initialPool.push(c);
        });
      }
      if (
        levelToEdit.codingChallengeId &&
        !initialPool.some(
          (c: any) =>
            (typeof c === 'object' ? c._id : c) ===
            (typeof levelToEdit.codingChallengeId === 'object'
              ? (levelToEdit.codingChallengeId as any)._id
              : levelToEdit.codingChallengeId)
        )
      ) {
        initialPool.push(levelToEdit.codingChallengeId);
      }
      setCodingPool(initialPool);
      fetchLevelPool();
      setStudyMaterials(levelToEdit.studyMaterials ? [...levelToEdit.studyMaterials] : []);
      setQuestQuestions(
        levelToEdit.questQuestions && levelToEdit.questQuestions.length > 0
          ? [...levelToEdit.questQuestions]
          : createDefaultQuestions()
      );
    } else {
      const nextLvlNum = levels.length + 1;
      setLevelNumber(nextLvlNum);
      setTitle('');
      setPoints(getDefaultPointsForLevel(nextLvlNum));
      setVideoFields([
        { id: '1', title: 'Main Lecture', url: 'aircAruvnKk' },
      ]);
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

  const handleAddVideo = () => {
    setVideoFields((prev) => [
      ...prev,
      { id: Date.now().toString(), title: `Part ${prev.length + 1}`, url: '' },
    ]);
  };

  const handleUpdateVideo = (idx: number, field: 'title' | 'url', value: string) => {
    setVideoFields((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleRemoveVideo = (idx: number) => {
    if (videoFields.length <= 1) return;
    setVideoFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Level title is required');
      return;
    }

    const sanitizedVideos = videoFields
      .map((v, idx) => {
        const id = extractYouTubeId(v.url.trim());
        return {
          title: v.title.trim() || `Part ${idx + 1}: Lecture Video`,
          youtubeVideoId: id,
        };
      })
      .filter((v) => v.youtubeVideoId.length > 0);

    if (sanitizedVideos.length === 0) {
      toast.error('Please specify at least one valid YouTube video ID or URL');
      return;
    }

    setSubmitting(true);
    let success = false;
    const poolIds = codingPool
      .map((c) => (typeof c === 'object' && c !== null ? c._id : c))
      .filter(Boolean);

    const payload = {
      levelNumber: Number(levelNumber),
      title: title.trim(),
      points: Number(points) || 0,
      youtubeVideoId: sanitizedVideos[0].youtubeVideoId,
      youtubeVideoIds: sanitizedVideos.map((v) => v.youtubeVideoId),
      videos: sanitizedVideos,
      studyMaterials,
      questQuestions,
      assessmentId: assessmentId || null,
      codingChallengeId: poolIds[0] || codingChallengeId || null,
      codingChallengePool: poolIds,
      codingTimeLimitMinutes: 60,
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
    <>
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
      dialogClassName="sm:max-w-3xl p-6"
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
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
                  Level #
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={levelNumber}
                  onChange={(e) => {
                    const newNum = Number(e.target.value);
                    setLevelNumber(newNum);
                    if (!levelToEdit) {
                      setPoints(getDefaultPointsForLevel(newNum));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-sm text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div className="sm:col-span-6 space-y-1">
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

              <div className="sm:col-span-4 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Points Reward *
                  </label>
                  <span className="text-[10px] text-label-tertiary">
                    {points <= 35 ? 'Foundation' : points <= 75 ? 'Standard' : 'Capstone'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      required
                      value={points}
                      onChange={(e) => setPoints(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-sm font-semibold text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent pr-11"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-500 uppercase">
                      PTS
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[25, 50, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPoints(preset)}
                        className={`px-2 py-2 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                          points === preset
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                            : 'bg-surface border-separator text-label-tertiary hover:text-label-primary'
                        }`}
                        title={`Set to ${preset} points`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Multiple YouTube Videos List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-accent" />
                    YouTube Lecture Videos ({videoFields.length}) *
                  </label>
                  <p className="text-[11px] text-label-tertiary mt-0.5">
                    Add one or multiple video lessons for this level. Auto-detects YouTube IDs from URLs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVideo}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Video</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                {videoFields.map((field, idx) => {
                  const detectedId = extractYouTubeId(field.url);
                  return (
                    <div
                      key={field.id}
                      className="p-3 rounded-2xl bg-surface-secondary/60 border border-separator/80 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-surface text-label-secondary border border-separator text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-label-primary">
                            {field.title || `Video ${idx + 1}`}
                          </span>
                        </div>

                        {videoFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVideo(idx)}
                            className="w-6 h-6 rounded-lg text-label-tertiary hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition cursor-pointer"
                            title="Remove Video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={field.title}
                          onChange={(e) => handleUpdateVideo(idx, 'title', e.target.value)}
                          placeholder={`e.g. Part ${idx + 1}: Core Concepts`}
                          className="w-full px-3 py-1.5 rounded-xl bg-surface border border-separator text-xs text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                        />
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={field.url}
                            onChange={(e) => handleUpdateVideo(idx, 'url', e.target.value)}
                            placeholder="YouTube URL or 11-char ID"
                            className="w-full px-3 py-1.5 rounded-xl bg-surface border border-separator text-xs text-label-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent pr-16"
                          />
                          {detectedId && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {detectedId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Level Coding Assessment Question Pool */}
            <div className="space-y-3 p-4 rounded-2xl bg-surface-secondary/70 border border-separator/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Code2 className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-label-primary uppercase tracking-wider">
                      Level Coding Assessment Pool
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      2 Random Questions
                    </span>
                  </div>
                  <p className="text-[11px] text-label-secondary mt-1">
                    Students must score ≥ 70% in the MCQ quest to access this assessment. When launched, 2 questions are randomly assigned from this pool for a 60-minute coding session.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={downloadingTemplate}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-surface border border-separator text-label-primary hover:bg-surface-secondary transition cursor-pointer shadow-xs disabled:opacity-50"
                    title="Download Excel sample template"
                  >
                    {downloadingTemplate ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-label-tertiary" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    )}
                    <span>Template (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkUploadOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Bulk Upload</span>
                  </button>
                </div>
              </div>

              {/* Pool count & list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-label-secondary">
                    Pool Questions ({codingPool.length})
                  </span>
                  {codingPool.length < 2 && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      ⚠️ Add at least 2 questions for random 2-question assignment
                    </span>
                  )}
                </div>

                {codingPool.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-separator text-center text-xs text-label-tertiary bg-surface/40">
                    No coding questions added to this level yet. Bulk upload from Excel above or select from existing questions below.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {codingPool.map((c: any, idx: number) => {
                      const title = typeof c === 'object' ? c.title || c.problemName || `Problem ${idx + 1}` : `Challenge ${c}`;
                      const difficulty = typeof c === 'object' ? c.difficulty || 'Medium' : 'Medium';
                      const diffColors: Record<string, string> = {
                        Easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                        Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                        Hard: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                      };
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-separator/80 text-xs gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-surface-secondary text-label-secondary text-[11px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-label-primary truncate">
                              {title}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                diffColors[difficulty] || diffColors.Medium
                              }`}
                            >
                              {difficulty}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromPool(idx)}
                            className="w-6 h-6 rounded-lg text-label-tertiary hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition cursor-pointer shrink-0"
                            title="Remove from pool"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add question from existing list */}
              <div className="flex items-center gap-2 pt-1 border-t border-separator/60">
                <select
                  value={candidateChallengeId}
                  onChange={(e) => setCandidateChallengeId(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-surface border border-separator text-xs text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent cursor-pointer"
                >
                  <option value="">-- Add existing question to pool --</option>
                  {codingChallenges
                    .filter(
                      (ch) =>
                        !codingPool.some(
                          (p: any) => (typeof p === 'object' ? p._id : p) === ch._id
                        )
                    )
                    .map((ch) => (
                      <option key={ch._id} value={ch._id}>
                        {ch.title} [{ch.difficulty || 'Medium'}]
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleAddToPool(candidateChallengeId)}
                  disabled={!candidateChallengeId}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 disabled:opacity-40 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
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
              disabled={submitting || !title.trim() || !videoFields.some((v) => v.url.trim())}
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

    {bulkUploadOpen && (
      <CodingBulkUploadModal
        isOpen={bulkUploadOpen}
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        initialDomainId={domainId}
        preselectedDomainId={domainId}
        initialLevelId={levelToEdit?._id}
        preselectedLevelId={levelToEdit?._id}
        onSuccess={() => {
          fetchLevelPool();
        }}
      />
    )}
  </>
  );
};

export default LevelEditorModal;
