import React, { useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ExternalLink, RefreshCw, AlertCircle, Code2, Flame, Award, Trophy } from 'lucide-react';
import { useLeetCodeStats, type LeetCodeStats } from '../../hooks/useLeetCodeStats';
import CountUp from '../ui/CountUp';

// ── Design tokens (mirrors the project's CSS custom props) ────────────────────

const DIFFICULTY = [
  {
    key: 'easy'   as const,
    label: 'Easy',
    solvedKey: 'easySolved'   as keyof LeetCodeStats,
    totalKey:  'totalEasy'    as keyof LeetCodeStats,
    /* Low-saturation semantic green */
    track: 'rgba(52, 199, 89, 0.12)',
    fill:  'rgba(52, 199, 89, 0.70)',
    text:  '#34C759',
    dot:   'bg-emerald-500/70',
  },
  {
    key: 'medium' as const,
    label: 'Medium',
    solvedKey: 'mediumSolved' as keyof LeetCodeStats,
    totalKey:  'totalMedium'  as keyof LeetCodeStats,
    /* Low-saturation amber */
    track: 'rgba(255, 159, 10, 0.12)',
    fill:  'rgba(255, 159, 10, 0.70)',
    text:  '#FF9F0A',
    dot:   'bg-amber-400/70',
  },
  {
    key: 'hard'   as const,
    label: 'Hard',
    solvedKey: 'hardSolved'   as keyof LeetCodeStats,
    totalKey:  'totalHard'    as keyof LeetCodeStats,
    /* Low-saturation coral */
    track: 'rgba(255, 59, 48, 0.10)',
    fill:  'rgba(255, 59, 48, 0.65)',
    text:  '#FF3B30',
    dot:   'bg-red-500/65',
  },
] as const;

const SPRING = { type: 'spring', stiffness: 260, damping: 30 } as const;
const EASE   = { duration: 0.22, ease: [0.16, 1, 0.3, 1] }    as const;

// ── Skeleton ─────────────────────────────────────────────────────────────────

const LeetCodeSkeleton: React.FC = () => (
  <div
    className="w-full rounded-[22px] p-6 sm:p-7 overflow-hidden"
    style={{
      background: 'var(--surface)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
    }}
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
  fill: string;
  track: string;
  textColor: string;
  dot: string;
  /** Staggered entrance delay in seconds */
  delay: number;
  /** Whether the parent card is in-view */
  inView: boolean;
}

