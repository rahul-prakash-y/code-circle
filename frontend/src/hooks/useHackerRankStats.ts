import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

// ── Types ────────────────────────────────────────────────────────────────────

export interface HackerRankBadge {
  badgeName: string;
  badgeType?: string;
  stars: number;
  totalStars: number;
  solved: number;
  level?: number;
  url?: string;
}

export interface HackerRankStats {
  username: string;
  name: string;
  level: number;
  followers_count: number;
  avatar?: string | null;
  country?: string | null;
  totalBadges: number;
  totalStars: number;
  totalSolved: number;
  badges: HackerRankBadge[];
}

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error' | 'not_found';

export interface UseHackerRankStatsReturn {
  stats: HackerRankStats | null;
  status: FetchStatus;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

// ── In-Memory Cache (5 minutes TTL) ──────────────────────────────────────────
const cache = new Map<string, { data: HackerRankStats; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Normalizes HackerRank username or full URL string to a clean handle.
 */
export function normalizeHackerRankHandle(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^https?:\/\/(?:www\.)?hackerrank\.com\/(?:profile\/)?/i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '')
    .trim();
}

/**
 * useHackerRankStats
 *
 * Fetches public HackerRank stats via our Fastify backend proxy
 * (`/api/stats/hackerrank/:username`) which handles CORS and sanitization.
 */
export function useHackerRankStats(
  username: string | undefined | null
): UseHackerRankStatsReturn {
  const [stats, setStats] = useState<HackerRankStats | null>(null);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTick, setFetchTick] = useState(0);

  const refetch = useCallback(() => {
    const handle = normalizeHackerRankHandle(username);
    if (handle) {
      cache.delete(handle.toLowerCase());
    }
    setFetchTick((t) => t + 1);
  }, [username]);

  useEffect(() => {
    const handle = normalizeHackerRankHandle(username);

    if (!handle) {
      setStatus('idle');
      setIsFetching(false);
      setStats(null);
      setError(null);
      return;
    }

    const cacheKey = handle.toLowerCase();
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setStats(cached.data);
      setStatus('success');
      setIsFetching(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setStatus((prev) => (prev === 'success' && stats ? 'success' : 'loading'));
    setIsFetching(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 12_000);

    api
      .get<{ success: boolean; data: HackerRankStats }>(
        `/stats/hackerrank/${encodeURIComponent(handle)}`,
        { signal: controller.signal }
      )
      .then((res) => {
        clearTimeout(timeout);
        if (cancelled) return;

        if (res.data?.success && res.data.data) {
          const data = res.data.data;
          cache.set(cacheKey, { data, ts: Date.now() });
          setStats(data);
          setStatus('success');
          setIsFetching(false);
          setError(null);
        } else {
          setStatus('error');
          setIsFetching(false);
          setError('Unexpected response format.');
          setStats(null);
        }
      })
      .catch((err: any) => {
        clearTimeout(timeout);
        if (cancelled) return;
        setIsFetching(false);

        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') {
          setStatus('error');
          setError('HackerRank request timed out. Please try again.');
          return;
        }

        if (err?.response?.status === 404) {
          setStatus('not_found');
          setError(`No HackerRank profile found for "${handle}".`);
          setStats(null);
          return;
        }

        const msg =
          err?.response?.data?.error ||
          err?.message ||
          'Unable to fetch HackerRank statistics.';

        setStatus('error');
        setError(msg);
        setStats(null);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [username, fetchTick]);

  return {
    stats,
    status,
    isFetching,
    error,
    refetch,
  };
}

export default useHackerRankStats;
