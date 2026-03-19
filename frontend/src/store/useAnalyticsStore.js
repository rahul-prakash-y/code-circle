import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
      const response = await axios.get(`${API_URL}/analytics/dashboard`, { withCredentials: true });
      set({ 
        dashboardStats: response.data.stats, 
        growthData: response.data.growthData,
        loading: false 
      });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch dashboard stats', loading: false });
    }
  },

  fetchLeaderboard: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/analytics/leaderboard`, { withCredentials: true });
      set({ leaderboard: response.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch leaderboard', loading: false });
    }
  },

  fetchPassport: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/users/passport`, { withCredentials: true });
      set({ passport: response.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch activity passport', loading: false });
    }
  }
}));

export default useAnalyticsStore;
