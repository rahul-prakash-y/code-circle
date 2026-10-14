import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  Unlock,
  ExternalLink,
  Loader2,
  User,
  Filter,
  Check,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import { formatISTDateTime, formatISTDate } from '../../lib/dateUtils';

interface AdminMissedEventRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MissedRequestItem {
  _id: string;
  student: {
    _id: string;
    id?: string;
    name: string;
    rollNo: string;
    email: string;
    department?: string;
    year?: string;
    points?: number;
    isRestricted?: boolean;
    restrictionReason?: string;
    restrictedFeatures?: string[];
  };
  event: {
    _id: string;
    title: string;
    type: string;
    date: string;
    hourlyPoints: number;
    venueOrLink?: string;
  };
  session?: {
    _id: string;
    sessionName: string;
    totalPoints: number;
  };
  missedDate: string;
  classHours: number[];
  clubHoursRequested: number;
  reason: string;
  proofUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: {
    name: string;
    role: string;
  };
  reviewNote?: string;
  createdAt: string;
}

export const AdminMissedEventRequestsModal: React.FC<
  AdminMissedEventRequestsModalProps
> = ({ isOpen, onClose }) => {
  const [requests, setRequests] = useState<MissedRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    restrictedStudents: number;
  }>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    restrictedStudents: 0,
  });

  // Action / Review Dialog State
  const [reviewingReq, setReviewingReq] = useState<MissedRequestItem | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [grantAttendance, setGrantAttendance] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
      loadRequests();
    }
  }, [isOpen, statusFilter]);

  const loadStats = async () => {
    try {
      const res = await api.get('/missed-event-requests/stats');
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadRequests = async (search = searchQuery) => {
    try {
      setLoading(true);
      const params: any = {
        status: statusFilter,
      };
      if (search.trim()) {
        params.search = search.trim();
      }
      const res = await api.get('/missed-event-requests', { params });
      setRequests(res.data?.data || []);
    } catch (err: any) {
      console.error('Failed to load requests:', err);
      toast.error('Failed to load missed event requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRequests(searchQuery);
  };

  const handleOpenReview = (req: MissedRequestItem, action: 'APPROVE' | 'REJECT') => {
    setReviewingReq(req);
    setReviewAction(action);
    setReviewNote(
      action === 'REJECT'
        ? 'Absence excuse unverified or invalid. Account restricted.'
        : 'Absence verified and approved.'
    );
    setGrantAttendance(Boolean(req.session));
  };

  const handleConfirmReview = async () => {
    if (!reviewingReq) return;

    try {
      setActionLoading(true);
      const res = await api.patch(`/missed-event-requests/${reviewingReq._id}/review`, {
        action: reviewAction,
        reviewNote: reviewNote.trim(),
        grantAttendance: reviewAction === 'APPROVE' ? grantAttendance : false,
      });

      if (reviewAction === 'REJECT') {
        toast.error(
          `Request rejected. Student ${reviewingReq.student.name} is now restricted from assessments, contests, and courses.`,
          { duration: 6000 }
        );
      } else {
        toast.success(`Request approved for ${reviewingReq.student.name}!`);
      }

      setReviewingReq(null);
      await loadStats();
      await loadRequests();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to review request';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockStudent = async (studentId: string, studentName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to lift all restrictions for ${studentName}? They will regain full access to assessments, contests, and courses.`
      )
    ) {
      return;
    }

    try {
      setUnblockingId(studentId);
      const res = await api.post(`/users/${studentId}/unblock-restrictions`);
      toast.success(res.data?.message || `Restrictions removed for ${studentName}!`);
      await loadStats();
      await loadRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to unblock student restrictions');
    } finally {
      setUnblockingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-[#141416] border border-white/[0.12] rounded-3xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/[0.08] bg-[#1A1A1D] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Missed Event Requests & Restriction Control
                </h2>
                <p className="text-xs text-neutral-400">
                  Review student absence justifications • Rejections enforce academic restrictions
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-6 py-4 bg-[#161619] border-b border-white/[0.06]">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Total Requests
              </span>
              <span className="text-xl font-extrabold text-white">{stats.total}</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
                Pending Review
              </span>
              <span className="text-xl font-extrabold text-amber-400">{stats.pending}</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
                Approved
              </span>
              <span className="text-xl font-extrabold text-emerald-400">{stats.approved}</span>
            </div>

            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider block">
                Restricted Students
              </span>
              <span className="text-xl font-extrabold text-rose-400">
                {stats.restrictedStudents}
              </span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="px-6 py-3.5 bg-[#18181B] border-b border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/[0.06] rounded-2xl w-full sm:w-auto overflow-x-auto">
              {(['PENDING', 'ALL', 'APPROVED', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === st
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'All Requests' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or roll no..."
                className="w-full bg-[#202024] border border-white/[0.08] rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-500"
              />
            </form>
          </div>

          {/* List of Requests */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {loading ? (
              <div className="py-20 text-center text-neutral-400 space-y-2">
                <Loader2 className="w-7 h-7 animate-spin mx-auto text-amber-500" />
                <p className="text-xs">Loading missed event requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-20 text-center text-neutral-500 space-y-2">
                <Calendar className="w-10 h-10 mx-auto text-neutral-600" />
                <p className="text-sm font-semibold text-neutral-300">No requests found</p>
                <p className="text-xs">
                  There are currently no requests matching the selected filter criteria.
                </p>
              </div>
            ) : (
              requests.map((req) => {
                const isStudentRestricted = Boolean(req.student?.isRestricted);
                const studentId = req.student?._id || (req.student as any)?.id;

                return (
                  <div
                    key={req._id}
                    className="p-5 rounded-2xl bg-[#1A1A1D] border border-white/[0.08] hover:border-white/[0.14] transition-all space-y-3.5"
                  >
                    {/* Top Row: Student Identity & Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.04] pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {req.student?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">
                              {req.student?.name || 'Unknown Student'}
                            </span>
                            <span className="text-xs font-mono text-neutral-400">
                              ({req.student?.rollNo || '—'})
                            </span>
                            {isStudentRestricted && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" />
                                Restricted
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400">
                            {req.student?.department || 'General'} • {req.student?.email} • Points:{' '}
                            <strong className="text-neutral-200">{req.student?.points || 0}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Status and Unblock action */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {req.status === 'APPROVED' && 'Approved'}
                          {req.status === 'REJECTED' && 'Rejected'}
                          {req.status === 'PENDING' && 'Pending Review'}
                        </span>

                        {isStudentRestricted && (
                          <button
                            type="button"
                            onClick={() => handleUnblockStudent(studentId, req.student.name)}
                            disabled={unblockingId === studentId}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                            title="Lift all restrictions on this student"
                          >
                            {unblockingId === studentId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                            <span>Unblock Student</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Event & Request Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-black/30 p-3.5 rounded-xl border border-white/[0.04]">
                      <div>
                        <span className="text-neutral-400 block mb-0.5">Event Missed:</span>
                        <strong className="text-white text-sm">
                          {req.event?.title || 'Unknown Event'}
                        </strong>
                        <p className="text-neutral-400 mt-0.5">
                          Date: {formatISTDate(req.missedDate)} • Type: {req.event?.type}
                        </p>
                      </div>

                      <div>
                        <span className="text-neutral-400 block mb-0.5">Requested Credit:</span>
                        <strong className="text-amber-400 text-sm">
                          {req.clubHoursRequested} Club Hour(s)
                        </strong>
                        <p className="text-neutral-400 mt-0.5">
                          Periods: {req.classHours?.join(', ') || '1'}
                        </p>
                      </div>
                    </div>

                    {/* Reason statement */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] text-xs text-neutral-300">
                      <span className="text-neutral-400 font-semibold block mb-0.5">
                        Student Justification:
                      </span>
                      {req.reason}
                    </div>

                    {/* Proof Link if attached */}
                    {req.proofUrl && (
                      <div className="text-xs">
                        <a
                          href={req.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-indigo-400 hover:underline font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Attached Proof / Document</span>
                        </a>
                      </div>
                    )}

                    {/* Review Note Display if already reviewed */}
                    {req.reviewNote && (
                      <div
                        className={`p-3 rounded-xl text-xs border ${
                          req.status === 'REJECTED'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        <span className="font-semibold block mb-0.5">
                          Reviewed By {req.reviewedBy?.name || 'Admin'}:
                        </span>
                        {req.reviewNote}
                      </div>
                    )}

                    {/* Action Bar for Pending Requests */}
                    {req.status === 'PENDING' && (
                      <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.04]">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(req, 'REJECT')}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600/15 hover:bg-rose-600/25 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject (Restrict Student)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenReview(req, 'APPROVE')}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve Request</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Review Action Confirmation Sub-Modal */}
        {reviewingReq && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#1C1C1F] border border-white/[0.12] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    reviewAction === 'REJECT'
                      ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                      : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {reviewAction === 'REJECT' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {reviewAction === 'REJECT'
                      ? 'Reject Missed Event Request'
                      : 'Approve Missed Event Request'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Student: {reviewingReq.student.name} ({reviewingReq.student.rollNo})
                  </p>
                </div>
              </div>

              {/* CRITICAL WARNING FOR REJECTION */}
              {reviewAction === 'REJECT' && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 space-y-1">
                  <p className="font-bold flex items-center gap-1 text-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Automatic Restriction Warning
                  </p>
                  <p className="leading-relaxed">
                    Rejecting this request will immediately block this student from attending{' '}
                    <strong>assessments, contests, and courses</strong>. Only an administrator can unblock them.
                  </p>
                </div>
              )}

              {/* Approval Option: Grant Attendance */}
              {reviewAction === 'APPROVE' && reviewingReq.session && (
                <label className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] cursor-pointer text-xs text-neutral-200">
                  <input
                    type="checkbox"
                    checked={grantAttendance}
                    onChange={(e) => setGrantAttendance(e.target.checked)}
                    className="rounded border-neutral-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span>
                    Credit attendance record & club points ({reviewingReq.session?.totalPoints || 50} pts)
                  </span>
                </label>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Reviewer Note / Justification *
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={
                    reviewAction === 'REJECT'
                      ? 'Enter reason for rejection (e.g. Unverified absence / insufficient proof)'
                      : 'Approval comments...'
                  }
                  className="w-full bg-[#141416] border border-white/[0.1] rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingReq(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmReview}
                  disabled={actionLoading}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                    reviewAction === 'REJECT'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  }`}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Review...</span>
                    </>
                  ) : (
                    <span>
                      {reviewAction === 'REJECT' ? 'Confirm Rejection & Restrict' : 'Confirm Approval'}
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default AdminMissedEventRequestsModal;
