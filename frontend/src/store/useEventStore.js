import { create } from 'zustand';
import api from '../lib/axios';

const defaultPagination = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const useEventStore = create((set) => ({
  events: [],
  upcomingEvents: [],
  pastEvents: [],
  pagination: defaultPagination,
  loading: false,
  error: null,

  fetchEvents: async (filters = '', page = 1, limit = 20) => {
    set({ loading: true, error: null });
    let statusVal = '';
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));

      if (typeof filters === 'string') {
        statusVal = filters;
        if (filters && filters !== 'all') params.set('status', filters);
      } else if (typeof filters === 'object' && filters !== null) {
        statusVal = filters.status || '';
        if (filters.status && filters.status !== 'all') params.set('status', filters.status);
        if (filters.type && filters.type !== 'all') params.set('type', filters.type);
        if (filters.format && filters.format !== 'all') params.set('format', filters.format);
        if (filters.search) params.set('search', filters.search);
        if (filters.page) params.set('page', String(filters.page));
        if (filters.limit) params.set('limit', String(filters.limit));
      }

      const response = await api.get(`/events?${params.toString()}`);
      const rawData = response.data;
      const eventList = Array.isArray(rawData) ? rawData : (rawData.data || rawData.events || []);
      const pagination = rawData.pagination || {
        total: eventList.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(eventList.length / limit)),
        hasNextPage: false,
        hasPreviousPage: false,
      };

      if (statusVal === 'upcoming') {
        set({ events: eventList, upcomingEvents: eventList, pagination, loading: false });
      } else if (statusVal === 'past') {
        set({ events: eventList, pastEvents: eventList, pagination, loading: false });
      } else {
        set({ 
          events: eventList, 
          upcomingEvents: eventList.filter((e) => e.status !== 'Cancelled' && e.status !== 'Completed'), 
          pagination,
          loading: false 
        });
      }
    } catch {
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
