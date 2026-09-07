import { create } from 'zustand';
import api from '../lib/axios';
import {
  User,
  PaginationMeta,
  UserFilters,
  CreateUserPayload,
  UpdateUserPayload,
  PaginatedUsersResponse,
  ResetLinkResponse,
  ForceResetResponse,
} from '../types/user';

interface UserStoreState {
  users: User[];
  pagination: PaginationMeta;
  filters: UserFilters;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  lastResetLink: string | null;
  lastTemporaryPassword: { password: string; userName: string } | null;

  fetchUsers: (overrideFilters?: Partial<UserFilters>) => Promise<void>;
  setSearch: (search: string) => void;
  setRoleFilter: (role: string) => void;
  setStatusFilter: (status: 'all' | 'active' | 'blocked') => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  createUser: (payload: CreateUserPayload) => Promise<{ success: boolean; user?: User; generatedPassword?: string; error?: string }>;
  updateUser: (id: string, payload: UpdateUserPayload) => Promise<{ success: boolean; user?: User; error?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleBlock: (id: string, isBlocked: boolean) => Promise<{ success: boolean; user?: User; error?: string }>;
  generateResetLink: (id: string) => Promise<{ success: boolean; resetLink?: string; error?: string }>;
  forceResetPassword: (id: string) => Promise<{ success: boolean; temporaryPassword?: string; error?: string }>;
  bulkUploadUsers: (file: File) => Promise<{ success: boolean; message?: string; summary?: any; details?: any; error?: string }>;
  clearTemporaryCredentials: () => void;
}

const defaultPagination: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  hasMore: false,
};

const defaultFilters: UserFilters = {
  search: '',
  role: 'all',
  status: 'all',
  page: 1,
  limit: 10,
};

export const useUserStore = create<UserStoreState>((set, get) => ({
  users: [],
  pagination: defaultPagination,
  filters: defaultFilters,
  loading: false,
  actionLoading: false,
  error: null,
  lastResetLink: null,
  lastTemporaryPassword: null,

  fetchUsers: async (overrideFilters?: Partial<UserFilters>) => {
    const currentFilters = { ...get().filters, ...overrideFilters };
    set({ loading: true, error: null, filters: currentFilters });

    try {
      const params = new URLSearchParams();
      params.set('page', currentFilters.page.toString());
      params.set('limit', currentFilters.limit.toString());
      if (currentFilters.search) params.set('search', currentFilters.search);
      if (currentFilters.role && currentFilters.role !== 'all') params.set('role', currentFilters.role);
      if (currentFilters.status && currentFilters.status !== 'all') params.set('status', currentFilters.status);

      const response = await api.get<PaginatedUsersResponse>(`/users?${params.toString()}`);
      const data = response.data.data;

      set({
        users: data.users || [],
        pagination: data.pagination || defaultPagination,
        loading: false,
      });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch users directory';
      set({ error: message, loading: false });
    }
  },

  setSearch: (search: string) => {
    set((state) => ({
      filters: { ...state.filters, search, page: 1 },
    }));
    get().fetchUsers({ search, page: 1 });
  },

  setRoleFilter: (role: string) => {
    set((state) => ({
      filters: { ...state.filters, role, page: 1 },
    }));
    get().fetchUsers({ role, page: 1 });
  },

  setStatusFilter: (status: 'all' | 'active' | 'blocked') => {
    set((state) => ({
      filters: { ...state.filters, status, page: 1 },
    }));
    get().fetchUsers({ status, page: 1 });
  },

  setPage: (page: number) => {
    set((state) => ({
      filters: { ...state.filters, page },
    }));
    get().fetchUsers({ page });
  },

  setLimit: (limit: number) => {
    set((state) => ({
      filters: { ...state.filters, limit, page: 1 },
    }));
    get().fetchUsers({ limit, page: 1 });
  },

  createUser: async (payload: CreateUserPayload) => {
    set({ actionLoading: true });
    try {
      const response = await api.post('/users', payload);
      await get().fetchUsers();
      set({ actionLoading: false });
      return {
        success: true,
        user: response.data.user,
        generatedPassword: response.data.generatedPassword,
      };
    } catch (err: any) {
      set({ actionLoading: false });
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to create user',
      };
    }
  },

  updateUser: async (id: string, payload: UpdateUserPayload) => {
    set({ actionLoading: true });
    try {
      const response = await api.put(`/users/${id}`, payload);
      const updatedUser = response.data.user;
      set((state) => ({
        users: state.users.map((u) => (u._id === id || u.id === id ? { ...u, ...updatedUser } : u)),
        actionLoading: false,
      }));
      return { success: true, user: updatedUser };
    } catch (err: any) {
      set({ actionLoading: false });
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to update user',
      };
    }
  },

  deleteUser: async (id: string) => {
    set({ actionLoading: true });
    try {
      await api.delete(`/users/${id}`);
      set((state) => ({
        users: state.users.filter((u) => u._id !== id && u.id !== id),
        pagination: {
          ...state.pagination,
          total: Math.max(0, state.pagination.total - 1),
        },
        actionLoading: false,
      }));
      return { success: true };
    } catch (err: any) {
      set({ actionLoading: false });
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to delete user',
      };
    }
  },

  toggleBlock: async (id: string, isBlocked: boolean) => {
    set({ actionLoading: true });
    try {
      const response = await api.patch(`/users/${id}/block`, { isBlocked });
      const updatedUser = response.data.user;
      set((state) => ({
        users: state.users.map((u) => (u._id === id || u.id === id ? { ...u, isBlocked } : u)),
        actionLoading: false,
      }));
      return { success: true, user: updatedUser };
    } catch (err: any) {
      set({ actionLoading: false });
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to update user status',
      };
    }
  },

  generateResetLink: async (id: string) => {
    set({ actionLoading: true });
    try {
      const response = await api.post<ResetLinkResponse>(`/users/${id}/reset-link`);
      const resetLink = response.data.resetLink;
      set({ lastResetLink: resetLink, actionLoading: false });
      return { success: true, resetLink };
    } catch (err: any) {
      set({ actionLoading: false });
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to generate reset link',
      };
    }
  },

  forceResetPassword: async (id: string) => {
    set({ actionLoading: true });
    try {
      const response = await api.post<ForceResetResponse>(`/users/${id}/force-reset-password`);
      const { temporaryPassword, user } = response.data;
      set({
        lastTemporaryPassword: { password: temporaryPassword, userName: user?.name || 'User' },
        actionLoading: false,
      });
      return { success: true, temporaryPassword };
    } catch (err: any) {
      set({ actionLoading: false });
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to forcefully reset password',
      };
    }
  },

  bulkUploadUsers: async (file: File) => {
    set({ actionLoading: true });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/users/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 minute timeout for large files
      });
      await get().fetchUsers();
      set({ actionLoading: false });
      return {
        success: true,
        message: response.data.message,
        summary: response.data.summary,
        details: response.data.details,
      };
    } catch (err: any) {
      set({ actionLoading: false });
      return {
        success: false,
        error: err.response?.data?.error || 'Bulk upload failed',
      };
    }
  },

  clearTemporaryCredentials: () => {
    set({ lastResetLink: null, lastTemporaryPassword: null });
  },
}));

export default useUserStore;
