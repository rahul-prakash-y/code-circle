import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ILevel, IStudyMaterial } from '../../types/domain';
import useDomainStore from '../../store/useDomainStore';
import useAuthStore from '../../store/useAuthStore';
import useProfileStore from '../../store/useProfileStore';
import TakeAssessmentModal from '../assessments/TakeAssessmentModal';
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Media & Content Tabs */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-separator shadow-sm text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'video'
                ? 'bg-accent text-white shadow-sm'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Lecture Video
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-accent text-white shadow-sm'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Study Materials ({materials.length})
          </button>
        </div>

        {/* Admin Quick Action Controls */}
        {isAdmin && (
          <div className="flex items-center gap-1.5">
            {onEditLevel && (
              <button
                type="button"
                onClick={onEditLevel}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface border border-separator text-label-secondary hover:text-label-primary hover:bg-surface-secondary transition cursor-pointer"
                title="Edit Level"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Level
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface border border-separator text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
              title="Delete Level"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* VIDEO TAB CONTENT */}
      {activeTab === 'video' && (
        <div className="relative w-full rounded-[24px] overflow-hidden bg-black shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-separator/40 aspect-video group">
          {level.youtubeVideoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${level.youtubeVideoId}?rel=0&modestbranding=1&enablejsapi=1`}
              title={level.title}
              className="w-full h-full border-0 rounded-[24px]"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-label-secondary gap-3 bg-surface-secondary">
              <Play className="w-12 h-12 stroke-[1.5]" />
              <span className="text-sm">Video stream not available</span>
            </div>
          )}
        </div>
      )}

      {/* STUDY MATERIALS TAB CONTENT */}
      {activeTab === 'notes' && (
        <div className="p-6 rounded-[24px] bg-surface border border-separator/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-separator">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-label-primary">
                Study Materials & Technical Cheatsheet
              </h3>
              <p className="text-xs text-label-secondary mt-0.5">
                Review core concepts, code patterns, and official documentation before testing your knowledge.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {materials.map((mat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-surface-secondary/70 border border-separator/70 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xs font-semibold">
                      {mat.type === 'code' ? (
                        <Code className="w-3.5 h-3.5" />
                      ) : mat.type === 'link' ? (
                        <LinkIcon className="w-3.5 h-3.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <span className="text-sm font-bold text-label-primary">{mat.title}</span>
                  </div>

                  {mat.type === 'code' && mat.content && (
                    <button
                      type="button"
                      onClick={() => handleCopyCode(mat.content!, idx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-surface border border-separator text-label-secondary hover:text-label-primary transition cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  )}

                  {mat.type === 'link' && mat.url && (
                    <a
                      href={mat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/20 transition"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {mat.content && (
                  <div className="text-xs text-label-secondary leading-relaxed">
                    {mat.type === 'code' ? (
                      <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-[12px] overflow-x-auto border border-slate-800">
                        <code>{mat.content}</code>
                      </pre>
                    ) : (
                      <div className="whitespace-pre-line text-[13px] text-label-primary/90 bg-surface/50 p-3 rounded-xl border border-separator/40">
                        {mat.content}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {materials.length === 0 && (
              <div className="text-center py-8 text-label-secondary text-xs">
                No study materials attached for this level yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control Card & Study Actions */}
      <div className="p-6 rounded-[22px] bg-surface border border-separator/60 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-label-secondary">
              <span className="text-accent">Level {level.levelNumber}</span>
              <span>•</span>
              <span>{currentDomain?.name || 'Track'}</span>
              {isCompleted && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-label-primary">
              {level.title}
            </h2>
          </div>

          {/* Primary Action Button: "Mark as Studied & Start Quest" */}
          <div className="shrink-0 flex items-center gap-3">
            {!isUnlocked ? (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold bg-surface-secondary border border-separator/80 text-label-secondary cursor-not-allowed opacity-80 shadow-sm"
                >
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>Quest Locked</span>
                </button>
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  {currentDomain?.isLockedForStudent
                    ? 'Track locked pending admin approval'
                    : `Complete Level ${level.requiresPreviousLevel || (level.levelNumber - 1)} first`}
                </span>
              </div>
            ) : (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openQuestModal}
                className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-semibold transition-all shadow-md cursor-pointer ${
                  isCompleted
                    ? 'bg-surface border border-separator text-label-primary hover:bg-surface-secondary shadow-sm'
                    : 'bg-accent text-white hover:bg-accent-hover shadow-accent/25'
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Review & Retake Quest</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Mark as Studied & Start Quest</span>
                  </>
                )}
                <ArrowRight className="w-4 h-4 opacity-80" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Feature Highlights / Info Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-separator/40 text-xs text-label-secondary">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-secondary/70">
            <HelpCircle className="w-4 h-4 text-accent" />
            <span>{questionsCount} Verification Questions</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-secondary/70">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>70% Pass Threshold</span>
          </div>

          <div className="flex items-center whitespace-nowrap gap-2 p-2.5 rounded-xl bg-surface-secondary/70">
            {codingChallenge ? (
              <>
                <Terminal className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="truncate">
                  Unlocks: Coding Challenge
                </span>
              </>
            ) : assessment ? (
              <>
                <Award className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="truncate">Unlocks: {assessment.title}</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">Unlocks Next Milestone</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CODING ASSESSMENT BANNER (Gated Progression) */}
      {codingChallenge && (
        <div
          className={`p-5 rounded-[22px] border transition-all ${
            isCodingChallengeCompleted
              ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-surface border-emerald-500/30 shadow-sm'
              : isCodingChallengeUnlocked
              ? 'bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-surface border-blue-500/30 shadow-sm ring-1 ring-blue-500/20'
              : 'bg-surface border-separator/60 opacity-80'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
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
                    ? 'Coding Assessment Opened • Required for Next Level'
                    : 'Coding Assessment (Locked)'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <h4 className="text-base font-bold text-label-primary">{codingChallenge.title}</h4>
                {codingChallenge.difficulty && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      codingChallenge.difficulty === 'Easy'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : codingChallenge.difficulty === 'Hard'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {codingChallenge.difficulty}
                  </span>
                )}
                {codingChallenge.timeLimitMinutes && (
                  <span className="text-xs text-label-secondary">
                    {codingChallenge.timeLimitMinutes} mins limit
                  </span>
                )}
              </div>

              <p className="text-xs text-label-secondary leading-relaxed">
                {isCodingChallengeCompleted
                  ? 'Great job! You passed all test cases. Level completed and next level unlocked!'
                  : isCodingChallengeUnlocked
                  ? 'MCQ quest passed with ≥ 70%! You must complete this coding assessment to unlock the next level.'
                  : `Score at least 70% in the MCQ quest above to open this coding assessment.`}
              </p>
            </div>

            <div className="shrink-0">
              {isCodingChallengeUnlocked ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/assessments/code/${codingChallengeId}?levelId=${level._id}&domainId=${level.domainId}`
                    )
                  }
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white shadow transition cursor-pointer active:scale-98 ${
                    isCodingChallengeCompleted
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 ring-2 ring-blue-500/20 animate-pulse'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  {isCodingChallengeCompleted ? 'Review Code Workspace' : 'Open Coding Assessment'}
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-separator/50 text-label-secondary">
                  <Lock className="w-3.5 h-3.5" />
                  Pass Quest (70%+) to Open
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UNLOCKED ASSESSMENT BANNER (Direct Student Access) */}
      {assessment && (
        <div
          className={`p-5 rounded-[22px] border transition-all ${
            isAssessmentUnlocked
              ? 'bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-surface border-purple-500/30 shadow-sm'
              : 'bg-surface border-separator/60 opacity-80'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                <Award className="w-4 h-4" />
                {isAssessmentUnlocked ? 'Assessment Unlocked & Available' : 'Linked Evaluation'}
              </div>
              <h4 className="text-base font-bold text-label-primary">{assessment.title}</h4>
              <p className="text-xs text-label-secondary">
                {isAssessmentUnlocked
                  ? 'You have mastered the requirements! Take your official accredited evaluation now.'
                  : `Complete the requirements in this level to unlock this assessment.`}
              </p>
            </div>

            {isAssessmentUnlocked ? (
              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(true)}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 active:scale-98 transition shadow cursor-pointer"
              >
                <Award className="w-4 h-4" />
                Take Assessment
              </button>
            ) : (
              <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-separator/50 text-label-secondary">
                <Lock className="w-3.5 h-3.5" />
                Complete Level to Unlock
              </div>
            )}
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
    </div>
  );
};

export default VideoQuestView;
