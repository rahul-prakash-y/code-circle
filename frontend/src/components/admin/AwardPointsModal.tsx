import ResponsiveModal from '../ui/ResponsiveModal';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Award,
  Search,
  Calendar,
  Layers,
  CheckCircle2,
  Users,
  Check,
  AlertCircle,
  Building2,
  GraduationCap,
  Mail,
  Clock,
  Sparkles,
  Loader2,
  ShieldCheck,
  UserCheck,
  Plus,
} from 'lucide-react';
import { Button, Spinner, Checkbox } from '@heroui/react';
import { HeroUISelect } from '@/components/ui/HeroUISelect';
import { HeroChip as Chip } from '@/components/ui/hero/HeroChip';
import useAttendanceStore from '../../store/useAttendanceStore';
import useEventStore from '../../store/useEventStore';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { getStudentCollege, getStudentYear, getStudentDepartment } from '../../utils/studentUtils';
import { useDebounce } from '../../hooks/useDebounce';

interface StudentUser {
  _id: string;
  id?: string;
  name: string;
  rollNo?: string;
  email?: string;
  department?: string;
  college?: string;
  year?: string;
  profilePicUrl?: string;
  points?: number;
}

interface EnrolledParticipant {
  user: StudentUser;
  registrationType: string;
  teamName?: string;
  isLeader: boolean;
  attendanceStatus: boolean;
  enrollmentId: string;
  pointsAwarded?: number;
}

export interface AwardPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: any;
  initialSelectedStudentIds?: string[];
  initialSelectedEnrollmentIds?: string[];
  onSuccess?: (res?: any) => void;
}

