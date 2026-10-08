import { create } from 'zustand';
import api from '../lib/axios';
import { IDomain, ILevel, IQuestSubmitResult, IStudentProgress } from '../types/domain';
import toast from 'react-hot-toast';

interface DomainState {
  domains: IDomain[];
  currentDomain: IDomain | null;
  levels: ILevel[];
  activeLevel: ILevel | null;
  userProgress: IStudentProgress;
  loading: boolean;
  submittingQuest: boolean;
  lastQuestResult: IQuestSubmitResult | null;
  isQuestModalOpen: boolean;
  error: string | null;

  // Actions
  fetchDomains: () => Promise<void>;
  fetchDomainLevels: (domainId: string) => Promise<void>;
  setActiveLevel: (level: ILevel | null) => void;
  openQuestModal: () => void;
  closeQuestModal: () => void;
  resetQuestResult: () => void;
  submitQuest: (levelId: string, answers: number[]) => Promise<IQuestSubmitResult | null>;

  // Admin Management Actions
  createDomain: (payload: { name: string; description: string; coverImageUrl: string; isLocked?: boolean }) => Promise<boolean>;
  updateDomain: (id: string, payload: { name: string; description: string; coverImageUrl: string; isLocked?: boolean }) => Promise<boolean>;
  toggleDomainLock: (id: string) => Promise<boolean>;
  deleteDomain: (id: string) => Promise<boolean>;
  createLevel: (domainId: string, payload: Partial<ILevel>) => Promise<boolean>;
  updateLevel: (id: string, payload: Partial<ILevel>) => Promise<boolean>;
  deleteLevel: (id: string) => Promise<boolean>;
}

export const useDomainStore = create<DomainState>((set, get) => ({
  domains: [],
  currentDomain: null,
  levels: [],
  activeLevel: null,
  userProgress: {
    completedLevels: [],
    unlockedAssessments: [],
  },
  loading: false,
  submittingQuest: false,
  lastQuestResult: null,
  isQuestModalOpen: false,
  error: null,

  fetchDomains: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.get('/domains');
      if (res.data?.success) {
        set({ domains: res.data.data || [], loading: false });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to fetch domains';
      set({ error: msg, loading: false });
      toast.error(msg);
    }
  },

  fetchDomainLevels: async (domainId: string) => {
    try {
      set({ loading: true, error: null });
      const res = await api.get(`/domains/${domainId}/levels`);
      if (res.data?.success) {
        const { domain, levels, userProgress } = res.data.data;
        const currentActive = get().activeLevel;
        let nextActive = levels.find((lvl: ILevel) => lvl._id === currentActive?._id);
        if (!nextActive) {
          nextActive = levels.find((lvl: ILevel) => lvl.isUnlocked && !lvl.isCompleted) || levels[0] || null;
        }

        set({
          currentDomain: domain,
          levels: levels || [],
          activeLevel: nextActive,
          userProgress: userProgress || { completedLevels: [], unlockedAssessments: [] },
          loading: false,
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to fetch domain levels';
      set({ error: msg, loading: false });
      toast.error(msg);
    }
  },

  setActiveLevel: (level: ILevel | null) => {
    set({ activeLevel: level, lastQuestResult: null });
  },

  openQuestModal: () => {
    set({ isQuestModalOpen: true, lastQuestResult: null });
  },

  closeQuestModal: () => {
    set({ isQuestModalOpen: false });
  },

  resetQuestResult: () => {
    set({ lastQuestResult: null });
  },

  submitQuest: async (levelId: string, answers: number[]) => {
    try {
      set({ submittingQuest: true });
      const res = await api.post(`/levels/${levelId}/submit-quest`, { answers });
      if (res.data?.success) {
        const result: IQuestSubmitResult = res.data.data;
        set({ lastQuestResult: result, submittingQuest: false });

        if (result.passed) {
          if (result.requiresCodingAssessment) {
            toast.success(`🎉 Quest Passed (${result.passRate}%)! Coding assessment unlocked.`);
          } else {
            toast.success(`🎉 Quest Mastered (${result.passRate}%)! Next level unlocked.`);
          }

          // Refresh current domain levels to update unlocked & completed indicators
          const currentDomain = get().currentDomain;
          if (currentDomain?._id) {
            await get().fetchDomainLevels(currentDomain._id);
          }
        } else {
          toast.error(`Score: ${result.score}/${result.total} (${result.passRate}%). Review the video and try again (70% required)!`);
        }

        return result;
      }
      set({ submittingQuest: false });
      return null;
    } catch (err: any) {
      set({ submittingQuest: false });
      const msg = err.response?.data?.error || err.message || 'Failed to submit quest';
      toast.error(msg);
      return null;
    }
  },

  // Admin Actions
  createDomain: async (payload) => {
    try {
      const res = await api.post('/domains', payload);
      if (res.data?.success) {
        toast.success('Domain created successfully');
        await get().fetchDomains();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create domain');
      return false;
    }
  },

  updateDomain: async (id, payload) => {
    try {
      const res = await api.put(`/domains/${id}`, payload);
      if (res.data?.success) {
        toast.success('Domain updated successfully');
        await get().fetchDomains();
        if (get().currentDomain?._id === id) {
          set({ currentDomain: res.data.data });
        }
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update domain');
      return false;
    }
  },

  toggleDomainLock: async (id: string) => {
    try {
      const res = await api.patch(`/domains/${id}/toggle-lock`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Domain lock status updated');
        await get().fetchDomains();
        if (get().currentDomain?._id === id) {
          set((state) => ({
            currentDomain: state.currentDomain
              ? {
                  ...state.currentDomain,
                  ...res.data.data,
                  isLocked: Boolean(res.data.data.isLocked),
                }
              : null,
          }));
          await get().fetchDomainLevels(id);
        }
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to toggle domain lock');
      return false;
    }
  },

  deleteDomain: async (id) => {
    try {
      const res = await api.delete(`/domains/${id}`);
      if (res.data?.success) {
        toast.success('Domain deleted successfully');
        await get().fetchDomains();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete domain');
      return false;
    }
  },

  createLevel: async (domainId, payload) => {
    try {
      const res = await api.post(`/domains/${domainId}/levels`, payload);
      if (res.data?.success) {
        toast.success('Level created successfully');
        await get().fetchDomainLevels(domainId);
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create level');
      return false;
    }
  },

  updateLevel: async (id, payload) => {
    try {
      const res = await api.put(`/levels/${id}`, payload);
      if (res.data?.success) {
        toast.success('Level updated successfully');
        const currentDomain = get().currentDomain;
        if (currentDomain?._id) {
          await get().fetchDomainLevels(currentDomain._id);
        }
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update level');
      return false;
    }
  },

  deleteLevel: async (id) => {
    try {
      const res = await api.delete(`/levels/${id}`);
      if (res.data?.success) {
        toast.success('Level deleted successfully');
        const currentDomain = get().currentDomain;
        if (currentDomain?._id) {
          await get().fetchDomainLevels(currentDomain._id);
        }
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete level');
      return false;
    }
  },
}));

export default useDomainStore;
