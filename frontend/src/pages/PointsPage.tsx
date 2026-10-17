import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  Loader2,
  HelpCircle,
  TrendingUp,
  BarChart3,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { format } from 'date-fns';
import { formatISTDateTime } from '../lib/dateUtils';
import toast from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import usePointsStore, { StudentPointsData, AdminStudentItem } from '../store/usePointsStore';

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

  // Active view tab for admins (Student View vs Admin Management)
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');

  // Student ledger filter
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Admin roster filters
  const [adminSearch, setAdminSearch] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modals state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isAwardModalOpen, setIsAwardModalOpen] = useState<boolean>(false);
  const [targetStudent, setTargetStudent] = useState<AdminStudentItem | null>(null);

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
      fetchAdminStudents({
        search: adminSearch,
        department: deptFilter,
        year: yearFilter,
        sortOrder,
      });
    }
  }, [fetchMyPoints, fetchAdminOverview, fetchAdminStudents, isAdmin]);

  // Debounced/Triggered admin roster query on filter change
  useEffect(() => {
    if (isAdmin && activeTab === 'admin') {
      const timer = setTimeout(() => {
        fetchAdminStudents({
          search: adminSearch,
          department: deptFilter,
          year: yearFilter,
          sortOrder,
        });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [adminSearch, deptFilter, yearFilter, sortOrder, activeTab, isAdmin, fetchAdminStudents]);

  // Open audit modal for student
  const handleOpenAudit = async (studentId: string, studentBasic?: AdminStudentItem) => {
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
  const handleOpenAward = (student: AdminStudentItem) => {
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
      // Refresh current table
      fetchAdminStudents({
        search: adminSearch,
        department: deptFilter,
        year: yearFilter,
        sortOrder,
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
          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex p-1 rounded-xl bg-surface-secondary border border-separator shadow-sm shrink-0">
            <button
              onClick={() => setActiveTab('student')}
              className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
                activeTab === 'student'
                  ? 'bg-surface text-label-primary shadow-sm border border-separator'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              My Points
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                activeTab === 'admin'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Admin Console</span>
            </button>
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
                background: myPointsData?.tier.color || '#0071E3',
              }}
            />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-surface-secondary border border-separator">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: myPointsData?.tier.color || '#0071E3' }}
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
                      style={{ backgroundColor: myPointsData?.tier.color || '#0071E3' }}
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
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <CalendarCheck size={18} />
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  +{myPointsData?.summary?.attendance?.points ?? 0} pts
                </span>
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
                <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  +{myPointsData?.summary?.coding?.points ?? 0} pts
                </span>
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
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  +{myPointsData?.summary?.contests?.points ?? 0} pts
                </span>
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
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  +{myPointsData?.summary?.assessment?.points ?? 0} pts
                </span>
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
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  +{(myPointsData?.summary?.courses?.points ?? 0) + (myPointsData?.summary?.bonus?.points ?? 0)} pts
                </span>
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
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        categoryFilter === cat
                          ? 'bg-surface text-label-primary shadow-xs border border-separator'
                          : 'text-label-secondary hover:text-label-primary'
                      }`}
                    >
                      {cat === 'all'
                        ? 'All'
                        : cat === 'attendance'
                        ? 'Club Hours'
                        : cat === 'assessment'
                        ? 'MCQ Assessments'
                        : cat}
                    </button>
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
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                          : tx.category === 'Coding'
                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400'
                          : tx.category === 'Contest'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                          : tx.category === 'Course'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : tx.category === 'Assessment'
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                          : 'bg-accent/10 border-accent/20 text-accent'
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
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
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
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-surface-secondary border border-separator flex items-center justify-center mx-auto text-label-secondary mb-3">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-label-primary">No points recorded in this filter</h3>
                  <p className="text-xs text-label-secondary max-w-sm mx-auto mt-1">
                    Attend club sessions or submit coding challenges to begin logging your achievements.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADMIN VIEW: ADMIN POINTS CONSOLE */}
      {/* ========================================================================= */}
      {isAdmin && activeTab === 'admin' && (
        <div className="space-y-8">
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
                <Clock size={16} className="text-blue-500" />
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
                <TrendingUp size={16} className="text-emerald-500" />
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

          {/* Students Directory & Points Breakdown Table */}
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
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="Search name, roll no..."
                    className="input-field pl-9 pr-3 py-1.5 text-xs w-full"
                  />
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="input-field py-1.5 px-3 text-xs w-full sm:w-auto"
                  >
                    <option value="all">All Departments</option>
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="AI&DS">AI & DS</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>

                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="input-field py-1.5 px-3 text-xs w-full sm:w-auto"
                  >
                    <option value="all">All Years</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>

                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="input-field py-1.5 px-3 text-xs col-span-2 sm:col-auto w-full sm:w-auto"
                  >
                    <option value="desc">Highest Points First</option>
                    <option value="asc">Lowest Points First</option>
                  </select>
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
                        <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <Clock size={12} />
                          {s.totalClubHours || 0} hr{s.totalClubHours === 1 ? '' : 's'}
                        </span>
                        <span className="text-[10px] text-label-secondary block mt-0.5 whitespace-nowrap">
                          {s.sessionsCount || 0} session(s)
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
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
                              borderColor: s.tier?.color || '#0071E3',
                              color: s.tier?.color || '#0071E3',
                            }}
                          >
                            {s.tier?.name || 'Bronze'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenAudit(s._id, s)}
                            className="btn-secondary py-1.5 px-3 text-xs font-semibold cursor-pointer"
                          >
                            Points Audit
                          </button>
                          <button
                            onClick={() => handleOpenAward(s)}
                            className="btn-primary py-1.5 px-3 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={13} />
                            <span>Award</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {adminStudents.length === 0 && !loadingStudents && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-label-secondary">
                        No students match the current criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
              className="relative w-full max-w-3xl max-h-[92vh] flex flex-col surface rounded-2xl sm:rounded-[24px] border border-separator shadow-2xl overflow-hidden z-10"
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
                <button
                  onClick={handleCloseAudit}
                  className="w-8 h-8 rounded-full bg-surface-secondary border border-separator flex items-center justify-center text-label-secondary hover:text-label-primary cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
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
                        <p className="text-lg sm:text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
                          {selectedAudit.summary?.attendance?.totalClubHours || 0} hrs
                        </p>
                      </div>
                      <div className="p-3 sm:p-3.5 rounded-xl bg-surface-secondary border border-separator">
                        <span className="text-[10px] sm:text-[11px] text-label-secondary font-semibold">Tier</span>
                        <p
                          className="text-lg sm:text-xl font-bold uppercase"
                          style={{ color: selectedAudit.tier?.color || '#0071E3' }}
                        >
                          {selectedAudit.tier?.name || 'Bronze'}
                        </p>
                      </div>
                    </div>

                    {/* Breakdown Pillars */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                      <div className="p-2.5 sm:p-3 rounded-xl border border-separator bg-surface">
                        <span className="text-label-secondary block text-[11px]">Club Hours Pts:</span>
                        <span className="font-bold text-emerald-600 font-mono">
                          +{selectedAudit.summary?.attendance?.points || 0} pts
                        </span>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl border border-separator bg-surface">
                        <span className="text-label-secondary block text-[11px]">Coding Challenges:</span>
                        <span className="font-bold text-purple-600 font-mono">
                          +{selectedAudit.summary?.coding?.points || 0} pts
                        </span>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl border border-separator bg-surface">
                        <span className="text-label-secondary block text-[11px]">Contests:</span>
                        <span className="font-bold text-amber-600 font-mono">
                          +{selectedAudit.summary?.contests?.points || 0} pts
                        </span>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl border border-separator bg-surface">
                        <span className="text-label-secondary block text-[11px]">Course / Bonus:</span>
                        <span className="font-bold text-blue-600 font-mono">
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
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
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
                  <button
                    onClick={() => {
                      handleCloseAudit();
                      handleOpenAward(targetStudent);
                    }}
                    className="btn-primary py-2 px-4 text-xs font-semibold cursor-pointer w-full sm:w-auto text-center"
                  >
                    Award Merit Points
                  </button>
                )}
                <button
                  onClick={handleCloseAudit}
                  className="btn-secondary py-2 px-4 text-xs font-semibold cursor-pointer w-full sm:w-auto text-center"
                >
                  Close
                </button>
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
              className="relative w-full max-w-md max-h-[92vh] flex flex-col surface rounded-2xl sm:rounded-[24px] border border-separator shadow-2xl overflow-hidden z-10"
            >
              <div className="p-4 sm:p-5 border-b border-separator flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-label-primary truncate">Grant Merit Points</h3>
                  <p className="text-xs text-label-secondary truncate">
                    Award points directly to {targetStudent?.name} ({targetStudent?.rollNo})
                  </p>
                </div>
                <button
                  onClick={() => setIsAwardModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface-secondary border border-separator flex items-center justify-center text-label-secondary hover:text-label-primary cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
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
                  <select
                    value={awardCategory}
                    onChange={(e) => setAwardCategory(e.target.value)}
                    className="input-field w-full py-2 px-3"
                  >
                    <option value="Bonus">Bonus & Club Merit</option>
                    <option value="Attendance">Club Hour / Session</option>
                    <option value="Coding">Coding Challenge Mastery</option>
                    <option value="Contest">Contest & Hackathon</option>
                    <option value="Course">Course Quest</option>
                    <option value="Adjustment">Administrative Adjustment</option>
                  </select>
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
                  <button
                    type="button"
                    onClick={() => setIsAwardModalOpen(false)}
                    className="btn-secondary py-2 px-4 font-semibold cursor-pointer w-full sm:w-auto text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAward}
                    className="btn-primary py-2 px-5 font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                  >
                    {isSubmittingAward ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    <span>Confirm Award</span>
                  </button>
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
