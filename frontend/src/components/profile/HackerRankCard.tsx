import React, { useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Award,
  Star,
  Users,
  CheckCircle2,
} from 'lucide-react';
import {
  useHackerRankStats,
  normalizeHackerRankHandle,
  type HackerRankBadge,
} from '../../hooks/useHackerRankStats';
import CountUp from '../ui/CountUp';

const SPRING = { type: 'spring', stiffness: 260, damping: 30 } as const;
const EASE = { duration: 0.22, ease: [0.16, 1, 0.3, 1] } as const;

// ── Skeleton Loader ──────────────────────────────────────────────────────────

const HackerRankSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`w-full h-full min-h-[380px] rounded-[22px] p-6 sm:p-7 flex flex-col justify-between overflow-hidden ${className}`}
    style={{
      background: 'var(--surface)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
    }}
    aria-busy="true"
    aria-label="Loading HackerRank stats"
  >
    {/* Header row */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl skeleton-calm" />
        <div className="space-y-2">
          <div className="w-28 h-3.5 rounded-full skeleton-calm" />
          <div className="w-16 h-2.5 rounded-full skeleton-calm opacity-60" />
        </div>
      </div>
      <div className="w-20 h-6 rounded-full skeleton-calm opacity-40" />
    </div>

    {/* Hero metric */}
    <div className="mb-6">
      <div className="w-32 h-14 rounded-xl skeleton-calm mb-2" />
      <div className="w-24 h-3 rounded-full skeleton-calm opacity-50" />
    </div>

    {/* Badges preview */}
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full skeleton-calm" />
            <div className="w-24 h-3 rounded-full skeleton-calm" />
          </div>
          <div className="w-16 h-3 rounded-full skeleton-calm opacity-60" />
        </div>
      ))}
    </div>
  </div>
);

// ── Badge Item Row ───────────────────────────────────────────────────────────

interface BadgeRowProps {
  badge: HackerRankBadge;
  index: number;
  inView: boolean;
}

