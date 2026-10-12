import { create } from 'zustand';
import api from '../lib/axios';
import {
  IDomain,
  ILevel,
  IQuestSubmitResult,
  IStudentProgress,
  IEnrolledStudent,
  ICourseAccessConfig,
  IStudentAccessItem,
  IStudentAccessPagination,
} from '../types/domain';
import toast from 'react-hot-toast';

interface DomainState {
  domains: IDomain[];
  currentDomain: IDomain | null;
  levels: ILevel[];
  activeLevel: ILevel | null;
  userProgress: IStudentProgress;
  enrolledStudents: IEnrolledStudent[];
  loadingStudents: boolean;
  loading: boolean;
  submittingQuest: boolean;
  lastQuestResult: IQuestSubmitResult | null;
  isQuestModalOpen: boolean;
  error: string | null;

  // Course Access Control & Visibility
  courseAccessConfig: ICourseAccessConfig | null;
  studentAccessList: IStudentAccessItem[];
  studentAccessPagination: IStudentAccessPagination;
  loadingStudentAccess: boolean;
  isComingSoon: boolean;
  hasCourseAccess: boolean;
  isEarlyAccess: boolean;

  // Actions
  fetchDomains: () => Promise<void>;
  fetchDomainLevels: (domainId: string) => Promise<void>;
  setActiveLevel: (level: ILevel | null) => void;
  openQuestModal: () => void;
  closeQuestModal: () => void;
  resetQuestResult: () => void;
  submitQuest: (levelId: string, answers: number[]) => Promise<IQuestSubmitResult | null>;
  registerForDomain: (domainId: string) => Promise<boolean>;
  fetchEnrolledStudents: (domainId: string, search?: string) => Promise<IEnrolledStudent[]>;

  // SuperAdmin Access Control Actions
  fetchCourseAccessConfig: () => Promise<void>;
  toggleCourseVisibility: (visible: boolean) => Promise<boolean>;
  fetchStudentAccessList: (options?: string | {
    search?: string;
    page?: number;
    limit?: number;
    filter?: 'all' | 'allowed' | 'locked';
  }) => Promise<IStudentAccessItem[]>;
  setStudentCourseAccess: (studentId: string, allow: boolean) => Promise<boolean>;
  batchSetCourseAccess: (action: 'allow_all' | 'revoke_all') => Promise<boolean>;

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
  enrolledStudents: [],
  loadingStudents: false,
  loading: false,
  submittingQuest: false,
  lastQuestResult: null,
  isQuestModalOpen: false,
  error: null,

