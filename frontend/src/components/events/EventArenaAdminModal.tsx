import ResponsiveModal from '../ui/ResponsiveModal';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Unlock,
  Crown,
  Settings,
  HelpCircle,
  Code2,
  Users,
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Award,
  Trophy,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  Eye,
  FileCode,
  Building,
  Bus,
  Palette,
  ExternalLink,
  Image as ImageIcon,
  Maximize2,
  FileText,
  CheckCircle,
  RotateCcw,
  Clock,
  Calendar,
  Play,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/axios';
import { Button, Input, Link } from '@heroui/react';
import { HeroFileInput } from '@/components/ui/hero/HeroFileInput';
import useAuthStore from '../../store/useAuthStore';
import useProfileStore from '../../store/useProfileStore';
import useEventArenaStore, {
  ArenaAssessment,
  ArenaAdminCandidate,
  ArenaMcqQuestion,
  ArenaCodingProblem,
  ArenaDesignChallenge,
} from '../../store/useEventArenaStore';
import HeroUISelect, { HeroUISelectOption } from '../ui/HeroUISelect';
import { HeroDateTimePicker } from '@/components/ui/hero/HeroDateTimePicker';
import { formatDateToISTInput, parseISTInputToISO, formatISTDateTime } from '../../lib/dateUtils';
import {
  ManualPaperSubmissionModal,
  ManualPaperBulkUploadModal,
  BlockedStudentsTab,
  BlockedStudentsModal,
} from './arena';
import { ArenaTeamsTab } from './arena/admin/ArenaTeamsTab';

interface EventArenaAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  onSuccess?: () => void;
}