const DifficultyRow: React.FC<DifficultyRowProps> = ({
  label, solved, total, fill, track, textColor, dot, delay, inView,
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
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.07em]"
            style={{ color: 'var(--label-secondary)' }}
          >
            {label}
          </span>
        </div>
        <span className="text-[12px] font-mono" style={{ color: textColor }}>
          <span className="font-bold">{solved}</span>
          <span style={{ color: 'var(--label-tertiary)' }}>/{total}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 5, background: track }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : { width: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: delay + 0.05 }}
          className="h-full rounded-full"
          style={{ background: fill }}
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
        className={`w-full rounded-[22px] p-6 sm:p-7 flex flex-col items-center justify-center gap-3 text-center ${className}`}
        style={{
          background: 'var(--surface)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
          minHeight: 200,
        }}
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--canvas)' }}
        >
          <Code2 size={20} style={{ color: 'var(--label-tertiary)' }} />
        </div>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--label-primary)' }}>
            No LeetCode username
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--label-secondary)' }}>
            Add your handle in Profiles &amp; Handles to view your stats here.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading skeleton (initial load only) ──
  if (status === 'loading' && !stats) return <LeetCodeSkeleton />;

  // ── Error / Not-found state (when no cached data exists) ──
  if ((status === 'error' || status === 'not_found') && !stats) {
    return (
      <div
        className={`w-full rounded-[22px] p-6 sm:p-7 flex flex-col items-center justify-center gap-3 text-center ${className}`}
        style={{
          background: 'var(--surface)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
          minHeight: 200,
        }}
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255, 59, 48, 0.08)' }}
        >
          <AlertCircle size={18} style={{ color: 'var(--destructive)' }} />
        </div>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--label-primary)' }}>
            {status === 'not_found' ? 'Username not found' : 'Failed to load stats'}
          </p>
          <p className="text-[11px] mt-0.5 max-w-[220px] mx-auto leading-relaxed" style={{ color: 'var(--label-secondary)' }}>
            {error}
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3.5 py-1.5 rounded-full transition-colors cursor-pointer disabled:opacity-50"
          style={{
            background: 'var(--canvas)',
            color: 'var(--accent)',
            border: '1px solid var(--separator)',
          }}
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
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        exit={{ opacity: 0, y: 8 }}
        transition={EASE}
        whileHover={{ scale: 1.01, transition: SPRING }}
        whileTap={{ scale: 0.99, transition: SPRING }}
        className={`w-full rounded-[22px] p-6 sm:p-7 cursor-default select-none ${className}`}
        style={{
          background: 'var(--surface)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03)',
        }}
        aria-label={`LeetCode stats for ${displayHandle}`}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            {/* LeetCode logo mark */}
            <div
              className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255, 161, 22, 0.10)' }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.355 5.355 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"
                  fill="#FFA116"
                />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p
                  className="text-[13.5px] font-semibold tracking-tight leading-tight"
                  style={{ color: 'var(--label-primary)', letterSpacing: '-0.015em' }}
                >
                  LeetCode
                </p>
                {stats?.badgesCount && stats.badgesCount > 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Award size={10} />
                    {stats.badgesCount}
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--label-tertiary)' }}>
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
              className="flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1 transition-colors shrink-0"
              style={{
                color: 'var(--label-secondary)',
                background: 'var(--canvas)',
                border: '1px solid var(--separator)',
              }}
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
          <div
            className="text-[3.2rem] sm:text-[3.6rem] font-bold leading-none tracking-tighter tabular-nums"
            style={{ color: 'var(--label-primary)', letterSpacing: '-0.04em' }}
          >
            {inView && stats ? (
              <CountUp value={stats.totalSolved} />
            ) : (
              <span>0</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <p className="text-[12px]" style={{ color: 'var(--label-secondary)' }}>
              problems solved{' '}
              <span style={{ color: 'var(--label-tertiary)' }}>
                / {stats?.totalQuestions ?? 0} total
              </span>
            </p>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
            >
              {solveRate}%
            </span>

            {/* Total Active Days chip */}
            {stats?.totalActiveDays && stats.totalActiveDays > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Flame size={10} className="text-orange-500 fill-orange-500" />
                <span>{stats.totalActiveDays} days active</span>
              </span>
            ) : null}
          </div>
        </motion.div>

        {/* ── Difficulty Breakdown ── */}
        <div className="space-y-3.5 mb-5 sm:mb-6">
          {DIFFICULTY.map((d, i) => (
            <DifficultyRow
              key={d.key}
              label={d.label}
              solved={(stats?.[d.solvedKey] as number) ?? 0}
              total={(stats?.[d.totalKey] as number) ?? 0}
              fill={d.fill}
              track={d.track}
              textColor={d.text}
              dot={d.dot}
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
          className="pt-4 grid grid-cols-3 gap-2 items-center"
          style={{ borderTop: '1px solid var(--separator)' }}
        >
          {/* Global Rank */}
          <div>
            <div className="flex items-center gap-1">
              <Trophy size={11} style={{ color: 'var(--label-tertiary)' }} />
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.07em]"
                style={{ color: 'var(--label-tertiary)' }}
              >
                Global Rank
              </p>
            </div>
            <p
              className="text-[14px] sm:text-[15px] font-bold font-mono tabular-nums mt-0.5 truncate"
              style={{ color: 'var(--label-primary)', letterSpacing: '-0.02em' }}
            >
              {stats?.ranking ? `#${stats.ranking.toLocaleString()}` : '—'}
            </p>
          </div>

          {/* Acceptance Rate */}
          <div className="text-center">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.07em]"
              style={{ color: 'var(--label-tertiary)' }}
            >
              Acceptance
            </p>
            <p
              className="text-[14px] sm:text-[15px] font-bold font-mono tabular-nums mt-0.5"
              style={{ color: 'var(--label-primary)', letterSpacing: '-0.02em' }}
            >
              {stats?.acceptanceRate !== undefined && stats.acceptanceRate > 0
                ? `${stats.acceptanceRate.toFixed(1)}%`
                : '—'}
            </p>
          </div>

          {/* Contribution Points / Reputation & Refetch */}
          <div className="flex items-center justify-end gap-2 text-right">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.07em]"
                style={{ color: 'var(--label-tertiary)' }}
              >
                Points
              </p>
              <p
                className="text-[14px] sm:text-[15px] font-bold font-mono tabular-nums mt-0.5"
                style={{ color: 'var(--label-primary)', letterSpacing: '-0.02em' }}
              >
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
              className="flex items-center justify-center w-7 h-7 rounded-full transition-colors cursor-pointer shrink-0 ml-1 disabled:opacity-50 hover:bg-canvas"
              style={{
                background: 'var(--canvas)',
                color: 'var(--label-tertiary)',
                border: '1px solid var(--separator)',
              }}
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
      </motion.div>
    </AnimatePresence>
  );
};

export default LeetCodeCard;
