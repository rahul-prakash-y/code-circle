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
    } catch {
      // Fallback Mock Data
      set({ 
        dashboardStats: {
          totalStudents: 1240,
          totalEvents: 42,
          upcomingEvents: 5,
          attendancePercentage: 88,
          activeUsers: 342,
          successRate: 94
        },
        growthData: [
          { monthName: 'Jan', count: 120 },
          { monthName: 'Feb', count: 210 },
          { monthName: 'Mar', count: 180 },
          { monthName: 'Apr', count: 320 },
          { monthName: 'May', count: 450 },
          { monthName: 'Jun', count: 390 }
        ],
        loading: false 
      });
    }
  },

  fetchLeaderboard: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/analytics/leaderboard');
      set({ leaderboard: response.data, loading: false });
    } catch {
      // Fallback Mock Leaderboard
      set({ 
        leaderboard: [
          { name: 'Arjun Sharma', points: 4250, rollNo: '21CS001', rank: 1, department: 'CSE' },
          { name: 'Priya Patel', points: 3980, rollNo: '21IT045', rank: 2, department: 'IT' },
          { name: 'Rahul Verma', points: 3720, rollNo: '22CS102', rank: 3, department: 'CSE' },
          { name: 'Sneha Gupta', points: 3450, rollNo: '21EC012', rank: 4, department: 'ECE' },
          { name: 'Ishaan Singh', points: 3100, rollNo: '21CS088', rank: 5, department: 'CSE' }
        ],
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
