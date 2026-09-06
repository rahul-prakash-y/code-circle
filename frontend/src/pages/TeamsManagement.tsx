import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Edit2,
  UserPlus,
  UserMinus,
  CheckCircle2,
  X,
  Calendar,
  AlertTriangle,
  Loader2,
  Sparkles,
  Layers,
  Crown,
  Ban,
  Check,
} from 'lucide-react';
import useTeamStore, { Team, TeamStatus } from '../store/useTeamStore';
import useEventStore from '../store/useEventStore';
import useUserStore from '../store/useUserStore';
import toast from 'react-hot-toast';

const TeamsManagement: React.FC = () => {
  const {
    teams,
    loading,
    actionLoading,
    filters,
    fetchTeams,
    setFilter,
    createTeam,
    updateTeam,
    deleteTeam,
    setTeamStatus,
    assignMembers,
    removeMember,
  } = useTeamStore();

  const { events, fetchEvents } = useEventStore();
  const { users, fetchUsers } = useUserStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventId: '',
    status: 'Active' as TeamStatus,
    leaderRollNo: '',
  });

  // Member assignment state
  const [studentSearch, setStudentSearch] = useState('');
  const [manualRollNo, setManualRollNo] = useState('');

  useEffect(() => {
    fetchTeams();
    fetchEvents();
    fetchUsers();
  }, [fetchTeams, fetchEvents, fetchUsers]);

  // Derived metrics
  const stats = useMemo(() => {
    const total = teams.length;
    const active = teams.filter((t) => t.status === 'Active').length;
    const inactive = teams.filter((t) => t.status === 'Inactive').length;
    const blocked = teams.filter((t) => t.status === 'Blocked').length;
    return { total, active, inactive, blocked };
  }, [teams]);

  // Filtered teams list
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        t.name.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.members?.some(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.rollNo.toLowerCase().includes(q) ||
            (m.department && m.department.toLowerCase().includes(q))
        );
      return matchesSearch;
    });
  }, [teams, searchQuery]);

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Team name is required');

    const ok = await createTeam({
      name: formData.name.trim(),
      description: formData.description.trim(),
      event: formData.eventId || undefined,
      status: formData.status,
      leader: formData.leaderRollNo.trim() || undefined,
    });

    if (ok) {
      setShowCreateModal(false);
      setFormData({ name: '', description: '', eventId: '', status: 'Active', leaderRollNo: '' });
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    if (!formData.name.trim()) return toast.error('Team name is required');

    const ok = await updateTeam(selectedTeam._id, {
      name: formData.name.trim(),
      description: formData.description.trim(),
      event: formData.eventId ? (formData.eventId as any) : undefined,
      status: formData.status,
    });

    if (ok) {
      setShowEditModal(false);
      setSelectedTeam(null);
    }
  };

  // Open Edit Modal
  const openEdit = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      eventId: team.event?._id || '',
      status: team.status,
      leaderRollNo: team.leader?.rollNo || '',
    });
    setShowEditModal(true);
  };

  // Open Manage Members Modal
  const openManageMembers = (team: Team) => {
    setSelectedTeam(team);
    setStudentSearch('');
    setManualRollNo('');
    setShowMembersModal(true);
  };

  // Assign a student by ID or roll number
  const handleAddMember = async (identifier: string) => {
    if (!selectedTeam || !identifier.trim()) return;
    const ok = await assignMembers(selectedTeam._id, [identifier.trim()]);
    if (ok) {
      setManualRollNo('');
      // Refresh selected team reference from state
      const updated = useTeamStore.getState().teams.find((t) => t._id === selectedTeam._id);
      if (updated) setSelectedTeam(updated);
    }
  };

  // Remove a member
  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;
    const ok = await removeMember(selectedTeam._id, userId);
    if (ok) {
      const updated = useTeamStore.getState().teams.find((t) => t._id === selectedTeam._id);
      if (updated) setSelectedTeam(updated);
    }
  };

  // Quick Status Toggle
  const handleStatusChange = async (teamId: string, newStatus: TeamStatus) => {
    await setTeamStatus(teamId, newStatus);
  };

  // Delete team
  const handleDeleteConfirm = async () => {
    if (!selectedTeam) return;
    const ok = await deleteTeam(selectedTeam._id);
    if (ok) {
      setShowDeleteModal(false);
      setSelectedTeam(null);
    }
  };

  return (
    <div className="space-y-8 py-4 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Teams</h1>
          <p className="text-sm text-text-muted mt-1">
            Administer student project teams, map member rosters, and coordinate rosters.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ name: '', description: '', eventId: '', status: 'Active', leaderRollNo: '' });
            setShowCreateModal(true);
          }}
          className="btn-primary py-2.5 px-5 flex items-center gap-2 text-xs font-semibold self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>New Team</span>
        </button>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Teams', value: stats.total, icon: Users, isSpecial: false },
          { label: 'Active Teams', value: stats.active, icon: ShieldCheck, statusColor: 'text-success' },
          { label: 'Deactivated', value: stats.inactive, icon: Shield, statusColor: 'text-text-muted' },
          { label: 'Blocked Teams', value: stats.blocked, icon: Ban, statusColor: 'text-destructive' },
        ].map((stat, i) => (
          <div key={i} className="surface p-5 rounded-[18px] flex items-center justify-between border border-separator shadow-card">
            <div>
              <p className="text-xs font-medium text-text-muted">{stat.label}</p>
              <p className={`text-2xl font-bold tracking-tight mt-1 ${stat.statusColor || 'text-text-primary'}`}>
                {stat.value}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-elevated text-text-secondary flex items-center justify-center border border-separator">
              <stat.icon size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
          <input
            type="text"
            placeholder="Search teams, members, or roll numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 text-xs"
          />
        </div>

        {/* Status Filters - Apple Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-surface border border-separator rounded-xl overflow-x-auto self-start sm:self-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'Active', label: 'Active' },
            { id: 'Inactive', label: 'Inactive' },
            { id: 'Blocked', label: 'Blocked' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter('status', tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                filters.status === tab.id
                  ? 'bg-text-primary text-surface shadow-xs font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="surface p-6 rounded-[18px] border border-separator h-[260px] animate-pulse">
              <div className="w-1/2 h-5 bg-surface-elevated rounded-lg mb-3" />
              <div className="w-3/4 h-3.5 bg-surface-elevated rounded mb-6" />
              <div className="w-full h-14 bg-surface-elevated rounded-xl mb-4" />
              <div className="w-1/3 h-8 bg-surface-elevated rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((team) => {
            const isBlocked = team.status === 'Blocked';
            const isInactive = team.status === 'Inactive';

            return (
              <div
                key={team._id}
                className={`surface p-6 rounded-[18px] flex flex-col justify-between border border-separator shadow-card transition-all duration-150 relative group ${
                  isBlocked
                    ? 'border-destructive/30'
                    : isInactive
                    ? 'opacity-70'
                    : 'hover:border-text-secondary/30'
                }`}
              >
                <div>
                  {/* Top Bar: Title & Status */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-text-primary truncate">
                        {team.name}
                      </h3>
                      {team.event && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted mt-0.5 truncate max-w-full">
                          <Calendar size={11} />
                          {team.event.title}
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide shrink-0 ${
                        team.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : team.status === 'Blocked'
                          ? 'bg-destructive/10 text-destructive border border-destructive/20'
                          : 'bg-surface-elevated text-text-muted border border-separator'
                      }`}
                    >
                      {team.status}
                    </span>
                  </div>

                  {/* Description */}
                  {team.description ? (
                    <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                      {team.description}
                    </p>
                  ) : (
                    <p className="text-xs text-text-muted italic mb-4">No team description provided.</p>
                  )}

                  {/* Leader Info */}
                  {team.leader && (
                    <div className="flex items-center gap-2 p-2 bg-canvas border border-separator rounded-xl mb-4">
                      <div className="w-7 h-7 rounded-lg bg-surface-elevated text-text-secondary flex items-center justify-center shrink-0">
                        <Crown size={13} className="text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-medium text-text-muted uppercase">Leader</p>
                        <p className="text-xs font-semibold text-text-primary truncate">
                          {team.leader.name} <span className="text-[10px] text-text-muted font-mono">({team.leader.rollNo})</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Members Roster Preview */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span>Roster ({team.members?.length || 0})</span>
                      <button
                        onClick={() => openManageMembers(team)}
                        className="text-accent hover:underline text-xs font-medium cursor-pointer"
                      >
                        + Assign
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar">
                      {team.members && team.members.length > 0 ? (
                        team.members.map((member) => (
                          <div
                            key={member._id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-canvas border border-separator rounded-md text-text-secondary text-[11px]"
                          >
                            <span className="font-medium truncate max-w-[90px]">{member.name}</span>
                            <span className="text-[10px] text-text-muted font-mono">{member.rollNo}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-text-muted italic py-1">No students mapped yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-separator flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Map Members Button */}
                    <button
                      onClick={() => openManageMembers(team)}
                      className="px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-canvas border border-separator text-xs font-medium text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Manage Roster"
                    >
                      <UserPlus size={13} />
                      <span>Roster</span>
                    </button>

                    {/* Status Management Buttons */}
                    {team.status !== 'Active' && (
                      <button
                        onClick={() => handleStatusChange(team._id, 'Active')}
                        className="p-1.5 rounded-lg bg-surface-elevated hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-separator text-xs transition-colors cursor-pointer"
                        title="Activate Team"
                      >
                        <ShieldCheck size={14} />
                      </button>
                    )}

                    {team.status !== 'Inactive' && (
                      <button
                        onClick={() => handleStatusChange(team._id, 'Inactive')}
                        className="p-1.5 rounded-lg bg-surface-elevated hover:bg-canvas text-text-muted border border-separator text-xs transition-colors cursor-pointer"
                        title="Deactivate Team"
                      >
                        <Shield size={14} />
                      </button>
                    )}

                    {team.status !== 'Blocked' && (
                      <button
                        onClick={() => handleStatusChange(team._id, 'Blocked')}
                        className="p-1.5 rounded-lg bg-surface-elevated hover:bg-destructive/10 text-destructive border border-separator text-xs transition-colors cursor-pointer"
                        title="Block Team"
                      >
                        <Ban size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(team)}
                      className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
                      title="Edit Team Details"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowDeleteModal(true);
                      }}
                      className="p-1.5 text-text-muted hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Delete Team"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="surface p-12 rounded-[18px] text-center border border-separator shadow-card">
          <Users className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-semibold text-text-primary">No Teams Found</h3>
          <p className="text-text-muted text-xs mt-1 max-w-sm mx-auto">
            {searchQuery || filters.status !== 'all'
              ? 'No teams match your search or filter. Try clearing filters.'
              : 'Start by creating your first student team using the button above.'}
          </p>
        </div>
      )}
      {/* --- MODAL: CREATE TEAM --- */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-lg surface border border-separator rounded-[18px] p-6 shadow-card space-y-5"
            >
              <div className="flex items-center justify-between border-b border-separator pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-separator text-text-primary flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Create New Team</h3>
                    <p className="text-xs text-text-muted">Initialize team details and assign squad name</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Team Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Cyber Ninjas"
                    className="input-field"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief squad focus or project description..."
                    className="input-field resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Link to Event</label>
                    <select
                      value={formData.eventId}
                      onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                      className="input-field py-2 text-xs"
                    >
                      <option value="">General (No Event)</option>
                      {events.map((ev) => (
                        <option key={ev._id} value={ev._id}>
                          {ev.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Initial Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TeamStatus })}
                      className="input-field py-2 text-xs"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Leader Roll Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.leaderRollNo}
                    onChange={(e) => setFormData({ ...formData, leaderRollNo: e.target.value })}
                    placeholder="e.g. 21CS042"
                    className="input-field font-mono uppercase"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-separator">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 btn-secondary py-2.5 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 btn-primary py-2.5 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {actionLoading ? <Loader2 size={15} className="animate-spin" /> : 'Create Team'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: EDIT TEAM --- */}
      <AnimatePresence>
        {showEditModal && selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-lg surface border border-separator rounded-[18px] p-6 shadow-card space-y-5"
            >
              <div className="flex items-center justify-between border-b border-separator pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-separator text-text-primary flex items-center justify-center">
                    <Edit2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Edit Team</h3>
                    <p className="text-xs text-text-muted">Modify team properties and assignments</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)} 
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Team Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Event</label>
                    <select
                      value={formData.eventId}
                      onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                      className="input-field py-2 text-xs"
                    >
                      <option value="">None (General Team)</option>
                      {events.map((ev) => (
                        <option key={ev._id} value={ev._id}>
                          {ev.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TeamStatus })}
                      className="input-field py-2 text-xs"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-separator">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 btn-secondary py-2.5 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 btn-primary py-2.5 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {actionLoading ? <Loader2 size={15} className="animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: MANAGE / MAP MEMBERS --- */}
      <AnimatePresence>
        {showMembersModal && selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-2xl surface border border-separator rounded-[18px] p-6 shadow-card space-y-5 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-separator pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-separator text-text-primary flex items-center justify-center">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Manage Team Roster</h3>
                    <p className="text-xs text-text-muted">
                      Map & assign students to <span className="font-semibold text-text-primary">"{selectedTeam.name}"</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Add by Roll Number */}
              <div className="p-4 rounded-xl bg-canvas border border-separator space-y-2">
                <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                  <Sparkles size={13} className="text-accent" /> Quick Add by Roll Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualRollNo}
                    onChange={(e) => setManualRollNo(e.target.value)}
                    placeholder="Enter student roll number (e.g. 21CS042)..."
                    className="flex-1 input-field font-mono uppercase text-xs"
                  />
                  <button
                    onClick={() => handleAddMember(manualRollNo)}
                    disabled={!manualRollNo.trim() || actionLoading}
                    className="btn-primary px-4 py-2 text-xs font-medium disabled:opacity-50 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Current Members Section */}
              <div className="space-y-2.5 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-text-secondary">
                    Currently Assigned ({selectedTeam.members?.length || 0})
                  </h4>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 max-h-48 pr-1">
                  {selectedTeam.members && selectedTeam.members.length > 0 ? (
                    selectedTeam.members.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-2.5 bg-canvas border border-separator rounded-xl"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-surface-elevated text-text-secondary font-semibold flex items-center justify-center text-xs border border-separator">
                            {member.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text-primary leading-tight">{member.name}</p>
                            <p className="text-[10px] text-text-muted font-mono">
                              {member.rollNo} • {member.department || member.email}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          disabled={actionLoading}
                          className="p-1.5 rounded-lg text-text-muted hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Remove from team"
                        >
                          <UserMinus size={15} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-text-muted italic py-4 text-center">No students currently assigned to this team.</p>
                  )}
                </div>
              </div>

              {/* Live Student Directory Search to Map */}
              <div className="space-y-2.5 pt-3 border-t border-separator">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-text-secondary">Student Directory Search</h4>
                  <span className="text-[11px] text-text-muted">Click to assign</span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by student name, roll number, or department..."
                    className="input-field pl-9 text-xs"
                  />
                </div>

                {studentSearch.trim() && (
                  <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {users
                      .filter((u) => {
                        const q = studentSearch.toLowerCase();
                        const isAlreadyMember = selectedTeam.members?.some((m) => m._id === u._id);
                        return (
                          !isAlreadyMember &&
                          (u.name.toLowerCase().includes(q) ||
                            u.rollNo.toLowerCase().includes(q) ||
                            (u.department && u.department.toLowerCase().includes(q)))
                        );
                      })
                      .slice(0, 6)
                      .map((u) => (
                        <div
                          key={u._id}
                          onClick={() => handleAddMember(u._id)}
                          className="flex items-center justify-between p-2 rounded-lg bg-canvas hover:bg-surface-elevated border border-separator cursor-pointer transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate">{u.name}</p>
                            <p className="text-[10px] text-text-muted font-mono">
                              {u.rollNo} • {u.department || 'General'}
                            </p>
                          </div>
                          <span className="text-[11px] font-medium text-accent hover:underline px-2 py-0.5">
                            + Map
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2 border-t border-separator">
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="w-full btn-secondary py-2.5 text-xs font-medium cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: DELETE CONFIRMATION --- */}
      <AnimatePresence>
        {showDeleteModal && selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-md surface border border-separator rounded-[18px] p-6 shadow-card space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20 shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Delete Team</h3>
                  <p className="text-xs text-text-muted">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                Are you sure you want to delete <strong className="text-text-primary">"{selectedTeam.name}"</strong>? Student roster mappings will be disbanded.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 btn-secondary py-2.5 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-destructive hover:bg-destructive/90 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {actionLoading ? <Loader2 size={15} className="animate-spin" /> : 'Delete Team'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamsManagement;
