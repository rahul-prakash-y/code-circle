import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import useEventArenaStore, {
  ArenaAdminCandidate,
  ArenaMcqQuestion,
  ArenaCodingProblem,
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
    fetchAdminArenaData,
    updateArenaConfig,
    saveArenaMcqs,
    saveArenaCodingProblems,
    bulkUploadArenaQuestions,
    downloadArenaTemplate,
    fetchAdminSubmissions,
    adminCandidates,
    adminArenaEvent,
    adminMcqs,
    adminCoding,
    adminSubmissions,
    loading,
    actionLoading,
  } = useEventArenaStore();

  const [activeTab, setActiveTab] = useState<'settings' | 'mcq' | 'coding' | 'submissions'>(
    'settings'
  );

  // Settings State
  const [hasArena, setHasArena] = useState(false);
  const [arenaType, setArenaType] = useState<'CODING' | 'MCQ' | 'HYBRID'>('HYBRID');
  const [arenaStatus, setArenaStatus] = useState<'DRAFT' | 'UPCOMING' | 'LIVE' | 'ENDED'>('LIVE');
  const [arenaDuration, setArenaDuration] = useState(60);
  const [arenaPassingScore, setArenaPassingScore] = useState(50);
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
  const [adminSearch, setAdminSearch] = useState('');

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

  const isSuperAdmin = user?.role === 'SuperAdmin';

  const isAssignedAdmin = useMemo(() => {
    if (!user || !event) return false;
    if (isSuperAdmin) return true;
    const adminList = adminArenaEvent?.arenaAdmins || event.arenaAdmins || [];
    return adminList.some((adm: any) => {
      const id = adm?._id ? adm._id.toString() : adm.toString();
      return id === (user.id || user._id)?.toString();
    });
  }, [user, event, isSuperAdmin, adminArenaEvent]);

  const canEditQuestions = isSuperAdmin || isAssignedAdmin;

  useEffect(() => {
    if (isOpen && event?._id) {
      fetchAdminCandidates();
      fetchAdminArenaData(event._id);
      fetchAdminSubmissions(event._id);

      // Initialize config values
      setHasArena(Boolean(event.hasArena));
      setArenaType(event.arenaType || 'HYBRID');
      setArenaStatus(event.arenaStatus || 'LIVE');
      setArenaDuration(event.arenaDurationMinutes || 60);
      setArenaPassingScore(event.arenaPassingPercentage || 50);

      const assigned = (event.arenaAdmins || []).map((adm: any) =>
        adm?._id ? adm._id.toString() : adm.toString()
      );
      setSelectedAdminIds(assigned);
    }
  }, [isOpen, event?._id]);

  useEffect(() => {
    if (adminArenaEvent) {
      setHasArena(Boolean(adminArenaEvent.hasArena));
      setArenaType(adminArenaEvent.arenaType || 'HYBRID');
      setArenaStatus(adminArenaEvent.arenaStatus || 'LIVE');
      setArenaDuration(adminArenaEvent.arenaDurationMinutes || 60);
      setArenaPassingScore(adminArenaEvent.arenaPassingPercentage || 50);

      if (adminArenaEvent.arenaAdmins) {
        const assigned = adminArenaEvent.arenaAdmins.map((adm: any) =>
          adm?._id ? adm._id.toString() : adm.toString()
        );
        setSelectedAdminIds(assigned);
      }
    }
  }, [adminArenaEvent]);

  if (!isOpen || !event) return null;

  // Filter admin candidates for SuperAdmin selection
  const filteredCandidates = adminCandidates.filter((cand) => {
    const q = adminSearch.toLowerCase();
    return (
      cand.name.toLowerCase().includes(q) ||
      cand.email.toLowerCase().includes(q) ||
      (cand.rollNo && cand.rollNo.toLowerCase().includes(q))
    );
  });

  const toggleAdminSelection = (candId: string) => {
    if (!isSuperAdmin) return;
    setSelectedAdminIds((prev) =>
      prev.includes(candId) ? prev.filter((id) => id !== candId) : [...prev, candId]
    );
  };

  const handleSaveConfig = async () => {
    try {
      await updateArenaConfig(event._id, {
        hasArena,
        arenaType,
        arenaStatus,
        arenaDurationMinutes: Number(arenaDuration),
        arenaPassingPercentage: Number(arenaPassingScore),
        ...(isSuperAdmin ? { arenaAdmins: selectedAdminIds } : {}),
      });
      if (onSuccess) onSuccess();
    } catch {
      // toast already shown in store
    }
  };

  const handleAddMcq = async () => {
    if (!newQuestionText.trim()) {
      return toast.error('Please enter question text');
    }
    const filteredOptions = newOptions.map((o) => o.trim()).filter(Boolean);
    if (filteredOptions.length < 2) {
      return toast.error('Please provide at least 2 valid options');
    }

    const question: ArenaMcqQuestion = {
      question: newQuestionText.trim(),
      options: filteredOptions,
      correctOptionIndex: newCorrectIndex,
      points: Number(newMcqPoints) || 10,
      explanation: newExplanation.trim(),
    };

    try {
      await saveArenaMcqs(event._id, [...adminMcqs, question], 'replace');
      setNewQuestionText('');
      setNewOptions(['', '', '', '']);
      setNewCorrectIndex(0);
      setNewExplanation('');
      setShowAddMcq(false);
      toast.success('Question added successfully!');
    } catch {
      // error handled
    }
  };

  const handleDeleteMcq = async (idxToDelete: number) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    const updated = adminMcqs.filter((_, idx) => idx !== idxToDelete);
    try {
      await saveArenaMcqs(event._id, updated, 'replace');
      toast.success('Question deleted');
    } catch {
      // error handled
    }
  };

  const handleAddCoding = async () => {
    if (!newCodingTitle.trim() || !newCodingDesc.trim()) {
      return toast.error('Please provide problem title and description');
    }

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

    const problem: ArenaCodingProblem = {
      title: newCodingTitle.trim(),
      description: newCodingDesc.trim(),
      difficulty: newCodingDiff,
      points: Number(newCodingPoints) || 30,
      allowedLanguages: ['python', 'javascript', 'cpp', 'java', 'c'],
      sampleInput: newSampleInput.trim(),
      sampleOutput: newSampleOutput.trim(),
      testCases,
    };

    try {
      await saveArenaCodingProblems(event._id, [...adminCoding, problem], 'replace');
      setNewCodingTitle('');
      setNewCodingDesc('');
      setNewSampleInput('');
      setNewSampleOutput('');
      setNewHiddenInput('');
      setNewHiddenOutput('');
      setShowAddCoding(false);
      toast.success('Coding problem added successfully!');
    } catch {
      // error handled
    }
  };

  const handleDeleteCoding = async (idxToDelete: number) => {
    if (!window.confirm('Are you sure you want to delete this coding problem?')) return;
    const updated = adminCoding.filter((_, idx) => idx !== idxToDelete);
    try {
      await saveArenaCodingProblems(event._id, updated, 'replace');
      toast.success('Problem deleted');
    } catch {
      // error handled
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile || !bulkModalType) return;
    try {
      await bulkUploadArenaQuestions(event._id, bulkFile, bulkModalType, 'append');
      setBulkModalType(null);
      setBulkFile(null);
    } catch {
      // handled
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-5xl my-auto bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[90vh]"
      >
        {/* ================================================================= */}
        {/* MODAL HEADER                                                      */}
        {/* ================================================================= */}
        <div className="p-5 sm:p-6 border-b border-separator dark:border-white/10 bg-canvas/40 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-pink-500/20 text-indigo-500 shadow-sm">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-label-primary dark:text-[#F5F5F7] tracking-tight font-heading">
                  Event Arena Hub
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25">
                  {event.title}
                </span>
                {hasArena && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Arena Active
                  </span>
                )}
              </div>
              <p className="text-xs text-label-secondary dark:text-[#86868B] font-medium mt-0.5">
                Configure assessments, upload coding/MCQ questions, and manage author access.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-label-secondary hover:text-label-primary hover:bg-canvas dark:hover:bg-white/10 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Clear Authorization Banner */}
        <div className="px-6 py-2.5 bg-canvas/60 dark:bg-white/[0.015] border-b border-separator dark:border-white/5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {isSuperAdmin ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-purple-600 dark:text-purple-400">
                <Crown size={15} />
                <span>SuperAdmin Master Authorization: Full Access & Admin Assignment</span>
              </span>
            ) : isAssignedAdmin ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={15} />
                <span>Designated Question Coordinator: Authorized by SuperAdmin to manage questions</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <AlertCircle size={15} />
                <span>View Only: Question management restricted to SuperAdmin & designated Arena Admins</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-label-secondary">
            <span>MCQs: <strong>{adminMcqs.length}</strong></span>
            <span>•</span>
            <span>Coding: <strong>{adminCoding.length}</strong></span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SEGMENTED NAVIGATION TABS                                         */}
        {/* ================================================================= */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-separator dark:border-white/5 bg-surface dark:bg-[#121214] shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-label-secondary hover:text-label-primary'
            }`}
          >
            <Settings size={15} />
            <span>Settings & Assigned Admins</span>
          </button>

          <button
            onClick={() => setActiveTab('mcq')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'mcq'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-label-secondary hover:text-label-primary'
            }`}
          >
            <HelpCircle size={15} />
            <span>MCQ Questions ({adminMcqs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('coding')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'coding'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-label-secondary hover:text-label-primary'
            }`}
          >
            <Code2 size={15} />
            <span>Coding Challenges ({adminCoding.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'submissions'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-label-secondary hover:text-label-primary'
            }`}
          >
            <Award size={15} />
            <span>Submissions ({adminSubmissions.length})</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* MODAL BODY (SCROLLABLE)                                           */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: SETTINGS & ASSIGNED ADMINS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="p-4 sm:p-5 rounded-2xl bg-canvas/50 dark:bg-white/[0.02] border border-separator dark:border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-label-primary dark:text-white">
                      Enable Event Arena Assessments
                    </h3>
                    <p className="text-xs text-label-secondary mt-0.5">
                      Allow enrolled participants to enter the Event Arena to complete coding and MCQ assessments.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasArena}
                      onChange={(e) => setHasArena(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 dark:bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-separator dark:border-white/5">
                  <div>
                    <label className="block text-xs font-bold text-label-primary dark:text-white mb-1.5">
                      Assessment Format
                    </label>
                    <select
                      value={arenaType}
                      onChange={(e) => setArenaType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-xs font-semibold text-label-primary dark:text-white outline-none focus:border-indigo-500"
                    >
                      <option value="HYBRID">Hybrid (MCQ + Coding)</option>
                      <option value="CODING">Coding Challenges Only</option>
                      <option value="MCQ">MCQ Assessment Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-label-primary dark:text-white mb-1.5">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={360}
                      value={arenaDuration}
                      onChange={(e) => setArenaDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-xs font-semibold text-label-primary dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-label-primary dark:text-white mb-1.5">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={arenaPassingScore}
                      onChange={(e) => setArenaPassingScore(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-xs font-semibold text-label-primary dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: SUPERADMIN ASSIGN QUESTION COORDINATORS */}
              <div className="p-4 sm:p-5 rounded-2xl bg-canvas/50 dark:bg-white/[0.02] border border-separator dark:border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-purple-500" />
                      <h3 className="text-sm font-bold text-label-primary dark:text-white">
                        Designated Arena Question Authors (Admins)
                      </h3>
                      {isSuperAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          SuperAdmin Control
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-label-secondary mt-0.5">
                      {isSuperAdmin
                        ? 'Select which Admins / Faculty members have authority to upload and curate questions for this Event Arena.'
                        : 'Only the Admins selected by SuperAdmin below are permitted to upload or edit questions.'}
                    </p>
                  </div>

                  {isSuperAdmin && (
                    <div className="relative w-full sm:w-64">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-label-secondary"
                      />
                      <input
                        type="text"
                        placeholder="Search admins..."
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-xs outline-none focus:border-purple-500 text-label-primary dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Selected Admins Pill Display */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedAdminIds.length === 0 ? (
                    <p className="text-xs text-label-secondary italic">
                      No designated admins assigned yet. Only SuperAdmins can currently upload questions.
                    </p>
                  ) : (
                    adminCandidates
                      .filter((c) => selectedAdminIds.includes(c._id))
                      .map((admin) => (
                        <span
                          key={admin._id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 shadow-sm"
                        >
                          <ShieldCheck size={13} />
                          <span>{admin.name}</span>
                          <span className="text-[10px] text-purple-500/80">({admin.role})</span>
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => toggleAdminSelection(admin._id)}
                              className="ml-1 hover:text-red-500 cursor-pointer"
                              title="Remove access"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </span>
                      ))
                  )}
                </div>

                {/* SuperAdmin Selection Grid */}
                {isSuperAdmin && (
                  <div className="pt-3 border-t border-separator dark:border-white/5">
                    <p className="text-[11px] font-bold text-label-secondary mb-2 uppercase tracking-wider">
                      Available Administrators & Faculty ({filteredCandidates.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto pr-1">
                      {filteredCandidates.map((cand) => {
                        const isSelected = selectedAdminIds.includes(cand._id);
                        return (
                          <div
                            key={cand._id}
                            onClick={() => toggleAdminSelection(cand._id)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-purple-500/10 border-purple-500/40 text-purple-900 dark:text-purple-200'
                                : 'bg-surface dark:bg-[#1C1C1E] border-separator dark:border-white/5 hover:border-separator-active text-label-primary dark:text-white'
                            }`}
                          >
                            <div className="truncate">
                              <p className="text-xs font-bold truncate">{cand.name}</p>
                              <p className="text-[11px] text-label-secondary truncate">{cand.email}</p>
                              <span className="text-[10px] text-label-secondary font-medium">
                                {cand.role} {cand.department ? `• ${cand.department}` : ''}
                              </span>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 ml-2 transition-colors ${
                                isSelected
                                  ? 'bg-purple-600 border-purple-600 text-white'
                                  : 'border-separator'
                              }`}
                            >
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Save Settings Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  <span>Save Arena Configuration</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MCQ QUESTIONS */}
          {activeTab === 'mcq' && (
            <div className="space-y-5">
              {/* Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-canvas/40 dark:bg-white/[0.02] border border-separator dark:border-white/10">
                <div className="flex items-center gap-2">
                  <HelpCircle size={18} className="text-indigo-500" />
                  <span className="text-sm font-bold text-label-primary dark:text-white">
                    MCQ Question Bank ({adminMcqs.length})
                  </span>
                  <span className="text-xs text-label-secondary">
                    Total MCQ Points: {adminMcqs.reduce((s, q) => s + (q.points || 10), 0)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadArenaTemplate(event._id, 'mcq')}
                    className="px-3 py-1.5 rounded-xl bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-xs font-semibold text-label-primary dark:text-white hover:bg-canvas transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download Template</span>
                  </button>

                  {canEditQuestions && (
                    <>
                      <button
                        type="button"
                        onClick={() => setBulkModalType('mcq')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 text-xs font-semibold hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet size={13} />
                        <span>Bulk Upload MCQs</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAddMcq(!showAddMcq)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>{showAddMcq ? 'Cancel' : 'Add MCQ'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Add MCQ Form */}
              {showAddMcq && canEditQuestions && (
                <div className="p-5 rounded-2xl bg-surface-raised dark:bg-[#18181A] border border-indigo-500/30 space-y-4 shadow-lg">
                  <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider">
                    Add New Multiple Choice Question
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-label-primary dark:text-white mb-1">
                      Question Text
                    </label>
                    <textarea
                      rows={2}
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Enter the question statement..."
                      className="w-full p-3 rounded-xl bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 text-xs outline-none focus:border-indigo-500 text-label-primary dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {newOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNewCorrectIndex(i)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border transition-colors ${
                            newCorrectIndex === i
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-surface dark:bg-[#121214] border-separator text-label-secondary'
                          }`}
                          title={newCorrectIndex === i ? 'Correct Option' : 'Mark as Correct'}
                        >
                          {String.fromCharCode(65 + i)}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newOptions];
                            updated[i] = e.target.value;
                            setNewOptions(updated);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          className="w-full px-3 py-2 rounded-xl bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 text-xs outline-none focus:border-indigo-500 text-label-primary dark:text-white"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-label-primary dark:text-white mb-1">
                        Points
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newMcqPoints}
                        onChange={(e) => setNewMcqPoints(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 text-xs text-label-primary dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-label-primary dark:text-white mb-1">
                        Explanation (Optional)
                      </label>
                      <input
                        type="text"
                        value={newExplanation}
                        onChange={(e) => setNewExplanation(e.target.value)}
                        placeholder="Brief explanation for students after grading..."
                        className="w-full px-3 py-2 rounded-xl bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 text-xs text-label-primary dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMcq(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-label-secondary hover:text-label-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddMcq}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
                    >
                      Save Question
                    </button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              {adminMcqs.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-separator dark:border-white/10 rounded-2xl">
                  <HelpCircle size={32} className="mx-auto text-label-secondary mb-2" />
                  <p className="text-xs font-bold text-label-primary dark:text-white">
                    No MCQ Questions Added Yet
                  </p>
                  <p className="text-[11px] text-label-secondary mt-1">
                    Upload questions in bulk via Excel or add them manually using the button above.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adminMcqs.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-canvas/40 dark:bg-white/[0.02] border border-separator dark:border-white/10 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/20">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-label-primary dark:text-white">
                              {q.question}
                            </p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                              {q.points || 10} Points
                            </span>
                          </div>
                        </div>

                        {canEditQuestions && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMcq(idx)}
                            className="p-1.5 rounded-lg text-label-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete Question"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-8">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.correctOptionIndex === optIdx;
                          return (
                            <div
                              key={optIdx}
                              className={`p-2 rounded-xl text-xs flex items-center gap-2 border ${
                                isCorrect
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-semibold'
                                  : 'bg-surface dark:bg-[#1C1C1E] border-separator text-label-secondary'
                              }`}
                            >
                              <span className="font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                              <span className="truncate">{opt}</span>
                              {isCorrect && (
                                <span className="ml-auto text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  ✓ Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CODING PROBLEMS */}
          {activeTab === 'coding' && (
            <div className="space-y-5">
              {/* Actions Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-canvas/40 dark:bg-white/[0.02] border border-separator dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Code2 size={18} className="text-purple-500" />
                  <span className="text-sm font-bold text-label-primary dark:text-white">
                    Coding Challenges ({adminCoding.length})
                  </span>
                  <span className="text-xs text-label-secondary">
                    Total Coding Points: {adminCoding.reduce((s, p) => s + (p.points || 30), 0)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadArenaTemplate(event._id, 'coding')}
                    className="px-3 py-1.5 rounded-xl bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-xs font-semibold text-label-primary dark:text-white hover:bg-canvas transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download Template</span>
                  </button>

                  {canEditQuestions && (
                    <>
                      <button
                        type="button"
                        onClick={() => setBulkModalType('coding')}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 text-xs font-semibold hover:bg-purple-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet size={13} />
                        <span>Bulk Upload Coding</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAddCoding(!showAddCoding)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>{showAddCoding ? 'Cancel' : 'Add Problem'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Add Coding Problem Form */}
              {showAddCoding && canEditQuestions && (
                <div className="p-5 rounded-2xl bg-surface-raised dark:bg-[#18181A] border border-purple-500/30 space-y-4 shadow-lg">
                  <h4 className="text-xs font-bold text-purple-500 uppercase tracking-wider">
                    Add New Coding Challenge
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-label-primary dark:text-white mb-1">
                        Problem Title
                      </label>
                      <input
                        type="text"
                        value={newCodingTitle}
                        onChange={(e) => setNewCodingTitle(e.target.value)}
                        placeholder="e.g. Reverse Linked List, Maximum Subarray..."
                        className="w-full px-3 py-2 rounded-xl bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 text-xs outline-none focus:border-purple-500 text-label-primary dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-label-primary dark:text-white mb-1">
                        Difficulty & Points
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={newCodingDiff}
                          onChange={(e) => setNewCodingDiff(e.target.value as any)}
                          className="w-1/2 px-2.5 py-2 rounded-xl bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 text-xs font-semibold outline-none text-label-primary dark:text-white"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                        <input
                          type="number"
                          value={newCodingPoints}
                          onChange={(e) => setNewCodingPoints(Number(e.target.value))}
                          className="w-1/2 px-2.5 py-2 rounded-xl bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 text-xs outline-none text-label-primary dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-label-primary dark:text-white mb-1">
                      Problem Description
                    </label>
                    <textarea
                      rows={3}
                      value={newCodingDesc}
                      onChange={(e) => setNewCodingDesc(e.target.value)}
                      placeholder="Explain the problem statement, constraints, and requirements..."
                      className="w-full p-3 rounded-xl bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 text-xs outline-none focus:border-purple-500 text-label-primary dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-label-primary dark:text-white mb-1">
                        Sample Input (Public Test Case)
                      </label>
                      <textarea
                        rows={2}
                        value={newSampleInput}
                        onChange={(e) => setNewSampleInput(e.target.value)}
                        placeholder="e.g. 5&#10;1 2 3 4 5"
                        className="w-full p-2.5 rounded-xl bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 text-xs font-mono outline-none text-label-primary dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-label-primary dark:text-white mb-1">
                        Sample Expected Output
                      </label>
                      <textarea
                        rows={2}
                        value={newSampleOutput}
                        onChange={(e) => setNewSampleOutput(e.target.value)}
                        placeholder="e.g. 15"
                        className="w-full p-2.5 rounded-xl bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 text-xs font-mono outline-none text-label-primary dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-label-primary dark:text-white mb-1">
                        Hidden Input (Evaluation Test Case)
                      </label>
                      <textarea
                        rows={2}
                        value={newHiddenInput}
                        onChange={(e) => setNewHiddenInput(e.target.value)}
                        placeholder="e.g. 100&#10;..."
                        className="w-full p-2.5 rounded-xl bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 text-xs font-mono outline-none text-label-primary dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-label-primary dark:text-white mb-1">
                        Hidden Expected Output
                      </label>
                      <textarea
                        rows={2}
                        value={newHiddenOutput}
                        onChange={(e) => setNewHiddenOutput(e.target.value)}
                        placeholder="Expected output for hidden evaluation..."
                        className="w-full p-2.5 rounded-xl bg-surface dark:bg-[#121214] border border-separator dark:border-white/10 text-xs font-mono outline-none text-label-primary dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCoding(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-label-secondary hover:text-label-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCoding}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
                    >
                      Save Problem
                    </button>
                  </div>
                </div>
              )}

              {/* Problems List */}
              {adminCoding.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-separator dark:border-white/10 rounded-2xl">
                  <Code2 size={32} className="mx-auto text-label-secondary mb-2" />
                  <p className="text-xs font-bold text-label-primary dark:text-white">
                    No Coding Challenges Added Yet
                  </p>
                  <p className="text-[11px] text-label-secondary mt-1">
                    Upload coding problems in bulk via Excel or create them manually using the button above.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adminCoding.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-canvas/40 dark:bg-white/[0.02] border border-separator dark:border-white/10 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-500/20">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-label-primary dark:text-white">
                                {p.title}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.difficulty === 'Easy'
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : p.difficulty === 'Hard'
                                    ? 'bg-red-500/10 text-red-600'
                                    : 'bg-amber-500/10 text-amber-600'
                                }`}
                              >
                                {p.difficulty}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600">
                                {p.points || 30} Pts
                              </span>
                            </div>
                            <p className="text-xs text-label-secondary line-clamp-2 mt-1">
                              {p.description}
                            </p>
                          </div>
                        </div>

                        {canEditQuestions && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCoding(idx)}
                            className="p-1.5 rounded-lg text-label-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete Problem"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="pl-8 pt-1 flex items-center gap-3 text-[11px] text-label-secondary font-medium">
                        <span>
                          Test Cases: <strong>{(p.testCases || []).length}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Languages: <strong>{(p.allowedLanguages || []).join(', ')}</strong>
                        </span>
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
              <div className="flex items-center justify-between p-4 rounded-2xl bg-canvas/40 dark:bg-white/[0.02] border border-separator dark:border-white/10">
                <span className="text-xs font-bold text-label-primary dark:text-white">
                  Participant Arena Submissions ({adminSubmissions.length})
                </span>
                <span className="text-xs text-label-secondary">
                  Passing Criteria: ≥ {arenaPassingScore}%
                </span>
              </div>

              {adminSubmissions.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-separator dark:border-white/10 rounded-2xl">
                  <Award size={32} className="mx-auto text-label-secondary mb-2" />
                  <p className="text-xs font-bold text-label-primary dark:text-white">
                    No Submissions Recorded Yet
                  </p>
                  <p className="text-[11px] text-label-secondary mt-1">
                    Student scores and evaluation records will appear here as participants complete the Event Arena.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-separator dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-canvas dark:bg-[#1C1C1E] text-label-secondary font-bold border-b border-separator dark:border-white/10">
                      <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Student</th>
                        <th className="p-3">Roll No</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Percentage</th>
                        <th className="p-3">Result</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-separator dark:divide-white/5">
                      {adminSubmissions.map((sub, idx) => {
                        const student = sub.userId || {};
                        return (
                          <tr key={sub._id} className="hover:bg-canvas/50 transition-colors">
                            <td className="p-3 font-bold text-indigo-600">#{idx + 1}</td>
                            <td className="p-3 font-semibold text-label-primary dark:text-white">
                              {student.name || 'Unknown'}
                            </td>
                            <td className="p-3 text-label-secondary font-mono">{student.rollNo || '-'}</td>
                            <td className="p-3 font-bold">
                              {sub.totalScore} / {sub.maxPossibleScore}
                            </td>
                            <td className="p-3 font-bold text-indigo-500">{sub.scorePercentage}%</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  sub.isPassed
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-red-500/10 text-red-600'
                                }`}
                              >
                                {sub.isPassed ? 'Passed' : 'Needs Retake'}
                              </span>
                            </td>
                            <td className="p-3 text-label-secondary font-medium">{sub.status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BULK UPLOAD DIALOG MODAL */}
        {bulkModalType && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-label-primary dark:text-white flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-indigo-500" />
                  <span>Bulk Upload {bulkModalType === 'mcq' ? 'MCQ Questions' : 'Coding Problems'}</span>
                </h4>
                <button
                  onClick={() => {
                    setBulkModalType(null);
                    setBulkFile(null);
                  }}
                  className="p-1 text-label-secondary hover:text-label-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-label-secondary">
                Upload your questions formatted as an Excel spreadsheet (.xlsx, .xls) or JSON file.
              </p>

              <div className="p-4 border-2 border-dashed border-separator dark:border-white/15 rounded-xl text-center space-y-2">
                <Upload size={24} className="mx-auto text-indigo-500" />
                <input
                  type="file"
                  accept=".xlsx, .xls, .json"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="text-xs text-label-secondary file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white cursor-pointer"
                />
                {bulkFile && (
                  <p className="text-xs font-bold text-indigo-500 mt-2 truncate">
                    Selected: {bulkFile.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBulkModalType(null);
                    setBulkFile(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-label-secondary hover:text-label-primary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!bulkFile || actionLoading}
                  onClick={handleBulkUpload}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  <span>Upload Now</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EventArenaAdminModal;
