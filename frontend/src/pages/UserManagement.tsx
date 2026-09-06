import React, { useEffect, useState, useRef } from 'react';
import useUserStore from '../store/useUserStore';
import useAuthStore from '../store/useAuthStore';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Users, Search, Shield, ShieldAlert, ShieldCheck,
  Trash2, KeyRound, Check, X, AlertTriangle,
  Loader2, UserPlus, Crown, Copy, RefreshCw,
  Edit, ChevronLeft, ChevronRight, CheckCircle2,
  Sparkles, Mail, Lock, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { User, UserRole } from '../types/user';

// ── Role helpers ────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { color: string; bg: string; Icon: React.ComponentType<any> }> = {
  SuperAdmin: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', Icon: Crown },
  Admin: { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', Icon: ShieldCheck },
  Faculty: { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', Icon: Shield },
  Committee: { color: '#34d399', bg: 'rgba(52,211,153,0.08)', Icon: Shield },
  Student: { color: 'var(--text-muted)', bg: 'var(--glass-border)', Icon: Users },
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const meta = ROLE_META[role] || ROLE_META.Student;
  const { Icon } = meta;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}22` }}
    >
      <Icon size={11} strokeWidth={2.5} />
      {role}
    </span>
  );
};

// ── Form field (underline style) ─────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="input-label">{label}</label>
    {children}
  </div>
);

// ── Slide-Over Panel wrapper ─────────────────────────────────────────────────
const SlideOver: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, onClose, children }) => (
  <AnimatePresence>
    {open && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="slide-panel-overlay"
          onClick={onClose}
        />
        {/* Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="slide-panel"
        >
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// ── Centered Modal wrapper ───────────────────────────────────────────────────
const CenteredModal: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, onClose, children }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        />
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full max-w-md z-10 rounded-3xl p-8 space-y-6"
          style={{
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-deep-val)',
            border: '1px solid var(--border-color)',
          }}
        >
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ── Metric hero number ───────────────────────────────────────────────────────
const HeroMetric: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="metric-number"
        style={{ color: 'var(--accent)' }}
      >
        {value}
      </motion.div>
      <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────
const UserManagement: React.FC = () => {
  const {
    users, pagination, filters, loading, actionLoading,
    fetchUsers, setSearch, setRoleFilter, setStatusFilter,
    setPage, setLimit, createUser, updateUser,
    deleteUser, toggleBlock, generateResetLink,
    forceResetPassword,
  } = useUserStore();

  const { user: currentUser, isSuperAdmin, isAdmin } = useAuthStore();

  const [searchInput, setSearchInput] = useState(filters.search);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Panel/modal states
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showResetLinkModal, setShowResetLinkModal] = useState(false);
  const [showForceResetModal, setShowForceResetModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', rollNo: '', role: 'Student' as UserRole, department: '', password: '',
  });
  const [activeResetLink, setActiveResetLink] = useState<string | null>(null);
  const [generatedTempPassword, setGeneratedTempPassword] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    setSearch(val);
  };

  const openEditPanel = (targetUser: User) => {
    setSelectedUser(targetUser);
    setFormData({
      name: targetUser.name, email: targetUser.email, rollNo: targetUser.rollNo,
      role: targetUser.role, department: targetUser.department || '', password: '',
    });
    setShowEditPanel(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.rollNo) {
      return toast.error('Name, email, and roll number are required');
    }
    const res = await createUser({
      name: formData.name, email: formData.email, rollNo: formData.rollNo,
      role: formData.role, department: formData.department, password: formData.password || undefined,
    });
    if (res.success) {
      toast.success('User created successfully');
      if (res.generatedPassword) {
        toast(
          (t) => (
            <div className="text-xs space-y-1">
              <p className="font-bold">Default password generated:</p>
              <code className="bg-surface-elevated px-2 py-0.5 rounded font-mono text-amber-400">{res.generatedPassword}</code>
            </div>
          ),
          { duration: 8000 }
        );
      }
      setShowAddPanel(false);
      setFormData({ name: '', email: '', rollNo: '', role: 'Student', department: '', password: '' });
    } else {
      toast.error(res.error || 'Failed to create user');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const res = await updateUser(selectedUser._id || selectedUser.id!, {
      name: formData.name, email: formData.email, rollNo: formData.rollNo,
      role: formData.role, department: formData.department,
    });
    if (res.success) {
      toast.success('User updated');
      setShowEditPanel(false);
      setSelectedUser(null);
    } else {
      toast.error(res.error || 'Failed to update user');
    }
  };

  const handleToggleBlock = async (targetUser: User) => {
    const action = targetUser.isBlocked ? 'unblock' : 'block';
    const res = await toggleBlock(targetUser._id || targetUser.id!, !targetUser.isBlocked);
    if (res.success) toast.success(`User ${action}ed`);
    else toast.error(res.error || `Failed to ${action} user`);
  };

  const handleDeleteSubmit = async (id: string) => {
    const res = await deleteUser(id);
    if (res.success) {
      toast.success('User deleted');
      setConfirmDeleteId(null);
      setSelectedUser(null);
    } else {
      toast.error(res.error || 'Failed to delete user');
    }
  };

  const handleTriggerResetLink = async (targetUser: User) => {
    setSelectedUser(targetUser);
    setActiveResetLink(null);
    const res = await generateResetLink(targetUser._id || targetUser.id!);
    if (res.success && res.resetLink) {
      setActiveResetLink(res.resetLink);
      setShowResetLinkModal(true);
      toast.success('Reset link generated');
    } else {
      toast.error(res.error || 'Failed to generate reset link');
    }
  };

  const handleForceResetPassword = (targetUser: User) => {
    setSelectedUser(targetUser);
    setGeneratedTempPassword(null);
    setShowForceResetModal(true);
  };

  const executeForceReset = async () => {
    if (!selectedUser) return;
    const res = await forceResetPassword(selectedUser._id || selectedUser.id!);
    if (res.success && res.temporaryPassword) {
      setGeneratedTempPassword(res.temporaryPassword);
      toast.success('Temporary password generated');
    } else {
      toast.error(res.error || 'Force reset failed');
    }
  };

  const copyToClipboard = (text: string, label = 'Copied!') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  // ── Shared form body ──────────────────────────────────────────────────────
  const renderUserForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-7 flex-1 overflow-y-auto px-6 py-6">
      <div className="grid grid-cols-2 gap-6">
        <Field label="Full Name">
          <input
            type="text" required placeholder="Jane Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field text-sm"
          />
        </Field>
        <Field label="Roll Number">
          <input
            type="text" required placeholder="21CSE101"
            value={formData.rollNo}
            onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
            className="input-field text-sm font-mono"
          />
        </Field>
      </div>

      <Field label="Email Address">
        <input
          type="email" required placeholder="user@university.edu"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="input-field text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 gap-6">
        <Field label="Assigned Role">
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            className="input-field text-sm"
            style={{ cursor: 'pointer' }}
          >
            <option value="Student">Student</option>
            {isSuperAdmin() && <option value="Admin">Admin</option>}
            {isSuperAdmin() && <option value="SuperAdmin">SuperAdmin</option>}
          </select>
        </Field>
        <Field label="Department">
          <input
            type="text" placeholder="e.g. Computer Science"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="input-field text-sm"
          />
        </Field>
      </div>

      {submitLabel === 'Create User' && (
        <Field label="Initial Password (optional)">
          <input
            type="password" placeholder="Leave blank for auto-generated"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="input-field text-sm font-mono"
          />
        </Field>
      )}

      <div className="flex gap-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={actionLoading}
          className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-3"
        >
          {actionLoading ? <Loader2 size={16} className="animate-spin" /> : submitLabel}
        </motion.button>
      </div>
    </form>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-0">

      {/* ── Cinematic Page Hero ── */}
      <div className="py-12 md:py-16 relative overflow-hidden">
        <div
          className="absolute inset-y-0 right-0 w-1/2 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at right, var(--accent-subtle) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.12em' }}
          >
            Admin Console
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <h1
                className="font-black leading-none tracking-tight"
                style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: 'var(--text-primary)' }}
              >
                User Directory
              </h1>
              <p className="mt-3 text-base" style={{ color: 'var(--text-muted)' }}>
                {isSuperAdmin() && (
                  <span className="font-semibold" style={{ color: '#f59e0b' }}>SuperAdmin · </span>
                )}
                Full access control, credentials, and role management.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <HeroMetric value={pagination.total} label="Total Members" />
              <div className="w-px h-12 self-center" style={{ background: 'var(--border-color)' }} />

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => {
                    setFormData({ name: '', email: '', rollNo: '', role: 'Student', department: '', password: '' });
                    setShowAddPanel(true);
                  }}
                  className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5"
                >
                  <UserPlus size={15} strokeWidth={2} />
                  Add User
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => fetchUsers()}
                  disabled={loading}
                  className="p-2.5 rounded-xl cursor-pointer transition-colors duration-150"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
                >
                  <RefreshCw size={16} strokeWidth={1.8} className={loading ? 'animate-spin text-accent' : ''} />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col md:flex-row md:items-center gap-4 pb-4"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16} strokeWidth={1.8}
            className="absolute left-0 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search name, roll number, email..."
            value={searchInput}
            onChange={handleSearchChange}
            className="w-full text-base font-medium bg-transparent border-none pl-7 py-2 focus:outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1">
          {(['all', 'active', 'blocked'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="px-3.5 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer capitalize transition-colors duration-150"
              style={{
                background: filters.status === st ? 'var(--accent-subtle)' : 'transparent',
                color: filters.status === st ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${filters.status === st ? 'var(--accent)' : 'transparent'}`,
                borderOpacity: 0.3,
              }}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-1">
          {[
            { label: 'All', value: 'all' },
            { label: 'Students', value: 'Student' },
            { label: 'Admins', value: 'Admin' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setRoleFilter(item.value)}
              className="px-3.5 py-1.5 rounded-xl text-[12px] font-semibold cursor-pointer transition-colors duration-150"
              style={{
                background: filters.role === item.value ? 'var(--glass-bg)' : 'transparent',
                color: filters.role === item.value ? 'var(--text-primary)' : 'var(--text-muted)',
                border: `1px solid ${filters.role === item.value ? 'var(--border-color)' : 'transparent'}`,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              {['User', 'Roll No', 'Role', 'Department', 'Status', ''].map((h) => (
                <th
                  key={h}
                  className="py-4 px-5 text-[10px] font-semibold uppercase tracking-widest"
                  style={{
                    color: 'var(--text-muted)',
                    letterSpacing: '0.1em',
                    borderBottom: '1px solid var(--border-color)',
                    textAlign: h === '' ? 'right' : 'left',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading directory…</p>
                  </div>
                </td>
              </tr>
            ) : users.length > 0 ? (
              <AnimatePresence initial={false}>
                {users.map((item, i) => {
                  const uid = item._id || item.id!;
                  const isConfirmingDelete = confirmDeleteId === uid;

                  return (
                    <motion.tr
                      key={uid}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                      className="group"
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'var(--glass-bg)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                    >
                      {/* User */}
                      <td className="py-5 px-5">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden"
                            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                          >
                            {item.profilePicUrl ? (
                              <img src={item.profilePicUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              item.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div
                              className="text-sm font-semibold leading-none"
                              style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
                            >
                              {item.name}
                            </div>
                            <div
                              className="text-[12px] font-mono mt-1"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {item.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Roll No */}
                      <td className="py-5 px-5">
                        <span
                          className="text-[12px] font-mono font-semibold tracking-wider"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {item.rollNo}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="py-5 px-5">
                        <RoleBadge role={item.role} />
                      </td>

                      {/* Department */}
                      <td className="py-5 px-5">
                        <span className="text-[13px]" style={{ color: item.department ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                          {item.department || <span className="italic text-[12px]">—</span>}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-5 px-5">
                        {item.isBlocked ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
                          >
                            <ShieldAlert size={11} strokeWidth={2.5} /> Blocked
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
                          >
                            <CheckCircle2 size={11} strokeWidth={2.5} /> Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-5 px-5 text-right">
                        <AnimatePresence mode="wait">
                          {isConfirmingDelete ? (
                            <motion.div
                              key="confirm"
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center justify-end gap-2"
                            >
                              <span
                                className="text-[12px] font-medium"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                Delete {item.name.split(' ')[0]}?
                              </span>
                              <button
                                onClick={() => handleDeleteSubmit(uid)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-colors duration-150"
                                style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}
                              >
                                {actionLoading ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="p-1.5 rounded-lg cursor-pointer transition-colors duration-150"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                <X size={14} strokeWidth={2} />
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="actions"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                              {/* Reset Link */}
                              <button
                                onClick={() => handleTriggerResetLink(item)}
                                className="p-2 rounded-xl cursor-pointer transition-colors duration-150"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)')}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
                                title="Generate reset link"
                              >
                                <KeyRound size={15} strokeWidth={1.8} />
                              </button>

                              {/* Force Reset (SuperAdmin) */}
                              {isSuperAdmin() && (
                                <button
                                  onClick={() => handleForceResetPassword(item)}
                                  className="p-2 rounded-xl cursor-pointer transition-colors duration-150"
                                  style={{ color: 'var(--text-muted)' }}
                                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#f59e0b')}
                                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
                                  title="Force reset password"
                                >
                                  <Sparkles size={15} strokeWidth={1.8} />
                                </button>
                              )}

                              {/* Block/Unblock */}
                              <button
                                onClick={() => handleToggleBlock(item)}
                                className="p-2 rounded-xl cursor-pointer transition-colors duration-150"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.color = item.isBlocked ? '#34d399' : '#f59e0b';
                                }}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
                                title={item.isBlocked ? 'Unblock' : 'Block'}
                              >
                                {item.isBlocked ? <Check size={15} strokeWidth={2} /> : <ShieldAlert size={15} strokeWidth={1.8} />}
                              </button>

                              {/* Edit — opens slide-over */}
                              <button
                                onClick={() => openEditPanel(item)}
                                className="p-2 rounded-xl cursor-pointer transition-colors duration-150"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)')}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
                                title="Edit user"
                              >
                                <Edit size={15} strokeWidth={1.8} />
                              </button>

                              {/* Delete — inline confirm */}
                              <button
                                onClick={() => { setSelectedUser(item); setConfirmDeleteId(uid); }}
                                className="p-2 rounded-xl cursor-pointer transition-colors duration-150"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#f87171')}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
                                title="Delete user"
                              >
                                <Trash2 size={15} strokeWidth={1.8} />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            ) : (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)' }}
                    >
                      <Users size={24} style={{ color: 'var(--text-muted)' }} strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      No users match your filters
                    </p>
                    <button
                      onClick={() => { setSearchInput(''); setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
                      className="text-[12px] font-semibold cursor-pointer"
                      style={{ color: 'var(--accent)' }}
                    >
                      Clear filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Showing{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {(pagination.page - 1) * pagination.limit + (users.length ? 1 : 0)}
          </span>
          {' – '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>
          {' of '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pagination.total}</span>
          {' users'}
        </p>

        <div className="flex items-center gap-2">
          <select
            value={pagination.limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="text-[12px] px-2 py-1.5 rounded-lg focus:outline-none cursor-pointer"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>

          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-2 rounded-xl cursor-pointer transition-colors duration-150 disabled:opacity-30"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <span
            className="text-[12px] font-mono px-3 py-1.5 rounded-xl"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={!pagination.hasMore}
            className="p-2 rounded-xl cursor-pointer transition-colors duration-150 disabled:opacity-30"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          SLIDE-OVER: ADD USER
      ════════════════════════════════════════════════════════ */}
      <SlideOver open={showAddPanel} onClose={() => setShowAddPanel(false)}>
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              New Member
            </p>
            <h2
              className="text-xl font-black mt-0.5"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Create User
            </h2>
          </div>
          <button
            onClick={() => setShowAddPanel(false)}
            className="p-2 rounded-xl cursor-pointer transition-colors duration-150"
            style={{ color: 'var(--text-muted)', background: 'var(--glass-bg)' }}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        {renderUserForm(handleCreateSubmit, 'Create User')}
      </SlideOver>

      {/* ════════════════════════════════════════════════════════
          SLIDE-OVER: EDIT USER
      ════════════════════════════════════════════════════════ */}
      <SlideOver open={showEditPanel && !!selectedUser} onClose={() => { setShowEditPanel(false); setSelectedUser(null); }}>
        {selectedUser && (
          <>
            <div
              className="px-6 py-5 shrink-0"
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold overflow-hidden"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                  >
                    {selectedUser.profilePicUrl
                      ? <img src={selectedUser.profilePicUrl} alt={selectedUser.name} className="w-full h-full object-cover" />
                      : selectedUser.name.charAt(0).toUpperCase()
                    }
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      Editing
                    </p>
                    <h2
                      className="text-lg font-black"
                      style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
                    >
                      {selectedUser.name}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => { setShowEditPanel(false); setSelectedUser(null); }}
                  className="p-2 rounded-xl cursor-pointer"
                  style={{ color: 'var(--text-muted)', background: 'var(--glass-bg)' }}
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
            </div>
            {renderUserForm(handleEditSubmit, 'Save Changes')}
          </>
        )}
      </SlideOver>

      {/* ════════════════════════════════════════════════════════
          CENTERED MODAL: RESET LINK
      ════════════════════════════════════════════════════════ */}
      <CenteredModal open={showResetLinkModal && !!selectedUser && !!activeResetLink} onClose={() => setShowResetLinkModal(false)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Credential Reset
            </p>
            <h3 className="text-xl font-black mt-0.5" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Reset Link Ready
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            <KeyRound size={18} strokeWidth={1.8} />
          </div>
        </div>

        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Valid for 24 hours for <strong style={{ color: 'var(--text-primary)' }}>{selectedUser?.name}</strong>.
          Share this link securely.
        </p>

        <div
          className="flex items-center gap-2 p-3 rounded-xl"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)' }}
        >
          <input
            readOnly value={activeResetLink || ''}
            className="bg-transparent text-[12px] font-mono flex-1 outline-none truncate"
            style={{ color: 'var(--text-secondary)' }}
          />
          <button
            onClick={() => copyToClipboard(activeResetLink!, 'Reset link copied!')}
            className="p-1.5 rounded-lg cursor-pointer transition-colors duration-150"
            style={{ color: 'var(--accent)' }}
          >
            <Copy size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowResetLinkModal(false)} className="btn-secondary flex-1 py-2.5 text-sm">Close</button>
          <button onClick={() => copyToClipboard(activeResetLink!, 'Copied!')} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
            <Copy size={14} strokeWidth={2} /> Copy Link
          </button>
        </div>
      </CenteredModal>

      {/* ════════════════════════════════════════════════════════
          CENTERED MODAL: FORCE RESET (SuperAdmin)
      ════════════════════════════════════════════════════════ */}
      <CenteredModal open={showForceResetModal && !!selectedUser} onClose={() => { setShowForceResetModal(false); setGeneratedTempPassword(null); }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#f59e0b' }}>
              SuperAdmin · Elevated Override
            </p>
            <h3 className="text-xl font-black mt-0.5" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Force Reset
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>
            <Crown size={18} strokeWidth={1.8} />
          </div>
        </div>

        {!generatedTempPassword ? (
          <>
            <div
              className="p-4 rounded-2xl text-[13px] leading-relaxed space-y-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#fbbf24' }}
            >
              <div className="flex items-center gap-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                <AlertTriangle size={15} strokeWidth={2} style={{ color: '#f59e0b' }} />
                Critical Privilege Action
              </div>
              <p>
                This will immediately overwrite the password for{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{selectedUser?.name}</strong> and
                terminate all active sessions.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForceResetModal(false)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
              <button
                onClick={executeForceReset}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors duration-150"
                style={{ background: '#f59e0b', color: '#000' }}
              >
                {actionLoading ? <Loader2 size={15} className="animate-spin" /> : 'Generate Temp Password'}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div
              className="p-4 rounded-2xl flex items-start gap-3"
              style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}
            >
              <CheckCircle2 size={16} strokeWidth={2} style={{ color: '#34d399', flexShrink: 0, marginTop: 2 }} />
              <p className="text-[13px]" style={{ color: '#34d399' }}>Password reset successful. One-time credentials below:</p>
            </div>
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <code className="text-base font-mono font-bold flex-1 tracking-widest" style={{ color: '#fbbf24' }}>
                {generatedTempPassword}
              </code>
              <button
                onClick={() => copyToClipboard(generatedTempPassword!, 'Temporary password copied!')}
                className="p-1.5 rounded-lg cursor-pointer"
                style={{ color: '#f59e0b' }}
              >
                <Copy size={14} strokeWidth={2} />
              </button>
            </div>
            <button
              onClick={() => { setShowForceResetModal(false); setGeneratedTempPassword(null); setSelectedUser(null); }}
              className="btn-primary w-full py-2.5 text-sm"
            >
              Done & Close
            </button>
          </div>
        )}
      </CenteredModal>
    </div>
  );
};

export default UserManagement;
