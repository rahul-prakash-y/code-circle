import { create } from 'zustand';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const useAttendanceStore = create((set) => ({
  sessions: [],
  history: [],
  sessionAttendance: [],
  loading: false,
  error: null,

  createSession: async (sessionData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/attendance/sessions', sessionData);
      set((state) => ({ 
        sessions: [response.data, ...state.sessions], 
        loading: false 
      }));
      toast.success('Attendance session created!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create session';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  fetchEventSessions: async (eventId) => {
    set({ loading: true });
    try {
      const response = await api.get(`/attendance/sessions/event/${eventId}`);
      set({ sessions: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to fetch sessions:', error);
    }
  },

  fetchSessionAttendance: async (sessionId) => {
    set({ loading: true });
    try {
      const response = await api.get(`/attendance/sessions/${sessionId}/attendance`);
      set({ sessionAttendance: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ loading: false });
      toast.error('Failed to fetch student list');
      return [];
    }
  },

  markAttendance: async (otp) => {
    set({ loading: true });
    try {
      const response = await api.post('/attendance/mark', { otp });
      toast.success(response.data.message);
      set({ loading: false });
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to mark attendance';
      set({ loading: false });
      toast.error(message);
      return false;
    }
  },

  fetchUserHistory: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/attendance/history');
      set({ history: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to fetch attendance history:', error);
    }
  }
}));

export default useAttendanceStore;
