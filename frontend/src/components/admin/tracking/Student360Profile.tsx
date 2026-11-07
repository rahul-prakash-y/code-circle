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
  FileText,
  Download,
  ShieldAlert,
  Unlock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useGitHubStats, normalizeGitHubHandle } from '@/hooks/useGitHubStats';
import { useLeetCodeStats } from '@/hooks/useLeetCodeStats';
import { formatISTDate, formatISTTime } from '@/lib/dateUtils';

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
    isRestricted?: boolean;
    restrictionReason?: string;
    restrictedFeatures?: string[];
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
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const handleDownloadPdf = async () => {
    if (!data?.student || isExportingPdf) return;
    try {
      setIsExportingPdf(true);
      const res = await api.get(`/admin/tracking/students/${userId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const safeName = (data.student.rollNo || data.student.name || 'student').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `CodeCircle_Report_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Student PDF report generated successfully!');
    } catch (err: any) {
      console.error('Failed to download student PDF report:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to generate PDF report');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const [isUnblocking, setIsUnblocking] = useState<boolean>(false);

  const handleUnblockRestrictions = async () => {
    if (!data?.student) return;
    if (
      !window.confirm(
        `Are you sure you want to lift all restrictions for ${data.student.name} (${data.student.rollNo})? They will immediately regain access to assessments, contests, and courses.`
      )
    ) {
      return;
    }

    try {
      setIsUnblocking(true);
      const res = await api.post(`/users/${userId}/unblock-restrictions`);
      toast.success(res.data?.message || 'Restrictions removed successfully!');
      setData((prev: any) =>
        prev
          ? {
              ...prev,
              student: {
                ...prev.student,
                isRestricted: false,
                restrictionReason: '',
                restrictedFeatures: [],
              },
            }
          : prev
      );
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to unblock restrictions');
    } finally {
      setIsUnblocking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm font-medium text-label-secondary tracking-tight">
          Loading Student 360 Profile...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-destructive-subtle flex items-center justify-center text-destructive">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-label-primary">
          Unable to Load Profile
        </h3>
        <p className="text-sm text-label-secondary max-w-sm mx-auto">
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
          bg: 'bg-success-subtle',
          text: 'text-success',
          ring: 'ring-success/30',
          dot: 'bg-success',
        };
      case 'blue':
        return {
          bg: 'bg-accent-subtle',
          text: 'text-accent',
          ring: 'ring-accent/30',
          dot: 'bg-accent',
        };
      case 'red':
        return {
          bg: 'bg-destructive-subtle',
          text: 'text-destructive',
          ring: 'ring-destructive/30',
          dot: 'bg-destructive',
        };
      case 'amber':
        return {
          bg: 'bg-warning-subtle',
          text: 'text-warning',
          ring: 'ring-warning/30',
          dot: 'bg-warning',
        };
      case 'gray':
      default:
        return {
          bg: 'bg-surface-secondary',
          text: 'text-label-secondary',
          ring: 'ring-separator',
          dot: 'bg-label-tertiary',
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
    <div className="w-full bg-canvas text-label-primary rounded-3xl p-4 sm:p-6 space-y-8 select-text">
      {/* ── 1. HERO SECTION (Macro-Typography, Rank, Stats) ── */}
      <section className="bg-surface/80 backdrop-blur-xl border border-separator rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-surface-secondary text-label-secondary">
                {student.department || 'General'}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent-subtle text-accent">
                {student.year || 'Student'}
              </span>
              {student.isOnboarded ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-subtle text-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Onboarded
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-warning-subtle text-warning">
                  Pending Claim
                </span>
              )}

              {student.isRestricted && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-destructive-subtle text-destructive border border-destructive/30">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Restricted
                </span>
              )}
            </div>

            {/* Macro-Typography Student Name */}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-label-primary">
              {student.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-label-secondary font-mono">
              <span>{student.rollNo}</span>
              <span>•</span>
              <span>{student.email}</span>
            </div>

            {/* Active Restrictions Alert Banner if Restricted */}
            {student.isRestricted && (
              <div className="p-3.5 rounded-2xl bg-destructive-subtle border border-destructive/25 text-xs text-destructive space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-destructive">
                  <ShieldAlert className="w-4 h-4 text-destructive" />
                  <span>Academic Restrictions Active</span>
                </div>
                <p className="text-label-secondary leading-relaxed">
                  {student.restrictionReason || 'Restricted from attending assessments, contests, or courses.'}
                </p>
                <p className="text-[11px] text-destructive/80">
                  Restricted Features: <strong className="text-label-primary">{student.restrictedFeatures?.join(', ') || 'assessments, contests'}</strong>
                </p>
              </div>
            )}

            {/* Action Bar: PDF & Unblock Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-accent hover:bg-accent-hover text-surface shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
              >
                {isExportingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-surface" />
                    <span>Generating PDF Dossier...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-surface" />
                    <span>Download PDF Report</span>
                  </>
                )}
              </button>

              {student.isRestricted && (
                <button
                  type="button"
                  onClick={handleUnblockRestrictions}
                  disabled={isUnblocking}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-success hover:bg-success-hover text-surface shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {isUnblocking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-surface" />
                      <span>Unblocking...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 text-surface" />
                      <span>Unblock Student Restrictions</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Macro Club Rank / Status */}
          <div className="shrink-0 bg-surface-secondary border border-separator rounded-2xl p-5 sm:p-6 text-center shadow-inner min-w-[150px]">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-label-secondary mb-1">
              <Trophy className="w-3.5 h-3.5 text-warning" />
              Club Rank
            </div>
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-label-primary">
              #{stats.rank}
            </div>
            <div className="text-xs text-label-secondary mt-1 font-medium">
              of {stats.totalStudents} students • {student.points || 0} pts
            </div>
          </div>
        </div>

        {/* ── Key Metrics Macro Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-surface-secondary/80 border border-separator rounded-2xl p-4 text-center">
            <span className="text-xs font-medium text-label-secondary block mb-1">
              Events Attended
            </span>
            <span className="text-2xl font-bold tracking-tight text-label-primary">
              {stats.totalEventsAttended}
            </span>
          </div>
          <div className="bg-surface-secondary/80 border border-separator rounded-2xl p-4 text-center">
            <span className="text-xs font-medium text-label-secondary block mb-1">
              Quests Completed
            </span>
            <span className="text-2xl font-bold tracking-tight text-success">
              {stats.questsCompleted}
            </span>
          </div>
          <div className="bg-surface-secondary/80 border border-separator rounded-2xl p-4 text-center">
            <span className="text-xs font-medium text-label-secondary block mb-1">
              Avg Assessment
            </span>
            <span className="text-2xl font-bold tracking-tight text-accent">
              {stats.averageAssessmentScore}%
            </span>
          </div>
          <div className="bg-surface-secondary/80 border border-separator rounded-2xl p-4 text-center">
            <span className="text-xs font-medium text-label-secondary block mb-1">
              Challenges Solved
            </span>
            <span className="text-2xl font-bold tracking-tight text-info">
              {stats.codingChallengesSolved}
            </span>
          </div>
        </div>

        {/* ── Linked Developer Stats (GitHub & LeetCode) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* GitHub Card */}
          <div className="rounded-2xl p-5 bg-surface-secondary/90 border border-separator shadow-sm flex flex-col justify-between">
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
                  className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
                >
                  @{githubUser}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {githubUser ? (
              ghLoading ? (
                <div className="py-3 flex items-center gap-2 text-xs text-label-tertiary">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching GitHub data...
                </div>
              ) : ghStats ? (
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-surface-raised border border-separator rounded-xl py-2">
                    <div className="text-lg font-bold text-label-primary">
                      {ghStats.public_repos}
                    </div>
                    <div className="text-[11px] text-label-secondary">Repositories</div>
                  </div>
                  <div className="bg-surface-raised border border-separator rounded-xl py-2">
                    <div className="text-lg font-bold text-label-primary">
                      {ghStats.followers}
                    </div>
                    <div className="text-[11px] text-label-secondary">Followers</div>
                  </div>
                  <div className="bg-surface-raised border border-separator rounded-xl py-2">
                    <div className="text-lg font-bold text-label-primary">
                      {ghStats.following}
                    </div>
                    <div className="text-[11px] text-label-secondary">Following</div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-label-secondary">
                  Username linked ({githubUser}), public data unavailable.
                </p>
              )
            ) : (
              <p className="text-xs text-label-tertiary italic py-2">
                GitHub account not linked in student profile.
              </p>
            )}
          </div>

          {/* LeetCode Card */}
          <div className="rounded-2xl p-5 bg-surface-secondary/90 border border-separator shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Code2 className="w-4 h-4 text-warning" />
                <span>LeetCode Stats</span>
              </div>
              {student.socialLinks?.leetcode && (
                <a
                  href={`https://leetcode.com/${leetcodeUser}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
                >
                  @{leetcodeUser}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {leetcodeUser ? (
              lcLoading ? (
                <div className="py-3 flex items-center gap-2 text-xs text-label-tertiary">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching LeetCode data...
                </div>
              ) : lcStats ? (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-semibold text-label-primary text-base">
                      {lcStats.totalSolved} Solved
                    </span>
                    <span className="text-label-secondary">Rank #{lcStats.ranking?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                    <span className="bg-success-subtle text-success rounded-lg py-1 font-medium">
                      Easy: {lcStats.easySolved}
                    </span>
                    <span className="bg-warning-subtle text-warning rounded-lg py-1 font-medium">
                      Med: {lcStats.mediumSolved}
                    </span>
                    <span className="bg-destructive-subtle text-destructive rounded-lg py-1 font-medium">
                      Hard: {lcStats.hardSolved}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-label-secondary">
                  Username linked ({leetcodeUser}), metrics unavailable.
                </p>
              )
            ) : (
              <p className="text-xs text-label-tertiary italic py-2">
                LeetCode account not linked in student profile.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. PROGRESS SECTION (Minimal Pill-Shaped Bars) ── */}
      <section className="bg-surface/80 backdrop-blur-xl border border-separator rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-label-primary flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent" />
              Domain & Curriculum Progress
            </h2>
            <p className="text-xs text-label-secondary">
              Interactive quest track and domain level mastery
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-surface-secondary text-label-secondary">
            {domainProgress.length} Tracks
          </span>
        </div>

        {domainProgress.length === 0 ? (
          <p className="text-xs text-label-tertiary italic">No domain tracks registered yet.</p>
        ) : (
          <div className="space-y-4">
            {domainProgress.map((domain) => (
              <div key={domain.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-label-primary">
                      {domain.name}
                    </span>
                    {!domain.isUnlocked && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-surface-secondary text-label-tertiary">
                        Locked
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-label-secondary">
                    {domain.completedLevels}/{domain.totalLevels} levels ({domain.progressPercent}%)
                  </span>
                </div>

                {/* Minimal Pill-Shaped Progress Bar */}
                <div className="h-2.5 w-full bg-surface-secondary rounded-full overflow-hidden p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${domain.progressPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-accent"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 3. ACTIVITY TIMELINE (Unified Chronological Journey) ── */}
      <section className="bg-surface/80 backdrop-blur-xl border border-separator rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-label-primary flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Activity Timeline
            </h2>
            <p className="text-xs text-label-secondary">
              Chronological journey of attendance, quest passes, and coding tests
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-surface-secondary text-label-secondary">
            {activityTimeline.length} Milestones
          </span>
        </div>

        {activityTimeline.length === 0 ? (
          <div className="text-center py-12 text-label-tertiary text-xs italic">
            No activity milestones recorded for this student yet.
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-separator">
            {activityTimeline.map((item, idx) => {
              const colors = getNodeColor(item.semanticColor);
              const dateStr = formatISTDate(item.timestamp);
              const timeStr = formatISTTime(item.timestamp);

              return (
                <div key={item.id || idx} className="relative group">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center ${colors.bg} ${colors.text} ring-4 ring-surface transition-transform group-hover:scale-110`}
                  >
                    {getTimelineIcon(item.category, item.status)}
                  </div>

                  {/* Timeline Item Content Card */}
                  <div className="bg-surface-secondary/80 border border-separator rounded-2xl p-4 sm:p-5 transition-shadow hover:shadow-md space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
                        >
                          {item.status}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-label-primary">
                          {item.title}
                        </h4>
                      </div>
                      <time className="text-[11px] font-mono text-label-tertiary flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateStr} • {timeStr}
                      </time>
                    </div>

                    <p className="text-xs text-label-secondary leading-relaxed">
                      {item.subtitle}
                    </p>

                    {item.meta && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        {item.meta.points !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-surface-raised border border-separator text-label-secondary font-medium">
                            +{item.meta.points} Points
                          </span>
                        )}
                        {item.meta.percentage !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-surface-raised border border-separator text-label-secondary font-medium">
                            Score: {item.meta.percentage}%
                          </span>
                        )}
                        {item.meta.session && (
                          <span className="px-2 py-0.5 rounded-md bg-surface-raised border border-separator text-label-tertiary font-medium">
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
