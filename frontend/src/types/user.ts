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
  skills?: string[];
  socialLinks?: SocialLinks;
  profilePicUrl?: string;
  isBlocked?: boolean;
  activeSessionId?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
