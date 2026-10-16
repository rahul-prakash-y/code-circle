import { create } from 'zustand';
import api from '../lib/axios';
import { toast } from 'react-hot-toast';

export interface MCQQuestion {
  _id: string;
  question: string;
  options: string[];
  points: number;
  correctOptionIndex?: number;
  explanation?: string;
}

export interface CodingProblemTestCase {
  _id?: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface CodingProblem {
  _id: string;
  title: string;
  description: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  allowedLanguages: string[];
  starterCode: Record<string, string>;
  sampleInput?: string;
  sampleOutput?: string;
  testCases?: CodingProblemTestCase[];
}

export interface Contest {
  _id: string;
  title: string;
  slug: string;
  description: string;
  type: 'CODING' | 'MCQ' | 'HYBRID';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalPoints: number;
  pointAllocationMode?: 'AUTOMATIC' | 'MANUAL' | 'HYBRID';
  status: 'UPCOMING' | 'LIVE' | 'ENDED' | 'DRAFT';
  rules: string[];
  bannerUrl?: string;
  tags: string[];
  mcqQuestions?: MCQQuestion[];
  codingProblems?: CodingProblem[];
  isPublished: boolean;
  participantsCount: number;
  mySubmission?: any;
  mcqCount?: number;
  codingCount?: number;
  createdAt: string;
}

export interface ContestSession {
  _id: string;
  contestId: string;
  userId: string;
  startedAt: string;
  expiresAt: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_EXPIRED';
  mcqAnswers: Array<{
    questionId: string;
    selectedOption: number;
    isCorrect?: boolean;
    pointsEarned?: number;
  }>;
  codingSubmissions: Array<{
    problemId: string;
    code: string;
    language: string;
    passedTestCases: number;
    totalTestCases: number;
    status: string;
    pointsEarned: number;
    submittedAt: string;
  }>;
  totalScore: number;
  timeTakenSeconds: number;
  pointsAwarded?: boolean;
  awardedClubPoints?: number;
  reentryRequested?: boolean;
  reentryReason?: string;
  reentryStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  reentryRequestedAt?: string | null;
  reentryApprovedAt?: string | null;
  reentryApprovedBy?: any;
  reentryReviewNote?: string;
  reentryCount?: number;
}

export interface LeaderboardEntry {
  rank: number;
  submissionId: string;
  user: {
    _id: string;
    name: string;
    rollNo?: string;
    email?: string;
    profilePicUrl?: string;
    avatar?: string;
    department?: string;
  };
  totalScore: number;
  mcqScore: number;
  codingScore: number;
  timeTakenSeconds: number;
  status: string;
  awardedClubPoints: number;
  pointsAwarded?: boolean;
  manualPointsAdjustment?: number;
  manualPointsReason?: string;
  manualAllocatedAt?: string | null;
  submittedAt?: string;
}

interface ContestState {
  contests: Contest[];
  activeContest: Contest | null;
  activeSession: ContestSession | null;
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  executing: boolean;
  submitting: boolean;
  error: string | null;

