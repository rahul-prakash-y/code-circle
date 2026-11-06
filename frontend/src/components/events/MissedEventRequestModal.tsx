import ResponsiveModal from '../ui/ResponsiveModal';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  FileText,
  Send,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import useEventStore from '../../store/useEventStore';
import { formatISTDateTime, formatISTDate } from '../../lib/dateUtils';
import HeroUISelect from '../ui/HeroUISelect';

interface MissedEventRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEventId?: string;
}

interface MissedRequest {
  _id: string;
  event?: {
    _id: string;
    title: string;
    type: string;
    date: string;
    hourlyPoints: number;
    venueOrLink?: string;
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

export const MissedEventRequestModal: React.FC<MissedEventRequestModalProps> = ({
  isOpen,
  onClose,
  defaultEventId,
}) => {
  const { events, fetchEvents } = useEventStore();
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Form State
  const [selectedEventId, setSelectedEventId] = useState<string>(defaultEventId || '');
  const [missedDate, setMissedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [classHours, setClassHours] = useState<number[]>([1]);
  const [clubHoursRequested, setClubHoursRequested] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // History State
  const [myRequests, setMyRequests] = useState<MissedRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (events.length === 0) {
        fetchEvents();
      }
      loadMyRequests();
      if (defaultEventId) {
        setSelectedEventId(defaultEventId);
      }
    }
  }, [isOpen, defaultEventId]);

