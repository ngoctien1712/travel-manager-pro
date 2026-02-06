import { httpClient } from './http';
import type { UserRole } from '@/types/dto';

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    role: UserRole;
    status: string;
  };
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  role: UserRole;
}

export const authApi = {
  login: (email: string, password: string) =>
    httpClient.post<LoginResponse>('/auth/login', { email, password }),

  register: (data: RegisterRequest) =>
    httpClient.post<LoginResponse>('/auth/register', data),

  logout: () => httpClient.post<{ message: string }>('/auth/logout', {}),

  forgotPassword: (email: string) =>
    httpClient.post<{ message: string; resetLink?: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    httpClient.post<{ message: string }>('/auth/reset-password', { token, password }),

  verifyAccount: (token: string) =>
    httpClient.post<{ message: string }>('/auth/verify-account', { token }),
};
