import { create } from 'zustand';
import api from '../lib/axios';

const useAnalyticsStore = create((set) => ({
  dashboardStats: null,
  growthData: [],
  leaderboard: [],
  passport: [],
  loading: false,
  error: null,

  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/analytics/dashboard');
      set({ 
        dashboardStats: response.data.stats, 
        growthData: response.data.growthData,
        loading: false 
      });
    } catch (err) {
      set({ 
        error: err.response?.data?.message || 'Failed to fetch dashboard stats', 
        loading: false 
      });
    }
  },

  fetchLeaderboard: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/analytics/leaderboard');
      set({ leaderboard: response.data, loading: false });
    } catch (err) {
      set({ 
        error: err.response?.data?.message || 'Failed to fetch leaderboard', 
        loading: false 
      });
    }
  },

  fetchPassport: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/users/passport');
      set({ passport: response.data, loading: false });
    } catch (err) {
      set({ 
        error: err.response?.data?.message || 'Failed to fetch activity passport', 
        loading: false 
      });
    }
  }
}));

export default useAnalyticsStore;
