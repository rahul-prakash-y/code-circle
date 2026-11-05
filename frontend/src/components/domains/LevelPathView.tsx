import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ILevel } from '../../types/domain';
import useDomainStore from '../../store/useDomainStore';
import useAuthStore from '../../store/useAuthStore';
import useProfileStore from '../../store/useProfileStore';
import LevelSubmissionsModal from './LevelSubmissionsModal';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Lock,
  Play,
  Award,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Code2,
  Terminal,
  Film,
  Check,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface LevelPathViewProps {
  levels: ILevel[];
  activeLevelId?: string;
  onSelectLevel: (level: ILevel) => void;
}

export const LevelPathView: React.FC<LevelPathViewProps> = ({
  levels,
  activeLevelId,
  onSelectLevel,
}) => {
  const { currentDomain } = useDomainStore();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const isAdmin =
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty' ||
    profile?.role === 'Committee' ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin';

  const [selectedLevelForSubmissions, setSelectedLevelForSubmissions] = useState<ILevel | null>(null);

  return (
    <>
      <div className="space-y-3.5">
        {levels.map((lvl, index) => {
          const isCompleted = Boolean(lvl.isCompleted);
          const isUnlocked = Boolean(lvl.isUnlocked);
          const isActive = lvl._id === activeLevelId;

          const assessment =
            typeof lvl.assessmentId === 'object' && lvl.assessmentId !== null
              ? lvl.assessmentId
              : null;

          const codingChallenge =
            typeof lvl.codingChallengeId === 'object' && lvl.codingChallengeId !== null
              ? lvl.codingChallengeId
              : null;

          const hasCodingAssessment = Boolean(
            codingChallenge ||
            (Array.isArray(lvl.codingChallengePool) && lvl.codingChallengePool.length > 0)
          );

          const vidCount =
            (Array.isArray(lvl.videos) && lvl.videos.length) ||
            (Array.isArray(lvl.youtubeVideoIds) && lvl.youtubeVideoIds.length) ||
            (lvl.youtubeVideoId ? 1 : 0);

          const questionsCount = lvl.questQuestions?.length || 5;

          const levelPoints =
            typeof lvl.points === 'number' && lvl.points >= 0
              ? lvl.points
              : (lvl.levelNumber === 3 ? 250 : 150);

          const handleCardClick = () => {
            if (isUnlocked) {
              onSelectLevel(lvl);
            } else {
              if (lvl.requiresRegistration) {
                toast.error('🔒 Please register for this course above to unlock Level 1.');
              } else if (currentDomain?.isLockedForStudent) {
                toast.error('🔒 Course is locked pending administrator approval.');
              } else {
                const prev = lvl.requiresPreviousLevel || (lvl.levelNumber > 1 ? lvl.levelNumber - 1 : null);
                if (prev) {
                  toast.error(`🔒 Level ${lvl.levelNumber} is locked! Complete Level ${prev} requirements first.`);
                } else {
                  toast.error('🔒 Level is currently locked.');
                }
              }
            }
          };

          return (
            <motion.div
              key={lvl._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25 }}
              onClick={handleCardClick}
              className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                isActive
                  ? 'bg-surface border-accent shadow-[0_8px_24px_rgba(0,113,227,0.12)] ring-2 ring-accent/20'
                  : isCompleted
                  ? 'bg-surface/90 border-emerald-500/30 hover:border-emerald-500/60 shadow-xs hover:shadow-md'
                  : isUnlocked
                  ? 'bg-surface border-separator/80 hover:border-accent/40 shadow-xs hover:shadow-md hover:-translate-y-0.5'
                  : 'bg-surface-secondary/50 border-separator/50 opacity-60 hover:opacity-80'
              }`}
            >
              {/* Left Accent Indicator Strip */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${
                  isActive
                    ? 'bg-accent'
                    : isCompleted
                    ? 'bg-emerald-500'
                    : isUnlocked
                    ? 'bg-accent/40 group-hover:bg-accent'
                    : 'bg-separator'
                }`}
              />

              <div className="p-4 pl-4.5 sm:p-4.5 sm:pl-5 space-y-2.5">
                {/* Header Row: Level Badge, Status Pill, XP Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isActive
                          ? 'bg-accent text-white'
                          : isCompleted
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold'
                          : isUnlocked
                          ? 'bg-surface-secondary text-label-secondary border border-separator/80'
                          : 'bg-separator text-label-tertiary'
                      }`}
                    >
                      Level {lvl.levelNumber}
                    </span>

                    {/* Status Pill */}
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Completed</span>
                      </span>
                    ) : isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span>Current</span>
                      </span>
                    ) : !isUnlocked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-separator text-label-secondary">
                        <Lock className="w-2.5 h-2.5" />
                        <span>{lvl.requiresPreviousLevel ? `Req Lvl ${lvl.requiresPreviousLevel}` : 'Locked'}</span>
                      </span>
                    ) : lvl.isQuestCompleted && hasCodingAssessment && !lvl.isCodingChallengeCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse">
                        <Code2 className="w-3 h-3" />
                        <span>Code Pending</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Total Level Points Chip */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px] border border-amber-500/20 shrink-0">
                    <Award className="w-3 h-3 text-amber-500" />
                    +{levelPoints} pts
                  </span>
                </div>

                {/* Level Title: Full readability, line-clamp-2 */}
                <h4
                  className={`text-sm sm:text-base font-bold tracking-tight leading-snug line-clamp-2 transition-colors ${
                    isActive
                      ? 'text-label-primary'
                      : isUnlocked
                      ? 'text-label-primary group-hover:text-accent'
                      : 'text-label-secondary'
                  }`}
                  title={lvl.title}
                >
                  {lvl.title}
                </h4>

                {/* Feature Tags & Breakdown */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
                  {/* Quest Tag */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-secondary text-label-secondary border border-separator/60">
                    <HelpCircle className="w-3 h-3 text-accent shrink-0" />
                    <span>{questionsCount}Q Quest (50 XP)</span>
                  </span>

                  {/* Videos Tag */}
                  {vidCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-secondary text-label-secondary border border-separator/60">
                      <Film className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>{vidCount} {vidCount === 1 ? 'Video' : 'Videos'}</span>
                    </span>
                  )}

                  {/* Coding Tag */}
                  {hasCodingAssessment && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium border border-blue-500/20">
                      <Terminal className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>Coding Challenge</span>
                    </span>
                  )}

                  {/* Assessment Unlock Tag */}
                  {assessment && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium border border-purple-500/20">
                      <Award className="w-3 h-3 text-purple-500 shrink-0" />
                      <span className="truncate max-w-[130px]">{assessment.title}</span>
                    </span>
                  )}
                </div>

                {/* Bottom Row / Admin Submissions & Quick Action */}
                <div className="flex items-center justify-between pt-1 border-t border-separator/40 text-xs">
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLevelForSubmissions(lvl);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-accent/10 border border-accent/25 text-accent hover:bg-accent hover:text-white transition cursor-pointer"
                      title="View Student Submissions for this Level"
                    >
                      <Code2 className="w-3 h-3" />
                      <span>Submissions</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-label-tertiary">
                      {isCompleted
                        ? 'Mastery cleared'
                        : isUnlocked
                        ? 'Ready to learn'
                        : `Complete Level ${lvl.requiresPreviousLevel || (lvl.levelNumber - 1)} first`}
                    </span>
                  )}

                  <div className="flex items-center gap-1 text-[11px] font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>{isActive ? 'Current' : 'Select'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedLevelForSubmissions && (
        <LevelSubmissionsModal
          isOpen={Boolean(selectedLevelForSubmissions)}
          level={selectedLevelForSubmissions}
          onClose={() => setSelectedLevelForSubmissions(null)}
        />
      )}
    </>
  );
};

export default LevelPathView;
