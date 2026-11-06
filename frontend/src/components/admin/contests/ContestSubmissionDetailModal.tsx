import React, { useState } from 'react';
import ResponsiveModal from '../../ui/ResponsiveModal';
import {
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code2,
  Clock,
  Award,
  Zap,
  Copy,
  Check,
  User,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  FileCode2,
  Sliders,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { formatISTDateTime } from '../../../lib/dateUtils';

interface ContestSubmissionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any | null;
  contestTitle?: string;
  contestType?: string;
  onAllocatePoints?: (submission: any) => void;
  onApproveReentry?: (submission: any) => void;
  onDeleteSubmission?: (submission: any) => void;
  isAdminView?: boolean;
}

export const ContestSubmissionDetailModal: React.FC<ContestSubmissionDetailModalProps> = ({
  isOpen,
  onClose,
  submission,
  contestTitle,
  contestType,
  onAllocatePoints,
  onApproveReentry,
  onDeleteSubmission,
  isAdminView = false,
}) => {
  const [activeTab, setActiveTab] = useState<'mcq' | 'coding' | 'summary'>('mcq');
  const [selectedCodingProblemIdx, setSelectedCodingProblemIdx] = useState(0);
  const [mcqFilter, setMcqFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !submission) return null;

  const mcqAnswers = submission.mcqAnswers || [];
  const codingSubmissions = submission.codingSubmissions || [];

  const mcqCorrectCount = mcqAnswers.filter((a: any) => a.isCorrect).length;
  const mcqTotalCount = mcqAnswers.length;
  const mcqTotalPointsEarned = mcqAnswers.reduce((sum: number, a: any) => sum + (a.pointsEarned || 0), 0);

  const codingPassedCount = codingSubmissions.filter(
    (c: any) => c.status === 'ACCEPTED' || (c.totalTestCases > 0 && c.passedTestCases === c.totalTestCases)
  ).length;
  const codingTotalPointsEarned = codingSubmissions.reduce(
    (sum: number, c: any) => sum + (c.pointsEarned || 0),
    0
  );

  const filteredMcqs = mcqAnswers.filter((a: any) => {
    if (mcqFilter === 'correct') return a.isCorrect;
    if (mcqFilter === 'incorrect') return !a.isCorrect;
    return true;
  });

  const selectedCoding = codingSubmissions[selectedCodingProblemIdx] || codingSubmissions[0];

  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor((sec || 0) / 60);
    const s = (sec || 0) % 60;
    return `${m}m ${s}s`;
  };

  const studentName = submission.userId?.name || 'Student';
  const studentRoll = submission.userId?.rollNo || submission.userId?.email || 'N/A';
  const studentEmail = submission.userId?.email || '';

  return (
    <ResponsiveModal
      open={isOpen && Boolean(submission)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent-subtle text-accent flex items-center justify-center">
            <FileCode2 className="w-4 h-4" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span>{isAdminView ? `${studentName}'s Submission` : 'Your Contest Submission'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent-subtle text-accent border border-accent/20">
              {submission.totalScore || 0} PTS
            </span>
            {submission.awardedClubPoints > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-success-subtle text-success border border-success/20">
                +{submission.awardedClubPoints} Club XP
              </span>
            )}
          </div>
        </div>
      }
      description={`${contestTitle || 'Contest'} ${isAdminView ? `• ${studentRoll} (${studentEmail})` : ''}`}
      dialogClassName="sm:max-w-4xl p-6"
    >
      <div className="space-y-4 pt-2">
        {/* Quick Admin Actions Bar */}
        {isAdminView && (onApproveReentry || onDeleteSubmission || onAllocatePoints) && (
          <div className="p-3 bg-surface-secondary rounded-2xl border border-separator flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold text-label-secondary">Coordinator Actions:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {onApproveReentry && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  color="success"
                  onPress={() => onApproveReentry(submission)}
                  className="rounded-full text-xs font-bold flex items-center gap-1.5"
                  title="Approve or grant re-entry"
                >
                  <UserCheck size={13} />
                  <span>Allow Re-entry</span>
                </Button>
              )}
              {onAllocatePoints && (
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onPress={() => onAllocatePoints(submission)}
                  className="rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Zap size={13} className="fill-current" />
                  <span>Allocate Points</span>
                </Button>
              )}
              {onDeleteSubmission && (
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  isIconOnly
                  onPress={() => onDeleteSubmission(submission)}
                  className="rounded-full"
                  title="Delete Student Entry from Contest"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
          </div>
        )}

          {/* Re-entry Request Banner if Pending */}
          {submission.reentryStatus === 'PENDING' && (
            <div className="px-4 sm:px-6 py-2.5 bg-warning-subtle border-b border-warning/20 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-warning font-bold min-w-0">
                <AlertTriangle size={14} className="shrink-0 animate-bounce" />
                <span className="truncate">
                  Student submitted Re-entry Appeal: "{submission.reentryReason || 'No details provided'}"
                </span>
              </div>
              {isAdminView && onApproveReentry && (
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  color="success"
                  onPress={() => onApproveReentry(submission)}
                  className="rounded-lg font-bold text-xs shrink-0 shadow-xs"
                >
                  Approve Re-entry
                </Button>
              )}
            </div>
          )}

          {/* Quick Stats Bar */}
          <div className="px-4 sm:px-6 py-2.5 bg-surface border-b border-separator/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-label-secondary">
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-accent" />
                <span className="font-mono font-bold text-label-primary">
                  {formatSeconds(submission.timeTakenSeconds)}
                </span>
                <span className="text-[11px] text-label-tertiary">time taken</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-success" />
                <span className="font-mono font-bold text-label-primary">
                  {mcqCorrectCount}/{mcqTotalCount}
                </span>
                <span className="text-[11px] text-label-tertiary">MCQs correct</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Code2 size={13} className="text-info" />
                <span className="font-mono font-bold text-label-primary">
                  {codingPassedCount}/{codingSubmissions.length}
                </span>
                <span className="text-[11px] text-label-tertiary">codes accepted</span>
              </span>
            </div>

            <span className="text-[11px] font-mono text-label-tertiary">
              {submission.submittedAt
                ? `Submitted: ${formatISTDateTime(submission.submittedAt)}`
                : 'Session Finalized'}
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="px-4 sm:px-6 pt-3 border-b border-separator flex items-center justify-between gap-2 bg-surface-secondary/40 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('mcq')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all duration-150 ease-out flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'mcq'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-label-secondary hover:text-label-primary'
                }`}
              >
                <HelpCircle size={14} />
                <span>MCQ Questions ({mcqTotalCount})</span>
                <span className="px-1.5 py-0.2 bg-accent-subtle text-accent rounded-full text-[10px] font-mono">
                  {mcqTotalPointsEarned} pts
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('coding')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all duration-150 ease-out flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'coding'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-label-secondary hover:text-label-primary'
                }`}
              >
                <Code2 size={14} />
                <span>Coding Challenges ({codingSubmissions.length})</span>
                <span className="px-1.5 py-0.2 bg-info-subtle text-info rounded-full text-[10px] font-mono">
                  {codingTotalPointsEarned} pts
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all duration-150 ease-out flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  activeTab === 'summary'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-label-secondary hover:text-label-primary'
                }`}
              >
                <Award size={14} />
                <span>Audit & Breakdown</span>
              </button>
            </div>
          </div>

          {/* Modal Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* --- TAB 1: MCQ QUESTIONS & STUDENT ANSWERS --- */}
            {activeTab === 'mcq' && (
              <div className="space-y-4">
                {/* MCQ Filters Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-surface-secondary p-2.5 rounded-2xl border border-separator text-xs">
                  <span className="text-label-secondary font-medium px-1 sm:px-2 text-[11px] sm:text-xs">
                    Showing {filteredMcqs.length} of {mcqTotalCount} questions
                  </span>
                  <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-separator text-[11px] overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setMcqFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all duration-150 ease-out whitespace-nowrap shrink-0 ${
                        mcqFilter === 'all'
                          ? 'bg-accent text-white shadow-xs'
                          : 'text-label-secondary hover:text-label-primary'
                      }`}
                    >
                      All ({mcqTotalCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMcqFilter('correct')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all duration-150 ease-out whitespace-nowrap shrink-0 ${
                        mcqFilter === 'correct'
                          ? 'bg-success text-white shadow-xs'
                          : 'text-label-secondary hover:text-label-primary'
                      }`}
                    >
                      Correct ({mcqCorrectCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMcqFilter('incorrect')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all duration-150 ease-out whitespace-nowrap shrink-0 ${
                        mcqFilter === 'incorrect'
                          ? 'bg-destructive text-white shadow-xs'
                          : 'text-label-secondary hover:text-label-primary'
                      }`}
                    >
                      Incorrect ({mcqTotalCount - mcqCorrectCount})
                    </button>
                  </div>
                </div>

                {mcqTotalCount === 0 ? (
                  <div className="py-12 text-center text-label-tertiary border border-dashed border-separator rounded-2xl text-xs">
                    No MCQ questions were configured for this contest.
                  </div>
                ) : filteredMcqs.length === 0 ? (
                  <div className="py-12 text-center text-label-tertiary border border-dashed border-separator rounded-2xl text-xs">
                    No questions match the "{mcqFilter}" filter.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMcqs.map((ans: any, qIdx: number) => {
                      const isCorrect = Boolean(ans.isCorrect);
                      const hasSelected = typeof ans.selectedOption === 'number' && ans.selectedOption >= 0;

                      return (
                        <div
                          key={ans.questionId || qIdx}
                          className={`rounded-2xl border p-4 sm:p-5 transition-all duration-150 ease-out ${
                            isCorrect
                              ? 'bg-success-subtle/40 border-success/25'
                              : hasSelected
                              ? 'bg-destructive-subtle/40 border-destructive/25'
                              : 'bg-surface-secondary border-separator'
                          }`}
                        >
                          {/* Question Header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                                  isCorrect
                                    ? 'bg-success-subtle text-success'
                                    : hasSelected
                                    ? 'bg-destructive-subtle text-destructive'
                                    : 'bg-surface-raised text-label-tertiary'
                                }`}
                              >
                                {qIdx + 1}
                              </span>
                              <h4 className="text-sm font-bold text-label-primary leading-relaxed">
                                {ans.questionText || `Question ${qIdx + 1}`}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                                  isCorrect
                                    ? 'bg-success-subtle text-success border border-success/30'
                                    : hasSelected
                                    ? 'bg-destructive-subtle text-destructive border border-destructive/30'
                                    : 'bg-warning-subtle text-warning border border-warning/30'
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <CheckCircle2 size={11} />
                                    <span>Correct (+{ans.pointsEarned} pts)</span>
                                  </>
                                ) : hasSelected ? (
                                  <>
                                    <XCircle size={11} />
                                    <span>Incorrect (0/{ans.maxPoints} pts)</span>
                                  </>
                                ) : (
                                  <span>Unanswered (0 pts)</span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Options List */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-2">
                            {(ans.options || []).map((optText: string, oIdx: number) => {
                              const isStudentSelected = ans.selectedOption === oIdx;
                              const isCorrectOption = ans.correctOptionIndex === oIdx;
                              const optionLetter = String.fromCharCode(65 + oIdx);

                              let optionStyle =
                                'bg-surface border-separator text-label-secondary hover:border-separator-opaque';
                              if (isStudentSelected && isCorrect) {
                                optionStyle =
                                  'bg-success-subtle border-success text-success font-bold shadow-xs';
                              } else if (isStudentSelected && !isCorrect) {
                                optionStyle =
                                  'bg-destructive-subtle border-destructive text-destructive font-bold shadow-xs';
                              } else if (isCorrectOption && !isCorrect) {
                                optionStyle =
                                  'bg-success-subtle/50 border-success/40 text-success border-dashed font-semibold';
                              }

                              return (
                                <div
                                  key={oIdx}
                                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all duration-150 ease-out ${optionStyle}`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-5 h-5 rounded-md bg-surface-secondary border border-separator text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                                      {optionLetter}
                                    </span>
                                    <span className="truncate">{optText}</span>
                                  </div>

                                  <div className="shrink-0 flex items-center gap-1">
                                    {isStudentSelected && (
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                          isCorrect
                                            ? 'bg-success-subtle text-success'
                                            : 'bg-destructive-subtle text-destructive'
                                        }`}
                                      >
                                        Student Choice
                                      </span>
                                    )}
                                    {isCorrectOption && !isStudentSelected && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-success-subtle text-success">
                                        Correct Answer
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation (if provided) */}
                          {ans.explanation && (
                            <div className="mt-3 p-3 bg-surface-secondary/70 border border-separator rounded-xl text-xs space-y-1">
                              <span className="text-[10px] font-bold uppercase font-mono text-accent flex items-center gap-1">
                                <HelpCircle size={11} />
                                <span>Explanation</span>
                              </span>
                              <p className="text-label-secondary leading-relaxed">{ans.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* --- TAB 2: CODING CHALLENGES & SOLUTION INSPECTOR --- */}
            {activeTab === 'coding' && (
              <div className="space-y-4">
                {codingSubmissions.length === 0 ? (
                  <div className="py-12 text-center text-label-tertiary border border-dashed border-separator rounded-2xl text-xs">
                    No coding challenges were submitted for this contest.
                  </div>
                ) : (
                  <>
                    {/* Problem Switcher Tabs (if multiple problems) */}
                    {codingSubmissions.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-separator">
                        {codingSubmissions.map((cs: any, idx: number) => {
                          const isSelected = idx === selectedCodingProblemIdx;
                          const isAccepted = cs.status === 'ACCEPTED' || cs.passedTestCases === cs.totalTestCases;

                          return (
                            <button
                              key={cs.problemId || idx}
                              type="button"
                              onClick={() => setSelectedCodingProblemIdx(idx)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ease-out flex items-center gap-2 shrink-0 cursor-pointer ${
                                isSelected
                                  ? 'bg-accent text-white shadow-xs'
                                  : 'bg-surface-secondary text-label-secondary hover:text-label-primary border border-separator'
                              }`}
                            >
                              <span>Problem {idx + 1}: {cs.problemTitle || 'Challenge'}</span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isAccepted ? 'bg-success' : 'bg-destructive'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedCoding && (
                      <div className="space-y-4">
                        {/* Selected Problem Header Card */}
                        <div className="p-4 sm:p-5 rounded-2xl border border-separator bg-surface-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-extrabold text-label-primary tracking-tight">
                                {selectedCoding.problemTitle || `Challenge #${selectedCodingProblemIdx + 1}`}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent-subtle text-accent border border-accent/20">
                                {selectedCoding.problemDifficulty || 'Medium'}
                              </span>
                            </div>
                            {selectedCoding.problemDescription && (
                              <p className="text-xs text-label-tertiary mt-1 line-clamp-2">
                                {selectedCoding.problemDescription}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase tracking-wider ${
                                selectedCoding.status === 'ACCEPTED'
                                  ? 'bg-success-subtle text-success border border-success/30'
                                  : selectedCoding.status === 'WRONG_ANSWER'
                                  ? 'bg-destructive-subtle text-destructive border border-destructive/30'
                                  : 'bg-warning-subtle text-warning border border-warning/30'
                              }`}
                            >
                              {selectedCoding.status}
                            </span>
                            <span className="px-3 py-1 bg-surface border border-separator rounded-xl text-xs font-mono font-bold text-label-primary">
                              {selectedCoding.passedTestCases || 0} / {selectedCoding.totalTestCases || 0} Tests Passed
                            </span>
                            <span className="px-3 py-1 bg-info-subtle text-info border border-info/20 rounded-xl text-xs font-mono font-bold">
                              +{selectedCoding.pointsEarned || 0} / {selectedCoding.maxPoints || 30} pts
                            </span>
                          </div>
                        </div>

                        {/* Code Inspector Box */}
                        <div className="rounded-2xl border border-separator overflow-hidden shadow-card bg-canvas">
                          {/* Code Top Action Bar */}
                          <div className="px-4 py-2.5 bg-surface border-b border-separator flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                              <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                              <span className="w-2.5 h-2.5 rounded-full bg-success" />
                              <span className="ml-2 font-mono text-[11px] font-bold text-label-tertiary uppercase">
                                {selectedCoding.language || 'python'} solution
                              </span>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onPress={() => handleCopyCode(selectedCoding.code || '')}
                              className="px-2.5 py-1 h-auto rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5"
                            >
                              {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                              <span>{copied ? 'Copied' : 'Copy Code'}</span>
                            </Button>
                          </div>

                          {/* Raw Syntax Highlighted / Monospaced Code */}
                          <pre className="p-4 sm:p-5 text-label-primary font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed selection:bg-accent-subtle selection:text-label-primary">
                            {selectedCoding.code || '// No code submitted by participant'}
                          </pre>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* --- TAB 3: AUDIT & PERFORMANCE BREAKDOWN --- */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-surface-secondary border border-separator space-y-1">
                    <span className="text-[10px] font-bold uppercase font-mono text-label-tertiary">
                      Total Contest Score
                    </span>
                    <p className="text-2xl font-black text-accent">{submission.totalScore || 0} PTS</p>
                    <p className="text-[11px] text-label-secondary">
                      MCQ: {mcqTotalPointsEarned} + Coding: {codingTotalPointsEarned}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-secondary border border-separator space-y-1">
                    <span className="text-[10px] font-bold uppercase font-mono text-label-tertiary">
                      Awarded Club XP
                    </span>
                    <p className="text-2xl font-black text-success">
                      {submission.awardedClubPoints || 0} XP
                    </p>
                    <p className="text-[11px] text-label-secondary">
                      {submission.pointsAwarded ? 'Credited to student profile' : 'Pending evaluation'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-secondary border border-separator space-y-1">
                    <span className="text-[10px] font-bold uppercase font-mono text-label-tertiary">
                      Time Elapsed
                    </span>
                    <p className="text-2xl font-black text-label-primary font-mono">
                      {formatSeconds(submission.timeTakenSeconds)}
                    </p>
                    <p className="text-[11px] text-label-secondary">From session start to finalize</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-secondary border border-separator space-y-1">
                    <span className="text-[10px] font-bold uppercase font-mono text-label-tertiary">
                      Session Status
                    </span>
                    <p className="text-2xl font-black text-label-primary uppercase text-sm mt-1">
                      {submission.status}
                    </p>
                    <p className="text-[11px] text-label-secondary">
                      {submission.submittedAt ? formatISTDateTime(submission.submittedAt) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Manual Adjustment Card */}
                {submission.manualPointsAdjustment ? (
                  <div className="p-5 rounded-2xl bg-warning-subtle border border-warning/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-warning font-bold text-xs uppercase tracking-wider">
                        <Zap size={14} />
                        <span>Manual Point Adjustment Active</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-warning">
                        {submission.manualPointsAdjustment > 0
                          ? `+${submission.manualPointsAdjustment}`
                          : submission.manualPointsAdjustment}{' '}
                        Points
                      </span>
                    </div>
                    {submission.manualPointsReason && (
                      <p className="text-xs text-label-secondary">
                        <span className="font-semibold text-label-primary">Reason:</span>{' '}
                        {submission.manualPointsReason}
                      </p>
                    )}
                    {submission.manualAllocatedBy && (
                      <p className="text-[11px] text-label-tertiary">
                        Evaluated by {submission.manualAllocatedBy?.name || 'Administrator'} on{' '}
                        {submission.manualAllocatedAt ? formatISTDateTime(submission.manualAllocatedAt) : 'N/A'}
                      </p>
                    )}
                  </div>
                ) : null}

                {/* Participant Information Card */}
                <div className="p-5 rounded-2xl border border-separator bg-surface-secondary space-y-3">
                  <h4 className="text-xs font-bold uppercase font-mono text-label-tertiary flex items-center gap-1.5">
                    <User size={14} />
                    <span>Participant Identification</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-label-tertiary">Full Name</span>
                      <p className="font-bold text-label-primary">{studentName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-label-tertiary">Roll Number</span>
                      <p className="font-bold text-label-primary font-mono">{studentRoll}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-label-tertiary">Registered Email</span>
                      <p className="font-bold text-label-primary truncate">{studentEmail}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* Footer */}
        <div className="pt-4 border-t border-separator flex items-center justify-between text-xs gap-2">
          <span className="text-label-secondary font-medium text-[11px] sm:text-xs truncate">
            Contest Review Engine • Code Circle
          </span>
          <Button
            variant="secondary"
            onPress={onClose}
            className="px-5 py-2 rounded-full text-xs font-medium"
          >
            Close
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default ContestSubmissionDetailModal;