  const loadMyRequests = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/missed-event-requests/my');
      setMyRequests(res.data?.data || []);
    } catch (err: any) {
      console.error('Failed to load my missed event requests:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleToggleHour = (hour: number) => {
    if (classHours.includes(hour)) {
      if (classHours.length > 1) {
        setClassHours(classHours.filter((h) => h !== hour));
      }
    } else {
      setClassHours([...classHours, hour].sort((a, b) => a - b));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEventId) {
      toast.error('Please select the event you missed.');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please enter a clear reason for your absence.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        eventId: selectedEventId,
        missedDate,
        classHours,
        clubHoursRequested: Number(clubHoursRequested) || 1,
        reason: reason.trim(),
        proofUrl: proofUrl.trim(),
      };

      const res = await api.post('/missed-event-requests', payload);
      toast.success(res.data?.message || 'Missed event request submitted successfully!');

      // Reset form and switch to history
      setReason('');
      setProofUrl('');
      setClassHours([1]);
      setClubHoursRequested(1);
      await loadMyRequests();
      setActiveTab('history');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit request';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this pending missed event request?')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.delete(`/missed-event-requests/${id}`);
      toast.success('Request cancelled successfully');
      setMyRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel request');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <span>Missed Event / Club Hours Request</span>
        </div>
      }
      description="Submit justification for missed events or view review status."
      dialogClassName="sm:max-w-2xl p-6"
    >
      <div className="space-y-4 pt-2">

          {/* Navigation Pill Tabs */}
          <div className="px-6 pt-3.5 pb-3 border-b border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] shrink-0">
            <div className="flex items-center gap-2 p-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>New Request</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>My Requests ({myRequests.length})</span>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {activeTab === 'create' ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Policy Alert Banner */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-950 dark:text-amber-200">
                      Important Review Policy
                    </p>
                    <p className="text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                      Your request will be scrutinized by the club administration. If an absence request is{' '}
                      <strong className="text-amber-950 dark:text-white underline font-bold">rejected</strong> due to invalid justification or unverified absence, your account will be{' '}
                      <strong className="text-amber-950 dark:text-white font-bold">restricted from attending assessments, contests, and courses</strong> until manually unblocked by an admin.
                    </p>
                  </div>
                </div>

                {/* 1. Event Selection via HeroUISelect */}
                <div>
                  <HeroUISelect
                    label="Select Missed Event"
                    required
                    isSearchable
                    placeholder="Search and choose a missed event..."
                    value={selectedEventId}
                    onChange={(val) => setSelectedEventId(val)}
                    color="primary"
                    options={events.map((evt) => ({
                      value: evt._id,
                      label: evt.title,
                      description: `${evt.type} • ${formatISTDate(evt.date)} • ${evt.hourlyPoints || 50} pts/hr`,
                      badge: evt.type,
                    }))}
                  />
                </div>

                {/* 2. Date and Club Hours Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 dark:text-[#F5F5F7] uppercase tracking-wider mb-2">
                      Missed Date *
                    </label>
                    <input
                      type="date"
                      value={missedDate}
                      onChange={(e) => setMissedDate(e.target.value)}
                      required
                      className="w-full bg-zinc-50 dark:bg-[#1C1C1E] border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F7] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-800 dark:text-[#F5F5F7] uppercase tracking-wider mb-2">
                      Club Hours Requested *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={clubHoursRequested}
                      onChange={(e) => setClubHoursRequested(Number(e.target.value))}
                      required
                      className="w-full bg-zinc-50 dark:bg-[#1C1C1E] border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F7] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* 3. Class Hours Missed Selection */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-[#F5F5F7] uppercase tracking-wider mb-2">
                    Class Periods / Hours Missed
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => {
                      const isSelected = classHours.includes(period);
                      return (
                        <button
                          key={period}
                          type="button"
                          onClick={() => handleToggleHour(period)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                              : 'bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/[0.04] text-zinc-700 dark:text-[#86868B] border-zinc-200 dark:border-white/10 hover:text-zinc-900 dark:hover:text-[#F5F5F7]'
                          }`}
                        >
                          Period {period}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Reason for Absence */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-[#F5F5F7] uppercase tracking-wider mb-2">
                    Reason for Absence / Excused Leave *
                  </label>
                  <textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    placeholder="Provide a detailed, legitimate reason for your absence (e.g. Attended campus recruitment interview, college sports meet, or medical emergency with approval)."
                    className="w-full bg-zinc-50 dark:bg-[#1C1C1E] border border-zinc-200 dark:border-white/10 rounded-2xl p-4 text-sm text-zinc-900 dark:text-[#F5F5F7] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-400 dark:placeholder:text-[#86868B]"
                  />
                </div>

                {/* 5. Proof / Documentation URL */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-800 dark:text-[#F5F5F7] uppercase tracking-wider mb-2">
                    Supporting Document / Proof URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... or proof document link"
                    className="w-full bg-zinc-50 dark:bg-[#1C1C1E] border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F7] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-400"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-[#86868B] dark:hover:text-[#F5F5F7] hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-white" />
                        <span>Submit for Admin Approval</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Request History Tab */
              <div className="space-y-4">
                {loadingHistory ? (
                  <div className="py-16 text-center text-[#86868B] space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                    <p className="text-xs">Loading your request history...</p>
                  </div>
                ) : myRequests.length === 0 ? (
                  <div className="py-16 text-center text-neutral-500 space-y-3">
                    <Calendar className="w-10 h-10 mx-auto text-neutral-600" />
                    <p className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      No missed event requests yet
                    </p>
                    <p className="text-xs max-w-sm mx-auto">
                      Whenever you miss an event or club hours, submit a request with supporting justification to seek approval.
                    </p>
                  </div>
                ) : (
                  myRequests.map((req) => {
                    const statusConfig = {
                      PENDING: {
                        label: 'Pending Review',
                        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                        icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
                      },
                      APPROVED: {
                        label: 'Approved',
                        badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
                      },
                      REJECTED: {
                        label: 'Rejected & Restricted',
                        badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                        icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
                      },
                    }[req.status] || {
                      label: req.status,
                      badge: 'bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7] border-neutral-700',
                      icon: null,
                    };

                    return (
                      <div
                        key={req._id}
                        className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-white/10 shadow-xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-[#F5F5F7] tracking-tight">
                              {req.event?.title || 'Unknown Event'}
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-[#86868B]">
                              Missed on: {formatISTDate(req.missedDate)} • Requested:{' '}
                              <strong className="text-zinc-900 dark:text-neutral-200 font-semibold">
                                {req.clubHoursRequested} Club Hour(s)
                              </strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.badge}`}
                            >
                              {statusConfig.icon}
                              <span>{statusConfig.label}</span>
                            </span>

                            {req.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => handleDelete(req._id)}
                                disabled={deletingId === req._id}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Cancel pending request"
                              >
                                {deletingId === req._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Reason quote */}
                        <div className="p-3 rounded-xl bg-zinc-100/80 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.04] text-xs text-zinc-800 dark:text-[#F5F5F7]">
                          <span className="text-zinc-500 dark:text-neutral-400 font-semibold block mb-0.5">
                            Reason Submitted:
                          </span>
                          {req.reason}
                        </div>

                        {/* Proof Link if exists */}
                        {req.proofUrl && (
                          <div className="text-xs">
                            <a
                              href={req.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View Attached Supporting Document</span>
                            </a>
                          </div>
                        )}

                        {/* Reviewer Note (Especially for Rejection) */}
                        {req.reviewNote && (
                          <div
                            className={`p-3 rounded-xl text-xs border ${
                              req.status === 'REJECTED'
                                ? 'bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-300'
                                : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            <span className="font-semibold block mb-0.5">
                              {req.status === 'REJECTED'
                                ? 'Admin Rejection Feedback & Restriction Notice:'
                                : 'Admin Approval Note:'}
                            </span>
                            {req.reviewNote}
                            {req.status === 'REJECTED' && (
                              <p className="mt-1.5 font-medium text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                Account restricted from assessments, contests, and courses. An admin must unblock your account.
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-neutral-500 pt-1 border-t border-zinc-100 dark:border-white/[0.04]">
                          <span>Periods: {req.classHours?.join(', ') || '1'}</span>
                          <span>Submitted: {formatISTDateTime(req.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
      </div>
    </ResponsiveModal>
  );
};

export default MissedEventRequestModal;
