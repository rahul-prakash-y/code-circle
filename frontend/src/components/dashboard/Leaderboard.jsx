import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Search,
  X,
  Code2,
  CalendarCheck,
  Sparkles,
  Flame,
  Filter,
  RefreshCw,
  User,
  Zap,
  TrendingUp,
  Award,
  ChevronDown,
} from 'lucide-react';
import useAnalyticsStore from '../../store/useAnalyticsStore';
import useAuthStore from '../../store/useAuthStore';
import { TableSkeleton } from '../ui/LoadingSkeleton';

// ── 3D Olympic Podium Component for Top 3 ──────────────────────────────
const PodiumPedestal = ({ user, rank, isCurrentUser }) => {
  const isFirst = rank === 1;
  const isSecond = rank === 2;

  const points = user.totalPoints ?? user.points ?? 0;
  const problems = user.problemsSolved ?? 0;
  const events = user.eventsAttended ?? 0;
  const dept = user.department || 'General';

  // Styling configurations for Gold, Silver, and Bronze
  const config = isFirst
    ? {
        pedestalHeight: 'h-40 sm:h-48',
        pedestalBg: 'bg-gradient-to-t from-amber-500/25 via-amber-500/10 to-amber-500/5 dark:from-amber-500/20 dark:via-amber-500/10 dark:to-transparent',
        pedestalBorder: 'border-t-2 border-x border-amber-400/60 dark:border-amber-400/40',
        ring: 'ring-4 ring-amber-400 shadow-xl shadow-amber-400/20',
        badgeBg: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/30',
        badgeText: '#1 Champion',
        icon: <Crown size={22} className="text-amber-500 fill-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" />,
        numeral: 'I',
        numeralColor: 'text-amber-500/30 dark:text-amber-400/20',
        aura: 'bg-amber-400/10 dark:bg-amber-400/5',
        order: 'order-1 sm:order-2',
        mt: '-mt-4 sm:-mt-8',
      }
    : isSecond
    ? {
        pedestalHeight: 'h-28 sm:h-36',
        pedestalBg: 'bg-gradient-to-t from-slate-400/20 via-slate-400/10 to-transparent dark:from-slate-400/15 dark:via-slate-400/5 dark:to-transparent',
        pedestalBorder: 'border-t-2 border-x border-slate-300 dark:border-slate-600',
        ring: 'ring-4 ring-slate-300 dark:ring-slate-500 shadow-lg shadow-slate-400/15',
        badgeBg: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600',
        badgeText: '#2 Runner-up',
        icon: <Medal size={20} className="text-slate-400 fill-slate-300 dark:text-slate-300 dark:fill-slate-400" />,
        numeral: 'II',
        numeralColor: 'text-slate-400/30 dark:text-slate-400/20',
        aura: 'bg-slate-400/10 dark:bg-slate-400/5',
        order: 'order-2 sm:order-1',
        mt: 'mt-0 sm:mt-2',
      }
    : {
        pedestalHeight: 'h-20 sm:h-28',
        pedestalBg: 'bg-gradient-to-t from-amber-700/20 via-amber-700/10 to-transparent dark:from-amber-700/15 dark:via-amber-700/5 dark:to-transparent',
        pedestalBorder: 'border-t-2 border-x border-amber-700/40 dark:border-amber-700/30',
        ring: 'ring-4 ring-amber-700/60 shadow-lg shadow-amber-800/15',
        badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-700/30',
        badgeText: '#3 Bronze',
        icon: <Medal size={20} className="text-amber-700 fill-amber-600 dark:text-amber-500 dark:fill-amber-600" />,
        numeral: 'III',
        numeralColor: 'text-amber-700/30 dark:text-amber-700/20',
        order: 'order-3 sm:order-3',
        mt: 'mt-0 sm:mt-8',
      };

  return (
    <div className={`flex flex-col items-center flex-1 min-w-[180px] max-w-[260px] ${config.order} ${config.mt} relative group`}>
      {/* Decorative Aura */}
      <div className={`absolute top-6 w-32 h-32 rounded-full ${config.aura} blur-2xl pointer-events-none -z-10`} />

      {/* Profile & Avatar Pod */}
      <div className="relative mb-3 flex flex-col items-center">
        {/* Floating Crown / Medal Icon */}
        <div className="mb-1.5 transition-transform duration-300 group-hover:scale-115">
          {config.icon}
        </div>

        {/* Circular Avatar */}
        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-surface-secondary border border-separator ${config.ring} transition-all duration-300 group-hover:shadow-2xl flex items-center justify-center relative`}>
          {user.profilePicUrl ? (
            <img src={user.profilePicUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-extrabold text-2xl text-label-primary bg-surface-raised">
              {user.name ? user.name[0]?.toUpperCase() : 'U'}
            </div>
          )}

          {isCurrentUser && (
            <span className="absolute bottom-1 right-1 px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-primary text-white shadow-xs">
              You
            </span>
          )}
        </div>

        {/* Rank Pill Tag */}
        <div className={`-mt-3 z-10 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${config.badgeBg} flex items-center gap-1 shadow-sm`}>
          <span>{config.badgeText}</span>
        </div>
      </div>

      {/* Student Details */}
      <div className="text-center w-full px-2 space-y-1 mb-3">
        <h4 className="text-label-primary font-bold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
          {user.name}
        </h4>
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-label-tertiary font-mono">{user.rollNo}</span>
          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-surface-secondary border border-separator text-label-secondary">
            {dept}
          </span>
        </div>

        {/* Engagement Chips */}
        <div className="flex items-center justify-center gap-2 pt-1 text-[10px] text-label-secondary font-medium">
          {problems > 0 && (
            <span className="inline-flex items-center gap-1">
              <Code2 size={11} className="text-blue-500" />
              <span>{problems} solved</span>
            </span>
          )}
          {events > 0 && (
            <span className="inline-flex items-center gap-1">
              <CalendarCheck size={11} className="text-purple-500" />
              <span>{events} events</span>
            </span>
          )}
        </div>
      </div>

      {/* 3D Tiered Pedestal Block */}
      <div
        className={`w-full ${config.pedestalHeight} ${config.pedestalBg} ${config.pedestalBorder} rounded-t-2xl sm:rounded-t-3xl flex flex-col items-center justify-between py-3 px-2 shadow-card backdrop-blur-sm relative overflow-hidden transition-all duration-300 group-hover:brightness-105`}
      >
        {/* Roman Numeral watermark */}
        <span className={`text-4xl sm:text-6xl font-black font-mono select-none ${config.numeralColor}`}>
          {config.numeral}
        </span>

        {/* Score Badge at base */}
        <div className="bg-surface/90 dark:bg-surface-raised/90 backdrop-blur-md border border-separator rounded-xl px-3 py-1.5 shadow-xs text-center w-full max-w-[130px]">
          <span className="text-base sm:text-xl font-extrabold text-label-primary tracking-tight">
            {points.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-label-tertiary uppercase ml-1">pts</span>
        </div>
      </div>
    </div>
  );
};

// ── Main Leaderboard Component ──────────────────────────────────────────
export const Leaderboard = () => {
  const { leaderboard, loading, fetchLeaderboard } = useAnalyticsStore();
  const { user } = useAuthStore();

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [sortBy, setSortBy] = useState('points'); // 'points' | 'problems' | 'events'

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Extract unique departments from leaderboard data
  const availableDepartments = useMemo(() => {
    const depts = new Set(['All']);
    leaderboard.forEach((entry) => {
      if (entry.department) depts.add(entry.department.trim());
    });
    return Array.from(depts);
  }, [leaderboard]);

  // Current logged in user info
  const currentUserId = user?._id || user?.id;
  const currentUserRoll = user?.rollNo?.toLowerCase()?.trim();

  // Sort and filter leaderboard entries
  const processedLeaderboard = useMemo(() => {
    let list = [...leaderboard];

    // Department Filter
    if (selectedDept !== 'All') {
      list = list.filter(
        (entry) =>
          entry.department &&
          entry.department.toLowerCase().trim() === selectedDept.toLowerCase().trim()
      );
    }

    // Search Query (name, rollNo, department)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (entry) =>
          (entry.name && entry.name.toLowerCase().includes(q)) ||
          (entry.rollNo && entry.rollNo.toLowerCase().includes(q)) ||
          (entry.department && entry.department.toLowerCase().includes(q))
      );
    }

    // Sort order
    list.sort((a, b) => {
      if (sortBy === 'problems') {
        const pA = a.problemsSolved ?? 0;
        const pB = b.problemsSolved ?? 0;
        if (pB !== pA) return pB - pA;
      } else if (sortBy === 'events') {
        const eA = a.eventsAttended ?? 0;
        const eB = b.eventsAttended ?? 0;
        if (eB !== eA) return eB - eA;
      }
      const scoreA = a.totalPoints ?? a.points ?? 0;
      const scoreB = b.totalPoints ?? b.points ?? 0;
      return scoreB - scoreA;
    });

    return list;
  }, [leaderboard, selectedDept, search, sortBy]);

  // Top 3 for Podium
  const top3 = useMemo(() => {
    return processedLeaderboard.slice(0, 3);
  }, [processedLeaderboard]);

  // Remainder for Table
  const rankedRest = useMemo(() => {
    return processedLeaderboard.slice(3);
  }, [processedLeaderboard]);

  // Compute Current User Rank & Standing
  const currentUserStanding = useMemo(() => {
    if (!currentUserId && !currentUserRoll) return null;
    const index = leaderboard.findIndex((entry) => {
      if (currentUserId && (entry._id === currentUserId || entry.user?._id === currentUserId)) return true;
      if (currentUserRoll && entry.rollNo?.toLowerCase()?.trim() === currentUserRoll) return true;
      return false;
    });

    if (index === -1) return null;
    const entry = leaderboard[index];
    const rank = index + 1;
    const percentile = Math.max(1, Math.round((rank / Math.max(leaderboard.length, 1)) * 100));

    return {
      entry,
      rank,
      percentile,
    };
  }, [leaderboard, currentUserId, currentUserRoll]);

  // KPI Metrics Computed
  const stats = useMemo(() => {
    if (leaderboard.length === 0) return null;
    const topScore = Math.max(...leaderboard.map((u) => u.totalPoints ?? u.points ?? 0));
    const totalPoints = leaderboard.reduce((acc, u) => acc + (u.totalPoints ?? u.points ?? 0), 0);
    const avgScore = Math.round(totalPoints / leaderboard.length);

    // Most active department
    const deptCount = {};
    leaderboard.forEach((u) => {
      const d = u.department || 'General';
      deptCount[d] = (deptCount[d] || 0) + 1;
    });
    const topDept = Object.keys(deptCount).reduce((a, b) =>
      deptCount[a] > deptCount[b] ? a : b
    );

    return {
      topScore,
      totalCompetitors: leaderboard.length,
      avgScore,
      topDept,
    };
  }, [leaderboard]);

  if (loading && leaderboard.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface rounded-2xl border border-separator animate-pulse" />
          ))}
        </div>
        <div className="bg-surface rounded-3xl border border-separator p-6 sm:p-10 shadow-card">
          <TableSkeleton rows={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── KPI Summary Cards Strip ───────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Champion Top Score */}
          <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-label-tertiary">
                Top Score #1
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xs">
                <Crown size={17} />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-label-primary tracking-tight">
                {stats.topScore.toLocaleString()}
                <span className="text-xs font-semibold text-label-tertiary ml-1.5 uppercase">pts</span>
              </p>
              <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                <Sparkles size={11} /> Leaderboard peak
              </p>
            </div>
          </div>

          {/* 2. Total Ranked Students */}
          <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-label-tertiary">
                Ranked Scholars
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                <Trophy size={17} />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-label-primary tracking-tight">
                {stats.totalCompetitors}
              </p>
              <p className="text-[11px] font-medium text-label-secondary mt-0.5">
                Active problem-solvers
              </p>
            </div>
          </div>

          {/* 3. Average Score */}
          <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-label-tertiary">
                Average Points
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xs">
                <TrendingUp size={17} />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-label-primary tracking-tight">
                {stats.avgScore.toLocaleString()}
                <span className="text-xs font-semibold text-label-tertiary ml-1.5 uppercase">pts</span>
              </p>
              <p className="text-[11px] font-medium text-label-secondary mt-0.5">
                Across all departments
              </p>
            </div>
          </div>

          {/* 4. Top Department */}
          <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-label-tertiary">
                Leading Branch
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <Flame size={17} />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-label-primary tracking-tight truncate">
                {stats.topDept}
              </p>
              <p className="text-[11px] font-medium text-label-secondary mt-0.5">
                Highest engagement volume
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Personal Standing Spotlight Banner (if logged in) ──────── */}
      {currentUserStanding && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/10 via-surface to-primary/5 border border-primary/25 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            {/* Rank Badge pod */}
            <div className="w-14 h-14 rounded-2xl bg-primary text-white shadow-md shadow-primary/25 flex flex-col items-center justify-center shrink-0">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Rank</span>
              <span className="text-xl font-black leading-none">#{currentUserStanding.rank}</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-extrabold text-label-primary">
                  {currentUserStanding.entry.name}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                  Your Standing
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-surface-secondary text-label-secondary border border-separator">
                  Top {currentUserStanding.percentile}%
                </span>
              </div>
              <p className="text-xs text-label-secondary font-mono">
                {currentUserStanding.entry.rollNo} • {currentUserStanding.entry.department || 'Student'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 self-start sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 border-separator w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-label-tertiary block">
                Total Score
              </span>
              <span className="text-xl sm:text-2xl font-black text-primary">
                {(currentUserStanding.entry.totalPoints ?? currentUserStanding.entry.points ?? 0).toLocaleString()}
                <span className="text-xs font-bold text-label-tertiary ml-1">pts</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="px-2.5 py-1.5 rounded-xl bg-surface border border-separator shadow-xs text-center">
                <div className="text-[10px] text-label-tertiary font-bold">SOLVED</div>
                <div className="font-extrabold text-label-primary">
                  {currentUserStanding.entry.problemsSolved ?? 0}
                </div>
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-surface border border-separator shadow-xs text-center">
                <div className="text-[10px] text-label-tertiary font-bold">EVENTS</div>
                <div className="font-extrabold text-label-primary">
                  {currentUserStanding.entry.eventsAttended ?? 0}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 3D Olympic Podium: Hall of Champions (Top 3) ────────────── */}
      {top3.length > 0 && (
        <div className="bg-surface rounded-3xl border border-separator shadow-card p-6 sm:p-10 relative overflow-hidden">
          {/* Subtle top ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/5 blur-3xl pointer-events-none" />

          {/* Podium Title */}
          <div className="text-center space-y-1 mb-8 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Crown size={13} />
              <span>Hall of Champions</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-label-primary tracking-tight">
              Top Academic Performers
            </h3>
            <p className="text-xs text-label-secondary max-w-md mx-auto">
              Leading the club with outstanding problem-solving dedication and consistent event participation
            </p>
          </div>

          {/* Podiums Row */}
          <div className="flex flex-col sm:flex-row justify-center items-end gap-6 sm:gap-4 md:gap-8 pt-4 pb-2 relative z-10">
            {/* Rank 2 (Silver) */}
            {top3[1] && (
              <PodiumPedestal
                user={top3[1]}
                rank={2}
                isCurrentUser={
                  (currentUserId && (top3[1]._id === currentUserId || top3[1].user?._id === currentUserId)) ||
                  (currentUserRoll && top3[1].rollNo?.toLowerCase()?.trim() === currentUserRoll)
                }
              />
            )}

            {/* Rank 1 (Gold Champion) */}
            {top3[0] && (
              <PodiumPedestal
                user={top3[0]}
                rank={1}
                isCurrentUser={
                  (currentUserId && (top3[0]._id === currentUserId || top3[0].user?._id === currentUserId)) ||
                  (currentUserRoll && top3[0].rollNo?.toLowerCase()?.trim() === currentUserRoll)
                }
              />
            )}

            {/* Rank 3 (Bronze) */}
            {top3[2] && (
              <PodiumPedestal
                user={top3[2]}
                rank={3}
                isCurrentUser={
                  (currentUserId && (top3[2]._id === currentUserId || top3[2].user?._id === currentUserId)) ||
                  (currentUserRoll && top3[2].rollNo?.toLowerCase()?.trim() === currentUserRoll)
                }
              />
            )}
          </div>
        </div>
      )}

      {/* ── Filter & Search Control Bar ─────────────────────────────── */}
      <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Filter size={15} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-label-primary">Rankings & Department Directory</h4>
              <p className="text-[11px] text-label-secondary">
                Showing {processedLeaderboard.length} of {leaderboard.length} scholars
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex items-center w-full sm:w-56">
              <Search size={14} className="absolute left-3 text-label-tertiary pointer-events-none" />
              <input
                type="text"
                placeholder="Search name or roll no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8.5 pr-8 py-2 bg-surface-secondary border border-separator rounded-xl text-xs text-label-primary placeholder:text-label-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 text-label-tertiary hover:text-label-primary p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchLeaderboard()}
              disabled={loading}
              className="p-2 rounded-xl bg-surface-secondary hover:bg-surface border border-separator text-label-secondary hover:text-label-primary transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Refresh Leaderboard"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-primary' : ''} />
            </button>
          </div>
        </div>

        {/* Filter Badges Row: Departments & Sort Modes */}
        <div className="pt-3 border-t border-separator flex flex-wrap items-center justify-between gap-3">
          {/* Department Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-label-tertiary mr-1">
              Branch:
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {availableDepartments.map((dept) => {
                const isActive = selectedDept === dept;
                return (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary text-white shadow-xs font-bold'
                        : 'bg-surface-secondary text-label-secondary hover:text-label-primary border border-separator'
                    }`}
                  >
                    {dept}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort Criteria Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-label-tertiary mr-1">
              Sort By:
            </span>
            <div className="inline-flex p-1 bg-surface-secondary border border-separator rounded-xl gap-1">
              {[
                { id: 'points', label: 'Points' },
                { id: 'problems', label: 'Problems' },
                { id: 'events', label: 'Events' },
              ].map(({ id, label }) => {
                const isActive = sortBy === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSortBy(id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-surface text-primary shadow-xs border border-separator font-bold'
                        : 'text-label-secondary hover:text-label-primary'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Rankings Table (Rank #4 and beyond) ─────────────────────── */}
      <div className="bg-surface rounded-2xl sm:rounded-3xl border border-separator shadow-card overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-6 py-3.5 bg-surface-secondary border-b border-separator text-[11px] font-bold uppercase tracking-wider text-label-secondary">
          <div className="col-span-2 sm:col-span-1 text-center">Rank</div>
          <div className="col-span-6 sm:col-span-5">Student</div>
          <div className="hidden sm:block sm:col-span-2 text-center">Problems</div>
          <div className="hidden sm:block sm:col-span-2 text-center">Events</div>
          <div className="col-span-4 sm:col-span-2 text-right">Total Score</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-separator max-h-[600px] overflow-y-auto">
          {rankedRest.map((u, index) => {
            const actualRank = index + 4;
            const points = u.totalPoints ?? u.points ?? 0;
            const problems = u.problemsSolved ?? 0;
            const events = u.eventsAttended ?? 0;
            const dept = u.department || 'General';

            const isMe =
              (currentUserId && (u._id === currentUserId || u.user?._id === currentUserId)) ||
              (currentUserRoll && u.rollNo?.toLowerCase()?.trim() === currentUserRoll);

            return (
              <div
                key={u._id || index}
                className={`grid grid-cols-12 px-6 py-3.5 items-center group transition-colors duration-150 ${
                  isMe
                    ? 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary'
                    : 'hover:bg-surface-secondary/70'
                }`}
              >
                {/* Rank Column */}
                <div className="col-span-2 sm:col-span-1 flex justify-center">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg select-none ${
                      actualRank <= 10
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-label-tertiary'
                    }`}
                  >
                    #{actualRank}
                  </span>
                </div>

                {/* Student Info */}
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-surface-secondary border border-separator flex items-center justify-center text-xs font-bold text-label-secondary shrink-0 shadow-xs">
                    {u.profilePicUrl ? (
                      <img src={u.profilePicUrl} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-label-primary font-bold">
                        {u.name ? u.name[0]?.toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-label-primary font-semibold text-xs sm:text-sm truncate group-hover:text-primary transition-colors">
                        {u.name}
                      </span>
                      {isMe && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-primary text-white">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-label-tertiary font-mono">
                      <span>{u.rollNo}</span>
                      <span>•</span>
                      <span className="uppercase text-label-secondary font-sans font-semibold text-[10px]">
                        {dept}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Problems Solved */}
                <div className="hidden sm:flex sm:col-span-2 items-center justify-center gap-1 text-xs font-semibold text-label-secondary">
                  <Code2 size={13} className="text-blue-500" />
                  <span>{problems}</span>
                </div>

                {/* Events Attended */}
                <div className="hidden sm:flex sm:col-span-2 items-center justify-center gap-1 text-xs font-semibold text-label-secondary">
                  <CalendarCheck size={13} className="text-purple-500" />
                  <span>{events}</span>
                </div>

                {/* Points Column */}
                <div className="col-span-4 sm:col-span-2 text-right">
                  <span className="text-label-primary font-extrabold text-sm sm:text-base group-hover:text-primary transition-colors">
                    {points.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-label-tertiary uppercase font-bold ml-1">pts</span>
                </div>
              </div>
            );
          })}

          {/* When only top 3 or no rest */}
          {rankedRest.length === 0 && processedLeaderboard.length > 0 && (
            <div className="p-8 text-center text-xs text-label-secondary">
              All currently filtered scholars are highlighted on the podium above.
            </div>
          )}

          {/* Empty search results */}
          {processedLeaderboard.length === 0 && (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-secondary border border-separator text-label-tertiary flex items-center justify-center mx-auto">
                <Trophy size={22} />
              </div>
              <h4 className="text-sm font-bold text-label-primary">No Scholars Found</h4>
              <p className="text-xs text-label-secondary max-w-xs mx-auto">
                No students match your filter or search query. Try switching branches or clearing the search.
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedDept('All');
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-primary text-white shadow-xs cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
