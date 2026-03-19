import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const useCodingStore = create((set) => ({
  problems: [],
  currentProblem: null,
  submissionResult: null,
  isLoading: false,
  error: null,

  fetchProblems: async () => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/problems`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ problems: res.data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchProblemById: async (id) => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/problems/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ currentProblem: res.data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  submitCode: async (problemId, code, languageId) => {
    set({ isLoading: true, submissionResult: null });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/problems/${problemId}/submit`, 
        { code, languageId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      set({ submissionResult: res.data, isLoading: false });
      return res.data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  clearSubmissionResult: () => set({ submissionResult: null })
}));

export default useCodingStore;
