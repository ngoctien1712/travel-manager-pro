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
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    httpClient.post<LoginResponse>('/auth/login', { email, password }),

  register: (data: RegisterRequest) =>
    httpClient.post<LoginResponse>('/auth/register', data),

  registerBusiness: (data: FormData) =>
    httpClient.post<{ message: string; data: any }>('/auth/register-business', data),

  logout: (refreshToken?: string | null) =>
    httpClient.post<{ message: string }>('/auth/logout', { refreshToken }),

  googleLogin: (data: { idToken?: string; accessToken?: string }) =>
    httpClient.post<LoginResponse>('/auth/google-login', data),

  refreshToken: (refreshToken: string) =>
    httpClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh-token', { refreshToken }),

  forgotPassword: (email: string) =>
    httpClient.post<{ message: string; resetLink?: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    httpClient.post<{ message: string }>('/auth/reset-password', { token, password }),

  verifyAccount: (token: string) =>
    httpClient.post<{ message: string }>('/auth/verify-account', { token }),
};
