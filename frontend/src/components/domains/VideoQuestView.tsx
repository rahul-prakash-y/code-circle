import React from 'react';
import { motion } from 'framer-motion';
import { ILevel } from '../../types/domain';
import useDomainStore from '../../store/useDomainStore';
import {
  Play,
  CheckCircle2,
  Sparkles,
  Award,
  BookOpen,
  Lock,
  ArrowRight,
  HelpCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface VideoQuestViewProps {
  level: ILevel;
}

export const VideoQuestView: React.FC<VideoQuestViewProps> = ({ level }) => {
  const { openQuestModal, currentDomain } = useDomainStore();

  const isCompleted = Boolean(level.isCompleted);
  const isUnlocked = Boolean(level.isUnlocked);
  const questionsCount = level.questQuestions?.length || 5;

  const assessment =
    typeof level.assessmentId === 'object' && level.assessmentId !== null
      ? level.assessmentId
      : null;

  return (
    <div className="space-y-6">
      {/* Video Container (clean, borderless, 16:9 ratio, subtle shadow) */}
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
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openQuestModal}
              disabled={!isUnlocked}
              className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-semibold transition-all shadow-md cursor-pointer ${
                isCompleted
                  ? 'bg-surface border border-separator text-label-primary hover:bg-surface-secondary shadow-sm'
                  : 'bg-accent text-white hover:bg-accent-hover shadow-accent/25'
              } disabled:opacity-40 disabled:pointer-events-none`}
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
          </div>
        </div>

        {/* Feature Highlights / Info Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-separator/40 text-xs text-label-secondary">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-secondary/70">
            <HelpCircle className="w-4 h-4 text-accent" />
            <span>{questionsCount} Knowledge Verification Questions</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-secondary/70">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>100% Pass Required to Unlock</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-secondary/70">
            <Award className="w-4 h-4 text-purple-500" />
            <span className="truncate">
              {assessment ? `Unlocks: ${assessment.title}` : 'Unlocks Next Milestone'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoQuestView;
