import React, { useEffect, useState, useRef } from 'react';
import useUserStore from '../store/useUserStore';
import useAuthStore from '../store/useAuthStore';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Users, Search, Shield, ShieldAlert, ShieldCheck,
  Trash2, KeyRound, Check, X, AlertTriangle,
  Loader2, UserPlus, Crown, Copy, RefreshCw,
  Edit, ChevronLeft, ChevronRight, CheckCircle2,
  Sparkles, Mail, Lock, Unlock, ArrowRight, Upload, FileSpreadsheet, Share2, Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { User, UserRole } from '../types/user';
import { useDebounce } from '../hooks/useDebounce';
import OnboardingStatsWidget from '../components/admin/OnboardingStatsWidget';
import ResponsiveModal from '../components/ui/ResponsiveModal';
import StudentCourseAccessModal from '../components/domains/StudentCourseAccessModal';
import { EmilCard } from '../components/ui/emil-ui';
import { HeroInput, HeroTabs, HeroUser, HeroAvatar } from '../components/ui/HeroUIComponents';
import { HeroUISelect } from '../components/ui/HeroUISelect';

// ── Role helpers ────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { color: string; bg: string; Icon: React.ComponentType<any> }> = {
  SuperAdmin: { color: 'var(--accent)', bg: 'var(--accent-subtle)', Icon: Crown },
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
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
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

