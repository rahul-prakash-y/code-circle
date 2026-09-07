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
      const { user, token, sessionId, mustChangePassword } = response.data;
      
      localStorage.setItem('token', token);
      if (sessionId) {
        localStorage.setItem('sessionId', sessionId);
      }
      
      set({ user, token, sessionId, loading: false, error: null });
      return { success: true, user, mustChangePassword: mustChangePassword || false };
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed. Please check your credentials.';
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
      if (sessionId) {
        localStorage.setItem('sessionId', sessionId);
      }
      
      set({ user, token, sessionId, loading: false, error: null });
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed. Please check your inputs.';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API notification failed:', err.message);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
      set({ user: null, token: null, sessionId: null, loading: false });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, loading: false });
      return null;
    }

    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, loading: false, error: null });
      return response.data;
    } catch (err) {
      console.error('Auth verification failed:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
      set({ user: null, token: null, sessionId: null, loading: false });
      return null;
    }
  },

  // Password Reset Actions
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return { success: true, message: response.data.message, resetLink: response.data.resetLink };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to submit password reset request',
      };
    }
  },

  resetPasswordWithToken: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return { success: true, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Password reset failed',
      };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password', { currentPassword, newPassword });
      return { success: true, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Password change failed',
      };
    }
  },

  // Unified Profile Management
  updateProfile: async (updates) => {
    set({ loading: true });
    try {
      const response = await api.put('/users/me', updates);
      set({ user: response.data, loading: false, error: null });
      return { success: true, user: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  uploadProfilePic: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await api.post('/upload/profile-pic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { url } = uploadRes.data;
      const updateRes = await get().updateProfile({ profilePicUrl: url });
      
      if (updateRes.success) {
        return { success: true, url };
      } else {
        throw new Error(updateRes.error);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload profile picture';
      return { success: false, error: errorMessage };
    }
  },

  // Role verification helpers with hierarchical awareness
  isSuperAdmin: () => get().user?.role === 'SuperAdmin',
  isAdmin: () => get().user?.role === 'Admin' || get().user?.role === 'SuperAdmin',
  isFaculty: () => get().user?.role === 'Faculty',
  isCommittee: () => get().user?.role === 'Committee',
  isMember: () => get().user?.role === 'Member' || get().user?.role === 'Student',
  isGuest: () => !get().user || get().user?.role === 'Guest',
}));

// Listen for global 401 unauthorized events from Axios interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.setState({ user: null, token: null, sessionId: null, loading: false });
  });
}

export default useAuthStore;
