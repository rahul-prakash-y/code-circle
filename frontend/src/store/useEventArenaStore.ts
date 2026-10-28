import { create } from 'zustand';
import api from '../lib/axios';
import { toast } from 'react-hot-toast';

export interface ArenaAdminCandidate {
  _id: string;
  name: string;
  email: string;
  role: string;
  rollNo?: string;
  profilePicUrl?: string;
  department?: string;
}

export interface ArenaMcqQuestion {
  _id?: string;
  question: string;
  options: string[];
  correctOptionIndex?: number;
  points: number;
  explanation?: string;
}

export interface ArenaCodingTestCase {
  _id?: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface ArenaCodingProblem {
  _id?: string;
  title: string;
  description: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  allowedLanguages: string[];
  starterCode?: Record<string, string>;
  sampleInput?: string;
  sampleOutput?: string;
  testCases: ArenaCodingTestCase[];
}

export interface ArenaDesignChallenge {
  title?: string;
  description?: string;
  problemStatement?: string;
  designImageUrl?: string;
  additionalImages?: string[];
  referenceFigmaUrl?: string;
  deliverables?: string[];
  guidelines?: string[];
  points?: number;
}

export interface ArenaDesignSubmission {
  figmaLink: string;
  notes?: string;
  previewImageUrl?: string;
  submittedAt: string;
  pointsEarned?: number;
  feedback?: string;
  isEvaluated?: boolean;
  evaluatedBy?: any;
  evaluatedAt?: string;
}

export interface ArenaAssessment {
  _id: string;
  title: string;
  description?: string;
  type: 'CODING' | 'MCQ' | 'HYBRID' | 'UI_UX';
  status: 'DRAFT' | 'UPCOMING' | 'LIVE' | 'ENDED';
  durationMinutes: number;
  totalPoints: number;
  passingPercentage: number;
  rules?: string[];
  startTime?: string;
  endTime?: string;
  assignedAdmins: ArenaAdminCandidate[];
  mcqCount?: number;
  codingCount?: number;
  canManage?: boolean;
  designChallenge?: ArenaDesignChallenge;
  submission?: {
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED';
    totalScore: number;
    maxPossibleScore: number;
    scorePercentage: number;
    isPassed: boolean;
    submittedAt?: string;
  } | null;
}

export interface ArenaConfig {
  hasArena: boolean;
  arenaType: 'CODING' | 'MCQ' | 'HYBRID' | 'UI_UX';
  arenaStatus: 'DRAFT' | 'UPCOMING' | 'LIVE' | 'ENDED';
  arenaDurationMinutes: number;
  arenaTotalPoints: number;
  arenaPassingPercentage: number;
  arenaRules: string[];
  arenaStartTime?: string;
  arenaEndTime?: string;
  arenaAdmins?: any[];
  arenaDesignChallenge?: ArenaDesignChallenge;
}

export interface ArenaSubmission {
  _id: string;
  eventId: string;
  assessmentId?: string;
  userId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED';
  startedAt: string;
  submittedAt?: string;
  mcqAnswers?: Array<{
    questionId: string;
    selectedOptionIndex: number;
    isCorrect?: boolean;
    pointsEarned?: number;
  }>;
  codingSubmissions?: Array<{
    problemId: string;
    language: string;
    code: string;
    testCasesPassed: number;
    totalTestCases: number;
    pointsEarned: number;
    status: string;
  }>;
  designSubmission?: ArenaDesignSubmission;
  designScore?: number;
  mcqScore: number;
  codingScore: number;
  totalScore: number;
  maxPossibleScore: number;
  scorePercentage: number;
  isPassed: boolean;
}

interface EventArenaState {
  loading: boolean;
  actionLoading: boolean;
  error: string | null;

  // Multi-Assessment State
  assessments: ArenaAssessment[];
  selectedAssessment: ArenaAssessment | null;

  // Admin state
  adminCandidates: ArenaAdminCandidate[];
  adminArenaEvent: any | null;
  adminMcqs: ArenaMcqQuestion[];
  adminCoding: ArenaCodingProblem[];
  adminDesignChallenge: ArenaDesignChallenge | null;
  adminSubmissions: any[];

