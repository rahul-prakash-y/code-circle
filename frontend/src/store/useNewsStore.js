import { create } from 'zustand';
import api from '../lib/axios';

const useNewsStore = create((set, get) => ({
  newsList: [],
  currentNews: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    totalPages: 1,
  },
  selectedTag: 'All',
  searchQuery: '',

  setSelectedTag: (tag) => {
    set({ selectedTag: tag });
    get().fetchNews({ tag, search: get().searchQuery, page: 1 });
  },

  setSearchQuery: (search) => {
    set({ searchQuery: search });
    get().fetchNews({ tag: get().selectedTag, search, page: 1 });
  },

  fetchNews: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      const tag = params.tag !== undefined ? params.tag : get().selectedTag;
      const search = params.search !== undefined ? params.search : get().searchQuery;
      const page = params.page || 1;
      const limit = params.limit || 20;

      if (tag && tag !== 'All') queryParams.append('tag', tag);
      if (search && search.trim()) queryParams.append('search', search.trim());
      queryParams.append('page', String(page));
      queryParams.append('limit', String(limit));

      const response = await api.get(`/news?${queryParams.toString()}`);
      set({
        newsList: response.data.news,
        pagination: {
          total: response.data.total,
          page: response.data.page,
          totalPages: response.data.totalPages,
        },
        loading: false,
      });
      return response.data;
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.message || 'Failed to fetch news feed',
      });
      return { news: [] };
    }
  },

  fetchNewsById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/news/${id}`);
      set({ currentNews: response.data.news, loading: false });
      return response.data.news;
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.message || 'Failed to fetch article',
      });
      throw err;
    }
  },

  setCurrentNews: (news) => set({ currentNews: news }),

  createNews: async (newsData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/news', newsData);
      const created = response.data.news;
      set((state) => ({
        newsList: [created, ...state.newsList],
        loading: false,
      }));
      return created;
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.message || 'Failed to publish news article',
      });
      throw err;
    }
  },

  updateNews: async (id, newsData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/news/${id}`, newsData);
      const updated = response.data.news;
      set((state) => ({
        newsList: state.newsList.map((item) => (item._id === id ? updated : item)),
        currentNews: state.currentNews?._id === id ? updated : state.currentNews,
        loading: false,
      }));
      return updated;
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.message || 'Failed to update news article',
      });
      throw err;
    }
  },

  deleteNews: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/news/${id}`);
      set((state) => ({
        newsList: state.newsList.filter((item) => item._id !== id),
        currentNews: state.currentNews?._id === id ? null : state.currentNews,
        loading: false,
      }));
      return true;
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.message || 'Failed to delete news article',
      });
      throw err;
    }
  },
}));

export default useNewsStore;
