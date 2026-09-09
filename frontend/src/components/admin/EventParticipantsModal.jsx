import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Mail,
  GraduationCap,
  Calendar,
  Building2,
  Phone,
  Filter,
  Layers,
  Crown,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import toast from 'react-hot-toast';

// Helper to get student college, always defaulting to 'BIT'
export const getStudentCollege = (user) => {
  if (user?.college && String(user.college).trim()) {
    return String(user.college).trim();
  }
  return 'BIT';
};

// Helper to derive student year accurately, ensuring it is always present
export const getStudentYear = (user) => {
  if (!user) return '3rd Year';
  if (user.year) {
    const yStr = String(user.year).trim();
    if (/^[1-4]$/.test(yStr)) {
      const map = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
      return map[yStr] || `${yStr} Year`;
    }
    if (yStr.toLowerCase().includes('year')) return yStr;
    return `${yStr} Year`;
  }

  const roll = String(user.rollNo || '').toUpperCase().trim();
  const email = String(user.email || '').toLowerCase().trim();

  // Anna University register format: 7376YY... (e.g. 7376231CS272 -> admitted 2023)
  const auMatch = roll.match(/^7376(\d{2})/);
  if (auMatch) {
    const admitYear = 2000 + parseInt(auMatch[1], 10);
    const now = new Date();
    let diff = now.getFullYear() - admitYear;
    if (now.getMonth() >= 6) diff += 1;
    if (diff <= 1) return '1st Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '3rd Year';
    return '4th Year';
  }

  // BIT Roll format: 2026UAD1021 (Graduation year prefix)
  const bitPassMatch = roll.match(/^(20\d{2})[A-Z]/);
  if (bitPassMatch) {
    const passYear = parseInt(bitPassMatch[1], 10);
    const now = new Date();
    const admitYear = passYear - 4;
    let diff = now.getFullYear() - admitYear;
    if (now.getMonth() >= 6) diff += 1;
    if (diff <= 1) return '1st Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '3rd Year';
    return '4th Year';
  }

  // Institutional email format: .ad26@bitsathy.ac.in or .cs23@bitsathy.ac.in
  const emailMatch = email.match(/([a-z]+)(\d{2})@bitsathy\.ac\.in/);
  if (emailMatch) {
    const num = parseInt(emailMatch[2], 10);
    const admitYear = num >= 25 ? 2000 + num - 4 : 2000 + num;
    const now = new Date();
    let diff = now.getFullYear() - admitYear;
    if (now.getMonth() >= 6) diff += 1;
    if (diff <= 1) return '1st Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '3rd Year';
    return '4th Year';
  }

  // General 2-digit roll format: e.g. 23CS012
  const generalRollMatch = roll.match(/^(\d{2})[A-Z]/);
  if (generalRollMatch) {
    const admitYear = 2000 + parseInt(generalRollMatch[1], 10);
    const now = new Date();
    let diff = now.getFullYear() - admitYear;
    if (now.getMonth() >= 6) diff += 1;
    if (diff <= 1) return '1st Year';
    if (diff === 2) return '2nd Year';
    if (diff === 3) return '3rd Year';
    return '4th Year';
  }

  return '3rd Year';
};

