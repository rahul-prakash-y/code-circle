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

  recordsData: null,
  activeSession: null,

  fetchAttendanceRecords: async ({ studentId = '', eventId = '', sessionId = '', search = '', page = 1, limit = 50 } = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (studentId) params.append('studentId', studentId);
      if (eventId) params.append('eventId', eventId);
      if (sessionId) params.append('sessionId', sessionId);
      if (search) params.append('search', search);
      params.append('page', page);
      params.append('limit', limit);

      const res = await api.get(`/attendance/records?${params.toString()}`);
      if (res.data.success) {
        set({ recordsData: res.data.data, loading: false });
        return res.data.data;
      }
      set({ loading: false });
      return null;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to load attendance records';
      set({ error: message, loading: false });
      toast.error(message);
      return null;
    }
  },

  fetchActiveSession: async (eventId) => {
    if (!eventId) return null;
    try {
      const res = await api.get(`/attendance/sessions/active/${eventId}`);
      if (res.data.success) {
        set({ activeSession: res.data.session });
        return res.data.session;
      }
      return null;
    } catch {
      return null;
    }
  },
}));

export default useAttendanceStore;
