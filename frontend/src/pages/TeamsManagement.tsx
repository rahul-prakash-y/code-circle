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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700 py-2">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <h2 className="text-3xl font-black text-white tracking-tight">Teams Command Center</h2>
          </div>
          <p className="text-slate-400 font-medium text-sm">
            Administer student teams, map rosters, and manage activation or disciplinary blocks.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ name: '', description: '', eventId: '', status: 'Active', leaderRollNo: '' });
            setShowCreateModal(true);
          }}
          className="stellar-btn px-6 py-3 flex items-center gap-2.5 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
        >
          <Plus size={16} />
          <span>Create New Team</span>
        </button>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Teams', value: stats.total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Active Teams', value: stats.active, icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Deactivated', value: stats.inactive, icon: Shield, color: 'text-slate-400', bg: 'bg-white/5' },
          { label: 'Blocked Teams', value: stats.blocked, icon: Ban, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        ].map((stat, i) => (
          <div key={i} className="stellar-glass p-5 rounded-2xl flex items-center justify-between border border-white/5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-white">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center border border-white/5`}>
              <stat.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search teams by name, description, student name, or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
          {[
            { id: 'all', label: 'All Teams' },
            { id: 'Active', label: 'Active' },
            { id: 'Inactive', label: 'Inactive' },
            { id: 'Blocked', label: 'Blocked' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter('status', tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                filters.status === tab.id
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="stellar-glass p-6 rounded-3xl h-[280px] animate-pulse">
              <div className="w-1/2 h-6 bg-white/10 rounded-lg mb-4" />
              <div className="w-3/4 h-4 bg-white/5 rounded-md mb-2" />
              <div className="w-full h-16 bg-white/5 rounded-xl my-4" />
              <div className="w-1/3 h-8 bg-white/10 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => {
            const isBlocked = team.status === 'Blocked';
            const isInactive = team.status === 'Inactive';

            return (
              <motion.div
                key={team._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`stellar-glass p-6 rounded-3xl flex flex-col justify-between border transition-all duration-300 relative group overflow-hidden ${
                  isBlocked
                    ? 'border-rose-500/30 bg-rose-950/10 shadow-[0_0_30px_rgba(244,63,94,0.08)]'
                    : isInactive
                    ? 'border-slate-700/40 opacity-75'
                    : 'border-white/10 hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]'
                }`}
              >
                <div>
                  {/* Top Bar: Title & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-white truncate group-hover:text-purple-400 transition-colors">
                          {team.name}
                        </h3>
                      </div>
                      {team.event && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5 truncate max-w-full">
                          <Calendar size={10} />
                          {team.event.title}
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border shadow-md shrink-0 ${
                        team.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : team.status === 'Blocked'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
                          : 'bg-white/5 text-slate-400 border-white/10'
                      }`}
                    >
                      {team.status}
                    </span>
                  </div>

                  {/* Description */}
                  {team.description ? (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed font-medium">
                      {team.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600 italic mb-4">No team description provided.</p>
                  )}

                  {/* Leader Info */}
                  {team.leader && (
                    <div className="flex items-center gap-2.5 p-2 bg-white/5 border border-white/5 rounded-xl mb-4">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Crown size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider leading-none">Team Leader</p>
                        <p className="text-xs font-bold text-white truncate">{team.leader.name} <span className="text-[10px] text-slate-400 font-mono">({team.leader.rollNo})</span></p>
                      </div>
                    </div>
                  )}

                  {/* Members Roster Preview */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>Roster ({team.members?.length || 0} students)</span>
                      <button
                        onClick={() => openManageMembers(team)}
                        className="text-purple-400 hover:text-purple-300 font-bold lowercase text-xs flex items-center gap-1"
                      >
                        + assign
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                      {team.members && team.members.length > 0 ? (
                        team.members.map((member) => (
                          <div
                            key={member._id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-slate-300 text-[11px] font-medium"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            <span className="font-bold truncate max-w-[100px]">{member.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{member.rollNo}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-600 italic py-1">No students mapped yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Map Members Button */}
                    <button
                      onClick={() => openManageMembers(team)}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      title="Map/Assign Students"
                    >
                      <UserPlus size={14} />
                      <span>Roster</span>
                    </button>

                    {/* Status Management Dropdown / Buttons */}
                    {team.status !== 'Active' && (
                      <button
                        onClick={() => handleStatusChange(team._id, 'Active')}
                        className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-black transition-all"
                        title="Activate Team"
                      >
                        <ShieldCheck size={14} />
                      </button>
                    )}

                    {team.status !== 'Inactive' && (
                      <button
                        onClick={() => handleStatusChange(team._id, 'Inactive')}
                        className="p-2 rounded-xl bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border border-white/5 text-xs font-black transition-all"
                        title="Deactivate Team"
                      >
                        <Shield size={14} />
                      </button>
                    )}

                    {team.status !== 'Blocked' && (
                      <button
                        onClick={() => handleStatusChange(team._id, 'Blocked')}
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-black transition-all"
                        title="Block Team"
                      >
                        <Ban size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(team)}
                      className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                      title="Edit Team Details"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Delete Team"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="stellar-glass p-16 rounded-3xl text-center border border-white/5">
          <Users className="w-14 h-14 text-slate-600 mx-auto mb-4 opacity-40" />
          <h3 className="text-xl font-black text-white">No Teams Found</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
            {searchQuery || filters.status !== 'all'
              ? 'No teams match your current search or status filter. Try clearing filters.'
              : 'Start by creating your first student team using the button above.'}
          </p>
        </div>
      )}

      {/* --- MODAL: CREATE TEAM --- */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg stellar-glass border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Create New Team</h3>
                    <p className="text-xs text-slate-400">Initialize team details and assign squad name</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Team Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Cyber Ninjas"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief squad focus or project description..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm font-medium resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Link to Event</label>
                    <select
                      value={formData.eventId}
                      onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
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
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Initial Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TeamStatus })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Leader Roll Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.leaderRollNo}
                    onChange={(e) => setFormData({ ...formData, leaderRollNo: e.target.value })}
                    placeholder="e.g. 21CS042"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs font-mono uppercase focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 bg-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 stellar-btn py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Create Team'}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg stellar-glass border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Edit2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Edit Team</h3>
                    <p className="text-xs text-slate-400">Modify team properties and assignments</p>
                  </div>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Team Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 text-sm font-medium resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Event</label>
                    <select
                      value={formData.eventId}
                      onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
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
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TeamStatus })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 bg-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 stellar-btn py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl stellar-glass border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Manage Team Roster</h3>
                    <p className="text-xs text-slate-400">
                      Map & assign students to <span className="text-purple-400 font-bold">"{selectedTeam.name}"</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Quick Add by Roll Number */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-400" /> Quick Add by Roll Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualRollNo}
                    onChange={(e) => setManualRollNo(e.target.value)}
                    placeholder="Enter student roll number (e.g. 21CS042)..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => handleAddMember(manualRollNo)}
                    disabled={!manualRollNo.trim() || actionLoading}
                    className="stellar-btn px-5 py-2.5 text-xs font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Current Members Section */}
              <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Currently Assigned ({selectedTeam.members?.length || 0})
                  </h4>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-48 pr-1">
                  {selectedTeam.members && selectedTeam.members.length > 0 ? (
                    selectedTeam.members.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-2.5 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 font-bold flex items-center justify-center text-xs">
                            {member.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">{member.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {member.rollNo} • {member.department || member.email}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          disabled={actionLoading}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Remove from team"
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600 italic py-4 text-center">No students currently assigned to this team.</p>
                  )}
                </div>
              </div>

              {/* Live Student Directory Search to Map */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Student Directory Search</h4>
                  <span className="text-[10px] text-slate-500">Click to assign to squad</span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search directory by student name, roll number, or department..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {studentSearch.trim() && (
                  <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
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
                          className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-purple-500/10 hover:border-purple-500/30 border border-transparent cursor-pointer transition-all"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{u.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {u.rollNo} • {u.department || 'General'}
                            </p>
                          </div>
                          <span className="text-[10px] font-black uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                            + Map
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md stellar-glass border border-rose-500/20 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Delete Team</h3>
                  <p className="text-xs text-slate-400">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-sm text-slate-300">
                Are you sure you want to permanently delete <strong className="text-white">"{selectedTeam.name}"</strong>? Student mappings will be disbanded.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-white/5 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Delete Team'}
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