  fetchContests: () => Promise<void>;
  fetchContestById: (id: string) => Promise<Contest | null>;
  startSession: (contestId: string) => Promise<ContestSession | null>;
  runCode: (
    contestId: string,
    problemId: string,
    code: string,
    language: string,
    customInput?: string
  ) => Promise<any>;
  submitProblemCode: (
    contestId: string,
    problemId: string,
    code: string,
    language: string
  ) => Promise<any>;
  submitContest: (
    contestId: string,
    mcqAnswers: Array<{ questionId: string; selectedOption: number }>
  ) => Promise<any>;
  fetchLeaderboard: (contestId: string) => Promise<void>;
  createContest: (data: Partial<Contest>) => Promise<boolean>;
  updateContest: (id: string, data: Partial<Contest>) => Promise<boolean>;
  deleteContest: (id: string) => Promise<boolean>;
  allocateSubmissionPoints: (
    contestId: string,
    submissionId: string,
    data: { awardedClubPoints?: number; bonusPoints?: number; reason?: string }
  ) => Promise<boolean>;
  bulkAllocatePoints: (
    contestId: string,
    payload: { preset?: string; bonusPoints?: number; reason?: string; allocations?: any[] }
  ) => Promise<boolean>;
  fetchContestSubmissions: (
    contestId: string
  ) => Promise<{ success: boolean; data?: any[]; contest?: any; error?: string }>;
  fetchMyContestSubmission: (
    contestId: string
  ) => Promise<{ success: boolean; data?: any; contest?: any; error?: string }>;
  fetchSingleSubmissionForAdmin: (
    contestId: string,
    submissionId: string
  ) => Promise<{ success: boolean; data?: any; contest?: any; error?: string }>;
  requestReentry: (
    contestId: string,
    reason: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  approveReentry: (
    contestId: string,
    submissionId: string,
    data?: { durationMinutes?: number; note?: string }
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  rejectReentry: (
    contestId: string,
    submissionId: string,
    note?: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  deleteSubmission: (
    contestId: string,
    submissionId: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  downloadContestMcqTemplate: () => Promise<void>;
  downloadContestCodingTemplate: () => Promise<void>;
  parseContestMcqUpload: (file: File) => Promise<{ success: boolean; data?: MCQQuestion[]; count?: number; error?: string; errors?: string[] }>;
  parseContestCodingUpload: (file: File) => Promise<{ success: boolean; data?: CodingProblem[]; count?: number; error?: string; errors?: string[] }>;
}

export const useContestStore = create<ContestState>((set, get) => ({
  contests: [],
  activeContest: null,
  activeSession: null,
  leaderboard: [],
  loading: false,
  executing: false,
  submitting: false,
  error: null,

  fetchContests: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/contests');
      set({ contests: res.data.data || [], loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error || 'Failed to load contests' });
    }
  },

  fetchContestById: async (id) => {
    set({ loading: true });
    try {
      const res = await api.get(`/contests/${id}`);
      const contest = res.data.data;
      set({
        activeContest: contest,
        activeSession: contest.mySubmission || null,
        loading: false,
      });
      return contest;
    } catch (err: any) {
      set({ loading: false });
      toast.error('Failed to load contest details');
      return null;
    }
  },

  startSession: async (contestId) => {
    set({ loading: true });
    try {
      const res = await api.post(`/contests/${contestId}/start`);
      const session = res.data.submission;
      set({ activeSession: session, loading: false });
      toast.success(res.data.message || 'Contest session initialized!');
      return session;
    } catch (err: any) {
      set({ loading: false });
      toast.error(err.response?.data?.error || 'Failed to start session');
      return null;
    }
  },

  runCode: async (contestId, problemId, code, language, customInput) => {
    set({ executing: true });
    try {
      const res = await api.post(`/contests/${contestId}/run-code`, {
        problemId,
        code,
        language,
        customInput,
      });
      set({ executing: false });
      return res.data.data;
    } catch (err: any) {
      set({ executing: false });
      toast.error(err.response?.data?.error || 'Execution failed');
      return null;
    }
  },

  submitProblemCode: async (contestId, problemId, code, language) => {
    set({ executing: true });
    try {
      const res = await api.post(`/contests/${contestId}/submit-code`, {
        problemId,
        code,
        language,
      });
      set({ executing: false });
      const data = res.data.data;
      if (get().activeSession) {
        const sess = get().activeSession!;
        const updatedSubs = [...(sess.codingSubmissions || [])];
        const idx = updatedSubs.findIndex(
          (cs) => cs.problemId?.toString() === problemId.toString()
        );
        const newRecord = {
          problemId,
          code,
          language,
          passedTestCases: data.passedCount,
          totalTestCases: data.totalTests,
          status: data.status,
          pointsEarned: data.pointsEarned,
          submittedAt: new Date().toISOString(),
        };
        if (idx >= 0) {
          updatedSubs[idx] = newRecord;
        } else {
          updatedSubs.push(newRecord);
        }
        set({
          activeSession: {
            ...sess,
            codingSubmissions: updatedSubs,
          },
        });
      }
      if (data.status === 'ACCEPTED') {
        toast.success(`Accepted! All ${data.passedCount}/${data.totalTests} test cases passed! +${data.pointsEarned} pts`);
      } else {
        toast.error(`Passed ${data.passedCount}/${data.totalTests} test cases (+${data.pointsEarned} pts)`);
      }
      return data;
    } catch (err: any) {
      set({ executing: false });
      toast.error(err.response?.data?.error || 'Problem submission failed');
      return null;
    }
  },

  submitContest: async (contestId, mcqAnswers) => {
    set({ submitting: true });
    try {
      const res = await api.post(`/contests/${contestId}/submit`, { mcqAnswers });
      set({ submitting: false, activeSession: res.data.data?.submission || null });
      toast.success(res.data.message || 'Contest submitted!');
      return res.data.data;
    } catch (err: any) {
      set({ submitting: false });
      toast.error(err.response?.data?.error || 'Final submission failed');
      return null;
    }
  },

  fetchLeaderboard: async (contestId) => {
    set({ loading: true });
    try {
      const res = await api.get(`/contests/${contestId}/leaderboard`);
      set({ leaderboard: res.data.data || [], loading: false });
    } catch (err: any) {
      set({ loading: false });
    }
  },

  createContest: async (data) => {
    set({ loading: true });
    try {
      await api.post('/contests', data);
      toast.success('Contest created successfully!');
      get().fetchContests();
      set({ loading: false });
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create contest');
      set({ loading: false });
      return false;
    }
  },

  updateContest: async (id, data) => {
    set({ loading: true });
    try {
      await api.put(`/contests/${id}`, data);
      toast.success('Contest updated successfully!');
      get().fetchContests();
      set({ loading: false });
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update contest');
      set({ loading: false });
      return false;
    }
  },

  deleteContest: async (id) => {
    set({ loading: true });
    try {
      await api.delete(`/contests/${id}`);
      toast.success('Contest deleted');
      get().fetchContests();
      set({ loading: false });
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete contest');
      set({ loading: false });
      return false;
    }
  },

  allocateSubmissionPoints: async (contestId, submissionId, data) => {
    try {
      const res = await api.post(`/contests/${contestId}/submissions/${submissionId}/allocate-points`, data);
      toast.success(res.data.message || 'Points allocated successfully!');
      // Refresh active leaderboard
      await get().fetchLeaderboard(contestId);
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to allocate points');
      return false;
    }
  },

  bulkAllocatePoints: async (contestId, payload) => {
    try {
      const res = await api.post(`/contests/${contestId}/allocate-bulk`, payload);
      toast.success(res.data.message || 'Bulk points allocated successfully!');
      await get().fetchLeaderboard(contestId);
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to bulk allocate points');
      return false;
    }
  },

  fetchContestSubmissions: async (contestId) => {
    try {
      const res = await api.get(`/contests/${contestId}/submissions`);
      return { success: true, data: res.data.data, contest: res.data.contest };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Failed to load submissions' };
    }
  },

  fetchMyContestSubmission: async (contestId) => {
    try {
      const res = await api.get(`/contests/${contestId}/my-submission`);
      return { success: true, data: res.data.data, contest: res.data.contest };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to load your contest submission',
      };
    }
  },

  fetchSingleSubmissionForAdmin: async (contestId, submissionId) => {
    try {
      const res = await api.get(`/contests/${contestId}/submissions/${submissionId}`);
      return { success: true, data: res.data.data, contest: res.data.contest };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to load submission details',
      };
    }
  },

  downloadContestMcqTemplate: async () => {
    try {
      const res = await api.get('/contests/admin/mcq-template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(
        new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'contest_mcq_sample_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Contest MCQ sample template downloaded!');
    } catch (err: any) {
      toast.error('Failed to download MCQ template');
    }
  },

  downloadContestCodingTemplate: async () => {
    try {
      const res = await api.get('/contests/admin/coding-template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(
        new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'contest_coding_sample_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Contest Coding sample template downloaded!');
    } catch (err: any) {
      toast.error('Failed to download Coding template');
    }
  },

  parseContestMcqUpload: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/contests/admin/parse-mcq-upload', formData);
      return {
        success: true,
        count: res.data.count,
        data: res.data.data,
        errors: res.data.errors,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Failed to parse MCQ file',
        errors: err.response?.data?.errors,
      };
    }
  },

