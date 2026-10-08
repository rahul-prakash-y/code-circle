import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Award,
  CheckCircle2,
  Code2,
  UserCheck,
  TrendingUp,
  Github,
  Trophy,
  Compass,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
  AlertCircle,
  Loader2,
  XCircle,
  HelpCircle,
  Clock,
} from 'lucide-react';
import api from '@/lib/axios';
import { useGitHubStats, normalizeGitHubHandle } from '@/hooks/useGitHubStats';
import { useLeetCodeStats } from '@/hooks/useLeetCodeStats';

const normalizeLeetCodeUsername = (raw?: string | null): string => {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^https?:\/\/(?:www\.)?leetcode\.com\/(?:u\/)?/i, '')
    .replace(/^@/, '')
    .replace(/\/.*$/, '')
    .trim();
};

interface Student360ProfileProps {
  userId: string;
  onClose?: () => void;
}

interface DomainProgressItem {
  id: string;
  name: string;
  description: string;
  coverImageUrl?: string;
  totalLevels: number;
  completedLevels: number;
  progressPercent: number;
  isUnlocked: boolean;
}

interface TimelineItem {
  id: string;
  category: 'attendance' | 'assessment' | 'coding' | 'quest' | 'onboarding';
  title: string;
  subtitle: string;
  timestamp: string;
  status: string;
  semanticColor: 'green' | 'gray' | 'blue' | 'red' | 'amber';
  meta?: Record<string, any>;
}

interface Student360Data {
  student: {
    _id: string;
    name: string;
    rollNo: string;
    email: string;
    role: string;
    department: string;
    college: string;
    year: string;
    points: number;
    skills: string[];
    socialLinks: {
      github?: string;
      leetcode?: string;
      hackerrank?: string;
      linkedin?: string;
    };
    profilePicUrl?: string;
    isOnboarded: boolean;
    isBlocked: boolean;
    createdAt: string;
  };
  stats: {
    rank: number;
    totalStudents: number;
    totalEventsAttended: number;
    questsCompleted: number;
    codingChallengesSolved: number;
    averageAssessmentScore: number;
  };
  domainProgress: DomainProgressItem[];
  attendanceRecords: any[];
  codingResults: any[];
  assessmentResults: any[];
  activityTimeline: TimelineItem[];
}

