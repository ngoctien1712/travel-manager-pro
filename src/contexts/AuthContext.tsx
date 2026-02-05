 import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
 import type { UserRole } from '@/types/dto';
 
 interface AuthUser {
   id: string;
   email: string;
   fullName: string;
   role: UserRole;
 }
 
 interface AuthContextType {
   user: AuthUser | null;
   isAuthenticated: boolean;
   isLoading: boolean;
   login: (role: UserRole) => void;
   logout: () => void;
 }
 
 const AuthContext = createContext<AuthContextType | undefined>(undefined);
 
 // Mock users for each role
 const mockAuthUsers: Record<UserRole, AuthUser> = {
   admin: {
     id: 'admin-1',
     email: 'admin@travel.vn',
     fullName: 'Quản trị viên',
     role: 'admin',
   },
   customer: {
     id: 'customer-1',
     email: 'customer@example.com',
     fullName: 'Nguyễn Văn A',
     role: 'customer',
   },
   owner: {
     id: 'owner-1',
     email: 'owner@provider.vn',
     fullName: 'Trần Văn B',
     role: 'owner',
   },
 };
 
 export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
   const [user, setUser] = useState<AuthUser | null>(null);
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     // Check for stored auth on mount
     const storedRole = localStorage.getItem('userRole') as UserRole | null;
     const storedToken = localStorage.getItem('authToken');
     
     if (storedRole && storedToken && mockAuthUsers[storedRole]) {
       setUser(mockAuthUsers[storedRole]);
     }
     setIsLoading(false);
   }, []);
 
   const login = (role: UserRole) => {
     const authUser = mockAuthUsers[role];
     if (authUser) {
       // Store mock token and role
       localStorage.setItem('authToken', `mock-token-${role}-${Date.now()}`);
       localStorage.setItem('userRole', role);
       setUser(authUser);
     }
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