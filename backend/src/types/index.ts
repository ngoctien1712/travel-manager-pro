export type UserRole = 'admin' | 'customer' | 'owner';
export type UserStatus = 'pending' | 'active' | 'inactive' | 'banned';

export * from './geography.js';

export interface UserRow {
  id_user: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  status: string;
  email_verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithProfile extends UserRow {
  role: UserRole;
  profile?: Record<string, unknown>;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