export const Student360Profile: React.FC<Student360ProfileProps> = ({ userId, onClose }) => {
  const [data, setData] = useState<Student360Data | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetch360 = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/admin/tracking/students/${userId}`);
        if (isMounted) {
          setData(res.data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to load 360 profile:', err);
          setError(err.response?.data?.error || 'Failed to load student profile');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (userId) {
      fetch360();
    }
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // GitHub & LeetCode stats hooks
  const githubUser = normalizeGitHubHandle(data?.student?.socialLinks?.github);
  const leetcodeUser = normalizeLeetCodeUsername(data?.student?.socialLinks?.leetcode);

  const { stats: ghStats, isFetching: ghLoading } = useGitHubStats(githubUser);
  const { stats: lcStats, isFetching: lcLoading } = useLeetCodeStats(leetcodeUser);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 tracking-tight">
          Loading Student 360 Profile...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Unable to Load Profile
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
          {error || 'Student data could not be retrieved from the server.'}
        </p>
      </div>
    );
  }

  const { student, stats, domainProgress, activityTimeline } = data;

  // Timeline node style helper
  const getNodeColor = (color: TimelineItem['semanticColor']) => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
          text: 'text-emerald-600 dark:text-emerald-400',
          ring: 'ring-emerald-500/30',
          dot: 'bg-emerald-500',
        };
      case 'blue':
        return {
          bg: 'bg-blue-500/15 dark:bg-blue-500/20',
          text: 'text-blue-600 dark:text-blue-400',
          ring: 'ring-blue-500/30',
          dot: 'bg-blue-500',
        };
      case 'red':
        return {
          bg: 'bg-rose-500/15 dark:bg-rose-500/20',
          text: 'text-rose-600 dark:text-rose-400',
          ring: 'ring-rose-500/30',
          dot: 'bg-rose-500',
        };
      case 'amber':
        return {
          bg: 'bg-amber-500/15 dark:bg-amber-500/20',
          text: 'text-amber-600 dark:text-amber-400',
          ring: 'ring-amber-500/30',
          dot: 'bg-amber-500',
        };
      case 'gray':
      default:
        return {
          bg: 'bg-neutral-500/15 dark:bg-neutral-500/20',
          text: 'text-neutral-600 dark:text-neutral-400',
          ring: 'ring-neutral-500/30',
          dot: 'bg-neutral-400 dark:bg-neutral-500',
        };
    }
  };

  const getTimelineIcon = (category: TimelineItem['category'], status: string) => {
    switch (category) {
      case 'attendance':
        return <Calendar className="w-4 h-4" />;
      case 'assessment':
        return <Award className="w-4 h-4" />;
      case 'coding':
        return <Code2 className="w-4 h-4" />;
      case 'quest':
        return <Compass className="w-4 h-4" />;
      case 'onboarding':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full bg-[#F5F5F7] dark:bg-[#161617] text-neutral-900 dark:text-neutral-100 rounded-3xl p-4 sm:p-6 space-y-8 select-text">
      {/* ── 1. HERO SECTION (Macro-Typography, Rank, Stats) ── */}
      <section className="bg-white/80 dark:bg-[#1E1E1F]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">
                {student.department || 'General'}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {student.year || 'Student'}
              </span>
              {student.isOnboarded ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Onboarded
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Pending Claim
                </span>
              )}
            </div>

            {/* Macro-Typography Student Name */}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {student.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400 font-mono">
              <span>{student.rollNo}</span>
              <span>•</span>
              <span>{student.email}</span>
            </div>
          </div>

          {/* Macro Club Rank / Status */}
          <div className="shrink-0 bg-[#F5F5F7] dark:bg-[#161617] rounded-2xl p-5 sm:p-6 text-center shadow-inner min-w-[150px]">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Club Rank
            </div>
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900 dark:text-white">
              #{stats.rank}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              of {stats.totalStudents} students • {student.points || 0} pts
            </div>
          </div>
        </div>

        {/* ── Key Metrics Macro Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#F5F5F7]/80 dark:bg-[#161617]/80 rounded-2xl p-4 text-center">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
              Events Attended
            </span>
            <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {stats.totalEventsAttended}
            </span>
          </div>
          <div className="bg-[#F5F5F7]/80 dark:bg-[#161617]/80 rounded-2xl p-4 text-center">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
              Quests Completed
            </span>
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.questsCompleted}
            </span>
          </div>
          <div className="bg-[#F5F5F7]/80 dark:bg-[#161617]/80 rounded-2xl p-4 text-center">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
              Avg Assessment
            </span>
            <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {stats.averageAssessmentScore}%
            </span>
          </div>
          <div className="bg-[#F5F5F7]/80 dark:bg-[#161617]/80 rounded-2xl p-4 text-center">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
              Challenges Solved
            </span>
            <span className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
              {stats.codingChallengesSolved}
            </span>
          </div>
        </div>

        {/* ── Linked Developer Stats (GitHub & LeetCode) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* GitHub Card */}
          <div className="rounded-2xl p-5 bg-[#F5F5F7]/90 dark:bg-[#161617]/90 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Github className="w-4 h-4" />
                <span>GitHub Stats</span>
              </div>
              {student.socialLinks?.github && (
                <a
                  href={`https://github.com/${githubUser}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-medium"
                >
                  @{githubUser}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {githubUser ? (
              ghLoading ? (
                <div className="py-3 flex items-center gap-2 text-xs text-neutral-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching GitHub data...
                </div>
              ) : ghStats ? (
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-white/60 dark:bg-[#202022] rounded-xl py-2">
                    <div className="text-lg font-bold text-neutral-900 dark:text-white">
                      {ghStats.public_repos}
                    </div>
                    <div className="text-[11px] text-neutral-500">Repositories</div>
                  </div>
                  <div className="bg-white/60 dark:bg-[#202022] rounded-xl py-2">
                    <div className="text-lg font-bold text-neutral-900 dark:text-white">
                      {ghStats.followers}
                    </div>
                    <div className="text-[11px] text-neutral-500">Followers</div>
                  </div>
                  <div className="bg-white/60 dark:bg-[#202022] rounded-xl py-2">
                    <div className="text-lg font-bold text-neutral-900 dark:text-white">
                      {ghStats.following}
                    </div>
                    <div className="text-[11px] text-neutral-500">Following</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Username linked ({githubUser}), public data unavailable.
                </p>
              )
            ) : (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 italic py-2">
                GitHub account not linked in student profile.
              </p>
            )}
          </div>

          {/* LeetCode Card */}
          <div className="rounded-2xl p-5 bg-[#F5F5F7]/90 dark:bg-[#161617]/90 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Code2 className="w-4 h-4 text-amber-500" />
                <span>LeetCode Stats</span>
              </div>
              {student.socialLinks?.leetcode && (
                <a
                  href={`https://leetcode.com/${leetcodeUser}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-medium"
                >
                  @{leetcodeUser}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {leetcodeUser ? (
              lcLoading ? (
                <div className="py-3 flex items-center gap-2 text-xs text-neutral-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching LeetCode data...
                </div>
              ) : lcStats ? (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-semibold text-neutral-900 dark:text-white text-base">
                      {lcStats.totalSolved} Solved
                    </span>
                    <span className="text-neutral-500">Rank #{lcStats.ranking?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg py-1 font-medium">
                      Easy: {lcStats.easySolved}
                    </span>
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg py-1 font-medium">
                      Med: {lcStats.mediumSolved}
                    </span>
                    <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg py-1 font-medium">
                      Hard: {lcStats.hardSolved}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Username linked ({leetcodeUser}), metrics unavailable.
                </p>
              )
            ) : (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 italic py-2">
                LeetCode account not linked in student profile.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. PROGRESS SECTION (Minimal Pill-Shaped Bars) ── */}
      <section className="bg-white/80 dark:bg-[#1E1E1F]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              Domain & Curriculum Progress
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Interactive quest track and domain level mastery
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
            {domainProgress.length} Tracks
          </span>
        </div>

        {domainProgress.length === 0 ? (
          <p className="text-xs text-neutral-400 italic">No domain tracks registered yet.</p>
        ) : (
          <div className="space-y-4">
            {domainProgress.map((domain) => (
              <div key={domain.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {domain.name}
                    </span>
                    {!domain.isUnlocked && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
                        Locked
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-neutral-500 dark:text-neutral-400">
                    {domain.completedLevels}/{domain.totalLevels} levels ({domain.progressPercent}%)
                  </span>
                </div>

                {/* Minimal Pill-Shaped Progress Bar */}
                <div className="h-2.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${domain.progressPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 3. ACTIVITY TIMELINE (Unified Chronological Journey) ── */}
      <section className="bg-white/80 dark:bg-[#1E1E1F]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Activity Timeline
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Chronological journey of attendance, quest passes, and coding tests
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
            {activityTimeline.length} Milestones
          </span>
        </div>

        {activityTimeline.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-xs italic">
            No activity milestones recorded for this student yet.
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
            {activityTimeline.map((item, idx) => {
              const colors = getNodeColor(item.semanticColor);
              const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const timeStr = new Date(item.timestamp).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={item.id || idx} className="relative group">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center ${colors.bg} ${colors.text} ring-4 ring-white dark:ring-[#1E1E1F] transition-transform group-hover:scale-110`}
                  >
                    {getTimelineIcon(item.category, item.status)}
                  </div>

                  {/* Timeline Item Content Card */}
                  <div className="bg-[#F5F5F7]/80 dark:bg-[#161617]/80 rounded-2xl p-4 sm:p-5 transition-shadow hover:shadow-md space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
                        >
                          {item.status}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                          {item.title}
                        </h4>
                      </div>
                      <time className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateStr} • {timeStr}
                      </time>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {item.subtitle}
                    </p>

                    {item.meta && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        {item.meta.points !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                            +{item.meta.points} Points
                          </span>
                        )}
                        {item.meta.percentage !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                            Score: {item.meta.percentage}%
                          </span>
                        )}
                        {item.meta.session && (
                          <span className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-500 font-medium">
                            {item.meta.session}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Student360Profile;
