import ResponsiveModal from '../ui/ResponsiveModal';
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
  Award,
  Sliders,
  Sparkles,
  ClipboardList,
  AlertCircle,
  BadgeCheck,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { HeroUISelect, HeroChip as Chip } from '../ui/HeroUIComponents';
import { format } from 'date-fns';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
import { getStudentCollege, getStudentYear, getStudentDepartment } from '../../utils/studentUtils';
import EventBulkUploadModal from '../events/EventBulkUploadModal';

export const EventParticipantsModal = ({
  isOpen,
  onClose,
  event,
  initialTab = 'participants',
}) => {
  const { fetchEventEnrollments, generateCertificates, deleteParticipantEnrollment, loading } = useEnrollmentStore();
  const [activeTab, setActiveTab] = useState(initialTab || 'participants');
  const [enrollments, setEnrollments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [formatFilter, setFormatFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  const [generatingCertificates, setGeneratingCertificates] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [confirmDeleteEnrollment, setConfirmDeleteEnrollment] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!confirmDeleteEnrollment) return;
    setIsDeleting(true);
    try {
      await deleteParticipantEnrollment(confirmDeleteEnrollment._id);
      setEnrollments((prev) => prev.filter((e) => e._id !== confirmDeleteEnrollment._id));
      toast.success(
        `Removed ${confirmDeleteEnrollment.enrolledBy?.name || 'student'} from event registrations`
      );
      setConfirmDeleteEnrollment(null);
    } catch (err) {
      toast.error(err.message || 'Failed to remove participant');
    } finally {
      setIsDeleting(false);
    }
  };

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
        getStudentDepartment(e.enrolledBy).toLowerCase().includes(q);

      // Check team name
      const teamNameMatch = e.teamName?.toLowerCase().includes(q);

      // Check members
      const memberMatch = e.members?.some(
        (m) =>
          m?.name?.toLowerCase().includes(q) ||
          m?.rollNo?.toLowerCase().includes(q) ||
          m?.email?.toLowerCase().includes(q) ||
          getStudentDepartment(m).toLowerCase().includes(q)
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
      return toast.error('No certificate template uploaded for this event. Please upload a certificate template before generating certificates.');
    }
    if (stats.presentStudents === 0) {
      return toast.error('No participants have marked attendance yet. Validate attendance before generating certificates.');
    }
    setGeneratingCertificates(true);
    try {
      const res = await generateCertificates(event._id);
      toast.success(res.message || 'Certificates generated successfully for attended participants.');
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
      const leadDept = getStudentDepartment(e.enrolledBy);

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
        `"${leadDept}"`,
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
          const memberDept = getStudentDepartment(m);

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
            `"${memberDept}"`,
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
        ? 'Event participants CSV exported successfully'
        : 'Registered students CSV exported successfully'
    );
  };

  if (!isOpen || !event) return null;

  const isParticipantsTab = activeTab === 'participants';

  return (
    <>
      <ResponsiveModal
        open={isOpen && Boolean(event)}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              {isParticipantsTab ? <UserCheck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span>{isParticipantsTab ? 'Event Participants Directory' : 'Registered Students Directory'}</span>
              <Chip
                size="sm"
                color={isParticipantsTab ? 'success' : 'accent'}
                variant="flat"
              >
                {isParticipantsTab
                  ? `${stats.presentStudents} attended`
                  : `${stats.totalStudents} registered`}
              </Chip>
            </div>
          </div>
        }
        description={`${isParticipantsTab ? 'Verified attendance roster for ' : 'Complete student registration roster for '} ${event?.title || 'event'}`}
        dialogClassName="sm:max-w-5xl p-6"
      >
        <div className="space-y-4 pt-2">
          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-secondary rounded-2xl border border-separator">
            <span className="text-xs font-semibold text-label-secondary">Roster Controls:</span>
            <div className="flex flex-wrap items-center gap-2">
            {isParticipantsTab && (
              <>
                {event.certificateTemplateUrl ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                    <Award size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Template ready</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                    <Award size={14} className="text-amber-600 dark:text-amber-400" />
                    <span>Template missing</span>
                  </span>
                )}

                <Button
                  onPress={handleGenerateCertificates}
                  isDisabled={generatingCertificates || stats.presentStudents === 0}
                  variant="primary"
                  color="success"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-xs py-2 px-3.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer"
                  title="Generate certificates for attended participants"
                >
                  {generatingCertificates ? (
                    <Spinner size="sm" color="default" />
                  ) : (
                    <Award size={14} />
                  )}
                  <span>Generate certificates</span>
                </Button>
              </>
            )}

            <Button
              onPress={() => setIsBulkUploadOpen(true)}
              variant="primary"
              className="py-2 px-3.5 rounded-xl text-xs font-medium text-white shadow-xs flex items-center gap-2 cursor-pointer"
              title="Upload participants from Excel or CSV"
            >
              <FileSpreadsheet size={14} />
              <span>Upload Excel</span>
            </Button>

            <Button
              onPress={exportCSV}
              variant="secondary"
              className="py-2 px-3.5 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer shadow-xs"
              title={isParticipantsTab ? 'Download participants CSV' : 'Download registered students CSV'}
            >
              <Download size={14} />
              <span>{isParticipantsTab ? 'Export participants CSV' : 'Export registered CSV'}</span>
            </Button>

            </div>
          </div>

        {/* ================================================================= */}
        {/* SEGMENTED TAB SWITCHER & CLARITY BANNER                           */}
        {/* ================================================================= */}
        <div className="px-5 sm:px-6 pt-3.5 pb-3 border-b border-separator dark:border-white/10 bg-canvas/30 dark:bg-white/[0.01] flex flex-col gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Segmented Toggle */}
            <div className="inline-flex p-1 bg-surface-secondary border border-separator dark:border-white/10 rounded-2xl w-full sm:w-auto max-w-lg">
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 sm:px-5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isParticipantsTab
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-label-secondary hover:text-label-primary hover:bg-canvas/60 dark:hover:bg-white/5'
                }`}
              >
                <UserCheck size={14} />
                <span>Event participants</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-medium tabular-nums ${
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
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 sm:px-5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  !isParticipantsTab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-label-secondary hover:text-label-primary hover:bg-canvas/60 dark:hover:bg-white/5'
                }`}
              >
                <Users size={14} />
                <span>Registered students</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-medium tabular-nums ${
                    !isParticipantsTab
                      ? 'bg-black/25 text-white'
                      : 'bg-separator dark:bg-white/10 text-label-secondary'
                  }`}
                >
                  {stats.totalStudents}
                </span>
              </button>
            </div>

            {/* Quick Live Context Indicator */}
            <div className="text-xs text-label-secondary hidden md:flex items-center gap-2 font-normal">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {isParticipantsTab
                  ? 'Showing verified attendees only'
                  : 'Showing complete pre-registration records'}
              </span>
            </div>
          </div>

          {/* High-Contrast Explanatory Banner */}
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
                  <strong className="font-semibold text-emerald-800 dark:text-emerald-300 mr-1">
                    Event participants:
                  </strong>
                  Registered students and walk-ins who officially marked attendance. Only students in this directory are eligible for certificates and point credits.
                </>
              ) : (
                <>
                  <strong className="font-semibold text-blue-800 dark:text-blue-300 mr-1">
                    Registered students:
                  </strong>
                  All individual students and teams registered for this event. Students who check in move automatically into the{' '}
                  <span
                    className="underline font-medium cursor-pointer hover:text-blue-950 dark:hover:text-blue-100"
                    onClick={() => setActiveTab('participants')}
                  >
                    Event participants directory
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
              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-semibold tracking-wider text-label-tertiary">
                    Verified attendees
                  </p>
                  <UserCheck size={16} className="text-emerald-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats.presentStudents}
                </p>
                <p className="text-xs text-label-secondary mt-0.5 font-normal truncate">
                  Confirmed attendance
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-semibold tracking-wider text-label-tertiary">
                    Attendance turnout
                  </p>
                  <Sparkles size={16} className="text-blue-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-label-primary mt-1">
                  {stats.turnoutRate}%
                </p>
                <p className="text-xs text-label-secondary mt-0.5 font-normal truncate tabular-nums">
                  {stats.presentStudents} of {stats.totalStudents} registered
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-semibold tracking-wider text-label-tertiary">
                    Participant entries
                  </p>
                  <Layers size={16} className="text-purple-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-label-primary mt-1">
                  {stats.presentRegistrations}
                </p>
                <p className="text-xs text-label-secondary mt-0.5 font-normal truncate tabular-nums">
                  {stats.presentSolo} solo · {stats.presentDuo} duo · {stats.presentTeam} squad
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-semibold tracking-wider text-label-tertiary">
                    Pending verification
                  </p>
                  <AlertCircle size={16} className="text-amber-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                  {stats.absentStudents}
                </p>
                <p className="text-xs text-label-secondary mt-0.5 font-normal truncate">
                  Registered but not verified
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-semibold tracking-wider text-label-tertiary">
                    Total registered
                  </p>
                  <Users size={16} className="text-blue-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-blue-600 dark:text-blue-400 mt-1">
                  {stats.totalStudents}
                </p>
                <p className="text-xs text-label-secondary mt-0.5 font-normal truncate">
                  Students across all enrollments
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-semibold tracking-wider text-label-tertiary">
                    Registration entries
                  </p>
                  <Layers size={16} className="text-purple-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-label-primary mt-1">
                  {stats.totalRegistrations}
                </p>
                <p className="text-xs text-label-secondary mt-0.5 font-normal truncate tabular-nums">
                  {stats.soloCount} solo · {stats.duoCount} duo · {stats.teamCount} squad
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-semibold tracking-wider text-label-tertiary">
                    Turnout status
                  </p>
                  <CheckCircle2 size={16} className="text-emerald-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats.presentStudents}
                </p>
                <p className="text-xs text-label-secondary mt-0.5 font-normal truncate tabular-nums">
                  {stats.turnoutRate}% confirmed attendance
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-separator shadow-xs relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase font-semibold tracking-wider text-label-tertiary">
                    Event capacity
                  </p>
                  <ShieldCheck size={16} className="text-indigo-500 opacity-80" />
                </div>
                <p className="text-2xl sm:text-3xl font-semibold tabular-nums text-label-primary mt-1">
                  {event.maxParticipants > 0 ? event.maxParticipants : 'Unlimited'}
                </p>
                <p className="text-xs text-label-secondary mt-0.5 font-normal truncate tabular-nums">
                  {event.maxParticipants > 0
                    ? `${Math.max(0, event.maxParticipants - stats.totalStudents)} spots remaining`
                    : 'No limit set'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ================================================================= */}
        {/* SEARCH & FILTERS TOOLBAR                                          */}
        {/* ================================================================= */}
        <div className="p-4 sm:px-6 border-b border-separator dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface shrink-0">
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
              className="w-full text-xs py-2 pl-9.5 pr-8 rounded-xl bg-canvas border border-separator dark:border-white/10 text-label-primary placeholder:text-label-tertiary focus:outline-none focus:border-blue-500/40 transition-colors font-normal"
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
            <HeroUISelect
              value={formatFilter}
              onChange={setFormatFilter}
              options={[
                { value: 'all', label: 'All formats' },
                { value: 'Individual', label: 'Solo' },
                { value: 'Duo', label: 'Duo (pair)' },
                { value: 'Team', label: 'Squad (team)' },
              ]}
              size="sm"
              className="w-36 shrink-0"
            />

            {!isParticipantsTab && (
              <HeroUISelect
                value={attendanceFilter}
                onChange={setAttendanceFilter}
                options={[
                  { value: 'all', label: 'All attendance' },
                  { value: 'present', label: 'Attended (present only)' },
                  { value: 'absent', label: 'Unmarked (absent only)' },
                ]}
                size="sm"
                className="w-44 shrink-0"
              />
            )}

            {(searchQuery || formatFilter !== 'all' || attendanceFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFormatFilter('all');
                  setAttendanceFilter('all');
                }}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer px-2"
              >
                Reset filters
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
              <p className="text-xs text-label-secondary">Loading student profiles...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-surface border border-separator dark:border-white/10 flex items-center justify-center text-label-tertiary mx-auto shadow-xs">
                {isParticipantsTab ? <UserCheck size={24} /> : <Users size={24} />}
              </div>
              <p className="text-base font-semibold tracking-tight text-label-primary">
                {isParticipantsTab ? 'No verified participants found' : 'No registered students found'}
              </p>
              <p className="text-xs text-label-secondary max-w-md mx-auto leading-relaxed">
                {isParticipantsTab ? (
                  stats.presentStudents === 0 ? (
                    <>
                      None of the {stats.totalStudents} registered students have checked in for this event yet.
                      Once students check in via OTP sessions or roll-call, they will appear here.
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
                  className="py-2 px-4 rounded-xl text-xs font-medium bg-surface border border-separator dark:border-white/10 text-label-primary hover:border-separator-opaque transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs mx-auto mt-2"
                >
                  <Users size={14} className="text-blue-500" />
                  <span>View registered students ({stats.totalStudents})</span>
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
                  className="p-4 sm:p-5 rounded-2xl bg-surface border border-separator dark:border-white/10 hover:border-blue-500/35 dark:hover:border-blue-500/35 transition-all shadow-xs space-y-3"
                >
                  {/* Primary Row Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      {/* Monogram Avatar */}
                      <div
                        className={`w-10 h-10 rounded-xl font-semibold text-sm flex items-center justify-center shrink-0 border shadow-xs ${
                          isPresent
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25'
                        }`}
                      >
                        {e.enrolledBy?.name ? e.enrolledBy.name.charAt(0).toUpperCase() : '?'}
                      </div>

                      {/* Student and Team Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm sm:text-base text-label-primary tracking-tight">
                            {e.enrolledBy?.name || 'Unknown Student'}
                          </span>

                          {isGroup && e.teamName && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 flex items-center gap-1">
                              <Crown size={12} className="text-purple-500" />
                              {e.teamName}
                            </span>
                          )}

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium tabular-nums ${
                              e.type === 'Duo'
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                                : e.type === 'Team'
                                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20'
                                : 'bg-separator dark:bg-white/10 text-label-secondary'
                            }`}
                          >
                            {e.type === 'Duo'
                              ? 'Duo (2 members)'
                              : e.type === 'Team'
                              ? `Squad (${memberTotal} members)`
                              : 'Solo'}
                          </span>
                        </div>

                        {/* Detail Badges */}
                        <div className="flex items-center gap-2 text-xs text-label-secondary mt-1.5 flex-wrap font-normal">
                          <span className="font-mono px-2 py-0.5 rounded-md bg-surface-secondary border border-separator text-label-primary text-xs font-medium tabular-nums">
                            {e.enrolledBy?.rollNo || 'No roll number'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium text-xs border border-blue-500/20 flex items-center gap-1">
                            <Building2 size={12} />
                            {getStudentCollege(e.enrolledBy)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-surface-secondary text-label-secondary font-medium text-xs border border-separator">
                            {getStudentYear(e.enrolledBy)}
                          </span>
                          <span className="flex items-center gap-1 text-label-secondary">
                            <Mail size={12} className="text-label-tertiary" />
                            {e.enrolledBy?.email || 'No email'}
                          </span>
                          <span className="flex items-center gap-1 text-label-secondary">
                            <GraduationCap size={13} className="text-label-tertiary" />
                            {getStudentDepartment(e.enrolledBy)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Status Badges & Teammate Drawer Toggle */}
                    <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-auto flex-wrap">
                      {isParticipantsTab && (
                        <Chip
                          size="sm"
                          color={e.isWalkIn ? 'warning' : 'primary'}
                          variant="flat"
                        >
                          {e.isWalkIn ? 'Walk-in attendance' : 'Pre-registered'}
                        </Chip>
                      )}

                      <Chip
                        size="sm"
                        color={isPresent ? 'success' : 'default'}
                        variant="flat"
                        startContent={
                          isPresent ? (
                            <CheckCircle2 size={13} className="text-emerald-500" />
                          ) : (
                            <XCircle size={13} className="text-label-tertiary" />
                          )
                        }
                      >
                        {isPresent
                          ? isParticipantsTab
                            ? 'Verified participant'
                            : 'Attended'
                          : 'Awaiting attendance'}
                      </Chip>

                      {isGroup && hasMembers && (
                        <button
                          onClick={() => toggleExpand(e._id)}
                          className="py-1 px-2.5 rounded-xl bg-surface-secondary border border-separator text-label-secondary hover:text-label-primary hover:border-separator-opaque transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-xs tabular-nums"
                        >
                          <span>
                            {e.members.length} teammate{e.members.length > 1 ? 's' : ''}
                          </span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}

                      {/* Delete Participant Button */}
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteEnrollment(e)}
                        title="Delete participant registration"
                        className="py-1 px-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-xs"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Custom Questionnaire Responses */}
                  {e.customResponses && Object.keys(e.customResponses).length > 0 && (
                    <div className="pt-2.5 border-t border-separator/60 dark:border-white/10 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-medium text-label-tertiary flex items-center gap-1">
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
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-canvas border border-separator dark:border-white/10 text-xs font-normal text-label-secondary"
                          >
                            <strong className="text-label-primary font-medium">{displayKey}:</strong>
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
                      <p className="text-[11px] uppercase font-semibold text-label-tertiary tracking-wider tabular-nums">
                        Full team roster ({memberTotal} members)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Leader card */}
                        <div className="p-3 rounded-2xl bg-canvas border border-separator dark:border-white/10 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium text-xs flex items-center justify-center shrink-0 border border-purple-500/20">
                            <Crown size={14} />
                          </div>
                          <div className="min-w-0 text-xs space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-label-primary truncate">
                                {e.enrolledBy?.name}
                              </span>
                              <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">
                                (Leader)
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                {getStudentCollege(e.enrolledBy)}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-surface text-label-secondary border border-separator dark:border-white/10">
                                {getStudentYear(e.enrolledBy)}
                              </span>
                            </div>
                            <p className="font-mono text-label-secondary text-[11px] tabular-nums">
                              {e.enrolledBy?.rollNo || 'No roll number'}
                            </p>
                            <p className="text-label-tertiary text-[11px] truncate">
                              {e.enrolledBy?.email || 'No email'}
                            </p>
                            <p className="text-[10px] text-label-tertiary truncate">
                              {getStudentDepartment(e.enrolledBy)}
                            </p>
                          </div>
                        </div>

                        {/* Member cards */}
                        {e.members.map((m, mIdx) => (
                          <div
                            key={m?._id || mIdx}
                            className="p-3 rounded-2xl bg-canvas border border-separator dark:border-white/10 flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                              {m?.name ? m.name.charAt(0).toUpperCase() : 'M'}
                            </div>
                            <div className="min-w-0 text-xs space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-label-primary truncate block">
                                  {m?.name || 'Unknown member'}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                  {getStudentCollege(m)}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-surface text-label-secondary border border-separator dark:border-white/10">
                                  {getStudentYear(m)}
                                </span>
                              </div>
                              <p className="font-mono text-label-secondary text-[11px] tabular-nums">
                                {m?.rollNo || 'No roll number'}
                              </p>
                              <p className="text-label-tertiary text-[11px] truncate">
                                {m?.email || 'No email'}
                              </p>
                              <p className="text-[10px] text-label-tertiary truncate">{getStudentDepartment(m)}</p>
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
        <div className="p-4 sm:p-5 border-t border-separator dark:border-white/10 bg-canvas/40 dark:bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-label-secondary shrink-0">
          <div>
            {isParticipantsTab ? (
              <span className="tabular-nums">
                Showing <strong className="text-label-primary dark:text-white font-semibold">{filteredList.length}</strong> of{' '}
                <strong className="text-label-primary dark:text-white font-semibold">{stats.presentRegistrations}</strong> verified entries ({stats.presentStudents} students)
              </span>
            ) : (
              <span className="tabular-nums">
                Showing <strong className="text-label-primary dark:text-white font-semibold">{filteredList.length}</strong> of{' '}
                <strong className="text-label-primary dark:text-white font-semibold">{stats.totalRegistrations}</strong> registered entries ({stats.totalStudents} students)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab(isParticipantsTab ? 'registered' : 'participants')}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Switch to {isParticipantsTab ? 'Registered students directory' : 'Event participants directory'}</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={onClose}
              className="py-1.5 px-4 rounded-xl text-xs font-medium text-label-secondary hover:text-label-primary bg-surface border border-separator dark:border-white/10 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
        </div>
      </ResponsiveModal>

      {/* Bulk Upload Modal */}
      <EventBulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        event={event}
        onSuccess={async () => {
          if (event?._id) {
            try {
              const data = await fetchEventEnrollments(event._id);
              setEnrollments(data || []);
            } catch (err) {
              console.error('Failed to reload enrollments after upload:', err);
            }
          }
        }}
      />

      {/* DELETE PARTICIPANT CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmDeleteEnrollment && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface border border-separator rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-label-primary dark:text-white">
                    Remove participant?
                  </h3>
                  <p className="text-xs text-label-secondary dark:text-white/60">
                    Delete student registration from this event
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-secondary border border-separator space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-label-tertiary dark:text-white/50">Student name:</span>
                  <span className="font-semibold text-label-primary dark:text-white">
                    {confirmDeleteEnrollment.enrolledBy?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-label-tertiary dark:text-white/50">Roll number:</span>
                  <span className="font-mono font-medium text-label-primary dark:text-white tabular-nums">
                    {confirmDeleteEnrollment.enrolledBy?.rollNo || 'N/A'}
                  </span>
                </div>
                {confirmDeleteEnrollment.teamName && (
                  <div className="flex justify-between">
                    <span className="text-label-tertiary dark:text-white/50">Team name:</span>
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      {confirmDeleteEnrollment.teamName}
                    </span>
                  </div>
                )}
                {confirmDeleteEnrollment.members?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-label-tertiary dark:text-white/50">Teammates:</span>
                    <span className="font-medium text-label-primary dark:text-white tabular-nums">
                      +{confirmDeleteEnrollment.members.length} member(s)
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-label-tertiary dark:text-white/50">Status:</span>
                  <span className={confirmDeleteEnrollment.attendanceStatus ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
                    {confirmDeleteEnrollment.attendanceStatus ? 'Attended (verified)' : 'Registered'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-red-500/90 dark:text-red-400/90 leading-relaxed bg-red-500/5 p-3 rounded-xl border border-red-500/15">
                Removing this registration will free up the participant spot. Any certificates or attendance records associated with this enrollment will be removed.
              </p>

              <div className="flex justify-end gap-2.5 pt-1">
                <Button
                  type="button"
                  isDisabled={isDeleting}
                  variant="secondary"
                  onPress={() => setConfirmDeleteEnrollment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  isDisabled={isDeleting}
                  variant="danger"
                  onPress={confirmDelete}
                  className="px-5 py-2 rounded-xl text-white font-medium text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isDeleting ? <Spinner size="sm" color="default" /> : <Trash2 size={13} />}
                  <span>{isDeleting ? 'Removing...' : 'Confirm and delete'}</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EventParticipantsModal;