// ── Centered Modal wrapper (powered by ResponsiveModal for Desktop Dialog + iOS Drawer)
const CenteredModal: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, onClose, children }) => (
  <ResponsiveModal
    open={open}
    onOpenChange={(val) => {
      if (!val) onClose();
    }}
  >
    {children}
  </ResponsiveModal>
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
      <p className="text-sm font-medium mt-1 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{label}</p>
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

  // Table search state & lagging debounced value
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const isSearchMounted = useRef(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Panel/modal states
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showResetLinkModal, setShowResetLinkModal] = useState(false);
  const [showForceResetModal, setShowForceResetModal] = useState(false);
  const [showCourseAccessModal, setShowCourseAccessModal] = useState(false);

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
  const [showOnboardingWidget, setShowOnboardingWidget] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Sync debounced search to store / trigger API fetch
  useEffect(() => {
    if (!isSearchMounted.current) {
      isSearchMounted.current = true;
      return;
    }
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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

  const handleShareResetLink = async (link: string, userName?: string) => {
    if (!link) return;
    const shareData = {
      title: 'Code Circle - Password Reset Link',
      text: userName ? `Password reset link for ${userName}:` : 'Password reset link:',
      url: link,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Link shared successfully!');
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback: Copy to clipboard
    copyToClipboard(link, 'Reset link copied to clipboard!');
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

  // ── Excel Export Handler (Students' emails and info) ──────────────────────
  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      toast.loading('Generating Students Excel Sheet...', { id: 'export-excel' });

      // Primary strategy: request pre-formatted spreadsheet from server
      try {
        const response = await api.get('/users/export', {
          params: {
            role: filters.role !== 'all' ? filters.role : 'Student',
            status: filters.status !== 'all' ? filters.status : undefined,
            search: filters.search || undefined,
          },
          responseType: 'blob',
        });

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.setAttribute('download', `Students_Directory_${timestamp}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Students Excel sheet downloaded successfully!', { id: 'export-excel' });
        return;
      } catch (backendErr) {
        console.warn('Direct server export failed, generating Excel client-side:', backendErr);
      }

      // Resilient fallback: fetch all students and generate using client-side XLSX
      const res = await api.get('/users', {
        params: {
          limit: 2000,
          role: filters.role !== 'all' ? filters.role : 'Student',
          status: filters.status !== 'all' ? filters.status : undefined,
          search: filters.search || undefined,
        },
      });

      const usersToExport = res.data?.data?.users || res.data?.users || users;
      const studentList = usersToExport.filter((u: any) => filters.role !== 'all' ? true : u.role === 'Student' || !u.role);

      if (!studentList || studentList.length === 0) {
        toast.error('No students found to export', { id: 'export-excel' });
        return;
      }

      const rows = studentList.map((u: any, idx: number) => ({
        'S.No': idx + 1,
        'Name': u.name || '',
        'Roll Number': u.rollNo || '',
        'Email Address': u.email || '',
        'Department': u.department || 'N/A',
        'Year': u.year || 'N/A',
        'College': u.college || 'BIT',
        'Phone': u.phone || u.phoneNumber || 'N/A',
        'Role': u.role || 'Student',
        'Points': u.points || 0,
        'Status': u.isBlocked ? 'Blocked' : u.isRestricted ? 'Restricted' : 'Active',
        'Registration Date': u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 25 },
        { wch: 16 },
        { wch: 32 },
        { wch: 20 },
        { wch: 10 },
        { wch: 15 },
        { wch: 16 },
        { wch: 12 },
        { wch: 10 },
        { wch: 12 },
        { wch: 16 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      XLSX.writeFile(wb, `Students_Directory_${timestamp}.xlsx`);
      toast.success('Students Excel sheet downloaded successfully!', { id: 'export-excel' });
    } catch (err: any) {
      console.error('Failed to export students Excel:', err);
      toast.error('Failed to generate Excel sheet', { id: 'export-excel' });
    } finally {
      setExportingExcel(false);
    }
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

  const handleExportSelectedExcel = () => {
    if (selectedIds.length === 0) return;
    const selectedUsers = users.filter((u) => selectedIds.includes(u._id || u.id!));
    if (selectedUsers.length === 0) {
      toast.error('No selected student records found in memory');
      return;
    }
    const rows = selectedUsers.map((u: any, idx: number) => ({
      'S.No': idx + 1,
      'Name': u.name || '',
      'Roll Number': u.rollNo || '',
      'Email Address': u.email || '',
      'Department': u.department || 'N/A',
      'Year': u.year || 'N/A',
      'College': u.college || 'BIT',
      'Phone': u.phone || u.phoneNumber || 'N/A',
      'Role': u.role || 'Student',
      'Points': u.points || 0,
      'Status': u.isBlocked ? 'Blocked' : u.isRestricted ? 'Restricted' : 'Active',
      'Registration Date': u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 16 },
      { wch: 32 },
      { wch: 20 },
      { wch: 10 },
      { wch: 15 },
      { wch: 16 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 16 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Selected Students');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    XLSX.writeFile(wb, `Selected_Students_${timestamp}.xlsx`);
    toast.success(`Exported ${selectedUsers.length} selected students!`);
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

  // ── Shared form body with HeroUI Inputs & Select ──────────────────────────
  const renderUserForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4 py-2 px-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HeroInput
          label="Full Name"
          labelPlacement="inside"
          variant="flat"
          isRequired
          placeholder="Jane Doe"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <HeroInput
          label="Roll Number"
          labelPlacement="inside"
          variant="flat"
          isRequired
          placeholder="21CSE101"
          value={formData.rollNo}
          onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
        />
      </div>

      <HeroInput
        label="Email Address"
        labelPlacement="inside"
        variant="flat"
        type="email"
        isRequired
        placeholder="user@university.edu"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HeroUISelect
          label="Assigned Role"
          value={formData.role}
          onChange={(val) => setFormData({ ...formData, role: val as UserRole })}
          options={[
            { value: 'Student', label: 'Student' },
            ...(isSuperAdmin() ? [{ value: 'Admin', label: 'Admin' }] : []),
            ...(isSuperAdmin() ? [{ value: 'SuperAdmin', label: 'SuperAdmin' }] : []),
          ]}
        />
        <HeroInput
          label="Department"
          labelPlacement="inside"
          variant="flat"
          placeholder="e.g. Computer Science"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
        />
      </div>

      {submitLabel === 'Create User' && (
        <HeroInput
          label="Initial Password (optional)"
          labelPlacement="inside"
          variant="flat"
          type="password"
          placeholder="Leave blank for auto-generated"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
      )}

      <div className="flex gap-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={actionLoading}
          className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-3 min-h-[46px]"
        >
          {actionLoading ? <Loader2 size={16} className="animate-spin" /> : submitLabel}
        </motion.button>
      </div>
    </form>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-0">

      {/* ── Page Header ── */}
      <div className="py-6 sm:py-8 md:py-10">
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
              <p className="mt-2 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                {isSuperAdmin() && (
                  <span className="font-semibold text-accent">SuperAdmin · </span>
                )}
                Full access control, credentials, and role management.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <HeroMetric value={pagination.total} label="Total Members" />
              <div className="w-px h-10 self-center hidden sm:block" style={{ background: 'var(--border-color)' }} />

              <div className="flex flex-wrap items-center gap-2">
                {isSuperAdmin() && (
                  <button
                    onClick={() => setShowCourseAccessModal(true)}
                    className="btn-secondary whitespace-nowrap flex items-center gap-2 text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[40px] cursor-pointer text-amber-500 hover:bg-amber-500/10 border-amber-500/30"
                    title="Manage selective student permissions for courses"
                  >
                    <Crown size={15} strokeWidth={2} />
                    <span>Course Access</span>
                  </button>
                )}
                <button
                  onClick={() => setShowOnboardingWidget((prev) => !prev)}
                  className={`btn-secondary whitespace-nowrap flex items-center gap-2 text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[40px] cursor-pointer ${
                    showOnboardingWidget ? 'bg-accent/15 text-accent border-accent/40 font-semibold' : ''
                  }`}
                  title="Toggle Student Onboarding Tracker"
                >
                  <CheckCircle2 size={15} strokeWidth={2} className={showOnboardingWidget ? 'text-accent' : ''} />
                  <span>{showOnboardingWidget ? 'Hide Onboarding' : 'Onboarding Tracker'}</span>
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleExportExcel}
                  disabled={exportingExcel}
                  className="btn-secondary whitespace-nowrap flex items-center gap-2 text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[40px] cursor-pointer text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/30 font-medium"
                  title="Download Excel spreadsheet containing students' emails and roster"
                >
                  {exportingExcel ? (
                    <Loader2 size={15} className="animate-spin text-emerald-400" />
                  ) : (
                    <FileSpreadsheet size={15} strokeWidth={2} className="text-emerald-400" />
                  )}
                  <span>{exportingExcel ? 'Exporting...' : 'Download Excel'}</span>
                </motion.button>
                <button
                  onClick={() => {
                    resetBulkUpload();
                    setShowBulkUploadPanel(true);
                  }}
                  className="btn-secondary whitespace-nowrap flex items-center gap-2 text-xs sm:text-sm px-3.5 sm:px-5 py-2 sm:py-2.5 min-h-[40px] cursor-pointer"
                >
                  <Upload size={15} strokeWidth={2} />
                  <span>Bulk Upload</span>
                </button>
                <button
                  onClick={() => {
                    setDeleteAllConfirmText('');
                    setShowDeleteAllModal(true);
                  }}
                  className="btn-secondary whitespace-nowrap flex items-center gap-2 text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[40px] cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  title="Wipe or bulk delete all students"
                >
                  <Trash2 size={15} strokeWidth={2} />
                  <span>Delete All Students</span>
                </button>
                <button
                  onClick={() => {
                    setFormData({ name: '', email: '', rollNo: '', role: 'Student', department: '', password: '' });
                    setShowAddPanel(true);
                  }}
                  className="btn-primary whitespace-nowrap flex items-center gap-2 text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 min-h-[40px] cursor-pointer"
                >
                  <UserPlus size={15} strokeWidth={2} />
                  <span>Add User</span>
                </button>
                <button
                  onClick={() => fetchUsers()}
                  disabled={loading}
                  className="p-2 sm:p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl cursor-pointer transition-colors duration-150 btn-secondary"
                  aria-label="Refresh user directory"
                >
                  <RefreshCw size={16} strokeWidth={1.8} className={loading ? 'animate-spin text-accent' : ''} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Onboarding Tracker Widget Section ── */}
      <AnimatePresence>
        {showOnboardingWidget && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-8 overflow-hidden"
          >
            <OnboardingStatsWidget />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col md:flex-row md:items-center gap-4 pb-4"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        {/* Search with Apple Glass styling */}
        <div className="flex-1">
          <HeroInput
            placeholder="Search name, roll number, email..."
            value={searchTerm}
            onChange={handleSearchChange}
            startContent={<Search size={16} strokeWidth={1.8} className="text-text-muted" />}
            isClearable
            onClear={() => {
              setSearchTerm('');
              setSearch('');
            }}
            variant="flat"
            size="sm"
          />
        </div>

        {/* Status filter tabs with Emil Kowalski sub-300ms spring motion */}
        <HeroTabs
          size="sm"
          selectedKey={filters.status}
          onSelectionChange={(key) => setStatusFilter(key as any)}
          items={[
            { id: 'all', label: 'All Status' },
            { id: 'active', label: 'Active' },
            { id: 'blocked', label: 'Blocked' },
          ]}
        />

        {/* Role filter tabs with Emil Kowalski sub-300ms spring motion */}
        <HeroTabs
          size="sm"
          selectedKey={filters.role}
          onSelectionChange={(key) => setRoleFilter(key)}
          items={[
            { id: 'all', label: 'All Roles' },
            { id: 'Student', label: 'Students' },
            { id: 'Admin', label: 'Admins' },
          ]}
        />
      </motion.div>

      {/* ── Table (Wrapped in EmilCard with monochrome row selection) ── */}
      <EmilCard className="overflow-hidden p-0 border border-separator/80">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[760px] text-left" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th
                className="py-4 pl-4 sm:pl-5 pr-2 w-10 text-left"
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
                  className="py-4 px-4 sm:px-5 text-[10px] font-semibold uppercase tracking-widest"
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
                        background: isSelected ? 'var(--accent-subtle)' : undefined,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--glass-bg)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = isSelected ? 'var(--accent-subtle)' : 'transparent';
                      }}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-4 sm:py-5 pl-4 sm:pl-5 pr-2 w-10">
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

                      {/* User — HeroUI User with Avatar isBordered */}
                      <td className="py-4 sm:py-5 px-4 sm:px-5">
                        <HeroUser
                          name={item.name}
                          description={<span className="font-mono text-xs">{item.email}</span>}
                          avatarProps={{
                            src: item.profilePicUrl,
                            name: item.name,
                            isBordered: true,
                            color: 'primary',
                            size: 'sm',
                          }}
                        />
                      </td>

                      {/* Roll No */}
                      <td className="py-4 sm:py-5 px-4 sm:px-5">
                        <span
                          className="text-[12px] font-mono font-semibold tracking-wider"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {item.rollNo}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="py-4 sm:py-5 px-4 sm:px-5">
                        <RoleBadge role={item.role} />
                      </td>

                      {/* Department */}
                      <td className="py-4 sm:py-5 px-4 sm:px-5">
                        <span className="text-[13px] whitespace-nowrap" style={{ color: item.department ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                          {item.department || <span className="italic text-[12px]">—</span>}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 sm:py-5 px-4 sm:px-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.isBlocked ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
                              style={{ background: 'var(--destructive-subtle)', color: 'var(--destructive)', border: '1px solid var(--destructive-subtle)' }}
                            >
                              <ShieldAlert size={11} strokeWidth={2.5} /> Blocked
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
                              style={{ background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid var(--success-subtle)' }}
                            >
                              <CheckCircle2 size={11} strokeWidth={2.5} /> Active
                            </span>
                          )}

                          {item.isRestricted && (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
                              style={{ background: 'var(--destructive-subtle)', color: 'var(--destructive)', border: '1px solid var(--destructive-subtle)' }}
                              title={`Restricted: ${item.restrictionReason || 'Academic restriction active'}`}
                            >
                              <Lock size={11} strokeWidth={2.5} /> Restricted
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions - visible on touch devices via opacity-100 sm:opacity-0 */}
                      <td className="py-4 sm:py-5 px-4 sm:px-5 text-right">
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
                                className="px-3 py-1.5 min-h-[34px] rounded-lg text-[12px] font-semibold cursor-pointer transition-colors duration-150 flex items-center justify-center"
                                style={{ background: 'var(--destructive-subtle)', color: 'var(--destructive)' }}
                              >
                                {actionLoading ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg cursor-pointer transition-colors duration-150"
                                style={{ color: 'var(--text-muted)' }}
                                aria-label="Cancel deletion"
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
                              className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
                            >
                              {/* Reset Link */}
                              <button
                                onClick={() => handleTriggerResetLink(item)}
                                className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl cursor-pointer transition-colors duration-150"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)')}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
                                title="Generate reset link"
                                aria-label={`Generate reset link for ${item.name}`}
                              >
                                <KeyRound size={15} strokeWidth={1.8} />
                              </button>

                              {/* Force Reset (Admin & SuperAdmin) */}
                              {(isSuperAdmin?.() || isAdmin?.() || currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin') && (currentUser?.role === 'SuperAdmin' || (item.role !== 'SuperAdmin' && item.role !== 'Admin')) && (
                                <button
                                  onClick={() => handleForceResetPassword(item)}
                                  className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl cursor-pointer transition-colors duration-150"
                                  style={{ color: 'var(--text-muted)' }}
                                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--warning)')}
                                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
                                  title="Generate temporary password"
                                  aria-label={`Generate temp password for ${item.name}`}
                                >
                                  <Sparkles size={15} strokeWidth={1.8} />
                                </button>
                              )}

                              {/* Unblock Restrictions */}
                              {item.isRestricted && (
                                <button
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        `Lift all restrictions for ${item.name} (${item.rollNo})? They will immediately regain access to assessments, contests, and courses.`
                                      )
                                    ) {
                                      try {
                                        await api.post(`/users/${item._id || item.id}/unblock-restrictions`);
                                        toast.success(`Restrictions removed for ${item.name}`);
                                        fetchUsers();
                                      } catch (err: any) {
                                        toast.error(err.response?.data?.error || 'Failed to unblock restrictions');
                                      }
                                    }
                                  }}
                                  className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl cursor-pointer transition-colors duration-150 text-success hover:bg-success-subtle"
                                  title="Lift academic restrictions (assessments, contests, courses)"
                                  aria-label={`Lift restrictions for ${item.name}`}
                                >
                                  <Unlock size={15} strokeWidth={2} />
                                </button>
                              )}

                              {/* Block/Unblock */}
                              <button
                                onClick={() => handleToggleBlock(item)}
                                className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl cursor-pointer transition-colors duration-150"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.color = item.isBlocked ? 'var(--success)' : 'var(--warning)';
                                }}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
                                title={item.isBlocked ? 'Unblock' : 'Block'}
                                aria-label={`${item.isBlocked ? 'Unblock' : 'Block'} ${item.name}`}
                              >
                                {item.isBlocked ? <Check size={15} strokeWidth={2} /> : <ShieldAlert size={15} strokeWidth={1.8} />}
                              </button>

                              {/* Edit — opens modal */}
                              <button
                                onClick={() => openEditPanel(item)}
                                className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl cursor-pointer transition-colors duration-150"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)')}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
                                title="Edit user"
                                aria-label={`Edit ${item.name}`}
                              >
                                <Edit size={15} strokeWidth={1.8} />
                              </button>

                              {/* Delete — inline confirm */}
                              <button
                                onClick={() => { setSelectedUser(item); setConfirmDeleteId(uid); }}
                                className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl cursor-pointer transition-colors duration-150"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)')}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
                                title="Delete user"
                                aria-label={`Delete ${item.name}`}
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
                      onClick={() => { setSearchTerm(''); setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
                      className="text-[12px] font-semibold cursor-pointer min-h-[36px]"
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
      </EmilCard>

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
            className="text-[12px] px-2 py-1.5 min-h-[38px] rounded-lg focus:outline-none cursor-pointer"
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
            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl cursor-pointer transition-colors duration-150 disabled:opacity-30"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <span
            className="text-[12px] font-mono px-3 py-1.5 min-h-[38px] flex items-center justify-center rounded-xl"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={!pagination.hasMore}
            className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl cursor-pointer transition-colors duration-150 disabled:opacity-30"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
            aria-label="Next page"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          RESPONSIVE MODAL: CREATE USER
      ════════════════════════════════════════════════════════ */}
      <ResponsiveModal
        open={showAddPanel}
        onOpenChange={setShowAddPanel}
        title="Create User"
        description="Add a new student, faculty member, or administrator"
        dialogClassName="sm:max-w-xl"
      >
        {renderUserForm(handleCreateSubmit, 'Create User')}
      </ResponsiveModal>

      {/* ════════════════════════════════════════════════════════
          RESPONSIVE MODAL: EDIT USER
      ════════════════════════════════════════════════════════ */}
      <ResponsiveModal
        open={showEditPanel && !!selectedUser}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditPanel(false);
            setSelectedUser(null);
          }
        }}
        title={
          selectedUser ? (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold overflow-hidden shrink-0"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
              >
                {selectedUser.profilePicUrl ? (
                  <img
                    src={selectedUser.profilePicUrl}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  selectedUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  Editing Account
                </p>
                <h3 className="text-lg font-bold text-text-primary leading-tight">
                  {selectedUser.name}
                </h3>
              </div>
            </div>
          ) : (
            'Edit User'
          )
        }
        description="Modify student profile details, assigned permissions, and department access."
        dialogClassName="sm:max-w-xl"
      >
        {selectedUser && renderUserForm(handleEditSubmit, 'Save Changes')}
      </ResponsiveModal>

      {/* ════════════════════════════════════════════════════════
          CENTERED MODAL: RESET LINK
      ════════════════════════════════════════════════════════ */}
      <CenteredModal open={showResetLinkModal && !!selectedUser && !!activeResetLink} onClose={() => setShowResetLinkModal(false)}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Credential Reset
            </p>
            <h3 className="text-lg sm:text-xl font-black mt-0.5 truncate" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Reset Link Ready
            </h3>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            <KeyRound size={18} strokeWidth={1.8} />
          </div>
        </div>

        <p className="text-xs sm:text-[13px] leading-relaxed break-words" style={{ color: 'var(--text-muted)' }}>
          Valid for 24 hours for <strong style={{ color: 'var(--text-primary)' }}>{selectedUser?.name}</strong>.
          Share this link securely with the student.
        </p>

        {/* Link input with quick copy and share icons */}
        <div
          className="flex items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)' }}
        >
          <input
            readOnly
            value={activeResetLink || ''}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="bg-transparent text-[11px] sm:text-[12px] font-mono flex-1 outline-none truncate select-all"
            style={{ color: 'var(--text-secondary)' }}
            placeholder="Reset Link"
          />
          <button
            onClick={() => copyToClipboard(activeResetLink!, 'Reset link copied!')}
            className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
            style={{ color: 'var(--accent)' }}
            title="Copy reset link"
            aria-label="Copy reset link"
          >
            <Copy size={15} strokeWidth={2} />
          </button>
          <button
            onClick={() => handleShareResetLink(activeResetLink!, selectedUser?.name)}
            className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
            style={{ color: 'var(--accent)' }}
            title="Share reset link"
            aria-label="Share reset link"
          >
            <Share2 size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Action buttons - responsive layout for all mobile and desktop screens */}
        <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
          <button
            onClick={() => setShowResetLinkModal(false)}
            className="btn-secondary w-full sm:w-auto px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold"
          >
            Close
          </button>
          <button
            onClick={() => copyToClipboard(activeResetLink!, 'Reset link copied!')}
            className="btn-secondary w-full sm:flex-1 py-2.5 min-h-[42px] text-xs sm:text-sm flex items-center justify-center gap-2 font-semibold"
          >
            <Copy size={14} strokeWidth={2} /> <span>Copy Link</span>
          </button>
          <button
            onClick={() => handleShareResetLink(activeResetLink!, selectedUser?.name)}
            className="btn-primary w-full sm:flex-1 py-2.5 min-h-[42px] text-xs sm:text-sm flex items-center justify-center gap-2 font-semibold shadow-sm"
          >
            <Share2 size={14} strokeWidth={2} /> <span>Share Link</span>
          </button>
        </div>
      </CenteredModal>

      {/* ════════════════════════════════════════════════════════
          CENTERED MODAL: FORCE RESET (SuperAdmin)
      ════════════════════════════════════════════════════════ */}
      <CenteredModal open={showForceResetModal && !!selectedUser} onClose={() => { setShowForceResetModal(false); setGeneratedTempPassword(null); }}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest truncate" style={{ color: 'var(--warning)' }}>
              Admin / SuperAdmin Action
            </p>
            <h3 className="text-lg sm:text-xl font-black mt-0.5 truncate" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Temporary Password Generation
            </h3>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--warning-subtle)', color: 'var(--warning)' }}>
            <KeyRound size={18} strokeWidth={1.8} />
          </div>
        </div>

        {!generatedTempPassword ? (
          <>
            <div
              className="p-3.5 sm:p-4 rounded-2xl text-xs sm:text-[13px] leading-relaxed space-y-2"
              style={{ background: 'var(--warning-subtle)', border: '1px solid var(--warning-subtle)', color: 'var(--warning)' }}
            >
              <div className="flex items-center gap-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                <ShieldAlert size={15} strokeWidth={2} style={{ color: 'var(--warning)' }} />
                Temporary Access Generation
              </div>
              <p>
                This will generate a secure temporary password for{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{selectedUser?.name}</strong>.
                When the student signs in with this temporary password, they will be required to create their own personal password before accessing Code Circle.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
              <button onClick={() => setShowForceResetModal(false)} className="btn-secondary w-full sm:flex-1 py-2.5 min-h-[42px] text-xs sm:text-sm">Cancel</button>
              <button
                onClick={executeForceReset}
                disabled={actionLoading}
                className="w-full sm:flex-1 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors duration-150"
                style={{ background: 'var(--warning)', color: '#FFFFFF' }}
              >
                {actionLoading ? <Loader2 size={15} className="animate-spin" /> : 'Generate Temp Password'}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div
              className="p-3.5 sm:p-4 rounded-2xl flex items-start gap-3"
              style={{ background: 'var(--success-subtle)', border: '1px solid var(--success-subtle)' }}
            >
              <CheckCircle2 size={16} strokeWidth={2} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
              <p className="text-xs sm:text-[13px]" style={{ color: 'var(--success)' }}>Temporary password generated. Hand off to the student; they will be prompted to create their own personal password upon login:</p>
            </div>
            <div
              className="flex items-center gap-2 sm:gap-3 p-3.5 sm:p-4 rounded-xl"
              style={{ background: 'var(--warning-subtle)', border: '1px solid var(--warning-subtle)' }}
            >
              <code className="text-sm sm:text-base font-mono font-bold flex-1 tracking-widest break-all" style={{ color: 'var(--warning)' }}>
                {generatedTempPassword}
              </code>
              <button
                onClick={() => copyToClipboard(generatedTempPassword!, 'Temporary password copied!')}
                className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg cursor-pointer hover:bg-surface-secondary shrink-0"
                style={{ color: 'var(--warning)' }}
                title="Copy temporary password"
              >
                <Copy size={15} strokeWidth={2} />
              </button>
              <button
                onClick={() => handleShareResetLink(generatedTempPassword!, selectedUser?.name)}
                className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg cursor-pointer hover:bg-surface-secondary shrink-0"
                style={{ color: 'var(--warning)' }}
                title="Share temporary password"
              >
                <Share2 size={15} strokeWidth={2} />
              </button>
            </div>
            <button
              onClick={() => { setShowForceResetModal(false); setGeneratedTempPassword(null); setSelectedUser(null); }}
              className="btn-primary w-full py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold"
            >
              Done & Close
            </button>
          </div>
        )}
      </CenteredModal>

      {/* ════════════════════════════════════════════════════════
          FLOATING BULK ACTION BAR (RESPONSIVE)
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border w-[calc(100%-2rem)] max-w-lg sm:w-auto"
            style={{
              background: 'var(--surface-overlay)',
              borderColor: 'var(--separator)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-accent animate-pulse shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-label-primary whitespace-nowrap">
                {selectedIds.length} student{selectedIds.length > 1 ? 's' : ''} selected
              </span>
            </div>

            <div className="h-4 w-px bg-separator-opaque hidden sm:block" />

            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 min-h-[36px] text-xs font-medium text-label-secondary hover:text-label-primary rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer flex items-center justify-center"
              >
                Clear
              </button>

              <button
                onClick={handleExportSelectedExcel}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 min-h-[36px] text-xs font-semibold text-success bg-success-subtle hover:bg-success-subtle/80 border border-success/30 rounded-xl transition-colors cursor-pointer justify-center"
                title="Export selected students to Excel spreadsheet"
              >
                <FileSpreadsheet size={13} strokeWidth={2.2} />
                <span>Export ({selectedIds.length})</span>
              </button>

              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 min-h-[36px] text-xs font-semibold text-destructive bg-destructive-subtle hover:bg-destructive-subtle/80 border border-destructive/30 rounded-xl transition-colors cursor-pointer justify-center"
              >
                <Trash2 size={13} strokeWidth={2.2} />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          CENTERED MODAL: BULK DELETE SELECTED
      ════════════════════════════════════════════════════════ */}
      <CenteredModal open={showBulkDeleteModal} onClose={() => setShowBulkDeleteModal(false)}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-red-400">
              Bulk Deletion
            </p>
            <h3 className="text-lg sm:text-xl font-black mt-0.5" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Delete {selectedIds.length} Student{selectedIds.length > 1 ? 's' : ''}?
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400 shrink-0">
            <Trash2 size={18} strokeWidth={2} />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-xs sm:text-[13px] leading-relaxed space-y-2 text-red-200">
          <p>
            You are about to permanently remove <strong className="text-white font-bold">{selectedIds.length}</strong> selected student account(s).
          </p>
          <p className="text-xs text-red-300/80">
            This action is immediate and cannot be undone. Any profile data or enrollments associated with these students will be deleted.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
          <button
            onClick={() => setShowBulkDeleteModal(false)}
            disabled={bulkDeleting}
            className="btn-secondary w-full sm:flex-1 py-2.5 min-h-[42px] text-xs sm:text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteBulkDelete}
            disabled={bulkDeleting}
            className="w-full sm:flex-1 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors bg-red-600 hover:bg-red-700 text-white"
          >
            {bulkDeleting ? <Loader2 size={15} className="animate-spin" /> : `Delete (${selectedIds.length})`}
          </button>
        </div>
      </CenteredModal>

      {/* ════════════════════════════════════════════════════════
          CENTERED MODAL: DELETE ALL STUDENTS (Wipe)
      ════════════════════════════════════════════════════════ */}
      <CenteredModal open={showDeleteAllModal} onClose={() => { setShowDeleteAllModal(false); setDeleteAllConfirmText(''); }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-red-400">
              Danger Zone · Wipe Operation
            </p>
            <h3 className="text-lg sm:text-xl font-black mt-0.5" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Delete All Students
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400 shrink-0">
            <AlertTriangle size={18} strokeWidth={2} />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs sm:text-[13px] leading-relaxed space-y-2 text-red-200">
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
            className="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-mono border focus:outline-none"
            style={{
              background: 'var(--surface-elevated)',
              borderColor: deleteAllConfirmText === 'DELETE' ? 'var(--destructive)' : 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
          <button
            onClick={() => {
              setShowDeleteAllModal(false);
              setDeleteAllConfirmText('');
            }}
            disabled={bulkDeleting}
            className="btn-secondary w-full sm:flex-1 py-2.5 min-h-[42px] text-xs sm:text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteDeleteAll}
            disabled={bulkDeleting || deleteAllConfirmText.trim() !== 'DELETE'}
            className="w-full sm:flex-1 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 text-white"
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
          className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Import Students
            </p>
            <h2
              className="text-lg sm:text-xl font-black mt-0.5"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Bulk Upload
            </h2>
          </div>
          <button
            onClick={() => setShowBulkUploadPanel(false)}
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl cursor-pointer transition-colors duration-150"
            style={{ color: 'var(--text-muted)', background: 'var(--glass-bg)' }}
            aria-label="Close bulk upload panel"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 sm:py-6 space-y-6">
          {/* Info Banner */}
          <div
            className="p-4 rounded-2xl text-xs sm:text-[13px] leading-relaxed space-y-2"
            style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-subtle)' }}
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
              className="relative rounded-2xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-10 sm:py-12 gap-4"
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
              className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-color)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}
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
                className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg cursor-pointer transition-colors"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Remove selected file"
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
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 min-h-[46px] text-sm cursor-pointer"
            >
              {bulkUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Uploading & Processing...</span>
                </>
              ) : (
                <>
                  <Upload size={16} strokeWidth={2} />
                  <span>Upload & Create Students</span>
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
                  style={{ background: 'var(--success-subtle)', border: '1px solid var(--success-subtle)' }}
                >
                  <p className="text-2xl font-black" style={{ color: 'var(--success)' }}>
                    {bulkResult.summary?.created || 0}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--success)' }}>
                    Created
                  </p>
                </div>
                <div
                  className="p-4 rounded-xl text-center"
                  style={{ background: 'var(--warning-subtle)', border: '1px solid var(--warning-subtle)' }}
                >
                  <p className="text-2xl font-black" style={{ color: 'var(--warning)' }}>
                    {bulkResult.summary?.duplicatesSkipped || 0}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--warning)' }}>
                    Skipped
                  </p>
                </div>
              </div>

              {/* Success Message */}
              <div
                className="p-4 rounded-2xl flex items-start gap-3"
                style={{ background: 'var(--success-subtle)', border: '1px solid var(--success-subtle)' }}
              >
                <CheckCircle2 size={16} strokeWidth={2} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--success)' }}>
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
                        <span className="text-[10px]" style={{ color: 'var(--warning)' }}>{d.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowBulkUploadPanel(false); resetBulkUpload(); }}
                  className="btn-secondary flex-1 py-2.5 min-h-[42px] text-xs sm:text-sm"
                >
                  Close
                </button>
                <button
                  onClick={resetBulkUpload}
                  className="btn-primary flex-1 py-2.5 min-h-[42px] text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <Upload size={14} strokeWidth={2} />
                  <span>Upload Another</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </SlideOver>

      {/* SuperAdmin Student Course Access Modal */}
      {showCourseAccessModal && (
        <StudentCourseAccessModal
          isOpen={showCourseAccessModal}
          onClose={() => setShowCourseAccessModal(false)}
        />
      )}
    </div>
  );
};

export default UserManagement;
