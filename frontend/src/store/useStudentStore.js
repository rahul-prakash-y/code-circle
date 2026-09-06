import { create } from 'zustand';
import api from '../lib/axios';

const useStudentStore = create((set) => ({
  students: [],
  loading: false,
  error: null,

  fetchStudents: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/user/students');
      set({ students: response.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch students', loading: false });
    }
  },

  updatePassword: async (id, password) => {
    try {
      await api.put(`/user/students/${id}/password`, { password });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to update password' };
    }
  },

  toggleBlock: async (id, isBlocked) => {
    try {
      const response = await api.put(`/user/students/${id}/block`, { isBlocked });
      set((state) => ({
        students: state.students.map((s) => (s._id === id ? response.data : s)),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to update block status' };
    }
  },

  deleteStudent: async (id) => {
    try {
      await api.delete(`/user/students/${id}`);
      set((state) => ({
        students: state.students.filter((s) => s._id !== id),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to delete student' };
    }
  },

  forceLogout: async (id) => {
    try {
      await api.put(`/user/students/${id}/logout`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to force logout' };
    }
  },
}));

export default useStudentStore;
