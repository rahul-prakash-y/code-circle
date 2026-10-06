import { FastifyRequest, FastifyReply } from 'fastify';

// ── In-Memory Cache (5 minutes TTL) ──────────────────────────────────────────
interface CacheEntry {
  data: HackerRankStatsData;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface HackerRankBadge {
  badgeName: string;
  badgeType?: string;
  stars: number;
  totalStars: number;
  solved: number;
  level?: number;
  url?: string;
}

export interface HackerRankStatsData {
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

interface HackerRankParams {
  username: string;
}

/**
 * Normalizes HackerRank username by stripping URLs and special characters.
 */
function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(?:www\.)?hackerrank\.com\/(?:profile\/)?/i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '')
    .trim();
}

/**
 * Controller: GET /api/stats/hackerrank/:username
 *
 * Proxies public HackerRank stats to bypass client-side CORS.
 * Extracts: name, level, followers_count, totalBadges, totalStars, and badge breakdown.
 */
export const getHackerRankStats = async (
  request: FastifyRequest<{ Params: HackerRankParams }>,
  reply: FastifyReply
) => {
  const { username } = request.params;
  const cleanUsername = normalizeUsername(username || '');

  if (!cleanUsername) {
    return reply.status(400).send({
      success: false,
      error: 'A valid HackerRank username is required.',
    });
  }

  const cacheKey = cleanUsername.toLowerCase();
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return reply.send({
      success: true,
      data: cached.data,
      cached: true,
    });
  }

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json',
  };

  try {
    // 1. Fetch user profile model
    // HackerRank provides public hacker details at rest/hackers/{username}
    let profileRes = await fetch(
      `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(cleanUsername)}`,
      { headers }
    );

    // Fallback to /profile suffix if necessary
    if (!profileRes.ok && profileRes.status === 404) {
      profileRes = await fetch(
        `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(cleanUsername)}/profile`,
        { headers }
      );
    }

    if (profileRes.status === 404) {
      return reply.status(404).send({
        success: false,
        error: `HackerRank user "${cleanUsername}" not found.`,
      });
    }

    if (!profileRes.ok) {
      return reply.status(profileRes.status).send({
        success: false,
        error: `HackerRank API returned status ${profileRes.status}.`,
      });
    }

    const profileJson: any = await profileRes.json();
    const model = profileJson?.model || profileJson;

    if (!model || profileJson.error) {
      return reply.status(404).send({
        success: false,
        error: `HackerRank user "${cleanUsername}" not found.`,
      });
    }

    // 2. Fetch badges in parallel
    let badgesModels: any[] = [];
    try {
      const badgesRes = await fetch(
        `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(cleanUsername)}/badges`,
        { headers }
      );

      if (badgesRes.ok) {
        const badgesJson: any = await badgesRes.json();
        badgesModels = Array.isArray(badgesJson?.models) ? badgesJson.models : [];
      }
    } catch {
      // Badges failure is non-fatal; proceed with profile data
      badgesModels = [];
    }

    // 3. Extract and sanitize essential data
    const badges: HackerRankBadge[] = badgesModels.map((b) => ({
      badgeName: b.badge_name || b.badge_short_name || 'Skill',
      badgeType: b.badge_type || '',
      stars: typeof b.stars === 'number' ? b.stars : 0,
      totalStars: typeof b.total_stars === 'number' ? b.total_stars : 5,
      solved: typeof b.solved === 'number' ? b.solved : 0,
      level: typeof b.level === 'number' ? b.level : 1,
      url: b.url ? `https://www.hackerrank.com${b.url}` : undefined,
    }));

    const totalStars = badges.reduce((sum, b) => sum + b.stars, 0);
    const totalSolved = badges.reduce((sum, b) => sum + b.solved, 0);

    const statsData: HackerRankStatsData = {
      username: model.username || cleanUsername,
      name: model.name || model.personal_first_name ? `${model.personal_first_name || ''} ${model.personal_last_name || ''}`.trim() : (model.name || cleanUsername),
      level: typeof model.level === 'number' ? model.level : 1,
      followers_count: typeof model.followers_count === 'number' ? model.followers_count : 0,
      avatar: model.avatar || null,
      country: model.country || null,
      totalBadges: badges.length,
      totalStars,
      totalSolved,
      badges,
    };

    cache.set(cacheKey, {
      data: statsData,
      timestamp: Date.now(),
    });

    return reply.send({
      success: true,
      data: statsData,
    });
  } catch (err: any) {
    request.log.error(err, 'Failed to fetch HackerRank statistics');
    return reply.status(500).send({
      success: false,
      error: 'Failed to communicate with HackerRank server.',
    });
  }
};

// ── GitHub Cache (1 hour TTL) ────────────────────────────────────────────────
export interface GitHubStatsData {
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

interface GitHubCacheEntry {
  data: GitHubStatsData;
  timestamp: number;
}

const githubCache = new Map<string, GitHubCacheEntry>();
const GITHUB_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Normalizes GitHub handle by stripping URL prefixes, @, and trailing slashes.
 */
function normalizeGitHubUsername(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(?:www\.)?github\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '')
    .trim();
}

/**
 * Controller: GET /api/stats/github/:username
 *
 * Fetches public GitHub stats with a 1-hour in-memory cache
 * to preserve GitHub's 60 req/hr unauthenticated rate limit.
 * Extracts: public_repos, followers, following, avatar_url, name, bio.
 */
export const getGitHubStats = async (
  request: FastifyRequest<{ Params: { username: string } }>,
  reply: FastifyReply
) => {
  const { username } = request.params;
  const cleanUsername = normalizeGitHubUsername(username || '');

  if (!cleanUsername) {
    return reply.status(400).send({
      success: false,
      error: 'A valid GitHub username is required.',
    });
  }

  const cacheKey = cleanUsername.toLowerCase();
  const cached = githubCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < GITHUB_CACHE_TTL_MS) {
    return reply.send({
      success: true,
      data: cached.data,
      cached: true,
    });
  }

  const headers: Record<string, string> = {
    'User-Agent': 'code-circle-app',
    Accept: 'application/vnd.github.v3+json',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(cleanUsername)}`,
      { headers }
    );

    if (res.status === 404) {
      return reply.status(404).send({
        success: false,
        error: `GitHub user "${cleanUsername}" not found.`,
      });
    }

    if (res.status === 403 || res.status === 429) {
      return reply.status(429).send({
        success: false,
        error: 'GitHub API rate limit reached. Please try again later.',
      });
    }

    if (!res.ok) {
      return reply.status(res.status).send({
        success: false,
        error: `GitHub API error: status ${res.status}`,
      });
    }

    const data: any = await res.json();

    const statsData: GitHubStatsData = {
      username: data.login || cleanUsername,
      name: data.name || data.login || cleanUsername,
      avatar_url: data.avatar_url || '',
      public_repos: typeof data.public_repos === 'number' ? data.public_repos : 0,
      followers: typeof data.followers === 'number' ? data.followers : 0,
      following: typeof data.following === 'number' ? data.following : 0,
      bio: data.bio || null,
      location: data.location || null,
      company: data.company || null,
      blog: data.blog || null,
    };

    githubCache.set(cacheKey, {
      data: statsData,
      timestamp: Date.now(),
    });

    return reply.send({
      success: true,
      data: statsData,
    });
  } catch (err: any) {
    request.log.error(err, 'Failed to fetch GitHub statistics');
    return reply.status(500).send({
      success: false,
      error: 'Failed to communicate with GitHub API.',
    });
  }
};

