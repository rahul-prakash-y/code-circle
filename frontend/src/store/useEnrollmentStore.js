import { create } from 'zustand';
import api from '../lib/axios';

const useEnrollmentStore = create((set, get) => ({
  loading: false,
  error: null,
  success: false,
  myEnrolledEventIds: [],

  fetchMyEnrollments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/users/passport');
      // Extract event IDs from the passport activities
      // We check if the event exists (it should, but safety first)
      const eventIds = response.data
        .map(activity => activity?.eventId)
        .filter(id => !!id);
      
      set({ myEnrolledEventIds: eventIds, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch enrollment status', 
        loading: false 
      });
    }
  },

  enrollInEvent: async (enrollmentData) => {
    set({ loading: true, error: null, success: false });
    try {
      const response = await api.post('/enrollments', enrollmentData);
      set({ loading: false, success: true });
      
      // Refresh enrollment IDs after a successful enrollment
      const currentIds = get().myEnrolledEventIds || [];
      if (enrollmentData.event && !currentIds.includes(enrollmentData.event)) {
        set((state) => ({
          myEnrolledEventIds: [...state.myEnrolledEventIds, enrollmentData.event]
        }));
      }
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to enroll in event';
      set({ 
        error: errorMessage, 
        loading: false,
        success: false
      });
      throw new Error(errorMessage);
    }
  },

  fetchEventEnrollments: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/enrollments/event/${eventId}`);
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch enrollments', 
        loading: false 
      });
      throw error;
    }
  },

  updateAttendance: async (eventId, enrollmentIds) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/enrollments/${eventId}/attendance`, { enrollmentIds });
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update attendance';
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  generateCertificates: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/enrollments/${eventId}/generate-certificates`);
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to generate certificates';
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  fetchMyCertificates: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/enrollments/my-certificates');
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch certificates', 
        loading: false 
      });
      throw error;
    }
  },

  resetStatus: () => set({ error: null, success: false, loading: false })
}));

export default useEnrollmentStore;
