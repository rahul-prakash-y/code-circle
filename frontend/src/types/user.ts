export type UserRole = 'Student' | 'Admin' | 'SuperAdmin' | 'Member' | 'Faculty' | 'Committee';

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  leetcode?: string;
  hackerrank?: string;
  instagram?: string;
  email?: string;
}

export interface User {
  _id: string;
  id?: string;
  name: string;
  rollNo: string;
  email: string;
  role: UserRole;
  department?: string;
  college?: string;
  year?: string;
  hasChangedDefaultPassword?: boolean;
  mustChangePassword?: boolean;
  isOnboarded?: boolean;
  onboardingStatus?: 'Completed' | 'Pending' | 'In Progress' | 'Claimed';
  skills?: string[];
  socialLinks?: SocialLinks;
  profilePicUrl?: string;
  isBlocked?: boolean;
  activeSessionId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OnboardingStatusItem {
  status: string;
  label: string;
  mustChangePassword?: boolean;
  isOnboarded?: boolean;
  count: number;
  percentage: number;
  color: string;
}

export interface OnboardingStats {
  total: number;
  onboarded: number;
  notOnboarded: number;
  completionRate: number;
  breakdown: OnboardingStatusItem[];
  rawCounts?: {
    true: number;
    false: number;
  };
  rawGrouping?: Array<{ _id: boolean | string; count: number }>;
  departments?: string[];
}

export interface OnboardingStatsApiResponse {
  success: boolean;
  stats: OnboardingStats;
  students: User[];
  data?: {
    stats: OnboardingStats;
    students: User[];
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedUsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: PaginationMeta;
  };
  message?: string;
}

export interface UserFilters {
  search: string;
  role: string;
  status: 'all' | 'active' | 'blocked';
  page: number;
  limit: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  rollNo: string;
  role?: UserRole;
  department?: string;
  password?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  rollNo?: string;
  role?: UserRole;
  department?: string;
  skills?: string[];
  socialLinks?: SocialLinks;
}

export interface ResetLinkResponse {
  success: boolean;
  message: string;
  resetLink: string;
  expiresAt: string;
}

export interface ForceResetResponse {
  success: boolean;
  message: string;
  temporaryPassword: string;
  user: User;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
  token: string;
  sessionId?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  token: string | null;
  sessionId: string | null;
}
