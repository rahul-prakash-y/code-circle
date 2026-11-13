import React, { useState, useEffect, useMemo } from 'react';
import api from '../lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { EmilCard } from '../components/ui/emil-ui';
import { HeroInput } from '@/components/ui/hero/HeroInput';
import { HeroTabs } from '@/components/ui/hero/HeroTabs';
import { HeroUser, HeroAvatar } from '@/components/ui/hero/HeroAvatar';
import { Button, Checkbox } from '@heroui/react';
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
            { duration: 4000 }
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
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent shrink-0">
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

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          <Button
            variant="outline"
            size="sm"
            onPress={() => fetchRequests(true)}
            isDisabled={refreshing}
            isLoading={refreshing}
            className="text-xs flex items-center gap-1.5 min-h-[38px]"
            title="Refresh requests"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {pendingRequests.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => setConfirmApproveAllOpen(true)}
              isDisabled={batchLoading}
              className="text-xs flex items-center gap-2 min-h-[38px] shadow-md shadow-accent/20"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Approve All Pending ({pendingRequests.length})</span>
            </Button>
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
      <div className="surface p-4 rounded-2xl border border-separator/80 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="flex-1">
            <HeroInput
              placeholder="Search by student name, roll number, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search className="w-4 h-4 text-text-muted" />}
              isClearable
              onClear={() => setSearchTerm('')}
              variant="flat"
              size="sm"
            />
          </div>

          {/* Status Filter Tabs */}
          <HeroTabs
            size="sm"
            selectedKey={statusFilter}
            onSelectionChange={(key) => setStatusFilter(key as any)}
            items={[
              { id: 'all', label: 'All Status' },
              { id: 'pending', label: 'Pending' },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Rejected' },
            ]}
          />

          {/* Email Filter Tabs */}
          <HeroTabs
            size="sm"
            selectedKey={emailFilter}
            onSelectionChange={(key) => setEmailFilter(key as any)}
            items={[
              { id: 'all', label: 'All Delivery' },
              { id: 'sent', label: 'Sent' },
              { id: 'failed', label: 'Failed' },
            ]}
          />
        </div>

        {/* Batch Selection Action Bar */}
        {selectedIds.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 bg-accent/10 border border-accent/20 rounded-xl text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-accent">{selectedIds.length}</span>
              <span className="text-text-secondary">pending request(s) selected</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                onPress={() => handleApproveBatch(selectedIds)}
                isDisabled={batchLoading}
                isLoading={batchLoading}
                className="text-xs flex-1 sm:flex-initial flex items-center justify-center gap-1.5 min-h-[36px]"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Approve Selected ({selectedIds.length})</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPress={() => setSelectedIds([])}
                className="text-xs min-h-[36px]"
              >
                Deselect
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Requests Table Wrapped in EmilCard (Apple monochrome look) */}
      <EmilCard className="overflow-hidden p-0 border border-separator/80">
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
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[800px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-separator bg-surface-elevated/50 text-text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 pl-4 w-10">
                    <Checkbox
                      isSelected={selectedIds.length > 0 && selectedIds.length === pendingRequests.length}
                      onChange={toggleSelectAllPending}
                      isDisabled={pendingRequests.length === 0}
                      aria-label="Select all pending"
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
                        <Checkbox
                          isSelected={selectedIds.includes(req._id)}
                          onChange={() => toggleSelect(req._id)}
                          isDisabled={!isPending}
                          aria-label={`Select request for ${req.name}`}
                        />
                      </td>

                      {/* Student Info — HeroUI User with Avatar isBordered */}
                      <td className="p-3.5">
                        <HeroUser
                          name={req.name}
                          description={
                            <div className="flex flex-col">
                              <span className="font-mono text-accent text-[11px]">{req.rollNo}</span>
                              <span className="text-[11px] text-text-muted">{req.email}</span>
                              {req.department && (
                                <span className="text-[10px] text-text-muted">{req.department}</span>
                              )}
                            </div>
                          }
                          avatarProps={{
                            name: req.name,
                            isBordered: true,
                            color: 'primary',
                            size: 'sm',
                          }}
                        />
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
                              <span className="inline-flex items-center whitespace-nowrap gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
                              <Button
                                size="sm"
                                variant="danger"
                                onPress={() => setErrorDetailReq(req)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 min-h-[26px] h-auto rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                                title="Click to view delivery error details"
                              >
                                <AlertCircle className="w-3 h-3" /> Delivery Failed
                              </Button>
                              {req.resetToken && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onPress={() => copyResetLink(req.resetToken!, req.email)}
                                  className="flex items-center gap-1 text-[10px] text-accent hover:text-accent/80 font-medium min-h-[24px] h-auto p-0"
                                  title="Copy direct reset link"
                                >
                                  <Copy className="w-2.5 h-2.5" /> Copy Link
                                </Button>
                              )}
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
                            <Button
                              variant="primary"
                              size="sm"
                              onPress={() => handleApprove(req)}
                              isDisabled={isActionLoading}
                              isLoading={isActionLoading}
                              className="text-xs min-h-[34px]"
                              title="Approve request and dispatch email"
                            >
                              <Send className="w-3 h-3" />
                              <span>Approve & Send</span>
                            </Button>
                          )}

                          {/* Resend Email Button (when approved) */}
                          {isApproved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onPress={() => handleResendEmail(req)}
                              isDisabled={isActionLoading}
                              isLoading={isActionLoading}
                              className={`text-xs whitespace-nowrap min-h-[34px] font-medium flex items-center gap-1 ${
                                !req.emailSent
                                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                                  : ''
                              }`}
                              title="Resend password reset email to student"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Resend Email</span>
                            </Button>
                          )}

                          {/* Copy Link Button (when approved) */}
                          {isApproved && req.resetToken && (
                            <Button
                              variant="outline"
                              size="sm"
                              isIconOnly
                              onPress={() => copyResetLink(req.resetToken!, req.email)}
                              className="min-w-[34px] min-h-[34px]"
                              title="Copy password reset link URL"
                              aria-label="Copy reset link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {/* Reject Button (when pending) */}
                          {isPending && (
                            <Button
                              variant="danger"
                              size="sm"
                              isIconOnly
                              onPress={() => {
                                setRejectModalReq(req);
                                setRejectReason('');
                              }}
                              isDisabled={isActionLoading}
                              className="min-w-[34px] min-h-[34px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                              title="Reject request"
                              aria-label="Reject request"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            isIconOnly
                            onPress={() => handleDelete(req._id, req.name)}
                            isDisabled={isActionLoading}
                            isLoading={isActionLoading}
                            className="min-w-[34px] min-h-[34px] text-text-muted hover:text-rose-400"
                            title="Delete request record"
                            aria-label="Delete request record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </EmilCard>

      {/* Confirmation Modal: Approve All Pending */}
      <AnimatePresence>
        {confirmApproveAllOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
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
              className="relative w-[calc(100%-1rem)] sm:w-full max-w-md surface p-5 sm:p-6 rounded-2xl border border-separator shadow-2xl z-10 space-y-4 max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent shrink-0">
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

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onPress={() => setConfirmApproveAllOpen(false)}
                  isDisabled={batchLoading}
                  className="w-full sm:w-auto min-h-[40px] text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onPress={() => handleApproveBatch()}
                  isDisabled={batchLoading}
                  isLoading={batchLoading}
                  className="w-full sm:w-auto min-h-[40px] text-xs flex items-center justify-center gap-2 shadow-md shadow-accent/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Proceed & Dispatch Emails</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectModalReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
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
              className="relative w-[calc(100%-1rem)] sm:w-full max-w-md surface p-5 sm:p-6 rounded-2xl border border-separator shadow-2xl z-10 space-y-4 max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
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
                <HeroInput
                  label="Rejection Reason / Internal Note"
                  labelPlacement="inside"
                  variant="flat"
                  placeholder="e.g. Unverified identity, duplicate request, suspicious activity"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onPress={() => setRejectModalReq(null)}
                  isDisabled={Boolean(actionLoadingId)}
                  className="w-full sm:w-auto min-h-[40px] text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onPress={handleReject}
                  isDisabled={Boolean(actionLoadingId)}
                  isLoading={Boolean(actionLoadingId)}
                  className="w-full sm:w-auto min-h-[40px] text-xs font-semibold"
                >
                  Confirm Rejection
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Details Modal */}
      <AnimatePresence>
        {errorDetailReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
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
              className="relative w-[calc(100%-1rem)] sm:w-full max-w-md surface p-5 sm:p-6 rounded-2xl border border-separator shadow-2xl z-10 space-y-4 text-xs max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
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

              {errorDetailReq.emailError?.includes('Render') && (
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" /> How to Enable Automated Emails on Render:
                  </p>
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    Render free tier blocks raw SMTP ports (465/587). Add a free <strong className="text-accent">BREVO_API_KEY</strong> or <strong className="text-accent">RESEND_API_KEY</strong> in Render Dashboard &rarr; Environment to send emails directly over HTTPS (Port 443). Until then, you can copy the manual link below.
                  </p>
                </div>
              )}

              {errorDetailReq.resetToken && (
                <div className="space-y-1.5">
                  <p className="font-semibold text-text-primary">Fallback: Manual Reset Link</p>
                  <div className="p-2.5 rounded-lg bg-surface-elevated border border-separator font-mono text-[11px] text-accent break-all select-all flex items-center justify-between">
                    <span className="truncate pr-2">
                      {window.location.origin}/reset-password?token={errorDetailReq.resetToken}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      isIconOnly
                      onPress={() => copyResetLink(errorDetailReq.resetToken!, errorDetailReq.email)}
                      className="shrink-0 text-text-muted hover:text-accent"
                      title="Copy link"
                      aria-label="Copy manual reset link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onPress={() => setErrorDetailReq(null)}
                  isDisabled={Boolean(actionLoadingId)}
                  className="w-full sm:w-auto min-h-[40px] text-xs"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  isDisabled={Boolean(actionLoadingId)}
                  isLoading={Boolean(actionLoadingId)}
                  onPress={async () => {
                    await handleResendEmail(errorDetailReq);
                    setErrorDetailReq(null);
                  }}
                  className="w-full sm:w-auto min-h-[40px] text-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Resend Email</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPasswordResets;
