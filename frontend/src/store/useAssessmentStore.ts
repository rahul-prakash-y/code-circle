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

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface AssessmentStoreState {
  assessments: Assessment[];
  assessmentsPagination: PaginationMeta | null;
  currentAssessment: Assessment | null;
  currentResult: SubmissionResult | null;
  mySubmissions: any[];
  assessmentSubmissions: any[];
  activeAssessmentDetails: any | null;
  submissionsPagination: PaginationMeta | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  selectedCategory: string;
  searchQuery: string;

  fetchAssessments: (params?: { category?: string; search?: string; eventId?: string; page?: number; limit?: number }) => Promise<void>;
  fetchAssessmentById: (id: string) => Promise<Assessment | null>;
  createAssessment: (payload: any) => Promise<{ success: boolean; assessment?: Assessment; error?: string }>;
  updateAssessment: (id: string, payload: any) => Promise<{ success: boolean; assessment?: Assessment; error?: string }>;
  deleteAssessment: (id: string) => Promise<{ success: boolean; error?: string }>;
  submitAssessment: (
    id: string,
    answers: any[],
    timeSpentSeconds?: number,
    submissionId?: string
  ) => Promise<{ success: boolean; status?: 'saved' | 'pending' | 'error'; result?: SubmissionResult; submissionId?: string; message?: string; error?: string }>;
  fetchMySubmissions: () => Promise<void>;
  fetchAssessmentSubmissions: (assessmentId: string, params?: { page?: number; limit?: number }) => Promise<void>;
  exportAssessmentSubmissionsCsv: (assessmentId: string) => Promise<void>;
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
  assessmentsPagination: null,
  currentAssessment: null,
  currentResult: null,
  mySubmissions: [],
  assessmentSubmissions: [],
  activeAssessmentDetails: null,
  submissionsPagination: null,
  loading: false,
  submitting: false,
  error: null,
  selectedCategory: 'All',
  searchQuery: '',

  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
    get().fetchAssessments({ category, search: get().searchQuery, page: 1 });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().fetchAssessments({ category: get().selectedCategory, search: query, page: 1 });
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
      if (params.page) queryParams.append('page', String(params.page));
      if (params.limit) queryParams.append('limit', String(params.limit));

      const res = await api.get(`/assessments?${queryParams.toString()}`);
      set({
        assessments: res.data.data || [],
        assessmentsPagination: res.data.pagination || null,
        loading: false,
      });
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

  submitAssessment: async (id, answers, timeSpentSeconds = 0, submissionId) => {
    set({ submitting: true, error: null });
    const clientSubmissionId =
      submissionId ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `sub-${Date.now()}`);

    try {
      // 1. Initial submit attempt with 503 retry recovery
      let res;
      try {
        res = await api.post(`/assessments/${id}/submit`, {
          submissionId: clientSubmissionId,
          answers,
          timeSpentSeconds,
        });
      } catch (submitErr: any) {
        // If 503 (Queue Overflow), wait for Retry-After and retry with the same submissionId
        if (submitErr.response?.status === 503) {
          const retryAfterSec = Number(submitErr.response.headers?.['retry-after']) || 2;
          await new Promise((resolve) => setTimeout(resolve, retryAfterSec * 1000));
          res = await api.post(`/assessments/${id}/submit`, {
            submissionId: clientSubmissionId,
            answers,
            timeSpentSeconds,
          });
        } else {
          throw submitErr;
        }
      }

      // 2. If response status is 'saved', durable confirmation achieved
      if (res.data?.status === 'saved') {
        const result: SubmissionResult = res.data.data;
        set({ currentResult: result, submitting: false });
        get().fetchAssessments();

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
            usePointsStore.getState().fetchMyPoints?.();
          } catch (syncErr) {
            console.warn('Could not sync user points in store:', syncErr);
          }
        }

        return { success: true, status: 'saved', result };
      }

      // 3. If response status is 'pending', poll durable status until confirmed (max 30 attempts)
      if (res.data?.status === 'pending' || res.status === 202) {
        let attempts = 0;
        const maxAttempts = 30;

        while (attempts < maxAttempts) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 1000));

          try {
            const statusRes = await api.get(
              `/assessments/${id}/submission-status/${clientSubmissionId}`
            );
            if (statusRes.data?.status === 'saved') {
              const result: SubmissionResult = statusRes.data.data;
              set({ currentResult: result, submitting: false });
              get().fetchAssessments();
              return { success: true, status: 'saved', result };
            }
          } catch (pollErr) {
            // Transient poll error, continue polling
          }
        }

        // Still pending after polling window: let client know it is queued
        set({ submitting: false });
        return {
          success: true,
          status: 'pending',
          submissionId: clientSubmissionId,
          message: 'Submission queued for durable storage. Answers remain securely saved locally.',
        };
      }

      const result: SubmissionResult = res.data.data;
      set({ currentResult: result, submitting: false });
      return { success: true, status: 'saved', result };
    } catch (err: any) {
      set({ submitting: false });
      return {
        success: false,
        status: 'error',
        error: err.response?.data?.error || err.message || 'Failed to submit assessment',
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

  fetchAssessmentSubmissions: async (assessmentId: string, params = {}) => {
    set({ loading: true });
    try {
      const res = await api.get(`/assessments/${assessmentId}/submissions`, { params });
      set({
        assessmentSubmissions: res.data.data || [],
        activeAssessmentDetails: res.data.assessment || null,
        submissionsPagination: res.data.pagination || null,
        loading: false,
      });
    } catch (err: any) {
      set({ loading: false });
      console.error('Failed to fetch assessment submissions', err);
    }
  },

  exportAssessmentSubmissionsCsv: async (assessmentId: string) => {
    try {
      const toastId = toast.loading('Preparing assessment submissions report...');
      const res = await api.get(`/assessments/${assessmentId}/submissions/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assessment_submissions_${assessmentId.slice(-6)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully!', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to download report');
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
