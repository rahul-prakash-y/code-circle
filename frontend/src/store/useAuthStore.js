import { create } from 'zustand';
import api from '../lib/axios';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,
  token: localStorage.getItem('token') || null,
  sessionId: localStorage.getItem('sessionId') || null,

  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  login: async (identifier, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { identifier, password });
      const { user, token, sessionId } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('sessionId', sessionId);
      
      set({ user, token, sessionId, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', userData);
      const { user, token, sessionId } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('sessionId', sessionId);
      
      set({ user, token, sessionId, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
      set({ user: null, token: null, sessionId: null, loading: false });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ loading: false });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, loading: false });
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
      set({ user: null, token: null, sessionId: null, loading: false });
    }
  },

  isAdmin: () => get().user?.role === 'Admin',
  isFaculty: () => get().user?.role === 'Faculty',
  isStudent: () => get().user?.role === 'Student',
}));

export default useAuthStore;
