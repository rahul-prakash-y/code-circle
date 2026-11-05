import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Calendar,
  Compass,
  Award,
  ChevronRight,
  Filter,
  ChevronLeft,
  X,
  User,
  Sparkles,
  BarChart3,
  Layers,
  ArrowUpDown,
  Download,
  Loader2,
  CheckCircle2,
  FileText,
  ShieldAlert,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useDebounce } from '@/hooks/useDebounce';
import ResponsiveModal from '@/components/ui/ResponsiveModal';
import Student360Profile from './Student360Profile';
import ExportReportButton from './ExportReportButton';
import {
  EMIL_EASE_OUT,
  EMIL_EASE_IN_OUT,
  DURATION_MICRO,
  DURATION_FAST,
  DURATION_DROPDOWN,
  DURATION_MODAL,
  emilMicroTap,
  emilCardVariants,
} from '@/lib/motion';
import {
  EmilButton,
  EmilCard,
  EmilDropdownRoot,
  EmilDropdownTrigger,
  EmilDropdownMenu,
  EmilDropdownItem,
  EmilTooltipGroup,
  EmilTooltip,
} from '@/components/ui/emil-ui';

export interface StudentSummary {
  _id: string;
  name: string;
  rollNo: string;
  email: string;
  role: string;
  department: string;
  college: string;
  year: string;
  points: number;
  profilePicUrl?: string;
  isOnboarded: boolean;
  isBlocked: boolean;
  isRestricted?: boolean;
  restrictionReason?: string;
  restrictedFeatures?: string[];
  totalEventsAttended: number;
  questsCompleted: number;
  levelsCompleted: number;
  averageAssessmentScore: number;
  codingChallengesSolved: number;
  createdAt: string;
}

