import React, { useState, useEffect } from 'react';
import ResponsiveModal from '../ui/ResponsiveModal';
import {
  X,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  RefreshCw,
  Copy,
  Check,
  GraduationCap,
  AlertTriangle,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'react-hot-toast';
import { ILevel } from '../../types/domain';
import { formatISTDateTime } from '../../lib/dateUtils';

interface LevelSubmissionsModalProps {
  isOpen: boolean;
  level: ILevel;
  onClose: () => void;
}

interface StudentSubmissionRecord {
  student: {
    _id: string;
    name: string;
    email: string;
    rollNo: string;
    department: string;
    avatar?: string;
  };
  levelCompleted: boolean;
  questCompleted: boolean;
  questSubmission?: {
    answers?: any[];
    detailedResults?: Array<{
      questionIndex: number;
      question: string;
      selectedOption: number;
      correctOption: number;
      isCorrect: boolean;
    }>;
    score?: number;
    total?: number;
    passRate?: number;
    passed?: boolean;
    submittedAt?: string;
  };
  assessmentSubmission?: any;
  sessions: any[];
  submissions: {
    challengeTitle: string;
    language: string;
    code: string;
    status: string;
    score: number;
    passed: number;
    total: number;
    submittedAt?: string;
    details?: any;
  }[];
  bestScore: number;
  verdict: 'passed' | 'failed' | 'in_progress' | 'unattempted';
  totalAttempts: number;
  lastActivityAt: string;
}

export const LevelSubmissionsModal: React.FC<LevelSubmissionsModalProps> = ({
  isOpen,
  level,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentSubmissionRecord[]>([]);
  const [levelDetails, setLevelDetails] = useState<any>(level);
  const [passedCount, setPassedCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [search, setSearch] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<'all' | 'passed' | 'failed' | 'in_progress'>('all');

  // Selected student submission for detailed inspection
  const [inspectingStudent, setInspectingStudent] = useState<StudentSubmissionRecord | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'questions' | 'code'>('questions');
  const [activeCodeTab, setActiveCodeTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const fetchSubmissions = async () => {
    if (!level?._id) return;
    setLoading(true);
    try {
      const res = await api.get(`/levels/${level._id}/submissions`);
      if (res.data.success) {
        setStudents(res.data.students || []);
        setPassedCount(res.data.passedCount || 0);
        setTotalStudents(res.data.totalStudents || 0);
        if (res.data.level) {
          setLevelDetails((prev: any) => ({ ...prev, ...res.data.level }));
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch level submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && level?._id) {
      fetchSubmissions();
    }
  }, [isOpen, level?._id]);

  if (!isOpen) return null;

  const currentLevel = levelDetails || level;
  const questQuestions: any[] = currentLevel.questQuestions || [];

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student?.rollNo?.toLowerCase().includes(search.toLowerCase()) ||
      s.student?.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.student?.department?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (verdictFilter === 'all') return true;
    if (verdictFilter === 'passed') return s.verdict === 'passed' || s.levelCompleted;
    if (verdictFilter === 'failed') return s.verdict === 'failed' && !s.levelCompleted;
    if (verdictFilter === 'in_progress') return s.verdict === 'in_progress';
    return true;
  });

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export all students ledger to CSV
  const handleExportAllCsv = () => {
    try {
      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const headers = [
        'Level Number',
        'Level Title',
        'Student Name',
        'Roll Number',
        'Department',
        'Email',
        'Verdict',
        'Best Score',
        'Quest Completed',
        'Quest Score',
        'Total Attempts',
        'Code Submissions Count',
        'Last Activity At',
      ];

      const rows: string[] = [headers.join(',')];

      students.forEach((s) => {
        const questScoreText = s.questSubmission
          ? `${s.questSubmission.score}/${s.questSubmission.total}`
          : s.questCompleted
          ? 'Completed'
          : 'Not Done';

        rows.push(
          [
            currentLevel.levelNumber || 1,
            escapeCsv(currentLevel.title || 'Course Level'),
            escapeCsv(s.student.name),
            escapeCsv(s.student.rollNo),
            escapeCsv(s.student.department),
            escapeCsv(s.student.email),
            escapeCsv(s.verdict.toUpperCase()),
            s.bestScore,
            escapeCsv(s.questCompleted ? 'YES' : 'NO'),
            escapeCsv(questScoreText),
            s.totalAttempts,
            s.submissions ? s.submissions.length : 0,
            escapeCsv(s.lastActivityAt ? new Date(s.lastActivityAt).toISOString() : ''),
          ].join(',')
        );
      });

      const csvContent = rows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeTitle = (currentLevel.title || 'level').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `Level_${currentLevel.levelNumber}_${safeTitle}_Submissions.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Course level submissions exported successfully');
    } catch {
      toast.error('Failed to export CSV ledger');
    }
  };

  // Export single student detailed report to CSV
  const handleExportStudentCsv = (studentRec: StudentSubmissionRecord) => {
    try {
      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const headers = [
        'Course Level',
        'Student Name',
        'Roll Number',
        'Department',
        'Email',
        'Item Type',
        'Question / Challenge Title',
        'Student Answer / Code Status',
        'Correct Answer / Language',
        'Result',
        'Score Earned',
      ];

      const rows: string[] = [headers.join(',')];

      // Quest questions
      const questResults =
        studentRec.questSubmission?.detailedResults ||
        questQuestions.map((q, idx) => ({
          questionIndex: idx,
          question: q.question,
          selectedOption: studentRec.questCompleted ? q.correctOption : -1,
          correctOption: q.correctOption,
          isCorrect: studentRec.questCompleted,
        }));

      questResults.forEach((qr, idx) => {
        const fullQ = questQuestions[qr.questionIndex ?? idx];
        const options = fullQ?.options || [];
        const studentAnsText =
          qr.selectedOption >= 0 && options[qr.selectedOption]
            ? `${String.fromCharCode(65 + qr.selectedOption)}: ${options[qr.selectedOption]}`
            : qr.selectedOption >= 0
            ? `Option ${qr.selectedOption + 1}`
            : 'Unanswered';

        const correctAnsText =
          options[qr.correctOption]
            ? `${String.fromCharCode(65 + qr.correctOption)}: ${options[qr.correctOption]}`
            : `Option ${qr.correctOption + 1}`;

        rows.push(
          [
            escapeCsv(`Level ${currentLevel.levelNumber}: ${currentLevel.title}`),
            escapeCsv(studentRec.student.name),
            escapeCsv(studentRec.student.rollNo),
            escapeCsv(studentRec.student.department),
            escapeCsv(studentRec.student.email),
            'Quest Question',
            escapeCsv(qr.question || `Question #${idx + 1}`),
            escapeCsv(studentAnsText),
            escapeCsv(correctAnsText),
            escapeCsv(qr.isCorrect ? 'CORRECT' : 'INCORRECT'),
            qr.isCorrect ? 1 : 0,
          ].join(',')
        );
      });

      // Coding Submissions
      if (studentRec.submissions && studentRec.submissions.length > 0) {
        studentRec.submissions.forEach((sub, idx) => {
          rows.push(
            [
              escapeCsv(`Level ${currentLevel.levelNumber}: ${currentLevel.title}`),
              escapeCsv(studentRec.student.name),
              escapeCsv(studentRec.student.rollNo),
              escapeCsv(studentRec.student.department),
              escapeCsv(studentRec.student.email),
              `Coding Attempt #${idx + 1}`,
              escapeCsv(sub.challengeTitle || 'Coding Challenge'),
              escapeCsv(`Status: ${sub.status} (${sub.passed}/${sub.total} test cases)`),
              escapeCsv(`Language: ${sub.language}`),
              escapeCsv(sub.status === 'passed' ? 'PASSED' : 'FAILED'),
              sub.score || 0,
            ].join(',')
          );
        });
      }

      const csvContent = rows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = studentRec.student.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `Level_${currentLevel.levelNumber}_Report_${safeName}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Student report CSV downloaded');
    } catch {
      toast.error('Failed to export student CSV report');
    }
  };

  // Print / PDF single student report
  const handlePrintStudentPdf = (studentRec: StudentSubmissionRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to generate printable report');
      return;
    }

    const questResults =
      studentRec.questSubmission?.detailedResults ||
      questQuestions.map((q, idx) => ({
        questionIndex: idx,
        question: q.question,
        selectedOption: studentRec.questCompleted ? q.correctOption : -1,
        correctOption: q.correctOption,
        isCorrect: studentRec.questCompleted,
      }));

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Course Level Report - ${studentRec.student.name}</title>
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
      padding-bottom: 18px;
      margin-bottom: 22px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand {
      font-size: 20px;
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
      font-size: 17px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 4px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 22px;
    }
    .meta-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
    }
    .meta-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
    }
    .meta-val {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 3px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-pass { background: #dcfce7; color: #15803d; }
    .badge-fail { background: #fee2e2; color: #b91c1c; }
    .section-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 22px 0 12px 0;
      color: #334155;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
    }
    .question-block {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .q-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .q-num {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
    }
    .q-text {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .option-list {
      display: grid;
      gap: 6px;
    }
    .option-item {
      padding: 7px 10px;
      border-radius: 6px;
      font-size: 11px;
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
    .code-container {
      background: #0f172a;
      color: #38bdf8;
      border-radius: 10px;
      padding: 14px;
      font-family: monospace;
      font-size: 11px;
      white-space: pre-wrap;
      overflow-x: auto;
      margin-top: 8px;
      page-break-inside: avoid;
    }
    @media print {
      body { margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">CODE CIRCLE</div>
      <div class="brand-sub">Course level assessment dossier</div>
      <div class="title">Level ${currentLevel.levelNumber}: ${currentLevel.title}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 11px; color: #64748b; font-weight: 600;">Evaluation timestamp</div>
      <div style="font-size: 12px; font-weight: 600; color: #0f172a;">${formatISTDateTime(studentRec.lastActivityAt)}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-card">
      <div class="meta-label">Student name</div>
      <div class="meta-val">${studentRec.student.name}</div>
      <div style="font-size: 10px; color: #64748b;">${studentRec.student.rollNo} • ${studentRec.student.department}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Overall verdict</div>
      <div class="meta-val">
        <span class="badge ${studentRec.verdict === 'passed' ? 'badge-pass' : 'badge-fail'}">
          ${studentRec.verdict.toUpperCase()}
        </span>
      </div>
      <div style="font-size: 10px; color: #64748b;">Level ${studentRec.levelCompleted ? 'Completed' : 'Incomplete'}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Best score</div>
      <div class="meta-val">${studentRec.bestScore} pts</div>
      <div style="font-size: 10px; color: #64748b;">Total attempts: ${studentRec.totalAttempts}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Quest status</div>
      <div class="meta-val">
        <span class="badge ${studentRec.questCompleted ? 'badge-pass' : 'badge-fail'}">
          ${studentRec.questCompleted ? 'PASSED' : 'PENDING'}
        </span>
      </div>
      <div style="font-size: 10px; color: #64748b;">${questQuestions.length} questions</div>
    </div>
  </div>

  ${
    questResults.length > 0
      ? `
    <div class="section-title">Quest questions & answers (${questResults.length} questions)</div>
    ${questResults
      .map((qr, idx) => {
        const fullQ = questQuestions[qr.questionIndex ?? idx];
        const options = fullQ?.options || [];

        return `
      <div class="question-block">
        <div class="q-head">
          <span class="q-num">QUEST QUESTION #${idx + 1}</span>
          <span class="badge ${qr.isCorrect ? 'badge-pass' : 'badge-fail'}">
            ${qr.isCorrect ? 'CORRECT' : 'INCORRECT'}
          </span>
        </div>
        <div class="q-text">${qr.question || fullQ?.question || `Question #${idx + 1}`}</div>
        <div class="option-list">
          ${
            options.length > 0
              ? options
                  .map((optText: string, optIdx: number) => {
                    const isSelected = qr.selectedOption === optIdx;
                    const isAnswer = qr.correctOption === optIdx;
                    let cls = 'option-item';
                    let tag = '';

                    if (isSelected && isAnswer) {
                      cls += ' correct';
                      tag = 'Student answer (correct)';
                    } else if (isSelected && !isAnswer) {
                      cls += ' incorrect';
                      tag = 'Student answer';
                    } else if (isAnswer) {
                      cls += ' correct';
                      tag = 'Correct answer';
                    }

                    return `
              <div class="${cls}">
                <span><strong>${String.fromCharCode(65 + optIdx)}.</strong> ${optText}</span>
                ${tag ? `<span style="font-size: 9px; font-weight: 600;">${tag}</span>` : ''}
              </div>
            `;
                  })
                  .join('')
              : `<div>Selected: Option ${qr.selectedOption + 1} | Correct: Option ${qr.correctOption + 1}</div>`
          }
        </div>
      </div>
      `;
      })
      .join('')}
  `
      : ''
  }

  ${
    studentRec.submissions && studentRec.submissions.length > 0
      ? `
    <div class="section-title">Coding challenge submission</div>
    ${studentRec.submissions
      .map(
        (sub, idx) => `
      <div class="question-block">
        <div class="q-head">
          <span class="q-num">${sub.challengeTitle} (Attempt #${idx + 1} - ${sub.language})</span>
          <span class="badge ${sub.status === 'passed' ? 'badge-pass' : 'badge-fail'}">
            ${sub.status.toUpperCase()} (${sub.passed}/${sub.total} passed)
          </span>
        </div>
        <div class="code-container">${sub.code || '// No code submitted'}</div>
      </div>
    `
      )
      .join('')}
  `
      : ''
  }

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
    <>
      <ResponsiveModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span>{currentLevel.title}</span>
          </div>
        }
        description={`Level ${currentLevel.levelNumber} · Course submissions ledger and student performance.`}
        dialogClassName="sm:max-w-5xl p-6"
      >
        <div className="space-y-4 pt-1">
          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-secondary rounded-2xl border border-separator">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/25">
                Level {currentLevel.levelNumber}
              </span>
              <span className="text-xs text-label-secondary">
                {totalStudents} student records
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAllCsv}
                disabled={students.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-50"
                title="Download entire course level submissions ledger as CSV"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>

              <button
                onClick={fetchSubmissions}
                disabled={loading}
                className="p-1.5 text-label-secondary hover:text-label-primary bg-surface hover:bg-surface-raised border border-separator rounded-xl transition cursor-pointer"
                title="Refresh submissions"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-surface-secondary rounded-2xl border border-separator">
              <p className="text-[10px] uppercase font-bold text-label-secondary tracking-wider">
                Total Students
              </p>
              <p className="text-xl font-bold tabular-nums text-label-primary mt-0.5">
                {totalStudents}
              </p>
            </div>

            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                Passed Students
              </p>
              <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                {passedCount}
              </p>
            </div>

            <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20">
              <p className="text-[10px] uppercase font-bold text-accent tracking-wider">
                Pass Rate
              </p>
              <p className="text-xl font-bold tabular-nums text-accent mt-0.5">
                {totalStudents > 0 ? `${Math.round((passedCount / totalStudents) * 100)}%` : '0%'}
              </p>
            </div>

            <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
              <p className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">
                Points Available
              </p>
              <p className="text-xl font-bold tabular-nums text-purple-600 dark:text-purple-400 mt-0.5">
                {currentLevel.points || 50} pts
              </p>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 bg-surface-secondary rounded-2xl border border-separator">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3.5 top-2.5 text-label-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, roll no, department..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-separator rounded-xl text-label-primary focus:outline-none focus:border-accent transition font-normal"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'passed', 'failed', 'in_progress'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setVerdictFilter(filterKey)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap cursor-pointer tabular-nums ${
                    verdictFilter === filterKey
                      ? 'bg-accent text-white shadow-xs'
                      : 'bg-surface border border-separator text-label-secondary hover:text-label-primary'
                  }`}
                >
                  {filterKey === 'all' ? `All (${students.length})` : filterKey.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions List Body */}
          <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1">
            {loading ? (
              <div className="space-y-3 py-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-surface-secondary rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <GraduationCap className="w-10 h-10 mx-auto text-label-tertiary stroke-1 opacity-60" />
                <h3 className="text-sm font-semibold tracking-tight text-label-primary">No student submissions found</h3>
                <p className="text-xs text-label-tertiary max-w-sm mx-auto">
                  {search
                    ? 'No submissions matched your search query. Try clearing filters.'
                    : 'Students have not submitted any quests or challenges for this level yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map((rec) => {
                  const isPassed = rec.verdict === 'passed' || rec.levelCompleted;
                  const isFailed = rec.verdict === 'failed' && !rec.levelCompleted;
                  const hasCode = rec.submissions && rec.submissions.length > 0;

                  return (
                    <div
                      key={rec.student._id}
                      className="p-3.5 bg-surface-secondary/50 rounded-2xl border border-separator hover:border-separator/90 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                    >
                      {/* Student Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-semibold text-xs uppercase shrink-0">
                          {rec.student.avatar ? (
                            <img
                              src={rec.student.avatar}
                              alt=""
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            rec.student.name.slice(0, 2)
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-semibold text-label-primary truncate">
                              {rec.student.name}
                            </h4>
                            {rec.student.rollNo && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface border border-separator text-label-secondary font-medium tabular-nums">
                                {rec.student.rollNo}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-label-tertiary mt-0.5">
                            <span>{rec.student.email}</span>
                            {rec.student.department && (
                              <>
                                <span>•</span>
                                <span>{rec.student.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Submissions & Verdict Badges & Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {rec.questCompleted && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            Quest done
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium tabular-nums bg-surface border border-separator text-label-primary">
                          Score: {rec.bestScore}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                            isPassed
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : isFailed
                              ? 'bg-destructive/15 text-destructive border border-destructive/30'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isPassed ? (
                            <>
                              <CheckCircle2 size={11} /> Passed
                            </>
                          ) : isFailed ? (
                            <>
                              <XCircle size={11} /> Failed
                            </>
                          ) : (
                            <>
                              <Clock size={11} /> In Progress
                            </>
                          )}
                        </span>

                        <button
                          onClick={() => {
                            setInspectingStudent(rec);
                            setActiveDetailTab(
                              questQuestions.length > 0 || rec.questSubmission
                                ? 'questions'
                                : hasCode
                                ? 'code'
                                : 'questions'
                            );
                            setActiveCodeTab(0);
                          }}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText size={12} />
                          <span>Report</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-separator flex items-center justify-between text-xs text-label-tertiary">
            <span>Viewing {filteredStudents.length} of {totalStudents} student records</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full text-xs font-medium border border-separator text-label-secondary hover:text-label-primary cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </ResponsiveModal>

      {/* Inspecting Student Dossier Modal */}
      {inspectingStudent && (
        <ResponsiveModal
          open={Boolean(inspectingStudent)}
          onOpenChange={(open) => {
            if (!open) setInspectingStudent(null);
          }}
          title={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <Code2 className="w-4 h-4" />
              </div>
              <span>{inspectingStudent.student.name}</span>
            </div>
          }
          description={`Level ${currentLevel.levelNumber}: ${currentLevel.title} · Student Performance Dossier`}
          dialogClassName="sm:max-w-4xl p-6"
        >
          <div className="space-y-4 pt-1">
            {/* Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-secondary rounded-2xl border border-separator">
              <div className="flex items-center gap-2">
                {inspectingStudent.student.rollNo && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-separator text-label-secondary font-medium tabular-nums">
                    {inspectingStudent.student.rollNo}
                  </span>
                )}
                <span className="text-xs text-label-tertiary">
                  {inspectingStudent.student.email}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintStudentPdf(inspectingStudent)}
                  className="px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Print or save PDF report"
                >
                  <Printer size={13} />
                  <span>Print / PDF</span>
                </button>

                <button
                  onClick={() => handleExportStudentCsv(inspectingStudent)}
                  className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Export CSV report"
                >
                  <FileSpreadsheet size={13} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Performance Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-surface-secondary rounded-2xl border border-separator">
              <div className="p-2.5 bg-surface rounded-xl border border-separator">
                <span className="text-[10px] text-label-tertiary uppercase font-bold">Verdict</span>
                <p
                  className={`text-xs font-semibold uppercase font-mono mt-0.5 ${
                    inspectingStudent.verdict === 'passed' || inspectingStudent.levelCompleted
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-500'
                  }`}
                >
                  {inspectingStudent.verdict === 'passed' || inspectingStudent.levelCompleted ? 'Passed' : 'In Progress'}
                </p>
              </div>

              <div className="p-2.5 bg-surface rounded-xl border border-separator">
                <span className="text-[10px] text-label-tertiary uppercase font-bold">Best Score</span>
                <p className="text-xs font-semibold tabular-nums text-amber-500 font-mono mt-0.5">
                  {inspectingStudent.bestScore} pts
                </p>
              </div>

              <div className="p-2.5 bg-surface rounded-xl border border-separator">
                <span className="text-[10px] text-label-tertiary uppercase font-bold">Quest Status</span>
                <p className="text-xs font-semibold text-label-primary font-mono mt-0.5">
                  {inspectingStudent.questCompleted ? 'Completed' : 'Pending'}
                </p>
              </div>

              <div className="p-2.5 bg-surface rounded-xl border border-separator">
                <span className="text-[10px] text-label-tertiary uppercase font-bold">Submissions</span>
                <p className="text-xs font-semibold tabular-nums text-accent font-mono mt-0.5">
                  {inspectingStudent.submissions ? inspectingStudent.submissions.length : 0} attempt(s)
                </p>
              </div>
            </div>

            {/* Detail Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-surface-secondary border border-separator rounded-2xl">
              <button
                onClick={() => setActiveDetailTab('questions')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer tabular-nums ${
                  activeDetailTab === 'questions'
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <FileText size={13} />
                <span>Questions & Answers ({questQuestions.length})</span>
              </button>

              {inspectingStudent.submissions && inspectingStudent.submissions.length > 0 && (
                <button
                  onClick={() => setActiveDetailTab('code')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer tabular-nums ${
                    activeDetailTab === 'code'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-label-secondary hover:text-label-primary'
                  }`}
                >
                  <Code2 size={13} />
                  <span>Coding Solution ({inspectingStudent.submissions.length})</span>
                </button>
              )}
            </div>

            {/* Dossier Body */}
            <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1">
              {activeDetailTab === 'questions' ? (
                questQuestions.length === 0 ? (
                  <div className="text-center py-12 text-label-tertiary text-xs">
                    No quest questions configured for this course level.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questQuestions.map((q: any, idx: number) => {
                      const detailedRes =
                        inspectingStudent.questSubmission?.detailedResults?.[idx];
                      const selectedOption =
                        detailedRes?.selectedOption ??
                        (inspectingStudent.questCompleted ? q.correctOption : -1);
                      const correctOption = q.correctOption ?? detailedRes?.correctOption ?? 0;
                      const isCorrect =
                        detailedRes?.isCorrect ?? (selectedOption === correctOption && selectedOption !== -1);

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-surface-secondary/40 border border-separator space-y-3 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-separator pb-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-surface border border-separator text-label-secondary tabular-nums">
                              QUESTION #{idx + 1}
                            </span>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                                isCorrect
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-destructive/15 text-destructive border border-destructive/30'
                              }`}
                            >
                              {isCorrect ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm font-semibold text-label-primary leading-relaxed">
                            {q.question}
                          </p>

                          {/* Options */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options &&
                              q.options.map((optText: string, optIdx: number) => {
                                const isSelected = selectedOption === optIdx;
                                const isAnswer = correctOption === optIdx;

                                let styleClass = 'bg-surface border-separator text-label-secondary';
                                if (isSelected && isAnswer) {
                                  styleClass = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-medium';
                                } else if (isSelected && !isAnswer) {
                                  styleClass = 'bg-destructive/15 border-destructive/40 text-rose-600 dark:text-rose-300 font-medium';
                                } else if (isAnswer) {
                                  styleClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium';
                                }

                                return (
                                  <div
                                    key={optIdx}
                                    className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 text-xs transition-all ${styleClass}`}
                                  >
                                    <div className="flex items-start gap-2 min-w-0">
                                      <span className="w-4 h-4 rounded bg-surface-secondary border border-separator flex items-center justify-center font-medium text-[9px] text-label-primary shrink-0 mt-0.5">
                                        {String.fromCharCode(65 + optIdx)}
                                      </span>
                                      <span className="break-words leading-relaxed">{optText}</span>
                                    </div>

                                    {isSelected && (
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider shrink-0 ${
                                          isAnswer
                                            ? 'bg-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                            : 'bg-destructive/30 text-rose-600 dark:text-rose-300'
                                        }`}
                                      >
                                        Student
                                      </span>
                                    )}
                                    {isAnswer && !isSelected && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                                        Correct
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                (() => {
                  const activeSub =
                    inspectingStudent.submissions[activeCodeTab] || inspectingStudent.submissions[0];
                  if (!activeSub) return null;

                  return (
                    <div className="space-y-4">
                      {inspectingStudent.submissions.length > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {inspectingStudent.submissions.map((sub, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveCodeTab(idx)}
                              className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer tabular-nums ${
                                activeCodeTab === idx
                                  ? 'bg-accent text-white shadow-xs'
                                  : 'bg-surface-secondary border border-separator text-label-secondary hover:text-label-primary'
                              }`}
                            >
                              Attempt #{idx + 1} ({sub.language}) - {sub.status}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Execution Metrics Banner */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 bg-surface-secondary rounded-xl border border-separator">
                          <span className="text-[10px] text-label-tertiary uppercase font-bold">Language</span>
                          <p className="text-xs font-semibold text-accent uppercase font-mono mt-0.5">
                            {activeSub.language || 'python'}
                          </p>
                        </div>

                        <div className="p-3 bg-surface-secondary rounded-xl border border-separator">
                          <span className="text-[10px] text-label-tertiary uppercase font-bold">Verdict</span>
                          <p
                            className={`text-xs font-semibold uppercase font-mono mt-0.5 ${
                              activeSub.status === 'passed'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-500'
                            }`}
                          >
                            {activeSub.status}
                          </p>
                        </div>

                        <div className="p-3 bg-surface-secondary rounded-xl border border-separator">
                          <span className="text-[10px] text-label-tertiary uppercase font-bold">Test cases</span>
                          <p className="text-xs font-semibold tabular-nums text-label-primary font-mono mt-0.5">
                            {activeSub.passed} / {activeSub.total || 0} passed
                          </p>
                        </div>

                        <div className="p-3 bg-surface-secondary rounded-xl border border-separator">
                          <span className="text-[10px] text-label-tertiary uppercase font-bold">Score awarded</span>
                          <p className="text-xs font-semibold tabular-nums text-amber-500 font-mono mt-0.5">
                            +{activeSub.score} pts
                          </p>
                        </div>
                      </div>

                      {/* Source Code Container */}
                      <div className="relative rounded-2xl bg-surface-secondary border border-separator overflow-hidden flex flex-col min-h-[260px]">
                        <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-separator text-xs text-label-secondary font-mono">
                          <span>source_code.{activeSub.language === 'python' ? 'py' : activeSub.language === 'cpp' ? 'cpp' : activeSub.language === 'java' ? 'java' : 'js'}</span>
                          <button
                            onClick={() => handleCopyCode(activeSub.code)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-secondary hover:bg-surface border border-separator text-label-primary transition cursor-pointer"
                          >
                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>

                        <pre className="p-4 text-xs font-mono text-emerald-600 dark:text-emerald-300 leading-relaxed overflow-x-auto flex-1 select-text">
                          <code>{activeSub.code || '// No code submitted in this attempt'}</code>
                        </pre>
                      </div>

                      {/* Error diagnostics if any */}
                      {activeSub.details?.error && (
                        <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-mono space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <AlertTriangle size={14} />
                            <span>Compiler / Runtime diagnostics:</span>
                          </div>
                          <pre className="whitespace-pre-wrap">{activeSub.details.error}</pre>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-separator flex items-center justify-between text-xs text-label-tertiary">
              <span>Code Circle Performance Dossier</span>
              <button
                type="button"
                onClick={() => setInspectingStudent(null)}
                className="px-4 py-1.5 rounded-full text-xs font-medium border border-separator text-label-secondary hover:text-label-primary cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </ResponsiveModal>
      )}
    </>
  );
};

export default LevelSubmissionsModal;
