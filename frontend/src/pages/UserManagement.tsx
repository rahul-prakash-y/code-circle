import React, { useEffect, useState, useRef } from 'react';
import useUserStore from '../store/useUserStore';
import useAuthStore from '../store/useAuthStore';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Users, Search, Shield, ShieldAlert, ShieldCheck,
  Trash2, KeyRound, Check, X, AlertTriangle,
  Loader2, UserPlus, Crown, Copy, RefreshCw,
  Edit, ChevronLeft, ChevronRight, CheckCircle2,
  Sparkles, Mail, Lock, ArrowRight, Upload, FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { User, UserRole } from '../types/user';

// ── Role helpers ────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { color: string; bg: string; Icon: React.ComponentType<any> }> = {
  SuperAdmin: { color: 'var(--accent)', bg: 'rgba(0,113,227,0.08)', Icon: Crown },
  Admin: { color: 'var(--text-primary)', bg: 'var(--surface-elevated)', Icon: ShieldCheck },
  Faculty: { color: 'var(--text-secondary)', bg: 'var(--surface-elevated)', Icon: Shield },
  Committee: { color: 'var(--text-secondary)', bg: 'var(--surface-elevated)', Icon: Shield },
  Student: { color: 'var(--text-muted)', bg: 'var(--surface-elevated)', Icon: Users },
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const meta = ROLE_META[role] || ROLE_META.Student;
  const { Icon } = meta;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: meta.bg, color: meta.color, border: `1px solid var(--border-color)` }}
    >
      <Icon size={11} strokeWidth={2} />
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
    forceResetPassword, bulkUploadUsers, bulkDeleteUsers,
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

  // Bulk delete state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('');
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', rollNo: '', role: 'Student' as UserRole, department: '', password: '',
  });
  const [activeResetLink, setActiveResetLink] = useState<string | null>(null);
  const [generatedTempPassword, setGeneratedTempPassword] = useState<string | null>(null);

  // Bulk upload state
  const [showBulkUploadPanel, setShowBulkUploadPanel] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

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

  // ── Bulk Upload Handlers ──────────────────────────────────────────────────
  const handleBulkFileSelect = (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      toast.error('Only .xlsx and .xls files are accepted');
      return;
    }
    setBulkFile(file);
    setBulkResult(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return toast.error('Please select a file first');
    setBulkUploading(true);
    const res = await bulkUploadUsers(bulkFile);
    setBulkUploading(false);
    if (res.success) {
      setBulkResult(res);
      toast.success(res.message || 'Bulk upload complete!');
    } else {
      toast.error(res.error || 'Bulk upload failed');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleBulkFileSelect(file);
  };

  const resetBulkUpload = () => {
    setBulkFile(null);
    setBulkResult(null);
    setBulkUploading(false);
  };

  // ── Bulk Delete Handlers ──────────────────────────────────────────────────
  const currentPageStudents = users.filter((u) => u.role === 'Student');
  const allPageStudentsSelected =
    currentPageStudents.length > 0 &&
    currentPageStudents.every((u) => selectedIds.includes(u._id || u.id!));

  const handleToggleSelectAllPage = () => {
    const pageStudentIds = currentPageStudents.map((u) => u._id || u.id!);
    if (allPageStudentsSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageStudentIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageStudentIds])));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExecuteBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    const res = await bulkDeleteUsers({ userIds: selectedIds });
    setBulkDeleting(false);
    if (res.success) {
      toast.success(res.message || `Deleted ${res.deletedCount || selectedIds.length} student(s)`);
      setSelectedIds([]);
      setShowBulkDeleteModal(false);
    } else {
      toast.error(res.error || 'Failed to delete students');
    }
  };

  const handleExecuteDeleteAll = async () => {
    if (deleteAllConfirmText.trim() !== 'DELETE') {
      toast.error('Please type "DELETE" exactly to confirm');
      return;
    }
    setBulkDeleting(true);
    const res = await bulkDeleteUsers({ allStudents: true });
    setBulkDeleting(false);
    if (res.success) {
      toast.success(res.message || `Deleted ${res.deletedCount || 0} student(s)`);
      setSelectedIds([]);
      setShowDeleteAllModal(false);
      setDeleteAllConfirmText('');
    } else {
      toast.error(res.error || 'Failed to delete students');
    }
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

      {/* ── Page Header ── */}
      <div className="py-8 md:py-10">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.12em' }}
          >
            Admin Console
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1
                className="font-bold leading-none tracking-tight text-3xl sm:text-4xl"
                style={{ color: 'var(--text-primary)' }}
              >
                User Directory
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                {isSuperAdmin() && (
                  <span className="font-semibold text-accent">SuperAdmin · </span>
                )}
                Full access control, credentials, and role management.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <HeroMetric value={pagination.total} label="Total Members" />
              <div className="w-px h-10 self-center" style={{ background: 'var(--border-color)' }} />

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    resetBulkUpload();
                    setShowBulkUploadPanel(true);
                  }}
                  className="btn-secondary flex items-center gap-2 text-sm px-5 py-2.5 cursor-pointer"
                >
                  <Upload size={15} strokeWidth={2} />
                  Bulk Upload
                </button>
                <button
                  onClick={() => {
                    setDeleteAllConfirmText('');
                    setShowDeleteAllModal(true);
                  }}
                  className="btn-secondary flex items-center gap-2 text-sm px-4 py-2.5 cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  title="Wipe or bulk delete all students"
                >
                  <Trash2 size={15} strokeWidth={2} />
                  Delete All Students
                </button>
                <button
                  onClick={() => {
                    setFormData({ name: '', email: '', rollNo: '', role: 'Student', department: '', password: '' });
                    setShowAddPanel(true);
                  }}
                  className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5 cursor-pointer"
                >
                  <UserPlus size={15} strokeWidth={2} />
                  Add User
                </button>
                <button
                  onClick={() => fetchUsers()}
                  disabled={loading}
                  className="p-2.5 rounded-xl cursor-pointer transition-colors duration-150 btn-secondary"
                >
                  <RefreshCw size={16} strokeWidth={1.8} className={loading ? 'animate-spin text-accent' : ''} />
                </button>
              </div>
            </div>
          </div>
        </div>
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
              <th
                className="py-4 pl-5 pr-2 w-10 text-left"
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                <input
                  type="checkbox"
                  checked={allPageStudentsSelected}
                  onChange={handleToggleSelectAllPage}
                  disabled={currentPageStudents.length === 0}
                  className="w-4 h-4 rounded cursor-pointer accent-[var(--accent)]"
                  title={allPageStudentsSelected ? 'Deselect all on this page' : 'Select all students on this page'}
                />
              </th>
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
                <td colSpan={7} className="py-24 text-center">
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
                  const isSelected = selectedIds.includes(uid);
                  const isStudent = item.role === 'Student';

                  return (
                    <motion.tr
                      key={uid}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                      className="group"
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: isSelected ? 'rgba(0, 113, 227, 0.04)' : undefined,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--glass-bg)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = isSelected ? 'rgba(0, 113, 227, 0.04)' : 'transparent';
                      }}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-5 pl-5 pr-2 w-10">
                        {isStudent ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectUser(uid)}
                            className="w-4 h-4 rounded cursor-pointer accent-[var(--accent)]"
                            title={`Select ${item.name}`}
                          />
                        ) : (
                          <span title="Staff/Admins cannot be bulk deleted" className="opacity-20 cursor-not-allowed inline-block">
                            <input type="checkbox" disabled className="w-4 h-4 rounded opacity-20 cursor-not-allowed" />
                          </span>
                        )}
                      </td>

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

                              {/* Force Reset (Admin & SuperAdmin) */}
                              {(isSuperAdmin?.() || isAdmin?.() || currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin') && (currentUser?.role === 'SuperAdmin' || (item.role !== 'SuperAdmin' && item.role !== 'Admin')) && (
                                <button
                                  onClick={() => handleForceResetPassword(item)}
                                  className="p-2 rounded-xl cursor-pointer transition-colors duration-150"
                                  style={{ color: 'var(--text-muted)' }}
                                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#f59e0b')}
                                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
                                  title="Generate temporary password"
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
                <td colSpan={7} className="py-20 text-center">
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
              Admin / SuperAdmin Action
            </p>
            <h3 className="text-xl font-black mt-0.5" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Temporary Password Generation
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b' }}>
            <KeyRound size={18} strokeWidth={1.8} />
          </div>
        </div>

        {!generatedTempPassword ? (
          <>
            <div
              className="p-4 rounded-2xl text-[13px] leading-relaxed space-y-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#fbbf24' }}
            >
              <div className="flex items-center gap-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                <ShieldAlert size={15} strokeWidth={2} style={{ color: '#f59e0b' }} />
                Temporary Access Generation
              </div>
              <p>
                This will generate a secure temporary password for{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{selectedUser?.name}</strong>.
                When the student signs in with this temporary password, they will be required to create their own personal password before accessing Code Circle.
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
              <p className="text-[13px]" style={{ color: '#34d399' }}>Temporary password generated. Hand off to the student; they will be prompted to create their own personal password upon login:</p>
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

      {/* ════════════════════════════════════════════════════════
          FLOATING BULK ACTION BAR
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border"
            style={{
              background: 'rgba(18, 18, 20, 0.92)',
              borderColor: 'var(--border-color)',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px rgba(0, 113, 227, 0.2)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-semibold text-white whitespace-nowrap">
                {selectedIds.length} student{selectedIds.length > 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="h-4 w-px bg-white/15" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                Clear
              </button>

              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-red-300 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 size={13} strokeWidth={2.2} />
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          CENTERED MODAL: BULK DELETE SELECTED
      ════════════════════════════════════════════════════════ */}
      <CenteredModal open={showBulkDeleteModal} onClose={() => setShowBulkDeleteModal(false)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-red-400">
              Bulk Deletion
            </p>
            <h3 className="text-xl font-black mt-0.5" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Delete {selectedIds.length} Student{selectedIds.length > 1 ? 's' : ''}?
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400">
            <Trash2 size={18} strokeWidth={2} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-[13px] leading-relaxed space-y-2 text-red-200">
          <p>
            You are about to permanently remove <strong className="text-white font-bold">{selectedIds.length}</strong> selected student account(s).
          </p>
          <p className="text-xs text-red-300/80">
            This action is immediate and cannot be undone. Any profile data or enrollments associated with these students will be deleted.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setShowBulkDeleteModal(false)}
            disabled={bulkDeleting}
            className="btn-secondary flex-1 py-2.5 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteBulkDelete}
            disabled={bulkDeleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors bg-red-600 hover:bg-red-700 text-white"
          >
            {bulkDeleting ? <Loader2 size={15} className="animate-spin" /> : `Delete (${selectedIds.length})`}
          </button>
        </div>
      </CenteredModal>

      {/* ════════════════════════════════════════════════════════
          CENTERED MODAL: DELETE ALL STUDENTS (Wipe)
      ════════════════════════════════════════════════════════ */}
      <CenteredModal open={showDeleteAllModal} onClose={() => { setShowDeleteAllModal(false); setDeleteAllConfirmText(''); }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-red-400">
              Danger Zone · Wipe Operation
            </p>
            <h3 className="text-xl font-black mt-0.5" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Delete All Students
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400">
            <AlertTriangle size={18} strokeWidth={2} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-[13px] leading-relaxed space-y-2 text-red-200">
          <p className="font-semibold text-red-100 flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-400 shrink-0" />
            Extreme Safeguard Notice
          </p>
          <p>
            This will permanently delete <strong className="text-white">ALL student accounts</strong> across the entire database.
          </p>
          <p className="text-xs text-red-300/80">
            Admin and SuperAdmin accounts are protected and will NOT be touched.
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            To confirm, type <span className="font-mono font-bold text-red-400">DELETE</span> below:
          </label>
          <input
            type="text"
            value={deleteAllConfirmText}
            onChange={(e) => setDeleteAllConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full px-3.5 py-2 rounded-xl text-sm font-mono border focus:outline-none"
            style={{
              background: 'var(--surface-elevated)',
              borderColor: deleteAllConfirmText === 'DELETE' ? '#ef4444' : 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              setShowDeleteAllModal(false);
              setDeleteAllConfirmText('');
            }}
            disabled={bulkDeleting}
            className="btn-secondary flex-1 py-2.5 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteDeleteAll}
            disabled={bulkDeleting || deleteAllConfirmText.trim() !== 'DELETE'}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 text-white"
          >
            {bulkDeleting ? <Loader2 size={15} className="animate-spin" /> : 'Confirm & Wipe Students'}
          </button>
        </div>
      </CenteredModal>

      {/* ════════════════════════════════════════════════════════
          SLIDE-OVER: BULK UPLOAD
      ════════════════════════════════════════════════════════ */}
      <SlideOver open={showBulkUploadPanel} onClose={() => setShowBulkUploadPanel(false)}>
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Import Students
            </p>
            <h2
              className="text-xl font-black mt-0.5"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Bulk Upload
            </h2>
          </div>
          <button
            onClick={() => setShowBulkUploadPanel(false)}
            className="p-2 rounded-xl cursor-pointer transition-colors duration-150"
            style={{ color: 'var(--text-muted)', background: 'var(--glass-bg)' }}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Info Banner */}
          <div
            className="p-4 rounded-2xl text-[13px] leading-relaxed space-y-2"
            style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)', borderColor: 'rgba(0,113,227,0.15)' }}
          >
            <div className="flex items-center gap-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
              <FileSpreadsheet size={15} strokeWidth={2} style={{ color: 'var(--accent)' }} />
              Excel File Format
            </div>
            <p style={{ color: 'var(--text-muted)' }}>
              Upload an <strong style={{ color: 'var(--text-primary)' }}>.xlsx</strong> file with columns:
              <strong style={{ color: 'var(--text-primary)' }}> Reg No, Student Name, Department, Email</strong>.
              Default password = Roll Number (lowercase). Students must change it on first login.
            </p>
          </div>

          {/* Drag & Drop Zone */}
          {!bulkResult && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => bulkFileInputRef.current?.click()}
              className="relative rounded-2xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-12 gap-4"
              style={{
                border: `2px dashed ${isDragOver ? 'var(--accent)' : 'var(--border-color)'}`,
                background: isDragOver ? 'var(--accent-subtle)' : 'var(--glass-bg)',
              }}
            >
              <input
                ref={bulkFileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBulkFileSelect(file);
                }}
              />
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
              >
                <Upload size={24} strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {isDragOver ? 'Drop file here' : 'Click or drag file to upload'}
                </p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Supports .xlsx and .xls files
                </p>
              </div>
            </div>
          )}

          {/* Selected File Preview */}
          {bulkFile && !bulkResult && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399' }}
              >
                <FileSpreadsheet size={18} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {bulkFile.name}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {(bulkFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setBulkFile(null); }}
                className="p-1.5 rounded-lg cursor-pointer transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          )}

          {/* Upload Button */}
          {bulkFile && !bulkResult && (
            <button
              onClick={handleBulkUpload}
              disabled={bulkUploading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm cursor-pointer"
            >
              {bulkUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading & Processing...
                </>
              ) : (
                <>
                  <Upload size={16} strokeWidth={2} />
                  Upload & Create Students
                </>
              )}
            </button>
          )}

          {/* Results */}
          {bulkResult && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-xl text-center"
                  style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}
                >
                  <p className="text-2xl font-black" style={{ color: '#34d399' }}>
                    {bulkResult.summary?.created || 0}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mt-1" style={{ color: '#34d399' }}>
                    Created
                  </p>
                </div>
                <div
                  className="p-4 rounded-xl text-center"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
                >
                  <p className="text-2xl font-black" style={{ color: '#fbbf24' }}>
                    {bulkResult.summary?.duplicatesSkipped || 0}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mt-1" style={{ color: '#fbbf24' }}>
                    Skipped
                  </p>
                </div>
              </div>

              {/* Success Message */}
              <div
                className="p-4 rounded-2xl flex items-start gap-3"
                style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}
              >
                <CheckCircle2 size={16} strokeWidth={2} style={{ color: '#34d399', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: '#34d399' }}>
                    {bulkResult.message}
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    Default password = Roll Number (lowercase). Students will be prompted to change it on first login.
                  </p>
                </div>
              </div>

              {/* Duplicate Details */}
              {bulkResult.details?.duplicates?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Duplicates Skipped ({bulkResult.details.duplicates.length})
                  </p>
                  <div
                    className="max-h-40 overflow-y-auto rounded-xl p-3 space-y-1.5"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)' }}
                  >
                    {bulkResult.details.duplicates.map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-[12px]">
                        <span style={{ color: 'var(--text-primary)' }}>
                          <span className="font-mono font-semibold" style={{ color: 'var(--text-muted)' }}>{d.rollNo}</span>
                          {' '}{d.name}
                        </span>
                        <span className="text-[10px]" style={{ color: '#fbbf24' }}>{d.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowBulkUploadPanel(false); resetBulkUpload(); }}
                  className="btn-secondary flex-1 py-2.5 text-sm"
                >
                  Close
                </button>
                <button
                  onClick={resetBulkUpload}
                  className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  <Upload size={14} strokeWidth={2} />
                  Upload Another
                </button>
              </div>
            </div>
          )}
        </div>
      </SlideOver>
    </div>
  );
};

export default UserManagement;
