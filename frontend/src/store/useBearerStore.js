import { create } from 'zustand';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const useBearerStore = create((set, get) => ({
  bearers: [],
  loading: false,
  error: null,

  fetchBearers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/bearers');
      set({ bearers: response.data, loading: false });
    } catch (error) {
      // Fallback Mock Bearers
      const mockBearers = [
        {
          _id: 'b-1',
          name: 'Arjun Sharma',
          position: 'President',
          photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
          instagram: 'arjun_tech',
          role: 'Lead Strategist'
        },
        {
          _id: 'b-2',
          name: 'Priya Patel',
          position: 'Vice President',
          photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
          instagram: 'priya_codes',
          role: 'UI/UX Lead'
        },
        {
          _id: 'b-3',
          name: 'Rahul Verma',
          position: 'Secretary',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
          instagram: 'rahul_v',
          role: 'Backend Architect'
        }
      ];
      set({ bearers: mockBearers, loading: false });
    }
  },

  addBearer: async (bearerData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/bearers', bearerData);
      set((state) => ({ 
        bearers: [...state.bearers, response.data], 
        loading: false 
      }));
      toast.success('Bearer added successfully!');
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to add bearer';
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  },

  updateBearer: async (id, bearerData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/bearers/${id}`, bearerData);
      set((state) => ({
        bearers: state.bearers.map((b) => (b._id === id ? response.data : b)),
        loading: false
      }));
      toast.success('Bearer updated successfully!');
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update bearer';
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  },

  deleteBearer: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/bearers/${id}`);
      set((state) => ({
        bearers: state.bearers.filter((b) => b._id !== id),
        loading: false
      }));
      toast.success('Bearer deleted successfully!');
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete bearer';
      set({ error: message, loading: false });
      toast.error(message);
      return false;
    }
  }
}));

export default useBearerStore;
