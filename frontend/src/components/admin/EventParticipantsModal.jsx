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
  Award,
  Sliders,
  Sparkles,
  ClipboardList,
  AlertCircle,
  BadgeCheck,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

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
  initialTab = 'participants',
}) => {
  const { fetchEventEnrollments, generateCertificates, loading } = useEnrollmentStore();
  const [activeTab, setActiveTab] = useState(initialTab || 'participants');
  const [enrollments, setEnrollments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [formatFilter, setFormatFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  const [generatingCertificates, setGeneratingCertificates] = useState(false);

  // Sync activeTab whenever initialTab changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'participants');
      setSearchQuery('');
      setFormatFilter('all');
      setAttendanceFilter('all');
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen && event?._id) {
      const load = async () => {
        try {
          const data = await fetchEventEnrollments(event._id);
          setEnrollments(data || []);
        } catch {
          toast.error('Failed to load event registrations');
        }
      };
      load();
    }
  }, [isOpen, event?._id, fetchEventEnrollments]);

  // Compute metrics for both rosters
  const stats = useMemo(() => {
    let totalRegistrations = enrollments.length;
    let totalStudents = 0;
    let presentStudents = 0;
    let presentRegistrations = 0;
    let duoCount = 0;
    let teamCount = 0;
    let soloCount = 0;

    let presentSolo = 0;
    let presentDuo = 0;
    let presentTeam = 0;

    enrollments.forEach((e) => {
      const memberCount = (e.members?.length || 0) + 1;
      totalStudents += memberCount;

      if (e.attendanceStatus) {
        presentStudents += memberCount;
        presentRegistrations += 1;
        if (e.type === 'Duo') presentDuo++;
        else if (e.type === 'Team') presentTeam++;
        else presentSolo++;
      }

      if (e.type === 'Duo') duoCount++;
      else if (e.type === 'Team') teamCount++;
      else soloCount++;
    });

    return {
      totalRegistrations,
      totalStudents,
      presentStudents,
      presentRegistrations,
      absentStudents: Math.max(0, totalStudents - presentStudents),
      turnoutRate: totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0,
      duoCount,
      teamCount,
      soloCount,
      presentSolo,
      presentDuo,
      presentTeam,
    };
  }, [enrollments]);

  // Filter logic separating Participants (attended) and Registered (all)
  const filteredList = useMemo(() => {
    return enrollments.filter((e) => {
      // If we are on Participants tab, ONLY show students who marked attendance
      if (activeTab === 'participants' && !e.attendanceStatus) {
        return false;
      }

      const q = debouncedSearch.toLowerCase().trim();

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

      // Attendance filter only applies when viewing Registered tab
      let matchesAttendance = true;
      if (activeTab === 'registered') {
        matchesAttendance =
          attendanceFilter === 'all' ||
          (attendanceFilter === 'present' && e.attendanceStatus) ||
          (attendanceFilter === 'absent' && !e.attendanceStatus);
      }

      return matchesSearch && matchesFormat && matchesAttendance;
    });
  }, [enrollments, activeTab, debouncedSearch, formatFilter, attendanceFilter]);

  const toggleExpand = (id) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerateCertificates = async () => {
    if (!event?._id) return;
    if (!event.certificateTemplateUrl) {
      return toast.error('No certificate template uploaded for this event! Please upload a certificate template before generating certificates.');
    }
    if (stats.presentStudents === 0) {
      return toast.error('No participants have marked attendance yet. Validate attendance before generating certificates.');
    }
    setGeneratingCertificates(true);
    try {
      const res = await generateCertificates(event._id);
      toast.success(res.message || 'Certificates generated successfully for attended participants!');
      const data = await fetchEventEnrollments(event._id);
      setEnrollments(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to generate certificates');
    } finally {
      setGeneratingCertificates(false);
    }
  };

  const exportCSV = () => {
    const listToExport =
      activeTab === 'participants'
        ? enrollments.filter((e) => e.attendanceStatus)
        : enrollments;

    if (!listToExport.length) {
      toast.error(
        activeTab === 'participants'
          ? 'No verified participants to export'
          : 'No registered students to export'
      );
      return;
    }

    const customFieldCols = event?.customFields || [];
    const customHeaders = customFieldCols.map((cf) => `"${(cf.label || 'Custom Field').replace(/"/g, '""')}"`);

    const headers = [
      'Event Title',
      'List Category',
      'Registration Type',
      'Attendee Classification',
      'Team Name',
      'Member Role',
      'Student Name',
      'Roll Number',
      'Email',
      'Department',
      'Year',
      'College',
      'Attendance Verified',
      'Enrolled At',
      ...customHeaders,
    ];

    const rows = [];

    listToExport.forEach((e) => {
      const enrolledAt = e.createdAt ? format(new Date(e.createdAt), 'yyyy-MM-dd HH:mm') : '';
      const attendance = e.attendanceStatus ? 'Present (Verified)' : 'Absent / Unmarked';
      const type = e.type || (e.members?.length ? 'Team' : 'Individual');
      const categoryLabel = activeTab === 'participants' ? 'Event Participant (Attended)' : 'Registered Student';
      const classification = e.isWalkIn ? 'Walk-in Attendance' : 'Pre-registered';

      // Lead student
      const leadCollege = getStudentCollege(e.enrolledBy);
      const leadYear = getStudentYear(e.enrolledBy);

      const customValues = customFieldCols.map((cf) => {
        const val = e.customResponses?.[cf.id || cf.label] ?? e.customResponses?.[cf.label] ?? '';
        const displayVal = typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val);
        return `"${displayVal.replace(/"/g, '""')}"`;
      });

      rows.push([
        `"${event.title.replace(/"/g, '""')}"`,
        `"${categoryLabel}"`,
        `"${type}"`,
        `"${classification}"`,
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
        ...customValues,
      ]);

      // Team members
      if (e.members && e.members.length > 0) {
        e.members.forEach((m) => {
          const memberCollege = getStudentCollege(m);
          const memberYear = getStudentYear(m);

          rows.push([
            `"${event.title.replace(/"/g, '""')}"`,
            `"${categoryLabel}"`,
            `"${type}"`,
            `"${classification}"`,
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
            ...customValues,
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
    const safeTitle = (event.title || 'event').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename =
      activeTab === 'participants'
        ? `${safeTitle}_event_participants_attended.csv`
        : `${safeTitle}_registered_students_roster.csv`;

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(
      activeTab === 'participants'
        ? 'Event participants CSV exported successfully!'
        : 'Registered students CSV exported successfully!'
    );
  };

  if (!isOpen || !event) return null;

  const isParticipantsTab = activeTab === 'participants';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-6xl my-auto bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col h-[90vh] max-h-[90vh]"
      >
        {/* ================================================================= */}
        {/* MODAL HEADER                                                      */}
        {/* ================================================================= */}
        <div className="p-5 sm:p-6 border-b border-separator dark:border-white/10 bg-canvas/40 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-all ${
                isParticipantsTab
                  ? 'bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-green-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-purple-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
              }`}
            >
              {isParticipantsTab ? <UserCheck size={24} /> : <Users size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-label-primary dark:text-[#F5F5F7] tracking-tight font-heading">
                  {isParticipantsTab ? 'Event Participants Directory' : 'Registered Students Directory'}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                    isParticipantsTab
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
                      : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25'
                  }`}
                >
                  {isParticipantsTab
                    ? `${stats.presentStudents} Attended`
                    : `${stats.totalStudents} Registered`}
                </span>
              </div>
              <p className="text-xs text-label-secondary dark:text-[#86868B] font-medium mt-0.5 truncate max-w-xl">
                {isParticipantsTab
                  ? 'Registered students who completed attendance for '
                  : 'Complete student & team registration roster for '}
                <strong className="text-label-primary dark:text-white font-semibold">{event.title}</strong>
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {isParticipantsTab && (
              <>
                {event.certificateTemplateUrl ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                    <Award size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Template Ready</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                    <Award size={14} className="text-amber-600 dark:text-amber-400" />
                    <span>Template Missing</span>
                  </span>
                )}

                <button
                  onClick={handleGenerateCertificates}
                  disabled={generatingCertificates || stats.presentStudents === 0}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20 py-2 px-3.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                  title="Generate Certificates for Attended Participants"
                >
                  {generatingCertificates ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Award size={14} />
                  )}
                  <span>Generate Certificates</span>
                </button>
              </>
            )}

            <button
              onClick={exportCSV}
              className="py-2 px-3.5 rounded-xl text-xs font-semibold text-label-secondary dark:text-[#86868B] hover:text-label-primary bg-canvas dark:bg-[#1C1C1E] border border-separator dark:border-white/10 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              title={isParticipantsTab ? 'Download Participants CSV' : 'Download Registered Students CSV'}
            >
              <Download size={14} />
              <span>{isParticipantsTab ? 'Export Participants CSV' : 'Export Registered CSV'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-label-secondary hover:text-label-primary hover:bg-canvas dark:hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-separator shrink-0"
              title="Close Modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SEGMENTED TAB SWITCHER & CLARITY BANNER                           */}
        {/* ================================================================= */}
        <div className="px-5 sm:px-6 pt-3.5 pb-3 border-b border-separator dark:border-white/10 bg-canvas/30 dark:bg-white/[0.01] flex flex-col gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Apple-style floating Segmented Toggle */}
            <div className="inline-flex p-1 bg-surface-secondary dark:bg-[#1C1C1E] border border-separator dark:border-white/10 rounded-2xl w-full sm:w-auto max-w-lg">
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 sm:px-5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isParticipantsTab
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                    : 'text-label-secondary dark:text-[#86868B] hover:text-label-primary hover:bg-canvas/60 dark:hover:bg-white/5'
                }`}
              >
                <UserCheck size={15} />
                <span>Event Participants</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isParticipantsTab
                      ? 'bg-black/25 text-white'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                  }`}
                >
                  {stats.presentStudents}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('registered')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 sm:px-5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isParticipantsTab
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-label-secondary dark:text-[#86868B] hover:text-label-primary hover:bg-canvas/60 dark:hover:bg-white/5'
                }`}
              >
                <Users size={15} />
                <span>Registered Students</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    !isParticipantsTab
                      ? 'bg-black/25 text-white'
                      : 'bg-separator dark:bg-white/10 text-label-secondary dark:text-[#86868B]'
                  }`}
                >
                  {stats.totalStudents}
                </span>
              </button>
            </div>

            {/* Quick Live Context Indicator */}
            <div className="text-xs text-label-secondary dark:text-[#86868B] hidden md:flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {isParticipantsTab
                  ? 'Showing verified attendees only'
                  : 'Showing complete pre-registration records'}
              </span>
            </div>
          </div>

          {/* High-Contrast Explanatory Banner (Crisp in both Light & Dark Theme) */}
          <div
            className={`p-3 sm:p-3.5 rounded-2xl border text-xs flex items-center gap-3 transition-colors ${
              isParticipantsTab
                ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200'
                : 'bg-blue-500/[0.08] dark:bg-blue-500/10 border-blue-500/25 text-blue-900 dark:text-blue-200'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                isParticipantsTab
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30'
              }`}
            >
              {isParticipantsTab ? <BadgeCheck size={18} /> : <ClipboardList size={18} />}
            </div>
            <p className="leading-relaxed">
              {isParticipantsTab ? (
                <>
                  <strong className="font-extrabold text-emerald-800 dark:text-emerald-300 mr-1">
                    Event Participants List:
                  </strong>
                  Contains registered students and walk-ins who officially marked verified attendance
                  (via OTP sessions or manual roll-call). Only students in this directory are eligible for
                  certificates and point credits.
                </>
              ) : (
                <>
                  <strong className="font-extrabold text-blue-800 dark:text-blue-300 mr-1">
                    Registered Students Directory:
                  </strong>
                  Contains all students and squads that registered for this event. Students who check in
                  automatically graduate into the{' '}
                  <span
                    className="underline font-bold cursor-pointer hover:text-blue-950 dark:hover:text-blue-100"
                    onClick={() => setActiveTab('participants')}
                  >
                    Event Participants List
                  </span>
                  .
                </>
              )}
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* KPI METRIC CARDS                                                  */}
        {/* ================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:px-6 border-b border-separator dark:border-white/10 bg-canvas/20 dark:bg-white/[0.01] shrink-0">
          {isParticipantsTab ? (
            <>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface dark:bg-[#161618] border border-separator dark:border-white/10 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-label-tertiary dark:text-[#86868B]">
                    Verified Attendees
                  </p>
                  <UserCheck size={16} className="text-emerald-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-heading">
                  {stats.presentStudents}
                </p>
                <p className="text-xs text-label-secondary dark:text-[#86868B] mt-0.5 font-medium truncate">
                  Students with confirmed presence
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface dark:bg-[#161618] border border-separator dark:border-white/10 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-label-tertiary dark:text-[#86868B]">
                    Attendance Turnout
                  </p>
                  <Sparkles size={16} className="text-blue-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-label-primary dark:text-[#F5F5F7] mt-1 font-heading">
                  {stats.turnoutRate}%
                </p>
                <p className="text-xs text-label-secondary dark:text-[#86868B] mt-0.5 font-medium truncate">
                  {stats.presentStudents} of {stats.totalStudents} registered students
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface dark:bg-[#161618] border border-separator dark:border-white/10 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-label-tertiary dark:text-[#86868B]">
                    Participant Entries
                  </p>
                  <Layers size={16} className="text-purple-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-label-primary dark:text-[#F5F5F7] mt-1 font-heading">
                  {stats.presentRegistrations}
                </p>
                <p className="text-xs text-label-secondary dark:text-[#86868B] mt-0.5 font-medium truncate">
                  {stats.presentSolo} Solo • {stats.presentDuo} Duo • {stats.presentTeam} Squad
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface dark:bg-[#161618] border border-separator dark:border-white/10 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-label-tertiary dark:text-[#86868B]">
                    Pending / Unmarked
                  </p>
                  <AlertCircle size={16} className="text-amber-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1 font-heading">
                  {stats.absentStudents}
                </p>
                <p className="text-xs text-label-secondary dark:text-[#86868B] mt-0.5 font-medium truncate">
                  Registered but not yet verified
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface dark:bg-[#161618] border border-separator dark:border-white/10 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-label-tertiary dark:text-[#86868B]">
                    Total Registered
                  </p>
                  <Users size={16} className="text-blue-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1 font-heading">
                  {stats.totalStudents}
                </p>
                <p className="text-xs text-label-secondary dark:text-[#86868B] mt-0.5 font-medium truncate">
                  Students across all enrollments
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface dark:bg-[#161618] border border-separator dark:border-white/10 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-label-tertiary dark:text-[#86868B]">
                    Registration Entries
                  </p>
                  <Layers size={16} className="text-purple-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-label-primary dark:text-[#F5F5F7] mt-1 font-heading">
                  {stats.totalRegistrations}
                </p>
                <p className="text-xs text-label-secondary dark:text-[#86868B] mt-0.5 font-medium truncate">
                  {stats.soloCount} Solo • {stats.duoCount} Duo • {stats.teamCount} Squad
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface dark:bg-[#161618] border border-separator dark:border-white/10 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-label-tertiary dark:text-[#86868B]">
                    Turnout Status
                  </p>
                  <CheckCircle2 size={16} className="text-emerald-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-heading">
                  {stats.presentStudents}
                </p>
                <p className="text-xs text-label-secondary dark:text-[#86868B] mt-0.5 font-medium truncate">
                  {stats.turnoutRate}% confirmed attendance
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface dark:bg-[#161618] border border-separator dark:border-white/10 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-label-tertiary dark:text-[#86868B]">
                    Event Capacity
                  </p>
                  <ShieldCheck size={16} className="text-indigo-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-label-primary dark:text-[#F5F5F7] mt-1 font-heading">
                  {event.maxParticipants > 0 ? event.maxParticipants : 'Unlimited'}
                </p>
                <p className="text-xs text-label-secondary dark:text-[#86868B] mt-0.5 font-medium truncate">
                  {event.maxParticipants > 0
                    ? `${Math.max(0, event.maxParticipants - stats.totalStudents)} spots remaining`
                    : 'No hard cap enforced'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ================================================================= */}
        {/* SEARCH & FILTERS TOOLBAR                                          */}
        {/* ================================================================= */}
        <div className="p-4 sm:px-6 border-b border-separator dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface dark:bg-[#121214] shrink-0">
          {/* Search Box */}
          <div className="relative w-full sm:w-88">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isParticipantsTab
                  ? 'Search participants by name, roll no, team...'
                  : 'Search registered students by name, roll no, team...'
              }
              className="w-full text-xs py-2 pl-9.5 pr-8 rounded-xl bg-canvas dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-label-primary dark:text-[#F5F5F7] placeholder:text-label-tertiary focus:outline-none focus:border-blue-500/40 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Format & Attendance Filter Dropdowns */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto justify-end">
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="text-xs font-semibold py-2 px-3 rounded-xl bg-canvas dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-label-secondary dark:text-[#86868B] focus:outline-none cursor-pointer shrink-0"
            >
              <option value="all">All Formats</option>
              <option value="Individual">Solo</option>
              <option value="Duo">Duo (Pair)</option>
              <option value="Team">Squad (Team)</option>
            </select>

            {!isParticipantsTab && (
              <select
                value={attendanceFilter}
                onChange={(e) => setAttendanceFilter(e.target.value)}
                className="text-xs font-semibold py-2 px-3 rounded-xl bg-canvas dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-label-secondary dark:text-[#86868B] focus:outline-none cursor-pointer shrink-0"
              >
                <option value="all">All Attendance</option>
                <option value="present">Attended (Present Only)</option>
                <option value="absent">Unmarked (Absent Only)</option>
              </select>
            )}

            {(searchQuery || formatFilter !== 'all' || attendanceFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFormatFilter('all');
                  setAttendanceFilter('all');
                }}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer px-2"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CARDS LIST AREA                                                   */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-3 bg-canvas/40 dark:bg-black/20">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
              <p className="text-xs text-label-secondary dark:text-[#86868B]">Loading student profiles...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 flex items-center justify-center text-label-tertiary mx-auto shadow-sm">
                {isParticipantsTab ? <UserCheck size={26} /> : <Users size={26} />}
              </div>
              <p className="text-base font-bold text-label-primary dark:text-[#F5F5F7]">
                {isParticipantsTab ? 'No verified participants found' : 'No registered students found'}
              </p>
              <p className="text-xs text-label-secondary dark:text-[#86868B] max-w-md mx-auto leading-relaxed">
                {isParticipantsTab ? (
                  stats.presentStudents === 0 ? (
                    <>
                      None of the {stats.totalStudents} registered students have checked in for this event yet.
                      Once students check in via OTP sessions or manual roll-call, they will appear here.
                    </>
                  ) : (
                    'No participants match your current search query or filter selection.'
                  )
                ) : (
                  stats.totalStudents === 0
                    ? 'No students have registered for this event yet.'
                    : 'No registered students match your current search query or filter selection.'
                )}
              </p>
              {isParticipantsTab && stats.presentStudents === 0 && stats.totalStudents > 0 && (
                <button
                  onClick={() => setActiveTab('registered')}
                  className="py-2 px-4 rounded-xl text-xs font-bold bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-label-primary hover:border-separator-opaque transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm mx-auto mt-2"
                >
                  <Users size={14} className="text-blue-500" />
                  <span>View Registered Students ({stats.totalStudents})</span>
                </button>
              )}
            </div>
          ) : (
            filteredList.map((e, idx) => {
              const isGroup = e.type === 'Team' || e.type === 'Duo';
              const hasMembers = e.members && e.members.length > 0;
              const isExpanded = expandedTeams.has(e._id);
              const memberTotal = (e.members?.length || 0) + 1;
              const isPresent = Boolean(e.attendanceStatus);

              return (
                <div
                  key={e._id || idx}
                  className="p-4 sm:p-5 rounded-2xl bg-surface dark:bg-[#161617] border border-separator dark:border-white/10 hover:border-blue-500/35 dark:hover:border-blue-500/35 transition-all shadow-sm space-y-3"
                >
                  {/* Primary Row Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      {/* Monogram Avatar */}
                      <div
                        className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 border shadow-sm ${
                          isPresent
                            ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {e.enrolledBy?.name ? e.enrolledBy.name.charAt(0).toUpperCase() : '?'}
                      </div>

                      {/* Student and Team Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm sm:text-base text-label-primary dark:text-[#F5F5F7] tracking-tight">
                            {e.enrolledBy?.name || 'Unknown Student'}
                          </span>

                          {isGroup && e.teamName && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 flex items-center gap-1">
                              <Crown size={12} className="text-purple-500" />
                              {e.teamName}
                            </span>
                          )}

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              e.type === 'Duo'
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                                : e.type === 'Team'
                                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20'
                                : 'bg-separator dark:bg-white/10 text-label-secondary dark:text-[#86868B]'
                            }`}
                          >
                            {e.type === 'Duo'
                              ? 'Duo (2 Members)'
                              : e.type === 'Team'
                              ? `Squad (${memberTotal} Members)`
                              : 'Solo'}
                          </span>
                        </div>

                        {/* Detail Badges: Roll #, College, Year, Email, Department */}
                        <div className="flex items-center gap-2 text-xs text-label-secondary dark:text-[#86868B] mt-1.5 flex-wrap font-medium">
                          <span className="font-mono px-2 py-0.5 rounded-md bg-canvas dark:bg-[#1F1F22] border border-separator dark:border-white/10 text-label-primary dark:text-[#F5F5F7] text-xs font-semibold">
                            {e.enrolledBy?.rollNo || 'No Roll #'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-500/20 flex items-center gap-1">
                            <Building2 size={12} />
                            {getStudentCollege(e.enrolledBy)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-canvas dark:bg-[#1F1F22] text-label-secondary dark:text-[#86868B] font-bold text-xs border border-separator dark:border-white/10">
                            {getStudentYear(e.enrolledBy)}
                          </span>
                          <span className="flex items-center gap-1 text-label-secondary dark:text-[#86868B]">
                            <Mail size={12} className="text-label-tertiary" />
                            {e.enrolledBy?.email || 'N/A'}
                          </span>
                          {e.enrolledBy?.department && (
                            <span className="flex items-center gap-1 text-label-secondary dark:text-[#86868B]">
                              <GraduationCap size={13} className="text-label-tertiary" />
                              {e.enrolledBy.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Status Badges & Teammate Drawer Toggle */}
                    <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-auto flex-wrap">
                      {isParticipantsTab && (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            e.isWalkIn
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25'
                          }`}
                        >
                          {e.isWalkIn ? 'Walk-in Attendance' : 'Pre-registered'}
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          isPresent
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-canvas dark:bg-[#1F1F22] text-label-tertiary dark:text-[#86868B] border-separator dark:border-white/10'
                        }`}
                      >
                        {isPresent ? (
                          <>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span>{isParticipantsTab ? 'Verified Participant' : 'Attended'}</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={14} className="text-label-tertiary" />
                            <span>Awaiting Attendance</span>
                          </>
                        )}
                      </span>

                      {isGroup && hasMembers && (
                        <button
                          onClick={() => toggleExpand(e._id)}
                          className="py-1 px-2.5 rounded-xl bg-canvas dark:bg-[#1F1F22] border border-separator dark:border-white/10 text-label-secondary dark:text-[#86868B] hover:text-label-primary hover:border-separator-opaque transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm"
                        >
                          <span>
                            {e.members.length} Teammate{e.members.length > 1 ? 's' : ''}
                          </span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Custom Questionnaire Responses (if any) */}
                  {e.customResponses && Object.keys(e.customResponses).length > 0 && (
                    <div className="pt-2.5 border-t border-separator/60 dark:border-white/10 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-label-tertiary dark:text-[#86868B] flex items-center gap-1">
                        <Sliders size={11} className="text-blue-500" /> Questionnaire:
                      </span>
                      {Object.entries(e.customResponses).map(([key, val]) => {
                        const matchedField = event.customFields?.find(
                          (cf) => cf.id === key || cf.label === key
                        );
                        const displayKey = matchedField?.label || key;
                        const displayVal =
                          typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val || 'N/A');
                        return (
                          <span
                            key={key}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-canvas dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-xs font-medium text-label-secondary dark:text-[#86868B]"
                          >
                            <strong className="text-label-primary dark:text-[#F5F5F7] font-semibold">{displayKey}:</strong>
                            <span>{displayVal}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Expandable Team Roster Drawer */}
                  {isGroup && hasMembers && isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-separator/80 dark:border-white/10 space-y-2.5"
                    >
                      <p className="text-[11px] uppercase font-bold text-label-tertiary dark:text-[#86868B] tracking-wider">
                        Full Team Roster ({memberTotal} Total Members)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Leader card */}
                        <div className="p-3 rounded-2xl bg-canvas dark:bg-[#1A1A1D] border border-separator dark:border-white/10 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-500/20">
                            <Crown size={15} />
                          </div>
                          <div className="min-w-0 text-xs space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-label-primary dark:text-[#F5F5F7] truncate">
                                {e.enrolledBy?.name}
                              </span>
                              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                (Leader)
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                {getStudentCollege(e.enrolledBy)}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-surface dark:bg-[#121214] text-label-secondary dark:text-[#86868B] border border-separator dark:border-white/10">
                                {getStudentYear(e.enrolledBy)}
                              </span>
                            </div>
                            <p className="font-mono text-label-secondary dark:text-[#86868B] text-[11px]">
                              {e.enrolledBy?.rollNo || 'No Roll #'}
                            </p>
                            <p className="text-label-tertiary text-[11px] truncate">
                              {e.enrolledBy?.email || 'No email'}
                            </p>
                            {e.enrolledBy?.department && (
                              <p className="text-[10px] text-label-tertiary truncate">
                                {e.enrolledBy.department}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Member cards */}
                        {e.members.map((m, mIdx) => (
                          <div
                            key={m?._id || mIdx}
                            className="p-3 rounded-2xl bg-canvas dark:bg-[#1A1A1D] border border-separator dark:border-white/10 flex items-center gap-3"
                          >
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                              {m?.name ? m.name.charAt(0).toUpperCase() : 'M'}
                            </div>
                            <div className="min-w-0 text-xs space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-label-primary dark:text-[#F5F5F7] truncate block">
                                  {m?.name || 'Unknown Member'}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                  {getStudentCollege(m)}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-surface dark:bg-[#121214] text-label-secondary dark:text-[#86868B] border border-separator dark:border-white/10">
                                  {getStudentYear(m)}
                                </span>
                              </div>
                              <p className="font-mono text-label-secondary dark:text-[#86868B] text-[11px]">
                                {m?.rollNo || 'No Roll #'}
                              </p>
                              <p className="text-label-tertiary text-[11px] truncate">
                                {m?.email || 'No email'}
                              </p>
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

        {/* ================================================================= */}
        {/* MODAL FOOTER                                                      */}
        {/* ================================================================= */}
        <div className="p-4 sm:p-5 border-t border-separator dark:border-white/10 bg-canvas/40 dark:bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-label-secondary dark:text-[#86868B] shrink-0">
          <div>
            {isParticipantsTab ? (
              <span>
                Showing <strong className="text-label-primary dark:text-white font-bold">{filteredList.length}</strong> of{' '}
                <strong className="text-label-primary dark:text-white font-bold">{stats.presentRegistrations}</strong> verified entries ({stats.presentStudents} students)
              </span>
            ) : (
              <span>
                Showing <strong className="text-label-primary dark:text-white font-bold">{filteredList.length}</strong> of{' '}
                <strong className="text-label-primary dark:text-white font-bold">{stats.totalRegistrations}</strong> registered entries ({stats.totalStudents} students)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab(isParticipantsTab ? 'registered' : 'participants')}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Switch to {isParticipantsTab ? 'Registered Students Directory' : 'Event Participants Directory'}</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={onClose}
              className="py-1.5 px-4 rounded-xl text-xs font-bold text-label-secondary hover:text-label-primary bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EventParticipantsModal;
