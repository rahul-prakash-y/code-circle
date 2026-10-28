import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  Terminal,
  Award,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  Filter,
  User,
  GraduationCap,
  Sparkles,
  FileCode,
  AlertTriangle,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Info,
  BookOpen,
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

  // Export all students' ledger to CSV
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
      toast.success('Course level submissions exported successfully!');
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
      toast.success('Student report CSV downloaded!');
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
      font-size: 22px;
      font-weight: 900;
      color: #4f46e5;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .title {
      font-size: 18px;
      font-weight: 800;
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
      font-weight: 700;
    }
    .meta-val {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 3px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .badge-pass { background: #dcfce7; color: #15803d; }
    .badge-fail { background: #fee2e2; color: #b91c1c; }
    .section-title {
      font-size: 13px;
      font-weight: 800;
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
      font-weight: 800;
      color: #64748b;
    }
    .q-text {
      font-size: 13px;
      font-weight: 700;
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
      font-weight: 700;
    }
    .option-item.incorrect {
      background: #fef2f2;
      border-color: #fca5a5;
      color: #991b1b;
      font-weight: 700;
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
      <div class="brand-sub">Course Level Assessment Dossier</div>
      <div class="title">Level ${currentLevel.levelNumber}: ${currentLevel.title}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 11px; color: #64748b; font-weight: 700;">Evaluation Timestamp</div>
      <div style="font-size: 12px; font-weight: 800; color: #0f172a;">${formatISTDateTime(studentRec.lastActivityAt)}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-card">
      <div class="meta-label">Student Name</div>
      <div class="meta-val">${studentRec.student.name}</div>
      <div style="font-size: 10px; color: #64748b;">${studentRec.student.rollNo} • ${studentRec.student.department}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Overall Verdict</div>
      <div class="meta-val">
        <span class="badge ${studentRec.verdict === 'passed' ? 'badge-pass' : 'badge-fail'}">
          ${studentRec.verdict.toUpperCase()}
        </span>
      </div>
      <div style="font-size: 10px; color: #64748b;">Level ${studentRec.levelCompleted ? 'Completed' : 'Incomplete'}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Best Score</div>
      <div class="meta-val">${studentRec.bestScore} pts</div>
      <div style="font-size: 10px; color: #64748b;">Total Attempts: ${studentRec.totalAttempts}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">Quest Status</div>
      <div class="meta-val">
        <span class="badge ${studentRec.questCompleted ? 'badge-pass' : 'badge-fail'}">
          ${studentRec.questCompleted ? 'PASSED' : 'PENDING'}
        </span>
      </div>
      <div style="font-size: 10px; color: #64748b;">${questQuestions.length} Questions</div>
    </div>
  </div>

  ${
    questResults.length > 0
      ? `
    <div class="section-title">Quest Questions & Answers (${questResults.length} Questions)</div>
    ${questResults
      .map((qr, idx) => {
        const fullQ = questQuestions[qr.questionIndex ?? idx];
        const options = fullQ?.options || [];

        return `
      <div class="question-block">
        <div class="q-head">
          <span class="q-num">QUEST QUESTION #${idx + 1}</span>
          <span class="badge ${qr.isCorrect ? 'badge-pass' : 'badge-fail'}">
            ${qr.isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
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
                      tag = '✓ Student Answer (Correct)';
                    } else if (isSelected && !isAnswer) {
                      cls += ' incorrect';
                      tag = '✗ Student Answer';
                    } else if (isAnswer) {
                      cls += ' correct';
                      tag = '✓ Correct Answer';
                    }

                    return `
              <div class="${cls}">
                <span><strong>${String.fromCharCode(65 + optIdx)}.</strong> ${optText}</span>
                ${tag ? `<span style="font-size: 9px; font-weight: 800;">${tag}</span>` : ''}
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
    <div class="section-title">Coding Challenge Submission</div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-surface rounded-3xl border border-separator shadow-2xl overflow-hidden"
      >
        {/* Header Banner */}
        <div className="p-5 sm:p-6 border-b border-separator flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-raised shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent border border-accent/25">
                Level {currentLevel.levelNumber}
              </span>
              <span className="text-xs text-label-tertiary">Course Level Submissions Ledger</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-label-primary tracking-tight mt-1 truncate">
              {currentLevel.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {/* Export All CSV Button */}
            <button
              onClick={handleExportAllCsv}
              disabled={students.length === 0}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              title="Download entire course level submissions ledger as CSV"
            >
              <Download size={14} />
              <span>Export Ledger (CSV)</span>
            </button>

            <button
              onClick={fetchSubmissions}
              disabled={loading}
              className="p-2 text-label-secondary hover:text-label-primary bg-surface hover:bg-surface-raised border border-separator rounded-xl transition-all cursor-pointer"
              title="Refresh submissions"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-label-tertiary hover:text-label-primary bg-surface hover:bg-surface-raised border border-separator rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 border-b border-separator bg-surface shrink-0">
          <div className="p-3 bg-surface-raised rounded-2xl border border-separator/80">
            <p className="text-[10px] uppercase font-bold text-label-secondary tracking-wider">
              Total Students
            </p>
            <p className="text-xl sm:text-2xl font-black text-label-primary mt-0.5">
              {totalStudents}
            </p>
          </div>

          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
              Passed Students
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {passedCount}
            </p>
          </div>

          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
              Pass Rate
            </p>
            <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {totalStudents > 0 ? `${Math.round((passedCount / totalStudents) * 100)}%` : '0%'}
            </p>
          </div>

          <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
            <p className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">
              Points Available
            </p>
            <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
              {currentLevel.points || 50} pts
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-separator bg-surface-raised flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3.5 top-3 text-label-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student by name, roll no, department..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'passed', 'failed', 'in_progress'] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setVerdictFilter(filterKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  verdictFilter === filterKey
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface border border-separator text-label-secondary hover:text-label-primary'
                }`}
              >
                {filterKey === 'all' ? `All (${students.length})` : filterKey.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="space-y-3 py-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-18 bg-surface-raised rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <GraduationCap className="w-12 h-12 mx-auto text-label-tertiary stroke-1 opacity-60" />
              <h3 className="text-base font-bold text-label-primary">No Student Submissions Found</h3>
              <p className="text-xs text-label-tertiary max-w-sm mx-auto">
                {search
                  ? 'No submissions matched your search query. Try clearing filters.'
                  : 'Students have not submitted any quests or coding challenges for this level yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredStudents.map((rec) => {
                const isPassed = rec.verdict === 'passed' || rec.levelCompleted;
                const isFailed = rec.verdict === 'failed' && !rec.levelCompleted;
                const hasCode = rec.submissions && rec.submissions.length > 0;
                const hasQuest = rec.questCompleted || (questQuestions.length > 0 && rec.questSubmission);

                return (
                  <div
                    key={rec.student._id}
                    className="p-4 bg-surface rounded-2xl border border-separator hover:border-separator-focus transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                  >
                    {/* Student Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-xs uppercase shrink-0">
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
                          <h4 className="text-xs sm:text-sm font-bold text-label-primary truncate">
                            {rec.student.name}
                          </h4>
                          {rec.student.rollNo && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-surface-raised border border-separator text-label-secondary font-medium">
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
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      {/* Quest Status */}
                      {rec.questCompleted && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Quest Done
                        </span>
                      )}

                      {/* Best Score */}
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-raised border border-separator text-label-primary">
                        Score: {rec.bestScore} pts
                      </span>

                      {/* Verdict Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                          isPassed
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : isFailed
                            ? 'bg-destructive/15 text-destructive border border-destructive/30'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {isPassed ? (
                          <>
                            <CheckCircle2 size={13} /> Passed
                          </>
                        ) : isFailed ? (
                          <>
                            <XCircle size={13} /> Failed
                          </>
                        ) : (
                          <>
                            <Clock size={13} /> In Progress
                          </>
                        )}
                      </span>

                      {/* View Full Report Action */}
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
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent/90 shadow-sm shadow-accent/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        title="View full report with questions, answers, and code"
                      >
                        <FileText size={14} />
                        <span>View Report</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Footer Note */}
        <div className="p-4 border-t border-separator bg-surface-raised text-center text-xs text-label-tertiary shrink-0">
          Admin Course Inspector · Viewing {filteredStudents.length} of {totalStudents} student record(s)
        </div>
      </motion.div>

      {/* Comprehensive Student Dossier Modal */}
      <AnimatePresence>
        {inspectingStudent && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-950 text-white rounded-3xl border border-white/10 shadow-2xl overflow-hidden font-sans"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-black">
                    {inspectingStudent.student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>{inspectingStudent.student.name}</span>
                      {inspectingStudent.student.rollNo && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/70">
                          {inspectingStudent.student.rollNo}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-white/60">
                      Level {currentLevel.levelNumber}: {currentLevel.title} · Student Performance Dossier
                    </p>
                  </div>
                </div>

                {/* Report Download Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handlePrintStudentPdf(inspectingStudent)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/30 cursor-pointer"
                    title="Print or Save PDF report"
                  >
                    <Printer size={13} />
                    <span>Print / PDF</span>
                  </button>

                  <button
                    onClick={() => handleExportStudentCsv(inspectingStudent)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
                    title="Export CSV report"
                  >
                    <FileSpreadsheet size={13} />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>

                  <button
                    onClick={() => setInspectingStudent(null)}
                    className="p-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Performance Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 sm:p-4 bg-slate-900/40 border-b border-white/10 shrink-0">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-white/50 uppercase font-mono">Verdict</span>
                  <p
                    className={`text-xs font-bold uppercase font-mono mt-0.5 ${
                      inspectingStudent.verdict === 'passed' || inspectingStudent.levelCompleted
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {inspectingStudent.verdict === 'passed' || inspectingStudent.levelCompleted ? 'Passed' : 'In Progress'}
                  </p>
                </div>

                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-white/50 uppercase font-mono">Best Score</span>
                  <p className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                    {inspectingStudent.bestScore} pts
                  </p>
                </div>

                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-white/50 uppercase font-mono">Quest Status</span>
                  <p className="text-xs font-bold text-white font-mono mt-0.5">
                    {inspectingStudent.questCompleted ? 'Completed' : 'Pending'}
                  </p>
                </div>

                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-white/50 uppercase font-mono">Coding Submissions</span>
                  <p className="text-xs font-bold text-primary font-mono mt-0.5">
                    {inspectingStudent.submissions ? inspectingStudent.submissions.length : 0} Attempt(s)
                  </p>
                </div>
              </div>

              {/* Detail Tabs (Questions vs Code) */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/60 border-b border-white/10 shrink-0">
                <button
                  onClick={() => setActiveDetailTab('questions')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeDetailTab === 'questions'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  <FileText size={13} />
                  <span>Questions & Answers ({questQuestions.length})</span>
                </button>

                {inspectingStudent.submissions && inspectingStudent.submissions.length > 0 && (
                  <button
                    onClick={() => setActiveDetailTab('code')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeDetailTab === 'code'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    <Code2 size={13} />
                    <span>Coding Solution ({inspectingStudent.submissions.length})</span>
                  </button>
                )}
              </div>

              {/* Dossier Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
                {activeDetailTab === 'questions' ? (
                  questQuestions.length === 0 ? (
                    <div className="text-center py-12 text-white/40 text-xs">
                      No quest questions configured for this course level.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
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
                            className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 shadow-xs"
                          >
                            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-white/80">
                                QUESTION #{idx + 1}
                              </span>

                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                  isCorrect
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}
                              >
                                {isCorrect ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                {isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                              {q.question}
                            </p>

                            {/* Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {q.options &&
                                q.options.map((optText: string, optIdx: number) => {
                                  const isSelected = selectedOption === optIdx;
                                  const isAnswer = correctOption === optIdx;

                                  let styleClass = 'bg-white/[0.02] border-white/10 text-white/70';
                                  if (isSelected && isAnswer) {
                                    styleClass = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold';
                                  } else if (isSelected && !isAnswer) {
                                    styleClass = 'bg-red-500/15 border-red-500/50 text-red-300 font-bold';
                                  } else if (isAnswer) {
                                    styleClass = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-semibold';
                                  }

                                  return (
                                    <div
                                      key={optIdx}
                                      className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 text-xs transition-all ${styleClass}`}
                                    >
                                      <div className="flex items-start gap-2 min-w-0">
                                        <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center font-bold text-[9px] text-white shrink-0 mt-0.5">
                                          {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <span className="break-words leading-relaxed">{optText}</span>
                                      </div>

                                      {isSelected && (
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                            isAnswer
                                              ? 'bg-emerald-500/30 text-emerald-300'
                                              : 'bg-red-500/30 text-red-300'
                                          }`}
                                        >
                                          Student
                                        </span>
                                      )}
                                      {isAnswer && !isSelected && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 shrink-0">
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
                  // Coding Tab Body
                  (() => {
                    const activeSub =
                      inspectingStudent.submissions[activeCodeTab] || inspectingStudent.submissions[0];
                    if (!activeSub) return null;

                    return (
                      <div className="space-y-4">
                        {/* Multiple Submissions Selector Tabs */}
                        {inspectingStudent.submissions.length > 1 && (
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {inspectingStudent.submissions.map((sub, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActiveCodeTab(idx)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  activeCodeTab === idx
                                    ? 'bg-primary text-white shadow-xs'
                                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                                }`}
                              >
                                Attempt #{idx + 1} ({sub.language}) - {sub.status}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Execution Metrics Banner */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-[10px] text-white/50 uppercase font-mono">Language</span>
                            <p className="text-xs font-bold text-primary uppercase font-mono mt-0.5">
                              {activeSub.language || 'python'}
                            </p>
                          </div>

                          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-[10px] text-white/50 uppercase font-mono">Verdict</span>
                            <p
                              className={`text-xs font-bold uppercase font-mono mt-0.5 ${
                                activeSub.status === 'passed'
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {activeSub.status}
                            </p>
                          </div>

                          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-[10px] text-white/50 uppercase font-mono">Test Cases</span>
                            <p className="text-xs font-bold text-white font-mono mt-0.5">
                              {activeSub.passed} / {activeSub.total || 0} passed
                            </p>
                          </div>

                          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-[10px] text-white/50 uppercase font-mono">Score Awarded</span>
                            <p className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                              +{activeSub.score} pts
                            </p>
                          </div>
                        </div>

                        {/* Source Code Container */}
                        <div className="relative rounded-2xl bg-black/60 border border-white/15 overflow-hidden flex flex-col min-h-[280px]">
                          <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-xs text-white/60 font-mono">
                            <span>source_code.{activeSub.language === 'python' ? 'py' : activeSub.language === 'cpp' ? 'cpp' : activeSub.language === 'java' ? 'java' : 'js'}</span>
                            <button
                              onClick={() => handleCopyCode(activeSub.code)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                            >
                              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>

                          <pre className="p-4 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto flex-1 select-text selection:bg-primary/30">
                            <code>{activeSub.code || '// No code submitted in this attempt'}</code>
                          </pre>
                        </div>

                        {/* Error diagnostics if any */}
                        {activeSub.details?.error && (
                          <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-rose-300 text-xs font-mono space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-rose-400">
                              <AlertTriangle size={14} />
                              <span>Compiler / Runtime Diagnostics:</span>
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
              <div className="p-3.5 sm:p-4 border-t border-white/10 bg-slate-900/80 flex items-center justify-between text-xs text-white/50 shrink-0">
                <span>Course Level Inspection Record · Code Circle</span>
                <button
                  onClick={() => setInspectingStudent(null)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LevelSubmissionsModal;
