import { useState, useEffect, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface LeetCodeStats {
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  totalEasy: number;
  mediumSolved: number;
  totalMedium: number;
  hardSolved: number;
  totalHard: number;
  ranking: number;
  acceptanceRate: number;
  contributionPoints: number;
  reputation?: number;
  totalActiveDays?: number;
  badgesCount?: number;
}

type FetchStatus = 'idle' | 'loading' | 'success' | 'error' | 'not_found';

export interface UseLeetCodeStatsReturn {
  stats: LeetCodeStats | null;
  status: FetchStatus;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

// ── In-memory cache: prevents redundant network calls within the same session ──
const cache = new Map<string, { data: LeetCodeStats; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useLeetCodeStats
 *
 * Fetches public LeetCode statistics for a given username via the free
 * `leetcode-stats-api.herokuapp.com` REST endpoint.
 *
 * Behaviour:
 *  - Returns `idle` when no username is provided.
 *  - Returns `not_found` when the API reports the user does not exist.
 *  - Caches successful responses for CACHE_TTL_MS to avoid redundant requests.
 */
export function useLeetCodeStats(
  username: string | undefined | null
): UseLeetCodeStatsReturn {
  const [stats, setStats] = useState<LeetCodeStats | null>(null);
  const [status, setStatus] = useState<FetchStatus>("idle");
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTick, setFetchTick] = useState(0);

  const refetch = useCallback(() => {
    if (username) {
      cache.delete(username.trim().toLowerCase());
    }

    setFetchTick((t) => t + 1);
  }, [username]);

  useEffect(() => {
    const raw = username?.trim();

    if (!raw) {
      setStatus("idle");
      setIsFetching(false);
      setStats(null);
      setError(null);
      return;
    }

    // Normalize LeetCode username / URL
    const handle = raw
      .replace(
        /^https?:\/\/(?:www\.)?leetcode\.com\/(?:u\/)?/i,
        ""
      )
      .replace(/\/$/, "")
      .split("/")[0];

    if (!handle) {
      setStatus("idle");
      setIsFetching(false);
      setStats(null);
      return;
    }

    const cacheKey = handle.toLowerCase();

    // Serve cached data if still fresh
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setStats(cached.data);
      setStatus("success");
      setIsFetching(false);
      setError(null);
      return;
    }

    let cancelled = false;

    setStatus((prev) => (prev === "success" && stats ? "success" : "loading"));
    setIsFetching(true);
    setError(null);

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 10_000);

    fetch(`https://leetcode-stats.tashif.codes/${encodeURIComponent(handle)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(timeout);

        if (cancelled) return;

        if (res.status === 404) {
          setStatus("not_found");
          setIsFetching(false);
          setError(`No LeetCode user found for "${handle}".`);
          setStats(null);
          return;
        }

        if (!res.ok) {
          throw new Error(
            `LeetCode API error ${res.status}: ${res.statusText}`
          );
        }

        const json = await res.json();

        if (json.status === "error") {
          setStatus("not_found");
          setIsFetching(false);
          setError(json.message ?? `User "${handle}" not found.`);
          setStats(null);
          return;
        }

        /*
         * Map the API response to your application's
         * LeetCodeStats interface.
         */
        const data: LeetCodeStats = {
          totalSolved: json.totalSolved ?? 0,
          totalQuestions: json.totalQuestions ?? 0,

          easySolved: json.easySolved ?? 0,
          totalEasy: json.totalEasy ?? 0,

          mediumSolved: json.mediumSolved ?? 0,
          totalMedium: json.totalMedium ?? 0,

          hardSolved: json.hardSolved ?? 0,
          totalHard: json.totalHard ?? 0,

          ranking: json.ranking ?? 0,
          acceptanceRate: json.acceptanceRate ?? 0,
          contributionPoints: json.contributionPoints ?? 0,
          reputation: json.reputation ?? 0,
          totalActiveDays: json.data?.totalActiveDays ?? 0,
          badgesCount: json.data?.badgesCount ?? 0,
        };

        cache.set(cacheKey, {
          data,
          ts: Date.now(),
        });

        if (cancelled) return;

        setStats(data);
        setStatus("success");
        setIsFetching(false);
        setError(null);
      })
      .catch((err: unknown) => {
        clearTimeout(timeout);

        if (cancelled) return;
        setIsFetching(false);

        if (err instanceof DOMException && err.name === "AbortError") {
          setStatus("error");
          setError("LeetCode request timed out. Please try again.");
          return;
        }

        const msg =
          err instanceof Error
            ? err.message
            : "Unable to fetch LeetCode statistics.";

        setStatus("error");
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
