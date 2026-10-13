import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
  Loader2,
  Award,
  Plus,
  Calendar,
  Clock,
  Key,
  Users,
  Search,
  Copy,
  Check,
  Download,
  Sparkles,
  Radio,
  CheckSquare,
  Square,
  AlertCircle,
  Hash,
  GraduationCap,
  Building2,
  RefreshCw,
} from 'lucide-react';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import useAttendanceStore from '../../store/useAttendanceStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const AttendanceDashboard = ({ isOpen, onClose, event }) => {
  const { fetchEventEnrollments, updateAttendance, loading: enrollmentLoading } = useEnrollmentStore();
  const {
    sessions,
    sessionAttendance,
    fetchEventSessions,
    createSession,
    fetchSessionAttendance,
    loading: attendanceLoading,
  } = useAttendanceStore();

  const [activeTab, setActiveTab] = useState('manual'); // 'manual', 'sessions'
  const [enrollments, setEnrollments] = useState([]);
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState(new Set());
  const [manualSearch, setManualSearch] = useState('');
  const [manualStatusFilter, setManualStatusFilter] = useState('all'); // 'all', 'present', 'absent'

  // OTP Session creation states
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [selectedClassHours, setSelectedClassHours] = useState([1, 2]);
  const [hourlyPoints, setHourlyPoints] = useState(event?.hourlyPoints || 50);
  const [creatingSession, setCreatingSession] = useState(false);

  // Selected OTP session
  const [selectedSession, setSelectedSession] = useState(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Load enrollments or sessions on open
  useEffect(() => {
    if (isOpen && event?._id) {
      if (activeTab === 'manual') {
        const loadEnrollments = async () => {
          try {
            const data = await fetchEventEnrollments(event._id);
            setEnrollments(data || []);
            const initialSelected = new Set((data || []).filter((e) => e.attendanceStatus).map((e) => e._id));
            setSelectedEnrollmentIds(initialSelected);
          } catch {
            toast.error('Failed to load enrollments');
          }
        };
        loadEnrollments();
      } else {
        fetchEventSessions(event._id);
      }
    }
  }, [isOpen, event?._id, activeTab, fetchEventEnrollments, fetchEventSessions]);

  // Auto-select latest session if available
  useEffect(() => {
    if (activeTab === 'sessions' && sessions?.length > 0 && !selectedSession) {
      handleViewSession(sessions[0]);
    }
  }, [activeTab, sessions, selectedSession]);

  // Filtered manual registry
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      const student = e.enrolledBy || {};
      const q = manualSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (student.name || '').toLowerCase().includes(q) ||
        (student.rollNo || '').toLowerCase().includes(q) ||
        (student.email || '').toLowerCase().includes(q) ||
        (e.teamName || '').toLowerCase().includes(q);

      const isSelected = selectedEnrollmentIds.has(e._id);
      const matchesStatus =
        manualStatusFilter === 'all' ||
        (manualStatusFilter === 'present' && isSelected) ||
        (manualStatusFilter === 'absent' && !isSelected);

      return matchesSearch && matchesStatus;
    });
  }, [enrollments, manualSearch, manualStatusFilter, selectedEnrollmentIds]);

  // Overall statistics
  const totalStudents = enrollments.length;
  const presentStudents = selectedEnrollmentIds.size;
  const turnoutRate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;
  const activeSessionsCount = sessions.filter((s) => s.isActive).length;

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSessionName.trim()) {
      return toast.error('Please enter a session name');
    }
    setCreatingSession(true);
    try {
      const session = await createSession({
        event: event._id,
        sessionName: newSessionName.trim(),
        durationMinutes: Number(durationMinutes) || 60,
        classHours: selectedClassHours,
        hourlyPoints: Number(hourlyPoints) || 50,
      });

      if (session) {
        setNewSessionName('');
        setShowCreateSession(false);
        await fetchEventSessions(event._id);
        setSelectedSession(session);
        await fetchSessionAttendance(session._id);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create session');
    } finally {
      setCreatingSession(false);
    }
  };

  const handleViewSession = async (session) => {
    setSelectedSession(session);
    await fetchSessionAttendance(session._id);
  };

  const toggleManualAttendance = (id) => {
    setSelectedEnrollmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedEnrollmentIds((prev) => {
      const next = new Set(prev);
      filteredEnrollments.forEach((e) => next.add(e._id));
      return next;
    });
  };

  const handleDeselectAllFiltered = () => {
    setSelectedEnrollmentIds((prev) => {
      const next = new Set(prev);
      filteredEnrollments.forEach((e) => next.delete(e._id));
      return next;
    });
  };

  const saveManualAttendance = async () => {
    try {
      await updateAttendance(event._id, Array.from(selectedEnrollmentIds));
      toast.success(`Attendance successfully synced! (${selectedEnrollmentIds.size} present)`);
      const data = await fetchEventEnrollments(event._id);
      setEnrollments(data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to sync attendance');
    }
  };

  const handleCopyOtp = (otp) => {
    if (!otp) return;
    navigator.clipboard.writeText(String(otp));
    setCopiedOtp(true);
    toast.success(`OTP ${otp} copied to clipboard!`);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const exportSessionCSV = () => {
    if (!selectedSession || !sessionAttendance.length) {
      return toast.error('No verified attendees in this session to export');
    }

    const headers = ['Event Title', 'Session Name', 'Student Name', 'Roll Number', 'Email', 'Verified Timestamp'];
    const rows = sessionAttendance.map((rec) => [
      `"${(event.title || '').replace(/"/g, '""')}"`,
      `"${(selectedSession.sessionName || '').replace(/"/g, '""')}"`,
      `"${(rec.user?.name || '').replace(/"/g, '""')}"`,
      `"${rec.user?.rollNo || 'N/A'}"`,
      `"${rec.user?.email || 'N/A'}"`,
      `"${format(new Date(rec.timestamp || rec.createdAt), 'yyyy-MM-dd HH:mm:ss')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeName = (selectedSession.sessionName || 'session').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('download', `${safeName}_otp_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Session attendance CSV exported successfully');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-6xl my-auto bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col h-[90vh] max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-separator dark:border-white/10 bg-canvas/40 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-purple-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
              <UserCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-label-primary dark:text-[#F5F5F7] tracking-tight font-heading">
                  Attendance Intelligence
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Live Engine
                </span>
              </div>
              <p className="text-xs text-label-secondary dark:text-[#86868B] font-medium mt-0.5 truncate max-w-md">
                Event: <strong className="text-label-primary dark:text-white">{event?.title}</strong>
              </p>
            </div>
          </div>

          {/* Quick Metrics Capsule & Close */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-canvas dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-xs font-semibold">
              <span className="text-label-secondary dark:text-[#86868B]">Turnout:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {presentStudents} / {totalStudents} ({turnoutRate}%)
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-label-secondary hover:text-label-primary hover:bg-canvas dark:hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-separator shrink-0"
              title="Close Attendance Intelligence"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="px-5 sm:px-6 py-2.5 border-b border-separator dark:border-white/10 bg-canvas/30 dark:bg-white/[0.01] flex items-center justify-between gap-3 shrink-0">
          <div className="flex p-1 bg-surface-secondary dark:bg-[#1C1C1E] border border-separator dark:border-white/10 rounded-2xl">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-label-secondary dark:text-[#86868B] hover:text-label-primary hover:bg-canvas/60 dark:hover:bg-white/5'
              }`}
            >
              <UserCheck size={15} />
              <span>Manual Roll-Call Registry</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'manual' ? 'bg-black/25 text-white' : 'bg-separator text-label-secondary'
                }`}
              >
                {presentStudents}/{totalStudents}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sessions'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'text-label-secondary dark:text-[#86868B] hover:text-label-primary hover:bg-canvas/60 dark:hover:bg-white/5'
              }`}
            >
              <Key size={15} />
              <span>OTP Live Sessions Hub</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'sessions'
                    ? 'bg-black/25 text-white'
                    : activeSessionsCount > 0
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                    : 'bg-separator text-label-secondary'
                }`}
              >
                {sessions.length}
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-label-secondary dark:text-[#86868B]">
            <Radio size={14} className="text-emerald-500 animate-pulse" />
            <span>Real-time cloud synchronization active</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'manual' ? (
            /* ================================================================= */
            /* MANUAL ROLL-CALL REGISTRY TAB                                      */
            /* ================================================================= */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Filter & Action Toolbar */}
              <div className="p-4 sm:p-5 border-b border-separator dark:border-white/10 bg-canvas/20 dark:bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                {/* Search & Status Filter */}
                <div className="flex items-center gap-2.5 flex-1 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" size={15} />
                    <input
                      type="text"
                      value={manualSearch}
                      onChange={(e) => setManualSearch(e.target.value)}
                      placeholder="Search students, roll numbers, teams..."
                      className="w-full text-xs py-2 pl-9.5 pr-4 rounded-xl bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-label-primary dark:text-[#F5F5F7] placeholder:text-label-tertiary focus:outline-none focus:border-blue-500/40 transition-colors"
                    />
                    {manualSearch && (
                      <button
                        onClick={() => setManualSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <select
                    value={manualStatusFilter}
                    onChange={(e) => setManualStatusFilter(e.target.value)}
                    className="text-xs font-semibold py-2 px-3 rounded-xl bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-label-secondary dark:text-[#86868B] focus:outline-none cursor-pointer shrink-0"
                  >
                    <option value="all">All ({totalStudents})</option>
                    <option value="present">Present Only ({presentStudents})</option>
                    <option value="absent">Absent Only ({totalStudents - presentStudents})</option>
                  </select>
                </div>

                {/* Batch Actions & Cloud Sync Button */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                  <button
                    onClick={handleSelectAllFiltered}
                    className="py-1.5 px-3 rounded-xl text-xs font-semibold text-label-secondary dark:text-[#86868B] hover:text-label-primary bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 transition-colors cursor-pointer"
                  >
                    Mark Filtered Present
                  </button>
                  <button
                    onClick={handleDeselectAllFiltered}
                    className="py-1.5 px-3 rounded-xl text-xs font-semibold text-label-secondary dark:text-[#86868B] hover:text-label-primary bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 transition-colors cursor-pointer"
                  >
                    Reset Filtered
                  </button>
                  <button
                    onClick={saveManualAttendance}
                    disabled={enrollmentLoading}
                    className="btn-primary py-2 px-4.5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {enrollmentLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    <span>Sync Registry to Cloud</span>
                  </button>
                </div>
              </div>

              {/* Roster Table */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {enrollmentLoading && enrollments.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <Loader2 className="w-7 h-7 animate-spin text-blue-500 mx-auto" />
                    <p className="text-xs text-label-secondary dark:text-[#86868B]">Loading student roll-call...</p>
                  </div>
                ) : filteredEnrollments.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-canvas dark:bg-[#1C1C1E] border border-separator dark:border-white/10 flex items-center justify-center text-label-tertiary mx-auto">
                      <Users size={22} />
                    </div>
                    <p className="text-sm font-bold text-label-primary dark:text-[#F5F5F7]">No students found</p>
                    <p className="text-xs text-label-secondary dark:text-[#86868B] max-w-sm mx-auto">
                      No registrations match your current search query or filter.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-surface dark:bg-[#161617] border-b border-separator dark:border-white/10 z-10 shadow-sm">
                      <tr className="text-[11px] font-bold text-label-secondary dark:text-[#86868B] uppercase tracking-wider">
                        <th className="py-3.5 px-6">Student Information</th>
                        <th className="py-3.5 px-6">Roll Number</th>
                        <th className="py-3.5 px-6">Department & Year</th>
                        <th className="py-3.5 px-6">Format</th>
                        <th className="py-3.5 px-6 text-center">Attendance Toggle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-separator/60 dark:divide-white/5">
                      {filteredEnrollments.map((e) => {
                        const student = e.enrolledBy || {};
                        const isPresent = selectedEnrollmentIds.has(e._id);
                        const isGroup = e.type === 'Team' || e.type === 'Duo';

                        return (
                          <tr
                            key={e._id}
                            className={`hover:bg-canvas/50 dark:hover:bg-white/[0.02] transition-colors ${
                              isPresent ? 'bg-emerald-500/[0.02] dark:bg-emerald-500/[0.03]' : ''
                            }`}
                          >
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border ${
                                    isPresent
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                      : 'bg-canvas dark:bg-[#1C1C1E] text-label-secondary dark:text-[#86868B] border-separator dark:border-white/10'
                                  }`}
                                >
                                  {student.name ? student.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-label-primary dark:text-[#F5F5F7] truncate">
                                      {student.name || 'Unknown Student'}
                                    </span>
                                    {e.isWalkIn && (
                                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                                        Walk-in
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-label-secondary dark:text-[#86868B] truncate mt-0.5">
                                    {student.email || 'No Email'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-6 font-mono text-xs font-semibold text-label-primary dark:text-[#F5F5F7]">
                              {student.rollNo || 'N/A'}
                            </td>

                            <td className="py-3.5 px-6 text-xs text-label-secondary dark:text-[#86868B]">
                              <span>{student.department || 'Student'}</span>
                              {student.year && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span className="font-medium">{student.year}</span>
                                </>
                              )}
                            </td>

                            <td className="py-3.5 px-6">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  e.type === 'Team'
                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                    : e.type === 'Duo'
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                    : 'bg-separator dark:bg-white/10 text-label-secondary dark:text-[#86868B]'
                                }`}
                              >
                                {e.type || 'Individual'}
                                {isGroup && e.teamName ? ` • ${e.teamName}` : ''}
                              </span>
                            </td>

                            <td className="py-3.5 px-6 text-center">
                              <button
                                type="button"
                                onClick={() => toggleManualAttendance(e._id)}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  isPresent
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                    : 'bg-canvas dark:bg-[#1C1C1E] text-label-tertiary border-separator dark:border-white/10 hover:border-separator-opaque'
                                }`}
                              >
                                {isPresent ? (
                                  <>
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    <span>Present</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-3.5 h-3.5 rounded-full border border-separator dark:border-white/20" />
                                    <span>Absent</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            /* ================================================================= */
            /* OTP SESSIONS HUB TAB                                               */
            /* ================================================================= */
            <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
              {/* Left Pane: Sessions List */}
              <div className="w-full md:w-88 border-r border-separator dark:border-white/10 flex flex-col bg-canvas/30 dark:bg-white/[0.01]">
                <div className="p-4 border-b border-separator dark:border-white/10 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-label-secondary dark:text-[#86868B]">
                    Attendance Sessions ({sessions.length})
                  </h3>
                  <button
                    onClick={() => setShowCreateSession(true)}
                    className="btn-primary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus size={14} />
                    <span>New Session</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                  {sessions.length === 0 ? (
                    <div className="py-12 text-center p-4 space-y-2">
                      <Key size={24} className="text-label-tertiary mx-auto" />
                      <p className="text-xs font-bold text-label-primary dark:text-[#F5F5F7]">No Active Sessions</p>
                      <p className="text-[11px] text-label-secondary dark:text-[#86868B]">
                        Click "New Session" above to generate a live attendance OTP.
                      </p>
                    </div>
                  ) : (
                    sessions.map((s) => {
                      const isSelected = selectedSession?._id === s._id;
                      return (
                        <div
                          key={s._id}
                          onClick={() => handleViewSession(s)}
                          className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/35 shadow-sm'
                              : 'bg-surface dark:bg-[#161617] hover:bg-canvas/80 dark:hover:bg-white/[0.03] border-separator dark:border-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-bold text-sm text-label-primary dark:text-[#F5F5F7] truncate">
                              {s.sessionName}
                            </h4>
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${
                                s.isActive
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20'
                              }`}
                            >
                              {s.isActive ? 'Live' : 'Closed'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-medium text-label-secondary dark:text-[#86868B] mb-2">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {format(new Date(s.createdAt), 'hh:mm a')}
                            </span>
                            <span className="font-mono text-[11px] bg-canvas dark:bg-[#1C1C1E] px-2 py-0.5 rounded-md border border-separator dark:border-white/10">
                              {s.durationMinutes || 60}m limit
                            </span>
                          </div>

                          {/* OTP Display Pill */}
                          <div className="flex items-center justify-between pt-2 border-t border-separator/60 dark:border-white/5">
                            <div className="flex items-center gap-1.5 font-mono text-sm font-black text-blue-600 dark:text-blue-400">
                              <Key size={13} />
                              <span className="tracking-widest">{s.otp}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyOtp(s.otp);
                              }}
                              className="p-1 rounded-lg hover:bg-canvas dark:hover:bg-white/10 text-label-tertiary hover:text-label-primary transition-colors cursor-pointer"
                              title="Copy OTP"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Pane: Selected Session Roster */}
              <div className="flex-1 flex flex-col relative bg-surface dark:bg-[#121214]">
                {selectedSession ? (
                  <>
                    <div className="p-5 border-b border-separator dark:border-white/10 bg-canvas/20 dark:bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-black text-label-primary dark:text-[#F5F5F7]">
                            {selectedSession.sessionName}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              selectedSession.isActive
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-500/10 text-red-500 dark:text-red-400'
                            }`}
                          >
                            {selectedSession.isActive ? 'Active OTP' : 'Session Expired'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-label-secondary dark:text-[#86868B] mt-1 font-medium flex-wrap">
                          <span>
                            OTP: <strong className="font-mono text-blue-600 dark:text-blue-400">{selectedSession.otp}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Expires: {format(new Date(selectedSession.otpExpiry), 'hh:mm a')}
                          </span>
                          {selectedSession.classHours?.length > 0 && (
                            <>
                              <span>•</span>
                              <span>Hours: {selectedSession.classHours.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={exportSessionCSV}
                          disabled={!sessionAttendance.length}
                          className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Download size={13} />
                          <span>Export Attendees CSV</span>
                        </button>
                        <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-center shrink-0">
                          <span className="text-base font-black leading-none block">{sessionAttendance.length}</span>
                          <span className="text-[9px] uppercase font-bold tracking-wider leading-none mt-0.5 block">
                            Verified
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {attendanceLoading ? (
                        <div className="py-16 text-center space-y-3">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                          <p className="text-xs text-label-secondary dark:text-[#86868B]">Loading session attendees...</p>
                        </div>
                      ) : sessionAttendance.length === 0 ? (
                        <div className="py-16 text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-canvas dark:bg-[#1C1C1E] border border-separator dark:border-white/10 flex items-center justify-center text-label-tertiary mx-auto">
                            <Clock size={22} />
                          </div>
                          <p className="text-sm font-bold text-label-primary dark:text-[#F5F5F7]">No attendees recorded yet</p>
                          <p className="text-xs text-label-secondary dark:text-[#86868B] max-w-sm mx-auto">
                            Share the 6-digit OTP code <strong className="font-mono text-blue-500">{selectedSession.otp}</strong> with students to begin collecting attendance.
                          </p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 bg-surface dark:bg-[#161617] border-b border-separator dark:border-white/10 z-10 shadow-sm">
                            <tr className="text-[11px] font-bold text-label-secondary dark:text-[#86868B] uppercase tracking-wider">
                              <th className="py-3 px-6">Attendee</th>
                              <th className="py-3 px-6">Roll Number</th>
                              <th className="py-3 px-6">Verified Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-separator/60 dark:divide-white/5">
                            {sessionAttendance.map((rec) => (
                              <tr key={rec._id} className="hover:bg-canvas/50 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="py-3 px-6 font-bold text-sm text-label-primary dark:text-[#F5F5F7]">
                                  {rec.user?.name || 'Unknown Student'}
                                </td>
                                <td className="py-3 px-6 font-mono text-xs text-label-secondary dark:text-[#86868B]">
                                  {rec.user?.rollNo || 'N/A'}
                                </td>
                                <td className="py-3 px-6 text-xs text-label-secondary dark:text-[#86868B] font-medium">
                                  {format(new Date(rec.timestamp || rec.createdAt), 'MMM dd, hh:mm:ss a')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-canvas dark:bg-[#1C1C1E] border border-separator dark:border-white/10 flex items-center justify-center text-label-tertiary">
                      <Key size={22} />
                    </div>
                    <p className="text-sm font-bold text-label-primary dark:text-[#F5F5F7]">Select a Session</p>
                    <p className="text-xs text-label-secondary dark:text-[#86868B] max-w-sm">
                      Select any attendance session from the left sidebar to view its roster and verification logs.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Create Session Modal Overlay */}
        <AnimatePresence>
          {showCreateSession && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="bg-surface dark:bg-[#161617] border border-separator dark:border-white/15 p-6 sm:p-7 rounded-3xl max-w-md w-full shadow-2xl space-y-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-separator dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Key size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-label-primary dark:text-white">
                        Create Attendance Session
                      </h3>
                      <p className="text-[11px] text-label-secondary dark:text-[#86868B]">
                        Generate dynamic OTP code for live student check-in
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateSession(false)}
                    className="p-1.5 rounded-lg text-label-tertiary hover:text-label-primary transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-label-secondary dark:text-[#86868B] uppercase tracking-wider mb-1.5 block">
                      Session Name / Description
                    </label>
                    <input
                      autoFocus
                      type="text"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      placeholder="e.g. Day 1 - Morning Session / Lab Check-in"
                      className="w-full text-xs py-2.5 px-3.5 rounded-xl bg-canvas dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-label-primary dark:text-[#F5F5F7] placeholder:text-label-tertiary focus:outline-none focus:border-blue-500 transition-colors font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-label-secondary dark:text-[#86868B] uppercase tracking-wider mb-1.5 block">
                      OTP Validity Duration
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[15, 30, 60, 120].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDurationMinutes(mins)}
                          className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                            durationMinutes === mins
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-canvas dark:bg-[#1C1C1E] border-separator dark:border-white/10 text-label-secondary hover:text-label-primary'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-label-secondary dark:text-[#86868B] uppercase tracking-wider mb-1.5 block">
                      Associated Class Hours (1 to 7)
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {[1, 2, 3, 4, 5, 6, 7].map((h) => {
                        const isSelected = selectedClassHours.includes(h);
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => {
                              setSelectedClassHours((prev) =>
                                isSelected ? prev.filter((item) => item !== h) : [...prev, h].sort((a, b) => a - b)
                              );
                            }}
                            className={`w-9 h-8 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-canvas dark:bg-[#1C1C1E] border-separator dark:border-white/10 text-label-secondary hover:text-label-primary'
                            }`}
                          >
                            H{h}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-separator dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowCreateSession(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-label-secondary hover:text-label-primary bg-canvas dark:bg-[#1C1C1E] border border-separator dark:border-white/10 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingSession}
                      className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/25"
                    >
                      {creatingSession && <Loader2 size={13} className="animate-spin" />}
                      <span>Generate & Activate OTP</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AttendanceDashboard;
