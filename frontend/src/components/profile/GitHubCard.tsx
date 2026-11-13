import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  ExternalLink,
  RefreshCw,
  AlertCircle,
  FolderGit2,
  Users,
  UserCheck,
  MapPin,
  Building,
  Globe,
} from 'lucide-react';
import { GitHubBrandIcon } from '../ui/Icon';
import {
  useGitHubStats,
  normalizeGitHubHandle,
} from '../../hooks/useGitHubStats';
import CountUp from '../ui/CountUp';
import { EmilCard, EmilTooltipGroup } from '../ui/emil-ui';
import { Link } from '@heroui/react';

const EASE = { duration: 0.22, ease: [0.16, 1, 0.3, 1] } as const;

// ── Skeleton Loader ──────────────────────────────────────────────────────────

const GitHubSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`w-full h-full min-h-[380px] rounded-[22px] p-6 sm:p-7 flex flex-col justify-between overflow-hidden bg-surface border border-separator shadow-sm ${className}`}
    aria-busy="true"
    aria-label="Loading GitHub stats"
  >
    {/* Top container */}
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl skeleton-calm" />
          <div className="space-y-2">
            <div className="w-24 h-3.5 rounded-full skeleton-calm" />
            <div className="w-16 h-2.5 rounded-full skeleton-calm opacity-60" />
          </div>
        </div>
        <div className="w-9 h-9 rounded-full skeleton-calm" />
      </div>

      <div className="mb-6">
        <div className="w-28 h-14 rounded-xl skeleton-calm mb-2" />
        <div className="w-36 h-3 rounded-full skeleton-calm opacity-50" />
      </div>
    </div>

    {/* Middle details skeleton */}
    <div className="space-y-2.5 my-4">
      <div className="w-full h-8 rounded-xl skeleton-calm opacity-50" />
      <div className="w-3/4 h-8 rounded-xl skeleton-calm opacity-40" />
    </div>

    {/* Footer metrics */}
    <div className="flex items-center justify-between pt-4 border-t border-separator mt-auto">
      <div className="w-16 h-4 rounded-full skeleton-calm opacity-60" />
      <div className="w-16 h-4 rounded-full skeleton-calm opacity-60" />
      <div className="w-7 h-7 rounded-full skeleton-calm opacity-40" />
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

interface GitHubCardProps {
  /** Raw handle or URL from profile.socialLinks.github */
  username: string | undefined | null;
  className?: string;
}

