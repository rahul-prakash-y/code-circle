import { create } from 'zustand';
import api from '../lib/axios';
import toast from 'react-hot-toast';

export type TeamStatus = 'Active' | 'Inactive' | 'Blocked';

export interface TeamMember {
  _id: string;
  name: string;
  rollNo: string;
  email: string;
  department?: string;
  profilePicUrl?: string;
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  leader?: TeamMember;
  members: TeamMember[];
  event?: {
    _id: string;
    title: string;
    date: string;
    type: string;
    format: string;
    status: string;
  };
  status: TeamStatus;
  isActive: boolean;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TeamFilters {
  status: string;
  search: string;
  eventId: string;
}

interface TeamState {
  teams: Team[];
  selectedTeam: Team | null;
  loading: boolean;
  actionLoading: boolean;
  filters: TeamFilters;

  // Actions
  fetchTeams: () => Promise<void>;
  setFilter: (key: keyof TeamFilters, value: string) => void;
  resetFilters: () => void;
  createTeam: (payload: {
    name: string;
    description?: string;
    leader?: string;
    members?: string[];
    event?: string;
    status?: TeamStatus;
  }) => Promise<boolean>;
  updateTeam: (id: string, payload: Partial<Team>) => Promise<boolean>;
  deleteTeam: (id: string) => Promise<boolean>;
  setTeamStatus: (id: string, status: TeamStatus) => Promise<boolean>;
  assignMembers: (id: string, members: string[]) => Promise<boolean>;
  removeMember: (id: string, userId: string) => Promise<boolean>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  selectedTeam: null,
  loading: false,
  actionLoading: false,
  filters: {
    status: 'all',
    search: '',
    eventId: '',
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
    get().fetchTeams();
  },

  resetFilters: () => {
    set({
      filters: { status: 'all', search: '', eventId: '' },
    });
    get().fetchTeams();
  },

  fetchTeams: async () => {
    set({ loading: true });
    try {
      const { status, search, eventId } = get().filters;
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (search) params.append('search', search);
      if (eventId) params.append('eventId', eventId);

      const res = await api.get(`/teams?${params.toString()}`);
      if (res.data.success) {
        set({ teams: res.data.teams, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err: any) {
      set({ loading: false });
      console.error('Failed to fetch teams:', err);
    }
  },

  createTeam: async (payload) => {
    set({ actionLoading: true });
    try {
      const res = await api.post('/teams', payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Team created successfully');
        await get().fetchTeams();
        set({ actionLoading: false });
        return true;
      }
      set({ actionLoading: false });
      return false;
    } catch (err: any) {
      set({ actionLoading: false });
      toast.error(err.response?.data?.error || 'Failed to create team');
      return false;
    }
  },

  updateTeam: async (id, payload) => {
    set({ actionLoading: true });
    try {
      const res = await api.put(`/teams/${id}`, payload);
      if (res.data.success) {
        toast.success('Team updated successfully');
        await get().fetchTeams();
        set({ actionLoading: false });
        return true;
      }
      set({ actionLoading: false });
      return false;
    } catch (err: any) {
      set({ actionLoading: false });
      toast.error(err.response?.data?.error || 'Failed to update team');
      return false;
    }
  },

  deleteTeam: async (id) => {
    set({ actionLoading: true });
    try {
      const res = await api.delete(`/teams/${id}`);
      if (res.data.success) {
        toast.success('Team deleted successfully');
        set((state) => ({
          teams: state.teams.filter((t) => t._id !== id),
          actionLoading: false,
        }));
        return true;
      }
      set({ actionLoading: false });
      return false;
    } catch (err: any) {
      set({ actionLoading: false });
      toast.error(err.response?.data?.error || 'Failed to delete team');
      return false;
    }
  },

  setTeamStatus: async (id, status) => {
    set({ actionLoading: true });
    try {
      const res = await api.patch(`/teams/${id}/status`, { status });
      if (res.data.success) {
        toast.success(`Team status updated to ${status}`);
        set((state) => ({
          teams: state.teams.map((t) => (t._id === id ? res.data.team : t)),
          actionLoading: false,
        }));
        return true;
      }
      set({ actionLoading: false });
      return false;
    } catch (err: any) {
      set({ actionLoading: false });
      toast.error(err.response?.data?.error || 'Failed to update team status');
      return false;
    }
  },

  assignMembers: async (id, members) => {
    set({ actionLoading: true });
    try {
      const res = await api.post(`/teams/${id}/members`, { members });
      if (res.data.success) {
        toast.success(res.data.message || 'Members mapped successfully');
        set((state) => ({
          teams: state.teams.map((t) => (t._id === id ? res.data.team : t)),
          actionLoading: false,
        }));
        return true;
      }
      set({ actionLoading: false });
      return false;
    } catch (err: any) {
      set({ actionLoading: false });
      toast.error(err.response?.data?.error || 'Failed to assign members');
      return false;
    }
  },

  removeMember: async (id, userId) => {
    set({ actionLoading: true });
    try {
      const res = await api.delete(`/teams/${id}/members/${userId}`);
      if (res.data.success) {
        toast.success('Student removed from team');
        set((state) => ({
          teams: state.teams.map((t) => (t._id === id ? res.data.team : t)),
          actionLoading: false,
        }));
        return true;
      }
      set({ actionLoading: false });
      return false;
    } catch (err: any) {
      set({ actionLoading: false });
      toast.error(err.response?.data?.error || 'Failed to remove student');
      return false;
    }
  },
}));

export default useTeamStore;
