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
      csvContent += 'Event,Student Name,Roll No,Email,Department,Session,Verified Timestamp\n';
      recordsData.records.forEach((r: any) => {
        const row = [
          recordsData.event?.title || '',
          r.user?.name || '',
          r.user?.rollNo || '',
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
      csvContent += 'Student,Roll No,Event Title,Event Date,Format,Session,Verified Timestamp\n';
      recordsData.records.forEach((r: any) => {
        const row = [
          recordsData.student?.name || '',
          recordsData.student?.rollNo || '',
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700 py-2">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-3xl font-black text-white tracking-tight">Attendance Intelligence</h2>
          </div>
          <p className="text-slate-400 font-medium text-sm">
            Generate active 6-digit session OTPs and audit verified attendance records by Student or Event.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOtpModal(true)}
            className="stellar-btn px-6 py-3 flex items-center gap-2.5 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
          >
            <KeyRound size={16} />
            <span>Generate Event OTP</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 stellar-glass rounded-3xl border border-white/5">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setFilterMode('event')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filterMode === 'event'
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar size={15} />
            <span>Filter by Event</span>
          </button>

          <button
            onClick={() => setFilterMode('student')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filterMode === 'student'
                ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={15} />
            <span>Filter by Student</span>
          </button>
        </div>

        {/* Export CSV action */}
        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all"
        >
          <Download size={15} className="text-blue-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* --- MODE 1: FILTER BY EVENT --- */}
      {filterMode === 'event' && (
        <div className="space-y-6">
          {/* Event Picker Controls */}
          <div className="stellar-glass p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 justify-between">
              <div className="flex-1 space-y-1.5 max-w-md">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Calendar size={14} className="text-blue-400" /> Select Event
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-blue-500"
                >
                  {events.map((ev) => (
                    <option key={ev._id} value={ev._id}>
                      {ev.title} ({format(new Date(ev.date), 'MMM dd, yyyy')}) — {ev.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Table search filter */}
              <div className="relative flex-1 max-w-sm self-end">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input
                  type="text"
                  placeholder="Filter attendees by name, roll no..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Active OTP Live Display Banner (if event has an active session) */}
            {activeSession && remainingSecs > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <KeyRound size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                        Live Attendance Session Active
                      </p>
                    </div>
                    <h4 className="text-xl font-black text-white">{activeSession.sessionName}</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Expires in: <strong className="text-amber-400">{formatCountdown(remainingSecs)}</strong>
                    </p>
                  </div>
                </div>

                {/* Big OTP Display */}
                <div className="flex items-center gap-3">
                  <div className="bg-black/60 border border-blue-500/40 px-6 py-2.5 rounded-2xl font-mono text-2xl font-black tracking-[0.3em] text-white shadow-inner">
                    {activeSession.otp}
                  </div>
                  <button
                    onClick={copyOtp}
                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                    title="Copy OTP"
                  >
                    {copiedOtp ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                  </button>
                </div>
              </motion.div>
            ) : null}

            {/* Event Summary Pills */}
            {recordsData?.event && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                <span className="px-3 py-1 bg-white/5 rounded-xl text-xs font-bold text-slate-300 border border-white/5">
                  Type: <strong className="text-blue-400">{recordsData.event.type}</strong>
                </span>
                <span className="px-3 py-1 bg-white/5 rounded-xl text-xs font-bold text-slate-300 border border-white/5">
                  Format: <strong className="text-purple-400">{recordsData.event.format}</strong>
                </span>
                <span className="px-3 py-1 bg-white/5 rounded-xl text-xs font-bold text-slate-300 border border-white/5">
                  Status: <strong className="text-emerald-400">{recordsData.event.status}</strong>
                </span>
                <span className="px-3 py-1 bg-blue-500/10 rounded-xl text-xs font-black text-blue-400 border border-blue-500/20">
                  Total Present: <strong>{recordsData.records?.length || 0}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Attendees Table */}
          <div className="stellar-glass rounded-3xl overflow-hidden border border-white/10">
            <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Verified Attendees Registry</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    Timestamped student presence records
                  </p>
                </div>
              </div>
              <span className="text-xs font-black uppercase text-slate-400">
                {recordsData?.records?.length || 0} Students Verified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/[0.02]">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Roll Number</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Session Name</th>
                    <th className="px-6 py-4">Verified Timestamp</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recordsData?.records && recordsData.records.length > 0 ? (
                    recordsData.records.map((r: any) => (
                      <tr key={r._id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                              {r.user?.profilePicUrl ? (
                                <img
                                  src={r.user.profilePicUrl}
                                  alt=""
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                r.user?.name?.charAt(0) || 'U'
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                                {r.user?.name || 'Unknown Student'}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                {r.user?.email || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-300">
                          {r.user?.rollNo || '—'}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-400">
                          {r.user?.department || 'General'}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-300">
                          {r.session?.sessionName || 'General Session'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {r.timestamp ? format(new Date(r.timestamp), 'MMM dd, yyyy • hh:mm a') : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="max-w-sm mx-auto space-y-2">
                          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto opacity-30" />
                          <p className="text-white font-bold text-sm">No attendance records yet</p>
                          <p className="text-slate-500 text-xs">
                            Students will appear here as soon as they submit the 6-digit event OTP.
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
          <div className="stellar-glass p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Users size={14} className="text-purple-400" /> Search & Select Student
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input
                  type="text"
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  placeholder="Type student name, roll number, or department to search..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium"
                />
              </div>
            </div>

            {/* Quick Select Candidates Chips */}
            <div className="flex flex-wrap gap-2 pt-1 max-h-28 overflow-y-auto custom-scrollbar">
              {studentCandidates.map((stu) => (
                <button
                  key={stu._id}
                  onClick={() => setSelectedStudentId(stu._id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 ${
                    selectedStudentId === stu._id
                      ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="font-bold">{stu.name}</span>
                  <span className="text-[10px] opacity-70 font-mono">({stu.rollNo})</span>
                </button>
              ))}
            </div>

            {/* Selected Student Profile Banner */}
            {recordsData?.student && (
              <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-black flex items-center justify-center text-lg">
                    {recordsData.student.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">{recordsData.student.name}</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Roll: <strong className="text-purple-400">{recordsData.student.rollNo}</strong> • Dept:{' '}
                      <strong className="text-slate-200">{recordsData.student.department || 'General'}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <span className="text-2xl font-black text-white">{recordsData.records?.length || 0}</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Sessions Attended
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Student's Attended Events Table */}
          <div className="stellar-glass rounded-3xl overflow-hidden border border-white/10">
            <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Student Attendance Record</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    All verified events & sessions attended by this student
                  </p>
                </div>
              </div>
              <span className="text-xs font-black uppercase text-purple-400">
                {recordsData?.records?.length || 0} Verified Sessions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/[0.02]">
                    <th className="px-6 py-4">Event Title</th>
                    <th className="px-6 py-4">Type & Format</th>
                    <th className="px-6 py-4">Event Date</th>
                    <th className="px-6 py-4">Session Name</th>
                    <th className="px-6 py-4">Verified Timestamp</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recordsData?.records && recordsData.records.length > 0 ? (
                    recordsData.records.map((r: any) => (
                      <tr key={r._id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 font-bold text-white group-hover:text-purple-400 transition-colors">
                          {r.event?.title || 'Event Session'}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-400">
                          <span className="text-blue-400 font-bold">{r.event?.type || 'Technical'}</span> •{' '}
                          <span className="text-purple-400 font-bold">{r.event?.format || 'Individual'}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-300">
                          {r.event?.date ? format(new Date(r.event.date), 'MMM dd, yyyy') : '—'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-300 font-medium">
                          {r.sessionName || 'General Session'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {r.timestamp ? format(new Date(r.timestamp), 'MMM dd, yyyy • hh:mm a') : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="max-w-sm mx-auto space-y-2">
                          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto opacity-30" />
                          <p className="text-white font-bold text-sm">No attendance records for this student</p>
                          <p className="text-slate-500 text-xs">
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
