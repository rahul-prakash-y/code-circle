import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Sparkles,
  CalendarCheck,
  Code2,
  Flame,
  BookOpen,
  Award,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plus,
  Users,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  HelpCircle,
  TrendingUp,
  BarChart3,
  Building2,
  GraduationCap,
  Activity,
  RefreshCw,
  UserCheck,
  Zap,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { formatISTDateTime } from '../lib/dateUtils';
import toast from 'react-hot-toast';
import { Button } from '@heroui/react';
import { HeroUISelect } from '@/components/ui/HeroUISelect';
import { HeroChip as Chip } from '@/components/ui/hero/HeroChip';
import { EmptyState, NoSearchResults } from '../components/states';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import usePointsStore, { StudentPointsData, AdminStudentItem, AdminPointTransaction } from '../store/usePointsStore';

export const PointsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const {
    myPointsData,
    loadingMyPoints,
    fetchMyPoints,
    adminOverview,
    loadingOverview,
    fetchAdminOverview,
    adminStudents,
    loadingStudents,
    fetchAdminStudents,
    adminTransactions,
    loadingTransactions,
    transactionsPagination,
    fetchAdminTransactions,
    selectedAudit,
    loadingAudit,
    fetchStudentAudit,
    clearSelectedAudit,
    awardBonusPoints,
    pagination,
  } = usePointsStore();

  const isAdmin =
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty' ||
    profile?.role === 'Committee' ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin';

  // Active view tab for admins (Points Tracking vs Student Directory vs My Points)
  type ActiveTabType = 'student' | 'tracking' | 'directory';
  const [activeTab, setActiveTab] = useState<ActiveTabType>(() => (isAdmin ? 'tracking' : 'student'));
  const hasInitializedTab = useRef(false);

  useEffect(() => {
    if (isAdmin && !hasInitializedTab.current) {
      setActiveTab('tracking');
      hasInitializedTab.current = true;
    }
  }, [isAdmin]);

  // Student ledger filter
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Admin Points Tracking filters (sorted by recently first)
  const [trackingSearch, setTrackingSearch] = useState<string>('');
  const [trackingCategory, setTrackingCategory] = useState<string>('all');
  const [trackingDept, setTrackingDept] = useState<string>('all');
  const [trackingSortOrder, setTrackingSortOrder] = useState<'desc' | 'asc'>('desc');
  const [trackingPage, setTrackingPage] = useState<number>(1);
  const [trackingLimit, setTrackingLimit] = useState<number>(25);

  // Admin Student Directory filters
  const [adminSearch, setAdminSearch] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [directoryPage, setDirectoryPage] = useState<number>(1);

  // Modals state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isAwardModalOpen, setIsAwardModalOpen] = useState<boolean>(false);
  const [targetStudent, setTargetStudent] = useState<AdminStudentItem | any | null>(null);

  // Award form state
  const [awardAmount, setAwardAmount] = useState<string>('50');
  const [awardCategory, setAwardCategory] = useState<string>('Bonus');
  const [awardTitle, setAwardTitle] = useState<string>('');
  const [awardDescription, setAwardDescription] = useState<string>('');
  const [isSubmittingAward, setIsSubmittingAward] = useState<boolean>(false);

  // Initial data loading
  useEffect(() => {
    fetchMyPoints();
    if (isAdmin) {
      fetchAdminOverview();
      fetchAdminTransactions({
        page: 1,
        limit: trackingLimit,
        search: trackingSearch,
        category: trackingCategory,
        department: trackingDept,
        sortOrder: trackingSortOrder,
      });
      fetchAdminStudents({
        page: 1,
        search: adminSearch,
        department: deptFilter,
        year: yearFilter,
        sortOrder,
      });
    }
  }, [fetchMyPoints, fetchAdminOverview, fetchAdminTransactions, fetchAdminStudents, isAdmin]);

  // Debounced/Triggered tracking query on filter or page change
  useEffect(() => {
    if (isAdmin && activeTab === 'tracking') {
      const timer = setTimeout(() => {
        fetchAdminTransactions({
          page: trackingPage,
          limit: trackingLimit,
          search: trackingSearch,
          category: trackingCategory,
          department: trackingDept,
          sortOrder: trackingSortOrder,
        });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [
    trackingSearch,
    trackingCategory,
    trackingDept,
    trackingSortOrder,
    trackingPage,
    trackingLimit,
    activeTab,
    isAdmin,
    fetchAdminTransactions,
  ]);

  // Debounced/Triggered admin roster query on filter change
  useEffect(() => {
    if (isAdmin && activeTab === 'directory') {
      const timer = setTimeout(() => {
        fetchAdminStudents({
          page: directoryPage,
          search: adminSearch,
          department: deptFilter,
          year: yearFilter,
          sortOrder,
        });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [adminSearch, deptFilter, yearFilter, sortOrder, directoryPage, activeTab, isAdmin, fetchAdminStudents]);

  // Refresh active feeds
  const handleRefreshFeed = async () => {
    await fetchAdminOverview();
    if (activeTab === 'tracking') {
      await fetchAdminTransactions({
        page: trackingPage,
        limit: trackingLimit,
        search: trackingSearch,
        category: trackingCategory,
        department: trackingDept,
        sortOrder: trackingSortOrder,
      });
      toast.success('Live points feed refreshed');
    } else if (activeTab === 'directory') {
      await fetchAdminStudents({
        page: directoryPage,
        search: adminSearch,
        department: deptFilter,
        year: yearFilter,
        sortOrder,
      });
      toast.success('Student directory refreshed');
    }
  };

  // Helper for relative time
  const formatRelativeTime = (timestamp?: string | null) => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return '';
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return '';
    }
  };

  // Helper for category badge styling
  const getCategoryDetails = (category: string) => {
    switch (category) {
      case 'Attendance':
        return {
          label: 'Club Hour',
          icon: CalendarCheck,
          badgeClass: 'bg-accent-subtle text-accent border-accent/20',
        };
      case 'Assessment':
        return {
          label: 'MCQ Assessment',
          icon: Award,
          badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        };
      case 'Coding':
        return {
          label: 'Coding Challenge',
          icon: Code2,
          badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        };
      case 'Contest':
        return {
          label: 'Contest / Sprint',
          icon: Flame,
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'Course':
        return {
          label: 'Course Quest',
          icon: BookOpen,
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'Bonus':
        return {
          label: 'Merit Bonus',
          icon: Sparkles,
          badgeClass: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
        };
      case 'Adjustment':
        return {
          label: 'Adjustment',
          icon: ShieldCheck,
          badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        };
      default:
        return {
          label: category || 'Points',
          icon: Sparkles,
          badgeClass: 'bg-surface-secondary text-label-secondary border-separator',
        };
    }
  };

  // Open audit modal for student
  const handleOpenAudit = async (studentId: string, studentBasic?: AdminStudentItem | any) => {
    if (studentBasic) setTargetStudent(studentBasic);
    setIsAuditModalOpen(true);
    await fetchStudentAudit(studentId);
  };

  // Close audit modal
  const handleCloseAudit = () => {
    setIsAuditModalOpen(false);
    clearSelectedAudit();
    setTargetStudent(null);
  };

  // Open award modal
  const handleOpenAward = (student: AdminStudentItem | any) => {
    setTargetStudent(student);
    setAwardAmount('50');
    setAwardCategory('Bonus');
    setAwardTitle('');
    setAwardDescription('');
    setIsAwardModalOpen(true);
  };

  // Submit award points
  const handleAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudent) return;

    const amt = parseInt(awardAmount, 10);
    if (isNaN(amt) || amt === 0) {
      toast.error('Please enter a valid non-zero points amount');
      return;
    }
    if (!awardTitle.trim()) {
      toast.error('Please provide a title or reason for awarding points');
      return;
    }

    setIsSubmittingAward(true);
    try {
      await awardBonusPoints({
        studentId: targetStudent._id,
        amount: amt,
        category: awardCategory,
        title: awardTitle.trim(),
        description: awardDescription.trim(),
      });
      toast.success(
        `Successfully ${amt > 0 ? 'awarded' : 'adjusted'} ${Math.abs(amt)} points for ${targetStudent.name}!`
      );
      setIsAwardModalOpen(false);
      // Refresh current tables and feeds
      fetchAdminStudents({
        page: directoryPage,
        search: adminSearch,
        department: deptFilter,
        year: yearFilter,
        sortOrder,
      });
      fetchAdminTransactions({
        page: trackingPage,
        limit: trackingLimit,
        search: trackingSearch,
        category: trackingCategory,
        department: trackingDept,
        sortOrder: trackingSortOrder,
      });
      // If student is currently inspecting audit modal, refresh it
      if (isAuditModalOpen && selectedAudit?.student?._id === targetStudent._id) {
        fetchStudentAudit(targetStudent._id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to award points');
    } finally {
      setIsSubmittingAward(false);
    }
  };

  // Filtered student transactions
  const filteredTransactions = useMemo(() => {
    if (!myPointsData?.transactions) return [];
    return myPointsData.transactions.filter((tx) => {
      const matchesCategory =
        categoryFilter === 'all' ||
        tx.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.description && tx.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (tx.classHoursText && tx.classHoursText.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [myPointsData, categoryFilter, searchQuery]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-separator">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="meta-editorial text-label-secondary">Merit & Recognition</p>
          </div>
          <h1 className="display-headline text-label-primary">Points Hub</h1>
          <p className="text-[14px] text-label-secondary mt-1">
            Track verified session attendance, coding challenge achievements, and club leaderboard points.
          </p>
        </div>

        {/* Admin View Mode Switcher */}
        {isAdmin && (
          <div className="w-full sm:w-auto flex p-1 rounded-xl bg-surface-secondary border border-separator shadow-sm shrink-0 gap-1 overflow-x-auto no-scrollbar">
            <Button
              size="sm"
              variant={activeTab === 'tracking' ? 'primary' : 'ghost'}
              onPress={() => setActiveTab('tracking')}
              className="text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Activity size={14} />
              <span>Points Tracking</span>
              {transactionsPagination.total > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10 font-mono">
                  {transactionsPagination.total}
                </span>
              )}
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'directory' ? 'primary' : 'ghost'}
              onPress={() => setActiveTab('directory')}
              className="text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Users size={14} />
              <span>Student Directory</span>
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'student' ? 'primary' : 'ghost'}
              onPress={() => setActiveTab('student')}
              className="text-xs font-semibold text-center whitespace-nowrap"
            >
              My Points
            </Button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. STUDENT VIEW: MY POINTS */}
      {/* ========================================================================= */}
      {activeTab === 'student' && (
        <div className="space-y-8">
          {/* Hero Tier Card */}
          <div className="surface relative overflow-hidden rounded-[24px] p-6 sm:p-8 border border-separator shadow-card">
            {/* Ambient Background Gradient Accent */}
            <div
              className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{
                background: myPointsData?.tier.color || 'var(--accent)',
              }}
            />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-surface-secondary border border-separator">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: myPointsData?.tier.color || 'var(--accent)' }}
                  />
                  <span>{myPointsData?.tier.name || 'Bronze'} Tier Division</span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-black text-label-primary tracking-tight font-mono">
                    {loadingMyPoints ? '...' : (myPointsData?.totalPoints ?? 0).toLocaleString()}
                  </span>
                  <span className="text-lg font-bold text-accent">TOTAL POINTS</span>
                </div>

                <p className="text-xs sm:text-sm text-label-secondary leading-relaxed">
                  Earn points by attending weekly club hours, conquering algorithmic challenges, participating in
                  hackathons, and completing course quests.
                </p>

                {/* Tier Progress Bar */}
                <div className="pt-2 space-y-1.5 max-w-md">
                  <div className="flex justify-between text-[11px] font-semibold text-label-secondary">
                    <span>
                      Tier Progress: {myPointsData?.tier.progressPercent ?? 0}%
                    </span>
                    <span>
                      {myPointsData?.totalPoints ?? 0} / {myPointsData?.tier.nextTierPoints ?? 250} pts
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-secondary border border-separator rounded-full overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${myPointsData?.tier.progressPercent ?? 0}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: myPointsData?.tier.color || 'var(--accent)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Leaderboard Rank & Badges */}
              <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 border-t md:border-t-0 md:border-l border-separator pt-4 md:pt-0 md:pl-8">
                <div className="text-left md:text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-label-secondary">
                    Club Leaderboard
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-label-primary font-mono">
                    #{myPointsData?.rank ?? '—'}
                  </p>
                  <p className="text-[11px] text-label-secondary">
                    out of {myPointsData?.totalStudents ?? '—'} students
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-surface-secondary border border-separator flex items-center justify-center text-accent shadow-sm">
                    <Trophy size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pillars Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Attendance & Club Hours */}
            <div className="surface rounded-[20px] p-5 border border-separator shadow-card hover:border-accent/40 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent-subtle border border-accent/20 text-accent flex items-center justify-center">
                  <CalendarCheck size={18} />
                </div>
                <Chip size="sm" color="success" variant="flat" className="font-mono font-bold">
                  +{myPointsData?.summary?.attendance?.points ?? 0} pts
                </Chip>
              </div>
              <h3 className="text-sm font-bold text-label-primary group-hover:text-accent transition-colors">
                Club Hours & Sessions
              </h3>
              <p className="text-xs text-label-secondary mt-1">
                {myPointsData?.summary?.attendance?.totalClubHours ?? 0} Period(s) Verified
              </p>
              <div className="mt-3 pt-3 border-t border-separator text-[11px] text-label-secondary flex justify-between">
                <span>{myPointsData?.summary?.attendance?.sessionsCount ?? 0} sessions attended</span>
                <span className="font-semibold text-label-primary">50 pts/hr</span>
              </div>
            </div>

            {/* 2. Coding Challenges */}
            <div className="surface rounded-[20px] p-5 border border-separator shadow-card hover:border-accent/40 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Code2 size={18} />
                </div>
                <Chip size="sm" color="secondary" variant="flat" className="font-mono font-bold">
                  +{myPointsData?.summary?.coding?.points ?? 0} pts
                </Chip>
              </div>
              <h3 className="text-sm font-bold text-label-primary group-hover:text-accent transition-colors">
                Coding Challenges
              </h3>
              <p className="text-xs text-label-secondary mt-1">
                {myPointsData?.summary?.coding?.completedLevels ?? 0} Levels Conquered
              </p>
              <div className="mt-3 pt-3 border-t border-separator text-[11px] text-label-secondary flex justify-between">
                <span>Algorithmic masteries</span>
                <span className="font-semibold text-label-primary">Level quests</span>
              </div>
            </div>

            {/* 3. Contests */}
            <div className="surface rounded-[20px] p-5 border border-separator shadow-card hover:border-accent/40 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Flame size={18} />
                </div>
                <Chip size="sm" color="warning" variant="flat" className="font-mono font-bold">
                  +{myPointsData?.summary?.contests?.points ?? 0} pts
                </Chip>
              </div>
              <h3 className="text-sm font-bold text-label-primary group-hover:text-accent transition-colors">
                Contests & Sprints
              </h3>
              <p className="text-xs text-label-secondary mt-1">
                {myPointsData?.summary?.contests?.participatedCount ?? 0} Contests Scored
              </p>
              <div className="mt-3 pt-3 border-t border-separator text-[11px] text-label-secondary flex justify-between">
                <span>Weekly sprints</span>
                <span className="font-semibold text-label-primary">Ranked</span>
              </div>
            </div>

            {/* 4. MCQ Assessments */}
            <div className="surface rounded-[20px] p-5 border border-separator shadow-card hover:border-accent/40 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Award size={18} />
                </div>
                <Chip size="sm" color="primary" variant="flat" className="font-mono font-bold">
                  +{myPointsData?.summary?.assessment?.points ?? 0} pts
                </Chip>
              </div>
              <h3 className="text-sm font-bold text-label-primary group-hover:text-accent transition-colors">
                MCQ Assessments
              </h3>
              <p className="text-xs text-label-secondary mt-1">
                {myPointsData?.summary?.assessment?.completedCount ?? 0} Quizzes Passed
              </p>
              <div className="mt-3 pt-3 border-t border-separator text-[11px] text-label-secondary flex justify-between">
                <span>Knowledge checks</span>
                <span className="font-semibold text-label-primary">Evaluations</span>
              </div>
            </div>

            {/* 5. Courses & Bonuses */}
            <div className="surface rounded-[20px] p-5 border border-separator shadow-card hover:border-accent/40 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <Chip size="sm" color="success" variant="flat" className="font-mono font-bold">
                  +{(myPointsData?.summary?.courses?.points ?? 0) + (myPointsData?.summary?.bonus?.points ?? 0)} pts
                </Chip>
              </div>
              <h3 className="text-sm font-bold text-label-primary group-hover:text-accent transition-colors">
                Courses & Merit Badges
              </h3>
              <p className="text-xs text-label-secondary mt-1">
                {myPointsData?.summary?.courses?.completedQuests ?? 0} Quests & Special Badges
              </p>
              <div className="mt-3 pt-3 border-t border-separator text-[11px] text-label-secondary flex justify-between">
                <span>Curriculum tracks</span>
                <span className="font-semibold text-label-primary">Club merit</span>
              </div>
            </div>
          </div>

          {/* Points Activity Ledger ("Where They Earned") */}
          <div className="surface rounded-[20px] border border-separator shadow-card overflow-hidden">
            {/* Header & Controls */}
            <div className="p-5 border-b border-separator flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-label-primary">Points Ledger</h2>
                <p className="text-xs text-label-secondary">
                  Complete chronological history of where and how you earned points
                </p>
              </div>

              {/* Search & Filter pills */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                <div className="relative w-full sm:w-56">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-label-secondary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search activity..."
                    className="input-field pl-9 pr-3 py-1.5 text-xs w-full"
                  />
                </div>

                <div className="flex items-center gap-1 bg-surface-secondary p-1 rounded-xl border border-separator overflow-x-auto no-scrollbar w-full sm:w-auto">
                  {['all', 'attendance', 'coding', 'contest', 'course', 'assessment', 'bonus'].map((cat) => (
                    <Button
                      key={cat}
                      size="sm"
                      variant={categoryFilter === cat ? 'primary' : 'ghost'}
                      onPress={() => setCategoryFilter(cat)}
                      className="text-[11px] font-semibold capitalize whitespace-nowrap shrink-0 min-h-[32px] h-auto px-2.5 py-1"
                    >
                      {cat === 'all'
                        ? 'All'
                        : cat === 'attendance'
                        ? 'Club Hours'
                        : cat === 'assessment'
                        ? 'MCQ Assessments'
                        : cat}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Transactions Table / List */}
            <div className="divide-y divide-separator">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-surface-secondary/50 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 sm:mt-0 ${
                        tx.category === 'Attendance'
                          ? 'bg-accent-subtle border-accent/20 text-accent'
                          : tx.category === 'Coding'
                          ? 'bg-info-subtle border-info/20 text-info'
                          : tx.category === 'Contest'
                          ? 'bg-warning-subtle border-warning/20 text-warning'
                          : tx.category === 'Course'
                          ? 'bg-success-subtle border-success/20 text-success'
                          : tx.category === 'Assessment'
                          ? 'bg-info-subtle border-info/20 text-info'
                          : 'bg-accent-subtle border-accent/20 text-accent'
                      }`}
                    >
                      {tx.category === 'Attendance' ? (
                        <CalendarCheck size={18} />
                      ) : tx.category === 'Coding' ? (
                        <Code2 size={18} />
                      ) : tx.category === 'Contest' ? (
                        <Flame size={18} />
                      ) : tx.category === 'Course' ? (
                        <BookOpen size={18} />
                      ) : tx.category === 'Assessment' ? (
                        <Award size={18} />
                      ) : (
                        <Sparkles size={18} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-label-primary truncate">{tx.title}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-separator bg-surface-secondary text-label-secondary">
                          {tx.category === 'Attendance'
                            ? 'Club Hour'
                            : tx.category === 'Assessment'
                            ? 'MCQ Assessment'
                            : tx.category}
                        </span>
                        {tx.classHoursText && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
                            {tx.classHoursText}
                          </span>
                        )}
                      </div>

                      {tx.description && (
                        <p className="text-[11px] text-label-secondary mt-0.5 break-words">{tx.description}</p>
                      )}

                      <p className="text-[10px] text-label-secondary font-mono mt-1">
                        {tx.timestamp ? formatISTDateTime(tx.timestamp) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Points Pill */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-separator/40 shrink-0">
                    <span className="sm:hidden text-[11px] text-label-tertiary font-medium">Earned</span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-mono font-bold border ${
                        tx.amount >= 0
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} PTS
                    </span>
                  </div>
                </div>
              ))}

              {filteredTransactions.length === 0 && !loadingMyPoints && (
                <div className="py-8 text-center">
                  {searchQuery ? (
                    <NoSearchResults
                      query={searchQuery}
                      onClearFilters={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                      }}
                    />
                  ) : (
                    <EmptyState
                      reason={categoryFilter !== 'all' ? 'filtered' : 'first-use'}
                      title={categoryFilter !== 'all' ? 'No points in this category' : 'No points recorded yet'}
                      description={
                        categoryFilter !== 'all'
                          ? 'Try selecting "All Categories" to see your complete points ledger.'
                          : 'Attend club sessions or submit coding challenges to begin logging your achievements.'
                      }
                      primaryAction={
                        categoryFilter !== 'all'
                          ? { label: 'Show all activity', onClick: () => setCategoryFilter('all') }
                          : undefined
                      }
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADMIN VIEW: POINTS TRACKING & DIRECTORY */}
      {/* ========================================================================= */}
      {isAdmin && activeTab !== 'student' && (
        <div className="space-y-6">
          {/* Admin KPI Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="surface rounded-[20px] p-5 border border-separator shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                  Total Points Awarded
                </span>
                <Trophy size={16} className="text-accent" />
              </div>
              <p className="text-3xl font-black text-label-primary font-mono">
                {(adminOverview?.totalPoints ?? 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-label-secondary mt-1">Across all registered students</p>
            </div>

            <div className="surface rounded-[20px] p-5 border border-separator shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                  Club Hours Logged
                </span>
                <Clock size={16} className="text-accent" />
              </div>
              <p className="text-3xl font-black text-label-primary font-mono">
                {(adminOverview?.totalClubHours ?? 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-label-secondary mt-1">
                {(adminOverview?.totalAttendancePoints ?? 0).toLocaleString()} pts awarded via sessions
              </p>
            </div>

            <div className="surface rounded-[20px] p-5 border border-separator shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                  Average Per Student
                </span>
                <TrendingUp size={16} className="text-success" />
              </div>
              <p className="text-3xl font-black text-label-primary font-mono">
                {(adminOverview?.avgPoints ?? 0).toLocaleString()} pts
              </p>
              <p className="text-[11px] text-label-secondary mt-1">
                {adminOverview?.studentsWithPoints ?? 0} active students with points
              </p>
            </div>

            <div className="surface rounded-[20px] p-5 border border-separator shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                  Top Department
                </span>
                <Building2 size={16} className="text-purple-500" />
              </div>
              <p className="text-2xl font-black text-label-primary truncate">
                {adminOverview?.topDepartment?.name || 'General'}
              </p>
              <p className="text-[11px] text-label-secondary mt-1">
                {(adminOverview?.topDepartment?.points ?? 0).toLocaleString()} aggregate points
              </p>
            </div>
          </div>

          {/* Sub Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-separator pb-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-secondary border border-separator w-fit">
              <Button
                size="sm"
                variant={activeTab === 'tracking' ? 'primary' : 'ghost'}
                onPress={() => setActiveTab('tracking')}
                className="text-xs font-semibold flex items-center gap-1.5"
              >
                <Activity size={14} />
                <span>Live Points Tracking</span>
                {transactionsPagination.total > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10 font-mono">
                    {transactionsPagination.total}
                  </span>
                )}
              </Button>
              <Button
                size="sm"
                variant={activeTab === 'directory' ? 'primary' : 'ghost'}
                onPress={() => setActiveTab('directory')}
                className="text-xs font-semibold flex items-center gap-1.5"
              >
                <Users size={14} />
                <span>Student Directory</span>
                {pagination.total > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10 font-mono">
                    {pagination.total}
                  </span>
                )}
              </Button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onPress={handleRefreshFeed}
              isDisabled={loadingTransactions || loadingStudents || loadingOverview}
              className="text-xs font-semibold flex items-center gap-1.5 self-end sm:self-auto"
            >
              <RefreshCw size={13} className={loadingTransactions || loadingStudents ? 'animate-spin' : ''} />
              <span>Refresh Feed</span>
            </Button>
          </div>

          {/* ===================================================================== */}
          {/* VIEW A: LIVE POINTS TRACKING (SORTED BY RECENTLY FIRST) */}
          {/* ===================================================================== */}
          {activeTab === 'tracking' && (
            <div className="surface rounded-[20px] border border-separator shadow-card overflow-hidden">
              {/* Header & Filters */}
              <div className="p-5 border-b border-separator space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-label-primary">
                        Student Points Tracking & Activity Ledger
                      </h2>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Feed
                      </span>
                    </div>
                    <p className="text-xs text-label-secondary mt-0.5">
                      Chronological stream of all points awarded to students, sorted by most recently awarded first
                    </p>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
                  {/* Search Input */}
                  <div className="relative lg:col-span-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-label-secondary" />
                    <input
                      type="text"
                      value={trackingSearch}
                      onChange={(e) => {
                        setTrackingSearch(e.target.value);
                        setTrackingPage(1);
                      }}
                      placeholder="Search student, roll no, milestone..."
                      className="input-field pl-9 pr-3 py-1.5 text-xs w-full"
                    />
                  </div>

                  {/* Category Filter */}
                  <HeroUISelect
                    value={trackingCategory}
                    onChange={(val) => {
                      setTrackingCategory(val);
                      setTrackingPage(1);
                    }}
                    options={[
                      { value: 'all', label: 'All Categories' },
                      { value: 'Attendance', label: 'Club Hours / Attendance' },
                      { value: 'Assessment', label: 'MCQ Assessments' },
                      { value: 'Coding', label: 'Coding Challenges' },
                      { value: 'Contest', label: 'Contests & Sprints' },
                      { value: 'Course', label: 'Course Quests' },
                      { value: 'Bonus', label: 'Merit Bonuses' },
                      { value: 'Adjustment', label: 'Administrative Adjustments' },
                    ]}
                    size="sm"
                    className="w-full"
                  />

                  {/* Department Filter */}
                  <HeroUISelect
                    value={trackingDept}
                    onChange={(val) => {
                      setTrackingDept(val);
                      setTrackingPage(1);
                    }}
                    options={[
                      { value: 'all', label: 'All Departments' },
                      { value: 'CSE', label: 'CSE' },
                      { value: 'IT', label: 'IT' },
                      { value: 'AI&DS', label: 'AI & DS' },
                      { value: 'ECE', label: 'ECE' },
                      { value: 'EEE', label: 'EEE' },
                      { value: 'MECH', label: 'MECH' },
                      { value: 'CIVIL', label: 'CIVIL' },
                    ]}
                    size="sm"
                    className="w-full"
                  />

                  {/* Sort Order Selector */}
                  <HeroUISelect
                    value={trackingSortOrder}
                    onChange={(val) => {
                      setTrackingSortOrder(val as 'desc' | 'asc');
                      setTrackingPage(1);
                    }}
                    options={[
                      { value: 'desc', label: 'Recently Awarded First' },
                      { value: 'asc', label: 'Oldest First' },
                    ]}
                    size="sm"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[840px] text-left">
                  <thead>
                    <tr className="border-b border-separator text-[11px] font-medium text-label-secondary bg-surface-secondary/40">
                      <th className="px-5 py-3.5">Student Profile</th>
                      <th className="px-5 py-3.5">Points Awarded</th>
                      <th className="px-5 py-3.5">Category & Milestone</th>
                      <th className="px-5 py-3.5">Awarded By / Source</th>
                      <th className="px-5 py-3.5">Awarded At (IST)</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-separator text-xs">
                    {loadingTransactions && adminTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-label-secondary">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 size={24} className="animate-spin text-accent" />
                            <p className="text-xs">Gathering student points activity feed...</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      adminTransactions.map((tx) => {
                        const cat = getCategoryDetails(tx.category);
                        const CatIcon = cat.icon;
                        return (
                          <tr key={tx._id} className="hover:bg-surface-secondary/50 transition-colors">
                            {/* Student Profile */}
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-surface-secondary border border-separator overflow-hidden flex items-center justify-center font-bold text-xs text-label-primary shrink-0">
                                  {tx.user?.profilePicUrl ? (
                                    <img src={tx.user.profilePicUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    tx.user?.name?.charAt(0) || 'U'
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-label-primary truncate max-w-[160px]">
                                    {tx.user?.name || 'Unknown Student'}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[11px] text-label-secondary font-mono">
                                    <span>{tx.user?.rollNo || '—'}</span>
                                    {tx.user?.department && (
                                      <>
                                        <span>•</span>
                                        <span>{tx.user.department}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Points Awarded */}
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <div className="flex flex-col items-start gap-0.5">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                                    tx.amount > 0
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                      : tx.amount < 0
                                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                                      : 'bg-surface-secondary border-separator text-label-secondary'
                                  }`}
                                >
                                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount} PTS
                                </span>
                                {typeof tx.balanceAfter === 'number' && (
                                  <span className="text-[10px] text-label-secondary font-mono">
                                    Bal: {tx.balanceAfter.toLocaleString()} pts
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Category & Milestone */}
                            <td className="px-5 py-3.5">
                              <div className="min-w-0 max-w-sm">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.badgeClass}`}
                                  >
                                    <CatIcon size={12} />
                                    <span>{cat.label}</span>
                                  </span>
                                  {(tx as any).classHoursText && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
                                      {(tx as any).classHoursText}
                                    </span>
                                  )}
                                </div>
                                <p className="font-bold text-label-primary text-xs mt-1 truncate" title={tx.title}>
                                  {tx.title}
                                </p>
                                {tx.description && (
                                  <p
                                    className="text-[11px] text-label-secondary mt-0.5 line-clamp-1"
                                    title={tx.description}
                                  >
                                    {tx.description}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Awarded By / Source */}
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              {tx.awardedBy ? (
                                <div className="flex items-center gap-1.5 text-xs text-label-primary">
                                  <UserCheck size={13} className="text-accent shrink-0" />
                                  <div className="min-w-0">
                                    <span className="font-semibold block truncate max-w-[130px]" title={tx.awardedBy.name}>
                                      {tx.awardedBy.name}
                                    </span>
                                    {tx.awardedBy.role && (
                                      <span className="text-[10px] text-label-secondary block">
                                        {tx.awardedBy.role}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-secondary text-label-secondary border border-separator">
                                  <Zap size={12} className="text-emerald-500 shrink-0" />
                                  <span>Automated</span>
                                </div>
                              )}
                            </td>

                            {/* Date & Time (IST) */}
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <p className="font-mono text-xs font-medium text-label-primary">
                                {tx.timestamp ? formatISTDateTime(tx.timestamp) : '—'}
                              </p>
                              <p className="text-[10px] text-label-secondary mt-0.5">
                                {formatRelativeTime(tx.timestamp)}
                              </p>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                              {tx.user?._id ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onPress={() => handleOpenAudit(tx.user!._id, tx.user as any)}
                                    className="text-xs font-semibold"
                                  >
                                    Audit
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onPress={() => handleOpenAward(tx.user as any)}
                                    className="text-xs font-semibold flex items-center gap-1"
                                  >
                                    <Plus size={12} />
                                    <span>Award</span>
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-label-tertiary">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}

                    {adminTransactions.length === 0 && !loadingTransactions && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-label-secondary">
                          {trackingSearch ? (
                            <NoSearchResults
                              query={trackingSearch}
                              onClearFilters={() => {
                                setTrackingSearch('');
                                setTrackingCategory('all');
                                setTrackingDept('all');
                                setTrackingPage(1);
                              }}
                            />
                          ) : (
                            <EmptyState
                              reason={trackingCategory !== 'all' || trackingDept !== 'all' ? 'filtered' : 'first-use'}
                              title="No point transactions found"
                              description="No points have been recorded matching your current filter selections."
                              primaryAction={
                                trackingCategory !== 'all' || trackingDept !== 'all'
                                  ? {
                                      label: 'Reset all filters',
                                      onClick: () => {
                                        setTrackingSearch('');
                                        setTrackingCategory('all');
                                        setTrackingDept('all');
                                        setTrackingPage(1);
                                      },
                                    }
                                  : undefined
                              }
                            />
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tracking Pagination Footer */}
              <div className="p-4 border-t border-separator flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-label-secondary">
                <div className="flex items-center gap-2">
                  <span>
                    Showing{' '}
                    <strong className="text-label-primary font-mono">
                      {transactionsPagination.total === 0
                        ? 0
                        : (transactionsPagination.page - 1) * transactionsPagination.limit + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-label-primary font-mono">
                      {Math.min(
                        transactionsPagination.page * transactionsPagination.limit,
                        transactionsPagination.total
                      )}
                    </strong>{' '}
                    of{' '}
                    <strong className="text-label-primary font-mono">{transactionsPagination.total}</strong> points activities
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={transactionsPagination.page <= 1 || loadingTransactions}
                    onPress={() => setTrackingPage((p) => Math.max(1, p - 1))}
                    className="text-xs font-semibold flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </Button>

                  <span className="font-mono text-xs px-2 text-label-primary font-bold">
                    {transactionsPagination.page} / {transactionsPagination.totalPages || 1}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={
                      transactionsPagination.page >= transactionsPagination.totalPages || loadingTransactions
                    }
                    onPress={() => setTrackingPage((p) => p + 1)}
                    className="text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* VIEW B: STUDENT DIRECTORY */}
          {/* ===================================================================== */}
          {activeTab === 'directory' && (
            <div className="surface rounded-[20px] border border-separator shadow-card overflow-hidden">
              <div className="p-5 border-b border-separator flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-label-primary">Student Points Directory</h2>
                  <p className="text-xs text-label-secondary">
                    Inspect student point distributions, view detailed activity audits, and grant merit bonuses
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <div className="relative w-full sm:w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-label-secondary" />
                    <input
                      type="text"
                      value={adminSearch}
                      onChange={(e) => {
                        setAdminSearch(e.target.value);
                        setDirectoryPage(1);
                      }}
                      placeholder="Search name, roll no..."
                      className="input-field pl-9 pr-3 py-1.5 text-xs w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                    <HeroUISelect
                      value={deptFilter}
                      onChange={(v) => {
                        setDeptFilter(v);
                        setDirectoryPage(1);
                      }}
                      options={[
                        { value: 'all', label: 'All Departments' },
                        { value: 'CSE', label: 'CSE' },
                        { value: 'IT', label: 'IT' },
                        { value: 'AI&DS', label: 'AI & DS' },
                        { value: 'ECE', label: 'ECE' },
                        { value: 'EEE', label: 'EEE' },
                        { value: 'MECH', label: 'MECH' },
                        { value: 'CIVIL', label: 'CIVIL' },
                      ]}
                      size="sm"
                      className="w-full sm:w-40"
                    />

                    <HeroUISelect
                      value={yearFilter}
                      onChange={(v) => {
                        setYearFilter(v);
                        setDirectoryPage(1);
                      }}
                      options={[
                        { value: 'all', label: 'All Years' },
                        { value: '1st Year', label: '1st Year' },
                        { value: '2nd Year', label: '2nd Year' },
                        { value: '3rd Year', label: '3rd Year' },
                        { value: '4th Year', label: '4th Year' },
                      ]}
                      size="sm"
                      className="w-full sm:w-36"
                    />

                    <HeroUISelect
                      value={sortOrder}
                      onChange={(v) => {
                        setSortOrder(v as any);
                        setDirectoryPage(1);
                      }}
                      options={[
                        { value: 'desc', label: 'Highest Points First' },
                        { value: 'asc', label: 'Lowest Points First' },
                      ]}
                      size="sm"
                      className="w-full sm:w-44"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-separator text-[11px] font-medium text-label-secondary bg-surface-secondary/40">
                      <th className="px-5 py-3.5">Student Profile</th>
                      <th className="px-5 py-3.5">Dept & Year</th>
                      <th className="px-5 py-3.5">Club Hours Attended</th>
                      <th className="px-5 py-3.5">Session Pts</th>
                      <th className="px-5 py-3.5">Other Pts</th>
                      <th className="px-5 py-3.5">Total Points</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-separator text-xs">
                    {adminStudents.map((s) => (
                      <tr key={s._id} className="hover:bg-surface-secondary/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-secondary border border-separator overflow-hidden flex items-center justify-center font-bold text-xs text-label-primary shrink-0">
                              {s.profilePicUrl ? (
                                <img src={s.profilePicUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                s.name?.charAt(0) || 'U'
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-label-primary whitespace-nowrap">{s.name}</p>
                              <p className="text-[11px] text-label-secondary font-mono whitespace-nowrap">{s.rollNo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-label-primary whitespace-nowrap">{s.department || 'General'}</span>
                          <span className="text-label-secondary block text-[11px] whitespace-nowrap">{s.year || '3rd Year'}</span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
                            <Clock size={12} />
                            {s.totalClubHours || 0} hr{s.totalClubHours === 1 ? '' : 's'}
                          </span>
                          <span className="text-[10px] text-label-secondary block mt-0.5 whitespace-nowrap">
                            {s.sessionsCount || 0} session(s)
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-semibold text-success whitespace-nowrap">
                          +{s.attendancePoints || 0} pts
                        </td>
                        <td className="px-5 py-3.5 font-mono text-label-secondary whitespace-nowrap">
                          +{s.otherPoints || 0} pts
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-label-primary">
                              {(s.totalPoints || 0).toLocaleString()}
                            </span>
                            <span
                              className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border whitespace-nowrap"
                              style={{
                                borderColor: s.tier?.color || 'var(--accent)',
                                color: s.tier?.color || 'var(--accent)',
                              }}
                            >
                              {s.tier?.name || 'Bronze'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onPress={() => handleOpenAudit(s._id, s)}
                              className="text-xs font-semibold"
                            >
                              Points Audit
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onPress={() => handleOpenAward(s)}
                              className="text-xs font-semibold flex items-center gap-1"
                            >
                              <Plus size={13} />
                              <span>Award</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {adminStudents.length === 0 && !loadingStudents && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-label-secondary">
                          {adminSearch ? (
                            <NoSearchResults
                              query={adminSearch}
                              onClearFilters={() => {
                                setAdminSearch('');
                                setDeptFilter('all');
                                setYearFilter('all');
                                setDirectoryPage(1);
                              }}
                            />
                          ) : (
                            <EmptyState
                              reason={deptFilter !== 'all' || yearFilter !== 'all' ? 'filtered' : 'first-use'}
                              title="No students match the criteria"
                              description="Try adjusting your department or academic year filters."
                              primaryAction={
                                deptFilter !== 'all' || yearFilter !== 'all'
                                  ? {
                                      label: 'Reset all filters',
                                      onClick: () => {
                                        setAdminSearch('');
                                        setDeptFilter('all');
                                        setYearFilter('all');
                                        setDirectoryPage(1);
                                      },
                                    }
                                  : undefined
                              }
                            />
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Directory Pagination Footer */}
              <div className="p-4 border-t border-separator flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-label-secondary">
                <div className="flex items-center gap-2">
                  <span>
                    Showing{' '}
                    <strong className="text-label-primary font-mono">
                      {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-label-primary font-mono">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </strong>{' '}
                    of <strong className="text-label-primary font-mono">{pagination.total}</strong> students
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={pagination.page <= 1 || loadingStudents}
                    onPress={() => setDirectoryPage((p) => Math.max(1, p - 1))}
                    className="text-xs font-semibold flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </Button>

                  <span className="font-mono text-xs px-2 text-label-primary font-bold">
                    {pagination.page} / {pagination.totalPages || 1}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={pagination.page >= pagination.totalPages || loadingStudents}
                    onPress={() => setDirectoryPage((p) => p + 1)}
                    className="text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: STUDENT POINT AUDIT ("HOW THEY EARNED") */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAuditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseAudit}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-3xl max-h-[90dvh] flex flex-col surface rounded-2xl sm:rounded-[24px] border border-separator shadow-2xl overflow-hidden z-10"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-separator flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-label-primary truncate">
                    Student Points Audit & Ledger
                  </h3>
                  <p className="text-xs text-label-secondary truncate">
                    {selectedAudit?.student?.name || targetStudent?.name} ({selectedAudit?.student?.rollNo || targetStudent?.rollNo})
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  isIconOnly
                  onPress={handleCloseAudit}
                  className="min-h-[40px] min-w-[40px] rounded-full shrink-0"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1">
                {loadingAudit ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 size={32} className="animate-spin text-accent" />
                    <p className="text-xs text-label-secondary">Gathering student point activities...</p>
                  </div>
                ) : selectedAudit ? (
                  <>
                    {/* Macro Stats Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                      <div className="p-3 sm:p-3.5 rounded-xl bg-surface-secondary border border-separator">
                        <span className="text-[10px] sm:text-[11px] text-label-secondary font-semibold">Total Points</span>
                        <p className="text-lg sm:text-xl font-bold font-mono text-label-primary">
                          {selectedAudit.totalPoints.toLocaleString()} PTS
                        </p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-xl bg-surface-secondary border border-separator">
                        <span className="text-[10px] sm:text-[11px] text-label-secondary font-semibold">Club Rank</span>
                        <p className="text-lg sm:text-xl font-bold font-mono text-label-primary">
                          #{selectedAudit.rank} of {selectedAudit.totalStudents}
                        </p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-xl bg-surface-secondary border border-separator">
                        <span className="text-[10px] sm:text-[11px] text-label-secondary font-semibold">Club Hours Logged</span>
                        <p className="text-lg sm:text-xl font-bold font-mono text-accent">
                          {selectedAudit.summary?.attendance?.totalClubHours || 0} hrs
                        </p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-xl bg-surface-secondary border border-separator">
                        <span className="text-[10px] sm:text-[11px] text-label-secondary font-semibold">Tier</span>
                        <p
                          className="text-lg sm:text-xl font-bold uppercase"
                          style={{ color: selectedAudit.tier?.color || 'var(--accent)' }}
                        >
                          {selectedAudit.tier?.name || 'Bronze'}
                        </p>
                      </div>
                    </div>

                    {/* Breakdown Pillars */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                      <div className="p-2.5 sm:p-3 rounded-xl border border-separator bg-surface">
                        <span className="text-label-secondary block text-[11px]">Club Hours Pts:</span>
                        <span className="font-bold text-success font-mono">
                          +{selectedAudit.summary?.attendance?.points || 0} pts
                        </span>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl border border-separator bg-surface">
                        <span className="text-label-secondary block text-[11px]">Coding Challenges:</span>
                        <span className="font-bold text-info font-mono">
                          +{selectedAudit.summary?.coding?.points || 0} pts
                        </span>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl border border-separator bg-surface">
                        <span className="text-label-secondary block text-[11px]">Contests:</span>
                        <span className="font-bold text-warning font-mono">
                          +{selectedAudit.summary?.contests?.points || 0} pts
                        </span>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl border border-separator bg-surface">
                        <span className="text-label-secondary block text-[11px]">Course / Bonus:</span>
                        <span className="font-bold text-accent font-mono">
                          +{(selectedAudit.summary?.courses?.points || 0) + (selectedAudit.summary?.bonus?.points || 0)} pts
                        </span>
                      </div>
                    </div>

                    {/* Chronological Activity Ledger ("How they earned") */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-label-primary mb-2.5">
                        Activity History ({selectedAudit.transactions.length} records)
                      </h4>

                      <div className="border border-separator rounded-xl overflow-hidden divide-y divide-separator">
                        {selectedAudit.transactions.map((tx) => (
                          <div key={tx.id} className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-xs">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span className="font-bold text-label-primary truncate">{tx.title}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-separator bg-surface-secondary text-label-secondary">
                                  {tx.category}
                                </span>
                                {tx.classHoursText && (
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
                                    {tx.classHoursText}
                                  </span>
                                )}
                              </div>
                              {tx.description && (
                                <p className="text-[11px] text-label-secondary mt-0.5 break-words">{tx.description}</p>
                              )}
                              <p className="text-[10px] text-label-secondary font-mono mt-0.5">
                                {tx.timestamp ? formatISTDateTime(tx.timestamp) : '—'}
                              </p>
                            </div>

                            <div className="flex items-center justify-end shrink-0">
                              <span
                                className={`font-mono font-bold px-2.5 py-1 rounded-full text-xs ${
                                  tx.amount >= 0
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} PTS
                              </span>
                            </div>
                          </div>
                        ))}

                        {selectedAudit.transactions.length === 0 && (
                          <div className="py-8 text-center text-label-secondary text-xs">
                            No activities logged yet for this student.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-xs text-label-secondary py-12">No audit data available</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 border-t border-separator bg-surface-secondary/40 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                {targetStudent && (
                  <Button
                    variant="primary"
                    onPress={() => {
                      handleCloseAudit();
                      handleOpenAward(targetStudent);
                    }}
                    className="text-xs font-semibold w-full sm:w-auto text-center"
                  >
                    Award Merit Points
                  </Button>
                )}
                <Button
                  variant="outline"
                  onPress={handleCloseAudit}
                  className="text-xs font-semibold w-full sm:w-auto text-center"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: AWARD MERIT POINTS */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAwardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAwardModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md max-h-[90dvh] flex flex-col surface rounded-2xl sm:rounded-[24px] border border-separator shadow-2xl overflow-hidden z-10"
            >
              <div className="p-4 sm:p-5 border-b border-separator flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-label-primary truncate">Grant Merit Points</h3>
                  <p className="text-xs text-label-secondary truncate">
                    Award points directly to {targetStudent?.name} ({targetStudent?.rollNo})
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  isIconOnly
                  onPress={() => setIsAwardModalOpen(false)}
                  className="min-h-[40px] min-w-[40px] rounded-full shrink-0"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </Button>
              </div>

              <form onSubmit={handleAwardSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div>
                  <label className="block font-semibold text-label-primary mb-1">Points Amount</label>
                  <input
                    type="number"
                    value={awardAmount}
                    onChange={(e) => setAwardAmount(e.target.value)}
                    placeholder="e.g. 50 (or negative to deduct)"
                    className="input-field w-full py-2 px-3 text-sm font-mono"
                    required
                  />
                  <p className="text-[10px] text-label-secondary mt-1">
                    Enter positive value to award (+50), or negative value to deduct (-20).
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-label-primary mb-1">Category</label>
                  <HeroUISelect
                    value={awardCategory}
                    onChange={setAwardCategory}
                    options={[
                      { value: 'Bonus', label: 'Bonus & Club Merit' },
                      { value: 'Attendance', label: 'Club Hour / Session' },
                      { value: 'Coding', label: 'Coding Challenge Mastery' },
                      { value: 'Contest', label: 'Contest & Hackathon' },
                      { value: 'Course', label: 'Course Quest' },
                      { value: 'Adjustment', label: 'Administrative Adjustment' },
                    ]}
                    size="sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-label-primary mb-1">Title / Milestone</label>
                  <input
                    type="text"
                    value={awardTitle}
                    onChange={(e) => setAwardTitle(e.target.value)}
                    placeholder="e.g. Outstanding Hackathon Performance"
                    className="input-field w-full py-2 px-3"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-label-primary mb-1">
                    Admin Notes / Description (Optional)
                  </label>
                  <textarea
                    value={awardDescription}
                    onChange={(e) => setAwardDescription(e.target.value)}
                    placeholder="Detailed explanation or audit notes..."
                    rows={2}
                    className="input-field w-full py-2 px-3 resize-none"
                  />
                </div>

                <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onPress={() => setIsAwardModalOpen(false)}
                    className="font-semibold w-full sm:w-auto text-center"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isDisabled={isSubmittingAward}
                    isLoading={isSubmittingAward}
                    className="font-semibold flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  >
                    <Sparkles size={14} />
                    <span>Confirm Award</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PointsPage;
