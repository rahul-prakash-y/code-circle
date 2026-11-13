import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ResponsiveModal from '../ui/ResponsiveModal';
import api from '../../lib/axios';
import useAuthStore from '../../store/useAuthStore';
import useProfileStore from '../../store/useProfileStore';
import useEventArenaStore, {
  ArenaAssessment,
  ArenaMcqQuestion,
  ArenaCodingProblem,
} from '../../store/useEventArenaStore';
import {
  ManualPaperSubmissionModal,
  ManualPaperBulkUploadModal,
  BlockedStudentsTab,
  BlockedStudentsModal,
} from './arena';
import {
  AssessmentHeader,
  AssessmentAdminTab,
  CreateAssessmentView,
  CreateAssessmentPayload,
  AssessmentSettingsTab,
  SaveAssessmentConfigPayload,
  MCQManagerTab,
  CodingManagerTab,
  DesignChallengeManagerTab,
  SubmissionsManagerTab,
  ArenaTeamsTab,
  BulkQuestionUploadModal,
  ImagePreviewModal,
  FigmaPreviewModal,
  SubmissionInspectionModal,
  DesignEvaluationModal,
  GraceTimeIndividualModal,
  GraceTimeAllModal,
} from './arena/admin';

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
    actionLoading,
    arenaTeams,
    fetchArenaTeams,
    createArenaTeam,
    assignArenaTeamMembers,
    deleteArenaTeam,
  } = useEventArenaStore();

  const { profile } = useProfileStore();
  const effectiveRole = profile?.role || user?.role;
  const isSuperAdmin = effectiveRole === 'SuperAdmin';
  const isAdminRole = ['Admin', 'SuperAdmin', 'Faculty', 'Committee'].includes(effectiveRole);

  // Modal Views & Tabs
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [activeTab, setActiveTab] = useState<AssessmentAdminTab>('settings');

  // Modal Overlays
  const [bulkModalType, setBulkModalType] = useState<'mcq' | 'coding' | null>(null);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);
  const [previewFigmaUrl, setPreviewFigmaUrl] = useState<string | null>(null);
  const [inspectingSub, setInspectingSub] = useState<any | null>(null);
  const [evaluatingSub, setEvaluatingSub] = useState<any | null>(null);
  const [graceModalSub, setGraceModalSub] = useState<any | null>(null);
  const [isGraceAllModalOpen, setIsGraceAllModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isBulkPaperModalOpen, setIsBulkPaperModalOpen] = useState(false);
  const [isBlockedStudentsModalOpen, setIsBlockedStudentsModalOpen] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Processing indicators
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [isDeletingAssessment, setIsDeletingAssessment] = useState(false);
  const [isGrantingGrace, setIsGrantingGrace] = useState(false);
  const [isGrantingGraceAll, setIsGrantingGraceAll] = useState(false);
  const [blockedCount, setBlockedCount] = useState<number>(0);

  const selectedAssessmentId = selectedAssessment?._id;

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

  // Load initial data (only when modal opens or event ID changes)
  useEffect(() => {
    if (isOpen && event?._id) {
      if (adminCandidates.length === 0) {
        fetchAdminCandidates();
      }
      fetchAssessments(event._id);
    }
  }, [isOpen, event?._id, adminCandidates.length, fetchAdminCandidates, fetchAssessments]);

  // Fetch questions and submissions ONLY when selected assessment ID changes
  useEffect(() => {
    if (isOpen && event?._id && selectedAssessmentId) {
      fetchAdminAssessmentQuestions(event._id, selectedAssessmentId);
      fetchAdminAssessmentSubmissions(event._id, selectedAssessmentId);
      fetchArenaTeams(event._id);
    }
  }, [isOpen, event?._id, selectedAssessmentId, fetchAdminAssessmentQuestions, fetchAdminAssessmentSubmissions, fetchArenaTeams]);

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

  // Handlers
  const handleCreateAssessment = useCallback(async (payload: CreateAssessmentPayload) => {
    if (!event?._id) return;
    try {
      await createAssessment(event._id, payload);
      setIsCreatingNew(false);
      if (onSuccess) onSuccess();
    } catch {
      // Handled in store
    }
  }, [event?._id, createAssessment, onSuccess]);

  const handleSaveAssessmentConfig = useCallback(async (payload: SaveAssessmentConfigPayload) => {
    if (!event?._id || !selectedAssessmentId) return;
    try {
      await updateAssessment(event._id, selectedAssessmentId, payload);
    } catch {
      // Handled in store
    }
  }, [event?._id, selectedAssessmentId, updateAssessment]);

  const handleDeleteAssessment = useCallback(async () => {
    if (!event?._id || !selectedAssessment) return;
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
  }, [event?._id, selectedAssessment, deleteAssessment]);

  const handleSaveMcqs = useCallback(async (updated: ArenaMcqQuestion[]) => {
    if (!event?._id || !selectedAssessmentId) return;
    await saveAssessmentMcqs(event._id, selectedAssessmentId, updated, 'replace');
  }, [event?._id, selectedAssessmentId, saveAssessmentMcqs]);

  const handleSaveCoding = useCallback(async (updated: ArenaCodingProblem[]) => {
    if (!event?._id || !selectedAssessmentId) return;
    await saveAssessmentCodingProblems(event._id, selectedAssessmentId, updated, 'replace');
  }, [event?._id, selectedAssessmentId, saveAssessmentCodingProblems]);

  const handleGradeCode = useCallback(async (
    submissionId: string,
    problemId: string,
    score: number,
    feedback: string
  ) => {
    if (!event?._id || !selectedAssessmentId) return;
    await evaluateAssessmentCode(event._id, selectedAssessmentId, submissionId, problemId, score, feedback);
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
  }, [event?._id, selectedAssessmentId, evaluateAssessmentCode]);

  const handleBulkUpload = useCallback(async (file: File) => {
    if (!file || !bulkModalType || !event?._id || !selectedAssessmentId) {
      toast.error('Please choose a file to upload');
      return;
    }
    await bulkUploadAssessmentQuestions(
      event._id,
      selectedAssessmentId,
      file,
      bulkModalType,
      'append'
    );
    setBulkModalType(null);
  }, [event?._id, selectedAssessmentId, bulkModalType, bulkUploadAssessmentQuestions]);

  const handleSaveDesignChallenge = useCallback(async (data: { challenges: any[] }) => {
    if (!event?._id || !selectedAssessmentId) return;
    await saveAssessmentDesignChallenge(event._id, selectedAssessmentId, data);
  }, [event?._id, selectedAssessmentId, saveAssessmentDesignChallenge]);

  const handleEvaluateSubmit = useCallback(async (points: number, feedback: string) => {
    if (!event?._id || !selectedAssessmentId || !evaluatingSub) return;
    await evaluateAssessmentDesign(
      event._id,
      selectedAssessmentId,
      evaluatingSub._id,
      {
        pointsEarned: Number(points) || 0,
        feedback: feedback.trim(),
      }
    );
    setEvaluatingSub(null);
  }, [event?._id, selectedAssessmentId, evaluatingSub, evaluateAssessmentDesign]);

  const handleResetSubmission = useCallback(async (sub: any) => {
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
  }, [event?._id, selectedAssessmentId, inspectingSub?._id, deleteAssessmentSubmission]);

  const handleUnblockStudent = useCallback(async (studentId: string, studentName?: string) => {
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
      // Handled in store
    } finally {
      setActionInProgressId(null);
    }
  }, [event?._id, inspectingSub, unblockStudentDirect]);

  const handleQuickUnblock = useCallback(async (query: string) => {
    if (!event?._id || !query.trim()) return;
    await unblockStudentDirect(event._id, query.trim());
  }, [event?._id, unblockStudentDirect]);

  const handleGrantGraceTime = useCallback(async (
    submissionId: string,
    minutes: number,
    clearAnswers: boolean
  ) => {
    if (!event?._id || !selectedAssessmentId || !submissionId) return;
    setIsGrantingGrace(true);
    try {
      await grantGraceTime(event._id, selectedAssessmentId, {
        submissionId,
        extraMinutes: minutes,
        graceMinutes: minutes,
        minutes,
        clearAnswers,
      });
      setGraceModalSub(null);
    } catch {
      // Handled in store
    } finally {
      setIsGrantingGrace(false);
    }
  }, [event?._id, selectedAssessmentId, grantGraceTime]);

  const handleGrantGraceTimeAll = useCallback(async (minutes: number) => {
    if (!event?._id || !selectedAssessmentId) return;
    setIsGrantingGraceAll(true);
    try {
      await grantGraceTimeAll(event._id, selectedAssessmentId, minutes);
      setIsGraceAllModalOpen(false);
    } catch {
      // Handled in store
    } finally {
      setIsGrantingGraceAll(false);
    }
  }, [event?._id, selectedAssessmentId, grantGraceTimeAll]);

  const handleCreateManualSubmission = useCallback(async (data: {
    studentIdentifier: string;
    score: number;
    maxScore?: number;
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
        maxScore: data.maxScore ? Number(data.maxScore) : undefined,
        mcqScore: data.mcqScore,
        codingScore: data.codingScore,
        manualNotes: data.manualNotes,
      });
      setIsManualModalOpen(false);
      fetchAdminAssessmentSubmissions(event._id, selectedAssessmentId);
    } finally {
      setIsSubmittingManual(false);
    }
  }, [event?._id, selectedAssessmentId, createManualSubmission, fetchAdminAssessmentSubmissions]);

  const handleDeleteSubmission = useCallback(async (sub: any) => {
    if (!event?._id || !selectedAssessmentId || !sub._id) return;
    const studentName = sub.userId?.name || 'this student';
    if (!window.confirm(`Delete submission record for ${studentName}? This action cannot be undone.`)) {
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
  }, [event?._id, selectedAssessmentId, inspectingSub?._id, deleteAssessmentSubmission]);

  const handleUpdateCutoffRank = useCallback(async (val: number) => {
    if (!event?._id || !selectedAssessmentId) return;
    try {
      await updateAssessment(event._id, selectedAssessmentId, {
        qualificationCutoffRank: val,
      });
      toast.success(`Updated Top Rank Cutoff to ${val || 'All Qualify'}`);
    } catch {
      toast.error('Failed to update cutoff rank');
    }
  }, [event?._id, selectedAssessmentId, updateAssessment]);

  if (!isOpen || !event) return null;

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
        {/* Navigation & Switcher Header */}
        <AssessmentHeader
          eventId={event._id}
          assessments={assessments}
          selectedAssessment={selectedAssessment}
          isCreatingNew={isCreatingNew}
          activeTab={activeTab}
          blockedCount={blockedCount}
          mcqCount={adminMcqs.length}
          codingCount={adminCoding.length}
          teamsCount={arenaTeams.length}
          submissionsCount={adminSubmissions.length}
          canManageSelected={canManageSelected}
          onSelectAssessment={(asm) => {
            setIsCreatingNew(false);
            setSelectedAssessment(asm);
            if (asm.type === 'UI_UX') {
              setActiveTab((prev) => (prev === 'mcq' || prev === 'coding' ? 'design' : prev));
            }
          }}
          onStartCreateNew={() => setIsCreatingNew(true)}
          onChangeTab={setActiveTab}
          onCloseModal={onClose}
        />

        {/* Main Content Body */}
        {isCreatingNew ? (
          <CreateAssessmentView
            adminCandidates={adminCandidates}
            isSuperAdmin={isSuperAdmin}
            actionLoading={actionLoading}
            onCreate={handleCreateAssessment}
            onCancel={() => setIsCreatingNew(false)}
          />
        ) : selectedAssessment ? (
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6">
            {activeTab === 'settings' && (
              <AssessmentSettingsTab
                selectedAssessment={selectedAssessment}
                adminCandidates={adminCandidates}
                isSuperAdmin={isSuperAdmin}
                canManageSelected={canManageSelected}
                actionLoading={actionLoading}
                isDeletingAssessment={isDeletingAssessment}
                onSave={handleSaveAssessmentConfig}
                onDelete={handleDeleteAssessment}
              />
            )}

            {activeTab === 'mcq' && (selectedAssessment.type === 'MCQ' || selectedAssessment.type === 'HYBRID') && (
              <MCQManagerTab
                eventId={event._id}
                assessmentId={selectedAssessment._id}
                adminMcqs={adminMcqs}
                canManageSelected={canManageSelected}
                actionLoading={actionLoading}
                onSaveMcqs={handleSaveMcqs}
                onOpenBulkModal={() => setBulkModalType('mcq')}
                downloadArenaTemplate={downloadArenaTemplate}
                onCloseModal={onClose}
              />
            )}

            {activeTab === 'coding' && (selectedAssessment.type === 'CODING' || selectedAssessment.type === 'HYBRID') && (
              <CodingManagerTab
                eventId={event._id}
                assessmentId={selectedAssessment._id}
                adminCoding={adminCoding}
                canManageSelected={canManageSelected}
                actionLoading={actionLoading}
                onSaveCoding={handleSaveCoding}
                onOpenBulkModal={() => setBulkModalType('coding')}
                downloadArenaTemplate={downloadArenaTemplate}
                onCloseModal={onClose}
              />
            )}

            {activeTab === 'design' && selectedAssessment.type === 'UI_UX' && (
              <DesignChallengeManagerTab
                eventId={event._id}
                selectedAssessment={selectedAssessment}
                adminDesignChallenge={adminDesignChallenge}
                adminDesignChallenges={adminDesignChallenges}
                canManageSelected={canManageSelected}
                actionLoading={actionLoading}
                onSaveDesignChallenge={handleSaveDesignChallenge}
                uploadDesignImage={uploadDesignImage}
                onPreviewImage={(url) => setPreviewModalImg(url)}
                onCloseModal={onClose}
              />
            )}

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

            {activeTab === 'submissions' && (
              <SubmissionsManagerTab
                event={event}
                selectedAssessment={selectedAssessment}
                assessments={assessments}
                selectedAssessmentIndex={selectedAssessmentIndex}
                nextAssessment={nextAssessment}
                effectiveCutoffRank={effectiveCutoffRank}
                adminSubmissions={adminSubmissions}
                sortedAdminSubmissions={sortedAdminSubmissions}
                submissionRankMap={submissionRankMap}
                overallLeaderboard={overallLeaderboard}
                overallLeaderboardAssessments={overallLeaderboardAssessments}
                fetchAdminOverallLeaderboard={fetchAdminOverallLeaderboard}
                canManageSelected={canManageSelected}
                actionInProgressId={actionInProgressId}
                onUpdateCutoffRank={handleUpdateCutoffRank}
                onQuickUnblock={handleQuickUnblock}
                onOpenManualModal={() => setIsManualModalOpen(true)}
                onOpenBulkPaperModal={() => setIsBulkPaperModalOpen(true)}
                onOpenGraceAllModal={() => setIsGraceAllModalOpen(true)}
                onOpenGraceModal={(sub) => setGraceModalSub(sub)}
                onInspectSubmission={(sub) => setInspectingSub(sub)}
                onEvaluateSubmission={(sub) => setEvaluatingSub(sub)}
                onResetSubmission={handleResetSubmission}
                onUnblockStudent={handleUnblockStudent}
                onDeleteSubmission={handleDeleteSubmission}
              />
            )}

            {activeTab === 'blocked' && (
              <BlockedStudentsTab
                eventId={event._id}
                blockedCount={blockedCount}
                onRefreshCount={fetchBlockedCount}
                onOpenDetailsModal={() => setIsBlockedStudentsModalOpen(true)}
              />
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-text-muted">
            No assessment selected. Please select an assessment above or create a new one.
          </div>
        )}

        {/* BULK QUESTION UPLOAD MODAL */}
        <BulkQuestionUploadModal
          isOpen={Boolean(bulkModalType)}
          bulkModalType={bulkModalType}
          assessmentTitle={selectedAssessment?.title}
          actionLoading={actionLoading}
          onClose={() => setBulkModalType(null)}
          onUpload={handleBulkUpload}
        />

        {/* IMAGE PREVIEW LIGHTBOX */}
        <ImagePreviewModal
          imageUrl={previewModalImg}
          onClose={() => setPreviewModalImg(null)}
        />

        {/* FIGMA PREVIEW MODAL */}
        <FigmaPreviewModal
          figmaUrl={previewFigmaUrl}
          onClose={() => setPreviewFigmaUrl(null)}
        />

        {/* SUBMISSION INSPECTION MODAL */}
        <SubmissionInspectionModal
          inspectingSub={inspectingSub}
          selectedAssessment={selectedAssessment}
          adminMcqs={adminMcqs}
          adminCoding={adminCoding}
          effectiveCutoffRank={effectiveCutoffRank}
          inspectingRank={inspectingRank}
          inspectingShortlisted={inspectingShortlisted}
          actionInProgressId={actionInProgressId}
          onClose={() => setInspectingSub(null)}
          onGradeCode={handleGradeCode}
          onResetSubmission={handleResetSubmission}
          onUnblockStudent={handleUnblockStudent}
          onDeleteSubmission={handleDeleteSubmission}
          onOpenGraceModal={(sub) => setGraceModalSub(sub)}
        />

        {/* DESIGN EVALUATION MODAL */}
        <DesignEvaluationModal
          evaluatingSub={evaluatingSub}
          totalPoints={selectedAssessment?.totalPoints || 100}
          actionLoading={actionLoading}
          onClose={() => setEvaluatingSub(null)}
          onSave={handleEvaluateSubmit}
        />

        {/* GRACE TIME MODAL (INDIVIDUAL CANDIDATE) */}
        <GraceTimeIndividualModal
          graceModalSub={graceModalSub}
          isGrantingGrace={isGrantingGrace}
          onClose={() => setGraceModalSub(null)}
          onGrant={handleGrantGraceTime}
        />

        {/* GRACE TIME MODAL (ALL CANDIDATES) */}
        <GraceTimeAllModal
          isOpen={isGraceAllModalOpen}
          isGrantingGraceAll={isGrantingGraceAll}
          onClose={() => setIsGraceAllModalOpen(false)}
          onGrantAll={handleGrantGraceTimeAll}
        />

        {/* MANUAL PAPER SUBMISSION MODALS */}
        <ManualPaperSubmissionModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          onSubmit={handleCreateManualSubmission}
          isSubmitting={isSubmittingManual}
          eventTitle={event?.title}
          assessmentTitle={selectedAssessment?.title}
          eventId={event?._id}
          maxScore={selectedAssessment?.totalPoints || 100}
        />

        <ManualPaperBulkUploadModal
          isOpen={isBulkPaperModalOpen}
          onClose={() => setIsBulkPaperModalOpen(false)}
          eventId={event?._id}
          assessmentId={selectedAssessmentId || ''}
          assessmentTitle={selectedAssessment?.title}
          maxScore={selectedAssessment?.totalPoints || 100}
          onSuccess={() => {
            if (event?._id && selectedAssessmentId) {
              fetchAdminAssessmentSubmissions(event._id, selectedAssessmentId);
            }
          }}
        />

        <BlockedStudentsModal
          isOpen={isBlockedStudentsModalOpen}
          onClose={() => {
            setIsBlockedStudentsModalOpen(false);
            fetchBlockedCount();
          }}
          eventId={event?._id}
          onStudentUnblocked={fetchBlockedCount}
        />
      </div>
    </ResponsiveModal>
  );
};

export default EventArenaAdminModal;
