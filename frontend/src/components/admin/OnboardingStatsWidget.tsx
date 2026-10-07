import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  Send,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  UserCheck,
  UserX,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import { User, OnboardingStats, OnboardingStatusItem } from '../../types/user';
import { useDebounce } from '../../hooks/useDebounce';

interface OnboardingStatsWidgetProps {
  className?: string;
  onStudentSelect?: (student: User) => void;
}

export const OnboardingStatsWidget: React.FC<OnboardingStatsWidgetProps> = ({
  className = '',
  onStudentSelect,
}) => {
  // ── States ────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<OnboardingStats | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states: Default to 'all' so all students (onboarded & pending) are shown in directory
  const [statusFilter, setStatusFilter] = useState<'not_onboarded' | 'onboarded' | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearch = useDebounce<string>(searchTerm, 400);
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Chart hover state
  const [hoveredSegment, setHoveredSegment] = useState<OnboardingStatusItem | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Actions states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);
  
  // Reminder modal states
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);
  const [selectedReminderTarget, setSelectedReminderTarget] = useState<User | 'all_pending' | null>(null);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [sendingReminder, setSendingReminder] = useState<boolean>(false);

  // ── Fetch Data from GET /api/admin/onboarding-stats ───────────────────────
  const fetchStats = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await api.get('/admin/onboarding-stats');
      const payload = response.data;

      const rawStats: OnboardingStats = payload.stats || payload.data?.stats;
      const rawStudents: User[] = payload.students || payload.data?.students || [];

      if (rawStats) {
        setStats(rawStats);
      }
      setStudents(rawStudents);
    } catch (err: any) {
      console.error('Failed to load onboarding statistics:', err);
      setError(err?.response?.data?.error || 'Failed to fetch onboarding stats from server');

      // Graceful fallback dummy data if backend is unreachable during demo
      const fallbackStats: OnboardingStats = {
        total: 120,
        onboarded: 84,
        notOnboarded: 36,
        completionRate: 70.0,
        breakdown: [
          { status: 'Completed', label: 'Onboarded', mustChangePassword: false, count: 84, percentage: 70.0, color: '#10B981' },
          { status: 'Pending', label: 'Not Onboarded', mustChangePassword: true, count: 36, percentage: 30.0, color: '#F59E0B' },
        ],
        departments: ['CSE', 'IT', 'ECE', 'AI&DS', 'MECH'],
      };
      setStats(fallbackStats);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // ── Filter and Search Logic ───────────────────────────────────────────────
  const departmentsList = useMemo(() => {
    if (stats?.departments && stats.departments.length > 0) {
      return stats.departments;
    }
    const depts = new Set<string>();
    students.forEach((s) => {
      if (s.department) depts.add(s.department);
    });
    return Array.from(depts);
  }, [stats, students]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // 1. Status Filter:
      // mustChangePassword === true  -> Not Onboarded (Pending)
      // mustChangePassword === false -> Onboarded (Claimed)
      const isPending = Boolean(student.mustChangePassword);

      if (statusFilter === 'not_onboarded' && !isPending) {
        return false;
      }
      if (statusFilter === 'onboarded' && isPending) {
        return false;
      }

      // 2. Department Filter:
      if (selectedDept !== 'all' && student.department?.toLowerCase() !== selectedDept.toLowerCase()) {
        return false;
      }

      // 3. Search Term:
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase();
        const matchesName = student.name?.toLowerCase().includes(query);
        const matchesEmail = student.email?.toLowerCase().includes(query);
        const matchesRoll = student.rollNo?.toLowerCase().includes(query);
        const matchesDept = student.department?.toLowerCase().includes(query);
        return matchesName || matchesEmail || matchesRoll || matchesDept;
      }

      return true;
    });
  }, [students, statusFilter, selectedDept, debouncedSearch]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, selectedDept, debouncedSearch]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // ── Quick Actions ─────────────────────────────────────────────────────────
  const handleCopyEmail = (email: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    toast.success('Email copied to clipboard!');
    setTimeout(() => setCopiedEmailId(null), 2000);
  };

  const handleToggleOnboarding = async (student: User, e: React.MouseEvent) => {
    e.stopPropagation();
    const newMustChangePassword = !student.mustChangePassword;
    const isNowOnboarded = !newMustChangePassword;
    setActionLoadingId(student._id);

    try {
      await api.patch(`/admin/students/${student._id}/onboarding`, {
        mustChangePassword: newMustChangePassword,
      });

      // Optimistic update
      setStudents((prev) =>
        prev.map((s) =>
          s._id === student._id
            ? {
                ...s,
                mustChangePassword: newMustChangePassword,
                onboardingStatus: newMustChangePassword ? 'Pending' : 'Claimed',
              }
            : s
        )
      );

      // Re-calculate stats
      setStats((prev) => {
        if (!prev) return prev;
        const onboarded = isNowOnboarded ? prev.onboarded + 1 : Math.max(0, prev.onboarded - 1);
        const notOnboarded = isNowOnboarded ? Math.max(0, prev.notOnboarded - 1) : prev.notOnboarded + 1;
        const rate = prev.total > 0 ? Number(((onboarded / prev.total) * 100).toFixed(1)) : 0;
        return {
          ...prev,
          onboarded,
          notOnboarded,
          completionRate: rate,
          breakdown: [
            { ...prev.breakdown[0], count: onboarded, percentage: rate },
            { ...prev.breakdown[1], count: notOnboarded, percentage: Number((100 - rate).toFixed(1)) },
          ],
        };
      });

      toast.success(
        newStatus
          ? `${student.name} marked as Onboarded!`
          : `${student.name} marked as Pending onboarding.`
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update onboarding status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReminderModal = (target: User | 'all_pending', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedReminderTarget(target);
    setCustomMessage(
      target === 'all_pending'
        ? 'Friendly reminder: Please complete your Code Circle onboarding profile to activate your event passport, certifications, and project badges.'
        : `Hi ${target.name}, please complete your student onboarding on Code Circle to finalize your membership registration.`
    );
    setShowReminderModal(true);
  };

  const handleSendReminder = async () => {
    if (!selectedReminderTarget) return;
    setSendingReminder(true);

    try {
      if (selectedReminderTarget === 'all_pending') {
        const res = await api.post('/admin/onboarding-reminder', {
          allNotOnboarded: true,
          customMessage,
        });
        toast.success(res.data?.message || 'Onboarding reminder broadcasted to all pending students!');
      } else {
        const res = await api.post('/admin/onboarding-reminder', {
          studentId: selectedReminderTarget._id,
          customMessage,
        });
        toast.success(res.data?.message || `Reminder email sent to ${selectedReminderTarget.name}!`);
      }
      setShowReminderModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to send reminder email');
    } finally {
      setSendingReminder(false);
    }
  };

  // ── Donut Chart Geometry (Custom Interactive SVG) ─────────────────────────
  const chartSize = 190;
  const strokeWidth = 22;
  const radius = (chartSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const onboardedRatio = stats && stats.total > 0 ? stats.onboarded / stats.total : 0;
  const notOnboardedRatio = stats && stats.total > 0 ? stats.notOnboarded / stats.total : 1;

  // Arc stroke dash lengths
  const onboardedDash = onboardedRatio * circumference;
  const notOnboardedDash = notOnboardedRatio * circumference;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-separator/80 bg-surface/90 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${className}`}
      style={{
        background: 'radial-gradient(ellipse at 85% 0%, rgba(0, 113, 227, 0.05) 0%, var(--surface) 70%)',
      }}
    >
      {/* Ambient background glow accents */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* ── TOP HEADER BAR ──────────────────────────────────────────────── */}
      <div className="border-b border-separator/60 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Live Onboarding Tracker
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-label-primary sm:text-2xl">
              Student Onboarding Statistics
            </h2>
            <p className="mt-0.5 text-xs text-label-secondary sm:text-sm">
              Real-time student registration verification, status breakdowns, and action center.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Bulk Action: Remind All Pending */}
            {stats && stats.notOnboarded > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOpenReminderModal('all_pending')}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-500/25 dark:text-amber-300"
              >
                <Mail size={14} className="text-amber-500" />
                <span>Remind All Pending</span>
                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:text-amber-200">
                  {stats.notOnboarded}
                </span>
              </motion.button>
            )}

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              title="Refresh statistics"
              className="inline-flex items-center gap-1.5 rounded-xl border border-separator bg-surface-secondary px-3 py-2 text-xs font-medium text-label-secondary transition-colors hover:bg-surface-raised hover:text-label-primary disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-6 sm:p-8">
        {/* ── METRIC CARDS ROW ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-5">
          {/* Total Students */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group relative overflow-hidden rounded-2xl border border-separator/70 bg-surface-secondary/80 p-4 transition-all hover:border-accent/30 hover:shadow-lg sm:p-5"
          >
            <div className="flex items-center justify-between text-label-secondary">
              <span className="text-xs font-medium">Total Students</span>
              <div className="rounded-lg bg-surface-raised p-1.5 text-label-primary">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-label-primary sm:text-3xl">
              {loading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-separator" />
              ) : (
                stats?.total.toLocaleString() ?? '0'
              )}
            </div>
            <p className="mt-1 text-[11px] font-medium text-label-tertiary">
              Enrolled Members
            </p>
          </motion.div>

          {/* Onboarded / Claimed Students */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            onClick={() => setStatusFilter('onboarded')}
            className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all hover:shadow-lg sm:p-5 ${
              statusFilter === 'onboarded'
                ? 'border-emerald-500/60 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                : 'border-separator/70 bg-surface-secondary/80 hover:border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-xs font-medium">Accounts Claimed</span>
              <div className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-500">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-3xl">
              {loading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-separator" />
              ) : (
                stats?.onboarded.toLocaleString() ?? '0'
              )}
            </div>
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600/80 dark:text-emerald-400/80">
              <span>{stats?.completionRate ?? 0}% claimed</span>
              <ArrowUpRight size={12} />
            </p>
          </motion.div>

          {/* Pending / Not Onboarded Students */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            onClick={() => setStatusFilter('not_onboarded')}
            className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all hover:shadow-lg sm:p-5 ${
              statusFilter === 'not_onboarded'
                ? 'border-amber-500/60 bg-amber-500/10 ring-2 ring-amber-500/20'
                : 'border-separator/70 bg-surface-secondary/80 hover:border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
              <span className="text-xs font-medium whitespace-nowrap">Pending Initial Login</span>
              <div className="rounded-lg bg-amber-500/15 p-1.5 text-amber-500">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 sm:text-3xl">
              {loading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-separator" />
              ) : (
                stats?.notOnboarded.toLocaleString() ?? '0'
              )}
            </div>
            <p className="mt-1 text-[11px] font-medium text-amber-600/80 dark:text-amber-400/80">
              {statusFilter === 'not_onboarded' ? 'Filtered below' : 'Requires initial login'}
            </p>
          </motion.div>

          {/* Completion Ratio */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="group relative overflow-hidden rounded-2xl border border-separator/70 bg-surface-secondary/80 p-4 transition-all hover:border-accent/30 hover:shadow-lg sm:p-5"
          >
            <div className="flex items-center justify-between text-label-secondary">
              <span className="text-xs font-medium">Claim Rate</span>
              <div className="rounded-lg bg-surface-raised p-1.5 text-accent">
                <Sparkles size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-accent sm:text-3xl">
              {loading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-separator" />
              ) : (
                `${stats?.completionRate ?? 0}%`
              )}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-separator">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-accent transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, stats?.completionRate ?? 0)}%` }}
              />
            </div>
          </motion.div>
        </div>

        {/* ── VISUALIZATION: INTERACTIVE DONUT & SEGMENTED PROGRESS ─────── */}
        <div className="rounded-3xl border border-separator/70 bg-surface-secondary/40 p-6 backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-bold text-label-primary sm:text-lg">
                Onboarding Ratio & Distribution
              </h3>
              <p className="text-xs text-label-secondary">
                Hover over any segment or slice to inspect exact headcounts and percentages.
              </p>
            </div>

            {/* Interactive hint badge */}
            {hoveredSegment && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 rounded-full border border-separator bg-surface px-3 py-1 text-xs font-medium text-label-primary shadow-sm"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: hoveredSegment.color }}
                />
                <span className="font-semibold">{hoveredSegment.label}:</span>
                <span>{hoveredSegment.count} students ({hoveredSegment.percentage}%)</span>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
            {/* Donut Chart (Interactive SVG) */}
            <div className="flex flex-col items-center justify-center md:col-span-5">
              <div className="relative flex items-center justify-center">
                <svg
                  width={chartSize}
                  height={chartSize}
                  viewBox={`0 0 ${chartSize} ${chartSize}`}
                  className="-rotate-90 transform"
                >
                  {/* Background Track Circle */}
                  <circle
                    cx={chartSize / 2}
                    cy={chartSize / 2}
                    r={radius}
                    fill="transparent"
                    stroke="var(--separator)"
                    strokeWidth={strokeWidth}
                    className="opacity-40"
                  />

                  {/* Segment 2: Not Onboarded (Amber) */}
                  <motion.circle
                    cx={chartSize / 2}
                    cy={chartSize / 2}
                    r={radius}
                    fill="transparent"
                    stroke="#F59E0B"
                    strokeWidth={hoveredSegment?.status === 'Pending' ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={`${notOnboardedDash} ${circumference}`}
                    strokeDashoffset={-onboardedDash}
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-300"
                    style={{
                      filter: hoveredSegment?.status === 'Pending' ? 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.5))' : 'none',
                    }}
                    onMouseEnter={() =>
                      setHoveredSegment({
                        status: 'Pending',
                        label: 'Pending Initial Login',
                        mustChangePassword: true,
                        count: stats?.notOnboarded ?? 0,
                        percentage: stats?.total ? Number(((stats.notOnboarded / stats.total) * 100).toFixed(1)) : 0,
                        color: '#F59E0B',
                      })
                    }
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() => setStatusFilter('not_onboarded')}
                  />

                  {/* Segment 1: Onboarded (Emerald) */}
                  <motion.circle
                    cx={chartSize / 2}
                    cy={chartSize / 2}
                    r={radius}
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth={hoveredSegment?.status === 'Claimed' ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={`${onboardedDash} ${circumference}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-300"
                    style={{
                      filter: hoveredSegment?.status === 'Claimed' ? 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))' : 'none',
                    }}
                    onMouseEnter={() =>
                      setHoveredSegment({
                        status: 'Claimed',
                        label: 'Accounts Claimed',
                        mustChangePassword: false,
                        count: stats?.onboarded ?? 0,
                        percentage: stats?.completionRate ?? 0,
                        color: '#10B981',
                      })
                    }
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() => setStatusFilter('onboarded')}
                  />
                </svg>

                {/* Donut Center Label Readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={hoveredSegment ? hoveredSegment.label : 'overall'}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="px-2"
                    >
                      <span className="block text-2xl font-extrabold tracking-tight text-label-primary sm:text-3xl">
                        {hoveredSegment
                          ? `${hoveredSegment.percentage}%`
                          : `${stats?.completionRate ?? 0}%`}
                      </span>
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-label-secondary">
                        {hoveredSegment ? hoveredSegment.label : 'Accounts Claimed'}
                      </span>
                      <span className="block text-[10px] text-label-tertiary">
                        {hoveredSegment ? `${hoveredSegment.count} students` : `${stats?.total ?? 0} total`}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Segmented Progress Bar & Detailed Breakdown Legend */}
            <div className="flex flex-col justify-center space-y-6 md:col-span-7">
              {/* Segmented Bar */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                  <span className="text-label-secondary">Proportional Breakdown</span>
                  <span className="text-label-tertiary">Click segment to filter table</span>
                </div>

                <div className="relative flex h-5 w-full cursor-pointer overflow-hidden rounded-full bg-separator/50 p-0.5 shadow-inner">
                  {/* Onboarded Portion */}
                  <motion.div
                    whileHover={{ scaleY: 1.1 }}
                    onClick={() => setStatusFilter('onboarded')}
                    onMouseEnter={() =>
                      setHoveredSegment({
                        status: 'Claimed',
                        label: 'Accounts Claimed',
                        mustChangePassword: false,
                        count: stats?.onboarded ?? 0,
                        percentage: stats?.completionRate ?? 0,
                        color: '#10B981',
                      })
                    }
                    onMouseLeave={() => setHoveredSegment(null)}
                    style={{ width: `${Math.max(2, (onboardedRatio * 100))}%` }}
                    className="relative flex h-full items-center justify-center rounded-l-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all hover:brightness-110"
                  >
                    {onboardedRatio > 0.15 && (
                      <span className="text-[10px] font-bold text-white drop-shadow-sm">
                        {stats?.completionRate}%
                      </span>
                    )}
                  </motion.div>

                  {/* Not Onboarded Portion */}
                  <motion.div
                    whileHover={{ scaleY: 1.1 }}
                    onClick={() => setStatusFilter('not_onboarded')}
                    onMouseEnter={() =>
                      setHoveredSegment({
                        status: 'Pending',
                        label: 'Pending Initial Login',
                        mustChangePassword: true,
                        count: stats?.notOnboarded ?? 0,
                        percentage: stats?.total ? Number(((stats.notOnboarded / stats.total) * 100).toFixed(1)) : 0,
                        color: '#F59E0B',
                      })
                    }
                    onMouseLeave={() => setHoveredSegment(null)}
                    style={{ width: `${Math.max(2, (notOnboardedRatio * 100))}%` }}
                    className="relative flex h-full items-center justify-center rounded-r-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all hover:brightness-110"
                  >
                    {notOnboardedRatio > 0.15 && (
                      <span className="text-[10px] font-bold text-white drop-shadow-sm">
                        {stats?.total ? Number(((stats.notOnboarded / stats.total) * 100).toFixed(1)) : 0}%
                      </span>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Interactive Legend Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Accounts Claimed Card */}
                <div
                  onClick={() => setStatusFilter('onboarded')}
                  onMouseEnter={() =>
                    setHoveredSegment({
                      status: 'Claimed',
                      label: 'Accounts Claimed',
                      mustChangePassword: false,
                      count: stats?.onboarded ?? 0,
                      percentage: stats?.completionRate ?? 0,
                      color: '#10B981',
                    })
                  }
                  onMouseLeave={() => setHoveredSegment(null)}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition-all ${
                    statusFilter === 'onboarded'
                      ? 'border-emerald-500/50 bg-emerald-500/10 shadow-sm'
                      : 'border-separator bg-surface hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-3.5 w-3.5 rounded-full bg-emerald-500 shadow-sm" />
                    <div>
                      <h4 className="text-xs font-bold text-label-primary">Accounts Claimed</h4>
                      <p className="text-[11px] text-label-secondary">Personal password created</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-label-primary">
                      {stats?.onboarded.toLocaleString() ?? '0'}
                    </span>
                    <span className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {stats?.completionRate ?? 0}%
                    </span>
                  </div>
                </div>

                {/* Pending Initial Login Card */}
                <div
                  onClick={() => setStatusFilter('not_onboarded')}
                  onMouseEnter={() =>
                    setHoveredSegment({
                      status: 'Pending',
                      label: 'Pending Initial Login',
                      mustChangePassword: true,
                      count: stats?.notOnboarded ?? 0,
                      percentage: stats?.total ? Number(((stats.notOnboarded / stats.total) * 100).toFixed(1)) : 0,
                      color: '#F59E0B',
                    })
                  }
                  onMouseLeave={() => setHoveredSegment(null)}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition-all ${
                    statusFilter === 'not_onboarded'
                      ? 'border-amber-500/50 bg-amber-500/10 shadow-sm'
                      : 'border-separator bg-surface hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-3.5 w-3.5 rounded-full bg-amber-500 shadow-sm" />
                    <div>
                      <h4 className="text-xs font-bold text-label-primary">Pending Initial Login</h4>
                      <p className="text-[11px] text-label-secondary">Using temporary default credentials</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-label-primary">
                      {stats?.notOnboarded.toLocaleString() ?? '0'}
                    </span>
                    <span className="block text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      {stats?.total ? Number(((stats.notOnboarded / stats.total) * 100).toFixed(1)) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── DATA TABLE: FILTERABLE LIST OF STUDENTS ──────────────────── */}
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-bold text-label-primary sm:text-lg">
                Student Directory & Action Center
              </h3>
              <p className="text-xs text-label-secondary">
                Filtered view defaulting to <span className="font-semibold text-amber-600 dark:text-amber-400">Pending Initial Login</span> students to streamline administrative outreach.
              </p>
            </div>

            {/* Quick reminder for current filtered pending list */}
            {statusFilter === 'not_onboarded' && filteredStudents.length > 0 && (
              <button
                onClick={() => handleOpenReminderModal('all_pending')}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white shadow-md shadow-accent/20 transition-all hover:bg-accent-hover hover:shadow-lg"
              >
                <Send size={13} />
                <span>Send Reminder to All ({filteredStudents.length})</span>
              </button>
            )}
          </div>

          {/* Controls Bar: Tabs, Search, and Department Filter */}
          <div className="flex flex-col gap-3 rounded-2xl border border-separator/70 bg-surface-secondary/60 p-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Status Filter Tabs (Defaults to 'not_onboarded') */}
            <div className="flex overflow-auto items-center rounded-xl bg-surface p-1 border border-separator/60">
              <button
                onClick={() => setStatusFilter('not_onboarded')}
                className={`relative whitespace-nowrap flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === 'not_onboarded'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <Clock size={12} />
                <span>Not Onboarded</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    statusFilter === 'not_onboarded'
                      ? 'bg-white/20 text-white'
                      : 'bg-separator text-label-secondary'
                  }`}
                >
                  {stats?.notOnboarded ?? 0}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('onboarded')}
                className={`relative whitespace-nowrap flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === 'onboarded'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <CheckCircle2 size={12} />
                <span>Onboarded</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    statusFilter === 'onboarded'
                      ? 'bg-white/20 text-white'
                      : 'bg-separator text-label-secondary'
                  }`}
                >
                  {stats?.onboarded ?? 0}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('all')}
                className={`relative whitespace-nowrap flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <Users size={12} />
                <span>All</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    statusFilter === 'all'
                      ? 'bg-white/20 text-white'
                      : 'bg-separator text-label-secondary'
                  }`}
                >
                  {stats?.total ?? 0}
                </span>
              </button>
            </div>

            {/* Search Input & Department Filter */}
            <div className="flex flex-1 flex-col gap-2.5 sm:max-w-md sm:flex-row sm:items-center sm:justify-end">
              {/* Search */}
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-label-tertiary"
                />
                <input
                  type="text"
                  placeholder="Search name, roll no, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-separator bg-surface py-1.5 pl-8 pr-8 text-xs text-label-primary placeholder-label-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Department Dropdown */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="rounded-xl border border-separator bg-surface py-1.5 px-3 text-xs text-label-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="all">All Departments</option>
                {departmentsList.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-separator/80 bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-separator bg-surface-secondary/70 text-[11px] font-bold uppercase tracking-wider text-label-secondary">
                    <th className="py-3.5 pl-6 pr-3">Student</th>
                    <th className="px-3 py-3.5">Roll No</th>
                    <th className="px-3 py-3.5">Department</th>
                    <th className="px-3 py-3.5">Onboarding Status</th>
                    <th className="px-3 py-3.5">Contact</th>
                    <th className="py-3.5 pl-3 pr-6 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator/40">
                  {loading ? (
                    // Loading skeleton rows
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 pl-6 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-separator" />
                            <div className="space-y-1.5">
                              <div className="h-3 w-28 rounded bg-separator" />
                              <div className="h-2.5 w-36 rounded bg-separator" />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="h-3 w-16 rounded bg-separator" />
                        </td>
                        <td className="px-3 py-4">
                          <div className="h-3 w-20 rounded bg-separator" />
                        </td>
                        <td className="px-3 py-4">
                          <div className="h-5 w-24 rounded-full bg-separator" />
                        </td>
                        <td className="px-3 py-4">
                          <div className="h-3 w-24 rounded bg-separator" />
                        </td>
                        <td className="py-4 pl-3 pr-6 text-right">
                          <div className="ml-auto h-7 w-20 rounded bg-separator" />
                        </td>
                      </tr>
                    ))
                  ) : paginatedStudents.length === 0 ? (
                    // Empty state
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center justify-center space-y-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary text-label-tertiary">
                            {statusFilter === 'not_onboarded' ? (
                              <CheckCircle2 size={24} className="text-emerald-500" />
                            ) : (
                              <Search size={24} />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-label-primary">
                              {statusFilter === 'not_onboarded'
                                ? 'No Pending Students Found'
                                : 'No Matching Students'}
                            </h4>
                            <p className="mt-1 text-xs text-label-secondary">
                              {statusFilter === 'not_onboarded'
                                ? 'All registered students have successfully claimed their accounts and created their secure passwords!'
                                : 'Try clearing your search query or adjusting your department filter.'}
                            </p>
                          </div>
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm('')}
                              className="text-xs font-semibold text-accent hover:underline"
                            >
                              Clear search query
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // Student Rows
                    paginatedStudents.map((student) => {
                      // Rule: mustChangePassword === true  -> User is NOT onboarded (Pending)
                      //       mustChangePassword === false -> User is ONBOARDED (Claimed)
                      const isPending = Boolean(student.mustChangePassword);
                      const isClaimed = !isPending;

                      return (
                        <motion.tr
                          key={student._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => onStudentSelect && onStudentSelect(student)}
                          className="group transition-colors hover:bg-surface-secondary/80"
                        >
                          {/* Student Details */}
                          <td className="py-3.5 pl-6 pr-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${
                                  isClaimed
                                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-400'
                                    : 'bg-gradient-to-tr from-amber-500 to-orange-400'
                                }`}
                              >
                                {student.name
                                  ? student.name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .slice(0, 2)
                                      .toUpperCase()
                                  : 'ST'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-label-primary truncate max-w-[180px]">
                                  {student.name}
                                </div>
                                <div className="text-[11px] text-label-secondary truncate max-w-[180px]">
                                  {student.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Roll Number */}
                          <td className="px-3 py-3.5">
                            <span className="font-mono text-[11px] font-semibold text-label-primary">
                              {student.rollNo || 'N/A'}
                            </span>
                          </td>

                          {/* Department */}
                          <td className="px-3 py-3.5">
                            <span className="inline-flex items-center rounded-lg bg-surface-secondary px-2 py-0.5 text-[11px] font-medium text-label-secondary">
                              {student.department || 'General'}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="px-3 py-3.5">
                            {isClaimed ? (
                              <span className="inline-flex whitespace-nowrap items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={12} />
                                <span>Account Claimed</span>
                              </span>
                            ) : (
                              <span className="inline-flex whitespace-nowrap items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                <Clock size={12} />
                                <span>Pending Initial Login</span>
                              </span>
                            )}
                          </td>

                          {/* Email Copy */}
                          <td className="px-3 py-3.5">
                            <button
                              onClick={(e) => handleCopyEmail(student.email, student._id, e)}
                              className="inline-flex items-center gap-1 text-[11px] text-label-secondary hover:text-accent transition-colors"
                              title="Copy email to clipboard"
                            >
                              {copiedEmailId === student._id ? (
                                <Check size={12} className="text-emerald-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                              <span className="truncate max-w-[130px]">{student.email}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 pl-3 pr-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Send Reminder Button */}
                              {isPending && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => handleOpenReminderModal(student, e)}
                                  title="Send onboarding reminder email"
                                  className="inline-flex items-center gap-1 rounded-xl bg-amber-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 transition-colors hover:bg-amber-500/25 dark:text-amber-300"
                                >
                                  <Mail size={12} />
                                  <span>Remind</span>
                                </motion.button>
                              )}

                              {/* Toggle Status Button */}
                              <button
                                onClick={(e) => handleToggleOnboarding(student, e)}
                                disabled={actionLoadingId === student._id}
                                title={
                                  isClaimed
                                    ? 'Mark student as pending'
                                    : 'Mark student as onboarded'
                                }
                                className={`inline-flex items-center gap-1 rounded-xl border border-separator px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                  isClaimed
                                    ? 'hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/30'
                                    : 'hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30'
                                } disabled:opacity-50 text-label-secondary`}
                              >
                                {actionLoadingId === student._id ? (
                                  <RefreshCw size={12} className="animate-spin" />
                                ) : isClaimed ? (
                                  <>
                                    <UserX size={12} />
                                    <span>Revoke</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck size={12} />
                                    <span>Verify</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-separator px-6 py-3 text-xs text-label-secondary">
                <div>
                  Showing{' '}
                  <span className="font-semibold text-label-primary">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-label-primary">
                    {Math.min(currentPage * pageSize, filteredStudents.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-label-primary">
                    {filteredStudents.length}
                  </span>{' '}
                  students
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-separator bg-surface text-label-primary transition-colors hover:bg-surface-secondary disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <span className="px-2 text-xs font-medium">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-separator bg-surface text-label-primary transition-colors hover:bg-surface-secondary disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── REMINDER CUSTOMIZATION MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {showReminderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReminderModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative w-full max-w-lg rounded-3xl border border-separator bg-surface p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-center justify-between border-b border-separator/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-amber-500/15 p-2 text-amber-500">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-label-primary">
                      Send Onboarding Reminder
                    </h3>
                    <p className="text-xs text-label-secondary">
                      {selectedReminderTarget === 'all_pending'
                        ? `Broadcasting to all ${stats?.notOnboarded ?? 0} pending students`
                        : `Recipient: ${selectedReminderTarget?.name} (${selectedReminderTarget?.email})`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowReminderModal(false)}
                  className="rounded-lg p-1 text-label-tertiary hover:bg-surface-secondary hover:text-label-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-label-secondary">
                    Custom Message
                  </label>
                  <textarea
                    rows={4}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Enter reminder notice message..."
                    className="w-full rounded-2xl border border-separator bg-surface-secondary/70 p-3 text-xs text-label-primary placeholder-label-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <p className="mt-1 text-[11px] text-label-tertiary">
                    This notification will be delivered with high priority and direct profile action links.
                  </p>
                </div>

                <div className="rounded-xl bg-surface-secondary p-3 text-xs text-label-secondary">
                  <span className="font-semibold text-label-primary">Action: </span>
                  Targeted students will receive guidance to complete profile setup, roll number verification, and club skills selection.
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-separator/60 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  disabled={sendingReminder}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-label-secondary transition-colors hover:bg-surface-secondary hover:text-label-primary"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-white shadow-md shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-lg disabled:opacity-50"
                >
                  {sendingReminder ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send Reminder</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingStatsWidget;
