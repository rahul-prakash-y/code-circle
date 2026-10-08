import React, { useState, useEffect, useMemo } from 'react';
import ResponsiveModal from '../ui/ResponsiveModal';
import useDomainStore from '../../store/useDomainStore';
import { IDomain, IEnrolledStudent } from '../../types/domain';
import {
  Users,
  Search,
  Download,
  CheckCircle2,
  Clock,
  BookOpen,
  GraduationCap,
  Sparkles,
  Loader2,
  Calendar,
  Mail,
  Building2,
  Shield,
  Layers,
} from 'lucide-react';

interface RegisteredStudentsModalProps {
  isOpen: boolean;
  domain: IDomain;
  onClose: () => void;
}

export const RegisteredStudentsModal: React.FC<RegisteredStudentsModalProps> = ({
  isOpen,
  domain,
  onClose,
}) => {
  const { fetchEnrolledStudents, enrolledStudents, loadingStudents } = useDomainStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enrolled' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    if (isOpen && domain?._id) {
      fetchEnrolledStudents(domain._id);
    }
  }, [isOpen, domain?._id, fetchEnrolledStudents]);

  // Client-side filtering for immediate snappy responsiveness
  const filteredStudents = useMemo(() => {
    return enrolledStudents.filter((student) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        student.user?.name?.toLowerCase().includes(q) ||
        student.user?.rollNo?.toLowerCase().includes(q) ||
        student.user?.email?.toLowerCase().includes(q) ||
        student.user?.department?.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (filterStatus === 'all') return true;
      return student.status === filterStatus;
    });
  }, [enrolledStudents, searchQuery, filterStatus]);

  // Aggregate stats
  const totalEnrolled = enrolledStudents.length;
  const totalCompleted = enrolledStudents.filter((s) => s.status === 'completed' || s.progressPercentage === 100).length;
  const totalInProgress = enrolledStudents.filter((s) => s.status === 'in_progress').length;

  // CSV Export utility
  const handleExportCSV = () => {
    if (enrolledStudents.length === 0) return;

    const headers = ['Roll No', 'Name', 'Email', 'Department', 'Year', 'Registered Date', 'Progress %', 'Levels Completed', 'Status'];
    const rows = enrolledStudents.map((s) => [
      `"${s.user?.rollNo || ''}"`,
      `"${s.user?.name || ''}"`,
      `"${s.user?.email || ''}"`,
      `"${s.user?.department || ''}"`,
      `"${s.user?.year || ''}"`,
      `"${s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString() : ''}"`,
      `"${s.progressPercentage || 0}%"`,
      `"${s.completedLevelsCount || 0}/${s.totalLevels || 0}"`,
      `"${s.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const cleanName = domain.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    link.setAttribute('download', `${cleanName}-registered-students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string, percentage: number) => {
    if (status === 'completed' || percentage === 100) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> Mastered
        </span>
      );
    }
    if (status === 'in_progress' || percentage > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent/10 text-accent border border-accent/20">
          <Clock className="w-3 h-3" /> In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-secondary text-label-secondary border border-separator">
        Enrolled
      </span>
    );
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center justify-between gap-4 w-full pr-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-label-primary">Registered Students</div>
              <div className="text-xs text-label-secondary font-medium line-clamp-1">{domain.name}</div>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent/10 text-accent border border-accent/20">
            {totalEnrolled} {totalEnrolled === 1 ? 'Student' : 'Students'}
          </span>
        </div>
      }
      description="View and manage enrolled students, track curriculum progression, and export roster data."
      dialogClassName="sm:max-w-4xl max-h-[85vh] p-6 flex flex-col"
    >
      <div className="space-y-4 pt-2 flex-1 flex flex-col min-h-0">
        {/* Quick KPI Strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-surface-secondary/70 border border-separator/80">
            <div className="text-[11px] font-semibold text-label-secondary uppercase tracking-wider">
              Total Enrolled
            </div>
            <div className="text-lg font-bold text-label-primary mt-0.5">{totalEnrolled}</div>
          </div>
          <div className="p-3 rounded-2xl bg-accent/5 border border-accent/15">
            <div className="text-[11px] font-semibold text-accent uppercase tracking-wider">
              In Progress
            </div>
            <div className="text-lg font-bold text-accent mt-0.5">{totalInProgress}</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Mastered / Done
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{totalCompleted}</div>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-label-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, roll number, email, or dept..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-separator/80 text-xs text-label-primary placeholder:text-label-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Status Tabs */}
            <div className="flex items-center p-0.5 rounded-xl bg-surface-secondary border border-separator text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-surface text-label-primary shadow-xs font-semibold'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('in_progress')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  filterStatus === 'in_progress'
                    ? 'bg-surface text-label-primary shadow-xs font-semibold'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('completed')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  filterStatus === 'completed'
                    ? 'bg-surface text-label-primary shadow-xs font-semibold'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                Mastered
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={enrolledStudents.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-separator text-label-primary hover:bg-surface-secondary active:scale-98 transition disabled:opacity-50 cursor-pointer shadow-xs"
              title="Download roster as CSV"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Scrollable Students Table / List */}
        <div className="flex-1 overflow-y-auto min-h-[280px] max-h-[460px] rounded-2xl border border-separator/80 bg-surface divide-y divide-separator/60">
          {loadingStudents ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mb-2" />
              <p className="text-xs text-label-secondary">Loading registered students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center p-6">
              <Users className="w-10 h-10 stroke-1 text-label-tertiary mb-2" />
              <p className="text-sm font-semibold text-label-primary">No registered students found</p>
              <p className="text-xs text-label-secondary mt-0.5">
                {searchQuery
                  ? 'No students matched your search criteria.'
                  : 'No students have registered for this course yet.'}
              </p>
            </div>
          ) : (
            filteredStudents.map((item) => {
              const u = item.user;
              const initials = u?.name
                ? u.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'ST';

              return (
                <div
                  key={item.enrollmentId}
                  className="p-4 hover:bg-surface-secondary/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: User Avatar + Basic Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    {u?.profilePicUrl ? (
                      <img
                        src={u.profilePicUrl}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover border border-separator shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-label-primary truncate">
                          {u?.name || 'Unnamed Student'}
                        </span>
                        {u?.rollNo && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-secondary border border-separator text-label-secondary">
                            {u.rollNo}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-label-secondary mt-0.5">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-label-tertiary" /> {u?.email}
                        </span>
                        {u?.department && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-label-tertiary" /> {u.department}
                            {u?.year ? ` • Year ${u.year}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress & Status */}
                  <div className="flex items-center gap-4 sm:shrink-0 justify-between sm:justify-end">
                    {/* Progress Bar & Metric */}
                    <div className="w-32 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-medium text-label-secondary">
                        <span>{item.completedLevelsCount} / {item.totalLevels} Lvls</span>
                        <span className="font-bold text-label-primary">{item.progressPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.progressPercentage === 100
                              ? 'bg-emerald-500'
                              : 'bg-accent'
                          }`}
                          style={{ width: `${item.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">{getStatusBadge(item.status, item.progressPercentage)}</div>

                    {/* Registered Date */}
                    <div className="hidden md:flex flex-col items-end text-[11px] text-label-tertiary shrink-0">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.enrolledAt ? new Date(item.enrolledAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default RegisteredStudentsModal;
