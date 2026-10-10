import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useDebounce } from '@/hooks/useDebounce';
import ResponsiveModal from '@/components/ui/ResponsiveModal';
import Student360Profile from './Student360Profile';
import ExportReportButton from './ExportReportButton';

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
  const debouncedSearch = useDebounce<string>(searchInput, 400);

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

  // Detail Modal / Slide-over state
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

  // Reset page when search or department changes
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
    setPage(1);
  };

  // Departments list for filtering
  const departmentsList = [
    { value: 'all', label: 'All Departments' },
    { value: 'COMPUTER SCIENCE AND ENGINEERING', label: 'CSE' },
    { value: 'INFORMATION TECHNOLOGY', label: 'IT' },
    { value: 'ARTIFICIAL INTELLIGENCE AND DATA SCIENCE', label: 'AI & DS' },
    { value: 'ELECTRONICS AND COMMUNICATION ENGINEERING', label: 'ECE' },
    { value: 'ELECTRICAL AND ELECTRONICS ENGINEERING', label: 'EEE' },
    { value: 'MECHANICAL ENGINEERING', label: 'Mechanical' },
    { value: 'BIOTECHNOLOGY', label: 'Biotechnology' },
    { value: 'BIOMEDICAL ENGINEERING', label: 'Biomedical' },
    { value: 'CIVIL ENGINEERING', label: 'Civil' },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* ── Table Top Bar & Apple Minimal Actions ── */}
      <div className="bg-white/80 dark:bg-[#1E1E1F]/90 backdrop-blur-xl rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400">
                SuperAdmin Analytics
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                {totalStudents.toLocaleString()} Students Enrolled
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Student Tracking System
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Aggregated real-time metrics across attendance, domain quests, and knowledge assessments.
            </p>
          </div>

          {/* Action Header Button: Apple Minimal Ghost Export Button */}
          <div className="flex items-center gap-3 shrink-0">
            <ExportReportButton />
          </div>
        </div>

        {/* ── Search Bar & Filter Controls ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          {/* Real-time search with useDebounce */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search student by name, roll number, or email..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#F5F5F7] dark:bg-[#161617] rounded-full text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-blue-500/40 transition-shadow"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Department Filter Dropdown */}
          <div className="relative shrink-0">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="appearance-none bg-[#F5F5F7] dark:bg-[#161617] text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm font-medium rounded-full px-4 py-2.5 pr-8 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/40 transition-shadow"
            >
              {departmentsList.map((dep) => (
                <option key={dep.value} value={dep.value} className="bg-white dark:bg-[#1E1E1F]">
                  {dep.label}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Master Tracking Data Table ── */}
      <div className="bg-white/80 dark:bg-[#1E1E1F]/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F5F7]/80 dark:bg-[#161617]/80 text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200/50 dark:border-neutral-800/50">
                <th className="py-3.5 px-6 font-semibold">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white"
                  >
                    <span>Student</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('department')}
                    className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white"
                  >
                    <span>Dept / Year</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold text-center">
                  <button
                    onClick={() => handleSort('totalEventsAttended')}
                    className="inline-flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white"
                  >
                    <span>Events Attended</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold text-center">
                  <button
                    onClick={() => handleSort('questsCompleted')}
                    className="inline-flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white"
                  >
                    <span>Quests Done</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold text-center">
                  <button
                    onClick={() => handleSort('averageAssessmentScore')}
                    className="inline-flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white"
                  >
                    <span>Avg Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold text-center">
                  <button
                    onClick={() => handleSort('points')}
                    className="inline-flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white"
                  >
                    <span>Club Points</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3.5 px-6 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-sm">
              {loading ? (
                // Shimmer Skeleton Rows
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                        <div className="space-y-1.5">
                          <div className="w-32 h-3.5 bg-neutral-200 dark:bg-neutral-800 rounded" />
                          <div className="w-20 h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-24 h-3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-12 h-6 mx-auto bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-12 h-6 mx-auto bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-16 h-6 mx-auto bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-12 h-6 mx-auto bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="w-6 h-6 ml-auto bg-neutral-200 dark:bg-neutral-800 rounded" />
                    </td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-neutral-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <User className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-600" />
                      <p className="text-sm font-medium">No students match your criteria.</p>
                      <p className="text-xs text-neutral-400">
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
                      : 'bg-neutral-200/50 dark:bg-neutral-800 text-neutral-400';

                  return (
                    <tr
                      key={student._id}
                      onClick={() => handleRowClick(student._id)}
                      className="group hover:bg-[#F5F5F7]/80 dark:hover:bg-[#161617]/80 cursor-pointer transition-colors"
                    >
                      {/* Student identity */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm">
                            {student.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-neutral-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                              {student.name}
                            </div>
                            <div className="text-xs font-mono text-neutral-400 dark:text-neutral-500 truncate">
                              {student.rollNo}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department / Year */}
                      <td className="py-4 px-4 text-xs">
                        <div className="text-neutral-700 dark:text-neutral-300 font-medium truncate max-w-[170px]">
                          {student.department || 'Unassigned'}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {student.year || 'Student'}
                        </div>
                      </td>

                      {/* Summary Metric 1: Total Events Attended */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          {student.totalEventsAttended}
                        </span>
                      </td>

                      {/* Summary Metric 2: Quests Completed */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Compass className="w-3 h-3 text-emerald-500" />
                          {student.questsCompleted}
                        </span>
                      </td>

                      {/* Summary Metric 3: Average Assessment Score */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-mono ${scoreBadgeColor}`}
                        >
                          <Award className="w-3 h-3" />
                          {score > 0 ? `${score}%` : '—'}
                        </span>
                      </td>

                      {/* Club Points */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-neutral-700 dark:text-neutral-300">
                          {student.points || 0} pts
                        </span>
                      </td>

                      {/* Row action: PDF report & chevron */}
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Download Student PDF Report"
                            onClick={(e) => handleDownloadStudentPdf(e, student._id, student.rollNo, student.name)}
                            disabled={generatingPdfId === student._id}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-neutral-400 hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
                          >
                            {generatingPdfId === student._id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            title="View Student 360 Profile"
                            onClick={() => handleRowClick(student._id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-neutral-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 px-6 bg-[#F5F5F7]/40 dark:bg-[#161617]/40 border-t border-neutral-100 dark:border-neutral-800/60 text-xs text-neutral-500 gap-3">
          <div>
            Showing <span className="font-semibold">{students.length}</span> of{' '}
            <span className="font-semibold">{totalStudents}</span> students
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-[#202022] shadow-sm disabled:opacity-40 disabled:pointer-events-none hover:bg-neutral-100 dark:hover:bg-[#262628] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1 font-mono text-neutral-600 dark:text-neutral-400">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-[#202022] shadow-sm disabled:opacity-40 disabled:pointer-events-none hover:bg-neutral-100 dark:hover:bg-[#262628] transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Apple 360 Detail View in ResponsiveModal (Drawer on mobile, Slide-over on desktop) ── */}
      <ResponsiveModal
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
        variant="slideover"
        title="Student 360° Profile"
        description="Comprehensive performance, attendance logs, and learning journey"
        dialogClassName="max-w-2xl lg:max-w-3xl"
        contentClassName="p-0 bg-[#F5F5F7] dark:bg-[#161617]"
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
