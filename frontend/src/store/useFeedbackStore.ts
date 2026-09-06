import { create } from 'zustand';
import api from '../lib/axios';

export interface FeedbackUser {
  _id: string;
  name: string;
  rollNo: string;
  email?: string;
  department?: string;
  profilePicUrl?: string;
  isAnonymous?: boolean;
}

export interface FeedbackItem {
  _id: string;
  user: FeedbackUser;
  type: 'Event' | 'ClubGeneral';
  event?: {
    _id: string;
    title: string;
    date: string;
    type: string;
  } | null;
  rating: number;
  category: string;
  comment: string;
  isAnonymous: boolean;
  accessLevel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackStats {
  totalFeedbacks: number;
  eventFeedbacks: number;
  clubGeneralFeedbacks: number;
  averageRating: number;
  distribution: Record<number, number>;
}

interface FeedbackStoreState {
  feedbacks: FeedbackItem[];
  myFeedbacks: FeedbackItem[];
  stats: FeedbackStats | null;
  isSuperAdminView: boolean;
  viewerRole: string | null;
  privacyNotice: string | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  typeFilter: string;
  ratingFilter: number | null;

  setTypeFilter: (type: string) => void;
  setRatingFilter: (rating: number | null) => void;
  submitFeedback: (payload: {
    type: 'Event' | 'ClubGeneral';
    eventId?: string | null;
    rating: number;
    category?: string;
    comment: string;
  }) => Promise<{ success: boolean; data?: any; error?: string }>;
  fetchFeedbacks: (params?: { type?: string; rating?: number; eventId?: string }) => Promise<void>;
  fetchFeedbackStats: () => Promise<void>;
  fetchMyFeedbacks: () => Promise<void>;
  deleteFeedback: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export const useFeedbackStore = create<FeedbackStoreState>((set, get) => ({
  feedbacks: [],
  myFeedbacks: [],
  stats: null,
  isSuperAdminView: false,
  viewerRole: null,
  privacyNotice: null,
  loading: false,
  submitting: false,
  error: null,
  typeFilter: 'All',
  ratingFilter: null,

  setTypeFilter: (type) => {
    set({ typeFilter: type });
    get().fetchFeedbacks({ type, rating: get().ratingFilter || undefined });
  },

  setRatingFilter: (rating) => {
    set({ ratingFilter: rating });
    get().fetchFeedbacks({ type: get().typeFilter, rating: rating || undefined });
  },

  submitFeedback: async (payload) => {
    set({ submitting: true, error: null });
    try {
      const res = await api.post('/feedback', payload);
      set({ submitting: false });
      // Refresh user's submissions
      get().fetchMyFeedbacks();
      return { success: true, data: res.data.data };
    } catch (err: any) {
      set({ submitting: false });
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to submit feedback',
      };
    }
  },

  fetchFeedbacks: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      const type = params.type !== undefined ? params.type : get().typeFilter;
      const rating = params.rating !== undefined ? params.rating : get().ratingFilter;

      if (type && type !== 'All') queryParams.append('type', type);
      if (rating) queryParams.append('rating', String(rating));
      if (params.eventId) queryParams.append('eventId', params.eventId);

      const res = await api.get(`/feedback?${queryParams.toString()}`);
      set({
        feedbacks: res.data.data || [],
        isSuperAdminView: res.data.isSuperAdminView ?? false,
        viewerRole: res.data.viewerRole || null,
        privacyNotice: res.data.privacyPolicyNotice || null,
        loading: false,
      });
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.error || 'Failed to fetch feedback list',
      });
    }
  },

  fetchFeedbackStats: async () => {
    try {
      const res = await api.get('/feedback/stats');
      set({ stats: res.data.data || null });
    } catch (err: any) {
      console.error('Failed to load feedback statistics', err);
    }
  },

  fetchMyFeedbacks: async () => {
    try {
      const res = await api.get('/feedback/my');
      set({ myFeedbacks: res.data.data || [] });
    } catch (err: any) {
      console.error('Failed to fetch personal feedback history', err);
    }
  },

  deleteFeedback: async (id) => {
    try {
      await api.delete(`/feedback/${id}`);
      set((state) => ({
        feedbacks: state.feedbacks.filter((f) => f._id !== id),
      }));
      get().fetchFeedbackStats();
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to delete feedback entry',
      };
    }
  },
}));

export default useFeedbackStore;
