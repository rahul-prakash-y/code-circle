import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResponsiveModal from '../ui/ResponsiveModal';
import {
  X,
  ShieldCheck,
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
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import useEventArenaStore, {
  ArenaAssessment,
  ArenaAdminCandidate,
  ArenaMcqQuestion,
  ArenaCodingProblem,
  ArenaDesignChallenge,
} from '../../store/useEventArenaStore';

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
    assessments,
    selectedAssessment,
    setSelectedAssessment,
    adminCandidates,
    adminMcqs,
    adminCoding,
    adminDesignChallenge,
    adminSubmissions,
    loading,
    actionLoading,
    arenaTeams,
    fetchArenaTeams,
    createArenaTeam,
    assignArenaTeamMembers,
    deleteArenaTeam,
  } = useEventArenaStore();

  const isSuperAdmin = user?.role === 'SuperAdmin';

  // Modal Views & Tabs
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'mcq' | 'coding' | 'design' | 'teams' | 'submissions'>('settings');

  // New Assessment Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'CODING' | 'MCQ' | 'HYBRID' | 'UI_UX'>('HYBRID');
  const [newDuration, setNewDuration] = useState(60);
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
  const [newCodingPoints, setNewCodingPoints] = useState(30);
  const [newSampleInput, setNewSampleInput] = useState('');
  const [newSampleOutput, setNewSampleOutput] = useState('');
  const [newHiddenInput, setNewHiddenInput] = useState('');
  const [newHiddenOutput, setNewHiddenOutput] = useState('');

  // Bulk Upload state
  const [bulkModalType, setBulkModalType] = useState<'mcq' | 'coding' | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  // Check if current user can manage questions for the selected assessment
  const canManageSelected = useMemo(() => {
    if (!user || !selectedAssessment) return false;
    if (isSuperAdmin) return true;
    const assigned = selectedAssessment.assignedAdmins || [];
    return assigned.some((adm: any) => {
      const id = adm?._id ? adm._id.toString() : adm.toString();
      return id === (user.id || user._id)?.toString();
    });
  }, [user, selectedAssessment, isSuperAdmin]);

  const selectedAssessmentId = selectedAssessment?._id;

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
    const dc = adminDesignChallenge || selectedAssessment?.designChallenge;
    if (dc) {
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
      setDesignTitle(selectedAssessment.title || '');
      setDesignDesc(selectedAssessment.description || '');
      setDesignProblem('');
      setDesignImageUrl('');
      setDesignRefFigma('');
      setDesignPoints(selectedAssessment.totalPoints || 100);
    }
  }, [adminDesignChallenge, selectedAssessmentId]);

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
      await createAssessment(event._id, {
        title: newTitle.trim(),
        description: newDesc.trim(),
        type: newType,
        durationMinutes: Number(newDuration),
        passingPercentage: Number(newPassingScore),
        assignedAdmins: newAssignedAdminIds,
        qualificationCutoffRank: Number(newCutoffRank) || 0,
        isTeamMode: newIsTeamMode,
        teamSize: Number(newTeamSize) || 2,
      });
      setIsCreatingNew(false);
      setNewTitle('');
      setNewDesc('');
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
      await updateAssessment(event._id, selectedAssessment._id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        type: editType,
        status: editStatus,
        durationMinutes: Number(editDuration),
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
    await deleteAssessment(event._id, selectedAssessment._id);
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
    await saveAssessmentMcqs(event._id, selectedAssessment._id, updated, 'replace');
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
      points: Number(newCodingPoints) || 30,
      allowedLanguages: ['python', 'javascript', 'cpp', 'java', 'c'],
      sampleInput: newSampleInput.trim(),
      sampleOutput: newSampleOutput.trim(),
      testCases,
    };

    const updated = [...adminCoding, newProblem];
    await saveAssessmentCodingProblems(event._id, selectedAssessment._id, updated, 'replace');

    // Reset form
    setNewCodingTitle('');
    setNewCodingDesc('');
    setNewCodingPoints(30);
    setNewSampleInput('');
    setNewSampleOutput('');
    setNewHiddenInput('');
    setNewHiddenOutput('');
    setShowAddCoding(false);
  };

  const handleDeleteCoding = async (idx: number) => {
    if (!selectedAssessment) return;
    if (!window.confirm('Delete this coding challenge?')) return;
    const updated = adminCoding.filter((_, i) => i !== idx);
    await saveAssessmentCodingProblems(event._id, selectedAssessment._id, updated, 'replace');
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

  const handleSaveDesignChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessment) return;
    if (!designTitle.trim()) {
      return toast.error('Please enter a challenge title');
    }
    if (!designImageUrl.trim()) {
      return toast.error('Please upload or provide a reference design image');
    }
    await saveAssessmentDesignChallenge(event._id, selectedAssessment._id, {
      title: designTitle.trim(),
      description: designDesc.trim(),
      problemStatement: designProblem.trim(),
      designImageUrl: designImageUrl.trim(),
      referenceFigmaUrl: designRefFigma.trim(),
      deliverables: designDeliverables.filter((d) => d.trim()),
      guidelines: designGuidelines.filter((g) => g.trim()),
      points: Number(designPoints) || 100,
    });
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    <>
      <ResponsiveModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Sparkles size={18} />
            </div>
            <span className="truncate">Event Arena Assessments</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 uppercase">
              Admin Panel
            </span>
          </div>
        }
        description={`${event.title} • Multi-Assessment Management & Assigned Admins`}
        dialogClassName="sm:max-w-5xl p-6"
        footer={
          <div className="flex items-center justify-between w-full pt-3 border-t border-separator dark:border-white/10 text-xs">
            <span className="text-text-muted text-[11px]">
              {assessments.length} assessment{assessments.length === 1 ? '' : 's'} configured
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 rounded-xl font-bold text-label-primary hover:bg-surface-secondary transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        }
      >
        <div className="space-y-4 pt-1">
          {/* Assessment Switcher Bar */}
          <div className="px-4 py-2.5 border border-separator dark:border-white/10 rounded-2xl bg-surface-secondary/70 flex items-center justify-between gap-3 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-xs font-semibold text-text-muted shrink-0 flex items-center gap-1.5 mr-1">
              <Layers size={13} className="text-purple-400" />
              <span>Assessments:</span>
            </span>

            {assessments.map((asm) => {
              const isSelected = !isCreatingNew && selectedAssessment?._id === asm._id;
              return (
                <button
                  key={asm._id}
                  onClick={() => {
                    setIsCreatingNew(false);
                    setSelectedAssessment(asm);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-[#1D1D1F] dark:text-[#F5F5F7] shadow-md shadow-purple-600/30'
                      : 'bg-white/5 hover:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7]/70 border border-white/5'
                  }`}
                >
                  <span className="truncate max-w-[150px]">{asm.title}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-mono ${
                      isSelected ? 'bg-white/20 text-[#1D1D1F] dark:text-[#F5F5F7]' : 'bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7]/60'
                    }`}
                  >
                    {asm.type}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsCreatingNew(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              isCreatingNew
                ? 'bg-emerald-600 text-[#1D1D1F] dark:text-[#F5F5F7] shadow-md shadow-emerald-600/30'
                : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
            }`}
          >
            <Plus size={14} />
            <span>Create Assessment</span>
          </button>
        </div>

        {/* Main Body */}
        {isCreatingNew ? (
          /* CREATE NEW ASSESSMENT VIEW */
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
                <div>
                  <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                    <Plus size={16} className="text-emerald-400" />
                    <span>Create a New Arena Assessment</span>
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Add another round or assessment (e.g. Round 1 MCQ, Round 2 Coding) and assign admins.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-xs text-text-muted hover:text-[#1D1D1F] dark:text-[#F5F5F7]"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateAssessment} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">
                    Assessment Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Round 1: Screening Test or Coding Finale"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-white/30 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Short description or guidelines for this assessment..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-white/30 focus:border-purple-500 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Assessment Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1E] border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none"
                    >
                      <option value="HYBRID">Hybrid (MCQ + Coding)</option>
                      <option value="MCQ">MCQ Questions Only</option>
                      <option value="CODING">Coding Challenges Only</option>
                      <option value="UI_UX">🎨 UI/UX Design (Figma)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Duration (Minutes)</label>
                    <input
                      type="number"
                      min={5}
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Passing Score (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newPassingScore}
                      onChange={(e) => setNewPassingScore(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none"
                    />
                  </div>
                </div>

                {/* Qualification Cutoff & Team Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">
                      Qualify Top Students (Cutoff)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newCutoffRank}
                      onChange={(e) => setNewCutoffRank(Number(e.target.value))}
                      placeholder="e.g. 80 (0 for all)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none focus:border-purple-500"
                    />
                    <p className="text-[10px] text-[#1D1D1F] dark:text-[#F5F5F7]/40 mt-1">
                      Top N from previous round allowed (0 = open to all enrolled).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Round Mode</label>
                    <select
                      value={newIsTeamMode ? 'team' : 'individual'}
                      onChange={(e) => setNewIsTeamMode(e.target.value === 'team')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1E] border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none"
                    >
                      <option value="individual">Individual Participation</option>
                      <option value="team">👥 Team Mode (Manual Assignment)</option>
                    </select>
                  </div>

                  {newIsTeamMode && (
                    <div>
                      <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Team Size</label>
                      <input
                        type="number"
                        min={2}
                        max={10}
                        value={newTeamSize}
                        onChange={(e) => setNewTeamSize(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Assigned Admins Selector */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5">
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
                    <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-black/5 dark:border-white/10">
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1D1D1F] dark:text-[#F5F5F7]/40"
                        />
                        <input
                          type="text"
                          value={adminSearch}
                          onChange={(e) => setAdminSearch(e.target.value)}
                          placeholder="Search admins by name, email, roll number..."
                          className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-white/30 outline-none"
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
                                  ? 'bg-purple-500/15 border-purple-500/40 text-[#1D1D1F] dark:text-[#F5F5F7]'
                                  : 'bg-white/[0.02] border-white/5 hover:border-black/10 dark:border-white/15 text-[#1D1D1F] dark:text-[#F5F5F7]/70'
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
                                    ? 'bg-purple-600 border-purple-500 text-[#1D1D1F] dark:text-[#F5F5F7]'
                                    : 'border-black/10 dark:border-white/20'
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
                    <div className="p-3 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-text-muted">
                      Admin assignment is managed by SuperAdmin.
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/70 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 size={13} className="animate-spin" />}
                    <span>Create Assessment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : selectedAssessment ? (
          /* SELECTED ASSESSMENT WORKSPACE */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Assessment Sub-Navigation */}
            <div className="px-6 py-2.5 border-b border-black/5 dark:border-white/10 bg-white/[0.015] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === 'settings'
                      ? 'bg-white/15 text-[#1D1D1F] dark:text-[#F5F5F7]'
                      : 'text-text-muted hover:text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-white/5'
                  }`}
                >
                  <Settings size={13} />
                  <span>Config & Assigned Admins</span>
                </button>

                {(selectedAssessment.type === 'MCQ' || selectedAssessment.type === 'HYBRID') && (
                  <button
                    onClick={() => setActiveTab('mcq')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeTab === 'mcq'
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                        : 'text-text-muted hover:text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-white/5'
                    }`}
                  >
                    <HelpCircle size={13} />
                    <span>MCQs ({adminMcqs.length})</span>
                  </button>
                )}

                {(selectedAssessment.type === 'CODING' || selectedAssessment.type === 'HYBRID') && (
                  <button
                    onClick={() => setActiveTab('coding')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeTab === 'coding'
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                        : 'text-text-muted hover:text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-white/5'
                    }`}
                  >
                    <Code2 size={13} />
                    <span>Coding Challenges ({adminCoding.length})</span>
                  </button>
                )}

                {selectedAssessment.type === 'UI_UX' && (
                  <button
                    onClick={() => setActiveTab('design')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'design'
                        ? 'bg-gradient-to-r from-pink-600/30 to-purple-600/30 text-pink-300 border border-pink-500/40 shadow-sm shadow-pink-500/20'
                        : 'text-text-muted hover:text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-white/5'
                    }`}
                  >
                    <Palette size={13} className="text-pink-400" />
                    <span>🎨 UI/UX Design Challenge</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('teams')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === 'teams'
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                      : 'text-text-muted hover:text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-white/5'
                  }`}
                >
                  <Users size={13} />
                  <span>Teams ({arenaTeams.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('submissions')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === 'submissions'
                      ? 'bg-white/15 text-[#1D1D1F] dark:text-[#F5F5F7]'
                      : 'text-text-muted hover:text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-white/5'
                  }`}
                >
                  <Award size={13} />
                  <span>Submissions ({adminSubmissions.length})</span>
                </button>
              </div>

              {/* Status Indicator & Assigned Admins summary */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {(selectedAssessment.assignedAdmins || []).slice(0, 3).map((adm: any) => (
                    <img
                      key={adm._id || adm}
                      title={adm.name || 'Assigned Admin'}
                      src={
                        adm.profilePicUrl ||
                        `https://ui-avatars.com/api/?name=${adm.name || 'Admin'}&background=7C3AED&color=fff&size=60`
                      }
                      className="w-5 h-5 rounded-full border border-black object-cover"
                    />
                  ))}
                </div>
                {canManageSelected ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Authorized Editor
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    View Only
                  </span>
                )}
              </div>
            </div>

            {/* Sub-Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* TAB 1: CONFIG & ASSIGNED ADMINS */}
              {activeTab === 'settings' && (
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/10 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                      <div>
                        <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">Assessment Information</h3>
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
                        <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Assessment Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none focus:border-purple-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Status</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as any)}
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1E] border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none disabled:opacity-50"
                        >
                          <option value="LIVE">Live (Open for students)</option>
                          <option value="UPCOMING">Upcoming</option>
                          <option value="DRAFT">Draft</option>
                          <option value="ENDED">Ended</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Description</label>
                      <textarea
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        disabled={!canManageSelected}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none resize-none disabled:opacity-50"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Type</label>
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as any)}
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1E] border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none disabled:opacity-50"
                        >
                          <option value="HYBRID">Hybrid (MCQ + Coding)</option>
                          <option value="MCQ">MCQ Questions Only</option>
                          <option value="CODING">Coding Challenges Only</option>
                          <option value="UI_UX">🎨 UI/UX Design (Figma)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Duration (Mins)</label>
                        <input
                          type="number"
                          min={5}
                          value={editDuration}
                          onChange={(e) => setEditDuration(Number(e.target.value))}
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Passing %</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={editPassingScore}
                          onChange={(e) => setEditPassingScore(Number(e.target.value))}
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Cutoff & Team Mode Configuration */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">
                          Top Rank Cutoff (Next Round)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={editCutoffRank}
                          onChange={(e) => setEditCutoffRank(Number(e.target.value))}
                          disabled={!canManageSelected}
                          placeholder="e.g. 80 (0 for no limit)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none disabled:opacity-50"
                        />
                        <p className="text-[10px] text-[#1D1D1F] dark:text-[#F5F5F7]/40 mt-1">
                          Only top {editCutoffRank || 0} students from previous round attend.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Round Mode</label>
                        <select
                          value={editIsTeamMode ? 'team' : 'individual'}
                          onChange={(e) => setEditIsTeamMode(e.target.value === 'team')}
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1A1E] border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none disabled:opacity-50"
                        >
                          <option value="individual">Individual Participation</option>
                          <option value="team">👥 Team Mode (Manual Allocation)</option>
                        </select>
                      </div>

                      {editIsTeamMode && (
                        <div>
                          <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Team Size</label>
                          <input
                            type="number"
                            min={2}
                            max={10}
                            value={editTeamSize}
                            onChange={(e) => setEditTeamSize(Number(e.target.value))}
                            disabled={!canManageSelected}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none disabled:opacity-50"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assigned Admins for this Assessment */}
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/10 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                      <div>
                        <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
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
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1D1D1F] dark:text-[#F5F5F7]/40"
                          />
                          <input
                            type="text"
                            value={adminSearch}
                            onChange={(e) => setAdminSearch(e.target.value)}
                            placeholder="Search admin name, email, roll number..."
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-white/30 outline-none"
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
                                    ? 'bg-purple-500/15 border-purple-500/40 text-[#1D1D1F] dark:text-[#F5F5F7]'
                                    : 'bg-white/[0.02] border-white/5 hover:border-black/10 dark:border-white/15 text-[#1D1D1F] dark:text-[#F5F5F7]/70'
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
                                      ? 'bg-purple-600 border-purple-500 text-[#1D1D1F] dark:text-[#F5F5F7]'
                                      : 'border-black/10 dark:border-white/20'
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
                              className="px-3 py-1.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 flex items-center gap-2 text-xs"
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
                              <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{adm.name || 'Admin'}</span>
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
                  <div className="flex items-center justify-between pt-2">
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={handleDeleteAssessment}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 size={13} />
                        <span>Delete Assessment</span>
                      </button>
                    )}

                    {canManageSelected && (
                      <button
                        type="button"
                        onClick={handleSaveAssessmentConfig}
                        disabled={actionLoading}
                        className="ml-auto px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading && <Loader2 size={13} className="animate-spin" />}
                        <span>Save Changes</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: MCQ QUESTIONS */}
              {activeTab === 'mcq' && (
                <div className="space-y-6">
                  {/* Action Bar */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <HelpCircle size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">MCQ Question Bank</h4>
                        <p className="text-xs text-text-muted">
                          {adminMcqs.length} Questions • Total {adminMcqs.reduce((s, q) => s + (q.points || 10), 0)} Points
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadArenaTemplate(event._id, 'mcq')}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-semibold border border-black/5 dark:border-white/10 flex items-center gap-1.5 transition-colors"
                      >
                        <Download size={13} />
                        <span>Sample Template</span>
                      </button>

                      {canManageSelected && (
                        <>
                          <button
                            onClick={() => setBulkModalType('mcq')}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-semibold border border-black/5 dark:border-white/10 flex items-center gap-1.5 transition-colors"
                          >
                            <Upload size={13} />
                            <span>Bulk Upload Excel</span>
                          </button>

                          <button
                            onClick={() => setShowAddMcq(!showAddMcq)}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all"
                          >
                            <Plus size={14} />
                            <span>Add Question</span>
                          </button>
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
                        className="p-5 rounded-2xl bg-white/[0.03] border border-purple-500/30 space-y-4 overflow-hidden"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                          <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                            <Plus size={14} className="text-purple-400" />
                            <span>Add New Multiple Choice Question</span>
                          </h4>
                          <button
                            onClick={() => setShowAddMcq(false)}
                            className="text-text-muted hover:text-[#1D1D1F] dark:text-[#F5F5F7]"
                          >
                            <X size={15} />
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">Question Text</label>
                          <textarea
                            rows={2}
                            value={newQuestionText}
                            onChange={(e) => setNewQuestionText(e.target.value)}
                            placeholder="Enter the question prompt..."
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-white/30 outline-none resize-none focus:border-purple-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {newOptions.map((opt, optIdx) => (
                            <div key={optIdx} className="space-y-1">
                              <label className="flex items-center justify-between text-[11px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/70">
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
                                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none focus:border-purple-500"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1">Points</label>
                            <input
                              type="number"
                              min={1}
                              value={newMcqPoints}
                              onChange={(e) => setNewMcqPoints(Number(e.target.value))}
                              className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1">Explanation (Optional)</label>
                            <input
                              type="text"
                              value={newExplanation}
                              onChange={(e) => setNewExplanation(e.target.value)}
                              placeholder="Explanation shown after submission..."
                              className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => setShowAddMcq(false)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-text-muted hover:text-[#1D1D1F] dark:text-[#F5F5F7]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddMcq}
                            disabled={actionLoading}
                            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5"
                          >
                            {actionLoading && <Loader2 size={12} className="animate-spin" />}
                            <span>Save Question</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* List of MCQs */}
                  <div className="space-y-3">
                    {adminMcqs.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/10 text-center space-y-2">
                        <HelpCircle size={28} className="mx-auto text-[#1D1D1F] dark:text-[#F5F5F7]/30" />
                        <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">No MCQ Questions Yet</h4>
                        <p className="text-xs text-text-muted max-w-sm mx-auto">
                          Click "Add Question" above or upload an Excel file containing questions and options.
                        </p>
                      </div>
                    ) : (
                      adminMcqs.map((q, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-black/10 dark:border-white/15 transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <h5 className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] leading-relaxed">{q.question}</h5>
                                {q.explanation && (
                                  <p className="text-[11px] text-text-muted italic mt-1">{q.explanation}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7]/80">
                                {q.points || 10} pts
                              </span>
                              {canManageSelected && (
                                <button
                                  onClick={() => handleDeleteMcq(idx)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
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
                                      : 'bg-white/[0.01] border-white/5 text-[#1D1D1F] dark:text-[#F5F5F7]/70'
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
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Code2 size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">Coding Challenges</h4>
                        <p className="text-xs text-text-muted">
                          {adminCoding.length} Problems • Total{' '}
                          {adminCoding.reduce((s, p) => s + (p.points || 30), 0)} Points
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadArenaTemplate(event._id, 'coding')}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-semibold border border-black/5 dark:border-white/10 flex items-center gap-1.5 transition-colors"
                      >
                        <Download size={13} />
                        <span>Sample Template</span>
                      </button>

                      {canManageSelected && (
                        <>
                          <button
                            onClick={() => setBulkModalType('coding')}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-semibold border border-black/5 dark:border-white/10 flex items-center gap-1.5 transition-colors"
                          >
                            <Upload size={13} />
                            <span>Bulk Upload Excel</span>
                          </button>

                          <button
                            onClick={() => setShowAddCoding(!showAddCoding)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
                          >
                            <Plus size={14} />
                            <span>Add Problem</span>
                          </button>
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
                        className="p-5 rounded-2xl bg-white/[0.03] border border-blue-500/30 space-y-4 overflow-hidden"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                          <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                            <Plus size={14} className="text-blue-400" />
                            <span>Add New Coding Challenge</span>
                          </h4>
                          <button
                            onClick={() => setShowAddCoding(false)}
                            className="text-text-muted hover:text-[#1D1D1F] dark:text-[#F5F5F7]"
                          >
                            <X size={15} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1">Problem Title</label>
                            <input
                              type="text"
                              value={newCodingTitle}
                              onChange={(e) => setNewCodingTitle(e.target.value)}
                              placeholder="e.g. Invert a Binary Tree or Maximum Subarray"
                              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1">Difficulty</label>
                            <select
                              value={newCodingDiff}
                              onChange={(e) => setNewCodingDiff(e.target.value as any)}
                              className="w-full px-3 py-2 rounded-xl bg-[#1A1A1E] border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none"
                            >
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1">
                            Problem Description & Constraints
                          </label>
                          <textarea
                            rows={3}
                            value={newCodingDesc}
                            onChange={(e) => setNewCodingDesc(e.target.value)}
                            placeholder="Describe the challenge problem, input and output expectations..."
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] outline-none resize-none focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1">Sample Input</label>
                            <textarea
                              rows={2}
                              value={newSampleInput}
                              onChange={(e) => setNewSampleInput(e.target.value)}
                              placeholder="Sample stdin input..."
                              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] font-mono outline-none resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1">
                              Sample Output (Expected)
                            </label>
                            <textarea
                              rows={2}
                              value={newSampleOutput}
                              onChange={(e) => setNewSampleOutput(e.target.value)}
                              placeholder="Sample expected output..."
                              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] font-mono outline-none resize-none"
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
                              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-500/30 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] font-mono outline-none resize-none"
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
                              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-500/30 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] font-mono outline-none resize-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => setShowAddCoding(false)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-text-muted hover:text-[#1D1D1F] dark:text-[#F5F5F7]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddCoding}
                            disabled={actionLoading}
                            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                          >
                            {actionLoading && <Loader2 size={12} className="animate-spin" />}
                            <span>Save Challenge</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* List of Coding Challenges */}
                  <div className="space-y-3">
                    {adminCoding.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/10 text-center space-y-2">
                        <Code2 size={28} className="mx-auto text-[#1D1D1F] dark:text-[#F5F5F7]/30" />
                        <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">No Coding Challenges Yet</h4>
                        <p className="text-xs text-text-muted max-w-sm mx-auto">
                          Click "Add Problem" above or upload an Excel file containing coding challenges and test cases.
                        </p>
                      </div>
                    ) : (
                      adminCoding.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-black/10 dark:border-white/15 transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <h5 className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{p.title}</h5>
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
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7]/80">
                                {p.points || 30} pts
                              </span>
                              {canManageSelected && (
                                <button
                                  onClick={() => handleDeleteCoding(idx)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-[11px] text-text-muted pl-8">
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
                        <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                          <span>UI/UX & Figma Design Challenge Configuration</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            Figma Prototype
                          </span>
                        </h4>
                        <p className="text-xs text-text-muted mt-0.5">
                          Upload reference designs, define user stories & problem statement, and provide starter Figma links.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] border border-black/5 dark:border-white/10">
                        {designPoints} Total Pts
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSaveDesignChallenge} className="space-y-6">
                    {/* SECTION 1: REFERENCE DESIGN IMAGE UPLOAD */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5">
                            <ImageIcon size={14} className="text-pink-400" />
                            <span>Design Reference Mockup Image</span>
                            <span className="text-rose-400">*</span>
                          </label>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Upload a high-resolution design mockup/wireframe that students must replicate or take inspiration from.
                          </p>
                        </div>
                        {designImageUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewModalImg(designImageUrl)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5 transition-colors"
                          >
                            <Maximize2 size={12} />
                            <span>Preview Fullscreen</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* Upload Controls */}
                        <div className="space-y-3">
                          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-black/10 dark:border-white/15 hover:border-pink-500/50 rounded-2xl cursor-pointer bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileUpload}
                              disabled={uploadingDesignImg || !canManageSelected}
                              className="hidden"
                            />
                            {uploadingDesignImg ? (
                              <div className="flex flex-col items-center gap-2 py-3 text-pink-400">
                                <Loader2 size={24} className="animate-spin" />
                                <span className="text-xs font-semibold">Uploading to Cloudinary...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-center py-2">
                                <div className="w-10 h-10 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Upload size={18} />
                                </div>
                                <span className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-pink-300 transition-colors">
                                  Click or Drag Image Here
                                </span>
                                <span className="text-[10px] text-text-muted">
                                  PNG, JPG, SVG, WEBP up to 10MB
                                </span>
                              </div>
                            )}
                          </label>

                          <div className="relative">
                            <span className="text-[11px] text-text-muted block mb-1">Or paste direct image URL:</span>
                            <input
                              type="url"
                              value={designImageUrl}
                              onChange={(e) => setDesignImageUrl(e.target.value)}
                              placeholder="https://res.cloudinary.com/... or image link"
                              disabled={!canManageSelected}
                              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-white/30 focus:border-pink-500 outline-none"
                            />
                          </div>
                        </div>

                        {/* Image Preview Box */}
                        <div className="h-52 rounded-2xl border border-black/5 dark:border-white/10 bg-black/40 overflow-hidden flex items-center justify-center relative group">
                          {designImageUrl ? (
                            <>
                              <img
                                src={designImageUrl}
                                alt="Design Reference"
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewModalImg(designImageUrl)}
                                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm transition-all"
                                >
                                  <Maximize2 size={13} />
                                  <span>Inspect</span>
                                </button>
                                {canManageSelected && (
                                  <button
                                    type="button"
                                    onClick={() => setDesignImageUrl('')}
                                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm transition-all"
                                  >
                                    <Trash2 size={13} />
                                    <span>Remove</span>
                                  </button>
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
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/10 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">
                            Challenge Title <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={designTitle}
                            onChange={(e) => setDesignTitle(e.target.value)}
                            placeholder="e.g. Modern Fintech Banking App Mobile & Desktop UI"
                            disabled={!canManageSelected}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-white/30 focus:border-pink-500 outline-none disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">
                            Total Points
                          </label>
                          <input
                            type="number"
                            min={10}
                            value={designPoints}
                            onChange={(e) => setDesignPoints(Number(e.target.value))}
                            disabled={!canManageSelected}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] font-mono outline-none disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">
                          Brief Overview / Description
                        </label>
                        <input
                          type="text"
                          value={designDesc}
                          onChange={(e) => setDesignDesc(e.target.value)}
                          placeholder="e.g. Design a sleek, high-conversion crypto & banking experience with rich micro-interactions."
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-white/30 focus:border-pink-500 outline-none disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5">
                          Problem Statement & Functional Requirements
                        </label>
                        <textarea
                          rows={4}
                          value={designProblem}
                          onChange={(e) => setDesignProblem(e.target.value)}
                          placeholder="Detail the target audience, user personas, key flows (Onboarding, Dashboard, Transactions), design constraints, and expected user journeys..."
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-white/30 focus:border-pink-500 outline-none resize-none disabled:opacity-50 leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80 mb-1.5 flex items-center justify-between">
                          <span>Reference / Starter Figma URL (Optional)</span>
                          <span className="text-[10px] text-text-muted">Students can duplicate this file</span>
                        </label>
                        <input
                          type="url"
                          value={designRefFigma}
                          onChange={(e) => setDesignRefFigma(e.target.value)}
                          placeholder="https://www.figma.com/file/... (starter kit / UI kit)"
                          disabled={!canManageSelected}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-white/30 focus:border-pink-500 outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* SECTION 3: DELIVERABLES CHECKLIST */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">Expected Deliverables</h5>
                          <p className="text-[11px] text-text-muted">Items students must complete in their Figma file.</p>
                        </div>
                        {canManageSelected && (
                          <button
                            type="button"
                            onClick={() => setDesignDeliverables([...designDeliverables, ''])}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 flex items-center gap-1 transition-colors"
                          >
                            <Plus size={12} />
                            <span>Add Deliverable</span>
                          </button>
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
                              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-white/20 outline-none focus:border-pink-500 disabled:opacity-50"
                            />
                            {canManageSelected && designDeliverables.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setDesignDeliverables(designDeliverables.filter((_, i) => i !== idx))}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 4: GUIDELINES & EVALUATION CRITERIA */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">Guidelines & Evaluation Criteria</h5>
                          <p className="text-[11px] text-text-muted">Rubric used by admins when grading design links.</p>
                        </div>
                        {canManageSelected && (
                          <button
                            type="button"
                            onClick={() => setDesignGuidelines([...designGuidelines, ''])}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 flex items-center gap-1 transition-colors"
                          >
                            <Plus size={12} />
                            <span>Add Guideline</span>
                          </button>
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
                              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-white/20 outline-none focus:border-purple-500 disabled:opacity-50"
                            />
                            {canManageSelected && designGuidelines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setDesignGuidelines(designGuidelines.filter((_, i) => i !== idx))}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SAVE BUTTON */}
                    {canManageSelected && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-bold shadow-lg shadow-pink-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading && <Loader2 size={14} className="animate-spin" />}
                          <CheckCircle2 size={14} />
                          <span>Save Design Challenge</span>
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* TAB 3.8: TEAMS MANAGEMENT (MANUAL ALLOCATION) */}
              {activeTab === 'teams' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                        <Users size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                          <span>Arena Teams & Manual Allocation</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {arenaTeams.length} Teams
                          </span>
                        </h4>
                        <p className="text-xs text-text-muted mt-0.5">
                          Manually form teams and assign participants for team-mode arena rounds.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Create Team Form */}
                  {canManageSelected && (
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/10 space-y-4">
                      <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                        <Plus size={14} className="text-blue-400" />
                        <span>Create New Team</span>
                      </h4>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={teamNameInput}
                          onChange={(e) => setTeamNameInput(e.target.value)}
                          placeholder="Enter team name (e.g. Code Phoenix, DevSquad)..."
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-white/30 outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          disabled={actionLoading || !teamNameInput.trim()}
                          onClick={async () => {
                            if (!teamNameInput.trim()) return;
                            await createArenaTeam(event._id, {
                              name: teamNameInput.trim(),
                              memberUserIds: [],
                            });
                            setTeamNameInput('');
                          }}
                          className="px-5 py-2.5 min-h-[40px] rounded-xl bg-blue-600 hover:bg-blue-500 text-[#1D1D1F] dark:text-[#F5F5F7] font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading && <Loader2 size={13} className="animate-spin" />}
                          <Plus size={13} />
                          <span>Create Team</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Existing Teams List */}
                  {arenaTeams.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/10 text-center space-y-2">
                      <Users size={28} className="mx-auto text-[#1D1D1F] dark:text-[#F5F5F7]/30" />
                      <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">No Teams Formed Yet</h4>
                      <p className="text-xs text-text-muted max-w-sm mx-auto">
                        Create teams above to assign participants. Students in team-mode rounds will share submissions and scoring.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {arenaTeams.map((team) => (
                        <div
                          key={team._id}
                          className="p-4 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/10 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xs">
                                👥
                              </span>
                              <div>
                                <h5 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{team.name}</h5>
                                <p className="text-[10px] text-[#1D1D1F] dark:text-[#F5F5F7]/50">{team.members.length} members</p>
                              </div>
                            </div>

                            {canManageSelected && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Delete team "${team.name}"?`)) {
                                    deleteArenaTeam(event._id, team._id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-[#1D1D1F] dark:text-[#F5F5F7]/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          {/* Member List */}
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {team.members.length === 0 ? (
                              <p className="text-[11px] text-[#1D1D1F] dark:text-[#F5F5F7]/40 italic">No members assigned yet.</p>
                            ) : (
                              team.members.map((mem) => (
                                <div
                                  key={mem._id}
                                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]/80"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10 shrink-0">
                                      <img
                                        src={mem.profilePicUrl || `https://ui-avatars.com/api/?name=${mem.name}&size=40`}
                                        alt={mem.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <span className="truncate font-semibold text-[11px]">{mem.name}</span>
                                    {mem.rollNo && (
                                      <span className="text-[10px] text-[#1D1D1F] dark:text-[#F5F5F7]/40 font-mono">({mem.rollNo})</span>
                                    )}
                                  </div>

                                  {canManageSelected && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const remaining = team.members
                                          .filter((m) => m._id !== mem._id)
                                          .map((m) => m._id);
                                        assignArenaTeamMembers(event._id, team._id, {
                                          memberUserIds: remaining,
                                        });
                                      }}
                                      className="text-[#1D1D1F] dark:text-[#F5F5F7]/40 hover:text-rose-400 text-xs px-1"
                                      title="Remove member"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SUBMISSIONS & LEADERBOARD */}
              {activeTab === 'submissions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">Student Submissions</h4>
                      <p className="text-xs text-text-muted">
                        Total {adminSubmissions.length} submissions for "{selectedAssessment.title}"
                      </p>
                    </div>
                  </div>

                  {adminSubmissions.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white/[0.02] border border-black/5 dark:border-white/10 text-center space-y-2">
                      <Award size={28} className="mx-auto text-[#1D1D1F] dark:text-[#F5F5F7]/30" />
                      <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">No Submissions Yet</h4>
                      <p className="text-xs text-text-muted">
                        Submissions from students who complete this assessment will appear here with complete details.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-black/5 dark:border-white/10 overflow-hidden bg-white/[0.01]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 border-b border-black/5 dark:border-white/10 text-text-muted uppercase text-[10px]">
                          <tr>
                            <th className="p-3">Rank & Student</th>
                            <th className="p-3">Residence</th>
                            <th className="p-3">Score</th>
                            <th className="p-3">Percentage</th>
                            <th className="p-3">Result</th>
                            <th className="p-3">Figma / Work</th>
                            <th className="p-3">Submitted At</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {adminSubmissions.map((sub, idx) => (
                            <tr key={sub._id || idx} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-mono text-text-muted w-4">#{idx + 1}</span>
                                  <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10 shrink-0">
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
                                    <p className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{sub.userId?.name || 'Student'}</p>
                                    <p className="text-[10px] text-text-muted">
                                      {sub.userId?.rollNo || sub.userId?.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                {sub.userId?.residenceType ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-black/5 dark:border-white/10 text-purple-300">
                                    {sub.userId.residenceType === 'Hosteller' ? (
                                      <Building size={10} />
                                    ) : (
                                      <Bus size={10} />
                                    )}
                                    <span>{sub.userId.residenceType}</span>
                                  </span>
                                ) : (
                                  <span className="text-text-muted text-[10px]">—</span>
                                )}
                              </td>
                              <td className="p-3 font-mono font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                                {sub.totalScore} / {sub.maxPossibleScore}
                              </td>
                              <td className="p-3 font-mono text-[#1D1D1F] dark:text-[#F5F5F7]/80">{sub.scorePercentage}%</td>
                              <td className="p-3">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    sub.isPassed
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {sub.isPassed ? 'Passed' : 'Failed'}
                                </span>
                              </td>
                              <td className="p-3">
                                {sub.designSubmission?.figmaLink ? (
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <a
                                        href={sub.designSubmission.figmaLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-400 hover:text-pink-300 underline underline-offset-2"
                                      >
                                        <Palette size={11} />
                                        <span>Figma File</span>
                                        <ExternalLink size={10} />
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewFigmaUrl(sub.designSubmission.figmaLink)}
                                        className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 hover:bg-white/20 text-[#1D1D1F] dark:text-[#F5F5F7] font-medium"
                                      >
                                        Embed
                                      </button>
                                    </div>
                                    {sub.designSubmission.isEvaluated ? (
                                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                        <CheckCircle size={10} />
                                        <span>Graded: {sub.designSubmission.pointsEarned} pts</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-amber-400 font-semibold">
                                        Pending Review
                                      </span>
                                    )}
                                    {sub.designSubmission.notes && (
                                      <p className="text-[10px] text-text-muted italic truncate max-w-[150px]">
                                        "{sub.designSubmission.notes}"
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-text-muted text-[10px]">—</span>
                                )}
                              </td>
                              <td className="p-3 text-[11px] text-text-muted">
                                {sub.submittedAt
                                  ? new Date(sub.submittedAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'In Progress'}
                              </td>
                              <td className="p-3 text-right">
                                {sub.designSubmission?.figmaLink && canManageSelected ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEvaluatingSub(sub);
                                      setEvalPoints(sub.designSubmission?.pointsEarned || 0);
                                      setEvalFeedback(sub.designSubmission?.feedback || '');
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 transition-all inline-flex items-center gap-1"
                                  >
                                    <Award size={11} />
                                    <span>{sub.designSubmission?.isEvaluated ? 'Re-grade' : 'Grade'}</span>
                                  </button>
                                ) : (
                                  <span className="text-text-muted text-[10px]">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <Layers size={36} className="text-purple-400/50" />
            <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">No Assessments Created Yet</h3>
            <p className="text-xs text-text-muted max-w-md">
              Create the first assessment for this Event Arena. You can create as many assessments as needed
              and assign admins to curate each one.
            </p>
            <button
              onClick={() => setIsCreatingNew(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Create First Assessment</span>
            </button>
          </div>
        )}

        {/* BULK UPLOAD SUB-MODAL */}
        <AnimatePresence>
          {bulkModalType && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-2xl bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/15 p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-purple-400" />
                    <span>Upload {bulkModalType.toUpperCase()} Questions</span>
                  </h3>
                  <button
                    onClick={() => {
                      setBulkModalType(null);
                      setBulkFile(null);
                    }}
                    className="text-text-muted hover:text-[#1D1D1F] dark:text-[#F5F5F7]"
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="text-xs text-text-muted">
                  Upload an Excel (.xlsx) or JSON file formatted according to the sample template. Questions
                  will be added directly to{' '}
                  <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">"{selectedAssessment?.title}"</span>.
                </p>

                <div className="p-6 rounded-xl border-2 border-dashed border-black/10 dark:border-white/15 hover:border-purple-500/50 text-center space-y-2 cursor-pointer transition-colors bg-white/[0.01]">
                  <Upload size={24} className="mx-auto text-purple-400" />
                  <div>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.json"
                      onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="bulk-file-input"
                    />
                    <label
                      htmlFor="bulk-file-input"
                      className="text-xs font-bold text-purple-400 hover:text-purple-300 cursor-pointer"
                    >
                      Browse file from device
                    </label>
                  </div>
                  {bulkFile && (
                    <p className="text-xs text-[#1D1D1F] dark:text-[#F5F5F7] font-mono truncate px-4">{bulkFile.name}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setBulkModalType(null);
                      setBulkFile(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-text-muted hover:text-[#1D1D1F] dark:text-[#F5F5F7]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={!bulkFile || actionLoading}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-bold shadow-md shadow-purple-600/30 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {actionLoading && <Loader2 size={12} className="animate-spin" />}
                    <span>Upload Now</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* DESIGN IMAGE FULLSCREEN LIGHTBOX */}
        <AnimatePresence>
          {previewModalImg && (
            <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center"
              >
                <div className="w-full flex justify-between items-center pb-3 text-[#1D1D1F] dark:text-[#F5F5F7]">
                  <span className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]/80">Reference Design Mockup</span>
                  <button
                    onClick={() => setPreviewModalImg(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#1D1D1F] dark:text-[#F5F5F7]"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="overflow-auto max-h-[82vh] rounded-2xl border border-black/10 dark:border-white/20 bg-black/60 p-2">
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
            <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-5xl h-[85vh] rounded-2xl bg-[#FFFFFF] dark:bg-[#1C1C1E] border border-black/10 dark:border-white/20 shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="px-6 py-3.5 border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                      <Palette size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">Interactive Figma Prototype Embed</h4>
                      <a
                        href={previewFigmaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-pink-400 hover:text-pink-300 underline inline-flex items-center gap-1"
                      >
                        <span>Open directly in Figma</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewFigmaUrl(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#1D1D1F] dark:text-[#F5F5F7]"
                  >
                    <X size={16} />
                  </button>
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

        {/* DESIGN SUBMISSION EVALUATION DRAWER / MODAL */}
        </div>
      </ResponsiveModal>

      {/* Evaluation Sub-Modal */}
      {evaluatingSub && (
        <ResponsiveModal
          open={Boolean(evaluatingSub)}
          onOpenChange={(open) => {
            if (!open) setEvaluatingSub(null);
          }}
          title={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
                <Award size={16} />
              </div>
              <span className="truncate">Evaluate Figma Design</span>
            </div>
          }
          description={
            <span>
              Student: <strong className="text-label-primary dark:text-[#F5F5F7]">{evaluatingSub.userId?.name}</strong> ({evaluatingSub.userId?.rollNo || evaluatingSub.userId?.email})
            </span>
          }
          dialogClassName="sm:max-w-lg p-6"
          footer={
            <div className="flex justify-end gap-2 pt-2 border-t border-separator dark:border-white/10 w-full">
              <button
                type="button"
                onClick={() => setEvaluatingSub(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-label-secondary hover:text-label-primary hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEvaluateSubmit}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading && <Loader2 size={13} className="animate-spin" />}
                <CheckCircle2 size={13} />
                <span>Save Evaluation</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4 pt-1">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-separator dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Submitted Figma Link:</span>
                <a
                  href={evaluatingSub.designSubmission?.figmaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 font-mono underline inline-flex items-center gap-1"
                >
                  <span>Open Figma</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              {evaluatingSub.designSubmission?.notes && (
                <div className="pt-1 text-xs">
                  <span className="text-text-muted block text-[10px] uppercase font-bold tracking-wider mb-0.5">Student Notes:</span>
                  <p className="text-[#1D1D1F] dark:text-[#F5F5F7]/80 bg-white/5 p-2 rounded-lg text-[11px] leading-relaxed">
                    {evaluatingSub.designSubmission.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">Awarded Points</label>
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
                <label className="block text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1.5">
                  Reviewer Feedback / Comments
                </label>
                <textarea
                  rows={3}
                  value={evalFeedback}
                  onChange={(e) => setEvalFeedback(e.target.value)}
                  placeholder="e.g. Excellent layout spacing, responsive auto-layout implemented cleanly. Typography hierarchy is on point!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-separator dark:border-white/10 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-white/30 focus:border-pink-500 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        </ResponsiveModal>
      )}
    </>
  );
};

export default EventArenaAdminModal;
