import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

// ── Types ────────────────────────────────────────────────────────────────────

export interface GitHubStats {
  username: string;
  name: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  bio?: string | null;
  location?: string | null;
  company?: string | null;
  blog?: string | null;
}

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error' | 'not_found';

export interface UseGitHubStatsReturn {
  stats: GitHubStats | null;
  status: FetchStatus;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

// ── In-Memory Cache (10 minutes TTL on client) ──────────────────────────────
const cache = new Map<string, { data: GitHubStats; ts: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Normalizes GitHub handle by stripping URL prefixes, @, and trailing slashes.
 */
export function normalizeGitHubHandle(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^https?:\/\/(?:www\.)?github\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '')
    .trim();
}

/**
 * useGitHubStats
 *
 * Fetches public GitHub user stats via our Fastify backend proxy
 * (`/api/stats/github/:username`) with server-side 1-hour caching
 * and client-side 10-minute caching.
 */
export function useGitHubStats(
  username: string | undefined | null
): UseGitHubStatsReturn {
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTick, setFetchTick] = useState(0);

  const refetch = useCallback(() => {
    const handle = normalizeGitHubHandle(username);
    if (handle) {
      cache.delete(handle.toLowerCase());
    }
    setFetchTick((t) => t + 1);
  }, [username]);

  useEffect(() => {
    const handle = normalizeGitHubHandle(username);

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
      .get<{ success: boolean; data: GitHubStats }>(
        `/stats/github/${encodeURIComponent(handle)}`,
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
          setError('GitHub request timed out. Please try again.');
          return;
        }

        if (err?.response?.status === 404) {
          setStatus('not_found');
          setError(`No GitHub user found for "${handle}".`);
          setStats(null);
          return;
        }

        const msg =
          err?.response?.data?.error ||
          err?.message ||
          'Unable to fetch GitHub statistics.';

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

export default useGitHubStats;
