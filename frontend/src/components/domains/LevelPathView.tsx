import React from 'react';
import { motion } from 'framer-motion';
import { ILevel } from '../../types/domain';
import useDomainStore from '../../store/useDomainStore';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Lock,
  Play,
  Award,
  ChevronRight,
  HelpCircle,
  Sparkles,
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

  return (
    <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-[2px] before:bg-separator">
      {levels.map((lvl, index) => {
        const isCompleted = Boolean(lvl.isCompleted);
        const isUnlocked = Boolean(lvl.isUnlocked);
        const isActive = lvl._id === activeLevelId;

        const assessment =
          typeof lvl.assessmentId === 'object' && lvl.assessmentId !== null
            ? lvl.assessmentId
            : null;

        const handleCardClick = () => {
          if (isUnlocked) {
            onSelectLevel(lvl);
          } else {
            if (currentDomain?.isLockedForStudent) {
              toast.error('🔒 Track is locked pending administrator approval.');
            } else {
              const prev = lvl.requiresPreviousLevel || (lvl.levelNumber > 1 ? lvl.levelNumber - 1 : null);
              if (prev) {
                toast.error(`🔒 Level ${lvl.levelNumber} is locked! Complete Level ${prev} quest first with 100% score.`);
              } else {
                toast.error('🔒 Level is currently locked.');
              }
            }
          }
        };

        return (
          <motion.div
            key={lvl._id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            className="relative group"
          >
            {/* Timeline Marker Node */}
            <div
              className={`absolute -left-6 sm:-left-8 top-5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center -translate-x-1/2 transition-all ${
                isCompleted
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-4 ring-emerald-500/10'
                  : isActive
                  ? 'bg-accent text-white shadow-md shadow-accent/30 ring-4 ring-accent/20 animate-pulse'
                  : isUnlocked
                  ? 'bg-surface border-2 border-accent text-accent'
                  : 'bg-surface border-2 border-separator text-label-tertiary'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              ) : isUnlocked ? (
                <span className="text-[11px] sm:text-xs font-bold">{lvl.levelNumber}</span>
              ) : (
                <Lock className="w-3 h-3 text-label-tertiary" />
              )}
            </div>

            {/* Level Card */}
            <div
              onClick={handleCardClick}
              className={`rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-surface border-accent/50 shadow-[0_8px_25px_rgba(0,113,227,0.08)] ring-1 ring-accent/30'
                  : isUnlocked
                  ? 'bg-surface border-separator/70 hover:border-separator-opaque hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:-translate-y-0.5'
                  : 'bg-surface-secondary/40 border-separator/40 opacity-70 hover:opacity-85'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-label-secondary">
                      Level {lvl.levelNumber}
                    </span>

                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Passed
                      </span>
                    )}

                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent">
                        Selected
                      </span>
                    )}

                    {!isUnlocked && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-separator text-label-secondary flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        {lvl.requiresPreviousLevel
                          ? `Requires Lvl ${lvl.requiresPreviousLevel}`
                          : 'Locked'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-label-primary truncate">
                    {lvl.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-label-secondary">
                    <span className="inline-flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-accent" />
                      {lvl.questQuestions?.length || 0}-Question Quest
                    </span>

                    {assessment && (
                      <span className="inline-flex whitespace-nowrap items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                        <Award className="w-3.5 h-3.5 text-purple-500" />
                        Unlocks: {assessment.title}
                      </span>
                    )}

                    {!isUnlocked && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        Complete Level {lvl.requiresPreviousLevel || (lvl.levelNumber - 1)} to unlock
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 pt-1">
                  {isUnlocked ? (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-accent text-white'
                          : 'bg-surface-secondary text-label-secondary group-hover:bg-accent/10 group-hover:text-accent'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-separator/50 flex items-center justify-center text-label-tertiary">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default LevelPathView;
