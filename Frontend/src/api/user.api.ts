import { httpClient } from './http';
import type { UserRole } from '@/types/dto';

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  status: string;
  role: UserRole;
  emailVerified: boolean;
  profile?: {
    date?: string;
    travel_style?: string;
    business_name?: string;
    department?: string;
  };
  createdAt: string;
}

export const userApi = {
  getProfile: () => httpClient.get<UserProfile>('/users/profile'),

  updateProfile: (data: Partial<UserProfile> & { profile?: Record<string, unknown> }) =>
    httpClient.patch<UserProfile>('/users/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    httpClient.post<{ message: string }>('/users/change-password', {
      currentPassword,
      newPassword,
    }),
};
