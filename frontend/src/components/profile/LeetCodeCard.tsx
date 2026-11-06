import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ExternalLink, RefreshCw, AlertCircle, Code2, Flame, Award, Trophy } from 'lucide-react';
import { LeetCodeBrandIcon } from '../ui/Icon';
import { useLeetCodeStats, type LeetCodeStats } from '../../hooks/useLeetCodeStats';
import CountUp from '../ui/CountUp';
import { EmilCard, EmilTooltipGroup } from '../ui/emil-ui';

// ── Difficulty Design Tokens mapped to semantic tokens ────────────────────────

const DIFFICULTY = [
  {
    key: 'easy' as const,
    label: 'Easy',
    solvedKey: 'easySolved' as keyof LeetCodeStats,
    totalKey: 'totalEasy' as keyof LeetCodeStats,
    trackClass: 'bg-success-subtle',
    fillClass: 'bg-success',
    textClass: 'text-success',
    dotClass: 'bg-success',
  },
  {
    key: 'medium' as const,
    label: 'Medium',
    solvedKey: 'mediumSolved' as keyof LeetCodeStats,
    totalKey: 'totalMedium' as keyof LeetCodeStats,
    trackClass: 'bg-warning-subtle',
    fillClass: 'bg-warning',
    textClass: 'text-warning',
    dotClass: 'bg-warning',
  },
  {
    key: 'hard' as const,
    label: 'Hard',
    solvedKey: 'hardSolved' as keyof LeetCodeStats,
    totalKey: 'totalHard' as keyof LeetCodeStats,
    trackClass: 'bg-destructive-subtle',
    fillClass: 'bg-destructive',
    textClass: 'text-destructive',
    dotClass: 'bg-destructive',
  },
] as const;

const EASE = { duration: 0.22, ease: [0.16, 1, 0.3, 1] } as const;

// ── Skeleton ─────────────────────────────────────────────────────────────────

const LeetCodeSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`w-full h-full min-h-[380px] rounded-[22px] p-6 sm:p-7 flex flex-col justify-between overflow-hidden bg-surface border border-separator shadow-sm ${className}`}
    aria-busy="true"
    aria-label="Loading LeetCode stats"
  >
    {/* Header row */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl skeleton-calm" />
        <div className="space-y-2">
          <div className="w-24 h-3.5 rounded-full skeleton-calm" />
          <div className="w-16 h-2.5 rounded-full skeleton-calm opacity-60" />
        </div>
      </div>
      <div className="w-20 h-3 rounded-full skeleton-calm opacity-40" />
    </div>

    {/* Hero number */}
    <div className="mb-6">
      <div className="w-28 h-14 rounded-xl skeleton-calm mb-2" />
      <div className="w-20 h-3 rounded-full skeleton-calm opacity-50" />
    </div>

    {/* Difficulty rows */}
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between">
            <div className="w-12 h-2.5 rounded-full skeleton-calm" />
            <div className="w-10 h-2.5 rounded-full skeleton-calm opacity-60" />
          </div>
          <div className="w-full h-[5px] rounded-full skeleton-calm" />
        </div>
      ))}
    </div>
  </div>
);

// ── Difficulty Progress Row ───────────────────────────────────────────────────

interface DifficultyRowProps {
  label: string;
  solved: number;
  total: number;
  fillClass: string;
  trackClass: string;
  textClass: string;
  dotClass: string;
  /** Staggered entrance delay in seconds */
  delay: number;
  /** Whether the parent card is in-view */
  inView: boolean;
}

