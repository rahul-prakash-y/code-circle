import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  CheckCircle2,
  Palette,
  ExternalLink,
  HelpCircle,
  Code2,
  Award,
  Clock,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Button, Link } from '@heroui/react';
import { ArenaAssessment } from '../../../../store/useEventArenaStore';

interface SubmissionInspectionModalProps {
  inspectingSub: any | null;
  selectedAssessment: ArenaAssessment | null;
  adminMcqs: any[];
  adminCoding: any[];
  effectiveCutoffRank: number;
  inspectingRank: number;
  inspectingShortlisted: boolean;
  actionInProgressId: string | null;
  onClose: () => void;
  onEditPaperScore?: (sub: any) => void;
  onGradeCode: (submissionId: string, problemId: string, score: number, feedback: string) => Promise<void>;
  onResetSubmission: (sub: any) => Promise<void>;
  onUnblockStudent: (studentId: string, studentName?: string) => Promise<void>;
  onDeleteSubmission: (sub: any) => Promise<void>;
  onOpenGraceModal: (sub: any) => void;
}

export const SubmissionInspectionModal: React.FC<SubmissionInspectionModalProps> = memo(({
  inspectingSub,
  selectedAssessment,
  adminMcqs,
  adminCoding,
  effectiveCutoffRank,
  inspectingRank,
  inspectingShortlisted,
  actionInProgressId,
  onClose,
  onEditPaperScore,
  onGradeCode,
  onResetSubmission,
  onUnblockStudent,
  onDeleteSubmission,
  onOpenGraceModal,
}) => {
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({});
  const [gradingFeedbacks, setGradingFeedbacks] = useState<Record<string, string>>({});
  const [isGradingCode, setIsGradingCode] = useState<Record<string, boolean>>({});

  if (!inspectingSub) return null;

  const handleGrade = async (problemId: string) => {
    const score = gradingScores[problemId] !== undefined ? gradingScores[problemId] : 0;
    const feedback = gradingFeedbacks[problemId] || '';
    setIsGradingCode((prev) => ({ ...prev, [problemId]: true }));
    try {
      await onGradeCode(inspectingSub._id, problemId, score, feedback);
    } finally {
      setIsGradingCode((prev) => ({ ...prev, [problemId]: false }));
    }
  };

  const allMcqs = (adminMcqs && adminMcqs.length > 0)
    ? adminMcqs
    : (selectedAssessment?.questions?.mcqs || []);

  const answeredMcqCount = allMcqs.filter((q: any) => {
    const qId = q._id?.toString() || q.id;
    const ans = inspectingSub.mcqAnswers?.find((a: any) => a.questionId?.toString() === qId);
    return ans !== undefined && ans.selectedOptionIndex !== undefined && ans.selectedOptionIndex !== -1;
  }).length;
  const unansweredMcqCount = allMcqs.length - answeredMcqCount;

  const allCoding = (adminCoding && adminCoding.length > 0)
    ? adminCoding
    : (selectedAssessment?.questions?.coding || []);

  const attemptedCodingCount = allCoding.filter((prob: any) => {
    const probId = prob._id?.toString() || prob.id;
    const cs = inspectingSub.codingSubmissions?.find((c: any) => c.problemId?.toString() === probId);
    return cs && cs.code && cs.code.trim().length > 0;
  }).length;
  const unattemptedCodingCount = allCoding.length - attemptedCodingCount;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-3xl max-h-[90vh] rounded-3xl bg-surface border border-separator p-5 sm:p-7 shadow-2xl flex flex-col overflow-hidden space-y-5"
        >
          {/* Modal Header */}
          <div className="flex items-start justify-between pb-4 border-b border-separator shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl overflow-hidden bg-surface border border-separator shrink-0">
                <img
                  src={
                    inspectingSub.userId?.profilePicUrl ||
                    `https://ui-avatars.com/api/?name=${inspectingSub.userId?.name}&background=1D1D1F&color=fff&size=80`
                  }
                  alt={inspectingSub.userId?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-label-primary">
                    {inspectingSub.userId?.name || 'Student Submission'}
                  </h3>
                  {effectiveCutoffRank > 0 ? (
                    inspectingShortlisted ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        <span>Shortlisted (Rank #{inspectingRank})</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        <X size={11} />
                        <span>Not Shortlisted (Rank #{inspectingRank})</span>
                      </span>
                    )
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      Qualified (Rank #{inspectingRank})
                    </span>
                  )}
                </div>
                <p className="text-xs text-label-tertiary">
                  {inspectingSub.userId?.rollNo} • {inspectingSub.userId?.email}
                  {inspectingSub.userId?.department && ` • ${inspectingSub.userId.department}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onEditPaperScore && (
                <Button
                  size="sm"
                  variant="flat"
                  color="secondary"
                  startContent={<FileText size={13} />}
                  onPress={() => onEditPaperScore(inspectingSub)}
                  className="h-8 px-3 rounded-xl text-xs font-bold bg-purple-500/15 border border-purple-500/30 text-purple-400 hover:bg-purple-500/25 cursor-pointer"
                >
                  Edit / Paper Marks
                </Button>
              )}
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={onClose}
                className="p-2 rounded-xl text-label-tertiary hover:text-label-primary hover:bg-surface-secondary min-w-unit-8 w-8 h-8 cursor-pointer"
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          {/* Score Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="p-3 rounded-2xl bg-surface-secondary border border-separator text-center">
              <p className="text-[10px] font-semibold text-label-tertiary uppercase">Score</p>
              <p className="text-sm sm:text-base font-bold font-mono text-label-primary mt-0.5">
                {inspectingSub.totalScore} / {inspectingSub.maxPossibleScore}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-surface-secondary border border-separator text-center">
              <p className="text-[10px] font-semibold text-label-tertiary uppercase">Percentage</p>
              <p className="text-sm sm:text-base font-bold font-mono text-accent mt-0.5">
                {inspectingSub.scorePercentage}%
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-surface-secondary border border-separator text-center">
              <p className="text-[10px] font-semibold text-label-tertiary uppercase">Tab Switches</p>
              <p className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${
                (inspectingSub.tabSwitchCount || 0) > 0 ? 'text-destructive' : 'text-label-primary'
              }`}>
                {inspectingSub.tabSwitchCount || 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-surface-secondary border border-separator text-center">
              <p className="text-[10px] font-semibold text-label-tertiary uppercase">Time Taken</p>
              <p className="text-sm sm:text-base font-bold font-mono text-label-primary mt-0.5">
                {inspectingSub.timeTakenSeconds ? `${Math.floor(inspectingSub.timeTakenSeconds / 60)}m ${inspectingSub.timeTakenSeconds % 60}s` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Scrollable Answers & Work Content */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Paper / Manual Test Banner */}
            {inspectingSub.isManualSubmission && (
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      Paper / Offline Test Submission
                    </span>
                    <span className="text-label-primary font-bold">
                      Manual Score: {inspectingSub.totalScore} / {inspectingSub.maxPossibleScore} ({inspectingSub.scorePercentage}%)
                    </span>
                  </div>
                  <p className="text-text-muted text-[11px]">
                    {inspectingSub.manualNotes || 'Score entered manually from paper answer sheet.'}
                    {inspectingSub.enteredBy && ` • Recorded by: ${inspectingSub.enteredBy?.name || inspectingSub.enteredBy?.email}`}
                  </p>
                </div>
                {effectiveCutoffRank > 0 ? (
                  inspectingShortlisted ? (
                    <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>Shortlisted</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                      <X size={12} />
                      <span>Not Shortlisted</span>
                    </span>
                  )
                ) : (
                  <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    Qualified
                  </span>
                )}
              </div>
            )}

            {/* UI/UX Design Submission Details */}
            {inspectingSub.designSubmission?.figmaLink && (
              <div className="p-4 rounded-2xl bg-pink-500/5 border border-pink-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
                    <Palette size={14} /> UI/UX Figma Deliverable
                  </span>
                  <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    href={inspectingSub.designSubmission.figmaLink}
                    className="text-xs font-bold text-pink-400 hover:text-pink-300 underline inline-flex items-center gap-1"
                  >
                    <span>Open Figma Link</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
                {inspectingSub.designSubmission.notes && (
                  <p className="text-xs text-label-secondary bg-surface p-2.5 rounded-xl border border-separator">
                    <strong className="text-label-primary block mb-0.5">Student Notes:</strong>
                    {inspectingSub.designSubmission.notes}
                  </p>
                )}
                {inspectingSub.designSubmission.isEvaluated && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 space-y-1">
                    <p className="font-bold">Graded Score: {inspectingSub.designSubmission.pointsEarned} Points</p>
                    {inspectingSub.designSubmission.feedback && (
                      <p className="text-emerald-300/80">Feedback: {inspectingSub.designSubmission.feedback}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MCQ Answers Tracking & Question Breakdown Section */}
            {allMcqs.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-separator/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-label-secondary flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-accent" />
                    <span>All MCQ Questions ({allMcqs.length})</span>
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {answeredMcqCount} Answered
                    </span>
                    {unansweredMcqCount > 0 && (
                      <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        {unansweredMcqCount} Not Answered
                      </span>
                    )}
                    <span className="text-accent font-mono ml-1">
                      Score: {inspectingSub.mcqScore || 0} pts
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {allMcqs.map((q: any, qIdx: number) => {
                    const qId = q._id?.toString() || q.id;
                    const ans = inspectingSub.mcqAnswers?.find((a: any) => a.questionId?.toString() === qId);
                    const hasAnswered = ans !== undefined && ans.selectedOptionIndex !== undefined && ans.selectedOptionIndex !== -1;
                    const studentSelected = hasAnswered ? (typeof ans.selectedOptionIndex === 'number' ? ans.selectedOptionIndex : ans.selectedOption) : null;
                    const isCorrect = hasAnswered ? Boolean(ans.isCorrect) : false;

                    return (
                      <div
                        key={qId || qIdx}
                        className={`p-4 rounded-2xl border text-xs space-y-3 transition-all ${
                          !hasAnswered
                            ? 'bg-amber-500/5 border-amber-500/25'
                            : isCorrect
                            ? 'bg-emerald-500/5 border-emerald-500/25'
                            : 'bg-destructive/5 border-destructive/25'
                        }`}
                      >
                        {/* Question Title & Points */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold text-label-tertiary uppercase">
                                Question #{qIdx + 1}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                                !hasAnswered
                                  ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                                  : isCorrect
                                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                  : 'bg-destructive/15 text-destructive border border-destructive/30'
                              }`}>
                                {!hasAnswered ? 'Not Answered' : isCorrect ? 'Answered (Correct)' : 'Answered (Incorrect)'}
                              </span>
                            </div>
                            <p className="font-bold text-label-primary text-xs sm:text-sm leading-snug">
                              {q.question || `Question ID: ${qId}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 ${
                              !hasAnswered
                                ? 'bg-surface border border-separator text-label-tertiary'
                                : isCorrect
                                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                : 'bg-destructive/15 text-destructive border border-destructive/30'
                            }`}>
                              {hasAnswered && (isCorrect ? <CheckCircle2 size={11} /> : <X size={11} />)}
                              <span>{hasAnswered && isCorrect ? `+${ans.pointsEarned || q.points || 10} pts` : `0 / ${q.points || 10} pts`}</span>
                            </span>
                          </div>
                        </div>

                        {/* All Options with highlighted selection */}
                        {q.options && q.options.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {q.options.map((optText: string, oIdx: number) => {
                              const isStudentChoice = studentSelected === oIdx;
                              const isCorrectChoice = q.correctOptionIndex === oIdx;

                              let optBorder = 'border-separator bg-surface';
                              let optTextClass = 'text-label-secondary';

                              if (isStudentChoice && isCorrectChoice) {
                                optBorder = 'border-emerald-500/50 bg-emerald-500/15';
                                optTextClass = 'text-emerald-500 font-bold';
                              } else if (isStudentChoice && !isCorrectChoice) {
                                optBorder = 'border-destructive/50 bg-destructive/15';
                                optTextClass = 'text-destructive font-bold';
                              } else if (isCorrectChoice) {
                                optBorder = 'border-emerald-500/30 bg-emerald-500/5';
                                optTextClass = 'text-emerald-500 font-medium';
                              }

                              return (
                                <div
                                  key={oIdx}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 text-xs ${optBorder}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded-full bg-surface-secondary border border-separator font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                      {String.fromCharCode(65 + oIdx)}
                                    </span>
                                    <span className={`truncate ${optTextClass}`}>{optText}</span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {isStudentChoice && (
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                        isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-destructive/20 text-destructive'
                                      }`}>
                                        {isCorrect ? 'Student Choice (Correct)' : 'Student Choice (Incorrect)'}
                                      </span>
                                    )}
                                    {!isStudentChoice && isCorrectChoice && (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                        Correct Answer
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.explanation && (
                          <p className="text-[11px] text-label-tertiary bg-surface-secondary p-2.5 rounded-xl border border-separator/60">
                            <strong className="text-label-secondary">Explanation:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coding Submissions Section */}
            {allCoding.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-separator/60">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-label-secondary flex items-center gap-1.5">
                    <Code2 size={14} className="text-purple-400" />
                    <span>All Coding Challenges ({allCoding.length})</span>
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {attemptedCodingCount} Attempted
                    </span>
                    {unattemptedCodingCount > 0 && (
                      <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        {unattemptedCodingCount} Not Answered
                      </span>
                    )}
                    <span className="text-purple-400 font-mono ml-1">
                      Coding Score: {inspectingSub.codingScore || 0} pts
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {allCoding.map((prob: any, cIdx: number) => {
                    const probId = prob._id?.toString() || prob.id;
                    const cs = inspectingSub.codingSubmissions?.find((c: any) => c.problemId?.toString() === probId);
                    const hasAttempted = Boolean(cs && cs.code && cs.code.trim().length > 0);
                    const maxPts = prob?.points || 30;
                    const isOnlyCode = cs?.codingMode === 'ONLY_CODE';

                    if (!hasAttempted) {
                      return (
                        <div
                          key={probId || cIdx}
                          className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/25 space-y-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold text-label-tertiary uppercase">
                                Problem #{cIdx + 1}
                              </span>
                              <span className="font-bold text-label-primary text-sm">
                                {prob.title || 'Coding Problem'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                Not Attempted / Not Answered
                              </span>
                              <span className="font-mono text-[11px] text-label-tertiary">
                                0 / {maxPts} pts
                              </span>
                            </div>
                          </div>
                          {prob.description && (
                            <p className="text-label-secondary text-[11px] line-clamp-2">
                              {prob.description}
                            </p>
                          )}
                          <div className="p-2 rounded-xl bg-surface border border-separator/40 text-[11px] text-text-muted italic">
                            Student did not submit code or test solutions for this challenge.
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={probId || cIdx}
                        className="p-3.5 rounded-2xl bg-surface-secondary border border-separator space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-label-primary">
                            Problem #{cIdx + 1}: {prob?.title || cs.language || 'Code Challenge'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              isOnlyCode
                                ? cs.isEvaluated
                                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                  : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                : cs.status === 'ACCEPTED'
                                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                : 'bg-destructive/15 text-destructive border border-destructive/30'
                            }`}
                          >
                            {isOnlyCode
                              ? cs.isEvaluated
                                ? `Only Code • Graded: ${cs.pointsEarned}/${maxPts} pts`
                                : 'Only Code • Awaiting Admin Grade'
                              : `Test Cases • ${cs.status || 'SUBMITTED'} • ${cs.testCasesPassed ?? cs.passedCount ?? 0}/${cs.totalTestCases || 0} Passed (${cs.pointsEarned} pts)`}
                          </span>
                        </div>

                        {cs.code && (
                          <pre className="p-3 rounded-xl bg-black/60 border border-separator text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48">
                            {cs.code}
                          </pre>
                        )}

                        {/* Admin Grading Form */}
                        <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                              <Award size={13} />
                              <span>
                                {isOnlyCode
                                  ? 'Assigned Admin Evaluation (Only Code)'
                                  : 'Admin Evaluation Override'}
                              </span>
                            </span>
                            {cs.isEvaluated && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                Awarded: {cs.pointsEarned} / {maxPts} pts
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <label className="text-[11px] font-semibold text-label-secondary">Score:</label>
                              <input
                                type="number"
                                min={0}
                                max={maxPts}
                                value={
                                  gradingScores[cs.problemId] !== undefined
                                    ? gradingScores[cs.problemId]
                                    : (cs.pointsEarned ?? 0)
                                }
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setGradingScores((prev) => ({ ...prev, [cs.problemId]: val }));
                                }}
                                className="w-20 px-2.5 py-1 rounded-lg bg-surface border border-separator text-xs font-mono text-label-primary outline-none focus:border-purple-500"
                              />
                              <span className="text-[11px] text-label-tertiary font-mono">/ {maxPts}</span>
                            </div>

                            <input
                              type="text"
                              placeholder="Optional feedback or remarks..."
                              value={
                                gradingFeedbacks[cs.problemId] !== undefined
                                  ? gradingFeedbacks[cs.problemId]
                                  : (cs.feedback || '')
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                setGradingFeedbacks((prev) => ({ ...prev, [cs.problemId]: val }));
                              }}
                              className="flex-1 min-w-36 px-2.5 py-1 rounded-lg bg-surface border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500"
                            />

                            <Button
                              size="sm"
                              variant="solid"
                              color="secondary"
                              isDisabled={isGradingCode[cs.problemId]}
                              isLoading={isGradingCode[cs.problemId]}
                              startContent={!isGradingCode[cs.problemId] ? <CheckCircle2 size={12} /> : undefined}
                              onPress={() => handleGrade(cs.problemId)}
                              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 cursor-pointer"
                            >
                              {cs.isEvaluated ? 'Update Score' : 'Save Score'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-separator shrink-0">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="solid"
                color="warning"
                startContent={<Clock size={13} />}
                onPress={() => onOpenGraceModal(inspectingSub)}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Grant Grace Time
              </Button>
              <Button
                size="sm"
                variant="flat"
                color="warning"
                isDisabled={actionInProgressId === inspectingSub._id}
                isLoading={actionInProgressId === inspectingSub._id}
                startContent={actionInProgressId !== inspectingSub._id ? <RotateCcw size={13} /> : undefined}
                onPress={() => onResetSubmission(inspectingSub)}
                className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 text-xs font-bold cursor-pointer"
              >
                Reset Attempt
              </Button>
              <Button
                size="sm"
                variant="flat"
                color="success"
                isDisabled={actionInProgressId === (inspectingSub.userId?._id || inspectingSub.userId?.id || inspectingSub.userId)}
                isLoading={actionInProgressId === (inspectingSub.userId?._id || inspectingSub.userId?.id || inspectingSub.userId)}
                startContent={actionInProgressId !== (inspectingSub.userId?._id || inspectingSub.userId?.id || inspectingSub.userId) ? <ShieldCheck size={13} /> : undefined}
                onPress={() => onUnblockStudent(inspectingSub.userId?._id || inspectingSub.userId?.id || inspectingSub.userId, inspectingSub.userId?.name)}
                className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/30 text-xs font-bold cursor-pointer"
              >
                Unblock Student
              </Button>
              <Button
                size="sm"
                variant="flat"
                color="danger"
                isDisabled={actionInProgressId === inspectingSub._id}
                isLoading={actionInProgressId === inspectingSub._id}
                startContent={actionInProgressId !== inspectingSub._id ? <Trash2 size={13} /> : undefined}
                onPress={() => onDeleteSubmission(inspectingSub)}
                className="px-3 py-2 rounded-xl bg-destructive/15 hover:bg-destructive/25 text-destructive border border-destructive/30 text-xs font-bold cursor-pointer"
              >
                Delete
              </Button>
            </div>
            <Button
              size="sm"
              variant="bordered"
              onPress={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border-separator bg-surface hover:bg-surface-secondary text-label-primary cursor-pointer"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

SubmissionInspectionModal.displayName = 'SubmissionInspectionModal';
