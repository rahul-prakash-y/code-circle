import ResponsiveModal from '../ui/ResponsiveModal';
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  CheckCircle2,
  XCircle,
  Printer,
  FileSpreadsheet,
  Search,
  Info,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { formatISTDateTime } from '../../lib/dateUtils';
import toast from 'react-hot-toast';

export interface AssessmentSubmissionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any;
  assessment: any;
}

export const AssessmentSubmissionDetailModal: React.FC<AssessmentSubmissionDetailModalProps> = ({
  isOpen,
  onClose,
  submission,
  assessment,
}) => {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [search, setSearch] = useState('');

  if (!isOpen || !submission) return null;

  const student = submission.user || {};
  const studentName = student.name || 'Anonymous Student';
  const studentRoll = student.rollNo || 'N/A';
  const studentEmail = student.email || '';
  const studentDept = student.department || 'Student';

  // Questions consolidation: map assessment questions with submission answers/detailedResults
  const consolidatedQuestions = useMemo(() => {
    const rawQuestions: any[] = assessment?.questions || [];
    const detailedList: any[] = submission.detailedResults || [];
    const answersList: any[] = submission.answers || [];

    const ansMap = new Map<number, number>();
    answersList.forEach((a) => {
      ansMap.set(a.questionIndex, a.selectedOption);
    });

    const detailedMap = new Map<number, any>();
    detailedList.forEach((d) => {
      detailedMap.set(d.questionIndex, d);
    });

    if (rawQuestions.length > 0) {
      return rawQuestions.map((q, idx) => {
        const d = detailedMap.get(idx);
        const selectedOption = d ? d.selectedOption : ansMap.has(idx) ? ansMap.get(idx)! : -1;
        const correctOptionIndex = q.correctOptionIndex ?? (d ? d.correctOptionIndex : 0);
        const isCorrect = d ? d.isCorrect : (selectedOption === correctOptionIndex && selectedOption !== -1);
        const points = q.points || (d ? d.points : 1) || 1;
        const explanation = q.explanation || (d ? d.explanation : '');

        return {
          questionIndex: idx,
          questionText: q.questionText || `Question ${idx + 1}`,
          options: q.options || [],
          selectedOption,
          correctOptionIndex,
          isCorrect,
          points,
          explanation,
        };
      });
    }

    // Fallback if rawQuestions wasn't provided, use detailedList
    return detailedList.map((d, idx) => ({
      questionIndex: d.questionIndex ?? idx,
      questionText: d.questionText || `Question ${idx + 1}`,
      options: [],
      selectedOption: d.selectedOption ?? -1,
      correctOptionIndex: d.correctOptionIndex ?? 0,
      isCorrect: Boolean(d.isCorrect),
      points: d.points || 1,
      explanation: d.explanation || '',
    }));
  }, [assessment, submission]);

  // Filtered questions
  const filteredQuestions = consolidatedQuestions.filter((q) => {
    const matchesFilter =
      filter === 'all' ? true : filter === 'correct' ? q.isCorrect : !q.isCorrect;
    const matchesSearch =
      search.trim() === '' ||
      q.questionText.toLowerCase().includes(search.toLowerCase()) ||
      (q.options && q.options.some((opt: string) => opt.toLowerCase().includes(search.toLowerCase())));
    return matchesFilter && matchesSearch;
  });

  const correctCount = consolidatedQuestions.filter((q) => q.isCorrect).length;
  const totalCount = consolidatedQuestions.length;
  const incorrectCount = totalCount - correctCount;

  const formatSeconds = (sec: number) => {
    const m = Math.floor((sec || 0) / 60);
    const s = (sec || 0) % 60;
    return `${m}m ${s}s`;
  };

  // Download CSV report for this student
  const handleDownloadCsv = () => {
    try {
      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const headers = [
        'Assessment Title',
        'Student Name',
        'Roll Number',
        'Department',
        'Email',
        'Score',
        'Total Points',
        'Percentage',
        'Verdict',
        'Time Spent (seconds)',
        'Submitted At',
        'Question Number',
        'Question Prompt',
        'Student Selected Option',
        'Correct Option',
        'Result',
        'Points Earned',
        'Explanation',
      ];

      const rows: string[] = [headers.join(',')];

      consolidatedQuestions.forEach((q, idx) => {
        const selectedText =
          q.selectedOption >= 0 && q.options[q.selectedOption]
            ? `${String.fromCharCode(65 + q.selectedOption)}: ${q.options[q.selectedOption]}`
            : q.selectedOption >= 0
            ? `Option ${q.selectedOption + 1}`
            : 'Unanswered';

        const correctText =
          q.options && q.options[q.correctOptionIndex]
            ? `${String.fromCharCode(65 + q.correctOptionIndex)}: ${q.options[q.correctOptionIndex]}`
            : `Option ${q.correctOptionIndex + 1}`;

        rows.push(
          [
            escapeCsv(assessment?.title || 'Assessment'),
            escapeCsv(studentName),
            escapeCsv(studentRoll),
            escapeCsv(studentDept),
            escapeCsv(studentEmail),
            submission.score,
            submission.totalPoints,
            escapeCsv(`${submission.percentage}%`),
            escapeCsv(submission.passed ? 'PASSED' : 'FAILED'),
            submission.timeSpentSeconds || 0,
            escapeCsv(submission.createdAt ? new Date(submission.createdAt).toISOString() : ''),
            idx + 1,
            escapeCsv(q.questionText),
            escapeCsv(selectedText),
            escapeCsv(correctText),
            escapeCsv(q.isCorrect ? 'CORRECT' : 'INCORRECT'),
            q.isCorrect ? q.points : 0,
            escapeCsv(q.explanation || ''),
          ].join(',')
        );
      });

      const csvContent = rows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = studentName.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `Assessment_Report_${safeName}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Student CSV report downloaded');
    } catch {
      toast.error('Failed to export CSV report');
    }
  };

  // Printable HTML / PDF view
  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to generate printable report');
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Assessment Report - ${studentName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 40px;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #6366f1;
      padding-bottom: 20px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand {
      font-size: 22px;
      font-weight: 700;
      color: #4f46e5;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .title {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 4px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 25px;
    }
    .meta-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
    }
    .meta-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .meta-val {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 4px;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-pass { background: #dcfce7; color: #15803d; }
    .badge-fail { background: #fee2e2; color: #b91c1c; }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 25px 0 15px 0;
      color: #334155;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .question-block {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .q-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .q-num {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
    }
    .q-text {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .option-list {
      display: grid;
      gap: 8px;
      margin-bottom: 10px;
    }
    .option-item {
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      border: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .option-item.correct {
      background: #f0fdf4;
      border-color: #86efac;
      color: #166534;
      font-weight: 600;
    }
    .option-item.incorrect {
      background: #fef2f2;
      border-color: #fca5a5;
      color: #991b1b;
      font-weight: 600;
    }
    .explanation {
      background: #f8fafc;
      border-left: 3px solid #6366f1;
      padding: 8px 12px;
      font-size: 11px;
      color: #475569;
      margin-top: 10px;
      border-radius: 0 6px 6px 0;
    }
    @media print {
      body { margin: 15mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">CODE CIRCLE</div>
      <div class="brand-sub">Official student assessment evaluation dossier</div>
      <div class="title">${assessment?.title || 'MCQ Assessment'}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 11px; color: #64748b; font-weight: 600;">Evaluation Date</div>
      <div style="font-size: 12px; font-weight: 600; color: #0f172a;">${formatISTDateTime(submission.createdAt)}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-card">
      <div class="meta-label">Student Name</div>
      <div class="meta-val">${studentName}</div>
      <div style="font-size: 10px; color: #64748b;">${studentRoll} • ${studentDept}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Score Earned</div>
      <div class="meta-val">${submission.score} / ${submission.totalPoints} pts</div>
      <div style="font-size: 10px; color: #64748b;">${correctCount} of ${totalCount} correct</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Result Verdict</div>
      <div class="meta-val">
        <span class="badge ${submission.passed ? 'badge-pass' : 'badge-fail'}">
          ${submission.passed ? 'PASSED' : 'FAILED'} (${submission.percentage}%)
        </span>
      </div>
      <div style="font-size: 10px; color: #64748b;">Req: ${assessment?.passingScorePercentage || 60}%</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Time Taken</div>
      <div class="meta-val">${formatSeconds(submission.timeSpentSeconds)}</div>
      <div style="font-size: 10px; color: #64748b;">${assessment?.category || 'Technical'}</div>
    </div>
  </div>

  <div class="section-title">Question by Question Breakdown (${totalCount} Questions)</div>

  ${consolidatedQuestions
    .map((q, idx) => {
      return `
    <div class="question-block">
      <div class="q-head">
        <span class="q-num">QUESTION #${idx + 1} (${q.points} pt${q.points > 1 ? 's' : ''})</span>
        <span class="badge ${q.isCorrect ? 'badge-pass' : 'badge-fail'}">
          ${q.isCorrect ? 'CORRECT' : 'INCORRECT'}
        </span>
      </div>
      <div class="q-text">${q.questionText}</div>
      <div class="option-list">
        ${
          q.options && q.options.length > 0
            ? q.options
                .map((optText: string, optIdx: number) => {
                  const isSelected = q.selectedOption === optIdx;
                  const isAnswer = q.correctOptionIndex === optIdx;
                  let cls = 'option-item';
                  let tag = '';

                  if (isSelected && isAnswer) {
                    cls += ' correct';
                    tag = 'Student Answer (Correct)';
                  } else if (isSelected && !isAnswer) {
                    cls += ' incorrect';
                    tag = 'Student Answer';
                  } else if (isAnswer) {
                    cls += ' correct';
                    tag = 'Correct Answer';
                  }

                  return `
            <div class="${cls}">
              <span><strong>${String.fromCharCode(65 + optIdx)}.</strong> ${optText}</span>
              ${tag ? `<span style="font-size: 9px; font-weight: 600;">${tag}</span>` : ''}
            </div>
          `;
                })
                .join('')
            : `<div class="option-item ${q.isCorrect ? 'correct' : 'incorrect'}">
                 Selected: Option ${q.selectedOption + 1} | Correct: Option ${q.correctOptionIndex + 1}
               </div>`
        }
      </div>
      ${
        q.explanation
          ? `<div class="explanation"><strong>Explanation:</strong> ${q.explanation}</div>`
          : ''
      }
    </div>
    `;
    })
    .join('')}

  <script>
    window.onload = function() {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <ResponsiveModal
      open={isOpen && Boolean(submission)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span>{studentName}&apos;s Assessment Report</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider tabular-nums border ${
                submission.passed
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}
            >
              {submission.passed ? 'PASSED' : 'FAILED'} ({submission.percentage}%)
            </span>
          </div>
        </div>
      }
      description={`${assessment?.title || 'Assessment'} • ${studentRoll} • ${studentDept}`}
      dialogClassName="sm:max-w-5xl p-6"
    >
      <div className="space-y-4 pt-2">
        {/* Action Header Buttons */}
        <div className="flex items-center justify-between gap-2 p-3 bg-surface-secondary rounded-2xl border border-separator flex-wrap">
          <span className="text-xs font-semibold text-label-secondary">Report Actions:</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onPress={handlePrintPdf}
              className="rounded-full text-xs font-medium flex items-center gap-1.5 shadow-xs"
              title="Print or save PDF report"
            >
              <Printer size={13} />
              <span>Print / PDF</span>
            </Button>

            <Button
              size="sm"
              variant="secondary"
              color="success"
              onPress={handleDownloadCsv}
              className="rounded-full text-xs font-medium flex items-center gap-1.5 shadow-xs"
              title="Download CSV breakdown"
            >
              <FileSpreadsheet size={13} />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 border-b border-white/10 bg-slate-900/40 shrink-0">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[11px] uppercase font-semibold text-white/50 tracking-wider">
              Total score
            </span>
            <p className="text-lg sm:text-xl font-semibold tabular-nums text-white mt-0.5">
              {submission.score} <span className="text-xs text-white/50 font-normal">/ {submission.totalPoints} pts</span>
            </p>
          </div>

          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <span className="text-[11px] uppercase font-semibold text-emerald-400 tracking-wider">
              Correct answers
            </span>
            <p className="text-lg sm:text-xl font-semibold tabular-nums text-emerald-400 mt-0.5">
              {correctCount} <span className="text-xs text-emerald-400/60 font-normal">/ {totalCount} ({Math.round((correctCount / Math.max(1, totalCount)) * 100)}%)</span>
            </p>
          </div>

          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
            <span className="text-[11px] uppercase font-semibold text-red-400 tracking-wider">
              Incorrect answers
            </span>
            <p className="text-lg sm:text-xl font-semibold tabular-nums text-red-400 mt-0.5">
              {incorrectCount} <span className="text-xs text-red-400/60 font-normal">/ {totalCount}</span>
            </p>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[11px] uppercase font-semibold text-white/50 tracking-wider">
              Time taken
            </span>
            <p className="text-lg sm:text-xl font-semibold tabular-nums text-purple-400 mt-0.5">
              {formatSeconds(submission.timeSpentSeconds)}
            </p>
          </div>
        </div>

        {/* Question Filter & Search Bar */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3.5 top-3 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search question prompt or options..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition-all font-normal"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {(['all', 'correct', 'incorrect'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                  filter === mode
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                {mode === 'all'
                  ? `All (${totalCount})`
                  : mode === 'correct'
                  ? `Correct (${correctCount})`
                  : `Incorrect (${incorrectCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Questions and Answers List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-16 text-white/40 text-xs">
              No questions matched your filter or search query.
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              return (
                <div
                  key={q.questionIndex ?? idx}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 hover:border-white/20 transition-all shadow-xs"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium bg-white/10 text-white/80 tabular-nums">
                        Q{q.questionIndex + 1}
                      </span>
                      <span className="text-xs font-medium text-white/50 tabular-nums">
                        {q.points} pt{q.points > 1 ? 's' : ''}
                      </span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                        q.isCorrect
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {q.isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {q.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  {/* Question Text */}
                  <h4 className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                    {q.questionText}
                  </h4>

                  {/* Options List */}
                  {q.options && q.options.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {q.options.map((optText: string, optIdx: number) => {
                        const isStudentAnswer = q.selectedOption === optIdx;
                        const isCorrectAnswer = q.correctOptionIndex === optIdx;

                        let styleClasses = 'bg-white/[0.02] border-white/10 text-white/80';
                        if (isStudentAnswer && isCorrectAnswer) {
                          styleClasses = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-medium';
                        } else if (isStudentAnswer && !isCorrectAnswer) {
                          styleClasses = 'bg-red-500/15 border-red-500/50 text-red-300 font-medium';
                        } else if (isCorrectAnswer) {
                          styleClasses = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-medium';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs sm:text-sm transition-all ${styleClasses}`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center font-medium text-[10px] text-white shrink-0 mt-0.5">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="break-words leading-relaxed">{optText}</span>
                            </div>

                            <div className="shrink-0 flex items-center gap-1">
                              {isStudentAnswer && (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                    isCorrectAnswer
                                      ? 'bg-emerald-500/30 text-emerald-300'
                                      : 'bg-red-500/30 text-red-300'
                                  }`}
                                >
                                  Student choice
                                </span>
                              )}
                              {isCorrectAnswer && !isStudentAnswer && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-400">
                                  Correct key
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-white/5 rounded-xl text-xs text-white/70 flex items-center justify-between">
                      <span>Selected Option: <strong>Option {q.selectedOption >= 0 ? q.selectedOption + 1 : 'None'}</strong></span>
                      <span>Correct Option: <strong>Option {q.correctOptionIndex + 1}</strong></span>
                    </div>
                  )}

                  {/* Explanation Callout */}
                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-2.5 text-xs text-purple-200">
                      <Info size={16} className="text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-purple-300 mr-1.5">Explanation:</span>
                        <span>{q.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-separator flex items-center justify-between text-xs text-label-secondary shrink-0">
          <span>Detailed assessment ledger · Student performance audit</span>
          <Button
            variant="secondary"
            onPress={onClose}
            className="px-5 py-2 rounded-full text-xs font-medium"
          >
            Close Report
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default AssessmentSubmissionDetailModal;
