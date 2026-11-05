import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Star,
  ShieldCheck,
  Lock,
  Calendar,
  Trash2,
  Sparkles,
  Plus,
  RefreshCw,
  Search,
  X,
  Filter,
} from 'lucide-react';
import useFeedbackStore from '../../store/useFeedbackStore';
import useAuthStore from '../../store/useAuthStore';
import useProfileStore from '../../store/useProfileStore';
import SubmitFeedbackModal from './SubmitFeedbackModal';
import Pagination from '../common/Pagination';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const FeedbackDashboard = () => {
  const {
    feedbacks,
    pagination,
    stats,
    isSuperAdminView,
    privacyNotice,
    loading,
    fetchFeedbacks,
    fetchFeedbackStats,
    deleteFeedback,
    typeFilter,
    setTypeFilter,
    ratingFilter,
    setRatingFilter,
  } = useFeedbackStore();

  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const effectiveRole = profile?.role || user?.role || 'Student';
  const isSuperAdminRole = effectiveRole?.toLowerCase() === 'superadmin';
  const isSuperAdmin = isSuperAdminRole || isSuperAdminView;
  const isAdmin = isSuperAdmin || ['admin', 'faculty', 'committee'].includes(effectiveRole?.toLowerCase());

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, ratingFilter]);

  useEffect(() => {
    fetchFeedbacks({ page, search: debouncedSearch });
    fetchFeedbackStats();
  }, [fetchFeedbacks, fetchFeedbackStats, page, debouncedSearch, typeFilter, ratingFilter]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this feedback entry?')) {
      const res = await deleteFeedback(id);
      if (res.success) {
        toast.success('Feedback entry removed successfully');
      } else {
        toast.error(res.error || 'Failed to delete feedback');
      }
    }
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => {
      const q = debouncedSearch.toLowerCase().trim();
      if (!q) return true;
      const authorName = isSuperAdmin ? (fb.user?.name || '') : 'anonymous';
      const authorRoll = isSuperAdmin ? (fb.user?.rollNo || '') : '';
      const commentText = fb.comment || '';
      const cat = fb.category || '';
      const eventTitle = fb.event?.title || '';
      return (
        authorName.toLowerCase().includes(q) ||
        authorRoll.toLowerCase().includes(q) ||
        commentText.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        eventTitle.toLowerCase().includes(q)
      );
    });
  }, [feedbacks, debouncedSearch, isSuperAdmin]);

  return (
    <div className="space-y-6">
      {/* Role-Based Clearance & Privacy Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs ${
          isSuperAdmin
            ? 'bg-purple-50/80 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-800/40'
            : 'bg-primary/5 dark:bg-primary/10 border-primary/20'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              isSuperAdmin
                ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25'
                : 'bg-primary/15 text-primary border border-primary/25'
            }`}
          >
            {isSuperAdmin ? <ShieldCheck size={20} /> : <Lock size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                  isSuperAdmin
                    ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30'
                    : 'bg-primary/15 text-primary border-primary/30'
                }`}
              >
                {isSuperAdmin
                  ? 'SuperAdmin Clearance'
                  : isAdmin
                  ? 'Administrative Review Mode'
                  : 'Community Safe Mode'}
              </span>
            </div>
            <p className="text-xs text-label-secondary mt-1 leading-relaxed max-w-2xl">
              {privacyNotice ||
                (isSuperAdmin
                  ? 'SuperAdmin identity unmasking enabled: Full student profile references are populated for moderation and audit.'
                  : 'Community privacy active: Student author identities remain shielded as anonymous.')}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchFeedbacks();
            fetchFeedbackStats();
          }}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-secondary text-xs font-semibold text-label-primary hover:text-primary transition-all flex items-center gap-2 self-start sm:self-center border border-separator shadow-xs cursor-pointer disabled:opacity-50"
          title="Reload latest reviews and metrics"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-primary' : 'text-label-tertiary'} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Summary Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Total Feedbacks */}
          <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-label-tertiary">
                Total Feedbacks
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                <MessageSquare size={16} />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-label-primary tracking-tight">
                {stats.totalFeedbacks}
              </p>
              <p className="text-[11px] font-medium text-label-secondary mt-0.5">
                All-time community entries
              </p>
            </div>
          </div>

          {/* 2. Average Rating */}
          <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-label-tertiary">
                Average Rating
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xs">
                <Star size={16} className="fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-label-primary tracking-tight">
                  {stats.averageRating}
                </span>
                <span className="text-xs font-semibold text-label-tertiary">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={11}
                    className={
                      s <= Math.round(stats.averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-separator fill-separator'
                    }
                  />
                ))}
                <span className="text-[10px] font-semibold text-label-secondary ml-1">Overall</span>
              </div>
            </div>
          </div>

          {/* 3. Event Reviews */}
          <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-label-tertiary">
                Event Reviews
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xs">
                <Calendar size={16} />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-label-primary tracking-tight">
                {stats.eventFeedbacks}
              </p>
              <p className="text-[11px] font-medium text-label-secondary mt-0.5">
                Workshops & hackathons
              </p>
            </div>
          </div>

          {/* 4. Club General */}
          <div className="bg-surface border border-separator rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-label-tertiary">
                Club General
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <Sparkles size={16} />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-label-primary tracking-tight">
                {stats.clubGeneralFeedbacks}
              </p>
              <p className="text-[11px] font-medium text-label-secondary mt-0.5">
                Platform & suggestions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Search, Filters & Action Button */}
      <div className="bg-surface border border-separator rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs shrink-0">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-label-primary">
                Student Feedback & Reviews
              </h3>
              <p className="text-xs text-label-secondary">
                Continuous insights gathered across club workshops, contests, and operations
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex items-center w-full sm:w-56">
              <Search size={14} className="absolute left-3 text-label-tertiary pointer-events-none" />
              <input
                type="text"
                placeholder="Search feedback..."
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

            {/* Submit Feedback CTA */}
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus size={15} />
              <span>Submit Feedback</span>
            </button>
          </div>
        </div>

        {/* Filters Row: Context Pills & Star Filters */}
        <div className="pt-4 border-t border-separator flex flex-wrap items-center justify-between gap-3">
          {/* Context Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-label-tertiary mr-1">
              Context:
            </span>
            <div className="inline-flex p-1 bg-surface-secondary border border-separator rounded-xl gap-1">
              {[
                { id: 'All', label: 'All Contexts' },
                { id: 'ClubGeneral', label: 'Club General' },
                { id: 'Event', label: 'Event Specific' },
              ].map(({ id, label }) => {
                const isActive = typeFilter === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTypeFilter(id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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

          {/* Rating Star Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-label-tertiary flex items-center gap-1 mr-1">
              <Filter size={12} />
              <span>Rating:</span>
            </span>
            {[null, 5, 4, 3, 2, 1].map((r) => {
              const isActive = ratingFilter === r;
              return (
                <button
                  key={r === null ? 'all' : r}
                  onClick={() => setRatingFilter(r)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold shadow-xs'
                      : 'bg-surface-secondary hover:bg-surface text-label-secondary hover:text-label-primary border border-separator'
                  }`}
                >
                  {r === null ? (
                    'All'
                  ) : (
                    <>
                      <span>{r}</span>
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feedbacks Stream Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-surface border border-separator rounded-2xl p-6 shadow-xs animate-pulse space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 bg-surface-secondary rounded-lg w-1/4" />
                <div className="h-4 bg-surface-secondary rounded-lg w-1/5" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 bg-surface-secondary rounded-md w-full" />
                <div className="h-3.5 bg-surface-secondary rounded-md w-4/5" />
              </div>
              <div className="pt-3 border-t border-separator flex items-center justify-between">
                <div className="h-8 w-8 bg-surface-secondary rounded-xl" />
                <div className="h-3 bg-surface-secondary rounded-md w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-surface border border-separator rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-xs">
            <MessageSquare size={26} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-label-primary">No Feedback Entries Found</h3>
            <p className="text-xs text-label-secondary max-w-sm mx-auto leading-relaxed">
              No student feedback matches the active search or filters. Be the first to share your thoughts!
            </p>
          </div>
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/25 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer mt-1"
          >
            <Plus size={15} />
            <span>Submit Feedback</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence>
            {filteredFeedbacks.map((fb) => {
              const isAnon = !isSuperAdmin;
              const student = isSuperAdmin ? fb.user || {} : { name: 'Anonymous Student' };
              const displayName = isSuperAdmin ? student.name || 'User' : 'Anonymous Student';

              return (
                <motion.div
                  key={fb._id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-surface border border-separator hover:border-primary/40 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 relative group"
                >
                  {/* Top Header: Stars, Rating Pill, Context & Category */}
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* 5-Star Visual */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={15}
                              className={
                                s <= fb.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-separator fill-separator'
                              }
                            />
                          ))}
                        </div>

                        {/* Rating Pill */}
                        <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-bold px-2 py-0.5 rounded-md font-mono">
                          {fb.rating}.0
                        </span>

                        {/* Category Tag if available */}
                        {fb.category && (
                          <span className="bg-surface-secondary text-label-secondary border border-separator text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            {fb.category}
                          </span>
                        )}
                      </div>

                      {/* Context Badge & Admin Delete Button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            fb.type === 'Event'
                              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                          }`}
                        >
                          {fb.type === 'Event' ? 'Event Review' : 'Club General'}
                        </span>

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(fb._id)}
                            className="p-1.5 rounded-lg text-label-tertiary hover:text-red-600 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                            title="Delete this feedback entry"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Event Banner Strip (if event-specific) */}
                    {fb.event && (
                      <div className="flex items-center justify-between gap-2 text-xs bg-surface-secondary px-3 py-2 rounded-xl border border-separator">
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
                          <span className="font-semibold text-label-primary truncate">
                            {fb.event.title}
                          </span>
                        </div>
                        {fb.event.date && (
                          <span className="text-[10px] text-label-tertiary font-mono shrink-0">
                            {new Date(fb.event.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Feedback Comment Body */}
                    <div className="relative pl-3.5 border-l-2 border-primary/25 py-0.5">
                      <p className="text-sm font-normal text-label-primary leading-relaxed whitespace-pre-wrap">
                        "{fb.comment}"
                      </p>
                    </div>
                  </div>

                  {/* Attribution Footer: Identity vs Anonymity */}
                  <div className="pt-3.5 border-t border-separator flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isAnon ? (
                        <div className="w-8 h-8 rounded-xl bg-surface-secondary border border-separator flex items-center justify-center text-label-tertiary shadow-xs shrink-0">
                          <Lock size={14} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center font-bold text-purple-700 dark:text-purple-300 text-xs shadow-xs shrink-0">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-label-primary truncate max-w-[140px] sm:max-w-[200px]">
                            {displayName}
                          </span>
                          {isAnon ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-secondary text-label-tertiary border border-separator shrink-0">
                              Anonymous
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 shrink-0">
                              Attributed
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-label-tertiary font-mono truncate">
                          {isAnon
                            ? 'Student Community Member'
                            : [student.rollNo, student.department, student.email].filter(Boolean).join(' • ')}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-medium text-label-tertiary shrink-0">
                      {new Date(fb.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      )}

      {/* Student Feedback Submission Modal */}
      {isSubmitModalOpen && (
        <SubmitFeedbackModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
        />
      )}
    </div>
  );
};

export default FeedbackDashboard;
