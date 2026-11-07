import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ILevel, IStudyMaterial } from '../../types/domain';
import useDomainStore from '../../store/useDomainStore';
import useAuthStore from '../../store/useAuthStore';
import useProfileStore from '../../store/useProfileStore';
import TakeAssessmentModal from '../assessments/TakeAssessmentModal';
import LevelSubmissionsModal from './LevelSubmissionsModal';
import MarkdownContent from '../common/MarkdownContent';
import {
  Play,
  CheckCircle2,
  Sparkles,
  Award,
  BookOpen,
  Lock,
  ArrowRight,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Code,
  Code2,
  Terminal,
  Link as LinkIcon,
  Edit3,
  Trash2,
  ShieldCheck,
  GraduationCap,
  Film,
  ChevronLeft,
  ChevronRight,
  ListVideo,
  Clock,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface VideoQuestViewProps {
  level: ILevel;
  onEditLevel?: () => void;
}

export const VideoQuestView: React.FC<VideoQuestViewProps> = ({ level, onEditLevel }) => {
  const { openQuestModal, currentDomain, userProgress, deleteLevel } = useDomainStore();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const isAdmin =
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty' ||
    profile?.role === 'Committee' ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin';

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'video' | 'notes'>('video');
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);

  // Normalize multi-video list
  const videoList = useMemo(() => {
    if (Array.isArray(level.videos) && level.videos.length > 0) {
      return level.videos
        .filter((v) => v && v.youtubeVideoId)
        .map((v, i) => ({
          title: v.title?.trim() || `Part ${i + 1}: Lecture Video`,
          youtubeVideoId: v.youtubeVideoId,
        }));
    }
    if (Array.isArray(level.youtubeVideoIds) && level.youtubeVideoIds.length > 0) {
      return level.youtubeVideoIds
        .filter(Boolean)
        .map((id, i) => ({
          title: `Part ${i + 1}: Lecture Video`,
          youtubeVideoId: id,
        }));
    }
    if (level.youtubeVideoId) {
      return [{ title: 'Main Lecture Video', youtubeVideoId: level.youtubeVideoId }];
    }
    return [];
  }, [level]);

  // Reset active video index when switching levels
  useEffect(() => {
    setActiveVideoIndex(0);
  }, [level._id]);

  const currentVideo = videoList[activeVideoIndex] || videoList[0];
  const hasMultipleVideos = videoList.length > 1;

  const isCompleted = Boolean(level.isCompleted);
  const isUnlocked = Boolean(level.isUnlocked);
  const questionsCount = level.questQuestions?.length || 5;

  const assessment =
    typeof level.assessmentId === 'object' && level.assessmentId !== null
      ? level.assessmentId
      : null;

  const assessmentId = assessment?._id || (typeof level.assessmentId === 'string' ? level.assessmentId : null);
  const isAssessmentUnlocked = Boolean(
    assessmentId && userProgress.unlockedAssessments?.includes(assessmentId)
  );

  const hasCodingAssessment = Boolean(
    level.codingChallengeId ||
    (Array.isArray(level.codingChallengePool) && level.codingChallengePool.length > 0)
  );

  const codingChallenge =
    typeof level.codingChallengeId === 'object' && level.codingChallengeId !== null
      ? level.codingChallengeId
      : null;
  const codingChallengeId =
    codingChallenge?._id ||
    (typeof level.codingChallengeId === 'string' ? level.codingChallengeId : null);

  const isQuestCompleted = Boolean(
    level.isQuestCompleted ||
    (level._id && userProgress.completedQuests?.includes(level._id)) ||
    level.isCompleted
  );

  const isCodingChallengeCompleted = Boolean(
    level.isCodingChallengeCompleted ||
    (codingChallengeId && userProgress.completedCodingChallenges?.includes(codingChallengeId)) ||
    level.isCompleted
  );

  // Coding assessment opens only if MCQ quest is completed with >=70% marks:
  const isCodingChallengeUnlocked = Boolean(
    isAdmin ||
    level.isCodingChallengeUnlocked ||
    (codingChallengeId && userProgress.unlockedCodingChallenges?.includes(codingChallengeId)) ||
    isQuestCompleted
  );

  const materials = level.studyMaterials || [];

  const handleCopyCode = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success('Code snippet copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete Level ${level.levelNumber}: "${level.title}"?`)) {
      await deleteLevel(level._id);
    }
  };

  // Points calculation: Quest = 50 pts, Coding = Remaining pts
  const totalLevelPoints =
    typeof level.points === 'number' && level.points >= 0
      ? level.points
      : (level.levelNumber === 3 ? 250 : 150);
  const questPoints = 50;
  const codingPoints = Math.max(0, totalLevelPoints - questPoints);

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        {/* Modern Tab Switcher */}
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-surface border border-separator/80 shadow-xs text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'video'
                ? 'bg-accent text-white shadow-xs font-bold'
                : 'text-label-secondary hover:text-label-primary hover:bg-surface-secondary/80'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{hasMultipleVideos ? `Lecture Videos (${videoList.length})` : 'Lecture Video'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-accent text-white shadow-xs font-bold'
                : 'text-label-secondary hover:text-label-primary hover:bg-surface-secondary/80'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Study Materials ({materials.length})</span>
          </button>
        </div>

        {/* Admin Quick Actions */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsSubmissionsModalOpen(true)}
              className="inline-flex items-center whitespace-nowrap gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-accent/10 border border-accent/25 text-accent hover:bg-accent hover:text-white transition cursor-pointer shadow-2xs"
              title="View Student Submissions for this Level"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Submissions</span>
            </button>
            {onEditLevel && (
              <button
                type="button"
                onClick={onEditLevel}
                className="inline-flex items-center whitespace-nowrap gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-surface border border-separator text-label-secondary hover:text-label-primary hover:bg-surface-secondary transition cursor-pointer"
                title="Edit Level"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-surface border border-separator text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
              title="Delete Level"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* VIDEO TAB CONTENT */}
      {activeTab === 'video' && (
        <div className="space-y-4">
          {/* Multi-Video Playlist Bar */}
          {hasMultipleVideos && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-surface/90 border border-separator/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-xs">
                    <Film className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-bold text-label-primary">
                    Course Video Playlist ({videoList.length} Lessons)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-label-secondary bg-surface-secondary px-2.5 py-0.5 rounded-full border border-separator/60">
                  Lesson {activeVideoIndex + 1} of {videoList.length}
                </span>
              </div>

              {/* Horizontal Scrollable Video Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {videoList.map((vid, idx) => {
                  const isSelected = activeVideoIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveVideoIndex(idx)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                        isSelected
                          ? 'bg-accent text-white border-accent shadow-xs'
                          : 'bg-surface-secondary/70 border-separator text-label-secondary hover:text-label-primary hover:bg-surface'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-surface text-label-tertiary border border-separator'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="truncate max-w-[220px]">{vid.title || `Video ${idx + 1}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cinema Theater Player Container */}
          <div className="relative w-full rounded-[26px] overflow-hidden bg-slate-950 shadow-[0_16px_50px_rgba(0,0,0,0.15)] border border-separator/40 aspect-video group ring-1 ring-black/5 dark:ring-white/10">
            {currentVideo?.youtubeVideoId ? (
              <iframe
                key={currentVideo.youtubeVideoId}
                src={`https://www.youtube.com/embed/${currentVideo.youtubeVideoId}?rel=0&modestbranding=1&enablejsapi=1`}
                title={currentVideo.title || level.title}
                className="w-full h-full border-0 rounded-[26px]"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-label-secondary gap-3 bg-surface-secondary">
                <Play className="w-12 h-12 stroke-[1.5] text-label-tertiary" />
                <span className="text-sm font-medium">Video lecture stream not available</span>
              </div>
            )}
          </div>

          {/* Media Player Navigation Controls */}
          {hasMultipleVideos && (
            <div className="p-3 px-4 rounded-2xl bg-surface border border-separator/70 flex items-center justify-between gap-3 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveVideoIndex((i) => Math.max(0, i - 1))}
                disabled={activeVideoIndex === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-secondary border border-separator text-label-primary hover:bg-surface disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous Lesson</span>
              </button>

              <div className="text-center min-w-0 px-2">
                <div className="font-semibold text-label-primary truncate max-w-sm sm:max-w-md">
                  {currentVideo?.title || `Video ${activeVideoIndex + 1}`}
                </div>
                <div className="text-[11px] text-label-tertiary">
                  Part {activeVideoIndex + 1} of {videoList.length}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveVideoIndex((i) => Math.min(videoList.length - 1, i + 1))}
                disabled={activeVideoIndex === videoList.length - 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-secondary border border-separator text-label-primary hover:bg-surface disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer font-medium"
              >
                <span>Next Lesson</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STUDY MATERIALS TAB CONTENT */}
      {activeTab === 'notes' && (
        <div className="p-6 sm:p-7 rounded-[26px] bg-surface border border-separator/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-separator">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-bold tracking-tight text-label-primary">
                  Study Materials & Technical Cheatsheet
                </h3>
              </div>
              <p className="text-xs text-label-secondary mt-1">
                Review syntax rules, code patterns, and official documentation before testing your knowledge.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {materials.map((mat, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-surface-secondary/70 border border-separator/70 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
                      {mat.type === 'code' ? (
                        <Code className="w-4 h-4" />
                      ) : mat.type === 'link' ? (
                        <LinkIcon className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </span>
                    <span className="text-sm font-bold text-label-primary">{mat.title}</span>
                  </div>

                  {mat.type === 'code' && mat.content && (
                    <button
                      type="button"
                      onClick={() => handleCopyCode(mat.content!, idx)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-separator text-label-secondary hover:text-label-primary transition cursor-pointer shadow-2xs"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  )}

                  {mat.type === 'link' && mat.url && (
                    <a
                      href={mat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center whitespace-nowrap gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/20 transition shadow-2xs"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {mat.content && (
                  <div className="leading-relaxed">
                    {mat.type === 'code' ? (
                      <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-[12px] overflow-x-auto border border-slate-800">
                        <code>{mat.content}</code>
                      </pre>
                    ) : (
                      <div className="text-[13px] text-label-primary/90 bg-surface/60 p-4 rounded-xl border border-separator/50">
                        <MarkdownContent content={mat.content} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {materials.length === 0 && (
              <div className="text-center py-10 text-label-secondary text-xs space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-label-tertiary opacity-60" />
                <p>No study materials attached for this level yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Level Hub & Verification Quest Card */}
      <div className="p-6 sm:p-7 rounded-[26px] bg-gradient-to-br from-surface to-surface-secondary/90 border border-separator/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-5">
        {/* Top Header Row: Level pill, domain name, points, status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-separator/60">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-xl bg-accent text-white font-bold uppercase tracking-wider text-[11px] shadow-xs">
              Level {level.levelNumber}
            </span>
            <span className="text-xs font-semibold text-label-secondary">{currentDomain?.name || 'Course'}</span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 text-xs">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              +{totalLevelPoints} Total XP
            </span>
            <span className="text-[11px] text-label-tertiary">
              ({questPoints} XP Quest {codingPoints > 0 ? `+ ${codingPoints} XP Coding` : ''})
            </span>
          </div>
        </div>

        {/* Level Title & Action Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 flex-1 min-w-0">
            {/* Level Title */}
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-label-primary leading-snug">
              {level.title}
            </h2>

            <p className="text-xs text-label-secondary max-w-xl leading-relaxed">
              Complete the lecture videos, study key concepts, and pass the verification quest to unlock the coding assessment and advance your curriculum progression.
            </p>
          </div>

          {/* Primary Action Button: Quest Launch */}
          <div className="shrink-0 flex items-center">
            {!isUnlocked ? (
              <div className="flex flex-col items-start lg:items-end gap-1.5">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-xs sm:text-sm font-semibold bg-surface-secondary border border-separator text-label-secondary cursor-not-allowed opacity-80 shadow-2xs"
                >
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>Quest Locked</span>
                </button>
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  {currentDomain?.isLockedForStudent
                    ? 'Course locked pending admin approval'
                    : `Complete Level ${level.requiresPreviousLevel || (level.levelNumber - 1)} first`}
                </span>
              </div>
            ) : (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openQuestModal}
                className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${
                  isQuestCompleted
                    ? 'bg-surface border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shadow-xs'
                    : 'bg-accent text-white hover:bg-accent-hover shadow-accent/25 ring-2 ring-accent/20'
                }`}
              >
                {isQuestCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Quest Cleared (+50 XP) • Retake</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Mark as Studied & Start Quest (+50 XP)</span>
                  </>
                )}
                <ArrowRight className="w-4 h-4 opacity-80" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Feature Highlights Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-separator/60 text-xs text-label-secondary">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface border border-separator/60">
            <HelpCircle className="w-4 h-4 text-accent shrink-0" />
            <span className="font-medium">{questionsCount} Verification Questions</span>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface border border-separator/60">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-medium">70% Passing Score Threshold</span>
          </div>

          <div className="flex items-center whitespace-nowrap gap-2.5 p-3 rounded-2xl bg-surface border border-separator/60">
            {hasCodingAssessment ? (
              <>
                <Terminal className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="truncate font-medium">Unlocks Coding Challenge</span>
              </>
            ) : assessment ? (
              <>
                <Award className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="truncate font-medium">Unlocks: {assessment.title}</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate font-medium">Unlocks Next Milestone</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Gated Coding Challenge Section */}
      {hasCodingAssessment && (
        <div
          className={`p-6 sm:p-7 rounded-[26px] border transition-all ${
            isCodingChallengeCompleted
              ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-surface border-emerald-500/30 shadow-xs'
              : isCodingChallengeUnlocked
              ? 'bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-surface border-blue-500/30 shadow-md ring-1 ring-blue-500/20'
              : 'bg-surface/80 border-separator/70 opacity-80'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <Code2
                  className={`w-4 h-4 ${
                    isCodingChallengeCompleted
                      ? 'text-emerald-500'
                      : isCodingChallengeUnlocked
                      ? 'text-blue-500'
                      : 'text-label-tertiary'
                  }`}
                />
                <span
                  className={
                    isCodingChallengeCompleted
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isCodingChallengeUnlocked
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-label-secondary'
                  }
                >
                  {isCodingChallengeCompleted
                    ? 'Coding Assessment Completed'
                    : isCodingChallengeUnlocked
                    ? 'Coding Assessment Active • Required for Level Completion'
                    : 'Coding Assessment (Locked)'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <h4 className="text-base sm:text-lg font-bold text-label-primary">
                  {codingChallenge?.title || `Level ${level.levelNumber} Coding Assessment`}
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  2 Questions • 1 Hour Limit
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  +{codingPoints} XP
                </span>
              </div>

              <p className="text-xs text-label-secondary leading-relaxed max-w-xl">
                {isCodingChallengeCompleted
                  ? 'Excellent! You successfully passed all test cases. Points are credited and the next level is unlocked.'
                  : isCodingChallengeUnlocked
                  ? 'Verification quest cleared! You have 2 randomized algorithmic questions with a 1-hour time limit. Solve them to complete this level.'
                  : 'Score at least 70% in the Level Verification Quest above to unlock this hands-on coding assessment.'}
              </p>
            </div>

            <div className="shrink-0">
              {isCodingChallengeUnlocked ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/assessments/code/level/${level._id}?domainId=${level.domainId}`
                    )
                  }
                  className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold text-white shadow-md transition cursor-pointer active:scale-98 ${
                    isCodingChallengeCompleted
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25 ring-2 ring-blue-500/20'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>{isCodingChallengeCompleted ? 'Review Code Workspace' : `Launch Coding Assessment (+${codingPoints} XP)`}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-semibold bg-separator/50 text-label-secondary">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>Pass Quest (70%+) to Open</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Linked Domain Assessment Milestone */}
      {assessment && (
        <div
          className={`p-6 rounded-[24px] border transition-all ${
            isAssessmentUnlocked
              ? 'bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-surface border-purple-500/30 shadow-xs'
              : 'bg-surface border-separator/70 opacity-80'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                <Award className="w-4 h-4" />
                <span>{isAssessmentUnlocked ? 'Assessment Unlocked & Ready' : 'Linked Assessment'}</span>
              </div>
              <h4 className="text-base font-bold text-label-primary">{assessment.title}</h4>
              <p className="text-xs text-label-secondary max-w-xl">
                {isAssessmentUnlocked
                  ? 'You have cleared all course prerequisites! Take your accredited evaluation to claim your certificate badge.'
                  : 'Complete all level requirements to unlock this comprehensive assessment.'}
              </p>
            </div>

            <div className="shrink-0">
              {isAssessmentUnlocked ? (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof document !== 'undefined' && !document.fullscreenElement && document.documentElement.requestFullscreen) {
                      document.documentElement.requestFullscreen().catch(() => {});
                    }
                    setIsAssessmentModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 active:scale-98 transition shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Take Assessment</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium bg-separator/50 text-label-secondary">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Complete Level to Unlock</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Take Assessment Modal Instance */}
      {isAssessmentModalOpen && assessmentId && (
        <TakeAssessmentModal
          assessmentId={assessmentId}
          isOpen={isAssessmentModalOpen}
          onClose={() => setIsAssessmentModalOpen(false)}
        />
      )}

      {/* Admin Level Submissions Inspector Modal */}
      {isSubmissionsModalOpen && (
        <LevelSubmissionsModal
          isOpen={isSubmissionsModalOpen}
          level={level}
          onClose={() => setIsSubmissionsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default VideoQuestView;
