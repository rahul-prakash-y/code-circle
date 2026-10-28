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

export interface ArenaConfig {
  hasArena: boolean;
  arenaType: 'CODING' | 'MCQ' | 'HYBRID';
  arenaStatus: 'DRAFT' | 'UPCOMING' | 'LIVE' | 'ENDED';
  arenaDurationMinutes: number;
  arenaTotalPoints: number;
  arenaPassingPercentage: number;
  arenaRules: string[];
  arenaStartTime?: string;
  arenaEndTime?: string;
  arenaAdmins?: any[];
}

export interface ArenaSubmission {
  _id: string;
  eventId: string;
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

  // Admin state
  adminCandidates: ArenaAdminCandidate[];
  adminArenaEvent: any | null;
  adminMcqs: ArenaMcqQuestion[];
  adminCoding: ArenaCodingProblem[];
  adminSubmissions: any[];

  // Student Arena state
  currentEvent: any | null;
  studentMcqs: ArenaMcqQuestion[];
  studentCoding: ArenaCodingProblem[];
  submission: ArenaSubmission | null;
  leaderboard: any[];

  // Actions
  fetchAdminCandidates: () => Promise<ArenaAdminCandidate[]>;
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

  adminCandidates: [],
  adminArenaEvent: null,
  adminMcqs: [],
  adminCoding: [],
  adminSubmissions: [],

  currentEvent: null,
  studentMcqs: [],
  studentCoding: [],
  submission: null,
  leaderboard: [],

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
      // Refresh admin data
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
    } catch (err: any) {
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
        toast.success(`Problem Accepted! (${res.data.passedCount}/${res.data.totalTestCases} test cases passed)`);
      } else {
        toast.error(`Partially Passed: ${res.data.passedCount}/${res.data.totalTestCases} test cases passed`);
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
