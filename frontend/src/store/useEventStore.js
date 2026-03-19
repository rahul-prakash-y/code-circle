import { create } from 'zustand';
import api from '../lib/axios';

const useEventStore = create((set) => ({
  events: [],
  upcomingEvents: [],
  pastEvents: [],
  loading: false,
  error: null,

  fetchEvents: async (status = '') => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/events?status=${status}`);
      if (status === 'upcoming') {
        set({ upcomingEvents: response.data, loading: false });
      } else if (status === 'past') {
        set({ pastEvents: response.data, loading: false });
      } else {
        set({ events: response.data, loading: false });
      }
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch events', 
        loading: false 
      });
    }
  },

  addEvent: async (eventData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/events', eventData);
      set((state) => ({ 
        events: [response.data, ...state.events],
        upcomingEvents: [response.data, ...state.upcomingEvents],
        loading: false 
      }));
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to create event', 
        loading: false 
      });
      throw error;
    }
  },

  updateEvent: async (id, eventData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/events/${id}`, eventData);
      set((state) => ({
        events: state.events.map((e) => (e._id === id ? response.data : e)),
        upcomingEvents: state.upcomingEvents.map((e) => (e._id === id ? response.data : e)),
        loading: false
      }));
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to update event', 
        loading: false 
      });
      throw error;
    }
  },

  deleteEvent: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/events/${id}`);
      set((state) => ({
        events: state.events.filter((e) => e._id !== id),
        upcomingEvents: state.upcomingEvents.filter((e) => e._id !== id),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to delete event', 
        loading: false 
      });
      throw error;
    }
  }
}));

export default useEventStore;