  // Student Arena state
  currentEvent: any | null;
  studentMcqs: ArenaMcqQuestion[];
  studentCoding: ArenaCodingProblem[];
  studentDesignChallenge: ArenaDesignChallenge | null;
  submission: ArenaSubmission | null;
  leaderboard: any[];

  // Actions
  setSelectedAssessment: (assessment: ArenaAssessment | null) => void;
  fetchAdminCandidates: () => Promise<ArenaAdminCandidate[]>;
  fetchAssessments: (eventId: string) => Promise<ArenaAssessment[]>;
  createAssessment: (eventId: string, data: any) => Promise<any>;
  updateAssessment: (eventId: string, assessmentId: string, data: any) => Promise<any>;
  deleteAssessment: (eventId: string, assessmentId: string) => Promise<any>;

  fetchAdminAssessmentQuestions: (eventId: string, assessmentId: string) => Promise<any>;
  saveAssessmentMcqs: (
    eventId: string,
    assessmentId: string,
    questions: ArenaMcqQuestion[],
    mode?: 'append' | 'replace'
  ) => Promise<any>;
  saveAssessmentCodingProblems: (
    eventId: string,
    assessmentId: string,
    problems: ArenaCodingProblem[],
    mode?: 'append' | 'replace'
  ) => Promise<any>;
  saveAssessmentDesignChallenge: (
    eventId: string,
    assessmentId: string,
    data: ArenaDesignChallenge
  ) => Promise<any>;
  uploadDesignImage: (file: File) => Promise<string>;
  evaluateAssessmentDesign: (
    eventId: string,
    assessmentId: string,
    submissionId: string,
    data: { pointsEarned: number; feedback?: string }
  ) => Promise<any>;
  bulkUploadAssessmentQuestions: (
    eventId: string,
    assessmentId: string,
    file: File,
    type: 'mcq' | 'coding',
    mode?: 'append' | 'replace'
  ) => Promise<any>;
  fetchAdminAssessmentSubmissions: (eventId: string, assessmentId: string) => Promise<any>;

  // Student Multi-Assessment Actions
  fetchStudentAssessmentData: (eventId: string, assessmentId: string) => Promise<any>;
  startAssessmentSession: (eventId: string, assessmentId: string) => Promise<any>;
  runAssessmentCode: (
    eventId: string,
    assessmentId: string,
    problemId: string,
    language: string,
    code: string
  ) => Promise<any>;
  submitAssessmentProblem: (
    eventId: string,
    assessmentId: string,
    problemId: string,
    language: string,
    code: string
  ) => Promise<any>;
  submitAssessmentFinal: (
    eventId: string,
    assessmentId: string,
    mcqAnswers: Array<{ questionId: string; selectedOptionIndex: number }>
  ) => Promise<any>;
  submitAssessmentDesign: (
    eventId: string,
    assessmentId: string,
    data: { figmaLink: string; notes?: string; previewImageUrl?: string }
  ) => Promise<any>;
  fetchAssessmentLeaderboard: (eventId: string, assessmentId: string) => Promise<any>;

