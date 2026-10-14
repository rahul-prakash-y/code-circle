import { create } from 'zustand';
import api from '../lib/axios';

export interface PointTransactionItem {
  id: string;
  title: string;
  description?: string;
  category: 'Attendance' | 'Coding' | 'Course' | 'Contest' | 'Bonus' | 'Adjustment' | 'Assessment';
  amount: number;
  classHours?: number[];
  classHoursText?: string;
  timestamp: string;
  awardedBy?: string | null;
  source?: string;
}

export interface PointsSummary {
  attendance: {
    points: number;
    sessionsCount: number;
    totalClubHours: number;
  };
  coding: {
    points: number;
    completedLevels: number;
  };
  contests: {
    points: number;
    participatedCount: number;
  };
  courses: {
    points: number;
    completedQuests: number;
  };
  assessment?: {
    points: number;
    completedCount: number;
  };
  bonus: {
    points: number;
  };
}

export interface StudentPointsData {
  student: {
    _id: string;
    name: string;
    rollNo: string;
    email: string;
    department: string;
    college: string;
    year: string;
    profilePicUrl?: string;
    role: string;
  };
  totalPoints: number;
  rank: number;
  totalStudents: number;
  tier: {
    name: string;
    level: number;
    color: string;
    nextTierPoints: number;
    progressPercent: number;
  };
  summary: PointsSummary;
  transactions: PointTransactionItem[];
}

export interface AdminPointsOverview {
  totalPoints: number;
  avgPoints: number;
  totalStudents: number;
  studentsWithPoints: number;
  totalClubHours: number;
  totalAttendancePoints: number;
  topDepartment: { name: string; points: number } | null;
  tierDistribution: Record<string, number>;
}

export interface AdminStudentItem {
  _id: string;
  name: string;
  rollNo: string;
  email: string;
  department: string;
  college: string;
  year: string;
  profilePicUrl?: string;
  totalPoints: number;
  tier: {
    name: string;
    level: number;
    color: string;
    nextTierPoints: number;
    progressPercent: number;
  };
  attendancePoints: number;
  totalClubHours: number;
  sessionsCount: number;
  otherPoints: number;
}

interface PointsState {
  // Student self state
  myPointsData: StudentPointsData | null;
  loadingMyPoints: boolean;
  myPointsError: string | null;

  // Admin state
  adminOverview: AdminPointsOverview | null;
  loadingOverview: boolean;
  adminStudents: AdminStudentItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  loadingStudents: boolean;
  adminError: string | null;

  // Selected student audit state
  selectedAudit: StudentPointsData | null;
  loadingAudit: boolean;
  auditError: string | null;

  // Actions
  fetchMyPoints: () => Promise<StudentPointsData | null>;
  fetchAdminOverview: () => Promise<void>;
  fetchAdminStudents: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    year?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => Promise<void>;
  fetchStudentAudit: (userId: string) => Promise<StudentPointsData | null>;
  awardBonusPoints: (payload: {
    studentId: string;
    amount: number;
    category?: string;
    title: string;
    description?: string;
  }) => Promise<boolean>;
  clearSelectedAudit: () => void;
}

export const usePointsStore = create<PointsState>((set, get) => ({
  myPointsData: null,
  loadingMyPoints: false,
  myPointsError: null,

  adminOverview: null,
  loadingOverview: false,
  adminStudents: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
  loadingStudents: false,
  adminError: null,

  selectedAudit: null,
  loadingAudit: false,
  auditError: null,

  fetchMyPoints: async () => {
    set({ loadingMyPoints: true, myPointsError: null });
    try {
      const response = await api.get('/points/my-points');
      if (response.data?.success) {
        set({ myPointsData: response.data.data, loadingMyPoints: false });
        return response.data.data;
      }
      set({ loadingMyPoints: false });
      return null;
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to fetch points';
      set({ myPointsError: message, loadingMyPoints: false });
      return null;
    }
  },

  fetchAdminOverview: async () => {
    set({ loadingOverview: true, adminError: null });
    try {
      const response = await api.get('/points/admin/overview');
      if (response.data?.success) {
        set({ adminOverview: response.data.data, loadingOverview: false });
      } else {
        set({ loadingOverview: false });
      }
    } catch (err: any) {
      set({
        adminError: err.response?.data?.error || 'Failed to fetch points overview',
        loadingOverview: false,
      });
    }
  },

  fetchAdminStudents: async (params = {}) => {
    set({ loadingStudents: true, adminError: null });
    try {
      const response = await api.get('/points/admin/students', { params });
      if (response.data?.success) {
        set({
          adminStudents: response.data.data.students || [],
          pagination: response.data.data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
          loadingStudents: false,
        });
      } else {
        set({ loadingStudents: false });
      }
    } catch (err: any) {
      set({
        adminError: err.response?.data?.error || 'Failed to fetch students points list',
        loadingStudents: false,
      });
    }
  },

  fetchStudentAudit: async (userId: string) => {
    set({ loadingAudit: true, auditError: null });
    try {
      const response = await api.get(`/points/admin/students/${userId}`);
      if (response.data?.success) {
        set({ selectedAudit: response.data.data, loadingAudit: false });
        return response.data.data;
      }
      set({ loadingAudit: false });
      return null;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch student point audit';
      set({ auditError: message, loadingAudit: false });
      return null;
    }
  },

  awardBonusPoints: async (payload) => {
    try {
      const response = await api.post('/points/admin/award', payload);
      if (response.data?.success) {
        // If auditing this student, refresh their audit
        if (get().selectedAudit?.student?._id === payload.studentId) {
          get().fetchStudentAudit(payload.studentId);
        }
        // Refresh overview
        get().fetchAdminOverview();
        return true;
      }
      return false;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to award points');
    }
  },

  clearSelectedAudit: () => set({ selectedAudit: null, auditError: null }),
}));

export default usePointsStore;
