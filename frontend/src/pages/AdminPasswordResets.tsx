import React, { useState, useEffect, useMemo } from 'react';
import api from '../lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  KeyRound,
  ShieldCheck,
  Mail,
  Send,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Copy,
  ExternalLink,
  CheckCheck,
  XCircle,
  Trash2,
  Server,
  User,
  Hash,
  Building2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ResetRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    rollNo: string;
    department?: string;
    role?: string;
  } | string;
  name: string;
  email: string;
  rollNo: string;
  department?: string;
  status: 'pending' | 'approved' | 'rejected';
  resetToken?: string | null;
  resetTokenExpires?: string | null;
  emailSent: boolean;
  emailSentAt?: string | null;
  emailError?: string | null;
  emailAttempts: number;
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  approvedAt?: string | null;
  rejectedBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  isUsed: boolean;
  usedAt?: string | null;
  verificationMethod: 'password' | 'rollNo';
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  emailSent: number;
  emailFailed: number;
  isUsed: number;
}

const AdminPasswordResets: React.FC = () => {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    emailSent: 0,
    emailFailed: 0,
    isUsed: 0,
  });
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [emailFilter, setEmailFilter] = useState<'all' | 'sent' | 'failed'>('all');

  // Selection for Batch Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Action Loading States
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // Modals
  const [confirmApproveAllOpen, setConfirmApproveAllOpen] = useState(false);
  const [rejectModalReq, setRejectModalReq] = useState<ResetRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [errorDetailReq, setErrorDetailReq] = useState<ResetRequest | null>(null);

  // Fetch Requests
  const fetchRequests = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const res = await api.get('/admin/password-resets', {
        params: {
          status: statusFilter,
          emailSent: emailFilter === 'all' ? undefined : emailFilter === 'sent' ? 'true' : 'false',
          search: searchTerm,
        },
      });

      if (res.data.success) {
        setRequests(res.data.requests || []);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.smtp) setSmtpStatus(res.data.smtp);
        if (showToast) toast.success('Password reset requests refreshed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch password reset requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, emailFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Individual Actions
  const handleApprove = async (req: ResetRequest) => {
    setActionLoadingId(req._id);
    try {
      const res = await api.post(`/admin/password-resets/${req._id}/approve`);
      if (res.data.success) {
        if (res.data.emailSent) {
          toast.success(`Approved! Reset link emailed to ${req.email}`);
        } else {
          toast(
            `Approved & reset link generated! Note: Email delivery failed (${res.data.emailError}). You can copy the link manually or resend.`,
            { icon: '⚠️', duration: 4000 }
          );
        }
        await fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to approve request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResendEmail = async (req: ResetRequest) => {
    setActionLoadingId(req._id);
    try {
      const res = await api.post(`/admin/password-resets/${req._id}/resend`);
      if (res.data.success) {
        if (res.data.emailSent) {
          toast.success(`Reset link email resent to ${req.email}!`);
        } else {
          toast.error(`Email resend failed: ${res.data.emailError || 'Delivery error'}`);
        }
        await fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to resend email');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalReq) return;
    setActionLoadingId(rejectModalReq._id);
    try {
      const res = await api.post(`/admin/password-resets/${rejectModalReq._id}/reject`, {
        reason: rejectReason,
      });
      if (res.data.success) {
        toast.success(`Request for ${rejectModalReq.name} rejected.`);
        setRejectModalReq(null);
        setRejectReason('');
        await fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reject request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the reset request record for ${name}?`)) {
      return;
    }
    setActionLoadingId(id);
    try {
      const res = await api.delete(`/admin/password-resets/${id}`);
      if (res.data.success) {
        toast.success('Request record deleted');
        await fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete request');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Batch Approval
  const handleApproveBatch = async (ids?: string[]) => {
    setBatchLoading(true);
    try {
      const res = await api.post('/admin/password-resets/approve-all', {
        ids: ids && ids.length > 0 ? ids : undefined,
      });

      if (res.data.success) {
        toast.success(
          `Batch approved! ${res.data.approvedCount} requests processed (${res.data.emailSentCount} emails delivered, ${res.data.emailFailedCount} failed).`,
          { duration: 5000 }
        );
        setSelectedIds([]);
        setConfirmApproveAllOpen(false);
        await fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Batch approval failed');
    } finally {
      setBatchLoading(false);
    }
  };

  const copyResetLink = (token: string, email: string) => {
    const origin = window.location.origin;
    const url = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(url);
    toast.success('Password reset link copied to clipboard!');
  };

  // Selection handlers
  const pendingRequests = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests]);

  const toggleSelectAllPending = () => {
    if (selectedIds.length === pendingRequests.length && pendingRequests.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingRequests.map((r) => r._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-text-primary tracking-tight">
                Password Reset Link Dispatcher
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary">
                Review verified user reset requests, approve links, track email delivery, and resend links on demand.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-center">
          <button
            onClick={() => fetchRequests(true)}
            disabled={refreshing}
            className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
            title="Refresh requests"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-accent' : ''}`} />
            <span>Refresh</span>
          </button>

          {pendingRequests.length > 0 && (
            <button
              onClick={() => setConfirmApproveAllOpen(true)}
              disabled={batchLoading}
              className="btn-primary py-2 px-3.5 text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-accent/20"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Approve All Pending ({pendingRequests.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="surface p-4 rounded-xl border border-separator space-y-1">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Total Requests</p>
          <p className="text-xl font-bold text-text-primary">{stats.total}</p>
        </div>

        <div className="surface p-4 rounded-xl border border-separator space-y-1 relative overflow-hidden">
          {stats.pending > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
          <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending Review
          </p>
          <p className="text-xl font-bold text-amber-400">{stats.pending}</p>
        </div>

        <div className="surface p-4 rounded-xl border border-separator space-y-1">
          <p className="text-[11px] font-semibold text-green-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Approved
          </p>
          <p className="text-xl font-bold text-green-400">{stats.approved}</p>
        </div>

        <div className="surface p-4 rounded-xl border border-separator space-y-1">
          <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Mail className="w-3 h-3" /> Emails Sent
          </p>
          <p className="text-xl font-bold text-emerald-400">{stats.emailSent}</p>
        </div>

        <div className="surface p-4 rounded-xl border border-separator space-y-1">
          <p className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Delivery Failed
          </p>
          <p className="text-xl font-bold text-rose-400">{stats.emailFailed}</p>
        </div>

        <div className="surface p-4 rounded-xl border border-separator space-y-1">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-accent" /> Password Reset
          </p>
          <p className="text-xl font-bold text-accent">{stats.isUsed}</p>
        </div>
      </div>

      {/* SMTP Service Status Notice Banner */}
      {smtpStatus && !smtpStatus.configured && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>SMTP Mailer Status:</strong> Credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are not set in the backend environment. Reset links will still be securely generated and can be directly copied or resent once SMTP is provided.
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
            Copy-Link Mode Ready
          </span>
        </div>
      )}

      {/* Controls: Search, Filters & Batch Bar */}
      <div className="surface p-4 rounded-xl border border-separator space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by student name, roll number, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 text-xs py-2 w-full"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                  statusFilter === st
                    ? 'bg-accent text-white font-semibold'
                    : 'bg-surface-elevated text-text-muted hover:text-text-primary border border-separator'
                }`}
              >
                {st === 'all' ? 'All Status' : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          {/* Email Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'sent', 'failed'] as const).map((ef) => (
              <button
                key={ef}
                onClick={() => setEmailFilter(ef)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                  emailFilter === ef
                    ? 'bg-text-primary text-canvas font-semibold'
                    : 'bg-surface-elevated text-text-muted hover:text-text-primary border border-separator'
                }`}
              >
                {ef === 'all' ? 'All Delivery' : ef === 'sent' ? 'Email Sent' : 'Email Failed'}
              </button>
            ))}
          </div>
        </div>

        {/* Batch Selection Action Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-accent/10 border border-accent/20 rounded-lg text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-accent">{selectedIds.length}</span>
              <span className="text-text-secondary">pending request(s) selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApproveBatch(selectedIds)}
                disabled={batchLoading}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Approve Selected ({selectedIds.length})</span>
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="btn-secondary py-1.5 px-2.5 text-xs cursor-pointer"
              >
                Deselect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Requests Table / Cards */}
      <div className="surface rounded-xl border border-separator overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-accent" />
            <p className="text-xs text-text-muted">Loading password reset requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <KeyRound className="w-10 h-10 mx-auto text-text-muted opacity-40" />
            <h3 className="text-sm font-bold text-text-primary">No Reset Requests Found</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all' || emailFilter !== 'all'
                ? 'No requests match the current filters. Try resetting search or filter criteria.'
                : 'No users have submitted password reset requests at this time.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-separator bg-surface-elevated/50 text-text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 pl-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === pendingRequests.length}
                      onChange={toggleSelectAllPending}
                      disabled={pendingRequests.length === 0}
                      className="rounded border-separator text-accent focus:ring-accent cursor-pointer"
                      title="Select all pending"
                    />
                  </th>
                  <th className="p-3.5">Student Details</th>
                  <th className="p-3.5">Verification & Reason</th>
                  <th className="p-3.5">Requested At</th>
                  <th className="p-3.5">Workflow Status</th>
                  <th className="p-3.5">Email Delivery</th>
                  <th className="p-3.5">Redemption</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator/60">
                {requests.map((req) => {
                  const isActionLoading = actionLoadingId === req._id;
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  const isRejected = req.status === 'rejected';

                  return (
                    <tr
                      key={req._id}
                      className={`hover:bg-surface-elevated/40 transition-colors ${
                        selectedIds.includes(req._id) ? 'bg-accent/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 pl-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(req._id)}
                          onChange={() => toggleSelect(req._id)}
                          disabled={!isPending}
                          className="rounded border-separator text-accent focus:ring-accent cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Student Info */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-accent shrink-0">
                            {req.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary text-xs">{req.name}</p>
                            <p className="font-mono text-[11px] text-accent">{req.rollNo}</p>
                            <p className="text-[11px] text-text-muted">{req.email}</p>
                            {req.department && (
                              <p className="text-[10px] text-text-muted">{req.department}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Verification method & reason */}
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-semibold border ${
                              req.verificationMethod === 'password'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            {req.verificationMethod === 'password'
                              ? 'Password Verified'
                              : 'Roll No Verified'}
                          </span>
                          {req.reason ? (
                            <p className="text-[11px] text-text-secondary italic max-w-xs truncate" title={req.reason}>
                              "{req.reason}"
                            </p>
                          ) : (
                            <p className="text-[10px] text-text-muted">Standard reset</p>
                          )}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="p-3.5 text-text-muted text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[10px] text-text-muted">
                          {new Date(req.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>

                      {/* Workflow Status */}
                      <td className="p-3.5">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3 animate-pulse" /> Pending
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>

                      {/* Email Delivery Tracking */}
                      <td className="p-3.5">
                        {isApproved ? (
                          req.emailSent ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCheck className="w-3 h-3" /> Email Sent
                              </span>
                              {req.emailSentAt && (
                                <p className="text-[10px] text-text-muted">
                                  {new Date(req.emailSentAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <button
                                onClick={() => setErrorDetailReq(req)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors cursor-pointer"
                                title="Click to view delivery error details"
                              >
                                <AlertCircle className="w-3 h-3" /> Delivery Failed
                              </button>
                              <p className="text-[10px] text-rose-400/80 max-w-[130px] truncate">
                                {req.emailError || 'Unsent'}
                              </p>
                            </div>
                          )
                        ) : (
                          <span className="text-text-muted text-[11px]">—</span>
                        )}
                      </td>

                      {/* Token Redeemed Status */}
                      <td className="p-3.5">
                        {req.isUsed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-400">
                            <CheckCircle2 className="w-3 h-3" /> Redeemed
                          </span>
                        ) : isApproved ? (
                          <span className="text-[11px] text-amber-400 font-medium">Link Active</span>
                        ) : (
                          <span className="text-text-muted text-[11px]">—</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve Button (when pending) */}
                          {isPending && (
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={isActionLoading}
                              className="btn-primary py-1 px-2.5 text-xs flex items-center gap-1 cursor-pointer"
                              title="Approve request and dispatch email"
                            >
                              {isActionLoading ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Send className="w-3 h-3" />
                                  <span>Approve & Send</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Resend Email Button (when approved) */}
                          {isApproved && (
                            <button
                              onClick={() => handleResendEmail(req)}
                              disabled={isActionLoading}
                              className={`py-1 px-2.5 text-xs rounded-lg font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                                !req.emailSent
                                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                                  : 'btn-secondary'
                              }`}
                              title="Resend password reset email to student"
                            >
                              {isActionLoading ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Mail className="w-3 h-3" />
                                  <span>Resend Email</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Copy Link Button (when approved) */}
                          {isApproved && req.resetToken && (
                            <button
                              onClick={() => copyResetLink(req.resetToken!, req.email)}
                              className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface text-text-muted hover:text-accent border border-separator transition-colors cursor-pointer"
                              title="Copy password reset link URL"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Reject Button (when pending) */}
                          {isPending && (
                            <button
                              onClick={() => {
                                setRejectModalReq(req);
                                setRejectReason('');
                              }}
                              disabled={isActionLoading}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                              title="Reject request"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(req._id, req.name)}
                            disabled={isActionLoading}
                            className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete request record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Approve All Pending */}
      <AnimatePresence>
        {confirmApproveAllOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmApproveAllOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md surface p-6 rounded-2xl border border-separator shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                  <CheckCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    Approve All Pending Requests?
                  </h3>
                  <p className="text-xs text-text-muted">
                    Batch operation for {pendingRequests.length} student(s)
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-separator text-xs space-y-2">
                <p className="text-text-secondary">
                  This action will generate secure password reset tokens and attempt email delivery for all{' '}
                  <strong className="text-text-primary">{pendingRequests.length} pending student request(s)</strong>:
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[11px] text-text-muted">
                  {pendingRequests.map((r) => (
                    <div key={r._id} className="flex justify-between items-center py-0.5 border-b border-separator/40">
                      <span className="truncate max-w-[180px]">{r.name}</span>
                      <span className="text-accent">{r.rollNo}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmApproveAllOpen(false)}
                  disabled={batchLoading}
                  className="btn-secondary py-2 px-4 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveBatch()}
                  disabled={batchLoading}
                  className="btn-primary py-2 px-4 text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-accent/20"
                >
                  {batchLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Proceed & Dispatch Emails</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectModalReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectModalReq(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md surface p-6 rounded-2xl border border-separator shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Reject Password Reset Request</h3>
                  <p className="text-xs text-text-muted">
                    Student: {rejectModalReq.name} ({rejectModalReq.rollNo})
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="input-label">Rejection Reason / Internal Note</label>
                <input
                  type="text"
                  placeholder="e.g. Unverified identity, duplicate request, suspicious activity"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalReq(null)}
                  className="btn-secondary py-2 px-4 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="py-2 px-4 text-xs font-semibold rounded-xl bg-rose-500 hover:bg-rose-600 text-white cursor-pointer transition-colors shadow-md shadow-rose-500/20"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Details Modal */}
      <AnimatePresence>
        {errorDetailReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setErrorDetailReq(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md surface p-6 rounded-2xl border border-separator shadow-2xl z-10 space-y-4 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Email Delivery Diagnostics</h3>
                  <p className="text-xs text-text-muted">
                    Recipient: {errorDetailReq.name} ({errorDetailReq.email})
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-1.5 font-mono text-[11px] break-all">
                <p className="font-bold text-rose-400">Error Description:</p>
                <p>{errorDetailReq.emailError || 'Unknown delivery failure'}</p>
              </div>

              {errorDetailReq.resetToken && (
                <div className="space-y-1.5">
                  <p className="font-semibold text-text-primary">Fallback: Manual Reset Link</p>
                  <div className="p-2.5 rounded-lg bg-surface-elevated border border-separator font-mono text-[11px] text-accent break-all select-all flex items-center justify-between">
                    <span className="truncate pr-2">
                      {window.location.origin}/reset-password?token={errorDetailReq.resetToken}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyResetLink(errorDetailReq.resetToken!, errorDetailReq.email)}
                      className="text-text-muted hover:text-accent shrink-0 cursor-pointer"
                      title="Copy link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleResendEmail(errorDetailReq);
                    setErrorDetailReq(null);
                  }}
                  className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Resend Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setErrorDetailReq(null)}
                  className="btn-secondary py-2 px-3 text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPasswordResets;