export const StudentTrackingTable: React.FC = () => {
  // Query & filter states
  const [searchInput, setSearchInput] = useState<string>('');
  const debouncedSearch = useDebounce<string>(searchInput, 300);

  const [department, setDepartment] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [sortBy, setSortBy] = useState<string>('totalEventsAttended');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Data states
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  const handleDownloadStudentPdf = async (
    e: React.MouseEvent,
    studentId: string,
    rollNo: string,
    name: string
  ) => {
    e.stopPropagation();
    if (generatingPdfId) return;

    try {
      setGeneratingPdfId(studentId);
      const res = await api.get(`/admin/tracking/students/${studentId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const safeName = (rollNo || name || 'student').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `CodeCircle_Report_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`PDF report downloaded for ${name}!`);
    } catch (err: any) {
      console.error('Failed to download student PDF report:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to download student PDF report');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/tracking/students', {
        params: {
          page,
          limit,
          search: debouncedSearch,
          department,
          sortBy,
          sortOrder,
        },
      });

      if (res.data?.success) {
        setStudents(res.data.students || []);
        setTotalStudents(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      console.error('Failed to fetch tracking data:', err);
      setError(err.response?.data?.error || 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, department, sortBy, sortOrder]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Instant page reset on search change without layout animation delay
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, department]);

  const handleRowClick = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsProfileModalOpen(true);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const departmentsList = [
    { value: 'all', label: 'All Departments' },
    { value: 'Computer Science and Engineering', label: 'CSE' },
    { value: 'Information Technology', label: 'IT' },
    { value: 'Artificial Intelligence and Data Science', label: 'AI & DS' },
    { value: 'Electronics and Communication Engineering', label: 'ECE' },
    { value: 'Electrical and Electronics Engineering', label: 'EEE' },
    { value: 'Mechanical Engineering', label: 'Mechanical' },
    { value: 'Civil Engineering', label: 'Civil' },
  ];

  return (
    <div className="space-y-6 w-full max-w-[100vw] overflow-hidden">
      {/* ── Top Header and Metrics Panel ── */}
      <motion.div
        variants={emilCardVariants}
        initial="initial"
        animate="animate"
        className="surface p-5 sm:p-6 rounded-3xl border border-separator shadow-card space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
              <span>Student Performance Tracking</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent border border-accent/20">
                Live Data
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1">
              Cross-domain student audit: events, coding assessments, badges, and real-time standing.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ExportReportButton />
          </div>
        </div>

        {/* ── Snappy Search Bar & Filter Controls (Instant Keyboard Response) ── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-1 w-full">
          {/* Real-time search with clear button */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search student by name, roll number, or email (Instant)..."
              className="w-full pl-10 pr-10 py-2.5 min-h-[44px] bg-canvas rounded-2xl text-[16px] md:text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent/40 border border-separator transition-shadow"
            />
            {searchInput && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
                onClick={() => setSearchInput('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          {/* Department Filter Dropdown */}
          <div className="relative shrink-0 w-full md:w-auto">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full md:w-auto appearance-none bg-canvas text-text-primary text-[16px] md:text-sm font-medium rounded-2xl px-4 py-2.5 pr-8 min-h-[44px] outline-none cursor-pointer border border-separator focus:ring-2 focus:ring-accent/40 transition-shadow"
            >
              {departmentsList.map((dep) => (
                <option key={dep.value} value={dep.value} className="bg-surface text-text-primary">
                  {dep.label}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          </div>
        </div>
      </motion.div>

      {/* ── Master Tracking Data Table ── */}
      <motion.div
        variants={emilCardVariants}
        initial="initial"
        animate="animate"
        className="surface rounded-3xl border border-separator shadow-card overflow-hidden"
      >
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="bg-surface-elevated/70 text-[11px] uppercase tracking-wider text-text-muted border-b border-separator select-none">
                <th className="py-3.5 px-4 sm:px-6 font-semibold">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1.5 hover:text-text-primary cursor-pointer"
                  >
                    <span>Student</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </motion.button>
                </th>
                <th className="py-3.5 px-4 font-semibold">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
                    onClick={() => handleSort('department')}
                    className="flex items-center gap-1.5 hover:text-text-primary cursor-pointer"
                  >
                    <span>Dept / Year</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </motion.button>
                </th>
                <th className="py-3.5 px-4 font-semibold text-center">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
                    onClick={() => handleSort('totalEventsAttended')}
                    className="inline-flex items-center gap-1.5 hover:text-text-primary cursor-pointer"
                  >
                    <span>Events Attended</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </motion.button>
                </th>
                <th className="py-3.5 px-4 font-semibold text-center">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
                    onClick={() => handleSort('questsCompleted')}
                    className="inline-flex items-center gap-1.5 hover:text-text-primary cursor-pointer"
                  >
                    <span>Quests Done</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </motion.button>
                </th>
                <th className="py-3.5 px-4 font-semibold text-center">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
                    onClick={() => handleSort('averageAssessmentScore')}
                    className="inline-flex items-center gap-1.5 hover:text-text-primary cursor-pointer"
                  >
                    <span>Avg Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </motion.button>
                </th>
                <th className="py-3.5 px-4 font-semibold text-center">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
                    onClick={() => handleSort('points')}
                    className="inline-flex items-center gap-1.5 hover:text-text-primary cursor-pointer"
                  >
                    <span>Club Points</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </motion.button>
                </th>
                <th className="py-3.5 px-4 sm:px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator/60 text-sm">
              {loading ? (
                // Shimmer Skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-elevated" />
                        <div className="space-y-1.5">
                          <div className="w-32 h-3.5 bg-surface-elevated rounded" />
                          <div className="w-20 h-2.5 bg-surface-elevated rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-24 h-3 bg-surface-elevated rounded" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-12 h-6 mx-auto bg-surface-elevated rounded-full" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-12 h-6 mx-auto bg-surface-elevated rounded-full" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-16 h-6 mx-auto bg-surface-elevated rounded-full" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-12 h-6 mx-auto bg-surface-elevated rounded-full" />
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="w-8 h-8 ml-auto bg-surface-elevated rounded-full" />
                    </td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-text-muted">
                    <div className="max-w-xs mx-auto space-y-2">
                      <User className="w-8 h-8 mx-auto text-text-muted opacity-40" />
                      <p className="text-sm font-medium">No students match your criteria.</p>
                      <p className="text-xs text-text-muted">
                        Try clearing search terms or selecting a different department filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const score = student.averageAssessmentScore || 0;
                  const scoreBadgeColor =
                    score >= 70
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : score >= 40
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : score > 0
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-surface-elevated text-text-muted';

                  return (
                    <motion.tr
                      key={student._id}
                      whileTap={{ scale: 0.992 }}
                      transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
                      onClick={() => handleRowClick(student._id)}
                      className="group hover:bg-surface-elevated/50 cursor-pointer transition-colors duration-150"
                    >
                      {/* Student identity */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm">
                            {student.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-text-primary truncate group-hover:text-accent transition-colors flex items-center gap-1.5">
                              <span className="truncate">{student.name}</span>
                              {student.isRestricted && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 shrink-0">
                                  Restricted
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-text-muted truncate">
                              {student.rollNo}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department / Year */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-text-primary font-medium truncate max-w-[170px]">
                          {student.department || 'Unassigned'}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {student.year || 'Student'}
                        </div>
                      </td>

                      {/* Summary Metric 1: Total Events Attended */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-elevated text-text-primary border border-separator/40">
                          <Calendar className="w-3 h-3 text-text-muted" />
                          {student.totalEventsAttended}
                        </span>
                      </td>

                      {/* Summary Metric 2: Quests Completed */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Compass className="w-3 h-3 text-emerald-500" />
                          {student.questsCompleted}
                        </span>
                      </td>

                      {/* Summary Metric 3: Average Assessment Score */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-mono border border-separator/40 ${scoreBadgeColor}`}
                        >
                          <Award className="w-3 h-3" />
                          {score > 0 ? `${score}%` : '—'}
                        </span>
                      </td>

                      {/* Club Points */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-text-primary">
                          {student.points || 0} pts
                        </span>
                      </td>

                      {/* Actions: Origin-Aware Dropdown & Coordinated Tooltip */}
                      <td
                        className="py-3.5 px-4 sm:px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <EmilTooltipGroup>
                            <div className="flex items-center gap-1">
                              <EmilTooltip content="Download PDF Report">
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
                                  type="button"
                                  onClick={(e) =>
                                    handleDownloadStudentPdf(
                                      e,
                                      student._id,
                                      student.rollNo,
                                      student.name
                                    )
                                  }
                                  disabled={generatingPdfId === student._id}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-text-muted hover:text-accent hover:bg-accent-subtle transition-colors cursor-pointer"
                                  aria-label={`Download PDF report for ${student.name}`}
                                >
                                  {generatingPdfId === student._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                                  ) : (
                                    <FileText className="w-4 h-4" />
                                  )}
                                </motion.button>
                              </EmilTooltip>

                              {/* Origin-Aware Quick Actions Popover */}
                              <EmilDropdownRoot origin="top right">
                                <EmilDropdownTrigger>
                                  <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-text-muted hover:text-text-primary hover:bg-separator/50 transition-colors cursor-pointer"
                                    aria-label="More options"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </motion.button>
                                </EmilDropdownTrigger>
                                <EmilDropdownMenu align="right" className="w-48">
                                  <EmilDropdownItem
                                    onClick={() => handleRowClick(student._id)}
                                    icon={<User className="w-4 h-4 text-accent" />}
                                  >
                                    View 360° Profile
                                  </EmilDropdownItem>
                                  <EmilDropdownItem
                                    onClick={(e: any) =>
                                      handleDownloadStudentPdf(
                                        e,
                                        student._id,
                                        student.rollNo,
                                        student.name
                                      )
                                    }
                                    icon={<Download className="w-4 h-4 text-emerald-500" />}
                                  >
                                    Export Audit Sheet
                                  </EmilDropdownItem>
                                </EmilDropdownMenu>
                              </EmilDropdownRoot>

                              <EmilTooltip content="Open 360 Profile">
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  transition={{ duration: DURATION_MICRO, ease: EMIL_EASE_OUT }}
                                  type="button"
                                  onClick={() => handleRowClick(student._id)}
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-text-muted group-hover:text-accent group-hover:bg-accent-subtle transition-colors cursor-pointer"
                                  aria-label={`View 360 profile for ${student.name}`}
                                >
                                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                </motion.button>
                              </EmilTooltip>
                            </div>
                          </EmilTooltipGroup>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Snappy Pagination Footer ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 px-4 sm:px-6 bg-surface-elevated/40 border-t border-separator text-xs text-text-muted gap-3">
          <div>
            Showing <span className="font-semibold text-text-primary">{students.length}</span> of{' '}
            <span className="font-semibold text-text-primary">{totalStudents}</span> students
          </div>

          <div className="flex items-center gap-2">
            <EmilButton
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              <span>Previous</span>
            </EmilButton>

            <span className="px-3 py-1 font-mono text-text-primary text-[11px] font-medium bg-separator/30 rounded-lg">
              Page {page} of {totalPages}
            </span>

            <EmilButton
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </EmilButton>
          </div>
        </div>
      </motion.div>

      {/* ── 360 Detail View in ResponsiveModal (Backdrop-blur-md, Enters scale(0.95), sub-220ms) ── */}
      <ResponsiveModal
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
        variant="slideover"
        title="Student 360° Profile"
        description="Comprehensive performance, attendance logs, and learning journey"
        dialogClassName="max-w-2xl lg:max-w-3xl"
        contentClassName="p-0 bg-canvas"
      >
        {selectedStudentId && (
          <Student360Profile
            userId={selectedStudentId}
            onClose={() => setIsProfileModalOpen(false)}
          />
        )}
      </ResponsiveModal>
    </div>
  );
};

export default StudentTrackingTable;