export const GitHubCard: React.FC<GitHubCardProps> = ({
  username,
  className = '',
}) => {
  const { stats, status, isFetching, error, refetch } = useGitHubStats(username);

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-48px 0px' });

  const displayHandle = normalizeGitHubHandle(username);

  // ── Empty State ──
  if (!username) {
    return (
      <div
        className={`w-full h-full min-h-[380px] rounded-[22px] p-6 sm:p-7 flex flex-col items-center justify-center gap-3 text-center bg-surface border border-separator shadow-sm ${className}`}
      >
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-canvas">
          <FolderGit2 size={20} className="text-label-tertiary" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-label-primary">
            No GitHub username
          </p>
          <p className="text-[12px] mt-0.5 text-label-secondary">
            Add your handle in Profiles &amp; Handles to view your repository stats.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading Skeleton ──
  if (status === 'loading' && !stats) return <GitHubSkeleton className={className} />;

  // ── Error / Not Found State ──
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
            {status === 'not_found'
              ? 'Username not found'
              : 'Failed to load stats'}
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

  return (
    <EmilTooltipGroup>
      <EmilCard
        ref={ref}
        isHoverable
        className={`w-full h-full min-h-[380px] flex flex-col justify-between rounded-[22px] p-6 sm:p-7 cursor-default select-none border border-separator bg-surface shadow-sm ${className}`}
        aria-label={`GitHub stats for ${displayHandle}`}
      >
        {/* ── Top Section (Header + Hero) ── */}
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 bg-canvas border border-separator">
                <GitHubBrandIcon size={18} className="text-label-primary" />
              </div>

              <div>
                <p className="text-[13.5px] font-semibold tracking-tight leading-tight text-label-primary">
                  GitHub
                </p>
                <p className="text-[11px] font-mono mt-0.5 text-label-tertiary">
                  @{displayHandle}
                </p>
              </div>
            </div>

            {/* Top Right: User's circular avatar + external profile link */}
            <div className="flex items-center gap-2.5">
              {stats?.avatar_url ? (
                <img
                  src={stats.avatar_url}
                  alt={displayHandle}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-separator shrink-0"
                />
              ) : null}

              <Link
                target="_blank" rel="noopener noreferrer"
                href={`https://github.com/${displayHandle}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1 transition-colors duration-150 ease-out shrink-0 text-label-secondary bg-canvas border border-separator hover:text-label-primary hover:bg-surface-secondary"
              >
                <ExternalLink size={10} strokeWidth={2} />
                <span>Profile</span>
              </Link>
            </div>
          </div>

          {/* Hero: Public Repositories */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ ...EASE, delay: 0.06 }}
            className="mb-4"
          >
            <div className="text-[3.2rem] sm:text-[3.6rem] font-bold leading-none tracking-tighter tabular-nums text-label-primary">
              {inView && stats ? (
                <CountUp value={stats.public_repos} />
              ) : (
                <span>0</span>
              )}
            </div>

            <p className="text-[12px] font-medium mt-1.5 text-label-secondary">
              Public Repositories
            </p>
          </motion.div>
        </div>

        {/* ── Middle Breakdown / Details Section ── */}
        <div className="my-auto py-2 space-y-2 border-t border-separator">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] px-1 text-label-tertiary">
            Developer Highlights
          </p>

          {stats?.bio ? (
            <p className="text-[11.5px] px-2.5 py-2 rounded-xl bg-canvas text-label-secondary line-clamp-2 leading-relaxed">
              "{stats.bio}"
            </p>
          ) : (
            <div className="px-2.5 py-2 rounded-xl bg-canvas text-label-tertiary text-[11.5px]">
              Open-source contributor &amp; builder
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            {stats?.location ? (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2.5 py-1 rounded-lg bg-canvas text-label-secondary border border-separator">
                <MapPin size={10} className="text-label-tertiary" />
                <span>{stats.location}</span>
              </span>
            ) : null}

            {stats?.company ? (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2.5 py-1 rounded-lg bg-canvas text-label-secondary border border-separator">
                <Building size={10} className="text-label-tertiary" />
                <span>{stats.company}</span>
              </span>
            ) : null}

            {stats?.blog ? (
              <Link
                target="_blank" rel="noopener noreferrer"
                href={stats.blog.startsWith('http') ? stats.blog : `https://${stats.blog}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2.5 py-1 rounded-lg transition-colors duration-150 ease-out bg-canvas text-label-secondary border border-separator hover:text-accent hover:border-accent"
              >
                <Globe size={10} className="text-label-tertiary" />
                <span className="truncate max-w-[140px]">{stats.blog.replace(/^https?:\/\//, '')}</span>
              </Link>
            ) : null}
          </div>
        </div>

        {/* ── Footer: Followers & Following ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ ...EASE, delay: 0.35 }}
          className="pt-4 grid grid-cols-3 gap-2 items-center mt-auto border-t border-separator"
        >
          {/* Followers */}
          <div>
            <div className="flex items-center gap-1">
              <Users size={11} className="text-label-tertiary" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-label-tertiary">
                Followers
              </p>
            </div>
            <p className="text-[14px] sm:text-[15px] font-bold font-mono tabular-nums mt-0.5 text-label-primary tracking-tight">
              {stats?.followers ? stats.followers.toLocaleString() : '0'}
            </p>
          </div>

          {/* Following */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <UserCheck size={11} className="text-label-tertiary" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-label-tertiary">
                Following
              </p>
            </div>
            <p className="text-[14px] sm:text-[15px] font-bold font-mono tabular-nums mt-0.5 text-label-primary tracking-tight">
              {stats?.following ? stats.following.toLocaleString() : '0'}
            </p>
          </div>

          {/* Refresh Action */}
          <div className="flex items-center justify-end">
            <button
              onClick={refetch}
              disabled={isFetching}
              className="flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-150 ease-out cursor-pointer shrink-0 disabled:opacity-50 bg-canvas text-label-tertiary border border-separator hover:text-label-primary hover:bg-surface-secondary"
              title="Refresh GitHub stats"
              aria-label="Refresh GitHub stats"
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

export default GitHubCard;