export const AwardPointsModal: React.FC<AwardPointsModalProps> = ({
  isOpen,
  onClose,
  event: passedEvent,
  initialSelectedStudentIds = [],
  initialSelectedEnrollmentIds = [],
  onSuccess,
}) => {
  const { events, fetchEvents } = useEventStore();
  const { awardAttendeePoints } = useAttendanceStore() as any;

  // Selected event state (passed or selectable)
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [currentEvent, setCurrentEvent] = useState<any>(null);

  // Class Hours & Points Configuration
  const [selectedClassHours, setSelectedClassHours] = useState<number[]>([1, 2]);
  const [hourlyPoints, setHourlyPoints] = useState<number>(50);
  const [customPoints, setCustomPoints] = useState<number>(100);
  const [useClassHoursCalc, setUseClassHoursCalc] = useState<boolean>(true);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');

  // Active view tab
  const [activeTab, setActiveTab] = useState<'roster' | 'directory'>('roster');

  // Tab 1: Enrolled Participants Roster
  const [enrolledParticipants, setEnrolledParticipants] = useState<EnrolledParticipant[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState<boolean>(false);
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const debouncedRosterSearch = useDebounce<string>(rosterSearch, 300);
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'all' | 'attended' | 'unmarked'>('all');

  // Tab 2: Directory Search
  const [directorySearch, setDirectorySearch] = useState<string>('');
  const debouncedDirectorySearch = useDebounce<string>(directorySearch, 350);
  const [directoryResults, setDirectoryResults] = useState<StudentUser[]>([]);
  const [isSearchingDirectory, setIsSearchingDirectory] = useState<boolean>(false);

  // Selected Student IDs for awarding points
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<Set<string>>(new Set());

  // Existing attendance points cache (userId -> pointsAwarded)
  const [userAttendancePoints, setUserAttendancePoints] = useState<Map<string, number>>(new Map());

  // Submitting state
  const [isAwarding, setIsAwarding] = useState<boolean>(false);

  // Sync event when modal opens or passedEvent changes
  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      const eventToUse = passedEvent || (events && events.length > 0 ? events[0] : null);
      if (eventToUse) {
        setSelectedEventId(eventToUse._id);
        setCurrentEvent(eventToUse);
        const hp = Number(eventToUse.hourlyPoints) || 50;
        setHourlyPoints(hp);
        const isClub = eventToUse.type === 'Club Hour';
        setUseClassHoursCalc(isClub);
        setCustomPoints(isClub ? hp * 2 : hp);
        setCustomTitle(isClub ? `Club Hour: ${eventToUse.title}` : `Event Attendance: ${eventToUse.title}`);
      }

      // Pre-populate selections if passed
      const initialStudentSet = new Set<string>();
      if (Array.isArray(initialSelectedStudentIds)) {
        initialSelectedStudentIds.forEach((id) => id && initialStudentSet.add(id));
      }
      setSelectedStudentIds(initialStudentSet);

      const initialEnrollmentSet = new Set<string>();
      if (Array.isArray(initialSelectedEnrollmentIds)) {
        initialSelectedEnrollmentIds.forEach((id) => id && initialEnrollmentSet.add(id));
      }
      setSelectedEnrollmentIds(initialEnrollmentSet);
    }
  }, [isOpen, passedEvent, fetchEvents]);

  // Synchronize currentEvent when selectedEventId changes
  useEffect(() => {
    if (selectedEventId && events && events.length > 0) {
      const found = events.find((e: any) => e._id === selectedEventId);
      if (found) {
        setCurrentEvent(found);
        const hp = Number(found.hourlyPoints) || 50;
        setHourlyPoints(hp);
        const isClub = found.type === 'Club Hour';
        setUseClassHoursCalc(isClub);
        setCustomPoints(isClub ? hp * selectedClassHours.length : hp);
        setCustomTitle(isClub ? `Club Hour: ${found.title}` : `Event Attendance: ${found.title}`);
      }
    }
  }, [selectedEventId, events]);

  // Update points calculation when class hours change
  useEffect(() => {
    if (useClassHoursCalc) {
      setCustomPoints(selectedClassHours.length * (Number(hourlyPoints) || 50));
    }
  }, [selectedClassHours, hourlyPoints, useClassHoursCalc]);

  // Fetch roster & existing attendance records whenever selectedEventId changes
  useEffect(() => {
    if (!isOpen || !selectedEventId) return;

    let isCancelled = false;

    const loadRoster = async () => {
      setIsLoadingRoster(true);
      try {
        const [enrollmentRes, attendanceRes] = await Promise.allSettled([
          api.get(`/enrollments/event/${selectedEventId}`),
          api.get(`/attendance/records?eventId=${selectedEventId}&all=true`),
        ]);

        if (isCancelled) return;

        // Process Attendance Records for points cache
        const pointsMap = new Map<string, number>();
        if (attendanceRes.status === 'fulfilled') {
          const records = attendanceRes.value.data?.data?.records || [];
          records.forEach((r: any) => {
            const uid = r.user?._id || r.user?.id;
            if (uid) {
              const pts = r.pointsAwarded ?? r.session?.totalPoints ?? 0;
              pointsMap.set(String(uid), pts);
            }
          });
          setUserAttendancePoints(pointsMap);
        }

        // Process Enrollments
        if (enrollmentRes.status === 'fulfilled') {
          const enrollments = Array.isArray(enrollmentRes.value.data) ? enrollmentRes.value.data : [];
          const participants: EnrolledParticipant[] = [];

          enrollments.forEach((e: any) => {
            if (e.enrolledBy) {
              const u = e.enrolledBy;
              participants.push({
                user: u,
                registrationType: e.type || (e.members?.length ? 'Team' : 'Individual'),
                teamName: e.teamName,
                isLeader: true,
                attendanceStatus: Boolean(e.attendanceStatus),
                enrollmentId: e._id,
                pointsAwarded: e.pointsAwarded || pointsMap.get(String(u._id)) || 0,
              });
            }
            if (e.members && Array.isArray(e.members)) {
              e.members.forEach((m: any) => {
                if (m && m._id) {
                  participants.push({
                    user: m,
                    registrationType: e.type || 'Team',
                    teamName: e.teamName,
                    isLeader: false,
                    attendanceStatus: Boolean(e.attendanceStatus),
                    enrollmentId: e._id,
                    pointsAwarded: e.pointsAwarded || pointsMap.get(String(m._id)) || 0,
                  });
                }
              });
            }
          });

          setEnrolledParticipants(participants);

          // If no initial student selection was passed, auto-select all attended participants
          setSelectedStudentIds((prev) => {
            if (prev.size === 0 && participants.length > 0) {
              const attendedIds = new Set<string>();
              participants.forEach((p) => {
                if (p.attendanceStatus && p.user?._id) {
                  attendedIds.add(p.user._id);
                }
              });
              // If none attended, leave empty so user can select
              return attendedIds;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Failed to load event roster:', err);
      } finally {
        if (!isCancelled) setIsLoadingRoster(false);
      }
    };

    loadRoster();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, selectedEventId]);

  // Debounced directory search query
  useEffect(() => {
    if (!isOpen || activeTab !== 'directory') return;

    if (!debouncedDirectorySearch.trim()) {
      setDirectoryResults([]);
      setIsSearchingDirectory(false);
      return;
    }

    const searchUsers = async () => {
      setIsSearchingDirectory(true);
      try {
        const res = await api.get(`/users?search=${encodeURIComponent(debouncedDirectorySearch.trim())}&limit=15`);
        const list = res.data?.data?.users || res.data?.users || [];
        setDirectoryResults(list);
      } catch (err) {
        console.error('Directory search error:', err);
        setDirectoryResults([]);
      } finally {
        setIsSearchingDirectory(false);
      }
    };

    searchUsers();
  }, [isOpen, debouncedDirectorySearch, activeTab]);

  // Filtered Roster Participants
  const filteredRoster = useMemo(() => {
    return enrolledParticipants.filter((p) => {
      // Status filter
      if (rosterStatusFilter === 'attended' && !p.attendanceStatus) return false;
      if (rosterStatusFilter === 'unmarked' && p.attendanceStatus) return false;

      // Search query
      if (!debouncedRosterSearch.trim()) return true;
      const q = debouncedRosterSearch.toLowerCase();
      const u = p.user;
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.rollNo || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q) ||
        (p.teamName || '').toLowerCase().includes(q)
      );
    });
  }, [enrolledParticipants, rosterStatusFilter, debouncedRosterSearch]);

  // Toggle single student selection
  const toggleStudent = (userId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  // Select / Deselect all visible roster students
  const handleToggleAllVisible = () => {
    const visibleIds = filteredRoster.map((p) => p.user._id).filter(Boolean);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedStudentIds.has(id));

    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Submit award points
  const handleAwardPoints = async () => {
    if (!selectedEventId) {
      toast.error('Please select an event or club hour');
      return;
    }

    const studentIdsArray = Array.from(selectedStudentIds);
    const enrollmentIdsArray = Array.from(selectedEnrollmentIds);

    if (studentIdsArray.length === 0 && enrollmentIdsArray.length === 0) {
      toast.error('Please select at least one student to award points');
      return;
    }

    const points = Number(customPoints);
    if (isNaN(points) || points <= 0) {
      toast.error('Points must be a positive number');
      return;
    }

    setIsAwarding(true);
    try {
      const payload: any = {
        eventId: selectedEventId,
        studentIds: studentIdsArray,
        enrollmentIds: enrollmentIdsArray,
        points,
        classHours: useClassHoursCalc ? selectedClassHours : undefined,
        hourlyPoints: Number(hourlyPoints) || 50,
        category: 'Attendance',
        title: customTitle.trim() || (currentEvent?.type === 'Club Hour' ? `Club Hour: ${currentEvent?.title}` : `Event Attendance: ${currentEvent?.title}`),
        description: customDescription.trim() || undefined,
        markAttendance: true,
      };

      const result = await awardAttendeePoints(payload);

      if (result?.success) {
        // Update local points map
        setUserAttendancePoints((prev) => {
          const next = new Map(prev);
          studentIdsArray.forEach((id) => {
            const current = next.get(id) || 0;
            next.set(id, current + points);
          });
          return next;
        });

        // Mark attended in local roster
        setEnrolledParticipants((prev) =>
          prev.map((p) =>
            studentIdsArray.includes(p.user._id)
              ? {
                  ...p,
                  attendanceStatus: true,
                  pointsAwarded: (p.pointsAwarded || 0) + points,
                }
              : p
          )
        );

        if (onSuccess) {
          onSuccess(result);
        }

        onClose();
      }
    } catch (err: any) {
      console.error('Failed to award attendee points:', err);
    } finally {
      setIsAwarding(false);
    }
  };

  if (!isOpen) return null;

  const isClubHour = currentEvent?.type === 'Club Hour';
  const selectedCount = selectedStudentIds.size;
  const totalPointsToDistribute = selectedCount * (Number(customPoints) || 0);

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/25 flex items-center justify-center shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold text-label-primary tracking-tight">
                {isClubHour ? 'Award Club Hour Points' : 'Award Event Attendance Points'}
              </span>
              <Chip size="sm" color="warning" variant="flat" className="font-mono font-bold">
                +{customPoints || 0} pts/student
              </Chip>
            </div>
            <p className="text-xs text-label-secondary font-normal">
              Select students who attended to grant points and record verified attendance.
            </p>
          </div>
        </div>
      }
      dialogClassName="sm:max-w-4xl p-6"
    >
      <div className="space-y-4 pt-2">
        {/* Event Selector & Points Configuration Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-canvas/60 border border-separator space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-label-secondary flex items-center gap-1.5">
                <Calendar size={13} className="text-accent" />
                <span>Target Event / Club Hour</span>
              </label>
              <HeroUISelect
                value={selectedEventId}
                onChange={setSelectedEventId}
                placeholder="Choose an event or club hour..."
                options={events.map((ev: any) => ({
                  value: ev._id,
                  label: `${ev.title} (${format(new Date(ev.date || ev.startDate || Date.now()), 'MMM dd')}) — ${ev.type}`,
                }))}
                isSearchable
                size="sm"
              />
            </div>

            {/* Points to Award Controls */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-label-secondary flex items-center gap-1.5">
                  <Award size={13} className="text-amber-500" />
                  <span>Points to Award</span>
                </label>
                <div className="flex items-center gap-1">
                  {[50, 100, 150, 200].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setUseClassHoursCalc(false);
                        setCustomPoints(preset);
                      }}
                      className={`text-[10.5px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        customPoints === preset
                          ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 font-bold'
                          : 'bg-surface hover:bg-canvas text-label-secondary border-separator'
                      }`}
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={customPoints}
                  onChange={(e) => {
                    setUseClassHoursCalc(false);
                    setCustomPoints(Math.max(0, parseInt(e.target.value, 10) || 0));
                  }}
                  className="input-field text-sm font-mono font-bold text-amber-500 py-2 w-full"
                  placeholder="Points per attendee"
                />
              </div>
            </div>
          </div>

          {/* Class Hours Selector (for Club Hours) */}
          <div className="pt-2 border-t border-separator/80">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layers size={13} className="text-accent" />
                <span className="text-xs font-semibold text-label-secondary">
                  Class Hours / Periods Attended:
                </span>
                <span className="font-mono text-xs font-bold text-accent">
                  {selectedClassHours.length} Period{selectedClassHours.length > 1 ? 's' : ''} ({selectedClassHours.join(', ')})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUseClassHoursCalc(!useClassHoursCalc)}
                className="text-[11px] text-accent hover:underline font-medium cursor-pointer"
              >
                {useClassHoursCalc ? 'Using period formula (Hours × Hourly Points)' : 'Use period calculation formula'}
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((hr) => {
                const isSelected = selectedClassHours.includes(hr);
                return (
                  <button
                    key={hr}
                    type="button"
                    onClick={() => {
                      setSelectedClassHours((prev) => {
                        let next: number[];
                        if (prev.includes(hr)) {
                          if (prev.length === 1) return prev;
                          next = prev.filter((h) => h !== hr).sort((a, b) => a - b);
                        } else {
                          next = [...prev, hr].sort((a, b) => a - b);
                        }
                        if (useClassHoursCalc) {
                          setCustomPoints(next.length * (Number(hourlyPoints) || 50));
                        }
                        return next;
                      });
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer select-none ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-xs ring-1 ring-amber-500/40 font-black'
                        : 'bg-surface hover:bg-surface-elevated text-label-secondary hover:text-label-primary border border-separator'
                    }`}
                  >
                    <span className="text-[9px] uppercase opacity-75 leading-none">Period</span>
                    <span className="font-mono text-sm leading-none mt-1">{hr}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Student Selection Section */}
        <div className="surface rounded-2xl border border-separator overflow-hidden shadow-xs flex flex-col h-[380px] max-h-[380px]">
          {/* Tabs & Controls Toolbar */}
          <div className="p-3 border-b border-separator flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-canvas/40 shrink-0">
            {/* View Switcher */}
            <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-xl border border-separator">
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'roster'
                    ? 'bg-text-primary text-surface shadow-xs'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <Users size={13} />
                <span>Attendees & Registered ({enrolledParticipants.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'directory'
                    ? 'bg-text-primary text-surface shadow-xs'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <Search size={13} />
                <span>Directory Search</span>
              </button>
            </div>

            {/* Quick Actions (Select All, Filter) */}
            <div className="flex items-center gap-2">
              {activeTab === 'roster' && (
                <>
                  <div className="flex items-center gap-1 bg-canvas p-0.5 rounded-lg border border-separator text-[11px]">
                    <button
                      type="button"
                      onClick={() => setRosterStatusFilter('all')}
                      className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                        rosterStatusFilter === 'all'
                          ? 'bg-surface text-label-primary font-bold shadow-xs'
                          : 'text-label-secondary'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setRosterStatusFilter('attended')}
                      className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                        rosterStatusFilter === 'attended'
                          ? 'bg-emerald-500/20 text-emerald-500 font-bold'
                          : 'text-label-secondary'
                      }`}
                    >
                      Attended ({enrolledParticipants.filter((p) => p.attendanceStatus).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRosterStatusFilter('unmarked')}
                      className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                        rosterStatusFilter === 'unmarked'
                          ? 'bg-amber-500/20 text-amber-500 font-bold'
                          : 'text-label-secondary'
                      }`}
                    >
                      Unmarked
                    </button>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onPress={handleToggleAllVisible}
                    className="text-xs py-1 px-2.5 h-7 cursor-pointer"
                  >
                    Toggle Visible ({filteredRoster.length})
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Search bar inside container */}
          <div className="p-2.5 border-b border-separator/80 bg-surface shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-label-tertiary" size={13} />
              <input
                type="text"
                value={activeTab === 'roster' ? rosterSearch : directorySearch}
                onChange={(e) =>
                  activeTab === 'roster'
                    ? setRosterSearch(e.target.value)
                    : setDirectorySearch(e.target.value)
                }
                placeholder={
                  activeTab === 'roster'
                    ? 'Search attendees by name, roll no, department, team...'
                    : 'Search any student by roll number (e.g. 2026UEC1154), name or email...'
                }
                className="input-field text-xs pl-8 py-1.5 w-full"
              />
              {(activeTab === 'roster' ? rosterSearch : directorySearch) && (
                <button
                  type="button"
                  onClick={() =>
                    activeTab === 'roster' ? setRosterSearch('') : setDirectorySearch('')
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Student List Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
            {activeTab === 'roster' ? (
              isLoadingRoster ? (
                <div className="py-14 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
                  <p className="text-xs text-label-secondary">Loading attendee roster...</p>
                </div>
              ) : filteredRoster.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <AlertCircle className="w-7 h-7 text-label-tertiary mx-auto opacity-40" />
                  <p className="text-xs font-bold text-label-primary">No participants match the filter</p>
                  <p className="text-[11px] text-label-secondary">
                    Try clearing the search or switch to Directory Search to look up any student.
                  </p>
                </div>
              ) : (
                filteredRoster.map((p) => {
                  const student = p.user;
                  const isSelected = selectedStudentIds.has(student._id);
                  const isPresent = p.attendanceStatus;
                  const existingPts = userAttendancePoints.get(student._id) || p.pointsAwarded || 0;

                  return (
                    <div
                      key={student._id}
                      onClick={() => toggleStudent(student._id)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
                          : 'bg-surface hover:bg-canvas border-separator/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          isSelected={isSelected}
                          onChange={() => toggleStudent(student._id)}
                          className="shrink-0"
                          aria-label={`Select ${student.name || 'student'}`}
                        />

                        {/* Monogram / Avatar */}
                        <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-separator text-xs font-bold flex items-center justify-center shrink-0">
                          {student.profilePicUrl ? (
                            <img src={student.profilePicUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            student.name?.charAt(0) || 'S'
                          )}
                        </div>

                        {/* Student Meta */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-label-primary truncate">
                              {student.name}
                            </span>
                            {p.teamName && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {p.teamName}
                              </span>
                            )}
                            <span className="font-mono text-[11px] font-semibold text-label-secondary">
                              {student.rollNo || '—'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10.5px] text-label-secondary mt-0.5">
                            <span>{getStudentDepartment(student)}</span>
                            <span>•</span>
                            <span>{getStudentYear(student)}</span>
                            <span>•</span>
                            <span>{getStudentCollege(student)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Status Badges */}
                      <div className="flex items-center gap-2 shrink-0">
                        {existingPts > 0 && (
                          <Chip size="sm" color="warning" variant="flat" className="font-mono font-bold text-[10.5px]">
                            +{existingPts} pts
                          </Chip>
                        )}
                        <Chip
                          size="sm"
                          color={isPresent ? 'success' : 'default'}
                          variant="flat"
                          className="text-[10px] font-semibold uppercase"
                        >
                          {isPresent ? 'Attended' : 'Unmarked'}
                        </Chip>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* DIRECTORY SEARCH CONTENT */
              isSearchingDirectory ? (
                <div className="py-14 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
                  <p className="text-xs text-label-secondary">Searching student directory...</p>
                </div>
              ) : directoryResults.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <Search className="w-7 h-7 text-label-tertiary mx-auto opacity-40" />
                  <p className="text-xs font-bold text-label-primary">
                    {directorySearch ? 'No students found matching query' : 'Type a roll number or name to search'}
                  </p>
                  <p className="text-[11px] text-label-secondary max-w-sm mx-auto">
                    Search and select any student in the database to award them club hour attendance points.
                  </p>
                </div>
              ) : (
                directoryResults.map((student) => {
                  const isSelected = selectedStudentIds.has(student._id);
                  const existingPts = userAttendancePoints.get(student._id) || student.points || 0;

                  return (
                    <div
                      key={student._id}
                      onClick={() => toggleStudent(student._id)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
                          : 'bg-surface hover:bg-canvas border-separator/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          isSelected={isSelected}
                          onChange={() => toggleStudent(student._id)}
                          className="shrink-0"
                          aria-label={`Select ${student.name || 'student'}`}
                        />

                        <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-separator text-xs font-bold flex items-center justify-center shrink-0">
                          {student.name?.charAt(0) || 'S'}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-label-primary truncate">
                              {student.name}
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-label-secondary">
                              {student.rollNo || '—'}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-label-secondary truncate max-w-sm">
                            {student.department || 'Student'} • {student.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs text-label-secondary">
                          Current: {student.points || 0} pts
                        </span>
                        {isSelected ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500">
                            Selected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-canvas text-label-secondary border border-separator">
                            Click to select
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Footer Summary & Action Bar */}
        <div className="p-4 rounded-2xl bg-canvas border border-separator flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-mono font-bold">
              {selectedCount}
            </div>
            <div>
              <p className="font-bold text-label-primary">
                {selectedCount} student{selectedCount !== 1 ? 's' : ''} selected
              </p>
              <p className="text-label-secondary text-[11px]">
                {selectedCount > 0 ? (
                  <span>
                    Total <strong className="text-amber-500 font-mono">+{totalPointsToDistribute} points</strong> will be distributed (+{customPoints} pts each)
                  </span>
                ) : (
                  'Please select at least one student to award points'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="secondary"
              onPress={onClose}
              className="text-xs py-2 px-4 cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              color="warning"
              onPress={handleAwardPoints}
              isDisabled={isAwarding || selectedCount === 0 || !customPoints}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs py-2 px-5 rounded-xl flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isAwarding ? (
                <>
                  <Spinner size="sm" color="default" />
                  <span>Awarding points...</span>
                </>
              ) : (
                <>
                  <Award size={14} />
                  <span>Award +{customPoints} Points ({selectedCount})</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default AwardPointsModal;
