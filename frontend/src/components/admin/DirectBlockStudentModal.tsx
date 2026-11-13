import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Ban,
  ShieldAlert,
  UserX,
  Calendar,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';

export interface DirectBlockStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface StudentCandidate {
  _id: string;
  name: string;
  rollNo?: string;
  email: string;
  department?: string;
  year?: string | number;
  profilePicUrl?: string;
  isBlocked?: boolean;
  isRestricted?: boolean;
  restrictionReason?: string;
}

interface EventItem {
  _id: string;
  title: string;
  eventCode?: string;
  date?: string;
  hasArena?: boolean;
  status?: string;
}

const REASON_PRESETS = [
  'Exceeded maximum 3 tab switch violations',
  'Navigated away / window switch during proctored test',
  'Suspicious multi-device login detected',
  'Secondary monitor / screen-sharing breach',
  'Malpractice / unauthorized reference during test',
  'Administrative security hold',
];

export const DirectBlockStudentModal: React.FC<DirectBlockStudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<StudentCandidate[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentCandidate | null>(null);

  const [category, setCategory] = useState<'GLOBAL' | 'EVENT' | 'ASSESSMENT' | 'CONTEST'>('EVENT');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [reason, setReason] = useState<string>(REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search students with debounce
  useEffect(() => {
    if (!isOpen || selectedStudent) return;
    if (!searchQuery.trim()) {
      setCandidates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get('/admin/blocked-students/search-candidates', {
          params: { query: searchQuery.trim() },
        });
        if (res.data?.success) {
          setCandidates(res.data.candidates || []);
        }
      } catch (err) {
        console.error('Failed to search student candidates:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, selectedStudent]);

  // Fetch events when modal opens or category is EVENT
  useEffect(() => {
    if (!isOpen) return;
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const res = await api.get('/admin/blocked-students/events');
        if (res.data?.success) {
          const evList: EventItem[] = res.data.events || [];
          setEvents(evList);
          if (evList.length > 0 && !selectedEventId) {
            setSelectedEventId(evList[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch events for block modal:', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [isOpen]);

  // Reset state on close
  const handleClose = () => {
    setSelectedStudent(null);
    setSearchQuery('');
    setCandidates([]);
    setCustomReason('');
    setReason(REASON_PRESETS[0]);
    onClose();
  };

  const handleSelectStudent = (student: StudentCandidate) => {
    setSelectedStudent(student);
    setCandidates([]);
  };

  const handleBlock = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student to block');
      return;
    }

    if (category === 'EVENT' && !selectedEventId) {
      toast.error('Please select an event to block the student from');
      return;
    }

    const finalReason = customReason.trim() ? customReason.trim() : reason;
    setIsSubmitting(true);

    try {
      const res = await api.post('/admin/blocked-students/block', {
        studentIdentifier: selectedStudent._id,
        category,
        eventId: category === 'EVENT' ? selectedEventId : undefined,
        reason: finalReason,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Student blocked successfully');
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.data?.error || 'Failed to block student');
      }
    } catch (err: any) {
      console.error('Error blocking student:', err);
      toast.error(err.response?.data?.error || 'Failed to block student');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl bg-surface border border-separator rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-separator pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive">
                <Ban size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-label-primary tracking-tight">
                  Direct Block Student
                </h3>
                <p className="text-xs text-text-muted">
                  Enforce immediate proctoring lockout or account restriction
                </p>
              </div>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={handleClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white w-8 h-8 cursor-pointer"
            >
              <X size={16} />
            </Button>
          </div>

          {/* 1. Student Search & Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-label-primary block">
              1. Select Student to Block <span className="text-destructive">*</span>
            </label>

            {!selectedStudent ? (
              <div className="relative">
                <div className="relative flex items-center">
                  <Search size={16} className="absolute left-3 text-label-tertiary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Roll Number, Name, Email, or Department..."
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder:text-label-tertiary focus:border-primary outline-none transition-colors"
                  />
                  {isSearching && (
                    <Spinner size="sm" className="absolute right-3" color="current" />
                  )}
                </div>

                {/* Candidate Dropdown Results */}
                {candidates.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl bg-surface border border-separator shadow-2xl z-20 divide-y divide-separator">
                    {candidates.map((cand) => (
                      <button
                        key={cand._id}
                        type="button"
                        onClick={() => handleSelectStudent(cand)}
                        className="w-full text-left p-3 hover:bg-white/5 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs shrink-0 overflow-hidden">
                            {cand.profilePicUrl ? (
                              <img src={cand.profilePicUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              cand.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-label-primary truncate">{cand.name}</p>
                            <p className="text-[11px] text-text-muted font-mono truncate">
                              {cand.rollNo || 'No Roll No'} &bull; {cand.department || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {cand.isBlocked && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/15 text-destructive border border-destructive/30">
                              Blocked
                            </span>
                          )}
                          {cand.isRestricted && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/15 text-warning border border-warning/30">
                              Restricted
                            </span>
                          )}
                          <span className="text-[11px] text-primary font-semibold hover:underline">Select</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.trim().length > 1 && !isSearching && candidates.length === 0 && (
                  <div className="p-3 text-center text-xs text-text-muted bg-surface-secondary border border-separator rounded-xl mt-1">
                    No matching students found for &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-surface-secondary border border-primary/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0 overflow-hidden">
                    {selectedStudent.profilePicUrl ? (
                      <img src={selectedStudent.profilePicUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      selectedStudent.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-label-primary truncate">{selectedStudent.name}</p>
                    <p className="text-[11px] text-text-muted font-mono truncate">
                      {selectedStudent.rollNo || 'No Roll No'} &bull; {selectedStudent.email}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => setSelectedStudent(null)}
                  className="text-[11px] font-bold text-label-secondary hover:text-white cursor-pointer"
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          {/* 2. Category Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-label-primary block">
              2. Select Enforcement Scope <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'EVENT', label: 'Event Arena', icon: Calendar, color: 'border-amber-500 text-amber-400 bg-amber-500/10' },
                { key: 'ASSESSMENT', label: 'Assessments', icon: ShieldAlert, color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
                { key: 'CONTEST', label: 'Contests', icon: Layers, color: 'border-purple-500 text-purple-400 bg-purple-500/10' },
                { key: 'GLOBAL', label: 'Global Lock', icon: Lock, color: 'border-destructive text-destructive bg-destructive/10' },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key as any)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? `${cat.color} font-bold shadow-md`
                        : 'bg-surface-secondary border-separator text-label-secondary hover:text-label-primary hover:border-white/20'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-xs">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2.1 Event Picker (If category is EVENT) */}
          {category === 'EVENT' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-label-primary block">
                Target Event <span className="text-destructive">*</span>
              </label>
              {loadingEvents ? (
                <div className="p-2.5 text-center text-xs text-text-muted">Loading events...</div>
              ) : (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary focus:border-amber-500 outline-none cursor-pointer"
                >
                  {events.map((ev) => (
                    <option key={ev._id} value={ev._id}>
                      {ev.title} {ev.hasArena ? '(Event Arena)' : ''} &bull; {ev.status || 'Active'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* 3. Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-label-primary block">
              3. Violation Reason <span className="text-destructive">*</span>
            </label>
            <div className="space-y-1.5">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary focus:border-primary outline-none cursor-pointer"
              >
                {REASON_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>

              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Or type a custom restriction reason here..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary focus:border-primary outline-none resize-none transition-colors"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-separator">
            <Button
              size="sm"
              variant="light"
              onPress={handleClose}
              isDisabled={isSubmitting}
              className="text-xs font-bold text-label-secondary hover:bg-white/10 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              color="danger"
              variant="solid"
              isLoading={isSubmitting}
              isDisabled={!selectedStudent || isSubmitting}
              onPress={handleBlock}
              startContent={!isSubmitting ? <Ban size={14} /> : undefined}
              className="px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-destructive/20 cursor-pointer"
            >
              Confirm & Block Student
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DirectBlockStudentModal;
