export type UserRole = 'Student' | 'Admin' | 'SuperAdmin' | 'Member' | 'Faculty' | 'Committee';

export interface ISocialLinks {
  github?: string;
  linkedin?: string;
  leetcode?: string;
  hackerrank?: string;
  instagram?: string;
  email?: string;
}

export interface UserPayload {
  id: string;
  _id?: string;
  email: string;
  role: UserRole;
  name?: string;
  rollNo?: string;
  department?: string;
  sessionId?: string;
}

export interface UserResponse {
  _id: string;
  id?: string;
  name: string;
  rollNo: string;
  email: string;
  role: UserRole;
  department?: string;
  college?: string;
  year?: string;
  skills: string[];
  socialLinks: ISocialLinks;
  profilePicUrl?: string;
  isBlocked: boolean;
  activeSessionId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    users: T[];
    pagination: PaginationMeta;
  };
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: 'all' | 'active' | 'blocked';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserPayload;
  }
}