const BadgeRow: React.FC<BadgeRowProps> = ({ badge, index, inView }) => {
  const maxStars = Math.max(badge.totalStars || 5, badge.stars);

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
      transition={{ ...EASE, delay: 0.12 + index * 0.05 }}
      className="flex items-center justify-between py-2 px-3 rounded-xl transition-colors hover:bg-canvas/50"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: '#00EA64' }}
        />
        <div className="truncate">
          <p
            className="text-[12.5px] font-medium leading-tight truncate"
            style={{ color: 'var(--label-primary)' }}
          >
            {badge.badgeName}
          </p>
          <p
            className="text-[10px] mt-0.5"
            style={{ color: 'var(--label-tertiary)' }}
          >
            {badge.solved} solved
          </p>
        </div>
      </div>

      {/* Star rating indicators */}
      <div className="flex items-center gap-1 shrink-0 ml-3">
        {Array.from({ length: maxStars }).map((_, i) => {
          const isFilled = i < badge.stars;
          return (
            <Star
              key={i}
              size={11}
              className={
                isFilled
                  ? 'fill-[#00EA64] text-[#00EA64]'
                  : 'text-separator fill-transparent'
              }
              strokeWidth={1.5}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

interface HackerRankCardProps {
  /** Raw handle or URL from profile.socialLinks.hackerrank */
  username: string | undefined | null;
  className?: string;
}

export const HackerRankCard: React.FC<HackerRankCardProps> = ({
  username,
  className = '',
}) => {
  const { stats, status, isFetching, error, refetch } =
    useHackerRankStats(username);

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-48px 0px' });

  const displayHandle = normalizeHackerRankHandle(username);

  // ── Empty State ──
  if (!username) {
    return (
      <div
        className={`w-full h-full min-h-[380px] rounded-[22px] p-6 sm:p-7 flex flex-col items-center justify-center gap-3 text-center ${className}`}
        style={{
          background: 'var(--surface)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--canvas)' }}
        >
          <Award size={20} style={{ color: 'var(--label-tertiary)' }} />
        </div>
        <div>
          <p
            className="text-[13px] font-semibold"
            style={{ color: 'var(--label-primary)' }}
          >
            No HackerRank username
          </p>
          <p
            className="text-[12px] mt-0.5"
            style={{ color: 'var(--label-secondary)' }}
          >
            Add your handle in Profiles &amp; Handles to view your achievements.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading Skeleton ──
  if (status === 'loading' && !stats) return <HackerRankSkeleton className={className} />;

  // ── Error / Not Found State ──
  if ((status === 'error' || status === 'not_found') && !stats) {
    return (
      <div
        className={`w-full h-full min-h-[380px] rounded-[22px] p-6 sm:p-7 flex flex-col items-center justify-center gap-3 text-center ${className}`}
        style={{
          background: 'var(--surface)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255, 59, 48, 0.08)' }}
        >
          <AlertCircle size={18} style={{ color: 'var(--destructive)' }} />
        </div>
        <div>
          <p
            className="text-[13px] font-semibold"
            style={{ color: 'var(--label-primary)' }}
          >
            {status === 'not_found'
              ? 'Username not found'
              : 'Failed to load stats'}
          </p>
          <p
            className="text-[11px] mt-0.5 max-w-[220px] mx-auto leading-relaxed"
            style={{ color: 'var(--label-secondary)' }}
          >
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
        className={`w-full h-full min-h-[380px] flex flex-col justify-between rounded-[22px] p-6 sm:p-7 cursor-default select-none ${className}`}
        style={{
          background: 'var(--surface)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03)',
        }}
        aria-label={`HackerRank stats for ${displayHandle}`}
      >
        {/* ── Top Section (Header + Hero) ── */}
        <div>
          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            {/* HackerRank Icon with signature green accent container */}
            <div
              className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 relative"
              style={{ background: 'rgba(0, 234, 100, 0.10)' }}
            >
              {/* Minimal HackerRank 'H' icon */}
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M4 3h4.5v7h7V3H20v18h-4.5v-7h-7v7H4V3z"
                  fill="#00EA64"
                />
              </svg>
              {/* Subtle pulsing live indicator */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00EA64] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00EA64]" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p
                  className="text-[13.5px] font-semibold tracking-tight leading-tight"
                  style={{
                    color: 'var(--label-primary)',
                    letterSpacing: '-0.015em',
                  }}
                >
                  HackerRank
                </p>
                {stats?.level ? (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(0, 234, 100, 0.12)',
                      color: '#00BA50',
                    }}
                  >
                    Level {stats.level}
                  </span>
                ) : null}
              </div>
              <p
                className="text-[11px] font-mono mt-0.5"
                style={{ color: 'var(--label-tertiary)' }}
              >
                @{displayHandle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* External link to HackerRank profile */}
            <a
              href={`https://www.hackerrank.com/profile/${displayHandle}`}
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

        {/* ── Hero: Macro-Typography Badges / Stars Metric ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ ...EASE, delay: 0.06 }}
          className="mb-5 sm:mb-6"
        >
          <div
            className="text-[3.2rem] sm:text-[3.6rem] font-bold leading-none tracking-tighter tabular-nums"
            style={{
              color: 'var(--label-primary)',
              letterSpacing: '-0.04em',
            }}
          >
            {inView && stats ? (
              <CountUp value={stats.totalBadges} />
            ) : (
              <span>0</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <p
              className="text-[12px]"
              style={{ color: 'var(--label-secondary)' }}
            >
              badges earned{' '}
              <span style={{ color: 'var(--label-tertiary)' }}>
                ({stats?.totalStars ?? 0} total stars)
              </span>
            </p>

            {/* Total solved problems badge */}
            {stats?.totalSolved && stats.totalSolved > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={10} className="text-[#00EA64]" />
                <span>{stats.totalSolved} solved</span>
              </span>
            ) : null}
          </div>
        </motion.div>
        </div>

        {/* ── Badges Breakdown (Middle Section) ── */}
        <div className="my-auto py-2 space-y-1 border-t border-separator/40 pt-3">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.07em] mb-2 px-1"
            style={{ color: 'var(--label-tertiary)' }}
          >
            Skill Certifications &amp; Domains
          </p>
          {stats?.badges && stats.badges.length > 0 ? (
            stats.badges.slice(0, 3).map((b, idx) => (
              <BadgeRow
                key={b.badgeName + idx}
                badge={b}
                index={idx}
                inView={inView}
              />
            ))
          ) : (
            <div
              className="px-2.5 py-2 rounded-xl bg-canvas/40 text-[11.5px]"
              style={{ color: 'var(--label-tertiary)' }}
            >
              No skill certifications earned yet
            </div>
          )}
        </div>

        {/* ── Footer Bento Metric Strip ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ ...EASE, delay: 0.35 }}
          className="pt-4 grid grid-cols-3 gap-2 items-center mt-auto"
          style={{ borderTop: '1px solid var(--separator)' }}
        >
          {/* Level */}
          <div>
            <div className="flex items-center gap-1">
              <Award size={11} style={{ color: 'var(--label-tertiary)' }} />
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.07em]"
                style={{ color: 'var(--label-tertiary)' }}
              >
                Level
              </p>
            </div>
            <p
              className="text-[14px] sm:text-[15px] font-bold font-mono tabular-nums mt-0.5 truncate"
              style={{
                color: 'var(--label-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {stats?.level ? `Lvl ${stats.level}` : 'Level 1'}
            </p>
          </div>

          {/* Stars */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star size={11} style={{ color: 'var(--label-tertiary)' }} />
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.07em]"
                style={{ color: 'var(--label-tertiary)' }}
              >
                Stars
              </p>
            </div>
            <p
              className="text-[14px] sm:text-[15px] font-bold font-mono tabular-nums mt-0.5"
              style={{
                color: 'var(--label-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {stats?.totalStars ?? 0} ★
            </p>
          </div>

          {/* Followers & Refetch */}
          <div className="flex items-center justify-end gap-2 text-right">
            <div>
              <div className="flex items-center justify-end gap-1">
                <Users size={11} style={{ color: 'var(--label-tertiary)' }} />
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.07em]"
                  style={{ color: 'var(--label-tertiary)' }}
                >
                  Followers
                </p>
              </div>
              <p
                className="text-[14px] sm:text-[15px] font-bold font-mono tabular-nums mt-0.5"
                style={{
                  color: 'var(--label-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {stats?.followers_count ?? 0}
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
              title="Refresh HackerRank stats"
              aria-label="Refresh HackerRank stats"
            >
              <RefreshCw
                size={12}
                strokeWidth={2}
                className={isFetching ? 'animate-spin text-[#00EA64]' : ''}
              />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HackerRankCard;
