import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Star,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  User,
  Calendar,
  Filter,
  Trash2,
  Sparkles,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import useFeedbackStore from '../../store/useFeedbackStore';
import useAuthStore from '../../store/useAuthStore';
import useProfileStore from '../../store/useProfileStore';
import SubmitFeedbackModal from './SubmitFeedbackModal';
import toast from 'react-hot-toast';

const FeedbackDashboard = () => {
  const {
    feedbacks,
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

  const effectiveRole = profile?.role || user?.role || 'Student';
  const isSuperAdmin = effectiveRole === 'SuperAdmin';
  const isAdmin = isSuperAdmin || effectiveRole === 'Admin' || effectiveRole === 'Faculty';

  useEffect(() => {
    fetchFeedbacks();
    fetchFeedbackStats();
  }, [fetchFeedbacks, fetchFeedbackStats]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this feedback entry?')) {
      const res = await deleteFeedback(id);
      if (res.success) {
        toast.success('Feedback entry removed');
      } else {
        toast.error(res.error || 'Failed to delete feedback');
      }
    }
  };

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const authorName = fb.user?.name || '';
    const authorRoll = fb.user?.rollNo || '';
    const commentText = fb.comment || '';
    const cat = fb.category || '';
    return (
      authorName.toLowerCase().includes(q) ||
      authorRoll.toLowerCase().includes(q) ||
      commentText.toLowerCase().includes(q) ||
      cat.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Role-Based Clearance Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          isSuperAdminView
            ? 'bg-purple-500/10 border-purple-500/30'
            : 'bg-blue-500/10 border-blue-500/30'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isSuperAdminView
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
            }`}
          >
            {isSuperAdminView ? <ShieldCheck size={20} /> : <Lock size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                  isSuperAdminView
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}
              >
                {isSuperAdminView ? 'SuperAdmin Clearance' : 'Standard Admin Privacy Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {privacyNotice ||
                (isSuperAdminView
                  ? 'SuperAdmin identity unmasking enabled: Full student profile references are populated for moderation.'
                  : 'Standard Administrator view: Student identities are strictly anonymized to protect student privacy.')}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchFeedbacks();
            fetchFeedbackStats();
          }}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 self-start sm:self-center border border-white/5"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Metrics Summary Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stellar-glass p-5 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Total Feedbacks
            </p>
            <p className="text-2xl font-black text-white">{stats.totalFeedbacks}</p>
          </div>

          <div className="stellar-glass p-5 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Average Rating
            </p>
            <p className="text-2xl font-black text-amber-400 flex items-center gap-1.5">
              <Star size={20} className="fill-amber-400 text-amber-400" />
              {stats.averageRating} / 5
            </p>
          </div>

          <div className="stellar-glass p-5 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Event Reviews
            </p>
            <p className="text-2xl font-black text-purple-400">{stats.eventFeedbacks}</p>
          </div>

          <div className="stellar-glass p-5 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              General Feedback
            </p>
            <p className="text-2xl font-black text-blue-400">{stats.clubGeneralFeedbacks}</p>
          </div>
        </div>
      )}

      {/* Control Bar: Filters & Submit Button */}
      <div className="stellar-glass p-6 sm:p-7 relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Student Feedback & Reviews</h3>
              <p className="text-xs text-slate-400">
                Continuous insights gathered across club workshops, contests, and general operations
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl focus-within:border-blue-500/40 transition-all">
              <Search size={14} className="text-slate-500" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none text-xs text-white focus:outline-none placeholder-slate-600 w-36 sm:w-44"
              />
            </div>

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="stellar-btn py-2.5 px-5 text-xs font-black flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              <Plus size={16} /> Submit Feedback
            </button>
          </div>
        </div>

        {/* Filter Badges Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Context:</span>
          {['All', 'ClubGeneral', 'Event'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === type
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {type === 'All' ? 'All Contexts' : type === 'ClubGeneral' ? 'Club General' : 'Event Specific'}
            </button>
          ))}

          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-2">Rating:</span>
          {[null, 5, 4, 3, 2, 1].map((r) => (
            <button
              key={r === null ? 'all' : r}
              onClick={() => setRatingFilter(r)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                ratingFilter === r
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {r === null ? 'All' : `${r}★`}
            </button>
          ))}
        </div>
      </div>

      {/* Feedbacks Stream Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stellar-glass p-6 animate-pulse space-y-4">
              <div className="h-5 bg-white/10 rounded-lg w-1/3" />
              <div className="h-12 bg-white/5 rounded-xl w-full" />
              <div className="h-6 bg-white/5 rounded-lg w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="stellar-glass p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
            <MessageSquare size={28} />
          </div>
          <h3 className="text-lg font-black text-white">No Feedback Entries Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No student feedback matches the selected filters. Be the first to submit a review!
          </p>
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="stellar-btn py-2 px-5 text-xs font-black inline-flex items-center gap-2 mt-2"
          >
            <Plus size={15} /> Submit Feedback
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence>
            {filteredFeedbacks.map((fb) => {
              const student = fb.user || {};
              const isAnon = fb.isAnonymous;

              return (
                <motion.div
                  key={fb._id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="stellar-glass p-6 flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-300 space-y-4"
                >
                  {/* Top Header: Stars, Context & Tag */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={16}
                            className={
                              s <= fb.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700'
                            }
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            fb.type === 'Event'
                              ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}
                        >
                          {fb.type === 'Event' ? 'Event Feedback' : 'Club General'}
                        </span>

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(fb._id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete Feedback"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Event Tag if Event Feedback */}
                    {fb.event && (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-white/5 p-2 rounded-xl border border-white/5">
                        <Calendar size={13} className="text-purple-400" />
                        <span className="line-clamp-1">{fb.event.title}</span>
                      </div>
                    )}

                    {/* Feedback Comment */}
                    <p className="text-sm text-white font-medium leading-relaxed">
                      "{fb.comment}"
                    </p>
                  </div>

                  {/* Attribution Footer with Anonymity vs SuperAdmin Disclosure */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    {/* User Attribution Card */}
                    <div className="flex items-center gap-3">
                      {isAnon ? (
                        /* Masked Anonymous Display for Standard Admins */
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                          <Lock size={14} />
                        </div>
                      ) : (
                        /* Unmasked Display for SuperAdmin */
                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-black text-purple-300 text-xs">
                          {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-black text-white flex items-center gap-2">
                          {isAnon ? 'Anonymous Student' : student.name || 'Student Member'}
                          {isAnon ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full bg-white/5 text-slate-400 border border-white/5">
                              Identity Masked
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Attributed
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {isAnon ? 'ANONYMOUS ROLL' : `${student.rollNo || ''} • ${student.department || student.email || ''}`}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-500">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
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
