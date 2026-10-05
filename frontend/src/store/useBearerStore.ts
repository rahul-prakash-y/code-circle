import { create } from 'zustand';
import api from '../lib/axios';
import toast from 'react-hot-toast';

export interface StudentBearer {
  _id: string;
  name: string;
  position: string;
  photoUrl: string;
  linkedinUrl?: string;
  bio: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BearerFormData {
  name: string;
  position: string;
  photoUrl: string;
  linkedinUrl?: string;
  bio: string;
}

interface BearerStore {
  bearers: StudentBearer[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  fetchBearers: () => Promise<void>;
  createBearer: (data: BearerFormData) => Promise<boolean>;
  updateBearer: (id: string, data: BearerFormData) => Promise<boolean>;
  deleteBearer: (id: string) => Promise<boolean>;
  uploadPhoto: (file: File) => Promise<string | null>;
}

export const useBearerStore = create<BearerStore>((set, get) => ({
  bearers: [],
  loading: false,
  actionLoading: false,
  error: null,

  fetchBearers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<StudentBearer[]>('/bearers');
      set({ bearers: response.data, loading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to load student bearers';
      set({ error: message, loading: false });
    }
  },

  createBearer: async (data: BearerFormData) => {
    set({ actionLoading: true, error: null });
    try {
      const response = await api.post<StudentBearer>('/bearers', data);
      set((state) => ({
        bearers: [...state.bearers, response.data],
        actionLoading: false,
      }));
      toast.success(`${data.name} added to Executive Bearers!`);
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create student bearer';
      set({ error: message, actionLoading: false });
      toast.error(message);
      return false;
    }
  },

  updateBearer: async (id: string, data: BearerFormData) => {
    set({ actionLoading: true, error: null });
    try {
      const response = await api.put<StudentBearer>(`/bearers/${id}`, data);
      set((state) => ({
        bearers: state.bearers.map((b) => (b._id === id ? response.data : b)),
        actionLoading: false,
      }));
      toast.success(`${data.name} updated successfully!`);
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update student bearer';
      set({ error: message, actionLoading: false });
      toast.error(message);
      return false;
    }
  },

  deleteBearer: async (id: string) => {
    set({ actionLoading: true, error: null });
    try {
      await api.delete(`/bearers/${id}`);
      set((state) => ({
        bearers: state.bearers.filter((b) => b._id !== id),
        actionLoading: false,
      }));
      toast.success('Bearer removed successfully!');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete student bearer';
      set({ error: message, actionLoading: false });
      toast.error(message);
      return false;
    }
  },

  uploadPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<{ url: string }>('/upload/profile-pic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.url;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to upload photo';
      toast.error(message);
      return null;
    }
  },
}));

export default useBearerStore;
