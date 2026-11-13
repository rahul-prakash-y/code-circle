import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Users,
  Clock,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Trophy,
  Palette,
  Play,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { formatISTDateTime } from '@/lib/dateUtils';
import { ArenaAssessment } from '@/store/useEventArenaStore';

export interface EventArenaHubViewProps {
  assessments: ArenaAssessment[];
  currentEvent: any;
  loading: boolean;
  isAdmin: boolean;
  blockedDetail: {
    isBlocked?: boolean;
    code?: string;
    blockedType?: string;
    sourceTitle?: string;
    reason?: string;
    error?: string;
  } | null;
  isCheckingUnblockStatus: boolean;
  onCheckUnblockStatus: () => Promise<void>;
  onRefresh: () => void;
  onSelectAssessment: (assessmentId: string) => void;
  onBack: () => void;
}

export const EventArenaHubView: React.FC<EventArenaHubViewProps> = ({
  assessments,
  currentEvent,
  loading,
  isAdmin,
  blockedDetail,
  isCheckingUnblockStatus,
  onCheckUnblockStatus,
  onRefresh,
  onSelectAssessment,
  onBack,
}) => {
  return (
    <div className="min-h-[100dvh] bg-canvas text-label-primary flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-separator px-4 sm:px-10 flex items-center justify-between shrink-0 bg-surface/85 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="light"
            onPress={onBack}
            className="rounded-xl text-label-secondary hover:text-label-primary text-xs font-semibold"
            startContent={<ArrowLeft size={16} />}
          >
            Back to Events
          </Button>
          <div className="h-5 w-[1px] bg-surface-secondary" />
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles size={16} />
            </span>
            <h1 className="text-sm sm:text-base font-bold text-label-primary tracking-tight">Event Arena Hub</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="flat"
            onPress={onRefresh}
            className="rounded-xl text-label-secondary hover:text-label-primary text-xs font-semibold"
            startContent={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {assessments.length} {assessments.length === 1 ? 'Assessment' : 'Assessments'} Available
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-10 space-y-6 sm:space-y-8 flex-1">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <ShieldCheck size={14} />
            <span>Official Event Competition Arena</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-label-primary tracking-tight">
            {currentEvent?.title || 'Event Arena Assessments'}
          </h2>
          <p className="text-xs sm:text-sm text-label-secondary max-w-2xl leading-relaxed">
            Complete each assessment round created by the event coordinators and faculty. Your submissions
            and code test-case executions will be evaluated securely, and points earned will be credited directly to your profile.
          </p>
        </div>

        {/* External Activity Block Banner */}
        {blockedDetail?.isBlocked && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-3xl bg-destructive/10 border-2 border-destructive/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-destructive/20 border border-destructive/40 flex items-center justify-center text-destructive shrink-0 mt-0.5 sm:mt-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-destructive text-white">
                    {blockedDetail.blockedType === 'CONTEST'
                      ? 'Contest Lock'
                      : blockedDetail.blockedType === 'COURSE'
                      ? 'Course Lock'
                      : blockedDetail.blockedType === 'GLOBAL'
                      ? 'Account Lock'
                      : blockedDetail.blockedType === 'OTHER_EVENT'
                      ? 'External Event Lock'
                      : 'Anti-Cheat Lock'}
                  </span>
                  <h4 className="text-sm font-bold text-label-primary">
                    {blockedDetail.blockedType && blockedDetail.blockedType !== 'THIS_EVENT'
                      ? `Blocked by ${blockedDetail.sourceTitle || 'External Activity'} — Unblock that first`
                      : 'Blocked from Event Arena Assessments'}
                  </h4>
                </div>
                <p className="text-xs text-destructive/90 mt-1.5 leading-relaxed">
                  {blockedDetail.blockedType && blockedDetail.blockedType !== 'THIS_EVENT'
                    ? `You are currently restricted by "${blockedDetail.sourceTitle}". Reason: ${blockedDetail.reason || 'Proctoring violation'}. Please unblock that first before taking any tests in this Event Arena.`
                    : (blockedDetail.reason || 'You have been blocked for navigating away. Please ask an event coordinator or faculty to unblock your attempt.')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                size="sm"
                variant="flat"
                color="danger"
                isLoading={isCheckingUnblockStatus}
                onPress={onCheckUnblockStatus}
                className="text-xs font-bold px-4 py-2 rounded-xl border border-destructive/30 cursor-pointer"
                startContent={!isCheckingUnblockStatus ? <RefreshCw size={13} /> : undefined}
              >
                Check Status
              </Button>
            </div>
          </motion.div>
        )}

        {/* Assessment Cards Grid */}
        {loading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse"
            role="status"
            aria-label="Loading event assessments"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-3xl bg-surface border border-separator p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xl"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-5 w-28 rounded-full bg-surface-secondary/80" />
                    <div className="h-5 w-20 rounded-full bg-surface-secondary/80" />
                  </div>
                  <div className="space-y-2.5 pt-1">
                    <div className="h-6 w-3/4 rounded-xl bg-surface-secondary/80" />
                    <div className="space-y-1.5 pt-1">
                      <div className="h-3.5 w-full rounded-md bg-surface-secondary/60" />
                      <div className="h-3.5 w-5/6 rounded-md bg-surface-secondary/60" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="h-8 rounded-xl bg-surface-secondary/80" />
                    <div className="h-8 rounded-xl bg-surface-secondary/80" />
                  </div>
                  <div className="h-4 w-36 rounded-md bg-surface-secondary/60 pt-1" />
                </div>
                <div className="pt-2">
                  <div className="h-[42px] w-full rounded-xl bg-surface-secondary/90" />
                </div>
              </div>
            ))}
          </div>
        ) : assessments.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-surface-secondary/40 border border-separator text-center space-y-3">
            <Layers size={36} className="mx-auto text-label-tertiary" />
            <h3 className="text-base font-bold text-label-primary">No Assessments Active</h3>
            <p className="text-xs text-label-tertiary max-w-sm mx-auto">
              The event admins have not published any assessments yet. Please check back when the round goes live.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((asm, idx) => {
              const sub = asm.submission;
              const nowMs = Date.now();
              const isSubFinished = sub?.status === 'SUBMITTED' || sub?.status === 'AUTO_SUBMITTED';
              const hasFutureExpiry = Boolean(sub?.expiresAt && new Date(sub.expiresAt).getTime() > nowMs);
              const isTimeExpired = Boolean(
                sub &&
                !isSubFinished &&
                sub.expiresAt &&
                new Date(sub.expiresAt).getTime() <= nowMs
              );
              const effectiveSubFinished = isSubFinished || isTimeExpired;

              const isGraceTimeActive = Boolean(
                !effectiveSubFinished &&
                hasFutureExpiry &&
                (sub?.reentryAllowed || ((sub?.graceMinutes || 0) > 0) || asm.hasGraceTime)
              );

              // If candidate submitted or time ended (regular or grace time), test is completed!
              const isCompleted = effectiveSubFinished && !isGraceTimeActive;
              const isInProgress = sub?.status === 'IN_PROGRESS' && hasFutureExpiry;

              const prevRound = idx > 0 ? assessments[idx - 1] : null;
              const prevSub = prevRound?.submission;
              const prevTimeExpired = Boolean(
                prevSub &&
                (prevSub.status !== 'SUBMITTED' && prevSub.status !== 'AUTO_SUBMITTED') &&
                prevSub.expiresAt &&
                new Date(prevSub.expiresAt).getTime() <= nowMs
              );
              const prevCompleted = Boolean(
                prevSub?.status === 'SUBMITTED' ||
                prevSub?.status === 'AUTO_SUBMITTED' ||
                (prevSub?.status as string) === 'COMPLETED' ||
                prevTimeExpired
              );
              const effectiveRoundCutoff = (asm.qualificationCutoffRank || 0) > 0
                ? asm.qualificationCutoffRank
                : (prevRound?.qualificationCutoffRank || 0) > 0
                ? prevRound?.qualificationCutoffRank
                : 0;
              const hasCutoff = idx > 0 && (effectiveRoundCutoff || 0) > 0;
              const isLockedBySequence = idx > 0 && !prevCompleted && !isCompleted && !isGraceTimeActive;
              const isEnded = asm.status === 'ENDED' && !isCompleted && !isGraceTimeActive;
              const isNotLive = asm.status !== 'LIVE' && !isCompleted && !isGraceTimeActive;

              return (
                <motion.div
                  key={asm._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="rounded-3xl bg-surface border border-separator hover:border-purple-500/40 p-5 sm:p-6 flex flex-col justify-between space-y-5 transition-all shadow-xl group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-surface-secondary text-label-primary border border-separator">
                        Round {idx + 1} • {asm.type}
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {asm.isTeamMode && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                            <Users size={11} />
                            <span>Team Mode ({asm.teamSize || 2})</span>
                          </span>
                        )}

                        {isGraceTimeActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                            <Clock size={11} className="text-amber-400" />
                            <span>Grace Time Active (+{sub?.graceMinutes || asm.graceMinutes || 10}m)</span>
                          </span>
                        ) : isCompleted ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            <span>Completed</span>
                          </span>
                        ) : isInProgress ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Clock size={11} />
                            <span>In Progress</span>
                          </span>
                        ) : isLockedBySequence ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-secondary text-label-tertiary border border-separator flex items-center gap-1">
                            <Lock size={11} />
                            <span>Locked</span>
                          </span>
                        ) : isEnded ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle size={11} />
                            <span>Ended</span>
                          </span>
                        ) : isNotLive ? (
                          isAdmin ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                              <Sparkles size={11} />
                              <span>Upcoming (Admin Preview)</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Clock size={11} />
                              <span>{asm.startTime ? `Starts ${formatISTDateTime(asm.startTime)}` : 'Upcoming'}</span>
                            </span>
                          )
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Live Now</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {hasCutoff && (
                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2 text-[11px] text-purple-300">
                        <Trophy size={13} className="text-amber-400 shrink-0" />
                        <span>Top {effectiveRoundCutoff} participants from Round {idx} qualify</span>
                      </div>
                    )}

                    {(asm.qualificationCutoffRank || 0) > 0 && idx < assessments.length - 1 && (
                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2 text-[11px] text-purple-300">
                        <Trophy size={13} className="text-amber-400 shrink-0" />
                        <span>Top {asm.qualificationCutoffRank} participants qualify for Round {idx + 2}</span>
                      </div>
                    )}

                    {asm.startTime && (
                      <div className="p-2.5 rounded-2xl bg-purple-500/5 border border-purple-500/15 text-[11px] font-mono space-y-1">
                        <div className="flex items-center justify-between text-label-secondary">
                          <span className="text-purple-400 font-semibold flex items-center gap-1">
                            <Clock size={11} /> Test Window (IST):
                          </span>
                          <span className="text-[10px] text-label-tertiary">
                            {asm.durationMinutes || 60} Mins
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-label-primary text-[10.5px]">
                          <span>Starts: {formatISTDateTime(asm.startTime)}</span>
                        </div>
                        {asm.endTime && (
                          <div className="flex items-center justify-between text-rose-400 text-[10.5px]">
                            <span>Ends: {formatISTDateTime(asm.endTime)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <h3 className="text-base font-bold text-label-primary group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {asm.title}
                      </h3>
                      {asm.description && (
                        <p className="text-xs text-label-secondary mt-1 line-clamp-2 leading-relaxed">
                          {asm.description}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-label-secondary">
                      <div className="p-2 rounded-xl bg-surface-secondary border border-separator flex items-center gap-1.5">
                        <Clock size={12} className="text-purple-400 shrink-0" />
                        <span>{asm.durationMinutes || 60} Mins</span>
                      </div>
                      <div className="p-2 rounded-xl bg-surface-secondary border border-separator flex items-center gap-1.5">
                        <Trophy size={12} className="text-amber-400 shrink-0" />
                        <span>{asm.totalPoints || 100} Pts</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-label-tertiary pt-1">
                      {asm.type === 'UI_UX' ? (
                        <span className="text-pink-400 font-semibold flex items-center gap-1.5">
                          <Palette size={13} />
                          <span>UI/UX Figma Design Challenge</span>
                        </span>
                      ) : (
                        <>
                          {asm.type !== 'CODING' && <span>{asm.mcqCount || 0} MCQs</span>}
                          {asm.type === 'HYBRID' && <span>•</span>}
                          {asm.type !== 'MCQ' && <span>{asm.codingCount || 0} Coding Problems</span>}
                        </>
                      )}
                    </div>

                    {isCompleted && (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                        {isAdmin && sub && sub.totalScore !== undefined ? (
                          <>
                            <div className="flex justify-between items-center text-label-primary font-bold">
                              <span>Score (Admin View):</span>
                              <span className="font-mono text-emerald-400">
                                {sub.totalScore} / {sub.maxPossibleScore} ({sub.scorePercentage}%)
                              </span>
                            </div>
                            <p className="text-[10px] text-label-secondary">
                              Status: <span className="font-bold text-emerald-400">{sub.isPassed ? 'Passed' : 'Participated'}</span>
                            </p>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-400 font-medium">
                            <CheckCircle2 size={13} className="shrink-0" />
                            <span>Submission recorded securely & under review</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    {isAdmin ? (
                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <Button
                            color="default"
                            variant="flat"
                            onPress={() => onSelectAssessment(asm._id)}
                            className="flex-1 min-h-[42px] rounded-xl text-white text-xs font-bold"
                            startContent={<Trophy size={13} className="text-amber-400" />}
                          >
                            Scorecard
                          </Button>
                        )}
                        <Button
                          color="secondary"
                          variant="flat"
                          onPress={() => onSelectAssessment(asm._id)}
                          className="flex-1 min-h-[42px] rounded-xl text-purple-200 text-xs font-bold shadow-lg shadow-purple-600/20"
                          title="Admin Test Mode: Attend/Preview assessment"
                          startContent={<Sparkles size={13} className="text-purple-300" />}
                        >
                          Preview Test (Admin Mode)
                        </Button>
                      </div>
                    ) : isGraceTimeActive ? (
                      <Button
                        color="warning"
                        variant="solid"
                        onPress={() => onSelectAssessment(asm._id)}
                        className="w-full min-h-[42px] rounded-xl text-white font-bold text-xs shadow-lg shadow-amber-500/30 hover:brightness-105 transition-all"
                        startContent={<Play size={13} />}
                      >
                        {sub?.status === 'IN_PROGRESS' ? 'Resume Test (Grace Time)' : 'Re-enter Assessment (Grace Time)'}
                      </Button>
                    ) : isCompleted ? (
                      <Button
                        isDisabled
                        variant="flat"
                        className="w-full min-h-[42px] rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs font-bold cursor-default"
                        startContent={<CheckCircle2 size={13} className="text-emerald-400" />}
                      >
                        Round Completed
                      </Button>
                    ) : isLockedBySequence ? (
                      <Button
                        isDisabled
                        variant="bordered"
                        className="w-full min-h-[42px] rounded-xl border-separator text-label-tertiary text-xs font-bold"
                        startContent={<Lock size={13} />}
                      >
                        Complete Round {idx} First
                      </Button>
                    ) : isEnded ? (
                      <Button
                        isDisabled
                        variant="bordered"
                        className="w-full min-h-[42px] rounded-xl border-rose-500/25 text-rose-400/80 text-xs font-bold"
                        startContent={<AlertTriangle size={13} />}
                      >
                        Assessment Ended
                      </Button>
                    ) : isNotLive ? (
                      <Button
                        isDisabled
                        variant="bordered"
                        className="w-full min-h-[42px] rounded-xl border-amber-500/25 text-amber-400/80 text-xs font-bold"
                        title={asm.startTime ? `Goes live 10 mins before ${formatISTDateTime(asm.startTime)}` : 'Waiting for round to start'}
                        startContent={<Clock size={13} />}
                      >
                        {asm.startTime ? `Starts ${formatISTDateTime(asm.startTime)}` : 'Waiting for Admin to Start'}
                      </Button>
                    ) : (
                      <Button
                        color="secondary"
                        variant="solid"
                        onPress={() => onSelectAssessment(asm._id)}
                        className="w-full min-h-[42px] rounded-xl text-white text-xs font-bold shadow-lg shadow-purple-600/30"
                        startContent={<Play size={13} />}
                      >
                        {isInProgress ? 'Resume Assessment' : 'Start Assessment'}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventArenaHubView;
