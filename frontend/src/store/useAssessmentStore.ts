import { create } from 'zustand';
import api from '../lib/axios';

export interface AssessmentQuestion {
  _id?: string;
  questionText: string;
  options: string[];
  correctOptionIndex?: number;
  explanation?: string;
  points: number;
}

export interface Assessment {
  _id: string;
  title: string;
  description: string;
  category: string;
  eventId?: any;
  timeLimitMinutes: number;
  passingScorePercentage: number;
  questions: AssessmentQuestion[];
  questionsCount?: number;
  totalPoints?: number;
  isPublished: boolean;
  createdBy?: any;
  createdAt: string;
  updatedAt: string;
  mySubmission?: {
    _id: string;
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    timeSpentSeconds: number;
    createdAt: string;
  } | null;
}

export interface DetailedQuestionResult {
  questionIndex: number;
  questionText: string;
  selectedOption: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation?: string;
}

export interface SubmissionResult {
  submissionId: string;
  assessmentId: string;
  title: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  passingScorePercentage: number;
  timeSpentSeconds: number;
  detailedResults: DetailedQuestionResult[];
  submittedAt: string;
}

interface AssessmentStoreState {
  assessments: Assessment[];
  currentAssessment: Assessment | null;
  currentResult: SubmissionResult | null;
  mySubmissions: any[];
  assessmentSubmissions: any[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  selectedCategory: string;
  searchQuery: string;

  fetchAssessments: (params?: { category?: string; search?: string; eventId?: string }) => Promise<void>;
  fetchAssessmentById: (id: string) => Promise<Assessment | null>;
  createAssessment: (payload: any) => Promise<{ success: boolean; assessment?: Assessment; error?: string }>;
  updateAssessment: (id: string, payload: any) => Promise<{ success: boolean; assessment?: Assessment; error?: string }>;
  deleteAssessment: (id: string) => Promise<{ success: boolean; error?: string }>;
  submitAssessment: (id: string, answers: { questionIndex: number; selectedOption: number }[], timeSpentSeconds?: number) => Promise<{ success: boolean; result?: SubmissionResult; error?: string }>;
  fetchMySubmissions: () => Promise<void>;
  fetchAssessmentSubmissions: (assessmentId: string) => Promise<void>;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  clearCurrentResult: () => void;
}

export const useAssessmentStore = create<AssessmentStoreState>((set, get) => ({
  assessments: [],
  currentAssessment: null,
  currentResult: null,
  mySubmissions: [],
  assessmentSubmissions: [],
  loading: false,
  submitting: false,
  error: null,
  selectedCategory: 'All',
  searchQuery: '',

  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
    get().fetchAssessments({ category, search: get().searchQuery });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().fetchAssessments({ category: get().selectedCategory, search: query });
  },

  clearCurrentResult: () => set({ currentResult: null }),

  fetchAssessments: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      const cat = params.category !== undefined ? params.category : get().selectedCategory;
      const search = params.search !== undefined ? params.search : get().searchQuery;

      if (cat && cat !== 'All') queryParams.append('category', cat);
      if (search && search.trim()) queryParams.append('search', search.trim());
      if (params.eventId) queryParams.append('eventId', params.eventId);

      const res = await api.get(`/assessments?${queryParams.toString()}`);
      set({ assessments: res.data.data || [], loading: false });
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.error || 'Failed to load assessments',
      });
    }
  },

  fetchAssessmentById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/assessments/${id}`);
      const assessment = res.data.data;
      set({ currentAssessment: assessment, loading: false });
      return assessment;
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.error || 'Failed to fetch assessment details',
      });
      return null;
    }
  },

  createAssessment: async (payload) => {
    set({ submitting: true });
    try {
      const res = await api.post('/assessments', payload);
      await get().fetchAssessments();
      set({ submitting: false });
      return { success: true, assessment: res.data.data };
    } catch (err: any) {
      set({ submitting: false });
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to create assessment',
      };
    }
  },

  updateAssessment: async (id, payload) => {
    set({ submitting: true });
    try {
      const res = await api.put(`/assessments/${id}`, payload);
      await get().fetchAssessments();
      set({ submitting: false });
      return { success: true, assessment: res.data.data };
    } catch (err: any) {
      set({ submitting: false });
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to update assessment',
      };
    }
  },

  deleteAssessment: async (id) => {
    try {
      await api.delete(`/assessments/${id}`);
      set((state) => ({
        assessments: state.assessments.filter((a) => a._id !== id),
      }));
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to delete assessment',
      };
    }
  },

  submitAssessment: async (id, answers, timeSpentSeconds = 0) => {
    set({ submitting: true, error: null });
    try {
      const res = await api.post(`/assessments/${id}/submit`, {
        answers,
        timeSpentSeconds,
      });
      const result: SubmissionResult = res.data.data;
      set({ currentResult: result, submitting: false });
      // Refresh list to update score status
      get().fetchAssessments();
      return { success: true, result };
    } catch (err: any) {
      set({ submitting: false });
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to submit assessment',
      };
    }
  },

  fetchMySubmissions: async () => {
    try {
      const res = await api.get('/assessments/my-submissions');
      set({ mySubmissions: res.data.data || [] });
    } catch (err: any) {
      console.error('Failed to fetch personal submissions', err);
    }
  },

  fetchAssessmentSubmissions: async (assessmentId: string) => {
    set({ loading: true });
    try {
      const res = await api.get(`/assessments/${assessmentId}/submissions`);
      set({ assessmentSubmissions: res.data.data || [], loading: false });
    } catch (err: any) {
      set({ loading: false });
      console.error('Failed to fetch assessment submissions', err);
    }
  },
}));

export default useAssessmentStore;
