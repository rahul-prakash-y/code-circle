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
  Trash2,
  UserPlus,
  Award,
} from 'lucide-react';
import useAttendanceStore from '../../store/useAttendanceStore';
import useEventStore from '../../store/useEventStore';
import useUserStore from '../../store/useUserStore';
import GenerateOtpModal from './GenerateOtpModal';
import ManualAttendanceModal from './ManualAttendanceModal';
import { format } from 'date-fns';
import { formatISTDateTime } from '../../lib/dateUtils';
import toast from 'react-hot-toast';
import { getStudentCollege, getStudentYear } from '../../utils/studentUtils';
import { HeroUISelect } from '@/components/ui/HeroUISelect';
import { HeroChip as Chip } from '@/components/ui/hero/HeroChip';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../lib/axios';

const formatSafeDate = (d: any, fmt: string = 'MMM dd, yyyy') => {
  if (!d) return '—';
  try {
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '—';
    return format(dateObj, fmt);
  } catch {
    return '—';
  }
};

const AttendanceRecordsView: React.FC = () => {
  const {
    recordsData,
    activeSession,
    fetchAttendanceRecords,
    fetchAllAttendanceRecords,
    fetchActiveSession,
    deleteAttendanceRecord,
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
  const debouncedStudentSearch = useDebounce<string>(studentSearchTerm, 350);

  // Student directory search states
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState<boolean>(false);

  // Table search with debouncing for Event mode
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedSearch = useDebounce<string>(searchTerm, 400);

  // Table search with debouncing for Student mode
  const [studentRecordsSearch, setStudentRecordsSearch] = useState<string>('');
  const debouncedStudentRecordsSearch = useDebounce<string>(studentRecordsSearch, 400);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);

  // Modals & Active Session state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [remainingSecs, setRemainingSecs] = useState<number>(0);

  // Mode switcher
  const handleModeChange = (mode: 'event' | 'student') => {
    setFilterMode(mode);
    setCurrentPage(1);
    if (mode === 'student' && studentsList.length > 0 && !selectedStudentId) {
      setSelectedStudentId(studentsList[0]._id || studentsList[0].id);
    }
  };

  // Helper to re-fetch attendance records
  const refreshRecords = () => {
    if (filterMode === 'event' && selectedEventId) {
      fetchAttendanceRecords({
        eventId: selectedEventId,
        search: debouncedSearch,
        page: currentPage,
        limit: pageSize,
      });
      fetchActiveSession(selectedEventId);
    } else if (filterMode === 'student' && selectedStudentId) {
      fetchAttendanceRecords({
        studentId: selectedStudentId,
        search: debouncedStudentRecordsSearch,
        page: currentPage,
        limit: pageSize,
      });
    }
  };

  const handleDeleteRecord = async (recordId: string, studentName?: string) => {
    if (!window.confirm(`Are you sure you want to remove attendance for ${studentName || 'this student'}?`)) {
      return;
    }

    setDeletingRecordId(recordId);
    try {
      const ok = await deleteAttendanceRecord(recordId);
      if (ok) {
        refreshRecords();
      }
    } finally {
      setDeletingRecordId(null);
    }
  };

  // Load initial events & users
  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, [fetchEvents, fetchUsers]);

  // Live debounced search & initial load for students directory
  useEffect(() => {
    let isCancelled = false;
    const fetchStudents = async () => {
      setIsSearchingStudents(true);
      try {
        const query = debouncedStudentSearch.trim();
        const url = query
          ? `/users?search=${encodeURIComponent(query)}&limit=40`
          : `/users?role=student&limit=50`;
        const res = await api.get(url);
        const fetched = res.data?.data?.users || res.data?.users || [];
        if (!isCancelled) {
          if (!query && fetched.length === 0) {
            const fallbackRes = await api.get('/users?limit=50');
            setStudentsList(fallbackRes.data?.data?.users || fallbackRes.data?.users || []);
          } else {
            setStudentsList(fetched);
          }
        }
      } catch (err) {
        console.error('Failed to load students directory:', err);
      } finally {
        if (!isCancelled) {
          setIsSearchingStudents(false);
        }
      }
    };

    fetchStudents();
    return () => {
      isCancelled = true;
    };
  }, [debouncedStudentSearch]);

  // Default select first event if available
  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0]._id);
    }
  }, [events, selectedEventId]);

  // Default select first student if available and in student mode
  useEffect(() => {
    if (filterMode === 'student' && studentsList.length > 0 && !selectedStudentId) {
      setSelectedStudentId(studentsList[0]._id || studentsList[0].id);
    }
  }, [filterMode, studentsList, selectedStudentId]);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode, selectedEventId, selectedStudentId, debouncedSearch, debouncedStudentRecordsSearch, pageSize]);

  // Fetch records whenever selection, search, page or pageSize changes
  useEffect(() => {
    if (filterMode === 'event' && selectedEventId) {
      fetchAttendanceRecords({
        eventId: selectedEventId,
        search: debouncedSearch,
        page: currentPage,
        limit: pageSize,
      });
      fetchActiveSession(selectedEventId);
    } else if (filterMode === 'student' && selectedStudentId) {
      fetchAttendanceRecords({
        studentId: selectedStudentId,
        search: debouncedStudentRecordsSearch,
        page: currentPage,
        limit: pageSize,
      });
    }
  }, [
    filterMode,
    selectedEventId,
    selectedStudentId,
    debouncedSearch,
    debouncedStudentRecordsSearch,
    currentPage,
    pageSize,
    fetchAttendanceRecords,
    fetchActiveSession,
  ]);

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
    return `${mins}m ${remainder < 10 ? '0' : ''}${remainder}`;
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

  // Event mode records & total counts (from backend pagination)
  const isEventMode = recordsData?.mode === 'event';
  const eventRecords = useMemo(() => (isEventMode ? recordsData?.records || [] : []), [recordsData, isEventMode]);
  const totalEventRecords = isEventMode ? (recordsData?.pagination?.total ?? recordsData?.total ?? 0) : 0;
  const totalEventPages = isEventMode
    ? (recordsData?.pagination?.totalPages ?? recordsData?.totalPages ?? Math.max(1, Math.ceil(totalEventRecords / pageSize)))
    : 1;

  // Student mode records & total counts (from backend pagination)
  const isStudentMode = recordsData?.mode === 'student';
  const studentRecords = useMemo(() => (isStudentMode ? recordsData?.records || [] : []), [recordsData, isStudentMode]);
  const totalStudentRecords = isStudentMode ? (recordsData?.pagination?.total ?? recordsData?.total ?? 0) : 0;
  const totalStudentPages = isStudentMode
    ? (recordsData?.pagination?.totalPages ?? recordsData?.totalPages ?? Math.max(1, Math.ceil(totalStudentRecords / pageSize)))
    : 1;

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
        recordsToExport = allData?.records || eventRecords;
        if (allData?.event?.title) currentEventTitle = allData.event.title;
      } else {
        if (!selectedStudentId) {
          toast.error('Please select a student to export attendance');
          setIsExportingCsv(false);
          return;
        }

        // Fetch ALL attendance records for this student from backend
        const allData = await fetchAllAttendanceRecords({ studentId: selectedStudentId });
        recordsToExport = allData?.records || studentRecords;
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
            ? formatISTDateTime(r.timestamp, { showSeconds: true })
            : '';
          const row = [
            currentEventTitle,
            recordsData?.event?.date ? formatSafeDate(recordsData.event.date, 'yyyy-MM-dd') : '',
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
            ? formatISTDateTime(r.timestamp, { showSeconds: true })
            : '';
          const eventDateVal = r.event?.date || r.event?.startDate;
          const formattedEventDate = formatSafeDate(eventDateVal, 'yyyy-MM-dd');
          const row = [
            currentStudentName,
            recordsData?.student?.rollNo || '',
            getStudentCollege(recordsData?.student),
            getStudentYear(recordsData?.student),
            recordsData?.student?.email || '',
            recordsData?.student?.department || '',
            r.event?.title || r.sessionName || 'General Session',
            formattedEventDate === '—' ? '' : formattedEventDate,
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

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowManualModal(true)}
            className="btn-secondary flex items-center gap-2 text-xs font-semibold cursor-pointer"
            style={{ minHeight: 44 }}
            title="Mark attendance manually for a student without requiring OTP"
          >
            <UserCheck size={15} className="text-accent" />
            <span>Manual Attendance</span>
          </button>

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
            onClick={() => handleModeChange('event')}
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
            onClick={() => handleModeChange('student')}
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
                <HeroUISelect
                  value={selectedEventId}
                  onChange={setSelectedEventId}
                  options={events.map((ev: any) => ({
                    value: ev._id,
                    label: `${ev.title} (${formatSafeDate(ev.date || ev.startDate, 'MMM dd, yyyy')}) — ${ev.type}`,
                  }))}
                  size="sm"
                  isSearchable
                  placeholder="Select an event..."
                />
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
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-xs text-text-muted font-mono">
                        Expires in: <strong className="text-text-primary">{formatCountdown(remainingSecs)}</strong>
                      </p>
                      {activeSession.classHours && activeSession.classHours.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent font-semibold text-[10.5px] border border-accent/20">
                          {activeSession.classHours.length} Period{activeSession.classHours.length > 1 ? 's' : ''} (Hrs {activeSession.classHours.join(', ')})
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-bold font-mono text-[10.5px] border border-amber-500/20">
                        +{activeSession.totalPoints || ((activeSession.hourlyPoints || 50) * (activeSession.classHours?.length || 1))} Leaderboard Pts
                      </span>
                    </div>
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
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-separator text-xs text-text-muted">
                <div className="flex flex-wrap items-center gap-3">
                  <span>Type: <strong className="text-text-primary font-medium">{recordsData.event.type}</strong></span>
                  <span>•</span>
                  <span>Format: <strong className="text-text-primary font-medium">{recordsData.event.format}</strong></span>
                  <span>•</span>
                  <span>Status: <strong className="text-text-primary font-medium">{recordsData.event.status}</strong></span>
                  <span>•</span>
                  <span>Total Present: <strong className="text-text-primary font-semibold">{totalEventRecords}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualModal(true)}
                  className="text-xs font-semibold text-accent hover:underline flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <UserPlus size={13} />
                  <span>+ Mark Student Attendance</span>
                </button>
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
                {totalEventRecords} verified
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
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Session & Hours</th>
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Points Awarded</th>
                    <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Verified At</th>
                    <th className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {eventRecords.length > 0 ? (
                    eventRecords.map((r: any) => (
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
                          <div className="flex flex-col">
                            <span className="font-semibold text-text-primary">{r.session?.sessionName || 'General Session'}</span>
                            {r.session?.classHours && r.session.classHours.length > 0 && (
                              <span className="text-[10px] text-accent font-mono">
                                Hours {r.session.classHours.join(', ')} ({r.session.classHours.length} hr{r.session.classHours.length > 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs whitespace-nowrap">
                          <Chip
                            size="sm"
                            color="warning"
                            variant="flat"
                            startContent={<Award size={11} className="text-amber-400" />}
                            className="font-mono font-bold"
                          >
                            +{r.pointsAwarded ?? r.session?.totalPoints ?? 0} pts
                          </Chip>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs text-text-muted font-mono whitespace-nowrap">
                          {r.timestamp ? formatISTDateTime(r.timestamp) : '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <Chip size="sm" color="success" variant="flat" className="text-[10px] font-semibold uppercase">
                              Verified
                            </Chip>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(r._id, r.user?.name)}
                              disabled={deletingRecordId === r._id}
                              className="p-1 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-40"
                              title="Delete this attendance record"
                            >
                              {deletingRecordId === r._id ? (
                                <RefreshCw size={12} className="animate-spin text-red-500" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-14 text-center">
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
            {totalEventRecords > 0 && (
              <div className="px-6 py-4 border-t border-separator bg-canvas flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>
                    Showing{' '}
                    <strong className="text-text-primary font-semibold">
                      {totalEventRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-text-primary font-semibold">
                      {Math.min(currentPage * pageSize, totalEventRecords)}
                    </strong>{' '}
                    of{' '}
                    <strong className="text-text-primary font-semibold">
                      {totalEventRecords}
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
                      <option value={250}>250</option>
                      <option value={500}>All (500)</option>
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
          <div className="surface p-6 rounded-[18px] border border-separator shadow-card space-y-5">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 justify-between">
              {/* Dropdown Selector */}
              <div className="flex-1 space-y-1.5 max-w-md">
                <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                  <Users size={13} className="text-text-muted" /> Select Student
                </label>
                <HeroUISelect
                  value={selectedStudentId}
                  onChange={setSelectedStudentId}
                  options={studentsList.map((stu: any) => {
                    const stuId = stu._id || stu.id;
                    return {
                      value: stuId,
                      label: `${stu.name} ${stu.rollNo ? `(${stu.rollNo})` : ''} — ${stu.department || 'General'}`,
                    };
                  })}
                  size="sm"
                  isSearchable
                  placeholder="Select a student from directory..."
                />
              </div>

              {/* Student Directory Live Search Input */}
              <div className="relative flex-1 max-w-sm self-end">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                <input
                  type="text"
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  placeholder="Search student by name, roll no, dept..."
                  className="input-field pl-9 pr-8 text-xs"
                />
                {isSearchingStudents && (
                  <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 text-accent animate-spin" size={13} />
                )}
              </div>
            </div>

            {/* Quick Select Candidates Chips */}
            {studentsList.length > 0 ? (
              <div className="space-y-1.5 pt-1 border-t border-separator">
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span>Directory Students ({studentsList.length} candidate{studentsList.length > 1 ? 's' : ''}):</span>
                  {studentSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setStudentSearchTerm('')}
                      className="text-[10px] text-accent hover:underline cursor-pointer"
                    >
                      Clear search
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto custom-scrollbar pt-0.5">
                  {studentsList.slice(0, 16).map((stu: any) => {
                    const stuId = stu._id || stu.id;
                    const isSelected = selectedStudentId === stuId;
                    return (
                      <button
                        key={stuId}
                        onClick={() => setSelectedStudentId(stuId)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-text-primary text-surface border-text-primary shadow-xs font-semibold'
                            : 'bg-canvas text-text-secondary border-separator hover:bg-surface-elevated hover:text-text-primary'
                        }`}
                      >
                        <span>{stu.name}</span>
                        {stu.rollNo && (
                          <span className="text-[10px] opacity-70 font-mono">({stu.rollNo})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : isSearchingStudents ? (
              <div className="pt-2 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                <RefreshCw size={13} className="animate-spin text-accent" />
                <span>Searching student directory...</span>
              </div>
            ) : studentSearchTerm ? (
              <p className="pt-1 text-xs text-text-muted italic">
                No students found matching &quot;{studentSearchTerm}&quot;. Try roll number or another spelling.
              </p>
            ) : null}

            {/* Selected Student Profile Banner */}
            {recordsData?.student && isStudentMode ? (
              <div className="p-4 rounded-xl bg-canvas border border-separator flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-elevated text-text-primary font-bold flex items-center justify-center border border-separator text-sm">
                    {recordsData.student.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary">{recordsData.student.name}</h4>
                    <p className="text-xs text-text-muted font-mono flex items-center gap-2 flex-wrap mt-0.5">
                      <span>Roll: <strong className="text-text-primary">{recordsData.student.rollNo || '—'}</strong></span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                        {getStudentCollege(recordsData.student)}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-surface border border-separator text-text-primary">
                        {getStudentYear(recordsData.student)}
                      </span>
                      <span>•</span>
                      <span>Dept: <strong className="text-text-secondary">{recordsData.student.department || 'General'}</strong></span>
                      {recordsData.student.email && (
                        <>
                          <span>•</span>
                          <span className="text-text-muted">{recordsData.student.email}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <span className="text-xl font-bold text-text-primary">{totalStudentRecords}</span>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    Sessions Attended
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Student's Attended Events Table */}
          <div className="surface rounded-[18px] border border-separator shadow-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-separator flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-separator text-text-secondary flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Student Attendance Record</h3>
                  <p className="text-xs text-text-muted">
                    {recordsData?.student?.name
                      ? `All verified events attended by ${recordsData.student.name}`
                      : 'All verified events attended by this student'}
                  </p>
                </div>
              </div>

              {/* Table search filter for attended events/sessions */}
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
                  <input
                    type="text"
                    placeholder="Filter events or sessions..."
                    value={studentRecordsSearch}
                    onChange={(e) => setStudentRecordsSearch(e.target.value)}
                    className="input-field pl-9 text-xs py-1.5"
                  />
                </div>
                <span className="text-xs font-mono text-text-muted whitespace-nowrap hidden sm:inline">
                  {totalStudentRecords} verified
                </span>
              </div>
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
                      <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Session & Hours</th>
                      <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Points</th>
                      <th className="px-4 sm:px-6 py-3.5 whitespace-nowrap">Verified At</th>
                      <th className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-separator">
                  {studentRecords.length > 0 ? (
                    studentRecords.map((r: any) => (
                      <tr key={r._id} className="hover:bg-surface-elevated transition-colors">
                        <td className="px-4 sm:px-6 py-3.5 font-semibold text-text-primary text-xs whitespace-nowrap">
                          {r.event?.title || r.sessionName || 'Event Session'}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs text-text-muted whitespace-nowrap">
                          <span>{r.event?.type || 'Technical'}</span> •{' '}
                          <span>{r.event?.format || 'Individual'}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs text-text-secondary whitespace-nowrap">
                          {formatSafeDate(r.event?.date || r.event?.startDate || r.timestamp)}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs text-text-secondary whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-text-primary">{r.sessionName || 'General Session'}</span>
                            {r.classHours && r.classHours.length > 0 && (
                              <span className="text-[10px] text-accent font-mono">
                                Hours {r.classHours.join(', ')} ({r.classHours.length} hr{r.classHours.length > 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs whitespace-nowrap">
                          <Chip
                            size="sm"
                            color="warning"
                            variant="flat"
                            startContent={<Award size={11} className="text-amber-400" />}
                            className="font-mono font-bold"
                          >
                            +{r.pointsAwarded || 0} pts
                          </Chip>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-xs text-text-muted font-mono whitespace-nowrap">
                          {r.timestamp ? formatISTDateTime(r.timestamp) : '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <Chip size="sm" color="success" variant="flat" className="text-[10px] font-semibold uppercase">
                              Verified
                            </Chip>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(r._id, recordsData?.student?.name)}
                              disabled={deletingRecordId === r._id}
                              className="p-1 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-40"
                              title="Delete this attendance record"
                            >
                              {deletingRecordId === r._id ? (
                                <RefreshCw size={12} className="animate-spin text-red-500" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-14 text-center">
                        <div className="max-w-sm mx-auto space-y-1.5">
                          <ShieldCheck className="w-9 h-9 text-text-muted mx-auto opacity-30" />
                          <p className="text-text-primary font-medium text-sm">
                            {studentRecordsSearch
                              ? 'No matching records found'
                              : !selectedStudentId
                              ? 'No student selected'
                              : 'No attendance records for this student'}
                          </p>
                          <p className="text-text-muted text-xs">
                            {studentRecordsSearch
                              ? 'Try searching with a different event name or session.'
                              : !selectedStudentId
                              ? 'Select a student from the directory above to view their event attendance history.'
                              : 'This student has not yet verified attendance for any sessions.'}
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
            {totalStudentRecords > 0 && (
              <div className="px-6 py-4 border-t border-separator bg-canvas flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>
                    Showing{' '}
                    <strong className="text-text-primary font-semibold">
                      {totalStudentRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-text-primary font-semibold">
                      {Math.min(currentPage * pageSize, totalStudentRecords)}
                    </strong>{' '}
                    of{' '}
                    <strong className="text-text-primary font-semibold">
                      {totalStudentRecords}
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
                      <option value={250}>250</option>
                      <option value={500}>All (500)</option>
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

      {/* Manual Attendance Entry Modal */}
      <ManualAttendanceModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        initialEventId={selectedEventId}
        onSuccess={refreshRecords}
      />
    </div>
  );
};

export default AttendanceRecordsView;