  parseContestCodingUpload: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/contests/admin/parse-coding-upload', formData);
      return {
        success: true,
        count: res.data.count,
        data: res.data.data,
        errors: res.data.errors,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Failed to parse Coding file',
        errors: err.response?.data?.errors,
      };
    }
  },

  requestReentry: async (contestId, reason) => {
    try {
      const res = await api.post(`/contests/${contestId}/request-reentry`, { reason });
      toast.success(res.data.message || 'Re-entry request submitted successfully!');
      return { success: true, message: res.data.message };
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to submit re-entry request';
      toast.error(msg);
      return { success: false, error: msg };
    }
  },

  approveReentry: async (contestId, submissionId, data) => {
    try {
      const res = await api.post(
        `/contests/${contestId}/submissions/${submissionId}/approve-reentry`,
        data || {}
      );
      toast.success(res.data.message || 'Contest re-entry approved!');
      return { success: true, message: res.data.message };
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to approve re-entry';
      toast.error(msg);
      return { success: false, error: msg };
    }
  },

  rejectReentry: async (contestId, submissionId, note) => {
    try {
      const res = await api.post(
        `/contests/${contestId}/submissions/${submissionId}/reject-reentry`,
        { note }
      );
      toast.success(res.data.message || 'Re-entry request declined');
      return { success: true, message: res.data.message };
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to decline re-entry';
      toast.error(msg);
      return { success: false, error: msg };
    }
  },

  deleteSubmission: async (contestId, submissionId) => {
    try {
      const res = await api.delete(`/contests/${contestId}/submissions/${submissionId}`);
      toast.success(res.data.message || 'Student contest entry deleted successfully');
      return { success: true, message: res.data.message };
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to delete student entry';
      toast.error(msg);
      return { success: false, error: msg };
    }
  },
}));

export default useContestStore;