export const EventArenaAdminModal: React.FC<EventArenaAdminModalProps> = ({
  isOpen,
  onClose,
  event,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const {
    fetchAdminCandidates,
    fetchAssessments,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    fetchAdminAssessmentQuestions,
    saveAssessmentMcqs,
    saveAssessmentCodingProblems,
    saveAssessmentDesignChallenge,
    uploadDesignImage,
    evaluateAssessmentDesign,
    bulkUploadAssessmentQuestions,
    downloadArenaTemplate,
    fetchAdminAssessmentSubmissions,
    deleteAssessmentSubmission,
    evaluateAssessmentCode,
    assessments,
    selectedAssessment,
    setSelectedAssessment,
    adminCandidates,
    adminMcqs,
    adminCoding,
    adminDesignChallenge,
    adminDesignChallenges,
    adminSubmissions,
    unblockStudentDirect,
    grantGraceTime,
    grantGraceTimeAll,
    createManualSubmission,
    overallLeaderboard,
    overallLeaderboardAssessments,
    fetchAdminOverallLeaderboard,
    loading,
    actionLoading,
    arenaTeams,
    fetchArenaTeams,
    createArenaTeam,
    assignArenaTeamMembers,
    deleteArenaTeam,
  } = useEventArenaStore();

  const { profile } = useProfileStore();
  const navigate = useNavigate();
  const effectiveRole = profile?.role || user?.role;
  const isSuperAdmin = effectiveRole === 'SuperAdmin';
  const isAdminRole = ['Admin', 'SuperAdmin', 'Faculty', 'Committee'].includes(effectiveRole);

  // Modal Views & Tabs
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'mcq' | 'coding' | 'design' | 'teams' | 'submissions' | 'blocked'>('settings');

  // New Assessment Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'CODING' | 'MCQ' | 'HYBRID' | 'UI_UX'>('HYBRID');
  const [newDuration, setNewDuration] = useState(60);
  const [newStartTime, setNewStartTime] = useState('');
  const [newPassingScore, setNewPassingScore] = useState(50);
  const [newAssignedAdminIds, setNewAssignedAdminIds] = useState<string[]>([]);
  const [newCutoffRank, setNewCutoffRank] = useState(0);
  const [newIsTeamMode, setNewIsTeamMode] = useState(false);
  const [newTeamSize, setNewTeamSize] = useState(2);

  // Selected Assessment Edit State
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState<'CODING' | 'MCQ' | 'HYBRID' | 'UI_UX'>('HYBRID');
  const [editStatus, setEditStatus] = useState<'DRAFT' | 'UPCOMING' | 'LIVE' | 'ENDED'>('LIVE');
  const [editDuration, setEditDuration] = useState(60);
  const [editStartTime, setEditStartTime] = useState('');
  const [editPassingScore, setEditPassingScore] = useState(50);
  const [editAssignedAdminIds, setEditAssignedAdminIds] = useState<string[]>([]);
  const [editCutoffRank, setEditCutoffRank] = useState(0);
  const [editIsTeamMode, setEditIsTeamMode] = useState(false);
  const [editTeamSize, setEditTeamSize] = useState(2);
  const [adminSearch, setAdminSearch] = useState('');

  // Teams Management State
  const [teamNameInput, setTeamNameInput] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);

  // Submissions & Leaderboard sub-tab state ('round' | 'leaderboard')
  const [submissionsSubTab, setSubmissionsSubTab] = useState<'round' | 'leaderboard'>('round');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [isExportingSubmissions, setIsExportingSubmissions] = useState(false);

  // Anti-Cheat Quick Unblock state
  const [quickUnblockQuery, setQuickUnblockQuery] = useState('');
  const [isQuickUnblocking, setIsQuickUnblocking] = useState(false);

  // Grace Timing Modal State (Individual Student)
  const [graceModalSub, setGraceModalSub] = useState<any | null>(null);
  const [graceMinutesInput, setGraceMinutesInput] = useState<number>(10);
  const [graceClearAnswers, setGraceClearAnswers] = useState<boolean>(false);
  const [isGrantingGrace, setIsGrantingGrace] = useState<boolean>(false);

  // Grace Timing Modal State (All Students)
  const [isGraceAllModalOpen, setIsGraceAllModalOpen] = useState<boolean>(false);
  const [graceAllMinutes, setGraceAllMinutes] = useState<number>(10);
  const [isGrantingGraceAll, setIsGrantingGraceAll] = useState<boolean>(false);

  // Manual Paper Submission Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [isBulkPaperModalOpen, setIsBulkPaperModalOpen] = useState<boolean>(false);
  const [isBlockedStudentsModalOpen, setIsBlockedStudentsModalOpen] = useState<boolean>(false);
  const [blockedCount, setBlockedCount] = useState<number>(0);
  const [isSubmittingManual, setIsSubmittingManual] = useState<boolean>(false);

  const fetchBlockedCount = useCallback(() => {
    if (!event?._id) return;
    api.get(`/events/${event._id}/blocked-students`)
      .then((res) => {
        setBlockedCount(res.data?.count || res.data?.blockedStudents?.length || 0);
      })
      .catch(() => {});
  }, [event?._id]);

  useEffect(() => {
    if (isOpen && event?._id) {
      fetchBlockedCount();
    }
  }, [isOpen, event?._id, fetchBlockedCount]);

  // Multi-Design Challenge Form state
  const [designChallengesList, setDesignChallengesList] = useState<any[]>([]);
  const [activeDesignOptionIdx, setActiveDesignOptionIdx] = useState(0);

  // Design Challenge Form state
  const [designTitle, setDesignTitle] = useState('');
  const [designDesc, setDesignDesc] = useState('');
  const [designProblem, setDesignProblem] = useState('');
  const [designImageUrl, setDesignImageUrl] = useState('');
  const [designRefFigma, setDesignRefFigma] = useState('');
  const [designDeliverables, setDesignDeliverables] = useState<string[]>([
    'High-fidelity Desktop & Mobile layouts',
    'Interactive Prototype link with micro-interactions',
    'Consistent Component Design System',
  ]);
  const [designGuidelines, setDesignGuidelines] = useState<string[]>([
    'Adhere to visual hierarchy and readable typography scale',
    'Proper color contrast adhering to WCAG AA standard',
    'Use Figma auto-layout and clear layer naming',
  ]);
  const [designPoints, setDesignPoints] = useState(100);
  const [uploadingDesignImg, setUploadingDesignImg] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  // Submissions evaluation state
  const [evaluatingSub, setEvaluatingSub] = useState<any | null>(null);
  const [evalPoints, setEvalPoints] = useState<number>(0);
  const [evalFeedback, setEvalFeedback] = useState<string>('');
  const [previewFigmaUrl, setPreviewFigmaUrl] = useState<string | null>(null);
  const [inspectingSub, setInspectingSub] = useState<any | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const handleResetSubmission = async (sub: any) => {
    if (!event?._id || !selectedAssessmentId || !sub._id) return;
    const studentName = sub.userId?.name || 'this student';
    if (!window.confirm(`Reset assessment attempt for ${studentName}? Their current submission will be cleared and they will be able to retake this round.`)) {
      return;
    }
    setActionInProgressId(sub._id);
    try {
      await deleteAssessmentSubmission(event._id, selectedAssessmentId, sub._id);
      if (inspectingSub?._id === sub._id) {
        setInspectingSub(null);
      }
    } catch {
      // Handled in store
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleUnblockStudent = async (studentId: string, studentName?: string) => {
    if (!event?._id || !studentId) return;
    setActionInProgressId(studentId);
    try {
      await unblockStudentDirect(event._id, studentId, studentName);
      if (inspectingSub) {
        const inspectingUserId = inspectingSub.userId?._id || inspectingSub.userId?.id || inspectingSub.userId;
        if (inspectingUserId === studentId) {
          setInspectingSub({ ...inspectingSub, isBlocked: false });
        }
      }
    } catch {
      // Error toasted in store
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleQuickUnblock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = quickUnblockQuery.trim();
    if (!query || !event?._id) return;
    setIsQuickUnblocking(true);
    try {
      await unblockStudentDirect(event._id, query);
      setQuickUnblockQuery('');
    } catch {
      // Error toasted in store
    } finally {
      setIsQuickUnblocking(false);
    }
  };

  const handleGrantGraceTime = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!event?._id || !selectedAssessmentId || !graceModalSub) return;
    setIsGrantingGrace(true);
    try {
      await grantGraceTime(event._id, selectedAssessmentId, {
        submissionId: graceModalSub._id,
        studentId: graceModalSub.userId?._id || graceModalSub.userId?.id || graceModalSub.userId,
        extraMinutes: Number(graceMinutesInput) || 10,
        clearAnswers: graceClearAnswers,
      });
      if (inspectingSub?._id === graceModalSub._id) {
        setInspectingSub((prev: any) => prev ? {
          ...prev,
          status: 'IN_PROGRESS',
          graceMinutes: (prev.graceMinutes || 0) + (Number(graceMinutesInput) || 10),
          isBlocked: false,
        } : null);
      }
      setGraceModalSub(null);
    } catch {
      // Toast handled in store
    } finally {
      setIsGrantingGrace(false);
    }
  };

  const handleGrantGraceTimeAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!event?._id || !selectedAssessmentId) return;
    setIsGrantingGraceAll(true);
    try {
      await grantGraceTimeAll(event._id, selectedAssessmentId, Number(graceAllMinutes) || 10);
      setIsGraceAllModalOpen(false);
    } catch {
      // Toast handled in store
    } finally {
      setIsGrantingGraceAll(false);
    }
  };

  const handleExportSubmissions = async () => {
    const listToExport = submissionSearch.trim()
      ? filteredSubmissions
      : sortedAdminSubmissions;

    if (listToExport.length === 0) {
      toast.error(
        submissionSearch.trim()
          ? 'No submissions match your search query'
          : 'No submissions available to export'
      );
      return;
    }

    setIsExportingSubmissions(true);
    try {
      const rows = listToExport.map((sub: any, idx: number) => {
        const subRank = submissionRankMap.get(sub._id?.toString() || sub.id) || (idx + 1);
        const isShortlisted = effectiveCutoffRank > 0 ? subRank <= effectiveCutoffRank : true;
        return {
          'Rank': subRank,
          'Shortlisted for Next Round': effectiveCutoffRank > 0
            ? (isShortlisted ? `Yes (Top ${effectiveCutoffRank})` : 'No')
            : 'Yes (All Qualified)',
          'Next Round Eligibility': isShortlisted ? 'Shortlisted' : 'Not Shortlisted',
          'Roll Number': sub.userId?.rollNo || 'N/A',
          'Student Name': sub.userId?.name || 'N/A',
          'Email': sub.userId?.email || 'N/A',
          'Department': sub.userId?.department || 'N/A',
          'Year': sub.userId?.year || 'N/A',
          'College': sub.userId?.college || 'N/A',
          'Residence Type': sub.userId?.residenceType || 'N/A',
          'Team Name': sub.teamName || sub.teamId?.name || 'Individual',
          'Score': sub.totalScore ?? 0,
          'Max Score': sub.maxPossibleScore || selectedAssessment?.totalPoints || 100,
          'Percentage (%)': sub.scorePercentage ?? 0,
          'Pass % Result': sub.isPassed ? 'Passed' : 'Failed',
          'Status': sub.status || 'SUBMITTED',
          'Submission Type': sub.isManualSubmission ? 'Paper / Manual' : 'Online Arena',
          'MCQ Score': sub.mcqScore ?? 0,
          'Coding Score': sub.codingScore ?? 0,
          'Design Score': sub.designScore ?? 0,
          'Tab Switch Count': sub.tabSwitchCount ?? 0,
          'Time Taken (Mins)': Math.floor((sub.timeTakenSeconds || 0) / 60),
          'Submitted At': sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'In Progress',
          'Integrity Blocked': sub.isBlocked ? 'Yes' : 'No',
          'Manual Notes': sub.manualNotes || '',
        };
      });

      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Define auto-fitting column widths
      worksheet['!cols'] = [
        { wch: 6 },  // Rank
        { wch: 26 }, // Shortlisted for Next Round
        { wch: 22 }, // Next Round Eligibility
        { wch: 14 }, // Roll Number
        { wch: 24 }, // Student Name
        { wch: 32 }, // Email
        { wch: 14 }, // Department
        { wch: 8 },  // Year
        { wch: 20 }, // College
        { wch: 14 }, // Residence Type
        { wch: 16 }, // Team Name
        { wch: 8 },  // Score
        { wch: 10 }, // Max Score
        { wch: 14 }, // Percentage (%)
        { wch: 14 }, // Pass % Result
        { wch: 14 }, // Status
        { wch: 16 }, // Submission Type
        { wch: 12 }, // MCQ Score
        { wch: 12 }, // Coding Score
        { wch: 12 }, // Design Score
        { wch: 16 }, // Tab Switch Count
        { wch: 18 }, // Time Taken (Mins)
        { wch: 22 }, // Submitted At
        { wch: 16 }, // Integrity Blocked
        { wch: 30 }, // Manual Notes
      ];

      const workbook = XLSX.utils.book_new();
      // Excel sheet name MUST NOT exceed 31 chars and must not contain : \ / ? * [ ]
      const safeSheetName = 'Submissions';
      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

      const safeEventTitle = (event?.title || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      const safeRoundTitle = (selectedAssessment?.title || 'Round').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 25);
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `${safeEventTitle}_${safeRoundTitle}_Submissions_${timestamp}.xlsx`;

      try {
        XLSX.writeFile(workbook, fileName);
      } catch (writeErr) {
        console.warn('XLSX.writeFile fallback to manual Blob trigger:', writeErr);
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast.success('Submissions list exported to Excel successfully!');
    } catch (err: any) {
      console.error('Failed to export submissions list:', err);
      toast.error(err?.message || 'Failed to export submissions list');
    } finally {
      setIsExportingSubmissions(false);
    }
  };

  const handleCreateManualSubmission = async (data: {
    studentIdentifier: string;
    score: number;
    mcqScore?: number;
    codingScore?: number;
    manualNotes?: string;
  }) => {
    if (!event?._id || !selectedAssessmentId) return;
    setIsSubmittingManual(true);
    try {
      await createManualSubmission(event._id, selectedAssessmentId, {
        studentIdentifier: data.studentIdentifier.trim(),
        score: Number(data.score),
        mcqScore: data.mcqScore !== undefined ? Number(data.mcqScore) : undefined,
        codingScore: data.codingScore !== undefined ? Number(data.codingScore) : undefined,
        manualNotes: data.manualNotes?.trim() || 'Paper / Offline Test Submission',
      });
      setIsManualModalOpen(false);
    } catch {
      // Toast handled in store
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleDeleteSubmission = async (sub: any) => {
    if (!event?._id || !selectedAssessmentId || !sub._id) return;
    const studentName = sub.userId?.name || 'this student';
    if (!window.confirm(`Permanently delete submission record for ${studentName}? This cannot be undone.`)) {
      return;
    }
    setActionInProgressId(sub._id);
    try {
      await deleteAssessmentSubmission(event._id, selectedAssessmentId, sub._id);
      if (inspectingSub?._id === sub._id) {
        setInspectingSub(null);
      }
    } catch {
      // Handled in store
    } finally {
      setActionInProgressId(null);
    }
  };

  // MCQ Form state
  const [showAddMcq, setShowAddMcq] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '', '', '']);
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);
  const [newMcqPoints, setNewMcqPoints] = useState(10);
  const [newExplanation, setNewExplanation] = useState('');

  // Coding Form state
  const [showAddCoding, setShowAddCoding] = useState(false);
  const [newCodingTitle, setNewCodingTitle] = useState('');
  const [newCodingDesc, setNewCodingDesc] = useState('');
  const [newCodingDiff, setNewCodingDiff] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [newCodingMode, setNewCodingMode] = useState<'BOTH' | 'ONLY_CODE' | 'TEST_CASES'>('BOTH');
  const [newCodingPoints, setNewCodingPoints] = useState(30);
  const [newCodingAllowedLanguages, setNewCodingAllowedLanguages] = useState<string[]>([
    'python',
    'javascript',
    'cpp',
    'java',
    'c',
  ]);
  const [newSampleInput, setNewSampleInput] = useState('');
  const [newSampleOutput, setNewSampleOutput] = useState('');
  const [newHiddenInput, setNewHiddenInput] = useState('');
  const [newHiddenOutput, setNewHiddenOutput] = useState('');
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({});
  const [gradingFeedbacks, setGradingFeedbacks] = useState<Record<string, string>>({});
  const [isGradingCode, setIsGradingCode] = useState<Record<string, boolean>>({});
  const [isDeletingAssessment, setIsDeletingAssessment] = useState(false);
  const [deletingMcqIndex, setDeletingMcqIndex] = useState<number | null>(null);
  const [deletingCodingIndex, setDeletingCodingIndex] = useState<number | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  // Bulk Upload state
  const [bulkModalType, setBulkModalType] = useState<'mcq' | 'coding' | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  // Check if current user can manage questions for the selected assessment
  const canManageSelected = useMemo(() => {
    if (!user && !profile) return false;
    if (isAdminRole) return true;
    if (!selectedAssessment) return false;
    const assigned = selectedAssessment.assignedAdmins || [];
    const currentUserId = user?.id || user?._id || profile?._id || profile?.id;
    return assigned.some((adm: any) => {
      const id = adm?._id ? adm._id.toString() : adm.toString();
      return id === currentUserId?.toString();
    });
  }, [user, profile, selectedAssessment, isAdminRole]);

  const selectedAssessmentId = selectedAssessment?._id;

  const selectedAssessmentIndex = useMemo(() => {
    return assessments.findIndex((a: any) => a._id === selectedAssessmentId);
  }, [assessments, selectedAssessmentId]);

  const nextAssessment = useMemo(() => {
    if (selectedAssessmentIndex >= 0 && selectedAssessmentIndex < assessments.length - 1) {
      return assessments[selectedAssessmentIndex + 1];
    }
    return null;
  }, [assessments, selectedAssessmentIndex]);

  // Next round shortlist cutoff rank: strictly determined by rank cutoff, not passing %
  const effectiveCutoffRank = useMemo(() => {
    if (selectedAssessment?.qualificationCutoffRank && selectedAssessment.qualificationCutoffRank > 0) {
      return selectedAssessment.qualificationCutoffRank;
    }
    if (nextAssessment?.qualificationCutoffRank && nextAssessment.qualificationCutoffRank > 0) {
      return nextAssessment.qualificationCutoffRank;
    }
    return 0;
  }, [selectedAssessment, nextAssessment]);

  // Submissions sorted deterministically: 1) highest score, 2) ties broken by student name alphabetically (A-Z), 3) timeTakenSeconds, 4) submittedAt
  const sortedAdminSubmissions = useMemo(() => {
    return [...adminSubmissions].sort((a: any, b: any) => {
      const scoreA = Number(a.totalScore ?? 0);
      const scoreB = Number(b.totalScore ?? 0);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      const nameA = (a.userId?.name || '').trim().toLowerCase();
      const nameB = (b.userId?.name || '').trim().toLowerCase();
      if (nameA && nameB && nameA !== nameB) {
        return nameA.localeCompare(nameB);
      }
      if (nameA && !nameB) return -1;
      if (!nameA && nameB) return 1;
      const timeA = Number(a.timeTakenSeconds ?? 0);
      const timeB = Number(b.timeTakenSeconds ?? 0);
      if (timeA !== timeB) return timeA - timeB;
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return dateA - dateB;
    });
  }, [adminSubmissions]);

  // Precomputed ranking map (1-based) across all submissions in this round
  const submissionRankMap = useMemo(() => {
    const map = new Map<string, number>();
    sortedAdminSubmissions.forEach((sub: any, idx: number) => {
      map.set(sub._id?.toString() || sub.id, idx + 1);
    });
    return map;
  }, [sortedAdminSubmissions]);

  // Derive inspecting submission's round rank and shortlist qualification
  const inspectingRank = useMemo(() => {
    if (!inspectingSub) return 0;
    return submissionRankMap.get(inspectingSub._id?.toString() || inspectingSub.id) || 0;
  }, [inspectingSub, submissionRankMap]);

  const inspectingShortlisted = useMemo(() => {
    if (effectiveCutoffRank <= 0) return true;
    return inspectingRank > 0 && inspectingRank <= effectiveCutoffRank;
  }, [inspectingRank, effectiveCutoffRank]);

  // Filtered submissions based on search input (name, roll no, email, department, year, team, paper/manual, shortlist status)
  const filteredSubmissions = useMemo(() => {
    if (!submissionSearch.trim()) return sortedAdminSubmissions;
    const q = submissionSearch.trim().toLowerCase();
    return sortedAdminSubmissions.filter((sub: any) => {
      const name = (sub.userId?.name || '').toLowerCase();
      const roll = (sub.userId?.rollNo || '').toLowerCase();
      const email = (sub.userId?.email || '').toLowerCase();
      const dept = (sub.userId?.department || '').toLowerCase();
      const year = String(sub.userId?.year || '').toLowerCase();
      const college = (sub.userId?.college || '').toLowerCase();
      const residence = (sub.userId?.residenceType || '').toLowerCase();
      const team = (sub.teamName || sub.teamId?.name || '').toLowerCase();
      const isManual = sub.isManualSubmission ? 'paper manual offline' : 'online';
      const subRank = submissionRankMap.get(sub._id?.toString() || sub.id) || 0;
      const isShortlisted = effectiveCutoffRank > 0 ? (subRank > 0 && subRank <= effectiveCutoffRank) : true;
      const shortlistStr = isShortlisted ? 'shortlisted qualified next round' : 'not shortlisted disqualified';
      const result = sub.isPassed ? 'passed pass' : 'failed fail';
      const notes = (sub.manualNotes || '').toLowerCase();
      return (
        name.includes(q) ||
        roll.includes(q) ||
        email.includes(q) ||
        dept.includes(q) ||
        year.includes(q) ||
        college.includes(q) ||
        residence.includes(q) ||
        team.includes(q) ||
        isManual.includes(q) ||
        shortlistStr.includes(q) ||
        result.includes(q) ||
        notes.includes(q)
      );
    });
  }, [sortedAdminSubmissions, submissionSearch, submissionRankMap, effectiveCutoffRank]);

  // Load initial data (only when modal opens or event ID changes)
  useEffect(() => {
    if (isOpen && event?._id) {
      if (adminCandidates.length === 0) {
        fetchAdminCandidates();
      }
      fetchAssessments(event._id);
    }
  }, [isOpen, event?._id]);

  // Fetch questions and submissions ONLY when selected assessment ID changes
  useEffect(() => {
    if (isOpen && event?._id && selectedAssessmentId) {
      fetchAdminAssessmentQuestions(event._id, selectedAssessmentId);
      fetchAdminAssessmentSubmissions(event._id, selectedAssessmentId);
      fetchArenaTeams(event._id);
    }
  }, [isOpen, event?._id, selectedAssessmentId]);

  // Sync edit form fields when selected assessment changes
  useEffect(() => {
    if (selectedAssessment) {
      setEditTitle(selectedAssessment.title || '');
      setEditDesc(selectedAssessment.description || '');
      setEditType(selectedAssessment.type || 'HYBRID');
      setEditStatus(selectedAssessment.status || 'LIVE');
      setEditDuration(selectedAssessment.durationMinutes || 60);
      setEditStartTime(selectedAssessment.startTime ? formatDateToISTInput(selectedAssessment.startTime) : '');
      setEditPassingScore(selectedAssessment.passingPercentage || 50);
      setEditCutoffRank(selectedAssessment.qualificationCutoffRank || 0);
      setEditIsTeamMode(Boolean(selectedAssessment.isTeamMode));
      setEditTeamSize(selectedAssessment.teamSize || 2);

      const assigned = (selectedAssessment.assignedAdmins || []).map((adm: any) =>
        adm?._id ? adm._id.toString() : adm.toString()
      );
      setEditAssignedAdminIds(assigned);

      if (selectedAssessment.type === 'UI_UX') {
        setActiveTab((prev) => (prev === 'mcq' || prev === 'coding' ? 'design' : prev));
      }
    }
  }, [selectedAssessmentId]);

  // Sync design challenge form fields (no API calls here)
  useEffect(() => {
    const dcs = (adminDesignChallenges && adminDesignChallenges.length > 0)
      ? adminDesignChallenges
      : (selectedAssessment?.designChallenges && selectedAssessment.designChallenges.length > 0)
        ? selectedAssessment.designChallenges
        : (adminDesignChallenge ? [adminDesignChallenge] : (selectedAssessment?.designChallenge ? [selectedAssessment.designChallenge] : []));

    if (dcs.length > 0) {
      setDesignChallengesList(dcs);
      const safeIdx = Math.min(activeDesignOptionIdx, dcs.length - 1);
      const dc = dcs[safeIdx] || dcs[0];
      setDesignTitle(dc.title || selectedAssessment?.title || '');
      setDesignDesc(dc.description || selectedAssessment?.description || '');
      setDesignProblem(dc.problemStatement || '');
      setDesignImageUrl(dc.referenceImageUrl || dc.designImageUrl || '');
      setDesignRefFigma(dc.figmaStarterUrl || dc.referenceFigmaUrl || '');
      if (dc.deliverables && dc.deliverables.length > 0) {
        setDesignDeliverables(dc.deliverables);
      }
      if (dc.guidelines && dc.guidelines.length > 0) {
        setDesignGuidelines(dc.guidelines);
      }
      setDesignPoints(dc.totalPoints || dc.points || selectedAssessment?.totalPoints || 100);
    } else if (selectedAssessment) {
      const defaultInitial = [{
        title: selectedAssessment.title || 'UI/UX Design Challenge',
        description: selectedAssessment.description || '',
        problemStatement: '',
        designImageUrl: '',
        referenceFigmaUrl: '',
        deliverables: ['High-fidelity Desktop & Mobile layouts', 'Interactive Prototype link with micro-interactions', 'Consistent Component Design System'],
        guidelines: ['Adhere to visual hierarchy and readable typography scale', 'Proper color contrast adhering to WCAG AA standard', 'Use Figma auto-layout and clear layer naming'],
        points: selectedAssessment.totalPoints || 100,
      }];
      setDesignChallengesList(defaultInitial);
      setDesignTitle(defaultInitial[0].title);
      setDesignDesc(defaultInitial[0].description);
      setDesignProblem('');
      setDesignImageUrl('');
      setDesignRefFigma('');
      setDesignPoints(selectedAssessment.totalPoints || 100);
    }
  }, [adminDesignChallenge, adminDesignChallenges, selectedAssessmentId]);

  if (!isOpen || !event) return null;

  // Filter candidates
  const filteredCandidates = adminCandidates.filter((cand) => {
    const q = adminSearch.toLowerCase();
    return (
      cand.name.toLowerCase().includes(q) ||
      cand.email.toLowerCase().includes(q) ||
      (cand.rollNo && cand.rollNo.toLowerCase().includes(q))
    );
  });

  const toggleEditAdmin = (candId: string) => {
    if (!isSuperAdmin) return;
    setEditAssignedAdminIds((prev) =>
      prev.includes(candId) ? prev.filter((id) => id !== candId) : [...prev, candId]
    );
  };

  const toggleNewAdmin = (candId: string) => {
    if (!isSuperAdmin) return;
    setNewAssignedAdminIds((prev) =>
      prev.includes(candId) ? prev.filter((id) => id !== candId) : [...prev, candId]
    );
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      return toast.error('Please enter an assessment title');
    }
    try {
      const startTimeISO = newStartTime ? parseISTInputToISO(newStartTime) : undefined;
      let endTimeISO: string | undefined = undefined;
      if (startTimeISO) {
        const sTime = new Date(startTimeISO).getTime();
        endTimeISO = new Date(sTime + Number(newDuration) * 60 * 1000).toISOString();
      }

      await createAssessment(event._id, {
        title: newTitle.trim(),
        description: newDesc.trim(),
        type: newType,
        durationMinutes: Number(newDuration),
        startTime: startTimeISO,
        endTime: endTimeISO,
        passingPercentage: Number(newPassingScore),
        assignedAdmins: newAssignedAdminIds,
        qualificationCutoffRank: Number(newCutoffRank) || 0,
        isTeamMode: newIsTeamMode,
        teamSize: Number(newTeamSize) || 2,
      });
      setIsCreatingNew(false);
      setNewTitle('');
      setNewDesc('');
      setNewStartTime('');
      setNewCutoffRank(0);
      setNewIsTeamMode(false);
      setNewTeamSize(2);
      setNewAssignedAdminIds([]);
    } catch {
      // Error handled in store
    }
  };

  const handleSaveAssessmentConfig = async () => {
    if (!selectedAssessment) return;
    try {
      const startTimeISO = editStartTime ? parseISTInputToISO(editStartTime) : undefined;
      let endTimeISO: string | undefined = undefined;
      if (startTimeISO) {
        const sTime = new Date(startTimeISO).getTime();
        endTimeISO = new Date(sTime + Number(editDuration) * 60 * 1000).toISOString();
      }

      await updateAssessment(event._id, selectedAssessment._id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        type: editType,
        status: editStatus,
        durationMinutes: Number(editDuration),
        startTime: startTimeISO,
        endTime: endTimeISO,
        passingPercentage: Number(editPassingScore),
        qualificationCutoffRank: Number(editCutoffRank) || 0,
        isTeamMode: editIsTeamMode,
        teamSize: Number(editTeamSize) || 2,
        assignedAdmins: isSuperAdmin ? editAssignedAdminIds : undefined,
      });
    } catch {
      // Handled in store
    }
  };

  const handleDeleteAssessment = async () => {
    if (!selectedAssessment) return;
    if (
      !window.confirm(
        `Are you sure you want to delete assessment "${selectedAssessment.title}"? All questions and student submissions will be removed.`
      )
    ) {
      return;
    }
    setIsDeletingAssessment(true);
    try {
      await deleteAssessment(event._id, selectedAssessment._id);
    } finally {
      setIsDeletingAssessment(false);
    }
  };

  const handleAddMcq = async () => {
    if (!newQuestionText.trim()) return toast.error('Question text is required');
    const validOptions = newOptions.filter((opt) => opt.trim() !== '');
    if (validOptions.length < 2) return toast.error('At least 2 options are required');
    if (!selectedAssessment) return;

    const newQuestion: ArenaMcqQuestion = {
      question: newQuestionText.trim(),
      options: newOptions.map((o) => o.trim()),
      correctOptionIndex: newCorrectIndex,
      points: Number(newMcqPoints) || 10,
      explanation: newExplanation.trim(),
    };

    const updated = [...adminMcqs, newQuestion];
    await saveAssessmentMcqs(event._id, selectedAssessment._id, updated, 'replace');

    // Reset form
    setNewQuestionText('');
    setNewOptions(['', '', '', '']);
    setNewCorrectIndex(0);
    setNewMcqPoints(10);
    setNewExplanation('');
    setShowAddMcq(false);
  };

  const handleDeleteMcq = async (idx: number) => {
    if (!selectedAssessment) return;
    if (!window.confirm('Delete this question?')) return;
    const updated = adminMcqs.filter((_, i) => i !== idx);
    setDeletingMcqIndex(idx);
    try {
      await saveAssessmentMcqs(event._id, selectedAssessment._id, updated, 'replace');
    } finally {
      setDeletingMcqIndex(null);
    }
  };

  const handleAddCoding = async () => {
    if (!newCodingTitle.trim() || !newCodingDesc.trim()) {
      return toast.error('Problem title and description are required');
    }
    if (!selectedAssessment) return;

    const testCases = [
      {
        input: newSampleInput.trim(),
        expectedOutput: newSampleOutput.trim(),
        isHidden: false,
      },
    ];

    if (newHiddenOutput.trim()) {
      testCases.push({
        input: newHiddenInput.trim(),
        expectedOutput: newHiddenOutput.trim(),
        isHidden: true,
      });
    }

    const newProblem: ArenaCodingProblem = {
      title: newCodingTitle.trim(),
      description: newCodingDesc.trim(),
      difficulty: newCodingDiff,
      codingMode: newCodingMode,
      points: Number(newCodingPoints) || 30,
      allowedLanguages:
        newCodingAllowedLanguages.length > 0
          ? newCodingAllowedLanguages
          : ['python', 'javascript', 'cpp', 'java', 'c'],
      sampleInput: newSampleInput.trim(),
      sampleOutput: newSampleOutput.trim(),
      testCases,
    };

    const updated = [...adminCoding, newProblem];
    await saveAssessmentCodingProblems(event._id, selectedAssessment._id, updated, 'replace');

    // Reset form
    setNewCodingTitle('');
    setNewCodingDesc('');
    setNewCodingDiff('Medium');
    setNewCodingMode('BOTH');
    setNewCodingPoints(30);
    setNewCodingAllowedLanguages(['python', 'javascript', 'cpp', 'java', 'c']);
    setNewSampleInput('');
    setNewSampleOutput('');
    setNewHiddenInput('');
    setNewHiddenOutput('');
    setShowAddCoding(false);
  };

  const handleGradeCode = async (submissionId: string, problemId: string) => {
    if (!selectedAssessment?._id) return;
    const score = gradingScores[problemId] !== undefined ? gradingScores[problemId] : 0;
    const feedback = gradingFeedbacks[problemId] || '';
    setIsGradingCode((prev) => ({ ...prev, [problemId]: true }));
    try {
      await evaluateAssessmentCode(event._id, selectedAssessment._id, submissionId, problemId, score, feedback);
      // Update inspectingSub locally
      setInspectingSub((prev: any) => {
        if (!prev) return null;
        const updatedCoding = (prev.codingSubmissions || []).map((cs: any) => {
          if (cs.problemId === problemId) {
            return {
              ...cs,
              pointsEarned: score,
              feedback,
              isEvaluated: true,
              status: score > 0 ? 'ACCEPTED' : 'WRONG_ANSWER',
            };
          }
          return cs;
        });
        const newCodingScore = updatedCoding.reduce((sum: number, c: any) => sum + (c.pointsEarned || 0), 0);
        const total = (prev.mcqScore || 0) + newCodingScore + (prev.designScore || 0);
        return {
          ...prev,
          codingSubmissions: updatedCoding,
          codingScore: newCodingScore,
          totalScore: total,
        };
      });
    } finally {
      setIsGradingCode((prev) => ({ ...prev, [problemId]: false }));
    }
  };

  const handleDeleteCoding = async (idx: number) => {
    if (!selectedAssessment) return;
    if (!window.confirm('Delete this coding challenge?')) return;
    const updated = adminCoding.filter((_, i) => i !== idx);
    setDeletingCodingIndex(idx);
    try {
      await saveAssessmentCodingProblems(event._id, selectedAssessment._id, updated, 'replace');
    } finally {
      setDeletingCodingIndex(null);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile || !bulkModalType || !selectedAssessment) {
      return toast.error('Please choose a file to upload');
    }
    await bulkUploadAssessmentQuestions(
      event._id,
      selectedAssessment._id,
      bulkFile,
      bulkModalType,
      'append'
    );
    setBulkModalType(null);
    setBulkFile(null);
  };

  const switchActiveChallengeOption = (targetIdx: number) => {
    // 1. Sync current form inputs into current slot
    const currentList = [...designChallengesList];
    if (currentList[activeDesignOptionIdx]) {
      currentList[activeDesignOptionIdx] = {
        ...currentList[activeDesignOptionIdx],
        title: designTitle.trim() || `Problem Statement ${activeDesignOptionIdx + 1}`,
        description: designDesc.trim(),
        problemStatement: designProblem.trim(),
        designImageUrl: designImageUrl.trim(),
        referenceFigmaUrl: designRefFigma.trim(),
        deliverables: designDeliverables.filter((d) => d.trim()),
        guidelines: designGuidelines.filter((g) => g.trim()),
        points: Number(designPoints) || 100,
      };
    }
    setDesignChallengesList(currentList);
    setActiveDesignOptionIdx(targetIdx);

    // 2. Load target challenge inputs
    const target = currentList[targetIdx];
    if (target) {
      setDesignTitle(target.title || '');
      setDesignDesc(target.description || '');
      setDesignProblem(target.problemStatement || '');
      setDesignImageUrl(target.referenceImageUrl || target.designImageUrl || '');
      setDesignRefFigma(target.figmaStarterUrl || target.referenceFigmaUrl || '');
      setDesignDeliverables(target.deliverables && target.deliverables.length > 0 ? target.deliverables : ['High-fidelity Desktop & Mobile layouts', 'Interactive Prototype link']);
      setDesignGuidelines(target.guidelines && target.guidelines.length > 0 ? target.guidelines : ['Use Figma Auto-layout', 'Ensure accessible color contrast']);
      setDesignPoints(target.totalPoints || target.points || 100);
    }
  };

  const handleAddDesignChallengeOption = () => {
    // Save current editing fields into existing active index
    const currentList = [...designChallengesList];
    if (currentList[activeDesignOptionIdx]) {
      currentList[activeDesignOptionIdx] = {
        ...currentList[activeDesignOptionIdx],
        title: designTitle.trim() || `Problem Statement ${activeDesignOptionIdx + 1}`,
        description: designDesc.trim(),
        problemStatement: designProblem.trim(),
        designImageUrl: designImageUrl.trim(),
        referenceFigmaUrl: designRefFigma.trim(),
        deliverables: designDeliverables.filter((d) => d.trim()),
        guidelines: designGuidelines.filter((g) => g.trim()),
        points: Number(designPoints) || 100,
      };
    }

    const newIdx = currentList.length;
    const newOption = {
      title: `Problem Statement ${newIdx + 1}`,
      description: 'Alternative problem design for students to choose from',
      problemStatement: '',
      designImageUrl: '',
      referenceFigmaUrl: '',
      deliverables: ['High-fidelity Desktop & Mobile layouts', 'Interactive Prototype link'],
      guidelines: ['Use Figma Auto-layout', 'Ensure accessible WCAG contrast'],
      points: 100,
    };
    const updated = [...currentList, newOption];
    setDesignChallengesList(updated);
    setActiveDesignOptionIdx(newIdx);

    // Reset inputs for new option
    setDesignTitle(newOption.title);
    setDesignDesc(newOption.description);
    setDesignProblem('');
    setDesignImageUrl('');
    setDesignRefFigma('');
    setDesignDeliverables(newOption.deliverables);
    setDesignGuidelines(newOption.guidelines);
    setDesignPoints(100);

    toast.success(`Problem Statement ${newIdx + 1} added! Enter the challenge details below.`);
  };

  const handleRemoveDesignChallengeOption = async (removeIdx: number) => {
    if (designChallengesList.length <= 1) {
      return toast.error('At least one design challenge problem statement is required.');
    }
    if (!window.confirm(`Delete Problem Statement #${removeIdx + 1}? This cannot be undone.`)) {
      return;
    }
    const updated = designChallengesList.filter((_, idx) => idx !== removeIdx);
    setDesignChallengesList(updated);
    const nextIdx = Math.max(0, removeIdx - 1);
    setActiveDesignOptionIdx(nextIdx);
    const target = updated[nextIdx];
    if (target) {
      setDesignTitle(target.title || '');
      setDesignDesc(target.description || '');
      setDesignProblem(target.problemStatement || '');
      setDesignImageUrl(target.referenceImageUrl || target.designImageUrl || '');
      setDesignRefFigma(target.figmaStarterUrl || target.referenceFigmaUrl || '');
      if (target.deliverables) setDesignDeliverables(target.deliverables);
      if (target.guidelines) setDesignGuidelines(target.guidelines);
      setDesignPoints(target.totalPoints || target.points || 100);
    }
    // Also save to server
    if (selectedAssessment) {
      await saveAssessmentDesignChallenge(event._id, selectedAssessment._id, {
        challenges: updated,
      });
    }
    toast.success('Design challenge problem removed and updated.');
  };

  const handleSaveDesignChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessment) return;
    if (!designTitle.trim()) {
      return toast.error('Please enter a challenge title');
    }
    if (!designImageUrl.trim()) {
      return toast.error('Please upload or provide a reference design image');
    }

    // Prepare synchronized challenges list
    const currentList = [...designChallengesList];
    currentList[activeDesignOptionIdx] = {
      title: designTitle.trim(),
      description: designDesc.trim(),
      problemStatement: designProblem.trim(),
      designImageUrl: designImageUrl.trim(),
      referenceFigmaUrl: designRefFigma.trim(),
      deliverables: designDeliverables.filter((d) => d.trim()),
      guidelines: designGuidelines.filter((g) => g.trim()),
      points: Number(designPoints) || 100,
    };

    await saveAssessmentDesignChallenge(event._id, selectedAssessment._id, {
      challenges: currentList,
    });
    setDesignChallengesList(currentList);
  };

  const handleExportTournamentLeaderboard = async () => {
    if (!overallLeaderboard || overallLeaderboard.length === 0) {
      return toast.error('No leaderboard data to export');
    }
    const assessmentsList = overallLeaderboardAssessments || assessments || [];
    const rows = overallLeaderboard.map((entry: any) => {
      const row: Record<string, any> = {
        'Rank': entry.rank,
        'Student Name': entry.student?.name || 'N/A',
        'Roll No': entry.student?.rollNo || 'N/A',
        'Email': entry.student?.email || 'N/A',
        'Department': entry.student?.department || 'N/A',
        'Year': entry.student?.year || 'N/A',
        'Residence': entry.student?.residenceType || 'N/A',
        'Team': entry.teamName || 'Individual',
      };

      assessmentsList.forEach((asm: any, idx: number) => {
        const round = entry.roundScores?.[asm._id];
        const roundTitle = `Round ${idx + 1} (${asm.title})`;
        row[roundTitle] = round?.score !== undefined ? `${round.score} / ${round.maxScore || asm.totalPoints || 100}` : 'Not Attempted';
      });

      row['Total Points'] = entry.totalScore || 0;
      row['Rounds Completed'] = `${entry.roundsCompleted || 0} / ${assessmentsList.length}`;
      row['Total Time (Mins)'] = Math.floor((entry.totalTimeTakenSeconds || 0) / 60);

      return row;
    });

    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tournament Leaderboard');
    XLSX.writeFile(workbook, `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Tournament_Leaderboard.xlsx`);
    toast.success('Tournament leaderboard exported to Excel successfully!');
  };

  const handleUploadDesignFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return toast.error('Please upload an image file (PNG, JPG, WEBP, etc.)');
    }
    setUploadingDesignImg(true);
    try {
      const url = await uploadDesignImage(file);
      setDesignImageUrl(url);
      toast.success('Design reference image uploaded successfully!');
    } catch {
      // toast in store
    } finally {
      setUploadingDesignImg(false);
    }
  };

  const handleEvaluateSubmit = async () => {
    if (!selectedAssessment || !evaluatingSub) return;
    await evaluateAssessmentDesign(
      event._id,
      selectedAssessment._id,
      evaluatingSub._id,
      {
        pointsEarned: Number(evalPoints) || 0,
        feedback: evalFeedback.trim(),
      }
    );
    setEvaluatingSub(null);
    setEvalPoints(0);
    setEvalFeedback('');
  };

  return (
    <ResponsiveModal
      open={isOpen && Boolean(event)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span>Event Arena Assessments</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Admin Panel
            </span>
          </div>
        </div>
      }
      description={`${event?.title || 'Event'} • Multi-Assessment Management & Assigned Admins`}
      dialogClassName="sm:max-w-5xl p-4 sm:p-6"
      drawerClassName="max-h-[92dvh] px-2 sm:px-4 pb-6 pt-2"
    >
      <div className="space-y-4 pt-2">

        {/* Assessment Switcher Bar */}
        <div className="px-3 sm:px-6 py-2.5 border-b border-separator bg-surface-secondary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 rounded-2xl">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 sm:mx-0 sm:px-0">
            <span className="text-[11px] font-bold text-label-tertiary uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Layers size={13} className="text-purple-500" />
              <span className="hidden sm:inline">Rounds:</span>
            </span>

            {assessments.map((asm) => {
              const isSelected = !isCreatingNew && selectedAssessment?._id === asm._id;
              return (
                <Button
                  key={asm._id}
                  size="sm"
                  variant={isSelected ? 'solid' : 'bordered'}
                  color={isSelected ? 'secondary' : 'default'}
                  onPress={() => {
                    setIsCreatingNew(false);
                    setSelectedAssessment(asm);
                  }}
                  className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                      : 'bg-surface hover:bg-surface-secondary text-label-secondary hover:text-label-primary border-separator'
                  }`}
                  endContent={
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-surface-secondary text-label-tertiary'
                      }`}
                    >
                      {asm.type}
                    </span>
                  }
                >
                  <span className="truncate max-w-[120px] sm:max-w-[150px]">{asm.title}</span>
                </Button>
              );
            })}
          </div>

          <Button
            size="sm"
            variant={isCreatingNew ? 'solid' : 'flat'}
            color="success"
            onPress={() => setIsCreatingNew(true)}
            startContent={<Plus size={14} />}
            className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer ${
              isCreatingNew
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'border border-emerald-500/30'
            }`}
          >
            Create Assessment
          </Button>
        </div>

        {/* Main Body */}
        {isCreatingNew ? (
          /* CREATE NEW ASSESSMENT VIEW */
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-5">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-separator">
                <div>
                  <h3 className="text-base font-bold text-label-primary flex items-center gap-2">
                    <Plus size={16} className="text-emerald-400" />
                    <span>Create a New Arena Assessment</span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Add another round or assessment (e.g. Round 1 MCQ, Round 2 Coding) and assign admins.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => setIsCreatingNew(false)}
                  className="text-xs text-text-muted hover:text-label-primary"
                >
                  Cancel
                </Button>
              </div>

              <form onSubmit={handleCreateAssessment} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-label-secondary mb-1.5">
                    Assessment Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Round 1: Screening Test or Coding Finale"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Short description or guidelines for this assessment..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <HeroUISelect
                      label="Assessment Type"
                      value={newType}
                      onChange={(val) => setNewType(val as any)}
                      color="purple"
                      options={[
                        { value: 'HYBRID', label: 'Hybrid (MCQ + Coding)', badge: 'Hybrid' },
                        { value: 'MCQ', label: 'MCQ Questions Only', badge: 'MCQ' },
                        { value: 'CODING', label: 'Coding Challenges Only', badge: 'Code' },
                        { value: 'UI_UX', label: 'UI/UX Design (Figma)', badge: 'Design' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">Duration (Minutes)</label>
                    <input
                      type="number"
                      min={5}
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">Passing Score (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newPassingScore}
                      onChange={(e) => setNewPassingScore(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                {/* Schedule & Start Time */}
                <div className="p-4 rounded-2xl bg-surface-secondary/60 border border-separator space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                      <Clock size={14} className="text-purple-400" />
                      <span>Assessment Schedule & Auto-Live Trigger</span>
                    </label>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      IST (Asia/Kolkata)
                    </span>
                  </div>

                  <HeroDateTimePicker
                    label="Test Start Time (IST)"
                    value={newStartTime}
                    onChange={(val) => setNewStartTime(val)}
                    placeholder="Select assessment start date and time..."
                    variant="flat"
                    className="w-full"
                    description="The assessment automatically switches to LIVE 10 minutes before this start time."
                  />

                  {newStartTime && (
                    <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs space-y-1.5 font-mono">
                      <div className="flex items-center justify-between text-label-primary flex-wrap gap-1">
                        <span className="text-purple-400 flex items-center gap-1">
                          <Sparkles size={12} /> Auto-Live Window:
                        </span>
                        <span className="font-semibold text-emerald-400">
                          {formatISTDateTime(new Date(new Date(parseISTInputToISO(newStartTime)).getTime() - 10 * 60 * 1000))} (10 mins prior)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-label-primary flex-wrap gap-1">
                        <span className="text-purple-400 flex items-center gap-1">
                          <Calendar size={12} /> Test Starts:
                        </span>
                        <span className="font-semibold">
                          {formatISTDateTime(parseISTInputToISO(newStartTime))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-label-primary flex-wrap gap-1">
                        <span className="text-purple-400 flex items-center gap-1">
                          <Clock size={12} /> Test Cutoff (Ends):
                        </span>
                        <span className="font-semibold text-rose-400">
                          {formatISTDateTime(new Date(new Date(parseISTInputToISO(newStartTime)).getTime() + Number(newDuration) * 60 * 1000))}
                        </span>
                      </div>
                      <p className="text-[10px] text-label-tertiary pt-1 border-t border-separator/60 font-sans">
                        Students entering early or late will strictly count down to this cutoff deadline.
                      </p>
                    </div>
                  )}
                </div>

                {/* Qualification Cutoff & Team Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">
                      Qualify Top Students (Cutoff)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newCutoffRank}
                      onChange={(e) => setNewCutoffRank(Number(e.target.value))}
                      placeholder="e.g. 80 (0 for all)"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                    <p className="text-[10px] text-label-tertiary mt-1">
                      Top N from previous round allowed (0 = open to all enrolled).
                    </p>
                  </div>

                  <div>
                    <HeroUISelect
                      label="Round Mode"
                      value={newIsTeamMode ? 'team' : 'individual'}
                      onChange={(val) => setNewIsTeamMode(val === 'team')}
                      color="purple"
                      options={[
                        { value: 'individual', label: 'Individual Participation', badge: 'Solo' },
                        { value: 'team', label: 'Team Mode (Manual Assignment)', badge: 'Team' },
                      ]}
                    />
                  </div>

                  {newIsTeamMode && (
                    <div>
                      <label className="block text-xs font-bold text-label-secondary mb-1.5">Team Size</label>
                      <input
                        type="number"
                        min={2}
                        max={10}
                        value={newTeamSize}
                        onChange={(e) => setNewTeamSize(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-separator text-xs text-label-primary outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Assigned Admins Selector */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                        <Users size={14} className="text-purple-400" />
                        <span>Assign Assessment Admins</span>
                      </label>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Selected admins will have exclusive authority to create and manage questions for this assessment.
                      </p>
                    </div>
                    {isSuperAdmin && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        SuperAdmin Control
                      </span>
                    )}
                  </div>

                  {isSuperAdmin ? (
                    <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-separator">
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-label-primary /40"
                        />
                        <input
                          type="text"
                          value={adminSearch}
                          onChange={(e) => setAdminSearch(e.target.value)}
                          placeholder="Search admins by name, email, roll number..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {filteredCandidates.map((cand) => {
                          const isAssigned = newAssignedAdminIds.includes(cand._id);
                          return (
                            <div
                              key={cand._id}
                              onClick={() => toggleNewAdmin(cand._id)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                isAssigned
                                  ? 'bg-purple-500/15 border-purple-500/40 text-label-primary '
                                  : 'bg-white/[0.02] border-white/5 hover:border-separator text-label-primary /70'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/10 shrink-0">
                                  <img
                                    src={
                                      cand.profilePicUrl ||
                                      `https://ui-avatars.com/api/?name=${cand.name}&background=1D1D1F&color=fff&size=80`
                                    }
                                    alt={cand.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-bold">{cand.name}</p>
                                  <p className="text-[10px] text-text-muted">
                                    {cand.email} • {cand.role} {cand.department ? `(${cand.department})` : ''}
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                                  isAssigned
                                    ? 'bg-purple-600 border-purple-500 text-label-primary '
                                    : 'border-separator'
                                }`}
                              >
                                {isAssigned && <Check size={12} />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white/5 border border-separator text-xs text-text-muted">
                      Admin assignment is managed by SuperAdmin.
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setIsCreatingNew(false)}
                    className="rounded-xl text-xs font-bold text-label-secondary hover:text-label-primary"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    color="secondary"
                    variant="solid"
                    isLoading={actionLoading}
                    startContent={<Plus size={14} />}
                    className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30"
                  >
                    Create Assessment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : selectedAssessment ? (
          /* SELECTED ASSESSMENT WORKSPACE */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Assessment Sub-Navigation */}
            <div className="border-b border-separator bg-surface-secondary/30 shrink-0 space-y-2 py-2 px-1 sm:px-4 rounded-xl">
              {/* Row 1: Horizontally Scrollable Tabs with touch momentum */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1 py-0.5">
                <Button
                  size="sm"
                  variant={activeTab === 'settings' ? 'solid' : 'bordered'}
                  color={activeTab === 'settings' ? 'primary' : 'default'}
                  onPress={() => setActiveTab('settings')}
                  startContent={<Settings size={13} />}
                  className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'bg-accent text-white shadow-xs'
                      : 'bg-surface text-label-secondary hover:text-label-primary border-separator'
                  }`}
                >
                  Config & Admins
                </Button>

                {(selectedAssessment.type === 'MCQ' || selectedAssessment.type === 'HYBRID') && (
                  <Button
                    size="sm"
                    variant={activeTab === 'mcq' ? 'solid' : 'bordered'}
                    color={activeTab === 'mcq' ? 'secondary' : 'default'}
                    onPress={() => setActiveTab('mcq')}
                    startContent={<HelpCircle size={13} />}
                    className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                      activeTab === 'mcq'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-surface text-label-secondary hover:text-label-primary border-separator'
                    }`}
                  >
                    MCQs ({adminMcqs.length})
                  </Button>
                )}

                {(selectedAssessment.type === 'CODING' || selectedAssessment.type === 'HYBRID') && (
                  <Button
                    size="sm"
                    variant={activeTab === 'coding' ? 'solid' : 'bordered'}
                    color={activeTab === 'coding' ? 'primary' : 'default'}
                    onPress={() => setActiveTab('coding')}
                    startContent={<Code2 size={13} />}
                    className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                      activeTab === 'coding'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-surface text-label-secondary hover:text-label-primary border-separator'
                    }`}
                  >
                    Coding ({adminCoding.length})
                  </Button>
                )}

                {selectedAssessment.type === 'UI_UX' && (
                  <Button
                    size="sm"
                    variant={activeTab === 'design' ? 'solid' : 'bordered'}
                    color={activeTab === 'design' ? 'secondary' : 'default'}
                    onPress={() => setActiveTab('design')}
                    startContent={<Palette size={13} className={activeTab === 'design' ? 'text-white' : 'text-pink-400'} />}
                    className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                      activeTab === 'design'
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xs'
                        : 'bg-surface text-label-secondary hover:text-label-primary border-separator'
                    }`}
                  >
                    UI/UX Design
                  </Button>
                )}

                <Button
                  size="sm"
                  variant={activeTab === 'teams' ? 'solid' : 'bordered'}
                  color={activeTab === 'teams' ? 'primary' : 'default'}
                  onPress={() => setActiveTab('teams')}
                  startContent={<Users size={13} />}
                  className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                    activeTab === 'teams'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-surface text-label-secondary hover:text-label-primary border-separator'
                  }`}
                >
                  Teams ({arenaTeams.length})
                </Button>

                <Button
                  size="sm"
                  variant={activeTab === 'submissions' ? 'solid' : 'bordered'}
                  color={activeTab === 'submissions' ? 'primary' : 'default'}
                  onPress={() => setActiveTab('submissions')}
                  startContent={<Award size={13} />}
                  className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                    activeTab === 'submissions'
                      ? 'bg-accent text-white shadow-xs'
                      : 'bg-surface text-label-secondary hover:text-label-primary border-separator'
                  }`}
                >
                  Submissions ({adminSubmissions.length})
                </Button>

                <Button
                  size="sm"
                  variant={activeTab === 'blocked' ? 'solid' : 'bordered'}
                  color={activeTab === 'blocked' ? 'danger' : 'default'}
                  onPress={() => setActiveTab('blocked')}
                  startContent={<ShieldAlert size={13} className={activeTab === 'blocked' ? 'text-white' : 'text-rose-400'} />}
                  className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                    activeTab === 'blocked'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-surface text-label-secondary hover:text-label-primary border-separator'
                  }`}
                >
                  Blocked Students
                  {blockedCount > 0 && (
                    <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      activeTab === 'blocked' ? 'bg-black/30 text-white' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {blockedCount}
                    </span>
                  )}
                </Button>
              </div>

              {/* Row 2: Status & Quick Meta bar */}
              <div className="flex items-center justify-between px-2 pt-1 border-t border-separator/40 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedAssessment.status === 'LIVE'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                      : selectedAssessment.status === 'UPCOMING'
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25'
                      : 'bg-surface-secondary text-label-secondary border border-separator'
                  }`}>
                    {selectedAssessment.status}
                  </span>
                  <span className="text-[11px] text-label-tertiary font-mono">
                    {selectedAssessment.durationMinutes}m • {selectedAssessment.totalPoints} pts
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="flat"
                    color="secondary"
                    startContent={<Play size={12} className="text-purple-400 fill-purple-400" />}
                    onPress={() => {
                      onClose();
                      navigate(`/events/${event._id}/arena?assessmentId=${selectedAssessment._id}&preview=true`);
                    }}
                    className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 cursor-pointer shadow-xs"
                    title="Enter assessment workspace in Admin Preview Mode"
                  >
                    Preview Test
                  </Button>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {(selectedAssessment.assignedAdmins || []).slice(0, 3).map((adm: any) => (
                      <img
                        key={adm._id || adm}
                        title={adm.name || 'Assigned Admin'}
                        src={
                          adm.profilePicUrl ||
                          `https://ui-avatars.com/api/?name=${adm.name || 'Admin'}&background=7C3AED&color=fff&size=60`
                        }
                        className="w-5 h-5 rounded-full border border-separator object-cover"
                      />
                    ))}
                  </div>
                  {canManageSelected ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Editor
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      View
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-Tab Contents */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6">
              {/* TAB 1: CONFIG & ASSIGNED ADMINS */}
              {activeTab === 'settings' && (
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-separator space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-separator">
                      <div>
                        <h3 className="text-sm font-bold text-label-primary ">Assessment Information</h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          Configure title, type, duration and passing criteria
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {selectedAssessment.totalPoints} Points Total
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-label-secondary mb-1.5">Assessment Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-separator text-xs text-label-primary outline-none focus:border-purple-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <HeroUISelect
                          label="Status"
                          value={editStatus}
                          onChange={(val) => setEditStatus(val as any)}
                          disabled={!canManageSelected}
                          color="purple"
                          options={[
                            { value: 'LIVE', label: 'Live (Open for students)', badge: 'Live' },
                            { value: 'UPCOMING', label: 'Upcoming', badge: 'Upcoming' },
                            { value: 'DRAFT', label: 'Draft', badge: 'Draft' },
                            { value: 'ENDED', label: 'Ended', badge: 'Ended' },
                          ]}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">Description</label>
                      <textarea
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        disabled={!canManageSelected}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <HeroUISelect
                          label="Type"
                          value={editType}
                          onChange={(val) => setEditType(val as any)}
                          disabled={!canManageSelected}
                          color="purple"
                          options={[
                            { value: 'HYBRID', label: 'Hybrid (MCQ + Coding)', badge: 'Hybrid' },
                            { value: 'MCQ', label: 'MCQ Questions Only', badge: 'MCQ' },
                            { value: 'CODING', label: 'Coding Challenges Only', badge: 'Code' },
                            { value: 'UI_UX', label: 'UI/UX Design (Figma)', badge: 'Design' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">Duration (Mins)</label>
                        <input
                          type="number"
                          min={5}
                          value={editDuration}
                          onChange={(e) => setEditDuration(Number(e.target.value))}
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">Passing %</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={editPassingScore}
                          onChange={(e) => setEditPassingScore(Number(e.target.value))}
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Schedule & Timing in Edit */}
                    <div className="p-4 rounded-2xl bg-surface-secondary/60 border border-separator space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                          <Clock size={14} className="text-purple-400" />
                          <span>Assessment Schedule & Auto-Live Trigger</span>
                        </label>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          IST (Asia/Kolkata)
                        </span>
                      </div>

                      <HeroDateTimePicker
                        label="Test Start Time (IST)"
                        value={editStartTime}
                        onChange={(val) => setEditStartTime(val)}
                        disabled={!canManageSelected}
                        placeholder="Select assessment start date and time..."
                        variant="flat"
                        className="w-full"
                        description="Assessment automatically switches to LIVE 10 minutes prior to start time."
                      />

                      {editStartTime && (
                        <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs space-y-1.5 font-mono">
                          <div className="flex items-center justify-between text-label-primary flex-wrap gap-1">
                            <span className="text-purple-400 flex items-center gap-1">
                              <Sparkles size={12} /> Auto-Live Window:
                            </span>
                            <span className="font-semibold text-emerald-400">
                              {formatISTDateTime(new Date(new Date(parseISTInputToISO(editStartTime)).getTime() - 10 * 60 * 1000))} (10 mins prior)
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-label-primary flex-wrap gap-1">
                            <span className="text-purple-400 flex items-center gap-1">
                              <Calendar size={12} /> Test Starts:
                            </span>
                            <span className="font-semibold">
                              {formatISTDateTime(parseISTInputToISO(editStartTime))}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-label-primary flex-wrap gap-1">
                            <span className="text-purple-400 flex items-center gap-1">
                              <Clock size={12} /> Test Cutoff (Ends):
                            </span>
                            <span className="font-semibold text-rose-400">
                              {formatISTDateTime(new Date(new Date(parseISTInputToISO(editStartTime)).getTime() + Number(editDuration) * 60 * 1000))}
                            </span>
                          </div>
                          <p className="text-[10px] text-label-tertiary pt-1 border-t border-separator/60 font-sans">
                            Students entering early or late will strictly count down to this cutoff deadline.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Cutoff & Team Mode Configuration */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">
                          Top Rank Cutoff (Next Round)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={editCutoffRank}
                          onChange={(e) => setEditCutoffRank(Number(e.target.value))}
                          disabled={!canManageSelected}
                          placeholder="e.g. 80 (0 for no limit)"
                          className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
                        />
                        <p className="text-[10px] text-label-tertiary mt-1">
                          Only top {editCutoffRank || 0} students from previous round attend.
                        </p>
                      </div>

                      <div>
                        <HeroUISelect
                          label="Round Mode"
                          value={editIsTeamMode ? 'team' : 'individual'}
                          onChange={(val) => setEditIsTeamMode(val === 'team')}
                          disabled={!canManageSelected}
                          color="purple"
                          options={[
                            { value: 'individual', label: 'Individual Participation', badge: 'Solo' },
                            { value: 'team', label: 'Team Mode (Manual Allocation)', badge: 'Team' },
                          ]}
                        />
                      </div>

                      {editIsTeamMode && (
                        <div>
                          <label className="block text-xs font-bold text-label-secondary mb-1.5">Team Size</label>
                          <input
                            type="number"
                            min={2}
                            max={10}
                            value={editTeamSize}
                            onChange={(e) => setEditTeamSize(Number(e.target.value))}
                            disabled={!canManageSelected}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-separator text-xs text-label-primary outline-none disabled:opacity-50"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assigned Admins for this Assessment */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-separator space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-separator">
                      <div>
                        <h3 className="text-sm font-bold text-label-primary flex items-center gap-2">
                          <Crown size={15} className="text-amber-400" />
                          <span>Assigned Assessment Admins</span>
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          Admins selected here have exclusive permission to upload questions to this assessment.
                        </p>
                      </div>
                      {isSuperAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          SuperAdmin Assigning
                        </span>
                      )}
                    </div>

                    {isSuperAdmin ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-label-primary /40"
                          />
                          <input
                            type="text"
                            value={adminSearch}
                            onChange={(e) => setAdminSearch(e.target.value)}
                            placeholder="Search admin name, email, roll number..."
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500"
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                          {filteredCandidates.map((cand) => {
                            const isAssigned = editAssignedAdminIds.includes(cand._id);
                            return (
                              <div
                                key={cand._id}
                                onClick={() => toggleEditAdmin(cand._id)}
                                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                  isAssigned
                                    ? 'bg-purple-500/15 border-purple-500/40 text-label-primary '
                                    : 'bg-white/[0.02] border-white/5 hover:border-separator text-label-primary /70'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/10 shrink-0">
                                    <img
                                      src={
                                        cand.profilePicUrl ||
                                        `https://ui-avatars.com/api/?name=${cand.name}&background=1D1D1F&color=fff&size=80`
                                      }
                                      alt={cand.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="text-left">
                                    <p className="text-xs font-bold">{cand.name}</p>
                                    <p className="text-[10px] text-text-muted">
                                      {cand.email} • {cand.role} {cand.department ? `(${cand.department})` : ''}
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                                    isAssigned
                                      ? 'bg-purple-600 border-purple-500 text-label-primary '
                                      : 'border-separator'
                                  }`}
                                >
                                  {isAssigned && <Check size={12} />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(selectedAssessment.assignedAdmins || []).length > 0 ? (
                          (selectedAssessment.assignedAdmins || []).map((adm: any) => (
                            <div
                              key={adm._id || adm}
                              className="px-3 py-1.5 rounded-xl bg-white/5 border border-separator flex items-center gap-2 text-xs"
                            >
                              <div className="w-5 h-5 rounded-full overflow-hidden bg-purple-500/20 shrink-0">
                                <img
                                  src={
                                    adm.profilePicUrl ||
                                    `https://ui-avatars.com/api/?name=${adm.name || 'Admin'}&background=7C3AED&color=fff&size=40`
                                  }
                                  alt={adm.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="font-semibold text-label-primary ">{adm.name || 'Admin'}</span>
                              <span className="text-[10px] text-text-muted">{adm.role}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-text-muted italic">No admins specifically assigned yet.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-separator">
                    {isSuperAdmin && (
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        onPress={handleDeleteAssessment}
                        isLoading={isDeletingAssessment}
                        isDisabled={isDeletingAssessment}
                        startContent={!isDeletingAssessment ? <Trash2 size={13} /> : undefined}
                        className="rounded-full text-xs font-semibold"
                      >
                        Delete Assessment
                      </Button>
                    )}

                    {canManageSelected && (
                      <Button
                        size="sm"
                        variant="solid"
                        color="primary"
                        isLoading={actionLoading}
                        onPress={handleSaveAssessmentConfig}
                        startContent={<CheckCircle2 size={13} />}
                        className="w-full sm:w-auto ml-auto px-6 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-md"
                      >
                        Save Changes
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: MCQ QUESTIONS */}
              {activeTab === 'mcq' && (
                <div className="space-y-6">
                  {/* Action Bar */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-separator flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <HelpCircle size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-label-primary ">MCQ Question Bank</h4>
                        <p className="text-xs text-text-muted">
                          {adminMcqs.length} Questions • Total {adminMcqs.reduce((s, q) => s + (q.points || 10), 0)} Points
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        color="secondary"
                        startContent={<Play size={13} className="text-purple-400 fill-purple-400" />}
                        onPress={() => {
                          onClose();
                          navigate(`/events/${event._id}/arena?assessmentId=${selectedAssessment._id}&preview=true`);
                        }}
                        className="rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold border border-purple-500/30"
                      >
                        Preview Test
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => downloadArenaTemplate(event._id, 'mcq')}
                        startContent={<Download size={13} />}
                        className="rounded-xl bg-white/5 hover:bg-white/10 text-label-primary text-xs font-semibold border border-separator"
                      >
                        Sample Template
                      </Button>

                      {canManageSelected && (
                        <>
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => setBulkModalType('mcq')}
                            startContent={<Upload size={13} />}
                            className="rounded-xl bg-white/5 hover:bg-white/10 text-label-primary text-xs font-semibold border border-separator"
                          >
                            Bulk Upload Excel
                          </Button>

                          <Button
                            size="sm"
                            variant="solid"
                            color="secondary"
                            onPress={() => setShowAddMcq(!showAddMcq)}
                            startContent={<Plus size={14} />}
                            className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30"
                          >
                            Add Question
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Manual Add MCQ Form */}
                  <AnimatePresence>
                    {showAddMcq && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-5 rounded-2xl bg-white/[0.03] border border-purple-500/30 space-y-4 overflow-visible relative z-20"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-separator">
                          <h4 className="text-xs font-bold text-label-primary flex items-center gap-2">
                            <Plus size={14} className="text-purple-400" />
                            <span>Add New Multiple Choice Question</span>
                          </h4>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => setShowAddMcq(false)}
                            className="text-text-muted hover:text-label-primary min-w-unit-8 w-8 h-8 rounded-lg cursor-pointer"
                          >
                            <X size={15} />
                          </Button>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">Question Text</label>
                          <textarea
                            rows={2}
                            value={newQuestionText}
                            onChange={(e) => setNewQuestionText(e.target.value)}
                            placeholder="Enter the question prompt..."
                            className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none resize-none focus:border-purple-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {newOptions.map((opt, optIdx) => (
                            <div key={optIdx} className="space-y-1">
                              <label className="flex items-center justify-between text-[11px] font-bold text-label-primary /70">
                                <span>Option {String.fromCharCode(65 + optIdx)}</span>
                                <label className="flex items-center gap-1 text-emerald-400 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="correctOption"
                                    checked={newCorrectIndex === optIdx}
                                    onChange={() => setNewCorrectIndex(optIdx)}
                                    className="accent-purple-500 cursor-pointer"
                                  />
                                  <span>Correct Answer</span>
                                </label>
                              </label>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...newOptions];
                                  updated[optIdx] = e.target.value;
                                  setNewOptions(updated);
                                }}
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-separator text-xs text-label-primary outline-none focus:border-purple-500"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-label-secondary mb-1">Points</label>
                            <input
                              type="number"
                              min={1}
                              value={newMcqPoints}
                              onChange={(e) => setNewMcqPoints(Number(e.target.value))}
                              className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-separator text-xs text-label-primary outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-label-secondary mb-1">Explanation (Optional)</label>
                            <input
                              type="text"
                              value={newExplanation}
                              onChange={(e) => setNewExplanation(e.target.value)}
                              placeholder="Explanation shown after submission..."
                              className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-separator text-xs text-label-primary outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="light"
                            onPress={() => setShowAddMcq(false)}
                            className="rounded-xl text-xs font-bold text-text-muted hover:text-label-primary"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="solid"
                            color="secondary"
                            isLoading={actionLoading}
                            onPress={handleAddMcq}
                            startContent={<CheckCircle2 size={13} />}
                            className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30"
                          >
                            Save Question
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* List of MCQs */}
                  <div className="space-y-3">
                    {adminMcqs.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-white/[0.02] border border-separator text-center space-y-2">
                        <HelpCircle size={28} className="mx-auto text-label-primary /30" />
                        <h4 className="text-sm font-bold text-label-primary ">No MCQ Questions Yet</h4>
                        <p className="text-xs text-text-muted max-w-sm mx-auto">
                          Click "Add Question" above or upload an Excel file containing questions and options.
                        </p>
                      </div>
                    ) : (
                      adminMcqs.map((q, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-separator transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <h5 className="text-xs font-bold text-label-primary leading-relaxed">{q.question}</h5>
                                {q.explanation && (
                                  <p className="text-[11px] text-text-muted italic mt-1">{q.explanation}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-label-secondary">
                                {q.points || 10} pts
                              </span>
                              {canManageSelected && (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  isLoading={deletingMcqIndex === idx}
                                  isDisabled={deletingMcqIndex === idx}
                                  onPress={() => handleDeleteMcq(idx)}
                                  className="w-7 h-7 min-w-7 min-h-7 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10"
                                >
                                  <Trash2 size={13} />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-8">
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = q.correctOptionIndex === optIdx;
                              return (
                                <div
                                  key={optIdx}
                                  className={`px-3 py-1.5 rounded-lg border text-xs flex items-center justify-between ${
                                    isCorrect
                                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                                      : 'bg-white/[0.01] border-white/5 text-label-primary /70'
                                  }`}
                                >
                                  <span>
                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                  </span>
                                  {isCorrect && (
                                    <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                                      <CheckCircle2 size={11} />
                                      <span>Correct</span>
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: CODING CHALLENGES */}
              {activeTab === 'coding' && (
                <div className="space-y-6">
                  {/* Action Bar */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-separator flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Code2 size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-label-primary ">Coding Challenges</h4>
                        <p className="text-xs text-text-muted">
                          {adminCoding.length} Problems • Total{' '}
                          {adminCoding.reduce((s, p) => s + (p.points || 30), 0)} Points
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        color="secondary"
                        startContent={<Play size={13} className="text-purple-400 fill-purple-400" />}
                        onPress={() => {
                          onClose();
                          navigate(`/events/${event._id}/arena?assessmentId=${selectedAssessment._id}&preview=true`);
                        }}
                        className="rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold border border-purple-500/30"
                      >
                        Preview Test
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => downloadArenaTemplate(event._id, 'coding')}
                        startContent={<Download size={13} />}
                        className="rounded-xl bg-white/5 hover:bg-white/10 text-label-primary text-xs font-semibold border border-separator"
                      >
                        Sample Template
                      </Button>

                      {canManageSelected && (
                        <>
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => setBulkModalType('coding')}
                            startContent={<Upload size={13} />}
                            className="rounded-xl bg-white/5 hover:bg-white/10 text-label-primary text-xs font-semibold border border-separator"
                          >
                            Bulk Upload Excel
                          </Button>

                          <Button
                            size="sm"
                            variant="solid"
                            color="primary"
                            onPress={() => setShowAddCoding(!showAddCoding)}
                            startContent={<Plus size={14} />}
                            className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
                          >
                            Add Problem
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Manual Add Coding Problem Form */}
                  <AnimatePresence>
                    {showAddCoding && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-5 rounded-2xl bg-white/[0.03] border border-blue-500/30 space-y-4 overflow-visible relative z-20"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-separator">
                          <h4 className="text-xs font-bold text-label-primary flex items-center gap-2">
                            <Plus size={14} className="text-blue-400" />
                            <span>Add New Coding Challenge</span>
                          </h4>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => setShowAddCoding(false)}
                            className="text-text-muted hover:text-label-primary min-w-unit-8 w-8 h-8 rounded-lg cursor-pointer"
                          >
                            <X size={15} />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-30">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1">Problem Title</label>
                            <input
                              type="text"
                              value={newCodingTitle}
                              onChange={(e) => setNewCodingTitle(e.target.value)}
                              placeholder="e.g. Invert a Binary Tree or Maximum Subarray"
                              className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <HeroUISelect
                              label="Difficulty"
                              value={newCodingDiff}
                              onChange={(val) => setNewCodingDiff(val as any)}
                              size="sm"
                              color="purple"
                              options={[
                                { value: 'Easy', label: 'Easy', badge: 'Easy' },
                                { value: 'Medium', label: 'Medium', badge: 'Med' },
                                { value: 'Hard', label: 'Hard', badge: 'Hard' },
                              ]}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-label-secondary mb-1">
                            Problem Description & Constraints
                          </label>
                          <textarea
                            rows={3}
                            value={newCodingDesc}
                            onChange={(e) => setNewCodingDesc(e.target.value)}
                            placeholder="Describe the challenge problem, input and output expectations..."
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-separator text-xs text-label-primary outline-none resize-none focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-label-secondary mb-1">Sample Input</label>
                            <textarea
                              rows={2}
                              value={newSampleInput}
                              onChange={(e) => setNewSampleInput(e.target.value)}
                              placeholder="Sample stdin input..."
                              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-separator text-xs text-label-primary font-mono outline-none resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-label-secondary mb-1">
                              Sample Output (Expected)
                            </label>
                            <textarea
                              rows={2}
                              value={newSampleOutput}
                              onChange={(e) => setNewSampleOutput(e.target.value)}
                              placeholder="Sample expected output..."
                              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-separator text-xs text-label-primary font-mono outline-none resize-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-amber-400 mb-1">
                              Hidden Test Case Input
                            </label>
                            <textarea
                              rows={2}
                              value={newHiddenInput}
                              onChange={(e) => setNewHiddenInput(e.target.value)}
                              placeholder="Hidden input for grading..."
                              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-500/30 text-xs text-label-primary font-mono outline-none resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-amber-400 mb-1">
                              Hidden Test Case Expected Output
                            </label>
                            <textarea
                              rows={2}
                              value={newHiddenOutput}
                              onChange={(e) => setNewHiddenOutput(e.target.value)}
                              placeholder="Hidden expected output..."
                              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-500/30 text-xs text-label-primary font-mono outline-none resize-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-20">
                          <div>
                            <HeroUISelect
                              label="Coding Mode"
                              value={newCodingMode}
                              onChange={(val) => setNewCodingMode(val as any)}
                              size="sm"
                              color="purple"
                              placement="top-start"
                              options={[
                                {
                                  value: 'BOTH',
                                  label: 'Both (Student Chooses: Only Code or Test Cases)',
                                  badge: 'Choice',
                                },
                                {
                                  value: 'ONLY_CODE',
                                  label: 'Only Code (Assigned Admin Grades Solution)',
                                  badge: 'Manual',
                                },
                                {
                                  value: 'TEST_CASES',
                                  label: 'Code with Test Cases (Auto-Graded Immediately)',
                                  badge: 'Auto',
                                },
                              ]}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1">
                              Points Possible
                            </label>
                            <input
                              type="number"
                              value={newCodingPoints}
                              onChange={(e) => setNewCodingPoints(Number(e.target.value))}
                              min={1}
                              className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">
                            Allowed Programming Languages
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {[
                              { id: 'python', label: 'Python 3' },
                              { id: 'javascript', label: 'JavaScript' },
                              { id: 'cpp', label: 'C++' },
                              { id: 'java', label: 'Java' },
                              { id: 'c', label: 'C' },
                            ].map((lang) => {
                              const isSelected = newCodingAllowedLanguages.includes(lang.id);
                              return (
                                <button
                                  key={lang.id}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      if (newCodingAllowedLanguages.length > 1) {
                                        setNewCodingAllowedLanguages((prev) =>
                                          prev.filter((l) => l !== lang.id)
                                        );
                                      } else {
                                        toast.error('At least one programming language must be allowed');
                                      }
                                    } else {
                                      setNewCodingAllowedLanguages((prev) => [...prev, lang.id]);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-sm'
                                      : 'bg-white/5 text-text-muted border-white/10 hover:border-white/20'
                                  }`}
                                >
                                  {isSelected ? '✓ ' : '+ '}
                                  {lang.label}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[11px] text-text-muted mt-1">
                            Restricts students to solving with only the selected languages in the Arena.
                          </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="light"
                            onPress={() => setShowAddCoding(false)}
                            className="rounded-xl text-xs font-bold text-text-muted hover:text-label-primary"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="solid"
                            color="primary"
                            isLoading={actionLoading}
                            onPress={handleAddCoding}
                            startContent={<CheckCircle2 size={13} />}
                            className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
                          >
                            Save Challenge
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* List of Coding Challenges */}
                  <div className="space-y-3">
                    {adminCoding.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-white/[0.02] border border-separator text-center space-y-2">
                        <Code2 size={28} className="mx-auto text-label-primary /30" />
                        <h4 className="text-sm font-bold text-label-primary ">No Coding Challenges Yet</h4>
                        <p className="text-xs text-text-muted max-w-sm mx-auto">
                          Click "Add Problem" above or upload an Excel file containing coding challenges and test cases.
                        </p>
                      </div>
                    ) : (
                      adminCoding.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-separator transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <h5 className="text-xs font-bold text-label-primary ">{p.title}</h5>
                                <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">
                                  {p.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.difficulty === 'Easy'
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : p.difficulty === 'Hard'
                                    ? 'bg-rose-500/15 text-rose-400'
                                    : 'bg-amber-500/15 text-amber-400'
                                }`}
                              >
                                {p.difficulty}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-label-secondary">
                                {p.points || 30} pts
                              </span>
                              {canManageSelected && (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  isLoading={deletingCodingIndex === idx}
                                  isDisabled={deletingCodingIndex === idx}
                                  onPress={() => handleDeleteCoding(idx)}
                                  className="w-7 h-7 min-w-7 min-h-7 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10"
                                >
                                  <Trash2 size={13} />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted pl-8">
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-medium text-label-secondary">
                              Mode: {p.codingMode === 'ONLY_CODE' ? 'Only Code (Admin Graded)' : p.codingMode === 'TEST_CASES' ? 'Test Cases (Auto-Graded)' : 'Both (Student Choice)'}
                            </span>
                            <span>Test Cases: {(p.testCases || []).length}</span>
                            <span>Allowed: {(p.allowedLanguages || []).join(', ')}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3.5: UI/UX DESIGN CHALLENGE (FIGMA) */}
              {activeTab === 'design' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Header Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
                        <Palette size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-label-primary flex items-center gap-2">
                          <span>UI/UX & Figma Design Challenge Configuration</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            {designChallengesList.length} Problem{designChallengesList.length > 1 ? 's' : ''} Configured
                          </span>
                        </h4>
                        <p className="text-xs text-text-muted mt-0.5">
                          Create multiple problem statements for students. In the assessment arena, students can pick any 1 problem to solve and submit.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="flat"
                        color="secondary"
                        startContent={<Play size={13} className="text-pink-400 fill-pink-400" />}
                        onPress={() => {
                          onClose();
                          navigate(`/events/${event._id}/arena?assessmentId=${selectedAssessment._id}&preview=true`);
                        }}
                        className="rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 text-xs font-semibold border border-pink-500/30"
                      >
                        Preview Test
                      </Button>
                      {canManageSelected && (
                        <Button
                          size="sm"
                          variant="solid"
                          color="secondary"
                          onPress={handleAddDesignChallengeOption}
                          startContent={<Plus size={13} />}
                          className="rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-md shadow-pink-600/30"
                        >
                          Add New Problem Statement
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* MULTI-PROBLEM SELECTOR & MANAGEMENT BAR */}
                  <div className="p-4 rounded-2xl bg-surface-secondary border border-separator space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette size={14} className="text-pink-400" />
                        <h5 className="text-xs font-bold uppercase tracking-wider text-label-primary">
                          Configured Problem Statements ({designChallengesList.length})
                        </h5>
                      </div>
                      <span className="text-[11px] text-label-tertiary">
                        Currently Editing: <strong className="text-pink-400">Problem #{activeDesignOptionIdx + 1}</strong>
                      </span>
                    </div>

                    {/* Problem Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {designChallengesList.map((ch: any, idx: number) => {
                        const isActive = activeDesignOptionIdx === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() => switchActiveChallengeOption(idx)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative group ${
                              isActive
                                ? 'bg-pink-500/15 border-pink-500/50 shadow-sm ring-1 ring-pink-500/30'
                                : 'bg-surface border-separator hover:border-pink-500/30 hover:bg-surface-secondary'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isActive ? 'bg-pink-500/25 text-pink-300' : 'bg-surface-secondary text-label-tertiary'
                              }`}>
                                Problem #{idx + 1}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-mono text-label-secondary font-bold">
                                  {ch.points || 100} pts
                                </span>
                                {designChallengesList.length > 1 && canManageSelected && (
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    onPress={() => handleRemoveDesignChallengeOption(idx)}
                                    className="w-6 h-6 min-w-6 min-h-6 text-label-tertiary hover:text-destructive"
                                    title="Delete this problem"
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <p className="font-bold text-xs text-label-primary truncate">
                                {ch.title || `Problem Statement #${idx + 1}`}
                              </p>
                              <p className="text-[10px] text-label-tertiary line-clamp-1">
                                {ch.description || ch.problemStatement || 'No description provided'}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-label-tertiary pt-2 border-t border-separator/40">
                              <span className="inline-flex items-center gap-1">
                                {ch.designImageUrl || ch.referenceImageUrl ? (
                                  <>
                                    <Check size={11} className="text-emerald-500" />
                                    <span>Image Attached</span>
                                  </>
                                ) : (
                                  'No image'
                                )}
                              </span>
                              <span className={`font-bold ${isActive ? 'text-pink-400' : 'text-label-secondary'}`}>
                                {isActive ? '● Editing' : 'Click to Edit'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <form onSubmit={handleSaveDesignChallenge} className="space-y-6">
                    {/* Active Problem Editor Banner */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-label-primary">
                          Editing Problem #{activeDesignOptionIdx + 1}: <span className="text-pink-400">{designTitle || 'Untitled Challenge'}</span>
                        </h4>
                      </div>
                      <span className="text-[11px] text-label-tertiary">
                        Remember to click Save Challenge below after editing
                      </span>
                    </div>
                    {/* SECTION 1: REFERENCE DESIGN IMAGE UPLOAD */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-separator space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                            <ImageIcon size={14} className="text-pink-400" />
                            <span>Design Reference Mockup Image</span>
                            <span className="text-rose-400">*</span>
                          </label>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Upload a high-resolution design mockup/wireframe that students must replicate or take inspiration from.
                          </p>
                        </div>
                        {designImageUrl && (
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => setPreviewModalImg(designImageUrl)}
                            startContent={<Maximize2 size={12} />}
                            className="rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-label-primary"
                          >
                            Preview Fullscreen
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* Upload Controls */}
                        <div className="space-y-3">
                          <HeroFileInput
                            variant="dropzone"
                            accept="image/*"
                            buttonText="Click or Drag Image Here"
                            description="PNG, JPG, SVG, WEBP up to 10MB"
                            isLoading={uploadingDesignImg}
                            isDisabled={uploadingDesignImg || !canManageSelected}
                            color="secondary"
                            onFilesSelected={(files) => {
                              if (files[0]) handleUploadDesignFile(files[0]);
                            }}
                            showChips={false}
                          />

                          <div className="relative">
                            <span className="text-[11px] text-text-muted block mb-1">Or paste direct image URL:</span>
                            <input
                              type="url"
                              value={designImageUrl}
                              onChange={(e) => setDesignImageUrl(e.target.value)}
                              placeholder="https://res.cloudinary.com/... or image link"
                              disabled={!canManageSelected}
                              className="w-full px-3.5 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-pink-500 outline-none"
                            />
                          </div>
                        </div>

                        {/* Image Preview Box */}
                        <div className="h-52 rounded-2xl border border-separator bg-black/40 overflow-hidden flex items-center justify-center relative group">
                          {designImageUrl ? (
                            <>
                              <img
                                src={designImageUrl}
                                alt="Design Reference"
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="flat"
                                  onPress={() => setPreviewModalImg(designImageUrl)}
                                  startContent={<Maximize2 size={13} />}
                                  className="rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-sm"
                                >
                                  Inspect
                                </Button>
                                {canManageSelected && (
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    color="danger"
                                    onPress={() => setDesignImageUrl('')}
                                    startContent={<Trash2 size={13} />}
                                    className="rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold backdrop-blur-sm"
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-text-muted">
                              <ImageIcon size={32} className="opacity-30" />
                              <span className="text-xs">No reference image uploaded yet</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: CHALLENGE DETAILS & PROBLEM STATEMENT */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-separator space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-label-secondary mb-1.5">
                            Challenge Title <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={designTitle}
                            onChange={(e) => setDesignTitle(e.target.value)}
                            placeholder="e.g. Modern Fintech Banking App Mobile & Desktop UI"
                            disabled={!canManageSelected}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-pink-500 outline-none disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-label-secondary mb-1.5">
                            Total Points
                          </label>
                          <input
                            type="number"
                            min={10}
                            value={designPoints}
                            onChange={(e) => setDesignPoints(Number(e.target.value))}
                            disabled={!canManageSelected}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary font-mono outline-none disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-label-secondary mb-1.5">
                          Brief Overview / Description
                        </label>
                        <input
                          type="text"
                          value={designDesc}
                          onChange={(e) => setDesignDesc(e.target.value)}
                          placeholder="e.g. Design a sleek, high-conversion crypto & banking experience with rich micro-interactions."
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-pink-500 outline-none disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-label-secondary mb-1.5">
                          Problem Statement & Functional Requirements
                        </label>
                        <textarea
                          rows={4}
                          value={designProblem}
                          onChange={(e) => setDesignProblem(e.target.value)}
                          placeholder="Detail the target audience, user personas, key flows (Onboarding, Dashboard, Transactions), design constraints, and expected user journeys..."
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-pink-500 outline-none resize-none disabled:opacity-50 leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-label-secondary mb-1.5 flex items-center justify-between">
                          <span>Reference / Starter Figma URL (Optional)</span>
                          <span className="text-[10px] text-text-muted">Students can duplicate this file</span>
                        </label>
                        <input
                          type="url"
                          value={designRefFigma}
                          onChange={(e) => setDesignRefFigma(e.target.value)}
                          placeholder="https://www.figma.com/file/... (starter kit / UI kit)"
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-pink-500 outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* SECTION 3: DELIVERABLES CHECKLIST */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-separator space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-label-primary ">Expected Deliverables</h5>
                          <p className="text-[11px] text-text-muted">Items students must complete in their Figma file.</p>
                        </div>
                        {canManageSelected && (
                          <Button
                            size="sm"
                            variant="flat"
                            color="secondary"
                            onPress={() => setDesignDeliverables([...designDeliverables, ''])}
                            startContent={<Plus size={12} />}
                            className="rounded-lg text-xs font-bold text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30"
                          >
                            Add Deliverable
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {designDeliverables.map((deliv, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-pink-500/15 text-pink-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={deliv}
                              onChange={(e) => {
                                const copy = [...designDeliverables];
                                copy[idx] = e.target.value;
                                setDesignDeliverables(copy);
                              }}
                              placeholder="e.g. Responsive Desktop layout (1440px) and Mobile layout (390px)"
                              disabled={!canManageSelected}
                              className="flex-1 px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-pink-500 disabled:opacity-50"
                            />
                            {canManageSelected && designDeliverables.length > 1 && (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => setDesignDeliverables(designDeliverables.filter((_, i) => i !== idx))}
                                className="w-7 h-7 min-w-7 min-h-7 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10"
                              >
                                <Trash2 size={13} />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 4: GUIDELINES & EVALUATION CRITERIA */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-separator space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-label-primary ">Guidelines & Evaluation Criteria</h5>
                          <p className="text-[11px] text-text-muted">Rubric used by admins when grading design links.</p>
                        </div>
                        {canManageSelected && (
                          <Button
                            size="sm"
                            variant="flat"
                            color="secondary"
                            onPress={() => setDesignGuidelines([...designGuidelines, ''])}
                            startContent={<Plus size={12} />}
                            className="rounded-lg text-xs font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30"
                          >
                            Add Guideline
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {designGuidelines.map((guide, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={guide}
                              onChange={(e) => {
                                const copy = [...designGuidelines];
                                copy[idx] = e.target.value;
                                setDesignGuidelines(copy);
                              }}
                              placeholder="e.g. Visual Hierarchy, Spacing consistency, WCAG AA Contrast"
                              disabled={!canManageSelected}
                              className="flex-1 px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500 disabled:opacity-50"
                            />
                            {canManageSelected && designGuidelines.length > 1 && (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                onPress={() => setDesignGuidelines(designGuidelines.filter((_, i) => i !== idx))}
                                className="w-7 h-7 min-w-7 min-h-7 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10"
                              >
                                <Trash2 size={13} />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SAVE BUTTONS */}
                    {canManageSelected && (
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-separator pt-4">
                        <Button
                          type="button"
                          size="sm"
                          variant="flat"
                          onPress={handleAddDesignChallengeOption}
                          startContent={<Plus size={14} />}
                          className="rounded-xl bg-surface-secondary border border-separator hover:bg-surface text-label-primary text-xs font-bold"
                        >
                          + Add Another Problem Statement
                        </Button>

                        <Button
                          type="submit"
                          size="sm"
                          variant="solid"
                          color="secondary"
                          isLoading={actionLoading}
                          startContent={<CheckCircle2 size={14} />}
                          className="rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30"
                        >
                          Save Problem Statements ({designChallengesList.length})
                        </Button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* TAB 3.8: TEAMS MANAGEMENT (MANUAL ALLOCATION) */}
              {activeTab === 'teams' && (
                <ArenaTeamsTab
                  eventId={event._id}
                  arenaTeams={arenaTeams}
                  canManageSelected={canManageSelected}
                  actionLoading={actionLoading}
                  createArenaTeam={createArenaTeam}
                  deleteArenaTeam={deleteArenaTeam}
                  assignArenaTeamMembers={assignArenaTeamMembers}
                />
              )}
              {/* TAB 4: SUBMISSIONS & LEADERBOARD */}
              {activeTab === 'submissions' && (
                <div className="space-y-4">
                  {/* View Switcher: Current Round Submissions vs Overall Tournament Leaderboard */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-separator">
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-secondary border border-separator">
                      <Button
                        size="sm"
                        variant={submissionsSubTab === 'round' ? 'solid' : 'light'}
                        color={submissionsSubTab === 'round' ? 'primary' : 'default'}
                        onPress={() => setSubmissionsSubTab('round')}
                        className={`px-3 py-1.5 h-8 rounded-lg text-xs font-bold cursor-pointer ${
                          submissionsSubTab === 'round'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-label-secondary hover:text-label-primary'
                        }`}
                      >
                        Round Submissions ({adminSubmissions.length})
                      </Button>
                      <Button
                        size="sm"
                        variant={submissionsSubTab === 'leaderboard' ? 'solid' : 'light'}
                        color={submissionsSubTab === 'leaderboard' ? 'primary' : 'default'}
                        startContent={<Trophy size={13} />}
                        onPress={() => {
                          setSubmissionsSubTab('leaderboard');
                          setLoadingLeaderboard(true);
                          fetchAdminOverallLeaderboard(event._id).finally(() => setLoadingLeaderboard(false));
                        }}
                        className={`px-3 py-1.5 h-8 rounded-lg text-xs font-bold cursor-pointer ${
                          submissionsSubTab === 'leaderboard'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-label-secondary hover:text-label-primary'
                        }`}
                      >
                        Tournament Leaderboard (All Rounds)
                      </Button>
                    </div>

                    {submissionsSubTab === 'leaderboard' && (overallLeaderboard?.length > 0) && (
                      <Button
                        size="sm"
                        variant="bordered"
                        startContent={<Download size={13} />}
                        onPress={handleExportTournamentLeaderboard}
                        className="px-3 py-1.5 h-8 rounded-xl text-xs font-bold border-separator bg-surface hover:bg-surface-secondary text-label-primary cursor-pointer"
                      >
                        Export Excel
                      </Button>
                    )}
                  </div>

                  {submissionsSubTab === 'leaderboard' ? (
                    /* OVERALL TOURNAMENT LEADERBOARD VIEW */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-label-primary flex items-center gap-2">
                            <Trophy size={16} className="text-amber-400" />
                            <span>Official Tournament Leaderboard</span>
                          </h4>
                          <p className="text-xs text-label-secondary">
                            Scores tracked per round separately and aggregated total points across all {assessments.length} rounds.
                          </p>
                        </div>
                      </div>

                      {loadingLeaderboard ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                          <Loader2 size={28} className="animate-spin text-primary" />
                          <p className="text-xs text-label-secondary">Calculating tournament standings...</p>
                        </div>
                      ) : (!overallLeaderboard || overallLeaderboard.length === 0) ? (
                        <div className="p-8 rounded-2xl bg-surface-secondary border border-separator text-center space-y-2">
                          <Trophy size={28} className="mx-auto text-label-tertiary" />
                          <h4 className="text-sm font-bold text-label-primary">No Tournament Results Yet</h4>
                          <p className="text-xs text-label-secondary">
                            Student scores will appear here across all rounds once participants begin submitting.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-separator overflow-x-auto bg-surface-secondary/20">
                          <table className="w-full text-left text-xs min-w-[700px]">
                            <thead className="bg-surface-secondary border-b border-separator text-label-secondary uppercase text-[10px]">
                              <tr>
                                <th className="p-3">Rank & Student</th>
                                <th className="p-3">Team</th>
                                {(overallLeaderboardAssessments || assessments || []).map((asm: any, aIdx: number) => (
                                  <th key={asm._id || aIdx} className="p-3 text-center">
                                    Round {aIdx + 1} ({asm.type})
                                  </th>
                                ))}
                                <th className="p-3 text-center font-bold text-primary">Total Points</th>
                                <th className="p-3 text-center">Rounds Done</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-separator/40">
                              {overallLeaderboard.map((entry: any, eIdx: number) => (
                                <tr key={eIdx} className="hover:bg-surface-secondary/40 transition-colors">
                                  <td className="p-3">
                                    <div className="flex items-center gap-2.5">
                                      <span className={`font-mono font-bold w-5 ${
                                        entry.rank === 1 ? 'text-amber-400 font-extrabold' :
                                        entry.rank === 2 ? 'text-slate-300 font-bold' :
                                        entry.rank === 3 ? 'text-amber-600 font-bold' : 'text-label-tertiary'
                                      }`}>
                                        #{entry.rank}
                                      </span>
                                      <div className="w-7 h-7 rounded-full overflow-hidden bg-surface border border-separator shrink-0">
                                        <img
                                          src={entry.student?.profilePicUrl || `https://ui-avatars.com/api/?name=${entry.student?.name}&size=60`}
                                          alt={entry.student?.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-semibold text-xs text-label-primary truncate">{entry.student?.name}</p>
                                        <p className="text-[10px] text-label-tertiary truncate">{entry.student?.rollNo || entry.student?.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-label-secondary">
                                    {entry.teamName || <span className="text-label-tertiary italic">Individual</span>}
                                  </td>
                                  {(overallLeaderboardAssessments || assessments || []).map((asm: any) => {
                                    const roundData = entry.roundScores?.[asm._id];
                                    return (
                                      <td key={asm._id} className="p-3 text-center">
                                        {roundData?.score !== undefined ? (
                                          <div className="space-y-0.5">
                                            <span className="font-mono font-bold text-xs text-label-primary">
                                              {roundData.score}
                                            </span>
                                            <span className="text-[10px] text-label-tertiary block font-mono">
                                              /{roundData.maxScore || asm.totalPoints || 100}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-label-tertiary">—</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="p-3 text-center">
                                    <span className="px-2.5 whitespace-nowrap py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-mono font-bold text-xs">
                                      {entry.totalScore || 0} pts
                                    </span>
                                  </td>
                                  <td className="p-3 text-center text-label-secondary font-mono text-[11px]">
                                    {entry.roundsCompleted || 0} / {(overallLeaderboardAssessments || assessments || []).length}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* CURRENT ROUND SUBMISSIONS */
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-label-primary">Round Submissions</h4>
                          <p className="text-xs text-label-secondary">
                            Total {adminSubmissions.length} submissions for "{selectedAssessment.title}"
                          </p>
                        </div>
                        {canManageSelected && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="flat"
                              color="secondary"
                              onPress={() => setIsManualModalOpen(true)}
                              startContent={<Plus size={13} />}
                              className="h-8 px-3 rounded-xl text-xs font-bold bg-purple-500/15 border border-purple-500/30 text-purple-400 hover:bg-purple-500/25 cursor-pointer"
                              title="Enter Single Student Paper Test Score"
                            >
                              + Paper Score
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="secondary"
                              onPress={() => setIsBulkPaperModalOpen(true)}
                              startContent={<FileSpreadsheet size={13} />}
                              className="h-8 px-3 rounded-xl text-xs font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 cursor-pointer"
                              title="Bulk Upload Paper / Offline Test Scores via Excel/CSV"
                            >
                              Bulk Paper Scores
                            </Button>
                            <Button
                              size="sm"
                              variant="bordered"
                              onPress={handleExportSubmissions}
                              isDisabled={adminSubmissions.length === 0 || isExportingSubmissions}
                              isLoading={isExportingSubmissions}
                              startContent={!isExportingSubmissions ? <Download size={13} /> : undefined}
                              className="h-8 px-3 rounded-xl text-xs font-bold bg-surface border-separator text-label-secondary hover:text-label-primary hover:bg-surface-secondary cursor-pointer"
                              title="Download Submissions List (.xlsx)"
                            >
                              {isExportingSubmissions ? 'Exporting...' : 'Download List'}
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              color="warning"
                              onPress={() => {
                                setIsGraceAllModalOpen(true);
                                setGraceAllMinutes(10);
                              }}
                              startContent={<Clock size={13} />}
                              className="h-8 px-3 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-500 hover:bg-amber-500/25 cursor-pointer"
                            >
                              Extend Time for All (+Grace)
                            </Button>
                            <form onSubmit={handleQuickUnblock} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={quickUnblockQuery}
                                onChange={(e) => setQuickUnblockQuery(e.target.value)}
                                placeholder="Unblock Roll No / Email..."
                                className="px-3 py-1.5 rounded-xl bg-surface border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500 w-44 sm:w-56"
                              />
                              <Button
                                type="submit"
                                size="sm"
                                color="success"
                                variant="solid"
                                isLoading={isQuickUnblocking}
                                isDisabled={!quickUnblockQuery.trim() || isQuickUnblocking}
                                className="h-8 px-3 rounded-xl text-xs font-bold bg-emerald-600 text-white cursor-pointer shrink-0"
                              >
                                Unblock
                              </Button>
                            </form>
                          </div>
                        )}
                      </div>

                      {/* Top Rank Cutoff (Next Round) Rule Banner */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                            <Trophy size={16} className="text-amber-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-label-primary flex items-center gap-1.5 flex-wrap">
                              <span>Next Round Shortlist Rule:</span>
                              <span className="text-purple-400 font-mono font-bold">
                                {effectiveCutoffRank > 0
                                  ? `Top ${effectiveCutoffRank} Candidates Qualify`
                                  : 'All Candidates Qualify (No Cutoff Set)'}
                              </span>
                              {nextAssessment && (
                                <span className="text-[11px] text-label-tertiary">
                                  for Round {selectedAssessmentIndex + 2} ("{nextAssessment.title}")
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-label-secondary">
                              Shortlisting is strictly based on score (highest first). When candidates have the same score, qualification rank is determined alphabetically by student name (A-Z).
                            </p>
                          </div>
                        </div>

                        {canManageSelected && (
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <label className="text-[11px] font-bold text-label-secondary whitespace-nowrap">
                              Cutoff Rank:
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={selectedAssessment?.qualificationCutoffRank ?? 0}
                              onChange={async (e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                if (!event?._id || !selectedAssessmentId) return;
                                try {
                                  await updateAssessment(event._id, selectedAssessmentId, {
                                    qualificationCutoffRank: val,
                                  });
                                  toast.success(`Updated Top Rank Cutoff to ${val || 'All Qualify'}`);
                                } catch {
                                  toast.error('Failed to update cutoff rank');
                                }
                              }}
                              className="w-20 px-2.5 py-1 rounded-xl bg-surface border border-purple-500/40 text-xs font-mono font-bold text-center text-label-primary outline-none focus:border-purple-400"
                              title="Set Top Rank Cutoff for Next Round"
                            />
                          </div>
                        )}
                      </div>

                      {/* Submissions Search & Filter Field */}
                      {adminSubmissions.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-surface-secondary/40 border border-separator">
                          <div className="relative flex-1">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" />
                            <input
                              type="text"
                              value={submissionSearch}
                              onChange={(e) => setSubmissionSearch(e.target.value)}
                              placeholder="Search submissions by student name, roll number, email, department, or 'paper'..."
                              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-surface border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500 transition-colors"
                            />
                            {submissionSearch && (
                              <button
                                type="button"
                                onClick={() => setSubmissionSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary p-0.5 rounded cursor-pointer"
                                title="Clear search"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-label-secondary shrink-0 px-1">
                            <span>
                              Showing <strong className="text-label-primary font-mono">{filteredSubmissions.length}</strong> of{' '}
                              <span className="font-mono">{adminSubmissions.length}</span>
                            </span>
                            {submissionSearch && (
                              <button
                                type="button"
                                onClick={() => setSubmissionSearch('')}
                                className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                  {adminSubmissions.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-surface-secondary border border-separator text-center space-y-2">
                      <Award size={28} className="mx-auto text-label-tertiary" />
                      <h4 className="text-sm font-bold text-label-primary">No Submissions Yet</h4>
                      <p className="text-xs text-label-secondary">
                        Submissions from students who complete this assessment will appear here with complete details.
                      </p>
                    </div>
                  ) : filteredSubmissions.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-surface-secondary border border-separator text-center space-y-2">
                      <Search size={28} className="mx-auto text-label-tertiary" />
                      <h4 className="text-sm font-bold text-label-primary">No Submissions Found</h4>
                      <p className="text-xs text-label-secondary">
                        No submissions matched your search "{submissionSearch}". Try searching with a different name, roll no, or email.
                      </p>
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => setSubmissionSearch('')}
                        className="text-accent text-xs font-bold cursor-pointer"
                      >
                        Clear Search
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Card List (< md viewports) */}
                      <div className="block md:hidden space-y-3">
                        {filteredSubmissions.map((sub, idx) => {
                          const subRank = submissionRankMap.get(sub._id?.toString() || sub.id) || (idx + 1);
                          const isShortlisted = effectiveCutoffRank > 0 ? subRank <= effectiveCutoffRank : true;
                          return (
                          <div
                            key={sub._id || idx}
                            className="p-3.5 rounded-2xl bg-surface-secondary border border-separator space-y-3 shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                                  subRank === 1 ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' :
                                  subRank === 2 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                                  subRank === 3 ? 'bg-amber-600/20 text-amber-600 border border-amber-600/30' :
                                  'bg-accent/10 text-accent'
                                }`}>
                                  #{subRank}
                                </span>
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface border border-separator shrink-0">
                                  <img
                                    src={
                                      sub.userId?.profilePicUrl ||
                                      `https://ui-avatars.com/api/?name=${sub.userId?.name}&background=1D1D1F&color=fff&size=60`
                                    }
                                    alt={sub.userId?.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-semibold text-xs text-label-primary truncate">
                                      {sub.userId?.name || 'Student'}
                                    </p>
                                    {sub.isManualSubmission && (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
                                        Paper
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-label-tertiary truncate">
                                    {sub.userId?.rollNo || sub.userId?.email}
                                  </p>
                                </div>
                              </div>
                              {effectiveCutoffRank > 0 ? (
                                isShortlisted ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                    <CheckCircle2 size={10} />
                                    <span>Shortlisted</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                    <X size={10} />
                                    <span>Not Shortlisted</span>
                                  </span>
                                )
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                  Qualified
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 p-2 bg-surface rounded-xl border border-separator/60 text-center">
                              <div>
                                <span className="text-[9px] text-label-tertiary uppercase font-bold block">Score</span>
                                <span className="font-mono text-xs font-bold text-label-primary">
                                  {sub.totalScore}/{sub.maxPossibleScore}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] text-label-tertiary uppercase font-bold block">Percentage</span>
                                <span className="font-mono text-xs font-bold text-label-primary">{sub.scorePercentage}%</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-label-tertiary uppercase font-bold block">Residence</span>
                                <span className="text-[10px] font-semibold text-accent truncate block mt-0.5">
                                  {sub.userId?.residenceType || '—'}
                                </span>
                              </div>
                            </div>

                            {/* Figma / Work status */}
                            {sub.designSubmission?.figmaLink && (
                              <div className="p-2.5 rounded-xl bg-pink-500/5 border border-pink-500/20 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <Link
                                    target="_blank" rel="noopener noreferrer"
                                    href={sub.designSubmission.figmaLink}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-500 hover:text-pink-400 underline underline-offset-2"
                                  >
                                    <Palette size={11} />
                                    <span>Figma File</span>
                                    <ExternalLink size={10} />
                                  </Link>
                                  <Button
                                    size="sm"
                                    variant="bordered"
                                    onPress={() => setPreviewFigmaUrl(sub.designSubmission.figmaLink)}
                                    className="px-2 h-6 min-h-0 rounded-lg text-[10px] bg-surface border-separator text-label-primary font-medium cursor-pointer"
                                  >
                                    Preview
                                  </Button>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  {sub.designSubmission.isEvaluated ? (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                      <CheckCircle size={10} />
                                      <span>Graded: {sub.designSubmission.pointsEarned} pts</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-amber-500 font-semibold">
                                      Pending Review
                                    </span>
                                  )}
                                  {canManageSelected && (
                                    <Button
                                      size="sm"
                                      variant="solid"
                                      color="secondary"
                                      startContent={<Award size={11} />}
                                      onPress={() => {
                                        setEvaluatingSub(sub);
                                        setEvalPoints(sub.designSubmission?.pointsEarned || 0);
                                        setEvalFeedback(sub.designSubmission?.feedback || '');
                                      }}
                                      className="px-3 h-7 min-h-0 rounded-full text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white shadow-xs cursor-pointer"
                                    >
                                      {sub.designSubmission?.isEvaluated ? 'Re-grade' : 'Grade'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-separator/40">
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="bordered"
                                  onPress={() => setInspectingSub(sub)}
                                  className="h-7 px-2 rounded-lg text-xs bg-surface border-separator text-label-secondary hover:text-accent cursor-pointer"
                                  startContent={<Eye size={11} />}
                                >
                                  View
                                </Button>
                                {canManageSelected && (
                                  <Button
                                    size="sm"
                                    variant="bordered"
                                    onPress={() => {
                                      setGraceModalSub(sub);
                                      setGraceMinutesInput(10);
                                      setGraceClearAnswers(false);
                                    }}
                                    className="h-7 px-2 rounded-lg text-xs bg-amber-500/10 border-amber-500/30 text-amber-500 font-semibold cursor-pointer"
                                    startContent={<Clock size={11} />}
                                  >
                                    Grace
                                  </Button>
                                )}
                                {canManageSelected && sub.isBlocked && (
                                  <Button
                                    size="sm"
                                    color="success"
                                    variant="solid"
                                    isLoading={actionInProgressId === (sub.userId?._id || sub.userId?.id || sub.userId)}
                                    onPress={() => handleUnblockStudent(sub.userId?._id || sub.userId?.id || sub.userId, sub.userId?.name)}
                                    className="h-7 px-2.5 rounded-lg text-xs font-bold bg-emerald-600 text-white cursor-pointer"
                                  >
                                    Unblock
                                  </Button>
                                )}
                              </div>
                              <span className="text-[10px] text-label-tertiary">
                                {sub.submittedAt
                                  ? new Date(sub.submittedAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'In Progress'}
                              </span>
                            </div>
                          </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table (md+) */}
                      <div className="hidden md:block rounded-xl border border-separator overflow-hidden bg-surface-secondary/20">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-surface-secondary border-b border-separator text-label-secondary uppercase text-[10px]">
                            <tr>
                              <th className="p-3">Rank & Student</th>
                              <th className="p-3">Residence</th>
                              <th className="p-3">Score</th>
                              <th className="p-3">Percentage</th>
                              <th className="p-3">Next Round Status</th>
                              <th className="p-3">Figma / Work</th>
                              <th className="p-3">Submitted At</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-separator/40">
                            {filteredSubmissions.map((sub, idx) => {
                              const subRank = submissionRankMap.get(sub._id?.toString() || sub.id) || (idx + 1);
                              const isShortlisted = effectiveCutoffRank > 0 ? subRank <= effectiveCutoffRank : true;
                              return (
                              <tr key={sub._id || idx} className="hover:bg-surface-secondary/40 transition-colors">
                                <td className="p-3">
                                  <div className="flex items-center gap-2.5">
                                    <span className={`font-mono font-bold w-6 ${
                                      subRank === 1 ? 'text-amber-400 font-extrabold' :
                                      subRank === 2 ? 'text-slate-300 font-bold' :
                                      subRank === 3 ? 'text-amber-600 font-bold' :
                                      'text-label-tertiary'
                                    }`}>
                                      #{subRank}
                                    </span>
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-surface border border-separator shrink-0">
                                      <img
                                        src={
                                          sub.userId?.profilePicUrl ||
                                          `https://ui-avatars.com/api/?name=${sub.userId?.name}&background=1D1D1F&color=fff&size=60`
                                        }
                                        alt={sub.userId?.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <p className="font-semibold text-label-primary">{sub.userId?.name || 'Student'}</p>
                                        {sub.isManualSubmission && (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
                                            Paper
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-label-tertiary">
                                        {sub.userId?.rollNo || sub.userId?.email}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3">
                                  {sub.userId?.residenceType ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface border border-separator text-accent">
                                      {sub.userId.residenceType === 'Hosteller' ? (
                                        <Building size={10} />
                                      ) : (
                                        <Bus size={10} />
                                      )}
                                      <span>{sub.userId.residenceType}</span>
                                    </span>
                                  ) : (
                                    <span className="text-label-tertiary text-[10px]">—</span>
                                  )}
                                </td>
                                <td className="p-3 font-mono font-bold text-label-primary">
                                  {sub.totalScore} / {sub.maxPossibleScore}
                                </td>
                                <td className="p-3 font-mono text-label-secondary">{sub.scorePercentage}%</td>
                                <td className="p-3">
                                  {effectiveCutoffRank > 0 ? (
                                    isShortlisted ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                        <CheckCircle2 size={11} />
                                        <span>Shortlisted (Top {effectiveCutoffRank})</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                        <X size={11} />
                                        <span>Not Shortlisted</span>
                                      </span>
                                    )
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                      <span>Qualified (All)</span>
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {sub.designSubmission?.figmaLink ? (
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1.5">
                                        <Link
                                          target="_blank" rel="noopener noreferrer"
                                          href={sub.designSubmission.figmaLink}
                                          className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-500 hover:text-pink-400 underline underline-offset-2"
                                        >
                                          <Palette size={11} />
                                          <span>Figma File</span>
                                          <ExternalLink size={10} />
                                        </Link>
                                        <Button
                                          size="sm"
                                          variant="bordered"
                                          onPress={() => setPreviewFigmaUrl(sub.designSubmission.figmaLink)}
                                          className="px-1.5 h-5 min-h-0 rounded text-[10px] bg-surface border-separator text-label-primary font-medium cursor-pointer"
                                        >
                                          Embed
                                        </Button>
                                      </div>
                                      {sub.designSubmission.isEvaluated ? (
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                          <CheckCircle size={10} />
                                          <span>Graded: {sub.designSubmission.pointsEarned} pts</span>
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-amber-500 font-semibold">
                                          Pending Review
                                        </span>
                                      )}
                                      {sub.designSubmission.notes && (
                                        <p className="text-[10px] text-label-tertiary italic truncate max-w-[150px]">
                                          "{sub.designSubmission.notes}"
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-label-tertiary text-[10px]">—</span>
                                  )}
                                </td>
                                <td className="p-3 text-[11px] text-label-tertiary">
                                  {sub.submittedAt
                                    ? new Date(sub.submittedAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : 'In Progress'}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Inspect Details Button */}
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="bordered"
                                      onPress={() => setInspectingSub(sub)}
                                      className="w-8 h-8 min-w-unit-8 rounded-lg bg-surface border-separator hover:bg-accent/10 hover:border-accent/40 text-label-secondary hover:text-accent cursor-pointer"
                                      title="View Detailed Submission"
                                    >
                                      <Eye size={13} />
                                    </Button>

                                    {/* UI/UX Grade Button */}
                                    {sub.designSubmission?.figmaLink && canManageSelected && (
                                      <Button
                                        size="sm"
                                        variant="flat"
                                        color="secondary"
                                        startContent={<Award size={11} />}
                                        onPress={() => {
                                          setEvaluatingSub(sub);
                                          setEvalPoints(sub.designSubmission?.pointsEarned || 0);
                                          setEvalFeedback(sub.designSubmission?.feedback || '');
                                        }}
                                        className="px-2.5 h-8 rounded-lg text-xs font-bold bg-pink-500/15 hover:bg-pink-500/25 text-pink-500 border border-pink-500/30 cursor-pointer"
                                        title="Grade UI/UX Design Challenge"
                                      >
                                        {sub.designSubmission?.isEvaluated ? 'Re-grade' : 'Grade'}
                                      </Button>
                                    )}

                                    {/* Grant Grace Time (Keeps Answers) */}
                                    {canManageSelected && (
                                      <Button
                                        size="sm"
                                        variant="bordered"
                                        isDisabled={actionInProgressId === sub._id}
                                        onPress={() => {
                                          setGraceModalSub(sub);
                                          setGraceMinutesInput(10);
                                          setGraceClearAnswers(false);
                                        }}
                                        className="h-8 px-2.5 rounded-lg bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-500 font-semibold text-xs cursor-pointer"
                                        title="Grant Grace Time & Resume (Keeps previous answers)"
                                        startContent={<Clock size={12} />}
                                      >
                                        Grace Time
                                      </Button>
                                    )}

                                    {/* Reset / Allow Re-attempt */}
                                    {canManageSelected && (
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="bordered"
                                        isDisabled={actionInProgressId === sub._id}
                                        isLoading={actionInProgressId === sub._id}
                                        onPress={() => handleResetSubmission(sub)}
                                        className="w-8 h-8 min-w-unit-8 rounded-lg bg-surface border-separator hover:bg-amber-500/10 hover:border-amber-500/40 text-label-secondary hover:text-amber-500 cursor-pointer"
                                        title="Reset Attempt (Allow Re-attempt)"
                                      >
                                        <RotateCcw size={13} color='#fff' />
                                      </Button>
                                    )}

                                    {/* Unblock Integrity */}
                                    {canManageSelected && (
                                      <Button
                                        size="sm"
                                        variant={sub.isBlocked ? "solid" : "bordered"}
                                        color={sub.isBlocked ? "success" : "default"}
                                        isIconOnly={!sub.isBlocked}
                                        isDisabled={actionInProgressId === (sub.userId?._id || sub.userId?.id || sub.userId)}
                                        isLoading={actionInProgressId === (sub.userId?._id || sub.userId?.id || sub.userId)}
                                        onPress={() => handleUnblockStudent(sub.userId?._id || sub.userId?.id || sub.userId, sub.userId?.name)}
                                        className={
                                          sub.isBlocked
                                            ? "h-8 px-2.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-md shadow-emerald-600/30 cursor-pointer"
                                            : "w-8 h-8 min-w-unit-8 rounded-lg bg-surface border-separator hover:bg-emerald-500/10 hover:border-emerald-500/40 text-label-secondary hover:text-emerald-500 cursor-pointer"
                                        }
                                        title={sub.isBlocked ? "Student is blocked! Click to unblock" : "Unblock Student for this Event"}
                                        startContent={<ShieldCheck size={13} />}
                                      >
                                        {sub.isBlocked ? "Unblock" : null}
                                      </Button>
                                    )}

                                    {/* Delete Record */}
                                    {canManageSelected && (
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="bordered"
                                        color="danger"
                                        isDisabled={actionInProgressId === sub._id}
                                        isLoading={actionInProgressId === sub._id}
                                        onPress={() => handleDeleteSubmission(sub)}
                                        className="w-8 h-8 min-w-unit-8 rounded-lg bg-surface border-separator hover:bg-destructive/10 hover:border-destructive/40 text-label-secondary hover:text-destructive cursor-pointer"
                                        title="Delete Submission Record"
                                      >
                                        <Trash2 size={13} />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: BLOCKED STUDENTS */}
              {activeTab === 'blocked' && (
                <div className="space-y-4">
                  <BlockedStudentsTab
                    eventId={event._id}
                    eventTitle={event.title}
                    onStudentUnblocked={() => {
                      if (selectedAssessment?._id) {
                        fetchAdminAssessmentSubmissions(event._id, selectedAssessment._id);
                      }
                      fetchBlockedCount();
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <Layers size={36} className="text-purple-400/50" />
            <h3 className="text-base font-bold text-label-primary ">No Assessments Created Yet</h3>
            <p className="text-xs text-text-muted max-w-md">
              Create the first assessment for this Event Arena. You can create as many assessments as needed
              and assign admins to curate each one.
            </p>
            <Button
              size="sm"
              variant="solid"
              color="secondary"
              startContent={<Plus size={14} />}
              onPress={() => setIsCreatingNew(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              Create First Assessment
            </Button>
          </div>
        )}

        {/* BULK UPLOAD SUB-MODAL */}
        <AnimatePresence>
          {bulkModalType && (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-surface border border-separator p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-label-primary flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-purple-400" />
                    <span>Upload {bulkModalType.toUpperCase()} Questions</span>
                  </h3>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => {
                      setBulkModalType(null);
                      setBulkFile(null);
                    }}
                    className="text-text-muted hover:text-label-primary min-w-unit-8 w-8 h-8 rounded-lg cursor-pointer"
                  >
                    <X size={16} />
                  </Button>
                </div>

                <p className="text-xs text-text-muted">
                  Upload an Excel (.xlsx) or JSON file formatted according to the sample template.
                  {bulkModalType === 'coding' && (
                    <span>
                      {' '}You can restrict coding challenges to specific programming languages using the{' '}
                      <span className="font-semibold text-purple-300">Allowed Languages</span> column (e.g. "python, java" or "c, cpp").
                    </span>
                  )}
                  {' '}Questions will be added directly to{' '}
                  <span className="font-semibold text-label-primary ">"{selectedAssessment?.title}"</span>.
                </p>

                <HeroFileInput
                  variant="dropzone"
                  accept=".xlsx,.xls,.json"
                  buttonText="Browse file from device or drag and drop"
                  description="Supports Excel (.xlsx, .xls) and JSON"
                  onFilesSelected={(files) => {
                    setBulkFile(files[0] || null);
                  }}
                  color="secondary"
                  showChips={true}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => {
                      setBulkModalType(null);
                      setBulkFile(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-text-muted hover:text-label-primary cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="solid"
                    color="secondary"
                    isDisabled={!bulkFile || actionLoading}
                    isLoading={actionLoading}
                    startContent={!actionLoading ? <Upload size={13} /> : undefined}
                    onPress={handleBulkUpload}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 cursor-pointer"
                  >
                    Upload Now
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* DESIGN IMAGE FULLSCREEN LIGHTBOX */}
        <AnimatePresence>
          {previewModalImg && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center"
              >
                <div className="w-full flex justify-between items-center pb-3 text-label-primary ">
                  <span className="text-xs font-bold text-label-secondary">Reference Design Mockup</span>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => setPreviewModalImg(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white min-w-unit-8 w-8 h-8 cursor-pointer"
                  >
                    <X size={18} />
                  </Button>
                </div>
                <div className="overflow-auto max-h-[82vh] rounded-2xl border border-separator bg-black/60 p-2">
                  <img
                    src={previewModalImg}
                    alt="Design Reference Full"
                    className="max-h-[80vh] w-auto object-contain mx-auto rounded-xl shadow-2xl"
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* FIGMA EMBED PREVIEW MODAL */}
        <AnimatePresence>
          {previewFigmaUrl && (
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full sm:max-w-5xl h-[82vh] rounded-t-3xl sm:rounded-2xl bg-surface border border-separator shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="px-6 py-3.5 border-b border-separator flex items-center justify-between shrink-0 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                      <Palette size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-label-primary ">Interactive Figma Prototype Embed</h4>
                      <Link
                        target="_blank" rel="noopener noreferrer"
                        href={previewFigmaUrl}
                        className="text-[11px] text-pink-400 hover:text-pink-300 underline inline-flex items-center gap-1"
                      >
                        <span>Open directly in Figma</span>
                        <ExternalLink size={10} />
                      </Link>
                    </div>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => setPreviewFigmaUrl(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white min-w-unit-8 w-8 h-8 cursor-pointer"
                  >
                    <X size={16} />
                  </Button>
                </div>
                <div className="flex-1 bg-black/50 p-2">
                  <iframe
                    src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(previewFigmaUrl)}`}
                    className="w-full h-full border-0 rounded-xl"
                    allowFullScreen
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        
        {/* SUBMISSION DETAIL INSPECTION MODAL */}
        <AnimatePresence>
          {inspectingSub && (
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

                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setInspectingSub(null)}
                    className="p-2 rounded-xl text-label-tertiary hover:text-label-primary hover:bg-surface-secondary min-w-unit-8 w-8 h-8 cursor-pointer"
                  >
                    <X size={16} />
                  </Button>
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
                          target="_blank" rel="noopener noreferrer"
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

                  {/* MCQ Answers Tracking & Question Breakdown Section (Shows All Questions) */}
                  {(() => {
                    const allMcqs = (adminMcqs && adminMcqs.length > 0)
                      ? adminMcqs
                      : (selectedAssessment?.questions?.mcqs || []);
                    if (allMcqs.length === 0) return null;

                    const answeredCount = allMcqs.filter((q: any) => {
                      const qId = q._id?.toString() || q.id;
                      const ans = inspectingSub.mcqAnswers?.find((a: any) => a.questionId?.toString() === qId);
                      return ans !== undefined && ans.selectedOptionIndex !== undefined && ans.selectedOptionIndex !== -1;
                    }).length;
                    const unansweredCount = allMcqs.length - answeredCount;

                    return (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-separator/60">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-label-secondary flex items-center gap-1.5">
                            <HelpCircle size={14} className="text-accent" />
                            <span>All MCQ Questions ({allMcqs.length})</span>
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] font-bold">
                            <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              {answeredCount} Answered
                            </span>
                            {unansweredCount > 0 && (
                              <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                {unansweredCount} Not Answered
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

                                {/* Explanation if available */}
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
                    );
                  })()}

                  {/* Coding Submissions Section (Shows All Challenges) */}
                  {(() => {
                    const allCoding = (adminCoding && adminCoding.length > 0)
                      ? adminCoding
                      : (selectedAssessment?.questions?.coding || []);
                    if (allCoding.length === 0) return null;

                    const attemptedCount = allCoding.filter((prob: any) => {
                      const probId = prob._id?.toString() || prob.id;
                      const cs = inspectingSub.codingSubmissions?.find((c: any) => c.problemId?.toString() === probId);
                      return cs && cs.code && cs.code.trim().length > 0;
                    }).length;
                    const unattemptedCount = allCoding.length - attemptedCount;

                    return (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-separator/60">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-label-secondary flex items-center gap-1.5">
                            <Code2 size={14} className="text-purple-400" />
                            <span>All Coding Challenges ({allCoding.length})</span>
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] font-bold">
                            <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              {attemptedCount} Attempted
                            </span>
                            {unattemptedCount > 0 && (
                              <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                {unattemptedCount} Not Answered
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

                                {/* Admin Grading Form (for Only Code or manual override) */}
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
                                      onPress={() => handleGradeCode(inspectingSub._id, cs.problemId)}
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
                    );
                  })()}
                </div>

                {/* Modal Footer Quick Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-separator shrink-0">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="solid"
                      color="warning"
                      startContent={<Clock size={13} />}
                      onPress={() => {
                        setGraceModalSub(inspectingSub);
                        setGraceMinutesInput(10);
                        setGraceClearAnswers(false);
                      }}
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
                      onPress={() => handleResetSubmission(inspectingSub)}
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
                      onPress={() => handleUnblockStudent(inspectingSub.userId?._id || inspectingSub.userId?.id || inspectingSub.userId, inspectingSub.userId?.name)}
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
                      onPress={() => handleDeleteSubmission(inspectingSub)}
                      className="px-3 py-2 rounded-xl bg-destructive/15 hover:bg-destructive/25 text-destructive border border-destructive/30 text-xs font-bold cursor-pointer"
                    >
                      Delete
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="bordered"
                    onPress={() => setInspectingSub(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border-separator bg-surface hover:bg-surface-secondary text-label-primary cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* DESIGN SUBMISSION EVALUATION DRAWER / MODAL */}
        <AnimatePresence>
          {evaluatingSub && (
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-surface border border-separator p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-separator pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                      <Award size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-label-primary ">Evaluate Figma Design</h4>
                      <p className="text-xs text-text-muted">
                        Student: <span className="text-label-primary font-semibold">{evaluatingSub.userId?.name}</span> ({evaluatingSub.userId?.rollNo || evaluatingSub.userId?.email})
                      </p>
                    </div>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => setEvaluatingSub(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white min-w-unit-8 w-8 h-8 cursor-pointer"
                  >
                    <X size={16} />
                  </Button>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Submitted Figma Link:</span>
                    <Link
                      target="_blank" rel="noopener noreferrer"
                      href={evaluatingSub.designSubmission?.figmaLink}
                      className="text-pink-400 hover:text-pink-300 font-mono underline inline-flex items-center gap-1"
                    >
                      <span>Open Figma</span>
                      <ExternalLink size={11} />
                    </Link>
                  </div>
                  {evaluatingSub.designSubmission?.notes && (
                    <div className="pt-1 text-xs">
                      <span className="text-text-muted block text-[10px] uppercase font-bold tracking-wider mb-0.5">Student Notes:</span>
                      <p className="text-label-secondary bg-white/5 p-2 rounded-lg text-[11px] leading-relaxed">
                        {evaluatingSub.designSubmission.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-label-primary ">Awarded Points</label>
                      <span className="text-xs font-mono font-bold text-pink-400">
                        {evalPoints} / {selectedAssessment?.totalPoints || 100} pts
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={selectedAssessment?.totalPoints || 100}
                      value={evalPoints}
                      onChange={(e) => setEvalPoints(Number(e.target.value))}
                      className="w-full accent-pink-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted font-mono mt-1">
                      <span>0 pts</span>
                      <span>{Math.round((selectedAssessment?.totalPoints || 100) / 2)} pts</span>
                      <span>{selectedAssessment?.totalPoints || 100} pts</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-label-primary mb-1.5">
                      Reviewer Feedback / Comments
                    </label>
                    <textarea
                      rows={3}
                      value={evalFeedback}
                      onChange={(e) => setEvalFeedback(e.target.value)}
                      placeholder="e.g. Excellent layout spacing, responsive auto-layout implemented cleanly. Typography hierarchy is on point!"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-pink-500 outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-separator">
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => setEvaluatingSub(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-label-secondary hover:bg-white/10 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="solid"
                    color="secondary"
                    isDisabled={actionLoading}
                    isLoading={actionLoading}
                    startContent={!actionLoading ? <CheckCircle2 size={13} /> : undefined}
                    onPress={handleEvaluateSubmit}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30 cursor-pointer"
                  >
                    Save Evaluation
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* GRACE TIME MODAL (INDIVIDUAL CANDIDATE) */}
        <AnimatePresence>
          {graceModalSub && (
            <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-2xl bg-surface border border-separator p-5 sm:p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-separator pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                      <Clock size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-label-primary">Grant Grace Time & Resume</h4>
                      <p className="text-xs text-text-muted">
                        Candidate: <span className="text-label-primary font-semibold">{graceModalSub.userId?.name || 'Student'}</span> ({graceModalSub.userId?.rollNo || graceModalSub.userId?.email || 'N/A'})
                      </p>
                    </div>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => setGraceModalSub(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white min-w-unit-8 w-8 h-8 cursor-pointer"
                  >
                    <X size={16} />
                  </Button>
                </div>

                {/* Candidate Info Box */}
                <div className="p-3 rounded-xl bg-surface-secondary border border-separator text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-label-secondary">Current Status:</span>
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                      graceModalSub.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400' :
                      graceModalSub.status === 'AUTO_SUBMITTED' ? 'bg-amber-500/15 text-amber-400' :
                      graceModalSub.status === 'IN_PROGRESS' ? 'bg-blue-500/15 text-blue-400' :
                      'bg-white/10 text-label-secondary'
                    }`}>
                      {graceModalSub.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-label-secondary">Current Grace Time:</span>
                    <span className="text-label-primary font-mono font-bold">
                      +{graceModalSub.graceMinutes || 0} mins
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-label-secondary">Integrity Status:</span>
                    <span className={graceModalSub.isBlocked ? 'text-destructive font-bold' : 'text-emerald-500 font-medium'}>
                      {graceModalSub.isBlocked ? 'Blocked (will be unblocked)' : 'Active / Allowed'}
                    </span>
                  </div>
                </div>

                {/* Time selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-label-primary block">
                    Additional Minutes to Grant
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setGraceMinutesInput(mins)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          graceMinutesInput === mins
                            ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20'
                            : 'bg-surface-secondary text-label-secondary border-separator hover:border-amber-500/50 hover:text-amber-500'
                        }`}
                      >
                        +{mins}m
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-label-secondary shrink-0">Custom minutes:</span>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={graceMinutesInput}
                      onChange={(e) => setGraceMinutesInput(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Preservation Option */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      id="keepAnswersRadio"
                      name="graceAnswerOption"
                      checked={!graceClearAnswers}
                      onChange={() => setGraceClearAnswers(false)}
                      className="mt-0.5 accent-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="keepAnswersRadio" className="text-xs cursor-pointer">
                      <span className="font-bold text-emerald-400 block">
                        Keep previously submitted answers (Recommended)
                      </span>
                      <span className="text-text-muted text-[11px] leading-relaxed block">
                        All MCQ selections, coding drafts/submissions, and design links remain intact. The student resumes right where they left off.
                      </span>
                    </label>
                  </div>

                  <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                    <input
                      type="radio"
                      id="clearAnswersRadio"
                      name="graceAnswerOption"
                      checked={graceClearAnswers}
                      onChange={() => setGraceClearAnswers(true)}
                      className="mt-0.5 accent-destructive cursor-pointer"
                    />
                    <label htmlFor="clearAnswersRadio" className="text-xs cursor-pointer">
                      <span className="font-bold text-destructive block">
                        Clear all answers (Fresh Restart)
                      </span>
                      <span className="text-text-muted text-[11px] leading-relaxed block">
                        Wipes all MCQ and coding solutions for a completely fresh attempt.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-separator">
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => setGraceModalSub(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-label-secondary hover:bg-white/10 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="solid"
                    color="warning"
                    isLoading={isGrantingGrace}
                    isDisabled={isGrantingGrace}
                    startContent={!isGrantingGrace ? <Clock size={13} /> : undefined}
                    onClick={handleGrantGraceTime}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    Grant +{graceMinutesInput}m & Resume
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* GRACE TIME MODAL (ALL CANDIDATES) */}
        <AnimatePresence>
          {isGraceAllModalOpen && (
            <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-2xl bg-surface border border-separator p-5 sm:p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-separator pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                      <Clock size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-label-primary">Grant Grace Time to All Candidates</h4>
                      <p className="text-xs text-text-muted">
                        Extend round deadline & session duration for all students
                      </p>
                    </div>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    onPress={() => setIsGraceAllModalOpen(false)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white min-w-unit-8 w-8 h-8 cursor-pointer"
                  >
                    <X size={16} />
                  </Button>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-400 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    All existing answers will be preserved!
                  </p>
                  <p className="text-text-muted text-[11px] leading-relaxed">
                    This adds extra time to the round deadline and extends the countdown for all ongoing and auto-submitted candidates. Candidates can immediately re-enter and finish their work without losing any code or MCQ selections.
                  </p>
                </div>

                {/* Time selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-label-primary block">
                    Additional Minutes to Grant (All Candidates)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setGraceAllMinutes(mins)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          graceAllMinutes === mins
                            ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20'
                            : 'bg-surface-secondary text-label-secondary border-separator hover:border-amber-500/50 hover:text-amber-500'
                        }`}
                      >
                        +{mins}m
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-label-secondary shrink-0">Custom minutes:</span>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={graceAllMinutes}
                      onChange={(e) => setGraceAllMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-separator">
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => setIsGraceAllModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-label-secondary hover:bg-white/10 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="solid"
                    color="warning"
                    isLoading={isGrantingGraceAll}
                    isDisabled={isGrantingGraceAll}
                    startContent={!isGrantingGraceAll ? <Clock size={13} /> : undefined}
                    onPress={handleGrantGraceTimeAll}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    Grant +{graceAllMinutes}m to All
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MANUAL PAPER TEST SUBMISSION MODAL */}
        <ManualPaperSubmissionModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          eventId={event?._id || ''}
          maxScore={selectedAssessment?.totalPoints || 100}
          passingPercentage={selectedAssessment?.passingPercentage || 50}
          onSubmit={handleCreateManualSubmission}
          isSubmitting={isSubmittingManual}
        />

        {/* BULK PAPER TEST SUBMISSIONS MODAL */}
        <ManualPaperBulkUploadModal
          isOpen={isBulkPaperModalOpen}
          onClose={() => setIsBulkPaperModalOpen(false)}
          eventId={event?._id || ''}
          assessmentId={selectedAssessment?._id || ''}
          maxScore={selectedAssessment?.totalPoints || 100}
          onSuccess={() => {
            if (selectedAssessment?._id) {
              fetchAdminAssessmentSubmissions(event._id, selectedAssessment._id);
            }
          }}
        />

        {/* BLOCKED STUDENTS STANDALONE MODAL */}
        <BlockedStudentsModal
          isOpen={isBlockedStudentsModalOpen}
          onClose={() => setIsBlockedStudentsModalOpen(false)}
          eventId={event?._id || ''}
          eventTitle={event?.title || ''}
          onStudentUnblocked={() => {
            if (selectedAssessment?._id) {
              fetchAdminAssessmentSubmissions(event._id, selectedAssessment._id);
            }
            fetchBlockedCount();
          }}
        />
      </div>
    </ResponsiveModal>
  );
};

export default EventArenaAdminModal;

