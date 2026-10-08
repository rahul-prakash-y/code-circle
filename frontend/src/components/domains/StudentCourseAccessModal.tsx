import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  X,
  Search,
  Crown,
  Globe,
  Lock,
  UserCheck,
  UserX,
  Sparkles,
  ShieldAlert,
  Loader2,
  Users,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useDomainStore } from '../../store/useDomainStore';
import { IStudentAccessItem } from '../../types/domain';

interface StudentCourseAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getPageNumbers = (current: number, total: number): (number | string)[] => {
  if (total <= 5) {
    return Array.from({ length: Math.max(1, total) }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, '...', total];
  }
  if (current >= total - 2) {
    return [1, '...', total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
};

export const StudentCourseAccessModal: React.FC<StudentCourseAccessModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    courseAccessConfig,
    studentAccessList,
    studentAccessPagination,
    loadingStudentAccess,
    fetchCourseAccessConfig,
    fetchStudentAccessList,
    toggleCourseVisibility,
    setStudentCourseAccess,
    batchSetCourseAccess,
  } = useDomainStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'allowed' | 'locked'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);
  const [batchUpdating, setBatchUpdating] = useState(false);

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCourseAccessConfig();
      fetchStudentAccessList({
        search: searchQuery,
        filter: filterTab,
        page: currentPage,
        limit: pageSize,
      });
    }
  }, [isOpen, fetchCourseAccessConfig]);

  // Load students on page or pageSize change
  const loadStudents = useCallback(
    (page: number, size: number, search: string, filter: 'all' | 'allowed' | 'locked') => {
      fetchStudentAccessList({
        search,
        filter,
        page,
        limit: size,
      });
    },
    [fetchStudentAccessList]
  );

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadStudents(1, pageSize, searchQuery, filterTab);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, pageSize, filterTab, loadStudents]);

  const handleTabChange = (newTab: 'all' | 'allowed' | 'locked') => {
    setFilterTab(newTab);
    setCurrentPage(1);
    loadStudents(1, pageSize, searchQuery, newTab);
  };

  const handlePageChange = (newPage: number) => {
    const targetPage = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(targetPage);
    loadStudents(targetPage, pageSize, searchQuery, filterTab);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    loadStudents(1, newSize, searchQuery, filterTab);
  };

  const isPublic = Boolean(courseAccessConfig?.coursesVisibleToAll);
  const totalAllowed =
    studentAccessPagination.totalAllowed ??
    courseAccessConfig?.allowedStudentsCount ??
    studentAccessList.filter((s) => s.isAllowed).length;

  const totalStudentsOverall =
    studentAccessPagination.totalStudents ??
    studentAccessPagination.total ??
    studentAccessList.length;

  const totalLocked = Math.max(0, totalStudentsOverall - totalAllowed);

  // Pagination stats
  const totalItems = studentAccessPagination.total ?? studentAccessList.length;
  const totalPages = Math.max(1, studentAccessPagination.totalPages || Math.ceil(totalItems / pageSize) || 1);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, (currentPage - 1) * pageSize + studentAccessList.length);
  const pageNumbers = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  const handleToggleVisibility = async () => {
    setTogglingVisibility(true);
    await toggleCourseVisibility(!isPublic);
    setTogglingVisibility(false);
  };

  const handleToggleStudentAccess = async (student: IStudentAccessItem) => {
    setUpdatingStudentId(student._id);
    await setStudentCourseAccess(student._id, !student.isAllowed);
    setUpdatingStudentId(null);
  };

  const handleBatchAction = async (action: 'allow_all' | 'revoke_all') => {
    setBatchUpdating(true);
    await batchSetCourseAccess(action);
    // Reload active page from server to reflect accurate state
    loadStudents(currentPage, pageSize, searchQuery, filterTab);
    setBatchUpdating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Apple Blur Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-surface border border-separator/80 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-separator/70 flex items-start justify-between gap-4 bg-surface/80 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-sm">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  SuperAdmin Clearance
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 text-accent">
                  Course Access Control
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-label-primary tracking-tight">
                Course Visibility & Selective Student Permissions
              </h2>
              <p className="text-xs text-label-secondary mt-0.5">
                Toggle between public release and Coming Soon mode, or grant individual students early course access.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-secondary text-label-secondary hover:text-label-primary hover:bg-surface border border-separator flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Visibility Mode Switch Card */}
        <div className="p-5 sm:p-6 pb-3 border-b border-separator/60 bg-surface-secondary/40">
          <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-separator shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition ${
                  isPublic
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                }`}
              >
                {isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-label-primary">
                    {isPublic ? 'Public Course Release Active' : 'Courses Coming Soon Mode Active'}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isPublic
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {isPublic ? 'Live for All Students' : 'Restricted / Coming Soon'}
                  </span>
                </div>
                <p className="text-xs text-label-secondary mt-0.5 max-w-xl">
                  {isPublic
                    ? 'All enrolled students can view the curriculum, register, watch lectures, and solve quests.'
                    : `Courses are hidden behind a Coming Soon screen. Only ${totalAllowed} approved student(s) can view and register.`}
                </p>
              </div>
            </div>

            {/* Primary Toggle Button */}
            <button
              type="button"
              onClick={handleToggleVisibility}
              disabled={togglingVisibility}
              className={`shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition shadow-sm cursor-pointer disabled:opacity-50 ${
                isPublic
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                  : 'bg-accent text-white hover:bg-accent-hover shadow-accent/20'
              }`}
            >
              {togglingVisibility ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPublic ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>{isPublic ? 'Hide Courses (Set to Coming Soon)' : 'Show Courses (Make Public)'}</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Filter Tabs & Batch Actions */}
        <div className="px-5 sm:px-6 py-3 border-b border-separator/60 flex flex-col md:flex-row items-center justify-between gap-3 bg-surface">
          {/* Search Bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="w-3.5 h-3.5 text-label-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students by name, roll no, department..."
              className="w-full pl-9 pr-3 py-1.5 rounded-full bg-surface-secondary border border-separator text-xs text-label-primary placeholder:text-label-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface-secondary border border-separator text-xs font-medium self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-surface text-label-primary shadow-xs font-semibold'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              All ({totalStudentsOverall})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('allowed')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                filterTab === 'allowed'
                  ? 'bg-surface text-label-primary shadow-xs font-semibold'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              Early Access ({totalAllowed})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('locked')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                filterTab === 'locked'
                  ? 'bg-surface text-label-primary shadow-xs font-semibold'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              Locked ({totalLocked})
            </button>
          </div>

          {/* Batch Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={() => handleBatchAction('allow_all')}
              disabled={batchUpdating}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-surface border border-separator text-label-primary hover:bg-surface-secondary transition cursor-pointer disabled:opacity-50"
              title="Grant early course access to all students"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Allow All</span>
            </button>
            <button
              type="button"
              onClick={() => handleBatchAction('revoke_all')}
              disabled={batchUpdating}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-surface border border-separator text-label-primary hover:bg-surface-secondary transition cursor-pointer disabled:opacity-50"
              title="Revoke early course access from all students"
            >
              <UserX className="w-3.5 h-3.5 text-rose-500" />
              <span>Revoke All</span>
            </button>
          </div>
        </div>

        {/* Student Access Directory Table Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col justify-between">
          {loadingStudentAccess ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 text-accent animate-spin" />
              <p className="text-xs text-label-secondary font-medium">Loading student directory...</p>
            </div>
          ) : studentAccessList.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-secondary text-label-tertiary mx-auto flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-label-primary">No Students Found</h3>
              <p className="text-xs text-label-secondary mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? `No students matching "${searchQuery}" found in the directory.`
                  : filterTab === 'allowed'
                  ? 'No students currently have early access granted.'
                  : filterTab === 'locked'
                  ? 'No locked students found.'
                  : 'No student accounts available to display.'}
              </p>
            </div>
          ) : (
            <div className="border border-separator/80 rounded-2xl overflow-hidden shadow-xs bg-surface flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-separator/70 bg-surface-secondary/60 text-[11px] font-bold text-label-secondary uppercase tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Roll No</th>
                      <th className="py-3 px-4">Department & Year</th>
                      <th className="py-3 px-4">Access Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-separator/60 text-xs">
                    {studentAccessList.map((student) => {
                      const isUpdating = updatingStudentId === student._id;

                      return (
                        <tr
                          key={student._id}
                          className="hover:bg-surface-secondary/40 transition group"
                        >
                          {/* Student Details */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold flex items-center justify-center text-xs shrink-0">
                                {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-label-primary truncate max-w-[180px]">
                                  {student.name}
                                </div>
                                <div className="text-[11px] text-label-tertiary truncate max-w-[180px]">
                                  {student.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Roll Number */}
                          <td className="py-3 px-4 font-mono text-label-primary text-xs">
                            {student.rollNo || 'N/A'}
                          </td>

                          {/* Department & Year */}
                          <td className="py-3 whitespace-nowrap px-4 text-label-secondary">
                            <span>{student.department || 'CSE'}</span>
                            {student.year && (
                              <span className="ml-1 text-[11px] text-label-tertiary">
                                • Year {student.year}
                              </span>
                            )}
                          </td>

                          {/* Access Status Pill */}
                          <td className="py-3 px-4">
                            {isPublic ? (
                              <span className="inline-flex whitespace-nowrap items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Globe className="w-3 h-3" /> Public Access
                              </span>
                            ) : student.isAllowed ? (
                              <span className="inline-flex whitespace-nowrap items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                                <Sparkles className="w-3 h-3" /> Early Access Granted
                              </span>
                            ) : (
                              <span className="inline-flex whitespace-nowrap items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-surface-secondary text-label-tertiary border border-separator">
                                <Lock className="w-3 h-3" /> Locked (Coming Soon)
                              </span>
                            )}
                          </td>

                          {/* Toggle Action */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleStudentAccess(student)}
                              disabled={isUpdating}
                              className={`inline-flex items-center whitespace-nowrap gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${
                                student.isAllowed
                                  ? 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                                  : 'bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20'
                              }`}
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : student.isAllowed ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                              <span>{student.isAllowed ? 'Revoke Access' : 'Allow Access'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Pagination Controls Bar */}
              <div className="px-4 py-3 border-t border-separator/70 bg-surface-secondary/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                {/* Left: Summary and Page Size */}
                <div className="flex items-center gap-3">
                  <span className="text-label-secondary">
                    Showing <span className="font-semibold text-label-primary">{startItem}</span>–
                    <span className="font-semibold text-label-primary">{endItem}</span> of{' '}
                    <span className="font-semibold text-label-primary">{totalItems}</span> students
                  </span>

                  <div className="flex items-center gap-1.5 pl-3 border-l border-separator/80">
                    <span className="text-label-tertiary text-[11px]">Rows:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="px-2 py-1 rounded-lg bg-surface border border-separator text-label-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer transition shadow-2xs"
                    >
                      <option value={10}>10 / page</option>
                      <option value={25}>25 / page</option>
                      <option value={50}>50 / page</option>
                      <option value={100}>100 / page</option>
                    </select>
                  </div>
                </div>

                {/* Right: Navigation Controls & Page Pill Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage <= 1 || loadingStudentAccess}
                    title="First page"
                    className="p-1.5 rounded-lg text-label-secondary hover:text-label-primary hover:bg-surface border border-separator disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || loadingStudentAccess}
                    title="Previous page"
                    className="p-1.5 rounded-lg text-label-secondary hover:text-label-primary hover:bg-surface border border-separator disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1 px-1">
                    {pageNumbers.map((p, idx) =>
                      typeof p === 'number' ? (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          disabled={loadingStudentAccess}
                          className={`min-w-7 h-7 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            currentPage === p
                              ? 'bg-accent text-white shadow-xs'
                              : 'text-label-secondary hover:text-label-primary hover:bg-surface border border-separator/60'
                          }`}
                        >
                          {p}
                        </button>
                      ) : (
                        <span key={idx} className="px-1 text-label-tertiary select-none font-mono">
                          …
                        </span>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || loadingStudentAccess}
                    title="Next page"
                    className="p-1.5 rounded-lg text-label-secondary hover:text-label-primary hover:bg-surface border border-separator disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage >= totalPages || loadingStudentAccess}
                    title="Last page"
                    className="p-1.5 rounded-lg text-label-secondary hover:text-label-primary hover:bg-surface border border-separator disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-separator/70 bg-surface/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-label-secondary">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Changes take effect immediately for active student sessions upon page refresh or course load.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-surface border border-separator text-label-primary hover:bg-surface-secondary transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentCourseAccessModal;
