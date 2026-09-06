import mongoose from 'mongoose';
import User from '../models/userModel';

// Safe model retrieval to prevent OverwriteModelError across CJS/TS boundaries
const getEventModel = () => {
  return mongoose.models.Event || require('../models/eventModel');
};

const getProblemModel = () => {
  return mongoose.models.Problem || require('../models/problemModel');
};

const getQuizModel = () => {
  return mongoose.models.Quiz || require('../models/quizModel');
};

export interface DashboardMetrics {
  totalUsers: number;
  activeEvents: number;
  totalEvents: number;
  totalAssessmentLevels: number;
  details?: {
    activeStudents: number;
    facultyCount: number;
    assessmentDifficulties: string[];
    quizzesAvailable: number;
  };
}

interface CacheEntry {
  data: DashboardMetrics;
  timestamp: number;
}

const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache TTL for scalable high-load performance
let metricsCache: CacheEntry | null = null;

/**
 * Scalable metrics aggregation service.
 * Employs index-backed concurrent queries and an in-memory TTL cache to support
 * rapid dashboard requests without degrading MongoDB throughput.
 */
export const getDashboardMetrics = async (options: { refresh?: boolean } = {}): Promise<{
  metrics: DashboardMetrics;
  isCached: boolean;
  cachedAt: string;
}> => {
  const now = Date.now();

  // Return cached entry if valid and refresh not explicitly requested
  if (!options.refresh && metricsCache && now - metricsCache.timestamp < CACHE_TTL_MS) {
    return {
      metrics: metricsCache.data,
      isCached: true,
      cachedAt: new Date(metricsCache.timestamp).toISOString(),
    };
  }

  const Event = getEventModel();
  const Problem = getProblemModel();
  const Quiz = getQuizModel();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Execute all aggregations concurrently using MongoDB indexes
  const [
    totalUsers,
    activeStudents,
    facultyCount,
    activeEvents,
    totalEvents,
    problemDifficulties,
    quizzesCount,
  ] = await Promise.all([
    // 1. Total active non-blocked users
    User.countDocuments({ isBlocked: { $ne: true } }).exec(),

    // Extra breakdown: students vs faculty
    User.countDocuments({ role: { $in: ['Student', 'Member'] }, isBlocked: { $ne: true } }).exec(),
    User.countDocuments({ role: { $in: ['Faculty', 'Committee'] }, isBlocked: { $ne: true } }).exec(),

    // 2. Active Events (date >= start of today)
    Event.countDocuments({ date: { $gte: todayStart } }).exec(),

    // 3. Total Events (lifetime events catalog)
    Event.countDocuments({}).exec(),

    // 4. Distinct problem difficulty levels available
    Problem.distinct('difficulty').exec().catch(() => []),

    // Quizzes available
    Quiz.countDocuments({}).exec().catch(() => 0),
  ]);

  // Determine available assessment levels:
  // Standard coding tracks comprise: Easy, Medium, Hard (3 default tiers).
  // If distinct difficulties are populated in DB, count those; fallback/ensure baseline 3 tiers.
  const difficulties: string[] = (problemDifficulties && problemDifficulties.length > 0)
    ? problemDifficulties
    : ['Easy', 'Medium', 'Hard'];

  const totalAssessmentLevels = Math.max(difficulties.length, 3) + (quizzesCount > 0 ? 1 : 0);

  const metricsData: DashboardMetrics = {
    totalUsers,
    activeEvents,
    totalEvents,
    totalAssessmentLevels,
    details: {
      activeStudents,
      facultyCount,
      assessmentDifficulties: difficulties,
      quizzesAvailable: quizzesCount,
    },
  };

  // Update in-memory cache
  metricsCache = {
    data: metricsData,
    timestamp: now,
  };

  return {
    metrics: metricsData,
    isCached: false,
    cachedAt: new Date(now).toISOString(),
  };
};

/**
 * Invalidate metrics cache when events, users, or assessments are mutated.
 */
export const invalidateMetricsCache = (): void => {
  metricsCache = null;
};
