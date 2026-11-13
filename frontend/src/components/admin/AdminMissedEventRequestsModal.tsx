import ResponsiveModal from '../ui/ResponsiveModal';
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
import { HeroTabs } from '@/components/ui/hero/HeroTabs';
import { HeroInput } from '@/components/ui/hero/HeroInput';
import { HeroTextarea } from '@/components/ui/hero/HeroTextarea';
import { HeroUser, HeroAvatar } from '@/components/ui/hero/HeroAvatar';

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

  return (
    <>
      <ResponsiveModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span>Missed Event Requests & Restriction Control</span>
          </div>
        }
        description="Review student absence justifications • Rejections enforce academic restrictions"
        dialogClassName="sm:max-w-4xl p-6"
      >
        <div className="space-y-4 pt-2">

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-6 py-3.5 bg-surface-secondary border-b border-separator shrink-0">
            <div className="p-3 rounded-2xl bg-surface border border-separator shadow-2xs">
              <span className="text-[11px] font-semibold text-label-secondary uppercase tracking-wider block">
                Total Requests
              </span>
              <span className="text-xl font-extrabold text-label-primary">{stats.total}</span>
            </div>

            <div className="p-3 rounded-2xl bg-warning-subtle border border-warning/20">
              <span className="text-[11px] font-semibold text-warning uppercase tracking-wider block">
                Pending Review
              </span>
              <span className="text-xl font-extrabold text-warning">{stats.pending}</span>
            </div>

            <div className="p-3 rounded-2xl bg-success-subtle border border-success/20">
              <span className="text-[11px] font-semibold text-success uppercase tracking-wider block">
                Approved
              </span>
              <span className="text-xl font-extrabold text-success">{stats.approved}</span>
            </div>

            <div className="p-3 rounded-2xl bg-destructive-subtle border border-destructive/20">
              <span className="text-[11px] font-semibold text-destructive uppercase tracking-wider block">
                Restricted Students
              </span>
              <span className="text-xl font-extrabold text-destructive">
                {stats.restrictedStudents}
              </span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="px-6 py-3.5 bg-surface-secondary border-b border-separator flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Status Tabs with Emil Kowalski spring motion */}
            <HeroTabs
              size="sm"
              selectedKey={statusFilter}
              onSelectionChange={(key) => setStatusFilter(key as any)}
              items={[
                { id: 'PENDING', label: 'Pending' },
                { id: 'ALL', label: 'All Requests' },
                { id: 'APPROVED', label: 'Approved' },
                { id: 'REJECTED', label: 'Rejected' },
              ]}
            />

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="w-full sm:w-72">
              <HeroInput
                size="sm"
                variant="flat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or roll no..."
                startContent={<Search className="w-4 h-4 text-label-tertiary" />}
                isClearable
                onClear={() => {
                  setSearchQuery('');
                  loadRequests('');
                }}
              />
            </form>
          </div>

          {/* List of Requests */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {loading ? (
              <div className="py-20 text-center text-label-secondary space-y-2">
                <Loader2 className="w-7 h-7 animate-spin mx-auto text-warning" />
                <p className="text-xs">Loading missed event requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-20 text-center text-label-secondary space-y-2">
                <Calendar className="w-10 h-10 mx-auto text-label-tertiary" />
                <p className="text-sm font-semibold text-label-primary">No requests found</p>
                <p className="text-xs text-label-secondary">
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
                    className="p-5 rounded-2xl bg-surface border border-separator hover:border-separator-opaque shadow-xs transition-all space-y-3.5"
                  >
                    {/* Top Row: Student Identity & Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-separator pb-3">
                      <div className="flex items-center gap-3">
                        <HeroAvatar
                          name={req.student?.name || 'Student'}
                          isBordered
                          color="primary"
                          size="md"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-label-primary">
                              {req.student?.name || 'Unknown Student'}
                            </span>
                            <span className="text-xs font-mono text-label-secondary">
                              ({req.student?.rollNo || '—'})
                            </span>
                            {isStudentRestricted && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive-subtle text-destructive border border-destructive/20 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" />
                                Restricted
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-label-secondary">
                            {req.student?.department || 'General'} • {req.student?.email} • Points:{' '}
                            <strong className="text-label-primary font-semibold">{req.student?.points || 0}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Status and Unblock action */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            req.status === 'APPROVED'
                              ? 'bg-success-subtle text-success border-success/30'
                              : req.status === 'REJECTED'
                              ? 'bg-destructive-subtle text-destructive border-destructive/30'
                              : 'bg-warning-subtle text-warning border-warning/30'
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
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-surface-secondary p-3.5 rounded-xl border border-separator">
                      <div>
                        <span className="text-label-secondary block mb-0.5">Event Missed:</span>
                        <strong className="text-label-primary text-sm">
                          {req.event?.title || 'Unknown Event'}
                        </strong>
                        <p className="text-label-secondary mt-0.5">
                          Date: {formatISTDate(req.missedDate)} • Type: {req.event?.type}
                        </p>
                      </div>

                      <div>
                        <span className="text-label-secondary block mb-0.5">Requested Credit:</span>
                        <strong className="text-warning text-sm">
                          {req.clubHoursRequested} Club Hour(s)
                        </strong>
                        <p className="text-label-secondary mt-0.5">
                          Periods: {req.classHours?.join(', ') || '1'}
                        </p>
                      </div>
                    </div>

                    {/* Reason statement */}
                    <div className="p-3 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary">
                      <span className="text-label-secondary font-semibold block mb-0.5">
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
                          className="inline-flex items-center gap-1.5 text-accent hover:underline font-medium"
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
                            ? 'bg-destructive-subtle border-destructive/25 text-destructive'
                            : 'bg-success-subtle border-success/25 text-success'
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
                      <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-separator">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(req, 'REJECT')}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-destructive-subtle hover:bg-destructive/20 text-destructive border border-destructive/30 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject (Restrict Student)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenReview(req, 'APPROVE')}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-success hover:bg-success-hover text-white shadow-md shadow-success/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
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
        </div>
      </ResponsiveModal>

      {/* Review Action Confirmation Sub-Modal */}
        {reviewingReq && (
          <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-surface-overlay backdrop-blur-xl overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface text-label-primary border border-separator rounded-t-[28px] sm:rounded-3xl p-6 shadow-2xl dark:shadow-none dark:ring-1 dark:ring-white/10 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    reviewAction === 'REJECT'
                      ? 'bg-destructive-subtle border border-destructive/30 text-destructive'
                      : 'bg-success-subtle border border-success/30 text-success'
                  }`}
                >
                  {reviewAction === 'REJECT' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-label-primary">
                    {reviewAction === 'REJECT'
                      ? 'Reject Missed Event Request'
                      : 'Approve Missed Event Request'}
                  </h3>
                  <p className="text-xs text-label-secondary">
                    Student: {reviewingReq.student.name} ({reviewingReq.student.rollNo})
                  </p>
                </div>
              </div>

              {/* CRITICAL WARNING FOR REJECTION */}
              {reviewAction === 'REJECT' && (
                <div className="p-3.5 rounded-2xl bg-destructive-subtle border border-destructive/25 text-xs text-destructive space-y-1">
                  <p className="font-bold flex items-center gap-1 text-destructive">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                    Automatic Restriction Warning
                  </p>
                  <p className="leading-relaxed">
                    Rejecting this request will immediately block this student from attending{' '}
                    <strong className="text-label-primary">assessments, contests, and courses</strong>. Only an administrator can unblock them.
                  </p>
                </div>
              )}

              {/* Approval Option: Grant Attendance */}
              {reviewAction === 'APPROVE' && reviewingReq.session && (
                <label className="flex items-center gap-2 p-3 rounded-xl bg-surface-secondary border border-separator cursor-pointer text-xs text-label-primary">
                  <input
                    type="checkbox"
                    checked={grantAttendance}
                    onChange={(e) => setGrantAttendance(e.target.checked)}
                    className="rounded border-separator text-success focus:ring-0 cursor-pointer"
                  />
                  <span>
                    Credit attendance record & club points ({reviewingReq.session?.totalPoints || 50} pts)
                  </span>
                </label>
              )}

              <HeroTextarea
                label="Reviewer Note / Justification"
                labelPlacement="inside"
                variant="flat"
                isRequired
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={
                  reviewAction === 'REJECT'
                    ? 'Enter reason for rejection (e.g. Unverified absence / insufficient proof)'
                    : 'Approval comments...'
                }
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingReq(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-label-secondary hover:text-label-primary transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmReview}
                  disabled={actionLoading}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                    reviewAction === 'REJECT'
                      ? 'bg-destructive hover:bg-destructive-hover shadow-destructive/20'
                      : 'bg-success hover:bg-success-hover shadow-success/20'
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
    </>
  );
};

export default AdminMissedEventRequestsModal;
