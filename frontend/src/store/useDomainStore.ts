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
        // Keep active level if still within the levels, or pick first unlocked incomplete level, or first level
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
          toast.success('🎉 Quest Mastered! 100% Score! Assessment unlocked.');

          // Refresh current domain levels to update unlocked & completed indicators
          const currentDomain = get().currentDomain;
          if (currentDomain?._id) {
            await get().fetchDomainLevels(currentDomain._id);
          }
        } else {
          toast.error(`Score: ${result.score}/${result.total}. Review the video and try again!`);
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
}));

export default useDomainStore;