  // Legacy single-arena actions
  fetchAdminArenaData: (eventId: string) => Promise<any>;
  updateArenaConfig: (eventId: string, config: Partial<ArenaConfig>) => Promise<any>;
  saveArenaMcqs: (
    eventId: string,
    questions: ArenaMcqQuestion[],
    mode?: 'append' | 'replace'
  ) => Promise<any>;
  saveArenaCodingProblems: (
    eventId: string,
    problems: ArenaCodingProblem[],
    mode?: 'append' | 'replace'
  ) => Promise<any>;
  bulkUploadArenaQuestions: (
    eventId: string,
    file: File,
    type: 'mcq' | 'coding',
    mode?: 'append' | 'replace'
  ) => Promise<any>;
  downloadArenaTemplate: (eventId: string, type: 'mcq' | 'coding') => Promise<void>;
  fetchStudentArenaData: (eventId: string) => Promise<any>;
  startArenaSession: (eventId: string) => Promise<any>;
  runArenaCode: (
    eventId: string,
    problemId: string,
    language: string,
    code: string
  ) => Promise<any>;
  submitArenaProblem: (
    eventId: string,
    problemId: string,
    language: string,
    code: string
  ) => Promise<any>;
  submitArenaFinal: (
    eventId: string,
    mcqAnswers: Array<{ questionId: string; selectedOptionIndex: number }>
  ) => Promise<any>;
  fetchArenaLeaderboard: (eventId: string) => Promise<any>;
  fetchAdminSubmissions: (eventId: string) => Promise<any>;
}

export const useEventArenaStore = create<EventArenaState>((set, get) => ({
  loading: false,
  actionLoading: false,
  error: null,

  assessments: [],
  selectedAssessment: null,

  adminCandidates: [],
  adminArenaEvent: null,
  adminMcqs: [],
  adminCoding: [],
  adminDesignChallenge: null,
  adminSubmissions: [],

  currentEvent: null,
  studentMcqs: [],
  studentCoding: [],
  studentDesignChallenge: null,
  submission: null,
  leaderboard: [],

  setSelectedAssessment: (assessment) => set({ selectedAssessment: assessment }),

  fetchAdminCandidates: async () => {
    try {
      const res = await api.get('/events/arena/admin-candidates');
      const candidates = res.data.candidates || [];
      set({ adminCandidates: candidates });
      return candidates;
    } catch (err: any) {
      console.error('Failed to fetch admin candidates:', err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // Multi-Assessment Actions
  // ---------------------------------------------------------------------------
  fetchAssessments: async (eventId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/events/${eventId}/arena/assessments`);
      const assessments: ArenaAssessment[] = res.data.assessments || [];
      set({
        assessments,
        loading: false,
      });

      // If currently selected assessment exists in updated list, update it
      const currentSelected = get().selectedAssessment;
      if (currentSelected) {
        const found = assessments.find((a) => a._id === currentSelected._id);
        if (found) set({ selectedAssessment: found });
      } else if (assessments.length > 0) {
        set({ selectedAssessment: assessments[0] });
      }

      return assessments;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to fetch assessments';
      set({ error: msg, loading: false });
      toast.error(msg);
      return [];
    }
  },

  createAssessment: async (eventId: string, data: any) => {
    set({ actionLoading: true });
    try {
      const res = await api.post(`/events/${eventId}/arena/assessments`, data);
      toast.success(res.data.message || 'Assessment created successfully');
      await get().fetchAssessments(eventId);
      if (res.data.assessment) {
        set({ selectedAssessment: res.data.assessment });
      }
      set({ actionLoading: false });
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to create assessment';
      toast.error(msg);
      throw err;
    }
  },

  updateAssessment: async (eventId: string, assessmentId: string, data: any) => {
    set({ actionLoading: true });
    try {
      const res = await api.put(`/events/${eventId}/arena/assessments/${assessmentId}`, data);
      toast.success(res.data.message || 'Assessment updated successfully');
      await get().fetchAssessments(eventId);
      set({ actionLoading: false });
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to update assessment';
      toast.error(msg);
      throw err;
    }
  },

  deleteAssessment: async (eventId: string, assessmentId: string) => {
    set({ actionLoading: true });
    try {
      const res = await api.delete(`/events/${eventId}/arena/assessments/${assessmentId}`);
      toast.success(res.data.message || 'Assessment deleted');
      await get().fetchAssessments(eventId);
      const remaining = get().assessments;
      set({
        selectedAssessment: remaining.length > 0 ? remaining[0] : null,
        actionLoading: false,
      });
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to delete assessment';
      toast.error(msg);
      throw err;
    }
  },

  fetchAdminAssessmentQuestions: async (eventId: string, assessmentId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/events/${eventId}/arena/assessments/${assessmentId}/questions`);
      set({
        adminMcqs: res.data.mcqs || [],
        adminCoding: res.data.coding || [],
        adminDesignChallenge: res.data.designChallenge || null,
        loading: false,
      });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to load assessment questions';
      set({ error: msg, loading: false });
      toast.error(msg);
      throw err;
    }
  },

  saveAssessmentMcqs: async (
    eventId: string,
    assessmentId: string,
    questions: ArenaMcqQuestion[],
    mode = 'replace'
  ) => {
    set({ actionLoading: true });
    try {
      const res = await api.post(
        `/events/${eventId}/arena/assessments/${assessmentId}/questions/mcq`,
        { questions, mode }
      );
      toast.success(res.data.message || 'MCQs saved successfully');
      set({ adminMcqs: res.data.mcqs || questions, actionLoading: false });
      await get().fetchAssessments(eventId);
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to save MCQ questions';
      toast.error(msg);
      throw err;
    }
  },

  saveAssessmentCodingProblems: async (
    eventId: string,
    assessmentId: string,
    problems: ArenaCodingProblem[],
    mode = 'replace'
  ) => {
    set({ actionLoading: true });
    try {
      const res = await api.post(
        `/events/${eventId}/arena/assessments/${assessmentId}/questions/coding`,
        { problems, mode }
      );
      toast.success(res.data.message || 'Coding problems saved successfully');
      set({ adminCoding: res.data.coding || problems, actionLoading: false });
      await get().fetchAssessments(eventId);
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to save coding problems';
      toast.error(msg);
      throw err;
    }
  },

  saveAssessmentDesignChallenge: async (
    eventId: string,
    assessmentId: string,
    data: ArenaDesignChallenge
  ) => {
    set({ actionLoading: true });
    try {
      const res = await api.put(
        `/events/${eventId}/arena/assessments/${assessmentId}/design`,
        data
      );
      toast.success(res.data.message || 'Design challenge saved successfully');
      set({ adminDesignChallenge: res.data.designChallenge, actionLoading: false });
      await get().fetchAssessments(eventId);
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to save design challenge';
      toast.error(msg);
      throw err;
    }
  },

  uploadDesignImage: async (file: File) => {
    set({ actionLoading: true });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/arena-design-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({ actionLoading: false });
      return res.data.url;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to upload design image';
      toast.error(msg);
      throw err;
    }
  },

  evaluateAssessmentDesign: async (
    eventId: string,
    assessmentId: string,
    submissionId: string,
    data: { pointsEarned: number; feedback?: string }
  ) => {
    set({ actionLoading: true });
    try {
      const res = await api.put(
        `/events/${eventId}/arena/assessments/${assessmentId}/submissions/${submissionId}/evaluate-design`,
        data
      );
      toast.success(res.data.message || 'Design submission evaluated successfully!');
      await get().fetchAdminAssessmentSubmissions(eventId, assessmentId);
      set({ actionLoading: false });
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to evaluate design submission';
      toast.error(msg);
      throw err;
    }
  },

  bulkUploadAssessmentQuestions: async (
    eventId: string,
    assessmentId: string,
    file: File,
    type: 'mcq' | 'coding',
    mode = 'append'
  ) => {
    set({ actionLoading: true });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(
        `/events/${eventId}/arena/assessments/${assessmentId}/questions/bulk-upload?type=${type}&mode=${mode}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      toast.success(res.data.message || `Uploaded ${type.toUpperCase()} questions!`);
      await get().fetchAdminAssessmentQuestions(eventId, assessmentId);
      await get().fetchAssessments(eventId);
      set({ actionLoading: false });
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to upload questions';
      toast.error(msg);
      throw err;
    }
  },

  fetchAdminAssessmentSubmissions: async (eventId: string, assessmentId: string) => {
    try {
      const res = await api.get(
        `/events/${eventId}/arena/assessments/${assessmentId}/admin/submissions`
      );
      set({ adminSubmissions: res.data.submissions || [] });
      return res.data.submissions;
    } catch (err: any) {
      console.error('Failed to fetch assessment submissions:', err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // Student Multi-Assessment Participation
  // ---------------------------------------------------------------------------
  fetchStudentAssessmentData: async (eventId: string, assessmentId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/events/${eventId}/arena/assessments/${assessmentId}/data`);
      set({
        currentEvent: res.data.event,
        studentMcqs: res.data.mcqs || [],
        studentCoding: res.data.coding || [],
        studentDesignChallenge: res.data.designChallenge || null,
        submission: res.data.submission || null,
        selectedAssessment: res.data.assessment,
        loading: false,
      });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to load assessment data';
      set({ error: msg, loading: false });
      toast.error(msg);
      throw err;
    }
  },

  startAssessmentSession: async (eventId: string, assessmentId: string) => {
    try {
      const res = await api.post(`/events/${eventId}/arena/assessments/${assessmentId}/start`);
      set({ submission: res.data.submission });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to start session';
      toast.error(msg);
      throw err;
    }
  },

  runAssessmentCode: async (
    eventId: string,
    assessmentId: string,
    problemId: string,
    language: string,
    code: string
  ) => {
    try {
      const res = await api.post(
        `/events/${eventId}/arena/assessments/${assessmentId}/run-code`,
        { problemId, language, code }
      );
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to execute code';
      toast.error(msg);
      throw err;
    }
  },

  submitAssessmentProblem: async (
    eventId: string,
    assessmentId: string,
    problemId: string,
    language: string,
    code: string
  ) => {
    try {
      const res = await api.post(
        `/events/${eventId}/arena/assessments/${assessmentId}/submit-problem`,
        { problemId, language, code }
      );
      if (res.data.status === 'ACCEPTED') {
        toast.success(
          `Problem Accepted! (${res.data.passedCount}/${res.data.totalTestCases} test cases passed)`
        );
      } else {
        toast.error(
          `Partially Passed: ${res.data.passedCount}/${res.data.totalTestCases} test cases passed`
        );
      }
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to submit problem solution';
      toast.error(msg);
      throw err;
    }
  },

  submitAssessmentFinal: async (
    eventId: string,
    assessmentId: string,
    mcqAnswers: Array<{ questionId: string; selectedOptionIndex: number }>
  ) => {
    set({ actionLoading: true });
    try {
      const res = await api.post(
        `/events/${eventId}/arena/assessments/${assessmentId}/submit`,
        { mcqAnswers }
      );
      toast.success(res.data.message || 'Assessment submitted successfully!');
      set({ actionLoading: false });
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to submit assessment';
      toast.error(msg);
      throw err;
    }
  },

  submitAssessmentDesign: async (
    eventId: string,
    assessmentId: string,
    data: { figmaLink: string; notes?: string; previewImageUrl?: string }
  ) => {
    set({ actionLoading: true });
    try {
      const res = await api.post(
        `/events/${eventId}/arena/assessments/${assessmentId}/design/submit`,
        data
      );
      toast.success(res.data.message || 'Figma design submitted successfully!');
      set({ submission: res.data.submission, actionLoading: false });
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to submit Figma design';
      toast.error(msg);
      throw err;
    }
  },

  fetchAssessmentLeaderboard: async (eventId: string, assessmentId: string) => {
    try {
      const res = await api.get(
        `/events/${eventId}/arena/assessments/${assessmentId}/leaderboard`
      );
      set({ leaderboard: res.data.leaderboard || [] });
      return res.data.leaderboard;
    } catch (err: any) {
      console.error('Failed to fetch assessment leaderboard:', err);
      return [];
    }
  },

  // ---------------------------------------------------------------------------
  // Single/Legacy Arena methods
  // ---------------------------------------------------------------------------
  fetchAdminArenaData: async (eventId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/events/${eventId}/arena/questions`);
      set({
        adminArenaEvent: res.data.event,
        adminMcqs: res.data.mcqs || [],
        adminCoding: res.data.coding || [],
        loading: false,
      });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to load Event Arena questions';
      set({ error: msg, loading: false });
      toast.error(msg);
      throw err;
    }
  },

  updateArenaConfig: async (eventId: string, config: Partial<ArenaConfig>) => {
    set({ actionLoading: true });
    try {
      const res = await api.put(`/events/${eventId}/arena/config`, config);
      toast.success(res.data.message || 'Arena settings updated');
      set({ adminArenaEvent: res.data.event, actionLoading: false });
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to update Arena settings';
      toast.error(msg);
      throw err;
    }
  },

  saveArenaMcqs: async (eventId: string, questions: ArenaMcqQuestion[], mode = 'replace') => {
    set({ actionLoading: true });
    try {
      const res = await api.post(`/events/${eventId}/arena/questions/mcq`, {
        questions,
        mode,
      });
      toast.success(res.data.message || 'MCQs saved successfully');
      set({ adminMcqs: res.data.mcqs || questions, actionLoading: false });
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to save MCQ questions';
      toast.error(msg);
      throw err;
    }
  },

  saveArenaCodingProblems: async (
    eventId: string,
    problems: ArenaCodingProblem[],
    mode = 'replace'
  ) => {
    set({ actionLoading: true });
    try {
      const res = await api.post(`/events/${eventId}/arena/questions/coding`, {
        problems,
        mode,
      });
      toast.success(res.data.message || 'Coding problems saved successfully');
      set({ adminCoding: res.data.coding || problems, actionLoading: false });
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to save coding problems';
      toast.error(msg);
      throw err;
    }
  },

  bulkUploadArenaQuestions: async (
    eventId: string,
    file: File,
    type: 'mcq' | 'coding',
    mode = 'append'
  ) => {
    set({ actionLoading: true });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(
        `/events/${eventId}/arena/questions/bulk-upload?type=${type}&mode=${mode}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      toast.success(res.data.message || `Uploaded ${type.toUpperCase()} questions successfully!`);
      await get().fetchAdminArenaData(eventId);
      set({ actionLoading: false });
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to upload questions';
      toast.error(msg);
      throw err;
    }
  },

  downloadArenaTemplate: async (eventId: string, type: 'mcq' | 'coding') => {
    try {
      const res = await api.get(`/events/${eventId}/arena/templates/${type}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event_arena_${type}_sample_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully');
    } catch {
      toast.error('Failed to download template');
    }
  },

  fetchStudentArenaData: async (eventId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/events/${eventId}/arena`);
      set({
        currentEvent: res.data.event,
        studentMcqs: res.data.mcqs || [],
        studentCoding: res.data.coding || [],
        submission: res.data.submission || null,
        loading: false,
      });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to load Event Arena';
      set({ error: msg, loading: false });
      toast.error(msg);
      throw err;
    }
  },

  startArenaSession: async (eventId: string) => {
    try {
      const res = await api.post(`/events/${eventId}/arena/start`);
      set({ submission: res.data.submission });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to start session';
      toast.error(msg);
      throw err;
    }
  },

  runArenaCode: async (
    eventId: string,
    problemId: string,
    language: string,
    code: string
  ) => {
    try {
      const res = await api.post(`/events/${eventId}/arena/run-code`, {
        problemId,
        language,
        code,
      });
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to execute code';
      toast.error(msg);
      throw err;
    }
  },

  submitArenaProblem: async (
    eventId: string,
    problemId: string,
    language: string,
    code: string
  ) => {
    try {
      const res = await api.post(`/events/${eventId}/arena/submit-problem`, {
        problemId,
        language,
        code,
      });
      if (res.data.status === 'ACCEPTED') {
        toast.success(
          `Problem Accepted! (${res.data.passedCount}/${res.data.totalTestCases} test cases passed)`
        );
      } else {
        toast.error(
          `Partially Passed: ${res.data.passedCount}/${res.data.totalTestCases} test cases passed`
        );
      }
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to submit problem solution';
      toast.error(msg);
      throw err;
    }
  },

  submitArenaFinal: async (
    eventId: string,
    mcqAnswers: Array<{ questionId: string; selectedOptionIndex: number }>
  ) => {
    set({ actionLoading: true });
    try {
      const res = await api.post(`/events/${eventId}/arena/submit`, {
        mcqAnswers,
      });
      toast.success(res.data.message || 'Assessment submitted successfully!');
      set({ actionLoading: false });
      return res.data;
    } catch (err: any) {
      set({ actionLoading: false });
      const msg = err.response?.data?.error || 'Failed to submit assessment';
      toast.error(msg);
      throw err;
    }
  },

  fetchArenaLeaderboard: async (eventId: string) => {
    try {
      const res = await api.get(`/events/${eventId}/arena/leaderboard`);
      set({ leaderboard: res.data.leaderboard || [] });
      return res.data.leaderboard;
    } catch (err: any) {
      console.error('Failed to fetch arena leaderboard:', err);
      return [];
    }
  },

  fetchAdminSubmissions: async (eventId: string) => {
    try {
      const res = await api.get(`/events/${eventId}/arena/admin/submissions`);
      set({ adminSubmissions: res.data.submissions || [] });
      return res.data.submissions;
    } catch (err: any) {
      console.error('Failed to fetch admin arena submissions:', err);
      return [];
    }
  },
}));

export default useEventArenaStore;
