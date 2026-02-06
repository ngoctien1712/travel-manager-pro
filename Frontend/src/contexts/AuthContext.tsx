import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { UserRole } from '@/types/dto';
import { authApi } from '@/api/auth.api';
import { userApi, type UserProfile } from '@/api/user.api';

interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  phone?: string | null;
  role: UserRole;
  status?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const profile = await userApi.getProfile();
      setUser({
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        phone: profile.phone,
        role: profile.role as UserRole,
        status: profile.status,
      });
    } catch {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setIsLoading(false);
      return;
    }
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('authToken', res.token);
    localStorage.setItem('userRole', res.user.role);
    setUser({
      id: res.user.id,
      email: res.user.email,
      fullName: res.user.fullName,
      phone: res.user.phone,
      role: res.user.role,
      status: res.user.status,
    });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
