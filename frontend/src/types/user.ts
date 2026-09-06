export type UserRole = 'Student' | 'Admin' | 'SuperAdmin';

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

export interface AuthResponse {
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
