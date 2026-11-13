import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  X,
  Users,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { toast } from 'react-hot-toast';
import api from '../../../lib/axios';
import HeroUISelect, { HeroUISelectOption } from '../../ui/HeroUISelect';

export interface ManualPaperSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  maxScore: number;
  passingPercentage?: number;
  onSubmit: (data: {
    studentIdentifier: string;
    score: number;
    mcqScore?: number;
    codingScore?: number;
    manualNotes?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const ManualPaperSubmissionModal: React.FC<ManualPaperSubmissionModalProps> = React.memo(({
  isOpen,
  onClose,
  eventId,
  maxScore,
  passingPercentage = 50,
  onSubmit,
  isSubmitting,
}) => {
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [score, setScore] = useState<string>('');
  const [mcqScore, setMcqScore] = useState<string>('');
  const [codingScore, setCodingScore] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Load enrolled students for this event to populate the HeroUI Select dropdown
  useEffect(() => {
    if (!isOpen || !eventId) return;
    let isMounted = true;
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const res = await api.get(`/enrollments/event/${eventId}`);
        const list = res.data?.data || res.data || [];
        const studentsList: any[] = [];
        const seenIds = new Set<string>();

        list.forEach((enr: any) => {
          const user = enr.enrolledBy;
          if (user && user._id && !seenIds.has(user._id)) {
            seenIds.add(user._id);
            studentsList.push({
              _id: user._id,
              name: user.name || 'Unknown Student',
              rollNo: user.rollNo || '',
              email: user.email || '',
              department: user.department || '',
              attendanceStatus: Boolean(enr.attendanceStatus),
            });
          }
          if (Array.isArray(enr.members)) {
            enr.members.forEach((m: any) => {
              if (m && m._id && !seenIds.has(m._id)) {
                seenIds.add(m._id);
                studentsList.push({
                  _id: m._id,
                  name: m.name || 'Unknown Member',
                  rollNo: m.rollNo || '',
                  email: m.email || '',
                  department: m.department || '',
                  attendanceStatus: Boolean(enr.attendanceStatus),
                });
              }
            });
          }
        });

        studentsList.sort((a, b) => (a.rollNo || a.name).localeCompare(b.rollNo || b.name));
        if (isMounted) {
          setEnrolledStudents(studentsList);
        }
      } catch (err) {
        console.error('Failed to load event students for paper submission', err);
      } finally {
        if (isMounted) setLoadingStudents(false);
      }
    };
    fetchStudents();
    return () => {
      isMounted = false;
    };
  }, [isOpen, eventId]);

  // Options for HeroUISelect
  const selectOptions: HeroUISelectOption[] = useMemo(() => {
    return enrolledStudents.map((s) => ({
      value: s.rollNo || s.email || s._id,
      label: s.rollNo ? `${s.rollNo} — ${s.name}` : s.name,
      description: `${s.email}${s.department ? ` • ${s.department}` : ''}`,
      badge: s.attendanceStatus ? 'Present' : 'Enrolled',
    }));
  }, [enrolledStudents]);

  // Selected student object details
  const selectedStudentObj = useMemo(() => {
    if (!studentIdentifier) return null;
    return enrolledStudents.find(
      (s) => s.rollNo === studentIdentifier || s.email === studentIdentifier || s._id === studentIdentifier
    ) || null;
  }, [studentIdentifier, enrolledStudents]);

  // Reset form fields when opened
  useEffect(() => {
    if (isOpen) {
      setStudentIdentifier('');
      setScore('');
      setMcqScore('');
      setCodingScore('');
      setNotes('');
      setIsManualInput(false);
    }
  }, [isOpen]);

  // Live score percentage calculations
  const numericScore = score !== '' && !isNaN(Number(score)) ? Number(score) : null;
  const scorePercent = numericScore !== null && maxScore > 0 ? Math.min(100, Math.round((numericScore / maxScore) * 100)) : null;
  const isPassing = scorePercent !== null ? scorePercent >= passingPercentage : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdentifier.trim()) {
      toast.error('Please select or enter student Roll Number or Email');
      return;
    }
    if (score === '' || isNaN(Number(score))) {
      toast.error('Please enter a valid numeric score');
      return;
    }
    onSubmit({
      studentIdentifier: studentIdentifier.trim(),
      score: Number(score),
      mcqScore: mcqScore !== '' ? Number(mcqScore) : undefined,
      codingScore: codingScore !== '' ? Number(codingScore) : undefined,
      manualNotes: notes.trim() || 'Paper / Offline Test Submission',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-lg rounded-3xl bg-surface border border-separator/80 p-6 sm:p-7 shadow-2xl space-y-5 my-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-separator/70 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-xs">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-label-primary tracking-tight">
                    Enter Paper / Manual Submission
                  </h3>
                  <p className="text-xs text-label-secondary mt-0.5">
                    Record score for students who wrote the test offline or on paper
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-canvas hover:bg-surface-secondary text-label-tertiary hover:text-label-primary transition-colors cursor-pointer border border-separator/60"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Student Roll No (HeroUI Select or Manual Text Fallback) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={13} className="text-purple-400" />
                    <span>Student Roll Number <span className="text-rose-400">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualInput(!isManualInput);
                      setStudentIdentifier('');
                    }}
                    className="text-[11px] font-medium text-purple-400 hover:text-purple-300 transition cursor-pointer"
                  >
                    {isManualInput ? '← Select from enrolled list' : 'Or type manually →'}
                  </button>
                </div>

                {!isManualInput ? (
                  <HeroUISelect
                    placeholder={loadingStudents ? 'Loading enrolled students...' : 'Search and select by Roll Number or Name...'}
                    options={selectOptions}
                    value={studentIdentifier}
                    onChange={(val: any) => setStudentIdentifier(val)}
                    isSearchable={true}
                    isClearable={true}
                    color="purple"
                    size="sm"
                    className="w-full"
                    disabled={loadingStudents}
                  />
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={studentIdentifier}
                      onChange={(e) => setStudentIdentifier(e.target.value)}
                      placeholder="e.g. 7376221CS101 or student@bitsathy.ac.in"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary font-mono outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-label-tertiary transition"
                    />
                  </div>
                )}

                {/* Selected Student Details Card Preview */}
                {selectedStudentObj && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs shrink-0">
                        {selectedStudentObj.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-label-primary truncate">{selectedStudentObj.name}</span>
                          {selectedStudentObj.rollNo && (
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface text-label-secondary border border-separator">
                              {selectedStudentObj.rollNo}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-label-tertiary truncate">
                          {selectedStudentObj.email} {selectedStudentObj.department ? `• ${selectedStudentObj.department}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                      {selectedStudentObj.attendanceStatus ? 'Present' : 'Enrolled'}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Field 2: Total Score Awarded */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={13} className="text-purple-400" />
                    <span>Total Score Awarded <span className="text-rose-400">*</span></span>
                  </label>
                  <span className="text-[11px] font-mono text-purple-400 font-semibold">
                    Max: {maxScore} pts
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="number"
                    required
                    min={0}
                    max={maxScore}
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder={`Enter score (0 - ${maxScore})`}
                    className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary font-mono outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-label-tertiary transition"
                  />
                  <div className="absolute right-3.5 text-xs font-mono font-semibold text-label-tertiary pointer-events-none">
                    / {maxScore} pts
                  </div>
                </div>

                {/* Live Percentage & Qualification Pill */}
                {scorePercent !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-canvas border border-separator text-xs"
                  >
                    <span className="text-label-secondary font-mono text-[11px]">
                      Percentage: <strong className="text-label-primary">{scorePercent}%</strong>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      isPassing
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      {isPassing ? <CheckCircle2 size={11} /> : <X size={11} />}
                      <span>{isPassing ? 'Passing' : 'Below Passing'}</span>
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Field 3: Section Scores: MCQ & Coding */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-label-secondary uppercase tracking-wider block">
                    MCQ Score (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={0}
                      value={mcqScore}
                      onChange={(e) => setMcqScore(e.target.value)}
                      placeholder="MCQ pts"
                      className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary font-mono outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-label-tertiary transition"
                    />
                    <span className="absolute right-3 text-[11px] font-mono text-label-tertiary pointer-events-none">
                      pts
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-label-secondary uppercase tracking-wider block">
                    Coding Score (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={0}
                      value={codingScore}
                      onChange={(e) => setCodingScore(e.target.value)}
                      placeholder="Coding pts"
                      className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary font-mono outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-label-tertiary transition"
                    />
                    <span className="absolute right-3 text-[11px] font-mono text-label-tertiary pointer-events-none">
                      pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Field 4: Remarks / Evaluation Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider block">
                  Evaluation Remarks / Paper Notes
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Paper answer sheet evaluated by Faculty - Hall 3"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-label-tertiary transition"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-separator/70">
                <Button
                  size="sm"
                  variant="light"
                  onPress={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-label-secondary hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="solid"
                  color="secondary"
                  isLoading={isSubmitting}
                  isDisabled={isSubmitting || !studentIdentifier.trim() || score === ''}
                  startContent={!isSubmitting ? <CheckCircle2 size={13} /> : undefined}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition cursor-pointer"
                >
                  Save Paper Submission
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

ManualPaperSubmissionModal.displayName = 'ManualPaperSubmissionModal';

export default ManualPaperSubmissionModal;