const DifficultyRow: React.FC<DifficultyRowProps> = ({
  label,
  solved,
  total,
  fillClass,
  trackClass,
  textClass,
  dotClass,
  delay,
  inView,
}) => {
  const pct = total > 0 ? Math.min((solved / total) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
      transition={{ ...EASE, delay }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-label-secondary">
            {label}
          </span>
        </div>
        <span className={`text-[12px] font-mono ${textClass}`}>
          <span className="font-bold">{solved}</span>
          <span className="text-label-tertiary">/{total}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className={`w-full rounded-full overflow-hidden h-[5px] ${trackClass}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : { width: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: delay + 0.05 }}
          className={`h-full rounded-full ${fillClass}`}
        />
      </div>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

interface LeetCodeCardProps {
  /** Raw value from profile.socialLinks.leetcode — can be a username or full URL */
  username: string | undefined | null;
  className?: string;
}

export const LeetCodeCard: React.FC<LeetCodeCardProps> = ({ username, className = '' }) => {
  const { stats, status, isFetching, error, refetch } = useLeetCodeStats(username);

  // Scroll-triggered entrance
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-48px 0px' });

  // Derive a clean display handle (strip URL prefix)
  const displayHandle = username
    ? username
        .replace(/^https?:\/\/(?:www\.)?leetcode\.com\/(?:u\/)?/i, '')
        .replace(/\/$/, '')
        .split('/')[0]
    : null;

  // ── Empty state (no username configured) ──
  if (!username) {
    return (
      <div
        className={`w-full h-full min-h-[380px] rounded-[22px] p-6 sm:p-7 flex flex-col items-center justify-center gap-3 text-center bg-surface border border-separator shadow-sm ${className}`}
      >
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-canvas">
          <Code2 size={20} className="text-label-tertiary" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-label-primary">
            No LeetCode username
          </p>
          <p className="text-[12px] mt-0.5 text-label-secondary">
            Add your handle in Profiles &amp; Handles to view your stats here.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading skeleton (initial load only) ──
  if (status === 'loading' && !stats) return <LeetCodeSkeleton className={className} />;

  // ── Error / Not-found state (when no cached data exists) ──
  if ((status === 'error' || status === 'not_found') && !stats) {
    return (
      <div
        className={`w-full h-full min-h-[380px] rounded-[22px] p-6 sm:p-7 flex flex-col items-center justify-center gap-3 text-center bg-surface border border-separator shadow-sm ${className}`}
      >
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-destructive-subtle">
          <AlertCircle size={18} className="text-destructive" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-label-primary">
            {status === 'not_found' ? 'Username not found' : 'Failed to load stats'}
          </p>
          <p className="text-[11px] mt-0.5 max-w-[220px] mx-auto leading-relaxed text-label-secondary">
            {error}
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3.5 py-1.5 rounded-full transition-colors duration-150 ease-out cursor-pointer disabled:opacity-50 bg-canvas text-accent border border-separator hover:bg-surface-secondary"
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
          <span>{isFetching ? 'Refreshing...' : 'Retry'}</span>
        </button>
      </div>
    );
  }

  // ── Success / Loaded state ──
  const solveRate = stats && stats.totalQuestions > 0
    ? ((stats.totalSolved / stats.totalQuestions) * 100).toFixed(1)
    : '0.0';

  return (
    <EmilTooltipGroup>
      <EmilCard
        ref={ref}
        isHoverable
        className={`w-full h-full min-h-[380px] flex flex-col justify-between rounded-[22px] p-6 sm:p-7 cursor-default select-none border border-separator bg-surface shadow-sm ${className}`}
        aria-label={`LeetCode stats for ${displayHandle}`}
      >
        {/* ── Top Section (Header + Hero) ── */}
        <div>
          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
            <div className="flex items-center gap-3">
              {/* LeetCode logo mark */}
              <div className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 bg-warning-subtle">
                <LeetCodeBrandIcon size={18} className="text-warning" />
              </div>

              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[13.5px] font-semibold tracking-tight leading-tight text-label-primary">
                    LeetCode
                  </p>
                  {stats?.badgesCount && stats.badgesCount > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-warning-subtle text-warning">
                      <Award size={10} />
                      {stats.badgesCount}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] font-mono mt-0.5 text-label-tertiary">
                  @{displayHandle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* External link */}
              <a
                href={`https://leetcode.com/${displayHandle}/`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1 transition-colors duration-150 ease-out shrink-0 text-label-secondary bg-canvas border border-separator hover:text-label-primary hover:bg-surface-secondary"
              >
                <ExternalLink size={10} strokeWidth={2} />
                <span>Profile</span>
              </a>
            </div>
          </div>

          {/* ── Hero: Total Solved ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ ...EASE, delay: 0.06 }}
            className="mb-5 sm:mb-6"
          >
            <div className="text-[3.2rem] sm:text-[3.6rem] font-bold leading-none tracking-tighter tabular-nums text-label-primary">
              {inView && stats ? (
                <CountUp value={stats.totalSolved} />
              ) : (
                <span>0</span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <p className="text-[12px] text-label-secondary">
                problems solved{' '}
                <span className="text-label-tertiary">
                  / {stats?.totalQuestions ?? 0} total
                </span>
              </p>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-accent-subtle text-accent">
                {solveRate}%
              </span>

              {/* Total Active Days chip */}
              {stats?.totalActiveDays && stats.totalActiveDays > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-warning-subtle text-warning">
                  <Flame size={10} className="text-warning fill-warning" />
                  <span>{stats.totalActiveDays} days active</span>
                </span>
              ) : null}
            </div>
          </motion.div>
        </div>

        {/* ── Difficulty Breakdown (Middle Section) ── */}
        <div className="my-auto py-2 space-y-3.5 border-t border-separator pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] px-1 text-label-tertiary">
            Problem Solving Breakdown
          </p>
          {DIFFICULTY.map((d, i) => (
            <DifficultyRow
              key={d.key}
              label={d.label}
              solved={(stats?.[d.solvedKey] as number) ?? 0}
              total={(stats?.[d.totalKey] as number) ?? 0}
              fillClass={d.fillClass}
              trackClass={d.trackClass}
              textClass={d.textClass}
              dotClass={d.dotClass}
              delay={0.12 + i * 0.06}
              inView={inView}
            />
          ))}
        </div>

        {/* ── Footer: Global Rank, Acceptance & Points Bento Strip ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ ...EASE, delay: 0.35 }}
          className="pt-4 grid grid-cols-3 gap-2 items-center mt-auto border-t border-separator"
        >
          {/* Global Rank */}
          <div>
            <div className="flex items-center gap-1">
              <Trophy size={11} className="text-label-tertiary" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-label-tertiary">
                Global Rank
              </p>
            </div>
            <p className="text-[14px] sm:text-[15px] font-bold font-mono tabular-nums mt-0.5 truncate text-label-primary tracking-tight">
              {stats?.ranking ? `#${stats.ranking.toLocaleString()}` : '—'}
            </p>
          </div>

          {/* Acceptance Rate */}
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-label-tertiary">
              Acceptance
            </p>
            <p className="text-[14px] sm:text-[15px] font-bold font-mono tabular-nums mt-0.5 text-label-primary tracking-tight">
              {stats?.acceptanceRate !== undefined && stats.acceptanceRate > 0
                ? `${stats.acceptanceRate.toFixed(1)}%`
                : '—'}
            </p>
          </div>

          {/* Contribution Points / Reputation & Refetch */}
          <div className="flex items-center justify-end gap-2 text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-label-tertiary">
                Points
              </p>
              <p className="text-[14px] sm:text-[15px] font-bold font-mono tabular-nums mt-0.5 text-label-primary tracking-tight">
                {stats?.contributionPoints
                  ? stats.contributionPoints.toLocaleString()
                  : stats?.reputation
                  ? `${stats.reputation} rep`
                  : '0'}
              </p>
            </div>

            {/* Refetch button */}
            <button
              onClick={refetch}
              disabled={isFetching}
              className="flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 ease-out cursor-pointer shrink-0 ml-1 disabled:opacity-50 bg-canvas text-label-tertiary border border-separator hover:text-label-primary hover:bg-surface-secondary"
              title="Refresh stats"
              aria-label="Refresh LeetCode stats"
            >
              <RefreshCw
                size={12}
                strokeWidth={2}
                className={isFetching ? 'animate-spin text-accent' : ''}
              />
            </button>
          </div>
        </motion.div>
      </EmilCard>
    </EmilTooltipGroup>
  );
};

export default LeetCodeCard;
