export type UserRole = 'Student' | 'Admin' | 'SuperAdmin';

export interface UserPayload {
  id: string;
  email: string;
  role: UserRole;
  sessionId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserPayload;
  }
}