  courseAccessConfig: null,
  studentAccessList: [],
  studentAccessPagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    totalStudents: 0,
    totalAllowed: 0,
  },
  loadingStudentAccess: false,
  isComingSoon: false,
  hasCourseAccess: true,
  isEarlyAccess: false,

  fetchDomains: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.get('/courses');
      if (res.data?.success) {
        const isComingSoon = Boolean(res.data.isComingSoon);
        const hasAccess = res.data.hasAccess !== false;
        const isEarlyAccess = Boolean(res.data.isEarlyAccess);
        set({
          domains: res.data.data || [],
          isComingSoon,
          hasCourseAccess: hasAccess,
          isEarlyAccess,
          courseAccessConfig: res.data.config
            ? {
                coursesVisibleToAll: res.data.config.coursesVisibleToAll,
                hasAccess,
                isComingSoon,
                isEarlyAccess,
                allowedStudentsCount: res.data.config.allowedStudentsCount,
              }
            : get().courseAccessConfig,
          loading: false,
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to fetch courses';
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
          const ptsMsg = result.pointsAwarded && result.pointsAwarded > 0 ? ` (+${result.pointsAwarded} pts earned!)` : '';
          if (result.requiresCodingAssessment) {
            toast.success(`🎉 Quest Passed (${result.passRate}%)! Coding assessment unlocked.${ptsMsg}`);
          } else {
            toast.success(`🎉 Level Mastered (${result.passRate}%)!${ptsMsg} Next level unlocked.`);
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

  registerForDomain: async (domainId: string) => {
    try {
      const res = await api.post(`/domains/${domainId}/register`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Successfully registered for course!');
        await get().fetchDomains();
        if (get().currentDomain?._id === domainId) {
          await get().fetchDomainLevels(domainId);
        }
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to register for course';
      toast.error(msg);
      return false;
    }
  },

  fetchEnrolledStudents: async (domainId: string, search?: string) => {
    try {
      set({ loadingStudents: true });
      const params = search ? { search } : {};
      const res = await api.get(`/domains/${domainId}/students`, { params });
      if (res.data?.success) {
        const students = res.data.data?.students || [];
        set({ enrolledStudents: students, loadingStudents: false });
        return students;
      }
      set({ loadingStudents: false });
      return [];
    } catch (err: any) {
      set({ loadingStudents: false });
      const msg = err.response?.data?.error || err.message || 'Failed to fetch registered students';
      toast.error(msg);
      return [];
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
        const updatedLevel = res.data.data;
        if (updatedLevel) {
          set((state) => ({
            levels: state.levels.map((lvl) => (lvl._id === id ? { ...lvl, ...updatedLevel } : lvl)),
            activeLevel:
              state.activeLevel?._id === id ? { ...state.activeLevel, ...updatedLevel } : state.activeLevel,
          }));
        }
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

  fetchCourseAccessConfig: async () => {
    try {
      const res = await api.get('/courses/config/access');
      if (res.data?.success) {
        set({
          courseAccessConfig: res.data.data,
          isComingSoon: Boolean(res.data.data.isComingSoon),
          hasCourseAccess: res.data.data.hasAccess !== false,
          isEarlyAccess: Boolean(res.data.data.isEarlyAccess),
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch course access config:', err);
    }
  },

  toggleCourseVisibility: async (visible: boolean) => {
    try {
      const res = await api.patch('/courses/config/visibility', { coursesVisibleToAll: visible });
      if (res.data?.success) {
        toast.success(res.data.message || 'Course visibility updated');
        set({
          courseAccessConfig: {
            coursesVisibleToAll: res.data.data.coursesVisibleToAll,
            hasAccess: true,
            isComingSoon: !res.data.data.coursesVisibleToAll,
            allowedStudentsCount: res.data.data.allowedStudentsCount,
          },
        });
        await get().fetchDomains();
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to toggle visibility');
      return false;
    }
  },

  fetchStudentAccessList: async (options?: string | {
    search?: string;
    page?: number;
    limit?: number;
    filter?: 'all' | 'allowed' | 'locked';
  }) => {
    try {
      set({ loadingStudentAccess: true });
      const params: Record<string, any> = {};
      if (typeof options === 'string') {
        if (options.trim()) params.search = options.trim();
      } else if (options) {
        if (options.search?.trim()) params.search = options.search.trim();
        if (options.page) params.page = options.page;
        if (options.limit) params.limit = options.limit;
        if (options.filter && options.filter !== 'all') params.filter = options.filter;
      }

      const res = await api.get('/courses/config/students', { params });
      if (res.data?.success) {
        const data = res.data.data;
        const students = data.students || [];
        set({
          studentAccessList: students,
          studentAccessPagination: {
            total: data.total ?? students.length,
            page: data.page ?? 1,
            limit: data.limit ?? 10,
            totalPages: data.totalPages ?? 1,
            totalStudents: data.totalStudents ?? data.total ?? students.length,
            totalAllowed: data.totalAllowed ?? 0,
          },
          loadingStudentAccess: false,
        });
        return students;
      }
      set({ loadingStudentAccess: false });
      return [];
    } catch (err: any) {
      set({ loadingStudentAccess: false });
      toast.error(err.response?.data?.error || 'Failed to fetch student access directory');
      return [];
    }
  },

  setStudentCourseAccess: async (studentId: string, allow: boolean) => {
    try {
      const res = await api.post('/courses/config/allow-student', { studentId, allow });
      if (res.data?.success) {
        toast.success(res.data.message);
        set((state) => ({
          studentAccessList: state.studentAccessList.map((s) =>
            s._id === studentId ? { ...s, isAllowed: allow } : s
          ),
          studentAccessPagination: {
            ...state.studentAccessPagination,
            totalAllowed: res.data.data?.allowedStudentsCount ?? state.studentAccessPagination.totalAllowed,
          },
          courseAccessConfig: state.courseAccessConfig
            ? {
                ...state.courseAccessConfig,
                allowedStudentsCount: res.data.data.allowedStudentsCount,
              }
            : null,
        }));
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update student access');
      return false;
    }
  },

  batchSetCourseAccess: async (action: 'allow_all' | 'revoke_all') => {
    try {
      const res = await api.post('/courses/config/batch-allow', { action });
      if (res.data?.success) {
        toast.success(res.data.message);
        const isAllowedAll = action === 'allow_all';
        set((state) => ({
          studentAccessList: state.studentAccessList.map((s) => ({ ...s, isAllowed: isAllowedAll })),
          studentAccessPagination: {
            ...state.studentAccessPagination,
            totalAllowed: res.data.data?.allowedStudentsCount ?? state.studentAccessPagination.totalAllowed,
          },
          courseAccessConfig: state.courseAccessConfig
            ? {
                ...state.courseAccessConfig,
                allowedStudentsCount: res.data.data.allowedStudentsCount,
              }
            : null,
        }));
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to batch update student access');
      return false;
    }
  },
}));

export default useDomainStore;
