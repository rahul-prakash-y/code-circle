import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Filter,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import api from '../../../lib/axios';
import { formatISTDateTime } from '../../../lib/dateUtils';

export interface BlockedStudent {
  _id: string;
  name: string;
  rollNo?: string;
  email: string;
  profilePicUrl?: string;
  department?: string;
  year?: string | number;
  blockedAt?: Date | string;
  blockSource: 'THIS_EVENT' | 'CONTEST' | 'ASSESSMENT' | 'COURSE' | 'GLOBAL' | string;
  blockReason?: string;
  isBlockedInThisEvent?: boolean;
  isRestrictedGlobally?: boolean;
}

export interface BlockedStudentsTabProps {
  eventId: string;
  eventTitle?: string;
  onStudentUnblocked?: () => void;
}

export const BlockedStudentsTab: React.FC<BlockedStudentsTabProps> = React.memo(({
  eventId,
  eventTitle = 'Event',
  onStudentUnblocked,
}) => {
  const [blockedStudents, setBlockedStudents] = useState<BlockedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'THIS_EVENT' | 'CONTEST' | 'ASSESSMENT' | 'COURSE' | 'GLOBAL'>('ALL');
  const [unblockingIds, setUnblockingIds] = useState<Set<string>>(new Set());
  const [isUnblockingAll, setIsUnblockingAll] = useState(false);

  const fetchBlockedStudents = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await api.get(`/events/${eventId}/blocked-students`);
      if (res.data?.success) {
        setBlockedStudents(res.data.blockedStudents || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch blocked students:', err);
      toast.error('Failed to load blocked students.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchBlockedStudents();
  }, [fetchBlockedStudents]);

  // Handle single student unblock
  const handleUnblock = async (student: BlockedStudent, unblockAll = true) => {
    setUnblockingIds((prev) => new Set(prev).add(student._id));
    try {
      const res = await api.post(`/events/${eventId}/arena/unblock-student`, {
        studentId: student._id,
        unblockAll,
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Unblocked ${student.name || student.rollNo} successfully!`);
        setBlockedStudents((prev) => prev.filter((s) => s._id !== student._id));
        if (onStudentUnblocked) onStudentUnblocked();
      } else {
        toast.error(res.data?.error || 'Failed to unblock student');
      }
    } catch (err: any) {
      console.error('Unblock error:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to unblock student');
    } finally {
      setUnblockingIds((prev) => {
        const next = new Set(prev);
        next.delete(student._id);
        return next;
      });
    }
  };

  // Handle unblock all students
  const handleUnblockAll = async () => {
    if (blockedStudents.length === 0) return;
    setIsUnblockingAll(true);
    try {
      let successCount = 0;
      for (const student of blockedStudents) {
        try {
          await api.post(`/events/${eventId}/arena/unblock-student`, {
            studentId: student._id,
            unblockAll: true,
          });
          successCount++;
        } catch (e) {
          console.error(`Failed to unblock ${student._id}`, e);
        }
      }

      toast.success(`Successfully unblocked ${successCount} student(s)!`);
      fetchBlockedStudents();
      if (onStudentUnblocked) onStudentUnblocked();
    } catch (err: any) {
      toast.error('Failed to unblock all students');
    } finally {
      setIsUnblockingAll(false);
    }
  };

  // Filter students based on search and source
  const filteredStudents = useMemo(() => {
    return blockedStudents.filter((s) => {
      const matchesSearch =
        !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.blockReason && s.blockReason.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSource =
        sourceFilter === 'ALL' || s.blockSource === sourceFilter;

      return matchesSearch && matchesSource;
    });
  }, [blockedStudents, searchQuery, sourceFilter]);

  const sourceCounts = useMemo(() => {
    const counts = { ALL: blockedStudents.length, THIS_EVENT: 0, CONTEST: 0, ASSESSMENT: 0, COURSE: 0, GLOBAL: 0 };
    blockedStudents.forEach((s) => {
      if (s.blockSource in counts) {
        counts[s.blockSource as keyof typeof counts]++;
      }
    });
    return counts;
  }, [blockedStudents]);

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'THIS_EVENT':
        return {
          label: 'This Event Arena',
          color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        };
      case 'CONTEST':
        return {
          label: 'Contest Lockout',
          color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        };
      case 'ASSESSMENT':
        return {
          label: 'Assessment Lockout',
          color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        };
      case 'COURSE':
        return {
          label: 'Course Lockout',
          color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
        };
      case 'GLOBAL':
        return {
          label: 'Global Account Lock',
          color: 'bg-red-600/20 text-red-400 border-red-500/40',
        };
      default:
        return {
          label: 'Anti-Cheat Lock',
          color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Statistics Banner */}
      <div className="p-4 rounded-2xl bg-surface border border-separator/80 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-label-primary">Blocked & Restricted Participants</h3>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                blockedStudents.length > 0
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {blockedStudents.length} {blockedStudents.length === 1 ? 'student' : 'students'}
              </span>
            </div>
            <p className="text-xs text-label-secondary mt-0.5">
              Review and instantly unblock students locked out due to tab switches, browser blur, or cross-contest violations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="bordered"
            isLoading={loading}
            onPress={fetchBlockedStudents}
            startContent={!loading ? <RefreshCw size={13} /> : undefined}
            className="rounded-xl text-xs font-semibold cursor-pointer"
          >
            Refresh
          </Button>

          {blockedStudents.length > 0 && (
            <Button
              size="sm"
              variant="solid"
              color="danger"
              isLoading={isUnblockingAll}
              onPress={handleUnblockAll}
              startContent={!isUnblockingAll ? <Unlock size={13} /> : undefined}
              className="rounded-xl text-xs font-bold text-white shadow-lg shadow-rose-500/20 cursor-pointer"
            >
              Unblock All ({blockedStudents.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Source Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {(['ALL', 'THIS_EVENT', 'CONTEST', 'ASSESSMENT', 'GLOBAL'] as const).map((src) => {
            const isActive = sourceFilter === src;
            const count = sourceCounts[src as keyof typeof sourceCounts] || 0;
            const labels: Record<string, string> = {
              ALL: 'All Blocked',
              THIS_EVENT: 'This Event Arena',
              CONTEST: 'Contest Lock',
              ASSESSMENT: 'Assessment Lock',
              GLOBAL: 'Global Lock',
            };
            return (
              <button
                key={src}
                type="button"
                onClick={() => setSourceFilter(src)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-surface hover:bg-surface-secondary text-label-secondary border border-separator/80'
                }`}
              >
                <span>{labels[src]}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-black/25 text-white' : 'bg-canvas text-label-tertiary'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-label-tertiary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by roll no, name, email..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface border border-separator text-xs text-label-primary outline-none focus:border-rose-500 transition placeholder:text-label-tertiary"
          />
        </div>
      </div>

      {/* Blocked Students List */}
      {loading && blockedStudents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-surface border border-separator flex flex-col items-center justify-center space-y-3">
          <Spinner size="md" color="danger" />
          <p className="text-xs text-label-secondary">Loading blocked participants...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-surface border border-separator/80 space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UserCheck size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-label-primary">No Blocked Students Found</h4>
            <p className="text-xs text-label-tertiary mt-1">
              {blockedStudents.length === 0
                ? 'All enrolled students are in good standing and have unrestricted access to the Event Arena.'
                : 'No blocked students match your search filter.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredStudents.map((student) => {
            const isUnblocking = unblockingIds.has(student._id);
            const badge = getSourceBadge(student.blockSource);

            return (
              <motion.div
                key={student._id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-2xl bg-surface border border-separator/80 hover:border-rose-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                {/* Left: Student Identity & Avatar */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-sm shrink-0 shadow-xs">
                    {student.profilePicUrl ? (
                      <img
                        src={student.profilePicUrl}
                        alt={student.name}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      student.name?.charAt(0)?.toUpperCase() || 'S'
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-label-primary truncate">
                        {student.name}
                      </span>
                      {student.rollNo && (
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-surface-secondary text-label-secondary border border-separator">
                          {student.rollNo}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-label-tertiary mt-1">
                      <span>{student.email}</span>
                      {student.department && <span>• {student.department}</span>}
                      {student.year && <span>• Year {student.year}</span>}
                    </div>

                    {/* Block Reason Note */}
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-300">
                      <AlertTriangle size={12} className="shrink-0 text-rose-400" />
                      <span className="font-medium text-[11px] line-clamp-1">{student.blockReason || 'Proctoring violation'}</span>
                      {student.blockedAt && (
                        <span className="text-[10px] text-label-tertiary font-mono ml-auto sm:ml-2">
                          ({formatISTDateTime(student.blockedAt)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Unblock Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="solid"
                    color="danger"
                    isLoading={isUnblocking}
                    isDisabled={isUnblocking || isUnblockingAll}
                    onPress={() => handleUnblock(student, true)}
                    startContent={!isUnblocking ? <Unlock size={13} /> : undefined}
                    className="rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
                  >
                    Unblock Student
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
});

BlockedStudentsTab.displayName = 'BlockedStudentsTab';

export default BlockedStudentsTab;
