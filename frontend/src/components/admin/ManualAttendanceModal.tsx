import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserCheck,
  Search,
  Calendar,
  Layers,
  CheckCircle2,
  Users,
  Check,
  Loader2,
  AlertCircle,
  Building2,
  GraduationCap,
  Mail,
  Plus,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import useAttendanceStore from '../../store/useAttendanceStore';
import useEventStore from '../../store/useEventStore';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { getStudentCollege, getStudentYear } from './EventParticipantsModal';
import { useDebounce } from '../../hooks/useDebounce';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEventId?: string;
  onSuccess?: () => void;
}

interface StudentUser {
  _id: string;
  id?: string;
  name: string;
  rollNo?: string;
  email?: string;
  department?: string;
  college?: string;
  year?: string;
  profilePicUrl?: string;
}

interface EnrolledParticipant {
  user: StudentUser;
  registrationType: string;
  teamName?: string;
  isLeader: boolean;
  attendanceStatus: boolean;
  enrollmentId: string;
}

export const ManualAttendanceModal: React.FC<ManualAttendanceModalProps> = ({
  isOpen,
  onClose,
  initialEventId,
  onSuccess,
}) => {
  const { events, fetchEvents } = useEventStore();
  const { markManualAttendance } = useAttendanceStore();

  // Selected event & session
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [isCreatingNewSession, setIsCreatingNewSession] = useState<boolean>(false);
  const [newSessionName, setNewSessionName] = useState<string>('Manual Attendance Session');
  const [selectedClassHours, setSelectedClassHours] = useState<number[]>([1]);
  const [hourlyPoints, setHourlyPoints] = useState<number>(50);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'roster' | 'search'>('roster');

  // Tab 1: Directory search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce<string>(searchQuery, 350);
  const [searchResults, setSearchResults] = useState<StudentUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState<boolean>(false);

  // Tab 2: Enrolled participants roster
  const [enrolledParticipants, setEnrolledParticipants] = useState<EnrolledParticipant[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState<boolean>(false);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const debouncedRosterSearch = useDebounce<string>(rosterSearch, 300);
  const [rosterFilter, setRosterFilter] = useState<'all' | 'unmarked' | 'present'>('unmarked');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Action states
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());
  const [isBulkMarking, setIsBulkMarking] = useState<boolean>(false);
  const [markedUserIds, setMarkedUserIds] = useState<Set<string>>(new Set());

  // Load events on open
  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      setSelectedStudentIds(new Set());
      setMarkedUserIds(new Set());
      setSearchQuery('');
      setRosterSearch('');
      setIsCreatingNewSession(false);
      setNewSessionName('Manual Attendance Session');
      setSelectedClassHours([1]);
      if (initialEventId) {
        setSelectedEventId(initialEventId);
      }
    }
  }, [isOpen, initialEventId, fetchEvents]);

  // Set default event if none selected
  useEffect(() => {
    if (isOpen && events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(initialEventId || events[0]._id);
    }
  }, [isOpen, events, selectedEventId, initialEventId]);

  // Synchronize hourly points from selected event
  useEffect(() => {
    if (events && selectedEventId) {
      const ev = events.find((e: any) => e._id === selectedEventId);
      if (ev && ev.hourlyPoints !== undefined && !isNaN(Number(ev.hourlyPoints))) {
        setHourlyPoints(Number(ev.hourlyPoints));
      } else {
        setHourlyPoints(50);
      }
    }
  }, [events, selectedEventId]);

  // Load event sessions and enrolled roster when selectedEventId changes
  useEffect(() => {
    if (!isOpen || !selectedEventId) return;

    // Fetch sessions
    const fetchSessions = async () => {
      try {
        const res = await api.get(`/attendance/sessions/event/${selectedEventId}`);
        const data = Array.isArray(res.data) ? res.data : [];
        setSessions(data);
        if (data.length > 0) {
          // Default to first active or latest session
          const active = data.find((s: any) => s.isActive);
          setSelectedSessionId(active ? active._id : data[0]._id);
        } else {
          setSelectedSessionId('');
        }
      } catch (err) {
        console.error('Failed to load event sessions:', err);
        setSessions([]);
      }
    };

    // Fetch enrolled participants
    const fetchRoster = async () => {
      setIsLoadingRoster(true);
      try {
        const res = await api.get(`/enrollments/event/${selectedEventId}`);
        const enrollments = Array.isArray(res.data) ? res.data : [];

        // Flatten all students (leaders + team members)
        const participants: EnrolledParticipant[] = [];
        enrollments.forEach((e: any) => {
          if (e.enrolledBy) {
            participants.push({
              user: e.enrolledBy,
              registrationType: e.type || (e.members?.length ? 'Team' : 'Individual'),
              teamName: e.teamName,
              isLeader: true,
              attendanceStatus: Boolean(e.attendanceStatus),
              enrollmentId: e._id,
            });
          }
          if (e.members && Array.isArray(e.members)) {
            e.members.forEach((m: any) => {
              if (m && m._id) {
                participants.push({
                  user: m,
                  registrationType: e.type || 'Team',
                  teamName: e.teamName,
                  isLeader: false,
                  attendanceStatus: Boolean(e.attendanceStatus),
                  enrollmentId: e._id,
                });
              }
            });
          }
        });

        // Initialize markedUserIds with users who are already present
        const alreadyPresent = new Set<string>();
        participants.forEach((p) => {
          if (p.attendanceStatus && p.user?._id) {
            alreadyPresent.add(p.user._id);
          }
        });
        setMarkedUserIds((prev) => {
          const next = new Set(prev);
          alreadyPresent.forEach((id) => next.add(id));
          return next;
        });
        setEnrolledParticipants(participants);
      } catch (err) {
        console.error('Failed to load roster:', err);
        setEnrolledParticipants([]);
      } finally {
        setIsLoadingRoster(false);
      }
    };

    // Also fetch all existing attendance records for this event so Directory Search identifies them
    const fetchExistingAttendance = async () => {
      try {
        const res = await api.get(`/attendance/records?eventId=${selectedEventId}&all=true`);
        const records = res.data?.data?.records || [];
        const presentIds = new Set<string>();
        records.forEach((r: any) => {
          if (r.user?._id) presentIds.add(String(r.user._id));
          if (r.user?.id) presentIds.add(String(r.user.id));
        });
        setMarkedUserIds((prev) => {
          const next = new Set(prev);
          presentIds.forEach((id) => next.add(id));
          return next;
        });
      } catch (err) {
        console.error('Failed to load existing attendance records:', err);
      }
    };

    fetchSessions();
    fetchRoster();
    fetchExistingAttendance();
  }, [isOpen, selectedEventId]);

  // Debounced directory search query
  useEffect(() => {
    if (!isOpen || activeTab !== 'search') return;

    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    const searchUsers = async () => {
      setIsSearchingUsers(true);
      try {
        const res = await api.get(`/users?search=${encodeURIComponent(debouncedSearch.trim())}&limit=12`);
        const list = res.data?.data?.users || res.data?.users || [];
        setSearchResults(list);
      } catch (err) {
        console.error('Directory search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    };

    searchUsers();
  }, [isOpen, debouncedSearch, activeTab]);

  // Handle marking a single student
  const handleMarkSingle = async (student: StudentUser) => {
    if (!selectedEventId) {
      toast.error('Please select an event');
      return;
    }

    const studentId = student._id || student.id;
    if (!studentId) return;

    setMarkingIds((prev) => new Set(prev).add(studentId));

    try {
      const payload: any = {
        eventId: selectedEventId,
        studentId,
      };

      if (isCreatingNewSession) {
        payload.sessionName = newSessionName.trim() || 'Manual Attendance Session';
        payload.classHours = selectedClassHours;
        payload.hourlyPoints = Number(hourlyPoints) || 50;
      } else if (selectedSessionId) {
        payload.sessionId = selectedSessionId;
      }

      const res = await markManualAttendance(payload);

      if (res?.success) {
        setMarkedUserIds((prev) => new Set(prev).add(studentId));
        // Also update roster status
        setEnrolledParticipants((prev) =>
          prev.map((p) =>
            (p.user._id === studentId || p.user.id === studentId)
              ? { ...p, attendanceStatus: true }
              : p
          )
        );
        // Deselect if in multi-select set
        setSelectedStudentIds((prev) => {
          const next = new Set(prev);
          next.delete(studentId);
          return next;
        });

        if (onSuccess) onSuccess();
      }
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  // Handle bulk marking selected students
  const handleBulkMark = async () => {
    if (selectedStudentIds.size === 0) {
      toast.error('Please select at least one student to mark present');
      return;
    }

    setIsBulkMarking(true);
    const idsArray = Array.from(selectedStudentIds);

    try {
      const payload: any = {
        eventId: selectedEventId,
        studentIds: idsArray,
      };

      if (isCreatingNewSession) {
        payload.sessionName = newSessionName.trim() || 'Manual Attendance Session';
        payload.classHours = selectedClassHours;
        payload.hourlyPoints = Number(hourlyPoints) || 50;
      } else if (selectedSessionId) {
        payload.sessionId = selectedSessionId;
      }

      const res = await markManualAttendance(payload);

      if (res?.success) {
        // Mark all as present in state
        setMarkedUserIds((prev) => {
          const next = new Set(prev);
          idsArray.forEach((id) => next.add(id));
          return next;
        });

        setEnrolledParticipants((prev) =>
          prev.map((p) =>
            idsArray.includes(p.user._id) || (p.user.id && idsArray.includes(p.user.id))
              ? { ...p, attendanceStatus: true }
              : p
          )
        );

        setSelectedStudentIds(new Set());
        if (onSuccess) onSuccess();
      }
    } finally {
      setIsBulkMarking(false);
    }
  };

  // Filtered roster participants
  const filteredRoster = useMemo(() => {
    return enrolledParticipants.filter((p) => {
      const isPresent = markedUserIds.has(p.user._id) || (p.user.id && markedUserIds.has(p.user.id)) || p.attendanceStatus;

      // Status filter
      if (rosterFilter === 'unmarked' && isPresent) return false;
      if (rosterFilter === 'present' && !isPresent) return false;

      // Search filter
      if (!debouncedRosterSearch.trim()) return true;
      const q = debouncedRosterSearch.toLowerCase();
      return (
        p.user?.name?.toLowerCase().includes(q) ||
        p.user?.rollNo?.toLowerCase().includes(q) ||
        p.user?.email?.toLowerCase().includes(q) ||
        p.user?.department?.toLowerCase().includes(q) ||
        (p.teamName && p.teamName.toLowerCase().includes(q))
      );
    });
  }, [enrolledParticipants, rosterFilter, debouncedRosterSearch, markedUserIds]);

  // Toggle selection for bulk marking
  const toggleStudentSelection = (userId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  // Select all unmarked visible students
  const handleSelectAllUnmarked = () => {
    const unmarkedVisible = filteredRoster
      .filter((p) => !markedUserIds.has(p.user._id) && !p.attendanceStatus)
      .map((p) => p.user._id);

    const allSelected = unmarkedVisible.every((id) => selectedStudentIds.has(id));

    if (allSelected) {
      // Deselect all visible
      setSelectedStudentIds((prev) => {
        const next = new Set(prev);
        unmarkedVisible.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all visible
      setSelectedStudentIds((prev) => {
        const next = new Set(prev);
        unmarkedVisible.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-surface border border-separator rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--label-primary)' }}
        >
          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-separator bg-canvas/60 flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
                <UserCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-label-primary tracking-tight font-heading">
                    Manual Attendance Entry
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent/10 text-accent border border-accent/20">
                    Admin Override
                  </span>
                </div>
                <p className="text-xs text-label-secondary mt-0.5">
                  Directly record verified presence for students who missed OTP submission.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-label-secondary hover:text-label-primary hover:bg-canvas transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Event & Session Selector Bar */}
          <div className="p-4 sm:px-6 border-b border-separator bg-surface grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Event Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-label-secondary flex items-center gap-1.5">
                <Calendar size={13} className="text-accent" />
                <span>Select Event</span>
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="input-field py-2 text-xs w-full font-medium"
              >
                {events.map((ev: any) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title} ({format(new Date(ev.date), 'MMM dd, yyyy')}) — {ev.type}
                  </option>
                ))}
              </select>
            </div>

            {/* Session Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-label-secondary flex items-center gap-1.5">
                  <Clock size={13} className="text-accent" />
                  <span>Attendance Session</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewSession(!isCreatingNewSession)}
                  className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {isCreatingNewSession ? 'Pick Existing Session' : '+ New Session with Hours'}
                </button>
              </div>

              {isCreatingNewSession ? (
                <div className="space-y-2.5 pt-1">
                  <input
                    type="text"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="e.g. Day 1 - Lab Manual Entry"
                    className="input-field py-2 text-xs w-full"
                  />

                  {/* 7 Class Hours Mapping */}
                  <div className="p-2.5 rounded-xl bg-canvas/70 border border-separator space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-label-secondary flex items-center gap-1">
                        <Layers size={12} className="text-accent" /> Map Class Hours:
                      </span>
                      <span className="font-mono text-amber-500 dark:text-amber-400 font-bold">
                        +{selectedClassHours.length * (Number(hourlyPoints) || 0)} pts/student
                      </span>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {[1, 2, 3, 4, 5, 6, 7].map((hr) => {
                        const isSelected = selectedClassHours.includes(hr);
                        return (
                          <button
                            key={hr}
                            type="button"
                            onClick={() => {
                              setSelectedClassHours((prev) => {
                                if (prev.includes(hr)) {
                                  if (prev.length === 1) return prev;
                                  return prev.filter((h) => h !== hr).sort((a, b) => a - b);
                                } else {
                                  return [...prev, hr].sort((a, b) => a - b);
                                }
                              });
                            }}
                            className={`py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-accent text-white border-blue-400 shadow-xs'
                                : 'bg-surface text-label-secondary border-separator hover:text-label-primary'
                            }`}
                          >
                            H{hr}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-label-secondary">
                      <span>{selectedClassHours.length} hr{selectedClassHours.length > 1 ? 's' : ''} × {hourlyPoints} pts</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedClassHours([1, 2, 3, 4])}
                          className="hover:text-accent font-semibold underline"
                        >
                          1-4
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedClassHours([5, 6, 7])}
                          className="hover:text-accent font-semibold underline"
                        >
                          5-7
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedClassHours([1, 2, 3, 4, 5, 6, 7])}
                          className="hover:text-accent font-semibold underline"
                        >
                          All 7
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="input-field py-2 text-xs w-full font-medium"
                    disabled={sessions.length === 0}
                  >
                    {sessions.length === 0 ? (
                      <option value="">No sessions yet (auto-generates manual session)</option>
                    ) : (
                      sessions.map((s: any) => (
                        <option key={s._id} value={s._id}>
                          {s.sessionName} {s.isActive ? '(Active)' : '(Closed)'} • {s.classHours?.length || 1} hr{s.classHours?.length > 1 ? 's' : ''} (+{s.totalPoints || ((s.hourlyPoints || 50) * (s.classHours?.length || 1))} pts)
                        </option>
                      ))
                    )}
                  </select>

                  {/* Selected session summary badge */}
                  {selectedSessionId && (() => {
                    const activeS = sessions.find((s: any) => s._id === selectedSessionId);
                    if (!activeS) return null;
                    const hoursList = activeS.classHours && activeS.classHours.length > 0 ? activeS.classHours.join(', ') : '1';
                    const points = activeS.totalPoints || ((activeS.hourlyPoints || 50) * (activeS.classHours?.length || 1));
                    return (
                      <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10.5px] text-amber-600 dark:text-amber-400">
                        <span className="font-semibold">Mapped Periods: Hours {hoursList}</span>
                        <span className="font-mono font-bold">+{points} pts/student</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-separator bg-canvas/30">
            <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-separator">
              <button
                onClick={() => setActiveTab('roster')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'roster'
                    ? 'bg-text-primary text-surface shadow-xs'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <Users size={14} />
                <span>Enrolled Participants</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-separator text-label-secondary">
                  {enrolledParticipants.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'search'
                    ? 'bg-text-primary text-surface shadow-xs'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <Search size={14} />
                <span>Search Any Student</span>
              </button>
            </div>

            {/* Quick Bulk Action (Only in Roster Tab) */}
            {activeTab === 'roster' && selectedStudentIds.size > 0 && (
              <button
                onClick={handleBulkMark}
                disabled={isBulkMarking}
                className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-2 cursor-pointer shadow-sm animate-in fade-in"
              >
                {isBulkMarking ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>Mark Selected ({selectedStudentIds.size}) Present</span>
              </button>
            )}
          </div>

          {/* Tab 1: Enrolled Participants Roster */}
          {activeTab === 'roster' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Roster Filter Bar */}
              <div className="p-3.5 sm:px-6 border-b border-separator flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface">
                {/* Search in Roster */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-label-tertiary" size={14} />
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="Filter by name, roll no, team..."
                    className="input-field text-xs pl-8.5 py-1.5 w-full"
                  />
                  {rosterSearch && (
                    <button
                      onClick={() => setRosterSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Status Filter & Select All */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-canvas p-1 rounded-xl border border-separator text-xs">
                    <button
                      onClick={() => setRosterFilter('unmarked')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        rosterFilter === 'unmarked'
                          ? 'bg-amber-500/20 text-amber-500 font-bold'
                          : 'text-label-secondary hover:text-label-primary'
                      }`}
                    >
                      Unmarked ({enrolledParticipants.filter((p) => !markedUserIds.has(p.user._id) && !p.attendanceStatus).length})
                    </button>

                    <button
                      onClick={() => setRosterFilter('present')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        rosterFilter === 'present'
                          ? 'bg-emerald-500/20 text-emerald-500 font-bold'
                          : 'text-label-secondary hover:text-label-primary'
                      }`}
                    >
                      Present ({enrolledParticipants.filter((p) => markedUserIds.has(p.user._id) || p.attendanceStatus).length})
                    </button>

                    <button
                      onClick={() => setRosterFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        rosterFilter === 'all'
                          ? 'bg-surface text-label-primary font-bold shadow-xs'
                          : 'text-label-secondary hover:text-label-primary'
                      }`}
                    >
                      All ({enrolledParticipants.length})
                    </button>
                  </div>

                  {rosterFilter !== 'present' && filteredRoster.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllUnmarked}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-separator hover:bg-canvas transition-colors cursor-pointer text-label-secondary hover:text-label-primary"
                    >
                      Toggle All
                    </button>
                  )}
                </div>
              </div>

              {/* Roster List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 space-y-2">
                {isLoadingRoster ? (
                  <div className="py-14 text-center space-y-2">
                    <Loader2 className="w-7 h-7 animate-spin text-accent mx-auto" />
                    <p className="text-xs text-label-secondary">Loading event roster...</p>
                  </div>
                ) : filteredRoster.length === 0 ? (
                  <div className="py-14 text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-label-tertiary mx-auto opacity-40" />
                    <p className="text-sm font-bold text-label-primary">
                      {rosterFilter === 'unmarked'
                        ? 'All registered participants are marked present!'
                        : 'No participants match the selected filter'}
                    </p>
                    <p className="text-xs text-label-secondary max-w-sm mx-auto">
                      {rosterFilter === 'unmarked'
                        ? 'Switch to the "All" tab to review or search other students in the directory.'
                        : 'Try searching with another name or clearing the filter.'}
                    </p>
                  </div>
                ) : (
                  filteredRoster.map((p) => {
                    const student = p.user;
                    const isPresent = markedUserIds.has(student._id) || (student.id && markedUserIds.has(student.id)) || p.attendanceStatus;
                    const isMarking = markingIds.has(student._id) || (student.id && markingIds.has(student.id));
                    const isSelected = selectedStudentIds.has(student._id);

                    return (
                      <div
                        key={student._id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isPresent
                            ? 'bg-canvas/50 border-separator opacity-85'
                            : isSelected
                            ? 'bg-accent/5 border-accent/40 shadow-xs'
                            : 'bg-surface hover:bg-surface-elevated border-separator'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Checkbox for bulk marking (only if not present) */}
                          {!isPresent ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleStudentSelection(student._id)}
                              className="w-4 h-4 rounded border-separator text-accent focus:ring-accent cursor-pointer shrink-0"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                              <Check size={11} />
                            </div>
                          )}

                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-separator text-label-primary font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                            {student.profilePicUrl ? (
                              <img src={student.profilePicUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              student.name?.charAt(0) || 'S'
                            )}
                          </div>

                          {/* Student Details */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-label-primary truncate">
                                {student.name}
                              </span>
                              {p.teamName && (
                                <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  {p.teamName}
                                </span>
                              )}
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                                {getStudentCollege(student)}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-canvas text-label-secondary border border-separator">
                                {getStudentYear(student)}
                              </span>
                            </div>

                            <p className="text-[11px] text-label-secondary font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                              <span>Roll: <strong className="text-label-primary font-semibold">{student.rollNo || '—'}</strong></span>
                              <span>•</span>
                              <span>{student.department || 'General'}</span>
                              <span>•</span>
                              <span className="truncate max-w-[160px] text-label-tertiary">{student.email}</span>
                            </p>
                          </div>
                        </div>

                        {/* Right Status / Action Button */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {isPresent ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-semibold">
                              <CheckCircle2 size={13} />
                              <span>Verified Present</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkSingle(student)}
                              disabled={isMarking || isBulkMarking}
                              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {isMarking ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <UserCheck size={13} />
                              )}
                              <span>Mark Present</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Search Any Student Directory */}
          {activeTab === 'search' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search Bar */}
              <div className="p-4 sm:px-6 border-b border-separator bg-surface">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" size={15} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, roll number (e.g. 7376231CS...), or email..."
                    className="input-field text-xs pl-9.5 py-2.5 w-full"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Directory Results */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 space-y-2">
                {isSearchingUsers ? (
                  <div className="py-14 text-center space-y-2">
                    <Loader2 className="w-7 h-7 animate-spin text-accent mx-auto" />
                    <p className="text-xs text-label-secondary">Searching student directory...</p>
                  </div>
                ) : !searchQuery.trim() ? (
                  <div className="py-14 text-center space-y-2">
                    <Search className="w-8 h-8 text-label-tertiary mx-auto opacity-30" />
                    <p className="text-sm font-bold text-label-primary">Search for any student</p>
                    <p className="text-xs text-label-secondary max-w-sm mx-auto">
                      Enter a name or roll number to locate any student in the college directory and mark their attendance.
                    </p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-14 text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-label-tertiary mx-auto opacity-40" />
                    <p className="text-sm font-bold text-label-primary">No students found</p>
                    <p className="text-xs text-label-secondary">
                      No matching student accounts found for "{searchQuery}".
                    </p>
                  </div>
                ) : (
                  searchResults.map((stu) => {
                    const isPresent = markedUserIds.has(stu._id) || (stu.id && markedUserIds.has(stu.id));
                    const isMarking = markingIds.has(stu._id) || (stu.id && markingIds.has(stu.id));

                    return (
                      <div
                        key={stu._id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isPresent
                            ? 'bg-canvas/50 border-separator'
                            : 'bg-surface hover:bg-surface-elevated border-separator'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-separator text-label-primary font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                            {stu.profilePicUrl ? (
                              <img src={stu.profilePicUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              stu.name?.charAt(0) || 'S'
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-label-primary truncate">
                                {stu.name}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                                {getStudentCollege(stu)}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-canvas text-label-secondary border border-separator">
                                {getStudentYear(stu)}
                              </span>
                            </div>

                            <p className="text-[11px] text-label-secondary font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                              <span>Roll: <strong className="text-label-primary font-semibold">{stu.rollNo || '—'}</strong></span>
                              <span>•</span>
                              <span>{stu.department || 'General'}</span>
                              <span>•</span>
                              <span className="truncate max-w-[180px] text-label-tertiary">{stu.email}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {isPresent ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-semibold">
                              <CheckCircle2 size={13} />
                              <span>Verified Present</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkSingle(stu)}
                              disabled={isMarking}
                              className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {isMarking ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <UserCheck size={13} />
                              )}
                              <span>Mark Present</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="p-4 sm:px-6 border-t border-separator bg-canvas/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-label-secondary">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Manual markings automatically synchronize with certificates and the live attendance registry.
              </span>
            </div>

            <button
              onClick={onClose}
              className="btn-secondary text-xs py-1.5 px-4 cursor-pointer self-end sm:self-auto"
            >
              Done & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ManualAttendanceModal;
