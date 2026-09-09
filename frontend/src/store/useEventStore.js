import { create } from 'zustand';
import api from '../lib/axios';

const useEventStore = create((set) => ({
  events: [],
  upcomingEvents: [],
  pastEvents: [],
  loading: false,
  error: null,

  fetchEvents: async (filters = '') => {
    set({ loading: true, error: null });
    try {
      let url = '/events';
      let statusVal = '';
      if (typeof filters === 'string') {
        statusVal = filters;
        if (filters) url += `?status=${filters}`;
      } else if (typeof filters === 'object' && filters !== null) {
        statusVal = filters.status || '';
        const params = new URLSearchParams();
        if (filters.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters.type && filters.type !== 'all') params.append('type', filters.type);
        if (filters.format && filters.format !== 'all') params.append('format', filters.format);
        if (filters.search) params.append('search', filters.search);
        const queryStr = params.toString();
        if (queryStr) url += `?${queryStr}`;
      }

      const response = await api.get(url);
      if (statusVal === 'upcoming') {
        set({ events: response.data, upcomingEvents: response.data, loading: false });
      } else if (statusVal === 'past') {
        set({ events: response.data, pastEvents: response.data, loading: false });
      } else {
        set({ 
          events: response.data, 
          upcomingEvents: response.data.filter((e) => e.status !== 'Cancelled' && e.status !== 'Completed'), 
          loading: false 
        });
      }
    } catch (error) {
      // Fallback Mock Events
      const mockEvents = [
        {
          _id: 'mock-1',
          title: 'Stellar Hackathon 2026',
          description: 'A 24-hour sprint to build next-gen glassmorphic interfaces. Grand prize: ₹50,000.',
          date: new Date(Date.now() + 7 * 86400000), // 7 days from now
          registrationDeadline: new Date(Date.now() + 3 * 86400000),
          type: 'Technical',
          format: 'Team',
          maxParticipants: 4,
          venueOrLink: 'Main Audi / Discord',
          status: 'Upcoming'
        },
        {
          _id: 'mock-2',
          title: 'Live Algorithm Speed Duel 2026',
          description: 'Head-to-head live programming battles with real-time leaderboard and algorithmic challenges.',
          date: new Date(), // Today
          registrationDeadline: new Date(Date.now() + 2 * 3600000),
          type: 'Technical',
          format: 'Duo',
          maxParticipants: 2,
          venueOrLink: 'Turing Innovation Lab & Live Stream',
          status: 'Live'
        },
        {
          _id: 'mock-3',
          title: 'React & Motion Workshop',
          description: 'Master Framer Motion and complex animations with seasoned engineers.',
          date: new Date(Date.now() + 14 * 86400000),
          registrationDeadline: new Date(Date.now() + 10 * 86400000),
          type: 'Workshop',
          format: 'Individual',
          venueOrLink: 'Lab 402',
          status: 'Upcoming'
        },
        {
          _id: 'mock-4',
          title: 'AI in 2026: Guest Lecture',
          description: 'Exploring agentic workflows and the future of LLMs in production.',
          date: new Date(Date.now() - 5 * 86400000), // 5 days ago
          type: 'Lecture',
          format: 'Individual',
          venueOrLink: 'Seminar Hall',
          status: 'Completed'
        }
      ];

      if (statusVal === 'upcoming') {
        set({ events: mockEvents.filter(e => e.status !== 'Completed' && e.status !== 'Cancelled'), upcomingEvents: mockEvents.filter(e => e.status === 'Upcoming'), loading: false });
      } else if (statusVal === 'past') {
        set({ events: mockEvents.filter(e => e.status === 'Completed'), pastEvents: mockEvents.filter(e => e.status === 'Completed'), loading: false });
      } else if (statusVal === 'live') {
        set({ events: mockEvents.filter(e => e.status === 'Live'), loading: false });
      } else {
        set({ events: mockEvents, upcomingEvents: mockEvents.filter(e => e.status === 'Upcoming'), loading: false });
      }
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
  },

  uploadCertificateTemplate: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/certificate-template', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { success: true, url: res.data.url };
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to upload certificate template';
      return { success: false, error: msg };
    }
  }
}));

export default useEventStore;
