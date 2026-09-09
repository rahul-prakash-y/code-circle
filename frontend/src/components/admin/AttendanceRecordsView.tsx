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

const AttendanceRecordsView: React.FC = () => {
  const { recordsData, activeSession, fetchAttendanceRecords, fetchActiveSession, loading } =
    useAttendanceStore();
  const { events, fetchEvents } = useEventStore();
  const { users, fetchUsers } = useUserStore();

  // Mode: 'event' or 'student'
  const [filterMode, setFilterMode] = useState<'event' | 'student'>('event');

  // Selected filters
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  const [tableSearch, setTableSearch] = useState<string>('');

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

  // Fetch records whenever selection changes
  useEffect(() => {
    if (filterMode === 'event' && selectedEventId) {
      fetchAttendanceRecords({ eventId: selectedEventId, search: tableSearch });
      fetchActiveSession(selectedEventId);
    } else if (filterMode === 'student' && selectedStudentId) {
      fetchAttendanceRecords({ studentId: selectedStudentId, search: tableSearch });
    }
  }, [filterMode, selectedEventId, selectedStudentId, tableSearch, fetchAttendanceRecords, fetchActiveSession]);

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

  // Export Attendance CSV
  const handleExportCsv = () => {
    if (!recordsData || !recordsData.records || recordsData.records.length === 0) {
      return toast.error('No attendance records to export');
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    if (filterMode === 'event') {
      csvContent += 'Event,Student Name,Roll No,College,Year,Email,Department,Session,Verified Timestamp\n';
      recordsData.records.forEach((r: any) => {
        const row = [
          recordsData.event?.title || '',
          r.user?.name || '',
          r.user?.rollNo || '',
          getStudentCollege(r.user),
          getStudentYear(r.user),
          r.user?.email || '',
          r.user?.department || '',
          r.session?.sessionName || '',
          r.timestamp ? new Date(r.timestamp).toISOString() : '',
        ]
          .map((v) => `"${v}"`)
          .join(',');
        csvContent += row + '\n';
      });
    } else {
      csvContent += 'Student,Roll No,College,Year,Event Title,Event Date,Format,Session,Verified Timestamp\n';
      recordsData.records.forEach((r: any) => {
        const row = [
          recordsData.student?.name || '',
          recordsData.student?.rollNo || '',
          getStudentCollege(recordsData.student),
          getStudentYear(recordsData.student),
          r.event?.title || '',
          r.event?.date ? new Date(r.event.date).toISOString().slice(0, 10) : '',
          r.event?.format || '',
          r.sessionName || '',
          r.timestamp ? new Date(r.timestamp).toISOString() : '',
        ]
          .map((v) => `"${v}"`)
          .join(',');
        csvContent += row + '\n';
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `attendance_${filterMode}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance CSV downloaded');
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
    <div className="space-y-6 py-2 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Attendance</h2>
          <p className="text-sm text-text-muted mt-0.5">
            Issue 6-digit session OTPs and audit verified attendance records by event or student.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOtpModal(true)}
            className="btn-primary py-2.5 px-5 flex items-center gap-2 text-xs font-semibold cursor-pointer"
          >
            <KeyRound size={15} />
            <span>Generate Session OTP</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 surface rounded-2xl border border-separator shadow-card">
        <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-separator">
          <button
            onClick={() => setFilterMode('event')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterMode === 'event'
                ? 'bg-text-primary text-surface font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Calendar size={14} />
            <span>Filter by Event</span>
          </button>

          <button
            onClick={() => setFilterMode('student')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterMode === 'student'
                ? 'bg-text-primary text-surface font-semibold shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Users size={14} />
            <span>Filter by Student</span>
          </button>
        </div>

        {/* Export CSV action */}
        <button
          onClick={handleExportCsv}
          className="btn-secondary py-2 px-4 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download size={14} />
          <span>Export CSV</span>
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
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
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
                <span>Total Present: <strong className="text-text-primary font-semibold">{recordsData.records?.length || 0}</strong></span>
              </div>
            )}
          </div>

          {/* Attendees Table */}
          <div className="surface rounded-[18px] overflow-hidden border border-separator shadow-card">
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
                {recordsData?.records?.length || 0} verified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-separator text-[11px] font-medium text-text-muted bg-canvas">
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Roll Number</th>
                    <th className="px-6 py-3.5">College</th>
                    <th className="px-6 py-3.5">Year</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Session</th>
                    <th className="px-6 py-3.5">Verified At</th>
                    <th className="px-6 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {recordsData?.records && recordsData.records.length > 0 ? (
                    recordsData.records.map((r: any) => (
                      <tr key={r._id} className="hover:bg-surface-elevated transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-surface-elevated border border-separator flex items-center justify-center text-xs font-semibold text-text-primary">
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
                            <div>
                              <p className="text-xs font-semibold text-text-primary">
                                {r.user?.name || 'Unknown Student'}
                              </p>
                              <p className="text-[11px] text-text-muted truncate max-w-[150px]">
                                {r.user?.email || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-xs font-mono text-text-secondary">
                          {r.user?.rollNo || '—'}
                        </td>
                        <td className="px-6 py-3.5 text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent font-bold text-[11px] border border-accent/20">
                            {getStudentCollege(r.user)}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-xs font-semibold text-text-primary">
                          {getStudentYear(r.user)}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-text-muted">
                          {r.user?.department || 'General'}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-text-secondary">
                          {r.session?.sessionName || 'General Session'}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-text-muted font-mono">
                          {r.timestamp ? format(new Date(r.timestamp), 'MMM dd, yyyy • hh:mm a') : '—'}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-semibold uppercase">
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
                          <p className="text-text-primary font-medium text-sm">No attendance records yet</p>
                          <p className="text-text-muted text-xs">
                            Students will appear here as soon as they submit the 6-digit session OTP.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                  <span className="text-xl font-bold text-text-primary">{recordsData.records?.length || 0}</span>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">
                    Sessions Attended
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Student's Attended Events Table */}
          <div className="surface rounded-[18px] overflow-hidden border border-separator shadow-card">
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
                {recordsData?.records?.length || 0} verified sessions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-separator text-[11px] font-medium text-text-muted bg-canvas">
                    <th className="px-6 py-3.5">Event Title</th>
                    <th className="px-6 py-3.5">Type & Format</th>
                    <th className="px-6 py-3.5">Event Date</th>
                    <th className="px-6 py-3.5">Session Name</th>
                    <th className="px-6 py-3.5">Verified At</th>
                    <th className="px-6 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {recordsData?.records && recordsData.records.length > 0 ? (
                    recordsData.records.map((r: any) => (
                      <tr key={r._id} className="hover:bg-surface-elevated transition-colors">
                        <td className="px-6 py-3.5 font-semibold text-text-primary text-xs">
                          {r.event?.title || 'Event Session'}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-text-muted">
                          <span>{r.event?.type || 'Technical'}</span> •{' '}
                          <span>{r.event?.format || 'Individual'}</span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-text-secondary">
                          {r.event?.date ? format(new Date(r.event.date), 'MMM dd, yyyy') : '—'}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-text-secondary">
                          {r.sessionName || 'General Session'}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-text-muted font-mono">
                          {r.timestamp ? format(new Date(r.timestamp), 'MMM dd, yyyy • hh:mm a') : '—'}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-semibold uppercase">
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
                          <p className="text-text-primary font-medium text-sm">No attendance records for this student</p>
                          <p className="text-text-muted text-xs">
                            Select a student from the directory above to view their event attendance history.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Generate OTP Modal */}
      <GenerateOtpModal isOpen={showOtpModal} onClose={() => setShowOtpModal(false)} />
    </div>
  );
};

export default AttendanceRecordsView;
