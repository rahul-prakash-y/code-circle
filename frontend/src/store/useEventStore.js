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
      // Fallback Mock Events
      const mockEvents = [
        {
          _id: 'mock-1',
          title: 'Stellar Hackathon 2026',
          description: 'A 24-hour sprint to build next-gen glassmorphic interfaces. Grand prize: ₹50,000.',
          date: new Date(Date.now() + 7 * 86400000), // 7 days from now
          registrationDeadline: new Date(Date.now() + 3 * 86400000),
          type: 'Team',
          maxParticipants: 4,
          venueOrLink: 'Main Audi / Discord',
          status: 'upcoming'
        },
        {
          _id: 'mock-2',
          title: 'React & Motion Workshop',
          description: 'Master Framer Motion and complex animations with seasoned engineers.',
          date: new Date(Date.now() + 14 * 86400000),
          registrationDeadline: new Date(Date.now() + 10 * 86400000),
          type: 'Individual',
          venueOrLink: 'Lab 402',
          status: 'upcoming'
        },
        {
          _id: 'mock-3',
          title: 'AI in 2026: Guest Lecture',
          description: 'Exploring agentic workflows and the future of LLMs in production.',
          date: new Date(Date.now() - 5 * 86400000), // 5 days ago
          type: 'Individual',
          venueOrLink: 'Seminar Hall',
          status: 'past'
        }
      ];

      if (status === 'upcoming') {
        set({ upcomingEvents: mockEvents.filter(e => e.status === 'upcoming'), loading: false });
      } else if (status === 'past') {
        set({ pastEvents: mockEvents.filter(e => e.status === 'past'), loading: false });
      } else {
        set({ events: mockEvents, loading: false });
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
  }
}));

export default useEventStore;
