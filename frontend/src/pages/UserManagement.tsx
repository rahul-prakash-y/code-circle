import React, { useEffect, useState, useMemo } from 'react';
import useUserStore from '../store/useUserStore';
import useAuthStore from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Shield, ShieldAlert, ShieldCheck,
  Trash2, KeyRound, Check, X, AlertTriangle,
  Loader2, UserPlus, Crown, Copy, RefreshCw,
  Edit, ChevronLeft, ChevronRight, CheckCircle2,
  Sparkles, Mail, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { User, UserRole } from '../types/user';

const UserManagement: React.FC = () => {
  const {
    users, pagination, filters, loading, actionLoading,
    fetchUsers, setSearch, setRoleFilter, setStatusFilter,
    setPage, setLimit, createUser, updateUser,
    deleteUser, toggleBlock, generateResetLink,
    forceResetPassword,
  } = useUserStore();

  const { user: currentUser, isSuperAdmin, isAdmin } = useAuthStore();

  // Local state for modals
  const [searchInput, setSearchInput] = useState(filters.search);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetLinkModal, setShowResetLinkModal] = useState(false);
  const [showForceResetModal, setShowForceResetModal] = useState(false);

  // Modal payload states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNo: '',
    role: 'Student' as UserRole,
    department: '',
    password: '',
  });

  const [activeResetLink, setActiveResetLink] = useState<string | null>(null);
  const [generatedTempPassword, setGeneratedTempPassword] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle live search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    setSearch(val);
  };

  // Open Edit Modal
  const openEditModal = (targetUser: User) => {
    setSelectedUser(targetUser);
    setFormData({
      name: targetUser.name,
      email: targetUser.email,
      rollNo: targetUser.rollNo,
      role: targetUser.role,
      department: targetUser.department || '',
      password: '',
    });
    setShowEditModal(true);
  };

  // Create User Submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.rollNo) {
      return toast.error('Name, email, and roll number are required');
    }

    const res = await createUser({
      name: formData.name,
      email: formData.email,
      rollNo: formData.rollNo,
      role: formData.role,
      department: formData.department,
      password: formData.password || undefined,
    });

    if (res.success) {
      toast.success('User created successfully');
      if (res.generatedPassword) {
        toast((t) => (
          <div className="text-xs space-y-1">
            <p className="font-bold">Default password generated:</p>
            <code className="bg-surface-elevated px-2 py-0.5 rounded font-mono text-amber-400">{res.generatedPassword}</code>
          </div>
        ), { duration: 8000 });
      }
      setShowAddModal(false);
      setFormData({ name: '', email: '', rollNo: '', role: 'Student', department: '', password: '' });
    } else {
      toast.error(res.error || 'Failed to create user');
    }
  };

  // Update User Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const res = await updateUser(selectedUser._id || selectedUser.id!, {
      name: formData.name,
      email: formData.email,
      rollNo: formData.rollNo,
      role: formData.role,
      department: formData.department,
    });

    if (res.success) {
      toast.success('User details updated');
      setShowEditModal(false);
      setSelectedUser(null);
    } else {
      toast.error(res.error || 'Failed to update user');
    }
  };

  // Block/Unblock Toggle
  const handleToggleBlock = async (targetUser: User) => {
    const action = targetUser.isBlocked ? 'unblock' : 'block';
    const res = await toggleBlock(targetUser._id || targetUser.id!, !targetUser.isBlocked);
    if (res.success) {
      toast.success(`User ${action}ed successfully`);
    } else {
      toast.error(res.error || `Failed to ${action} user`);
    }
  };

  // Delete User Submission
  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    const res = await deleteUser(selectedUser._id || selectedUser.id!);
    if (res.success) {
      toast.success(`User ${selectedUser.name} deleted`);
      setShowDeleteModal(false);
      setSelectedUser(null);
    } else {
      toast.error(res.error || 'Failed to delete user');
    }
  };

  // Trigger Password Reset Link
  const handleTriggerResetLink = async (targetUser: User) => {
    setSelectedUser(targetUser);
    setActiveResetLink(null);
    const res = await generateResetLink(targetUser._id || targetUser.id!);
    if (res.success && res.resetLink) {
      setActiveResetLink(res.resetLink);
      setShowResetLinkModal(true);
      toast.success('Password reset link generated');
    } else {
      toast.error(res.error || 'Failed to generate reset link');
    }
  };

  // SuperAdmin Force Password Reset
  const handleForceResetPassword = async (targetUser: User) => {
    setSelectedUser(targetUser);
    setGeneratedTempPassword(null);
    setShowForceResetModal(true);
  };

  const executeForceReset = async () => {
    if (!selectedUser) return;
    const res = await forceResetPassword(selectedUser._id || selectedUser.id!);
    if (res.success && res.temporaryPassword) {
      setGeneratedTempPassword(res.temporaryPassword);
      toast.success('Temporary password generated successfully');
    } else {
      toast.error(res.error || 'Force reset failed');
    }
  };

  const copyToClipboard = (text: string, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  // Role Badge Styling Helper
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'SuperAdmin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-amber-500/20 to-orange-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <Crown className="w-3 h-3 text-amber-400" /> SuperAdmin
          </span>
        );
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-black uppercase tracking-widest border border-purple-500/30">
            <ShieldCheck className="w-3 h-3 text-purple-400" /> Admin
          </span>
        );
      case 'Faculty':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
            <Shield className="w-3 h-3 text-indigo-400" /> Faculty
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 text-[10px] font-black uppercase tracking-widest border border-accent/30">
            <Users className="w-3 h-3 text-accent-muted" /> Student
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-accent/10 rounded-2xl border border-accent/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <Users className="w-8 h-8 text-accent-muted" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
                User Management
                {isSuperAdmin() && (
                  <span className="text-xs py-1 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold flex items-center gap-1">
                    <Crown className="w-3 h-3" /> SuperAdmin Portal
                  </span>
                )}
              </h1>
              <p className="text-text-muted text-sm mt-1 font-medium">
                Comprehensive directory, credentials, and access control for all users.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setFormData({ name: '', email: '', rollNo: '', role: 'Student', department: '', password: '' });
              setShowAddModal(true);
            }}
            className="btn-primary px-5 py-3 text-xs flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add New User
          </button>
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="p-3 rounded-2xl bg-surface-elevated hover:bg-surface-elevated border border-border text-text-muted hover:text-text-primary transition-all cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-accent-muted' : ''}`} />
          </button>
        </div>
      </header>

      {/* Filter and Search Controls */}
      <div className="glass p-6 border-border space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Live Search Bar */}
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted group-focus-within:text-accent-muted transition-colors" />
            <input
              type="text"
              placeholder="Search by name, roll number, email, or department..."
              className="w-full bg-surface/60 border border-border rounded-2xl py-3.5 pl-12 pr-4 text-text-primary placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all font-medium text-sm"
              value={searchInput}
              onChange={handleSearchChange}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-surface/60 border border-border rounded-2xl">
            {(['all', 'active', 'blocked'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  filters.status === st
                    ? 'bg-accent text-text-primary shadow-md shadow-accent/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mr-2">Filter Role:</span>
          {[
            { label: 'All Roles', value: 'all' },
            { label: 'Students', value: 'Student' },
            { label: 'Admins', value: 'Admin' },
            { label: 'SuperAdmins', value: 'SuperAdmin' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setRoleFilter(item.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filters.role === item.value
                  ? 'bg-surface-elevated text-text-primary border border-border-hover'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated border border-transparent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="glass overflow-hidden border-border/80 rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-elevated/60 border-b border-border/60">
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">User Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Roll No</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Department</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-accent animate-spin" />
                      <p className="text-text-muted text-xs font-mono animate-pulse">Loading directory entries...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                <AnimatePresence initial={false}>
                  {users.map((item) => (
                    <motion.tr
                      key={item._id || item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10, transition: { duration: 0.25 } }}
                      transition={{ duration: 0.2 }}
                      className="group border-b border-border/40 even:bg-surface-elevated/25 odd:bg-transparent hover:bg-accent/5 transition-colors"
                    >
                      {/* User Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent/20 to-purple-500/20 border border-border/80 flex items-center justify-center text-accent font-black text-sm uppercase shrink-0">
                            {item.profilePicUrl ? (
                              <img src={item.profilePicUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              item.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-text-primary tracking-tight font-heading">{item.name}</div>
                            <div className="text-xs text-text-muted font-mono">{item.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Roll No */}
                      <td className="px-6 py-4 text-xs font-mono font-bold text-text-secondary tracking-wider">
                        {item.rollNo}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        {renderRoleBadge(item.role)}
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4 text-xs font-medium text-text-secondary">
                        {item.department || <span className="text-text-muted italic">Not specified</span>}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {item.isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                            <ShieldAlert className="w-3 h-3" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                            <Shield className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>

                      {/* Action Buttons - fade into view on hover */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {/* Reset Link Trigger (Admin & SuperAdmin) */}
                          <button
                            onClick={() => handleTriggerResetLink(item)}
                            className="p-2 rounded-xl bg-surface-elevated text-accent hover:text-white hover:bg-accent transition-all cursor-pointer"
                            title="Generate Password Reset Link"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Force Password Reset (SuperAdmin Only) */}
                          {isSuperAdmin() && (
                            <button
                              onClick={() => handleForceResetPassword(item)}
                              className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
                              title="Force Reset Password (SuperAdmin Temporary Default)"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                          )}

                          {/* Block / Unblock Toggle */}
                          <button
                            onClick={() => handleToggleBlock(item)}
                            className={`p-2 rounded-xl bg-surface-elevated transition-all cursor-pointer ${
                              item.isBlocked
                                ? 'text-emerald-400 hover:bg-emerald-500/20'
                                : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/20'
                            }`}
                            title={item.isBlocked ? 'Unblock Account' : 'Block Account'}
                          >
                            {item.isBlocked ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                          </button>

                          {/* Edit User */}
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 rounded-xl bg-surface-elevated text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-all cursor-pointer"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => {
                              setSelectedUser(item);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 rounded-xl bg-surface-elevated text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-surface-elevated rounded-2xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-text-muted" />
                      </div>
                      <p className="text-text-muted font-bold text-sm">No users found matching your filters</p>
                      <button
                        onClick={() => {
                          setSearchInput('');
                          setSearch('');
                          setRoleFilter('all');
                          setStatusFilter('all');
                        }}
                        className="text-xs text-accent hover:underline mt-1 cursor-pointer"
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

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-white/2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span>
              Showing <span className="font-bold text-text-primary">{(pagination.page - 1) * pagination.limit + (users.length ? 1 : 0)}</span> to{' '}
              <span className="font-bold text-text-primary">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-bold text-text-primary">{pagination.total}</span> users
            </span>

            <div className="flex items-center gap-1.5 pl-4 border-l border-border">
              <span className="text-[10px] uppercase tracking-wider font-bold">Rows:</span>
              <select
                value={pagination.limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="bg-surface-elevated border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed text-text-secondary transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-surface-elevated border border-border text-text-primary">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(pagination.page + 1)}
              disabled={!pagination.hasMore}
              className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed text-text-secondary transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL 1: ADD NEW USER --- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass p-8 border-accent/20 z-10 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/10 rounded-xl border border-accent/20 text-accent-muted">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-wider">Create New User</h3>
                    <p className="text-xs text-text-muted font-medium">Add user to directory with defined permissions</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-surface-elevated rounded-full text-text-muted hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="input-label">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field text-xs py-3"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="input-label">Roll Number</label>
                    <input
                      type="text"
                      required
                      placeholder="21CSE101"
                      value={formData.rollNo}
                      onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                      className="input-field text-xs py-3 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="user@university.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field text-xs py-3"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="input-label">Assigned Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent font-medium transition-all duration-200"
                    >
                      <option value="Student">Student</option>
                      {isSuperAdmin() && <option value="Admin">Admin</option>}
                      {isSuperAdmin() && <option value="SuperAdmin">SuperAdmin</option>}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="input-label">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="input-field text-xs py-3"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="input-label">Initial Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="Leave blank for secure auto-generated default"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field text-xs py-3 font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 px-4 rounded-2xl bg-surface-elevated text-text-muted text-xs font-bold uppercase tracking-wider hover:bg-surface-elevated transition-all border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-3 px-4 rounded-2xl bg-accent hover:bg-accent-muted text-text-primary text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: EDIT USER --- */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass p-8 border-accent/20 z-10 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                    <Edit className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-wider">Edit User Profile</h3>
                    <p className="text-xs text-text-muted font-medium">Update account records for {selectedUser.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-surface-elevated rounded-full text-text-muted hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="input-label">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field text-xs py-3"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="input-label">Roll Number</label>
                    <input
                      type="text"
                      required
                      value={formData.rollNo}
                      onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                      className="input-field text-xs py-3 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field text-xs py-3"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="input-label">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent font-medium transition-all duration-200"
                    >
                      <option value="Student">Student</option>
                      {isSuperAdmin() && <option value="Admin">Admin</option>}
                      {isSuperAdmin() && <option value="SuperAdmin">SuperAdmin</option>}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="input-label">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="input-field text-xs py-3"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 px-4 rounded-2xl bg-surface-elevated text-text-muted text-xs font-bold uppercase tracking-wider hover:bg-surface-elevated transition-all border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-text-primary text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 3: DELETE CONFIRMATION --- */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass p-8 border-red-500/20 z-10 space-y-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-text-primary">Delete User Account?</h3>
                <p className="text-xs text-text-muted">
                  Are you sure you want to permanently delete <strong className="text-text-primary">{selectedUser.name}</strong> ({selectedUser.email})? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-surface-elevated text-text-muted text-xs font-bold uppercase tracking-wider hover:bg-surface-elevated transition-all border border-border"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleDeleteSubmit}
                  className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-text-primary text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 4: PASSWORD RESET LINK GENERATED --- */}
      <AnimatePresence>
        {showResetLinkModal && selectedUser && activeResetLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetLinkModal(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass p-8 border-accent/20 z-10 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/10 rounded-xl border border-accent/20 text-accent-muted">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-wider">Reset Link Ready</h3>
                    <p className="text-xs text-text-muted font-medium">Valid for 24 hours for {selectedUser.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowResetLinkModal(false)} className="p-2 hover:bg-surface-elevated rounded-full text-text-muted hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl space-y-2">
                <p className="text-xs text-blue-300 font-medium leading-relaxed">
                  A cryptographic password reset token has been issued. Send this link to the student or open it in a browser to set a new password:
                </p>
                <div className="flex items-center gap-2 p-3 bg-surface border border-border rounded-xl">
                  <input
                    type="text"
                    readOnly
                    value={activeResetLink}
                    className="bg-transparent text-xs text-text-secondary font-mono flex-1 outline-none truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(activeResetLink, 'Reset link copied to clipboard')}
                    className="p-1.5 hover:bg-surface-elevated rounded-lg text-accent-muted hover:text-text-primary transition-all cursor-pointer"
                    title="Copy Link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetLinkModal(false)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-surface-elevated text-text-muted text-xs font-bold uppercase tracking-wider hover:bg-surface-elevated transition-all border border-border"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeResetLink, 'Reset link copied!')}
                  className="flex-1 py-3 px-4 rounded-2xl bg-accent hover:bg-accent-muted text-text-primary text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4" /> Copy Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 5: SUPERADMIN FORCE RESET PASSWORD --- */}
      <AnimatePresence>
        {showForceResetModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForceResetModal(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass p-8 border-amber-500/30 z-10 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-wider">SuperAdmin Force Reset</h3>
                    <p className="text-xs text-text-muted font-medium">Elevated administrative override</p>
                  </div>
                </div>
                <button onClick={() => setShowForceResetModal(false)} className="p-2 hover:bg-surface-elevated rounded-full text-text-muted hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!generatedTempPassword ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-300/90 leading-relaxed space-y-1">
                      <p className="font-bold text-text-primary">Critical Privilege Notice:</p>
                      <p>
                        This will immediately overwrite the password for <strong className="text-text-primary">{selectedUser.name}</strong> with a high-entropy, secure temporary default password.
                      </p>
                      <p>
                        All current active sessions on their devices will be terminated instantly.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-surface/60 border border-border rounded-xl text-xs text-text-muted space-y-1">
                    <p className="font-bold text-text-secondary">Security Guarantee:</p>
                    <p>
                      No one can view existing passwords. The newly generated temporary password will only be shown to you once in the next step.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForceResetModal(false)}
                      className="flex-1 py-3 px-4 rounded-2xl bg-surface-elevated text-text-muted text-xs font-bold uppercase tracking-wider hover:bg-surface-elevated transition-all border border-border"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={executeForceReset}
                      className="flex-1 py-3 px-4 rounded-2xl bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Temp Password'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">Temporary Password Generated</h4>
                      <p className="text-xs text-emerald-300/90 mt-1">
                        The user account has been updated with the credentials below.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="input-label">Secure Temporary Default Password</label>
                    <div className="flex items-center gap-2 p-4 bg-surface border border-amber-500/30 rounded-2xl">
                      <code className="text-base text-amber-300 font-mono font-bold flex-1 tracking-wider select-all">
                        {generatedTempPassword}
                      </code>
                      <button
                        onClick={() => copyToClipboard(generatedTempPassword, 'Temporary password copied to clipboard')}
                        className="p-2 hover:bg-surface-elevated rounded-xl text-amber-400 hover:text-text-primary transition-all cursor-pointer"
                        title="Copy Password"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Provide this password securely to {selectedUser.name}. They should be encouraged to update it immediately upon logging in.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForceResetModal(false);
                      setGeneratedTempPassword(null);
                      setSelectedUser(null);
                    }}
                    className="btn-primary w-full text-xs"
                  >
                    Done & Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
