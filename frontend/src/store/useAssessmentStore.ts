import { create } from 'zustand';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import useAuthStore from './useAuthStore';
import usePointsStore from './usePointsStore';

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
  customPoints?: number;
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
    pointsAwarded?: number;
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
  points?: number;
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
  pointsAwarded?: number;
  userTotalPoints?: number;
  customPoints?: number;
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
  deleteSubmission: (assessmentId: string, submissionId: string) => Promise<{ success: boolean; error?: string }>;
  allowStudentReappear: (assessmentId: string, studentId: string) => Promise<{ success: boolean; error?: string }>;
  resetMySubmission: (assessmentId: string) => Promise<{ success: boolean; error?: string }>;
  downloadSampleTemplate: () => Promise<void>;
  bulkUploadAssessments: (file: File, assessmentId?: string) => Promise<{
    success: boolean;
    count?: number;
    assessmentsCreated?: number;
    assessmentsUpdated?: number;
    message?: string;
    errors?: string[];
    error?: string;
  }>;
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

      // Immediately update authStore user points so Navbar, Dashboard, and Profile update seamlessly
      if (result && typeof result.pointsAwarded === 'number' && result.pointsAwarded > 0) {
        try {
          const authStore = useAuthStore.getState();
          if (authStore.user) {
            const nextPoints =
              typeof result.userTotalPoints === 'number'
                ? result.userTotalPoints
                : (authStore.user.points || 0) + result.pointsAwarded;
            authStore.setUser({
              ...authStore.user,
              points: nextPoints,
            });
          }
          // Refresh points hub data if store active
          usePointsStore.getState().fetchMyPoints?.();
        } catch (syncErr) {
          console.warn('Could not sync user points in store:', syncErr);
        }
      }

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

  deleteSubmission: async (assessmentId: string, submissionId: string) => {
    try {
      await api.delete(`/assessments/${assessmentId}/submissions/${submissionId}`);
      set((state) => ({
        assessmentSubmissions: state.assessmentSubmissions.filter((s) => s._id !== submissionId),
      }));
      get().fetchAssessments();
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to delete submission retry',
      };
    }
  },

  allowStudentReappear: async (assessmentId: string, studentId: string) => {
    try {
      await api.post(`/assessments/${assessmentId}/reappear/${studentId}`);
      set((state) => ({
        assessmentSubmissions: state.assessmentSubmissions.filter(
          (s) => (s.user?._id || s.user) !== studentId
        ),
      }));
      get().fetchAssessments();
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to reset student assessment attempt',
      };
    }
  },

  resetMySubmission: async (assessmentId: string) => {
    try {
      await api.delete(`/assessments/${assessmentId}/my-submission`);
      set({ currentResult: null });
      await get().fetchAssessments();
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to reset assessment retry',
      };
    }
  },

  downloadSampleTemplate: async () => {
    try {
      const res = await api.get('/assessments/admin/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(
        new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mcq_assessment_sample_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('MCQ assessment template downloaded!');
    } catch (err: any) {
      toast.error('Failed to download Excel template');
    }
  },

  bulkUploadAssessments: async (file: File, assessmentId?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (assessmentId) {
        formData.append('assessmentId', assessmentId);
      }

      const queryParams = new URLSearchParams();
      if (assessmentId) queryParams.set('assessmentId', assessmentId);
      const url = `/assessments/admin/bulk-upload${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;

      const res = await api.post(url, formData);
      await get().fetchAssessments();
      return {
        success: true,
        count: res.data.count,
        assessmentsCreated: res.data.assessmentsCreated,
        assessmentsUpdated: res.data.assessmentsUpdated,
        message: res.data.message,
        errors: res.data.errors,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Bulk upload failed',
        errors: err.response?.data?.errors,
      };
    }
  },
}));

export default useAssessmentStore;