export const EventParticipantsModal = ({
  isOpen,
  onClose,
  event,
}) => {
  const { fetchEventEnrollments, loading } = useEnrollmentStore();
  const [enrollments, setEnrollments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [expandedTeams, setExpandedTeams] = useState(new Set());

  useEffect(() => {
    if (isOpen && event?._id) {
      const load = async () => {
        try {
          const data = await fetchEventEnrollments(event._id);
          setEnrollments(data || []);
        } catch {
          toast.error('Failed to load participants');
        }
      };
      load();
    }
  }, [isOpen, event?._id, fetchEventEnrollments]);

  // Compute metrics
  const stats = useMemo(() => {
    let totalRegistrations = enrollments.length;
    let totalStudents = 0;
    let presentStudents = 0;
    let duoCount = 0;
    let teamCount = 0;
    let soloCount = 0;

    enrollments.forEach((e) => {
      const memberCount = (e.members?.length || 0) + 1;
      totalStudents += memberCount;
      if (e.attendanceStatus) {
        presentStudents += memberCount;
      }
      if (e.type === 'Duo') duoCount++;
      else if (e.type === 'Team') teamCount++;
      else soloCount++;
    });

    return {
      totalRegistrations,
      totalStudents,
      presentStudents,
      absentStudents: Math.max(0, totalStudents - presentStudents),
      duoCount,
      teamCount,
      soloCount,
    };
  }, [enrollments]);

  // Filter logic
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      const q = searchQuery.toLowerCase();

      // Check leader
      const leaderMatch =
        e.enrolledBy?.name?.toLowerCase().includes(q) ||
        e.enrolledBy?.rollNo?.toLowerCase().includes(q) ||
        e.enrolledBy?.email?.toLowerCase().includes(q) ||
        e.enrolledBy?.department?.toLowerCase().includes(q);

      // Check team name
      const teamNameMatch = e.teamName?.toLowerCase().includes(q);

      // Check members
      const memberMatch = e.members?.some(
        (m) =>
          m?.name?.toLowerCase().includes(q) ||
          m?.rollNo?.toLowerCase().includes(q) ||
          m?.email?.toLowerCase().includes(q) ||
          m?.department?.toLowerCase().includes(q)
      );

      const matchesSearch = !q || leaderMatch || teamNameMatch || memberMatch;

      const matchesFormat =
        formatFilter === 'all' ||
        (formatFilter === 'Individual' && (e.type === 'Individual' || (!e.type && !e.members?.length))) ||
        (formatFilter === 'Duo' && e.type === 'Duo') ||
        (formatFilter === 'Team' && e.type === 'Team');

      const matchesAttendance =
        attendanceFilter === 'all' ||
        (attendanceFilter === 'present' && e.attendanceStatus) ||
        (attendanceFilter === 'absent' && !e.attendanceStatus);

      return matchesSearch && matchesFormat && matchesAttendance;
    });
  }, [enrollments, searchQuery, formatFilter, attendanceFilter]);

  const toggleExpand = (id) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCSV = () => {
    if (!enrollments.length) {
      toast.error('No participants to export');
      return;
    }

    const headers = [
      'Event Title',
      'Registration Type',
      'Team Name',
      'Member Role',
      'Student Name',
      'Roll Number',
      'Email',
      'Department',
      'Year',
      'College',
      'Attendance Status',
      'Enrolled At',
    ];

    const rows = [];

    enrollments.forEach((e) => {
      const enrolledAt = e.createdAt ? format(new Date(e.createdAt), 'yyyy-MM-dd HH:mm') : '';
      const attendance = e.attendanceStatus ? 'Present' : 'Absent';
      const type = e.type || (e.members?.length ? 'Team' : 'Individual');

      // Lead student
      const leadCollege = getStudentCollege(e.enrolledBy);
      const leadYear = getStudentYear(e.enrolledBy);

      rows.push([
        `"${event.title.replace(/"/g, '""')}"`,
        `"${type}"`,
        `"${(e.teamName || 'N/A').replace(/"/g, '""')}"`,
        '"Leader / Creator"',
        `"${(e.enrolledBy?.name || 'N/A').replace(/"/g, '""')}"`,
        `"${e.enrolledBy?.rollNo || 'N/A'}"`,
        `"${e.enrolledBy?.email || 'N/A'}"`,
        `"${e.enrolledBy?.department || 'N/A'}"`,
        `"${leadYear}"`,
        `"${leadCollege}"`,
        `"${attendance}"`,
        `"${enrolledAt}"`,
      ]);

      // Team members
      if (e.members && e.members.length > 0) {
        e.members.forEach((m) => {
          const memberCollege = getStudentCollege(m);
          const memberYear = getStudentYear(m);

          rows.push([
            `"${event.title.replace(/"/g, '""')}"`,
            `"${type}"`,
            `"${(e.teamName || 'N/A').replace(/"/g, '""')}"`,
            '"Member"',
            `"${(m?.name || 'N/A').replace(/"/g, '""')}"`,
            `"${m?.rollNo || 'N/A'}"`,
            `"${m?.email || 'N/A'}"`,
            `"${m?.department || 'N/A'}"`,
            `"${memberYear}"`,
            `"${memberCollege}"`,
            `"${attendance}"`,
            `"${enrolledAt}"`,
          ]);
        });
      }
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeTitle = event.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('download', `${safeTitle}_participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Participants CSV exported successfully!');
  };

  if (!isOpen || !event) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl bg-surface border border-separator rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--label-primary)' }}
        >
          {/* Header */}
          <div className="p-6 border-b border-separator bg-canvas/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-accent-subtle text-accent flex items-center justify-center shrink-0">
                <Users size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-label-primary tracking-tight font-heading">
                    Event Participants Directory
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-separator text-label-secondary">
                    {stats.totalStudents} Students
                  </span>
                </div>
                <p className="text-xs text-label-secondary mt-0.5 line-clamp-1">
                  Full registration records & roster for <strong className="text-label-primary">{event.title}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportCSV}
                className="btn-secondary flex items-center gap-2 text-xs py-2 px-3.5 cursor-pointer"
                title="Download CSV"
              >
                <Download size={15} />
                <span>Export CSV</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-label-secondary hover:text-label-primary hover:bg-canvas transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:p-6 border-b border-separator bg-canvas/30">
            <div className="p-3.5 rounded-xl bg-canvas border border-separator">
              <p className="text-[11px] uppercase font-semibold text-label-tertiary">Total Entries</p>
              <p className="text-xl font-black text-label-primary mt-0.5">{stats.totalRegistrations}</p>
              <p className="text-[11px] text-label-secondary mt-0.5">
                {stats.soloCount} Solo • {stats.duoCount} Duo • {stats.teamCount} Squad
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-separator">
              <p className="text-[11px] uppercase font-semibold text-label-tertiary">Total Attendees</p>
              <p className="text-xl font-black text-accent mt-0.5">{stats.totalStudents}</p>
              <p className="text-[11px] text-label-secondary mt-0.5">Individual participants</p>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-separator">
              <p className="text-[11px] uppercase font-semibold text-label-tertiary">Present in Attendance</p>
              <p className="text-xl font-black text-emerald-500 mt-0.5">{stats.presentStudents}</p>
              <p className="text-[11px] text-label-secondary mt-0.5">
                {stats.totalStudents ? Math.round((stats.presentStudents / stats.totalStudents) * 100) : 0}% Turnout
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-canvas border border-separator">
              <p className="text-[11px] uppercase font-semibold text-label-tertiary">Absent / Unmarked</p>
              <p className="text-xl font-black text-amber-500 mt-0.5">{stats.absentStudents}</p>
              <p className="text-[11px] text-label-secondary mt-0.5">Awaiting verification</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 sm:px-6 border-b border-separator flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, roll no, email, team..."
                className="input-field text-xs pl-9.5 py-2 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="text-xs font-semibold py-1.5 px-3 rounded-xl bg-canvas border border-separator text-label-secondary focus:outline-none"
              >
                <option value="all">All Formats</option>
                <option value="Individual">Solo</option>
                <option value="Duo">Duo (Pair)</option>
                <option value="Team">Squad (Team)</option>
              </select>

              <select
                value={attendanceFilter}
                onChange={(e) => setAttendanceFilter(e.target.value)}
                className="text-xs font-semibold py-1.5 px-3 rounded-xl bg-canvas border border-separator text-label-secondary focus:outline-none"
              >
                <option value="all">All Attendance</option>
                <option value="present">Present Only</option>
                <option value="absent">Absent Only</option>
              </select>
            </div>
          </div>

          {/* Participants Table / List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-3">
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
                <p className="text-xs text-label-secondary">Loading participant profiles...</p>
              </div>
            ) : filteredEnrollments.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-canvas border border-separator flex items-center justify-center text-label-tertiary mx-auto">
                  <Users size={22} />
                </div>
                <p className="text-sm font-bold text-label-primary">No participants found</p>
                <p className="text-xs text-label-secondary max-w-sm mx-auto">
                  {searchQuery || formatFilter !== 'all' || attendanceFilter !== 'all'
                    ? 'Try clearing your search filters to view registered participants.'
                    : 'No participants have enrolled in this event yet.'}
                </p>
              </div>
            ) : (
              filteredEnrollments.map((e, idx) => {
                const isGroup = e.type === 'Team' || e.type === 'Duo';
                const hasMembers = e.members && e.members.length > 0;
                const isExpanded = expandedTeams.has(e._id);
                const memberTotal = (e.members?.length || 0) + 1;

                return (
                  <div
                    key={e._id || idx}
                    className="p-4 sm:p-5 rounded-2xl bg-canvas/70 border border-separator hover:border-accent/40 transition-colors space-y-3"
                  >
                    {/* Primary Row Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent font-black text-sm flex items-center justify-center shrink-0">
                          {e.enrolledBy?.name ? e.enrolledBy.name.charAt(0).toUpperCase() : '?'}
                        </div>

                        {/* Student and Team Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-label-primary">
                              {e.enrolledBy?.name || 'Unknown Student'}
                            </span>

                            {isGroup && e.teamName && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                                <Crown size={11} />
                                {e.teamName}
                              </span>
                            )}

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                e.type === 'Duo'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : e.type === 'Team'
                                  ? 'bg-purple-500/10 text-purple-400'
                                  : 'bg-separator text-label-secondary'
                              }`}
                            >
                              {e.type === 'Duo'
                                ? 'Duo (2 Members)'
                                : e.type === 'Team'
                                ? `Squad (${memberTotal} Members)`
                                : 'Solo'}
                            </span>
                          </div>

                          {/* Detail Badges */}
                          <div className="flex items-center gap-2.5 text-xs text-label-secondary mt-1 flex-wrap font-medium">
                            <span className="font-mono text-label-primary font-semibold">{e.enrolledBy?.rollNo || 'No Roll #'}</span>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent font-bold text-[11px] border border-accent/20 flex items-center gap-1">
                              <Building2 size={11} />
                              {getStudentCollege(e.enrolledBy)}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-surface text-label-primary font-bold text-[11px] border border-separator">
                              {getStudentYear(e.enrolledBy)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Mail size={12} className="text-label-tertiary" />
                              {e.enrolledBy?.email || 'N/A'}
                            </span>
                            {e.enrolledBy?.department && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <GraduationCap size={12} className="text-label-tertiary" />
                                  {e.enrolledBy.department}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Status Badges & Expansion Toggle */}
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            e.attendanceStatus
                              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                              : 'bg-separator text-label-tertiary'
                          }`}
                        >
                          {e.attendanceStatus ? (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Present</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={13} />
                              <span>Absent</span>
                            </>
                          )}
                        </span>

                        {isGroup && hasMembers && (
                          <button
                            onClick={() => toggleExpand(e._id)}
                            className="p-1.5 rounded-lg bg-surface border border-separator text-label-secondary hover:text-label-primary transition-colors flex items-center gap-1 text-xs px-2.5 cursor-pointer"
                          >
                            <span>{e.members.length} Teammate{e.members.length > 1 ? 's' : ''}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Team Roster */}
                    {isGroup && hasMembers && isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-3 border-t border-separator/60 space-y-2 mt-2"
                      >
                        <p className="text-[11px] uppercase font-bold text-label-tertiary tracking-wider">
                          Full Team Roster ({memberTotal} Total)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Leader card */}
                          <div className="p-3 rounded-xl bg-surface border border-separator/80 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent-subtle text-accent font-bold text-xs flex items-center justify-center shrink-0">
                              <Crown size={14} />
                            </div>
                            <div className="min-w-0 text-xs space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-label-primary truncate">{e.enrolledBy?.name}</span>
                                <span className="text-[10px] font-semibold text-accent">(Leader)</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                                  {getStudentCollege(e.enrolledBy)}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-canvas text-label-secondary border border-separator">
                                  {getStudentYear(e.enrolledBy)}
                                </span>
                              </div>
                              <p className="font-mono text-label-secondary text-[11px]">{e.enrolledBy?.rollNo}</p>
                              <p className="text-label-tertiary text-[11px] truncate">{e.enrolledBy?.email}</p>
                              {e.enrolledBy?.department && (
                                <p className="text-[10px] text-label-tertiary truncate">{e.enrolledBy.department}</p>
                              )}
                            </div>
                          </div>

                          {/* Member cards */}
                          {e.members.map((m, mIdx) => (
                            <div
                              key={m?._id || mIdx}
                              className="p-3 rounded-xl bg-surface border border-separator/80 flex items-center gap-3"
                            >
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 font-bold text-xs flex items-center justify-center shrink-0">
                                {m?.name ? m.name.charAt(0).toUpperCase() : 'M'}
                              </div>
                              <div className="min-w-0 text-xs space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-label-primary truncate block">
                                    {m?.name || 'Unknown Member'}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                                    {getStudentCollege(m)}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-canvas text-label-secondary border border-separator">
                                    {getStudentYear(m)}
                                  </span>
                                </div>
                                <p className="font-mono text-label-secondary text-[11px]">{m?.rollNo || 'No Roll #'}</p>
                                <p className="text-label-tertiary text-[11px] truncate">{m?.email || 'No email'}</p>
                                {m?.department && (
                                  <p className="text-[10px] text-label-tertiary truncate">{m.department}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-separator bg-canvas/40 flex items-center justify-between text-xs text-label-secondary">
            <span>Showing {filteredEnrollments.length} of {enrollments.length} total registrations</span>
            <button
              onClick={onClose}
              className="btn-secondary text-xs py-1.5 px-4 cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EventParticipantsModal;
