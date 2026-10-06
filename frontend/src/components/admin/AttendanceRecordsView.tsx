import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  Clock,
  Search,
  KeyRound,
  Download,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Filter,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import useAttendanceStore from '../../store/useAttendanceStore';
import useEventStore from '../../store/useEventStore';
import useUserStore from '../../store/useUserStore';
import GenerateOtpModal from './GenerateOtpModal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { getStudentCollege, getStudentYear } from './EventParticipantsModal';
import { useDebounce } from '../../hooks/useDebounce';

const AttendanceRecordsView: React.FC = () => {
  const {
    recordsData,
    activeSession,
    fetchAttendanceRecords,
    fetchAllAttendanceRecords,
    fetchActiveSession,
    loading,
  } = useAttendanceStore();
  const { events, fetchEvents } = useEventStore();
  const { users, fetchUsers } = useUserStore();

  // Mode: 'event' or 'student'
  const [filterMode, setFilterMode] = useState<'event' | 'student'>('event');

  // Selected filters
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  // Table search with debouncing
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearch = useDebounce<string>(searchTerm, 400);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);

  // Modals & Active Session state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [remainingSecs, setRemainingSecs] = useState<number>(0);

  // Load initial events & users
  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, [fetchEvents, fetchUsers]);

  // Default select first event if available
  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0]._id);
    }
  }, [events, selectedEventId]);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode, selectedEventId, selectedStudentId, debouncedSearch, pageSize]);

  // Fetch records whenever selection or debounced search changes
  useEffect(() => {
    if (filterMode === 'event' && selectedEventId) {
      fetchAttendanceRecords({ eventId: selectedEventId, search: debouncedSearch, all: true });
      fetchActiveSession(selectedEventId);
    } else if (filterMode === 'student' && selectedStudentId) {
      fetchAttendanceRecords({ studentId: selectedStudentId, search: debouncedSearch, all: true });
    }
  }, [filterMode, selectedEventId, selectedStudentId, debouncedSearch, fetchAttendanceRecords, fetchActiveSession]);

  // Countdown timer for active OTP session
  useEffect(() => {
    if (!activeSession || !activeSession.otpExpiry) {
      setRemainingSecs(0);
      return;
    }

    const expiryTime = new Date(activeSession.otpExpiry).getTime();
    const updateCountdown = () => {
      const diff = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setRemainingSecs(diff);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const copyOtp = () => {
    if (!activeSession?.otp) return;
    navigator.clipboard.writeText(activeSession.otp);
    setCopiedOtp(true);
    toast.success('OTP copied to clipboard');
    setTimeout(() => setCopiedOtp(false), 2500);
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}m ${remainder < 10 ? '0' : ''}${remainder}s`;
  };

  // Helper for generating pagination numbers
  const getPageNumbers = (current: number, total: number) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // Filtered and paginated records in Event mode
  const allEventRecords = useMemo(() => recordsData?.records || [], [recordsData]);
  const filteredEventRecords = useMemo(() => {
    if (!searchTerm.trim()) return allEventRecords;
    const term = searchTerm.toLowerCase();
    return allEventRecords.filter((r: any) => {
      const user = r.user;
      return (
        user?.name?.toLowerCase().includes(term) ||
        user?.rollNo?.toLowerCase().includes(term) ||
        user?.email?.toLowerCase().includes(term) ||
        user?.department?.toLowerCase().includes(term) ||
        r.session?.sessionName?.toLowerCase().includes(term)
      );
    });
  }, [allEventRecords, searchTerm]);

  const totalEventPages = Math.max(1, Math.ceil(filteredEventRecords.length / pageSize));
  const paginatedEventRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEventRecords.slice(start, start + pageSize);
  }, [filteredEventRecords, currentPage, pageSize]);

  // Filtered and paginated records in Student mode
  const allStudentRecords = useMemo(() => recordsData?.records || [], [recordsData]);
  const filteredStudentRecords = useMemo(() => {
    if (!searchTerm.trim()) return allStudentRecords;
    const term = searchTerm.toLowerCase();
    return allStudentRecords.filter((r: any) => {
      return (
        r.event?.title?.toLowerCase().includes(term) ||
        r.sessionName?.toLowerCase().includes(term) ||
        r.event?.type?.toLowerCase().includes(term) ||
        r.event?.format?.toLowerCase().includes(term)
      );
    });
  }, [allStudentRecords, searchTerm]);

  const totalStudentPages = Math.max(1, Math.ceil(filteredStudentRecords.length / pageSize));
  const paginatedStudentRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudentRecords.slice(start, start + pageSize);
  }, [filteredStudentRecords, currentPage, pageSize]);

  // Export Attendance CSV: Always downloads ALL attendance entries across the selected scope!
  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      let recordsToExport: any[] = [];
      let currentEventTitle = recordsData?.event?.title || 'Event';
      let currentStudentName = recordsData?.student?.name || 'Student';

      if (filterMode === 'event') {
        if (!selectedEventId) {
          toast.error('Please select an event to export attendance');
          setIsExportingCsv(false);
          return;
        }

        // Fetch ALL attendance records for this event from backend
        const allData = await fetchAllAttendanceRecords({ eventId: selectedEventId });
        recordsToExport = allData?.records || allEventRecords;
        if (allData?.event?.title) currentEventTitle = allData.event.title;
      } else {
        if (!selectedStudentId) {
          toast.error('Please select a student to export attendance');
          setIsExportingCsv(false);
          return;
        }

        // Fetch ALL attendance records for this student from backend
        const allData = await fetchAllAttendanceRecords({ studentId: selectedStudentId });
        recordsToExport = allData?.records || allStudentRecords;
        if (allData?.student?.name) currentStudentName = allData.student.name;
      }

      if (!recordsToExport || recordsToExport.length === 0) {
        toast.error('No attendance records found to export');
        setIsExportingCsv(false);
        return;
      }

      // Safe CSV escaping
      const escapeCell = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      let csvContent = '\uFEFF'; // UTF-8 BOM for Excel

      if (filterMode === 'event') {
        const headers = [
          'Event Title',
          'Event Date',
          'Event Type',
          'Event Format',
          'Student Name',
          'Roll Number',
          'College',
          'Year',
          'Email',
          'Department',
          'Session Name',
          'Verified Date & Time',
          'Verified Timestamp (ISO)',
          'Attendance Status',
        ];
        csvContent += headers.map(escapeCell).join(',') + '\n';

        recordsToExport.forEach((r: any) => {
          const formattedDate = r.timestamp
            ? format(new Date(r.timestamp), 'yyyy-MM-dd hh:mm:ss a')
            : '';
          const row = [
            currentEventTitle,
            recordsData?.event?.date ? format(new Date(recordsData.event.date), 'yyyy-MM-dd') : '',
            recordsData?.event?.type || '',
            recordsData?.event?.format || '',
            r.user?.name || '',
            r.user?.rollNo || '',
            getStudentCollege(r.user),
            getStudentYear(r.user),
            r.user?.email || '',
            r.user?.department || '',
            r.session?.sessionName || 'General Session',
            formattedDate,
            r.timestamp ? new Date(r.timestamp).toISOString() : '',
            'Verified',
          ];
          csvContent += row.map(escapeCell).join(',') + '\n';
        });
      } else {
        const headers = [
          'Student Name',
          'Roll Number',
          'College',
          'Year',
          'Email',
          'Department',
          'Event Title',
          'Event Date',
          'Event Type',
          'Event Format',
          'Session Name',
          'Verified Date & Time',
          'Verified Timestamp (ISO)',
          'Attendance Status',
        ];
        csvContent += headers.map(escapeCell).join(',') + '\n';

        recordsToExport.forEach((r: any) => {
          const formattedDate = r.timestamp
            ? format(new Date(r.timestamp), 'yyyy-MM-dd hh:mm:ss a')
            : '';
          const row = [
            currentStudentName,
            recordsData?.student?.rollNo || '',
            getStudentCollege(recordsData?.student),
            getStudentYear(recordsData?.student),
            recordsData?.student?.email || '',
            recordsData?.student?.department || '',
            r.event?.title || '',
            r.event?.date ? format(new Date(r.event.date), 'yyyy-MM-dd') : '',
            r.event?.type || '',
            r.event?.format || '',
            r.sessionName || 'General Session',
            formattedDate,
            r.timestamp ? new Date(r.timestamp).toISOString() : '',
            'Verified',
          ];
          csvContent += row.map(escapeCell).join(',') + '\n';
        });
      }

      // Trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeTitle = (filterMode === 'event' ? currentEventTitle : currentStudentName)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      link.href = url;
      link.setAttribute('download', `attendance_${safeTitle}_all_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        `Successfully exported all ${recordsToExport.length} attendance entries to CSV!`
      );
    } catch (err: any) {
      console.error('Export CSV error:', err);
      toast.error('Failed to export complete attendance records');
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Filtered student candidates for student mode search
  const studentCandidates = useMemo(() => {
    if (!studentSearchTerm.trim()) return users.slice(0, 8);
    const q = studentSearchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.rollNo.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q))
    );
  }, [users, studentSearchTerm]);

  return (
    <div className="space-y-4 sm:space-y-6 py-2 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary tracking-tight">Attendance</h2>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Issue 6-digit session OTPs and audit verified attendance records by event or student.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOtpModal(true)}
            className="btn-primary flex items-center gap-2 text-xs font-semibold cursor-pointer"
            style={{ minHeight: 44 }}
          >
            <KeyRound size={15} />
            <span>Generate Session OTP</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 surface rounded-2xl border border-separator shadow-card">
        <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-separator">
          <button
            onClick={() => setFilterMode('event')}
            className={`flex items-center gap-2 px-4 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterMode === 'event'
                ? 'bg-text-primary text-surface font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            style={{ minHeight: 44 }}
          >
            <Calendar size={14} />
            <span>By Event</span>
          </button>

          <button
            onClick={() => setFilterMode('student')}
            className={`flex items-center gap-2 px-4 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterMode === 'student'
                ? 'bg-text-primary text-surface font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            style={{ minHeight: 44 }}
          >
            <Users size={14} />
            <span>By Student</span>
          </button>
        </div>

        {/* Export CSV action */}
        <button
          onClick={handleExportCsv}
          disabled={isExportingCsv}
          className="btn-secondary text-xs font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          style={{ minHeight: 44 }}
          title="Download complete attendance sheet with all entries"
        >
          {isExportingCsv ? (
            <RefreshCw size={14} className="animate-spin text-accent" />
          ) : (
            <Download size={14} />
          )}
          <span>{isExportingCsv ? 'Exporting...' : 'Export CSV'}</span>
        </button>
      </div>

      {/* --- MODE 1: FILTER BY EVENT --- */}
      {filterMode === 'event' && (
        <div className="space-y-6">
          {/* Event Picker Controls */}
          <div className="surface p-6 rounded-[18px] border border-separator shadow-card space-y-5">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 justify-between">
              <div className="flex-1 space-y-1.5 max-w-md">
                <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                  <Calendar size={13} className="text-text-muted" /> Select Event
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="input-field py-2 text-xs"
                >
                  {events.map((ev:any) => (
                    <option key={ev._id} value={ev._id}>
                      {ev.title} ({format(new Date(ev.date), 'MMM dd, yyyy')}) — {ev.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Table search filter */}
              <div className="relative flex-1 max-w-sm self-end">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                <input
                  type="text"
                  placeholder="Filter attendees by name, roll no..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-9 text-xs"
                />
              </div>
            </div>

            {/* Active OTP Live Display Banner (if event has an active session) */}
            {activeSession && remainingSecs > 0 ? (
              <div className="p-5 rounded-2xl bg-canvas border border-separator flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-separator flex items-center justify-center text-accent">
                    <KeyRound size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Live Session Active
                      </p>
                    </div>
                    <h4 className="text-lg font-bold text-text-primary">{activeSession.sessionName}</h4>
                    <p className="text-xs text-text-muted font-mono">
                      Expires in: <strong className="text-text-primary">{formatCountdown(remainingSecs)}</strong>
                    </p>
                  </div>
                </div>

                {/* Big OTP Display */}
                <div className="flex items-center gap-3">
                  <div className="bg-surface-elevated border border-separator px-6 py-2 rounded-xl font-mono text-2xl font-bold tracking-[0.25em] text-text-primary">
                    {activeSession.otp}
                  </div>
                  <button
                    onClick={copyOtp}
                    className="p-2.5 btn-secondary rounded-xl cursor-pointer"
                    title="Copy OTP"
                  >
                    {copiedOtp ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Event Summary Editorial Meta */}
            {recordsData?.event && (
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-separator text-xs text-text-muted">
                <span>Type: <strong className="text-text-primary font-medium">{recordsData.event.type}</strong></span>
                <span>•</span>
                <span>Format: <strong className="text-text-primary font-medium">{recordsData.event.format}</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-text-primary font-medium">{recordsData.event.status}</strong></span>
                <span>•</span>
                <span>Total Present: <strong className="text-text-primary font-semibold">{filteredEventRecords.length}</strong></span>
              </div>
            )}
          </div>

          {/* Attendees Table
               Mobile: overflow-x-auto + right fade-gradient (do NOT squeeze)
               Desktop: full table as-is
          */}
          <div className="surface rounded-[18px] border border-separator shadow-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-separator flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-separator text-text-secondary flex items-center justify-center">
                  <UserCheck size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Verified Attendees</h3>
                  <p className="text-xs text-text-muted">Timestamped student verification records</p>
                </div>
              </div>
              <span className="text-xs font-mono text-text-muted">
                {filteredEventRecords.length} verified
              </span>
            </div>

            {/* Table wrapper: horizontal scroll on mobile with right-edge fade hint */}
            <div className="relative">
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 680 }}>
                <thead>
                  <tr className="border-b border-separator text-[11px] font-medium text-text-muted bg-canvas">
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Student</th>
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Roll Number</th>
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">College</th>
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Year</th>
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Department</th>
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Session</th>
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Verified At</th>
                    <th className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {paginatedEventRecords.length > 0 ? (
                    paginatedEventRecords.map((r: any) => (
                      <tr key={r._id} className="hover:bg-surface-elevated transition-colors">
                        <td className="px-4 sm:px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-surface-elevated border border-separator flex items-center justify-center text-xs font-semibold text-text-primary shrink-0">
                              {r.user?.profilePicUrl ? (
                                <img
                                  src={r.user.profilePicUrl}
                                  alt=""
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                r.user?.name?.charAt(0) || 'U'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-text-primary whitespace-nowrap">
                                {r.user?.name || 'Unknown Student'}
                              </p>
                              <p className="text-[11px] text-text-muted truncate max-w-[120px] sm:max-w-[150px]">
                                {r.user?.email || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs font-mono text-text-secondary whitespace-nowrap">
                          {r.user?.rollNo || '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent font-bold text-[11px] border border-accent/20 whitespace-nowrap">
                            {getStudentCollege(r.user)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs font-semibold text-text-primary whitespace-nowrap">
                          {getStudentYear(r.user)}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs text-text-muted whitespace-nowrap">
                          {r.user?.department || 'General'}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs text-text-secondary whitespace-nowrap">
                          {r.session?.sessionName || 'General Session'}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs text-text-muted font-mono whitespace-nowrap">
                          {r.timestamp ? format(new Date(r.timestamp), 'MMM dd, yyyy • hh:mm a') : '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-semibold uppercase whitespace-nowrap">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-14 text-center">
                        <div className="max-w-sm mx-auto space-y-1.5">
                          <ShieldCheck className="w-9 h-9 text-text-muted mx-auto opacity-30" />
                          <p className="text-text-primary font-medium text-sm">
                            {searchTerm ? 'No matching attendees found' : 'No attendance records yet'}
                          </p>
                          <p className="text-text-muted text-xs">
                            {searchTerm
                              ? 'Try searching with a different name, roll number, or department.'
                              : 'Students will appear here as soon as they submit the 6-digit session OTP.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
              {/* Right-edge fade gradient — mobile scroll hint */}
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:hidden"
                style={{
                  background: 'linear-gradient(to right, transparent, var(--canvas))',
                }}
              />
            </div>

            {/* Pagination Controls Bar */}
            {filteredEventRecords.length > 0 && (
              <div className="px-6 py-4 border-t border-separator bg-canvas flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>
                    Showing{' '}
                    <strong className="text-text-primary font-semibold">
                      {(currentPage - 1) * pageSize + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-text-primary font-semibold">
                      {Math.min(currentPage * pageSize, filteredEventRecords.length)}
                    </strong>{' '}
                    of{' '}
                    <strong className="text-text-primary font-semibold">
                      {filteredEventRecords.length}
                    </strong>{' '}
                    verified attendees
                  </span>
                  <div className="h-4 w-px bg-separator hidden sm:block" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-surface-elevated border border-separator text-text-primary text-xs rounded-lg px-2 py-1 outline-none focus:border-accent"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {totalEventPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-separator text-text-secondary hover:text-text-primary hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft size={15} />
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {getPageNumbers(currentPage, totalEventPages).map((num, idx) =>
                        typeof num === 'number' ? (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(num)}
                            className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-medium transition-all ${
                              currentPage === num
                                ? 'bg-text-primary text-surface font-semibold shadow-xs'
                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                            }`}
                          >
                            {num}
                          </button>
                        ) : (
                          <span key={idx} className="px-1 text-xs text-text-muted">
                            {num}
                          </span>
                        )
                      )}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalEventPages, p + 1))}
                      disabled={currentPage === totalEventPages}
                      className="p-1.5 rounded-lg border border-separator text-text-secondary hover:text-text-primary hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Next Page"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODE 2: FILTER BY STUDENT --- */}
      {filterMode === 'student' && (
        <div className="space-y-6">
          {/* Student Picker & Directory Search */}
          <div className="surface p-6 rounded-[18px] border border-separator shadow-card space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <Users size={13} className="text-text-muted" /> Search & Select Student
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                <input
                  type="text"
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  placeholder="Type student name, roll number, or department..."
                  className="input-field pl-9 text-xs"
                />
              </div>
            </div>

            {/* Quick Select Candidates Chips */}
            <div className="flex flex-wrap gap-2 pt-1 max-h-24 overflow-y-auto custom-scrollbar">
              {studentCandidates.map((stu) => (
                <button
                  key={stu._id}
                  onClick={() => setSelectedStudentId(stu._id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    selectedStudentId === stu._id
                      ? 'bg-text-primary text-surface border-text-primary shadow-xs font-semibold'
                      : 'bg-canvas text-text-secondary border-separator hover:bg-surface-elevated hover:text-text-primary'
                  }`}
                >
                  <span>{stu.name}</span>
                  <span className="text-[10px] opacity-70 font-mono">({stu.rollNo})</span>
                </button>
              ))}
            </div>

            {/* Selected Student Profile Banner */}
            {recordsData?.student && (
              <div className="p-4 rounded-xl bg-canvas border border-separator flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-elevated text-text-primary font-bold flex items-center justify-center border border-separator text-sm">
                    {recordsData.student.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary">{recordsData.student.name}</h4>
                    <p className="text-xs text-text-muted font-mono flex items-center gap-2 flex-wrap mt-0.5">
                      <span>Roll: <strong className="text-text-primary">{recordsData.student.rollNo}</strong></span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                        {getStudentCollege(recordsData.student)}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-surface border border-separator text-text-primary">
                        {getStudentYear(recordsData.student)}
                      </span>
                      <span>•</span>
                      <span>Dept: <strong className="text-text-secondary">{recordsData.student.department || 'General'}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <span className="text-xl font-bold text-text-primary">{filteredStudentRecords.length}</span>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    Sessions Attended
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Student's Attended Events Table */}
          <div className="surface rounded-[18px] border border-separator shadow-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-separator flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-separator text-text-secondary flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Student Attendance Record</h3>
                  <p className="text-xs text-text-muted">All verified events attended by this student</p>
                </div>
              </div>
              <span className="text-xs font-mono text-text-muted">
                {filteredStudentRecords.length} verified sessions
              </span>
            </div>

            {/* Table with mobile horizontal scroll + right-fade hint */}
            <div className="relative">
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 560 }}>
                  <thead>
                    <tr className="border-b border-separator text-[11px] font-medium text-text-muted bg-canvas">
                      <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Event Title</th>
                      <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Type & Format</th>
                      <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Event Date</th>
                      <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Session Name</th>
                      <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Verified At</th>
                      <th className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-separator">
                  {paginatedStudentRecords.length > 0 ? (
                    paginatedStudentRecords.map((r: any) => (
                      <tr key={r._id} className="hover:bg-surface-elevated transition-colors">
                        <td className="px-4 sm:px-6 py-3.5 font-semibold text-text-primary text-xs whitespace-nowrap">
                          {r.event?.title || 'Event Session'}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs text-text-muted whitespace-nowrap">
                          <span>{r.event?.type || 'Technical'}</span> •{' '}
                          <span>{r.event?.format || 'Individual'}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs text-text-secondary whitespace-nowrap">
                          {r.event?.date ? format(new Date(r.event.date), 'MMM dd, yyyy') : '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs text-text-secondary whitespace-nowrap">
                          {r.sessionName || 'General Session'}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs text-text-muted font-mono whitespace-nowrap">
                          {r.timestamp ? format(new Date(r.timestamp), 'MMM dd, yyyy • hh:mm a') : '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-semibold uppercase whitespace-nowrap">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center">
                        <div className="max-w-sm mx-auto space-y-1.5">
                          <ShieldCheck className="w-9 h-9 text-text-muted mx-auto opacity-30" />
                          <p className="text-text-primary font-medium text-sm">
                            {searchTerm ? 'No matching records found' : 'No attendance records for this student'}
                          </p>
                          <p className="text-text-muted text-xs">
                            {searchTerm
                              ? 'Try searching with a different event name or session.'
                              : 'Select a student from the directory above to view their event attendance history.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
              {/* Right-edge fade gradient — mobile scroll hint */}
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:hidden"
                style={{
                  background: 'linear-gradient(to right, transparent, var(--canvas))',
                }}
              />
            </div>

            {/* Pagination Controls Bar for Student Mode */}
            {filteredStudentRecords.length > 0 && (
              <div className="px-6 py-4 border-t border-separator bg-canvas flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>
                    Showing{' '}
                    <strong className="text-text-primary font-semibold">
                      {(currentPage - 1) * pageSize + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-text-primary font-semibold">
                      {Math.min(currentPage * pageSize, filteredStudentRecords.length)}
                    </strong>{' '}
                    of{' '}
                    <strong className="text-text-primary font-semibold">
                      {filteredStudentRecords.length}
                    </strong>{' '}
                    attended sessions
                  </span>
                  <div className="h-4 w-px bg-separator hidden sm:block" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]">Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-surface-elevated border border-separator text-text-primary text-xs rounded-lg px-2 py-1 outline-none focus:border-accent"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {totalStudentPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-separator text-text-secondary hover:text-text-primary hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft size={15} />
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {getPageNumbers(currentPage, totalStudentPages).map((num, idx) =>
                        typeof num === 'number' ? (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(num)}
                            className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-medium transition-all ${
                              currentPage === num
                                ? 'bg-text-primary text-surface font-semibold shadow-xs'
                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                            }`}
                          >
                            {num}
                          </button>
                        ) : (
                          <span key={idx} className="px-1 text-xs text-text-muted">
                            {num}
                          </span>
                        )
                      )}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalStudentPages, p + 1))}
                      disabled={currentPage === totalStudentPages}
                      className="p-1.5 rounded-lg border border-separator text-text-secondary hover:text-text-primary hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Next Page"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reusable Generate OTP Modal */}
      <GenerateOtpModal isOpen={showOtpModal} onClose={() => setShowOtpModal(false)} />
    </div>
  );
};

export default AttendanceRecordsView;
