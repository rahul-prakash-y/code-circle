import { create } from 'zustand';
import api from '../lib/axios';

const useCodingStore = create((set) => ({
  problems: [],
  currentProblem: null,
  submissionResult: null,
  isLoading: false,
  error: null,

  fetchProblems: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/problems');
      set({ problems: res.data, isLoading: false });
    } catch (err) {
      set({ 
        error: err.response?.data?.error || err.message, 
        isLoading: false 
      });
    }
  },

  fetchProblemById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/problems/${id}`);
      set({ currentProblem: res.data, isLoading: false });
    } catch (err) {
      set({ 
        error: err.response?.data?.error || err.message, 
        isLoading: false 
      });
    }
  },

  submitCode: async (problemId, code, languageId) => {
    set({ isLoading: true, submissionResult: null, error: null });
    try {
      const res = await api.post(`/problems/${problemId}/submit`, { code, languageId });
      set({ submissionResult: res.data, isLoading: false });
      return res.data;
    } catch (err) {
      set({ 
        error: err.response?.data?.error || err.message, 
        isLoading: false 
      });
      throw err;
    }
  },

  clearSubmissionResult: () => set({ submissionResult: null })
}));

export default useCodingStore;
