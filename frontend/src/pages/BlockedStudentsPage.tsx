import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ban,
  ShieldAlert,
  Search,
  RefreshCw,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Filter,
  Calendar,
  Layers,
  Lock,
  Plus,
  BookOpen,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { formatISTDateTime } from '@/lib/dateUtils';
import DirectBlockStudentModal from '@/components/admin/DirectBlockStudentModal';

export interface UnifiedBlockedStudent {
  id: string;
  studentId: string;
  name: string;
  rollNo: string;
  email: string;
  department?: string;
  year?: string | number;
  profilePicUrl?: string;
  category: 'GLOBAL' | 'EVENT' | 'ASSESSMENT' | 'CONTEST' | 'COURSE';
  categoryLabel: string;
  blockReason: string;
  sourceTitle: string;
  eventId?: string;
  eventTitle?: string;
  blockedAt: Date | string;
  restrictedFeatures?: string[];
  isRestrictedGlobally: boolean;
  isAccountBlocked: boolean;
  isBlockedInEvent?: boolean;
}

export const BlockedStudentsPage: React.FC = () => {
  const [blockedStudents, setBlockedStudents] = useState<UnifiedBlockedStudent[]>([]);
  const [counts, setCounts] = useState<{
    all: number;
    global: number;
    event: number;
    assessment: number;
    contest: number;
    course: number;
  }>({
    all: 0,
    global: 0,
    event: 0,
    assessment: 0,
    contest: 0,
    course: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [unblockingIds, setUnblockingIds] = useState<Set<string>>(new Set());

  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // Fetch all blocked students
  const fetchBlockedStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/blocked-students', {
        params: {
          category: activeCategory !== 'all' ? activeCategory : undefined,
          search: searchQuery.trim() || undefined,
        },
      });

      if (res.data?.success) {
        setBlockedStudents(res.data.blockedStudents || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch blocked students:', err);
      toast.error(err.response?.data?.error || 'Failed to load blocked students list.');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    fetchBlockedStudents();
  }, [fetchBlockedStudents]);

  // Handle single student unblock
  const handleUnblock = async (student: UnifiedBlockedStudent, scope: 'SPECIFIC' | 'ALL' = 'SPECIFIC') => {
    setUnblockingIds((prev) => new Set(prev).add(student.id));
    try {
      const res = await api.post('/admin/blocked-students/unblock', {
        studentId: student.studentId,
        category: scope === 'ALL' ? 'ALL' : student.category,
        eventId: student.eventId,
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Unblocked ${student.name} successfully!`);
        if (scope === 'ALL') {
          setBlockedStudents((prev) => prev.filter((s) => s.studentId !== student.studentId));
        } else {
          setBlockedStudents((prev) => prev.filter((s) => s.id !== student.id));
        }
        // Refetch counts
        fetchBlockedStudents();
      } else {
        toast.error(res.data?.error || 'Failed to unblock student');
      }
    } catch (err: any) {
      console.error('Unblock error:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to unblock student');
    } finally {
      setUnblockingIds((prev) => {
        const next = new Set(prev);
        next.delete(student.id);
        return next;
      });
    }
  };

  // Category badge rendering helper
  const renderCategoryBadge = (category: string) => {
    switch (category) {
      case 'EVENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Calendar size={12} />
            Event Arena
          </span>
        );
      case 'ASSESSMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <ShieldAlert size={12} />
            Assessment
          </span>
        );
      case 'CONTEST':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Layers size={12} />
            Contest
          </span>
        );
      case 'COURSE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <BookOpen size={12} />
            Course
          </span>
        );
      case 'GLOBAL':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-destructive/15 text-destructive border border-destructive/30">
            <Lock size={12} />
            Global Lock
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 space-y-6 select-none"
    >
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-separator">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive">
              <ShieldAlert size={20} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-label-primary tracking-tight">
              Blocked Students Console
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted">
            System-wide proctoring violation tracker, tab switch enforcement, and direct student blocking
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            size="sm"
            variant="flat"
            onPress={fetchBlockedStudents}
            isDisabled={loading}
            startContent={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            className="flex-1 sm:flex-none text-xs font-bold text-label-secondary hover:text-white bg-surface-secondary border border-separator rounded-xl cursor-pointer"
          >
            Refresh
          </Button>

          <Button
            size="sm"
            color="danger"
            variant="solid"
            onPress={() => setIsBlockModalOpen(true)}
            startContent={<Ban size={15} />}
            className="flex-1 sm:flex-none text-xs font-bold text-white bg-destructive hover:bg-destructive-hover shadow-lg shadow-destructive/20 rounded-xl cursor-pointer px-4"
          >
            Direct Block Student
          </Button>
        </div>
      </div>

      {/* 2. KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: 'all', label: 'Total Blocked', count: counts.all, color: 'text-label-primary', border: 'border-separator' },
          { key: 'event', label: 'Event Arena', count: counts.event, color: 'text-amber-400', border: 'border-amber-500/30' },
          { key: 'assessment', label: 'Assessments', count: counts.assessment, color: 'text-blue-400', border: 'border-blue-500/30' },
          { key: 'contest', label: 'Contests', count: counts.contest, color: 'text-purple-400', border: 'border-purple-500/30' },
          { key: 'global', label: 'Global Locks', count: counts.global, color: 'text-destructive', border: 'border-destructive/30' },
        ].map((card) => {
          const isSelected = activeCategory === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setActiveCategory(card.key)}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-surface border-primary shadow-lg shadow-primary/10 ring-1 ring-primary'
                  : `bg-surface/60 ${card.border} hover:bg-surface hover:border-white/20`
              }`}
            >
              <span className="text-[10.5px] uppercase font-bold tracking-wider text-text-muted block">
                {card.label}
              </span>
              <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight mt-1 block ${card.color}`}>
                {card.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-surface border border-separator">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Violations', count: counts.all },
            { id: 'event', label: 'Event Arena', count: counts.event },
            { id: 'assessment', label: 'Assessments', count: counts.assessment },
            { id: 'contest', label: 'Contests', count: counts.contest },
            { id: 'global', label: 'Global Locks', count: counts.global },
            { id: 'course', label: 'Courses', count: counts.course },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-surface-secondary text-label-secondary hover:text-label-primary hover:bg-white/5'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-normal ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-label-tertiary'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-label-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, roll no, reason..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder:text-label-tertiary focus:border-primary outline-none transition-colors"
          />
        </div>
      </div>

      {/* 4. Table / Content Section */}
      <div className="rounded-2xl bg-surface border border-separator overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-text-muted">
            <Spinner size="lg" color="primary" />
            <p className="text-xs font-medium">Loading blocked student records...</p>
          </div>
        ) : blockedStudents.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="text-base font-bold text-label-primary">No Blocked Students Found</h3>
            <p className="text-xs text-text-muted max-w-sm">
              {searchQuery.trim()
                ? `No blocked students match "${searchQuery}". Try a different keyword.`
                : activeCategory !== 'all'
                ? `There are currently zero blocked students in the ${activeCategory} category.`
                : 'All students are in good standing! No proctoring locks or account bans are currently active.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-separator bg-surface-secondary/40 text-[11px] font-bold text-label-tertiary uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Candidate Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Activity Source</th>
                  <th className="py-3 px-4">Violation Details</th>
                  <th className="py-3 px-4">Blocked Date</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-separator text-xs">
                {blockedStudents.map((student) => {
                  const isUnblocking = unblockingIds.has(student.id);

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Candidate Column */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
                            {student.profilePicUrl ? (
                              <img src={student.profilePicUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              student.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-label-primary truncate">{student.name}</p>
                            <p className="text-[11px] text-text-muted font-mono truncate">
                              {student.rollNo || 'N/A'} &bull; {student.department || 'N/A'}
                            </p>
                            <p className="text-[10px] text-label-tertiary truncate">{student.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderCategoryBadge(student.category)}
                      </td>

                      {/* Source Activity Column */}
                      <td className="py-3.5 px-4">
                        <div className="max-w-[200px]">
                          <p className="font-semibold text-label-primary truncate">{student.sourceTitle}</p>
                          {student.eventId && (
                            <span className="text-[10px] font-mono text-label-tertiary block truncate">
                              ID: {student.eventId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Violation / Reason Column */}
                      <td className="py-3.5 px-4">
                        <div className="max-w-[280px]">
                          <p className="text-amber-400 font-medium text-xs leading-relaxed flex items-start gap-1.5">
                            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                            <span>{student.blockReason}</span>
                          </p>
                        </div>
                      </td>

                      {/* Blocked Date Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] font-mono text-text-muted">
                        {formatISTDateTime(student.blockedAt)}
                      </td>

                      {/* Action Column */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            color="success"
                            isLoading={isUnblocking}
                            isDisabled={isUnblocking}
                            startContent={!isUnblocking ? <Unlock size={13} /> : undefined}
                            onPress={() => handleUnblock(student, 'SPECIFIC')}
                            className="text-xs font-bold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-xl cursor-pointer"
                          >
                            Unblock
                          </Button>

                          {student.isRestrictedGlobally && (
                            <Button
                              size="sm"
                              variant="light"
                              isLoading={isUnblocking}
                              isDisabled={isUnblocking}
                              onPress={() => handleUnblock(student, 'ALL')}
                              className="text-[11px] font-semibold text-text-muted hover:text-white cursor-pointer"
                            >
                              Unblock All
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Direct Block Student Modal */}
      <DirectBlockStudentModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onSuccess={fetchBlockedStudents}
      />
    </motion.div>
  );
};

export default BlockedStudentsPage;
