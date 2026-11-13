import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  X,
  Users,
  Award,
  CheckCircle2,
  Target,
  AlertTriangle,
  Sparkles,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { toast } from 'react-hot-toast';
import api from '../../../lib/axios';
import HeroUISelect, { HeroUISelectOption } from '../../ui/HeroUISelect';

export interface ManualPaperSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
  maxScore?: number;
  passingPercentage?: number;
  eventTitle?: string;
  assessmentTitle?: string;
  initialSubmission?: any | null;
  allSubmissions?: any[];
  onSubmit: (data: {
    studentIdentifier: string;
    score: number;
    maxScore?: number;
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
  eventTitle,
  assessmentTitle,
  initialSubmission,
  allSubmissions = [],
  onSubmit,
  isSubmitting,
}) => {
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [score, setScore] = useState<string>('');
  const [customMaxScore, setCustomMaxScore] = useState<string>(String(maxScore || 100));
  const [mcqScore, setMcqScore] = useState<string>('');
  const [codingScore, setCodingScore] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isManualInput, setIsManualInput] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const isEditingExisting = Boolean(initialSubmission);

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

  // Reset or initialize form fields when opened or initialSubmission changes
  useEffect(() => {
    if (isOpen) {
      if (initialSubmission) {
        const user = initialSubmission.userId;
        const iden = user?.rollNo || user?.email || user?._id || '';
        setStudentIdentifier(iden);
        setCustomMaxScore(String(initialSubmission.maxPossibleScore || maxScore || 100));
        setMcqScore(initialSubmission.mcqScore !== undefined ? String(initialSubmission.mcqScore) : '0');
        setCodingScore(initialSubmission.codingScore !== undefined ? String(initialSubmission.codingScore) : '');
        setScore(initialSubmission.totalScore !== undefined ? String(initialSubmission.totalScore) : '');
        setNotes(initialSubmission.manualNotes || 'Coding evaluated on physical paper');
        setIsManualInput(true);
      } else {
        setStudentIdentifier('');
        setScore('');
        setCustomMaxScore(String(maxScore || 100));
        setMcqScore('');
        setCodingScore('');
        setNotes('');
        setIsManualInput(false);
      }
    }
  }, [isOpen, initialSubmission, maxScore]);

  // Options for HeroUISelect
  const selectOptions: HeroUISelectOption[] = useMemo(() => {
    return enrolledStudents.map((s) => ({
      value: s.rollNo || s.email || s._id,
      label: s.rollNo ? `${s.rollNo} — ${s.name}` : s.name,
      description: `${s.email}${s.department ? ` • ${s.department}` : ''}`,
      badge: s.attendanceStatus ? 'Present' : 'Enrolled',
    }));
  }, [enrolledStudents]);

  // Detect matching existing submission in allSubmissions if any
  const matchedExistingSub = useMemo(() => {
    if (initialSubmission) return initialSubmission;
    if (!studentIdentifier || !allSubmissions || allSubmissions.length === 0) return null;
    const clean = studentIdentifier.trim().toLowerCase();
    return allSubmissions.find((s: any) => {
      const u = s.userId;
      if (!u) return false;
      return (
        String(u._id || '').toLowerCase() === clean ||
        String(u.rollNo || '').toLowerCase() === clean ||
        String(u.email || '').toLowerCase() === clean
      );
    }) || null;
  }, [initialSubmission, studentIdentifier, allSubmissions]);

  // If a student with an existing submission is selected in create mode, auto-suggest existing MCQ score
  useEffect(() => {
    if (!initialSubmission && matchedExistingSub) {
      if (mcqScore === '' && matchedExistingSub.mcqScore !== undefined) {
        setMcqScore(String(matchedExistingSub.mcqScore));
      }
      if (score === '' && matchedExistingSub.totalScore !== undefined) {
        setScore(String(matchedExistingSub.totalScore));
      }
      if (codingScore === '' && matchedExistingSub.codingScore !== undefined && matchedExistingSub.codingScore > 0) {
        setCodingScore(String(matchedExistingSub.codingScore));
      }
    }
  }, [matchedExistingSub, initialSubmission]);

  // Selected student object details from enrolled list
  const selectedStudentObj = useMemo(() => {
    if (initialSubmission?.userId) return initialSubmission.userId;
    if (!studentIdentifier) return null;
    return enrolledStudents.find(
      (s) => s.rollNo === studentIdentifier || s.email === studentIdentifier || s._id === studentIdentifier
    ) || null;
  }, [initialSubmission, studentIdentifier, enrolledStudents]);

  // Live score percentage calculations based on editable max score
  const effectiveMaxScore = useMemo(() => {
    const parsed = Number(customMaxScore);
    return !isNaN(parsed) && parsed > 0 ? parsed : (maxScore || 100);
  }, [customMaxScore, maxScore]);

  const numericScore = score !== '' && !isNaN(Number(score)) ? Number(score) : null;
  const scorePercent = numericScore !== null && effectiveMaxScore > 0 ? Math.min(100, Math.round((numericScore / effectiveMaxScore) * 100)) : null;
  const isPassing = scorePercent !== null ? scorePercent >= passingPercentage : null;

  // Previous points already awarded in student account
  const previousPointsAwarded = useMemo(() => {
    if (!matchedExistingSub) return 0;
    if (typeof matchedExistingSub.pointsAwardedAmount === 'number') {
      return matchedExistingSub.pointsAwardedAmount;
    }
    return matchedExistingSub.pointsAwarded ? (matchedExistingSub.totalScore || 0) : 0;
  }, [matchedExistingSub]);

  // Delta points to be awarded
  const deltaPoints = useMemo(() => {
    const current = numericScore !== null ? numericScore : 0;
    return current - previousPointsAwarded;
  }, [numericScore, previousPointsAwarded]);

  // Handler for MCQ score change: update score = mcq + coding
  const handleMcqScoreChange = (val: string) => {
    setMcqScore(val);
    const m = Number(val) || 0;
    const c = Number(codingScore) || 0;
    setScore(String(m + c));
  };

  // Handler for Coding score change: update score = mcq + coding
  const handleCodingScoreChange = (val: string) => {
    setCodingScore(val);
    const m = Number(mcqScore) || 0;
    const c = Number(val) || 0;
    setScore(String(m + c));
  };

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
    if (isNaN(effectiveMaxScore) || effectiveMaxScore <= 0) {
      toast.error('Please enter a valid maximum score greater than 0');
      return;
    }
    onSubmit({
      studentIdentifier: studentIdentifier.trim(),
      score: Number(score),
      maxScore: effectiveMaxScore,
      mcqScore: mcqScore !== '' ? Number(mcqScore) : undefined,
      codingScore: codingScore !== '' ? Number(codingScore) : undefined,
      manualNotes: notes.trim() || (isEditingExisting ? 'Updated score with paper marks' : 'Paper / Offline Test Submission'),
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
                    {isEditingExisting ? 'Update Score / Add Paper Marks' : 'Enter Paper / Manual Submission'}
                  </h3>
                  <p className="text-xs text-label-secondary mt-0.5">
                    {isEditingExisting
                      ? 'Add physical paper coding marks to student’s online MCQ score'
                      : 'Record score for students who wrote the test offline or on paper'}
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
              {/* Field 1: Student Selection */}
              {isEditingExisting ? (
                /* Locked student preview for editing mode */
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-sm shrink-0">
                      {selectedStudentObj?.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-label-primary truncate">{selectedStudentObj?.name || 'Student'}</span>
                        {selectedStudentObj?.rollNo && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface text-label-secondary border border-separator">
                            {selectedStudentObj.rollNo}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-label-tertiary truncate">
                        {selectedStudentObj?.email} {selectedStudentObj?.department ? `• ${selectedStudentObj.department}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                    Editing Candidate
                  </span>
                </div>
              ) : (
                /* Select / input for new entry */
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
              )}

              {/* Informational Callout: Existing Online Submission Found */}
              {matchedExistingSub && (
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-2.5 text-xs text-blue-300">
                  <Layers size={15} className="shrink-0 mt-0.5 text-blue-400" />
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-blue-200">
                      Existing Submission Detected
                    </p>
                    <p className="text-[11px] text-blue-300/90 leading-relaxed">
                      Online MCQ Score: <strong>{matchedExistingSub.mcqScore || 0} pts</strong>.
                      Points already credited: <strong>{previousPointsAwarded} pts</strong>.
                      Enter paper coding marks below — only the additional paper points will be credited to the student.
                    </p>
                  </div>
                </div>
              )}

              {/* Field 2: Section Scores: Online MCQ & Paper Coding */}
              <div className="p-3.5 rounded-2xl bg-surface-secondary/60 border border-separator/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-label-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={13} className="text-purple-400" />
                    <span>Score Breakdown (MCQ + Coding Paper)</span>
                  </span>
                  <span className="text-[10px] text-label-tertiary">
                    Auto-sums into Total Score
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-label-secondary block">
                      Online MCQ Marks
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={0}
                        value={mcqScore}
                        onChange={(e) => handleMcqScoreChange(e.target.value)}
                        placeholder="e.g. 30"
                        className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-surface border border-separator text-xs text-label-primary font-mono outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-label-tertiary transition"
                      />
                      <span className="absolute right-3 text-[11px] font-mono text-label-tertiary pointer-events-none">
                        pts
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-purple-400 block flex items-center gap-1">
                      <span>Paper Coding Marks</span>
                      <span className="text-[10px] font-normal text-purple-300/80">(Physical Paper)</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={0}
                        value={codingScore}
                        onChange={(e) => handleCodingScoreChange(e.target.value)}
                        placeholder="e.g. 40"
                        className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-purple-500/10 border border-purple-500/40 text-xs text-purple-200 font-mono font-bold outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 placeholder:text-label-tertiary transition"
                      />
                      <span className="absolute right-3 text-[11px] font-mono text-purple-400 pointer-events-none">
                        pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Field 3: Total Score Awarded & Editable Max Score */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Award size={13} className="text-purple-400" />
                      <span>Total Score <span className="text-rose-400">*</span></span>
                    </label>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="number"
                      required
                      min={0}
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder={`0 - ${effectiveMaxScore}`}
                      className="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary font-mono font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-label-tertiary transition"
                    />
                    <div className="absolute right-3.5 text-xs font-mono font-semibold text-label-tertiary pointer-events-none">
                      pts
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Target size={13} className="text-purple-400" />
                      <span>Max Possible Score <span className="text-rose-400">*</span></span>
                    </label>
                    {customMaxScore !== String(maxScore) && (
                      <button
                        type="button"
                        onClick={() => setCustomMaxScore(String(maxScore || 100))}
                        className="text-[10px] font-mono text-purple-400 hover:text-purple-300 transition cursor-pointer"
                      >
                        Reset ({maxScore})
                      </button>
                    )}
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="number"
                      required
                      min={1}
                      value={customMaxScore}
                      onChange={(e) => setCustomMaxScore(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary font-mono outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-label-tertiary transition"
                    />
                    <div className="absolute right-3.5 text-xs font-mono font-semibold text-label-tertiary pointer-events-none">
                      max
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning if Score Exceeds Max Possible Score */}
              {numericScore !== null && numericScore > effectiveMaxScore && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>Entered score ({numericScore} pts) exceeds maximum possible score ({effectiveMaxScore} pts).</span>
                </div>
              )}

              {/* Live Percentage & Qualification Pill */}
              {scorePercent !== null && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-canvas border border-separator text-xs">
                  <span className="text-label-secondary font-mono text-[11px]">
                    Percentage: <strong className="text-label-primary">{scorePercent}%</strong> ({numericScore}/{effectiveMaxScore} pts)
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    isPassing
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {isPassing ? <CheckCircle2 size={11} /> : <X size={11} />}
                    <span>{isPassing ? 'Passing' : 'Below Passing'}</span>
                  </span>
                </div>
              )}

              {/* Points Delta Breakdown Card */}
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-label-secondary">Current Awarded Points:</span>
                  <span className="font-mono font-bold text-label-primary">{previousPointsAwarded} pts</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-label-secondary">New Total Assessment Score:</span>
                  <span className="font-mono font-bold text-label-primary">{numericScore !== null ? numericScore : 0} / {effectiveMaxScore} pts</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-separator/40">
                  <span className="font-bold text-indigo-300 flex items-center gap-1">
                    <Sparkles size={12} className="text-indigo-400" />
                    <span>Additional Points to Credit (Delta):</span>
                  </span>
                  <span className={`font-mono font-extrabold text-sm ${deltaPoints > 0 ? 'text-emerald-400' : deltaPoints < 0 ? 'text-amber-400' : 'text-label-tertiary'}`}>
                    {deltaPoints > 0 ? `+${deltaPoints}` : deltaPoints} pts
                  </span>
                </div>
                <p className="text-[11px] text-label-tertiary leading-relaxed">
                  {matchedExistingSub ? (
                    <>
                      Only the updated delta marks (
                      <strong className={deltaPoints >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        {deltaPoints > 0 ? `+${deltaPoints}` : deltaPoints} pts
                      </strong>
                      ) will be credited to the student's club points ledger without duplicating online MCQ points.
                    </>
                  ) : (
                    <>Full score of {numericScore || 0} pts will be awarded to student's club points profile.</>
                  )}
                </p>
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
                    placeholder="e.g. Paper coding section evaluated by Faculty - Hall 3"
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
                  startContent={!isSubmitting ? (deltaPoints > 0 ? <ArrowUpRight size={13} /> : <CheckCircle2 size={13} />) : undefined}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition cursor-pointer"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : deltaPoints > 0
                    ? `Save & Credit +${deltaPoints} Points`
                    : isEditingExisting
                    ? 'Update Score'
                    : 'Save Paper Submission'}
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
