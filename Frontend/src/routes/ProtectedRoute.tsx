 import { Navigate, useLocation } from 'react-router-dom';
 import { useAuth } from '@/contexts/AuthContext';
 import type { UserRole } from '@/types/dto';
 import { Loader2 } from 'lucide-react';
 
 interface ProtectedRouteProps {
   children: React.ReactNode;
   allowedRoles: UserRole[];
 }
 
 // Role home pages
 const roleHomePaths: Record<UserRole, string> = {
   admin: '/admin/dashboard',
   customer: '/',
   owner: '/owner/dashboard',
 };
 
 export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
   const { user, isAuthenticated, isLoading } = useAuth();
   const location = useLocation();
 
   // Show loading spinner while checking auth
   if (isLoading) {
     return (
       <div className="flex min-h-screen items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   // Redirect to login if not authenticated
   if (!isAuthenticated) {
     return <Navigate to="/login" state={{ from: location }} replace />;
   }
 
   // Redirect to appropriate home if wrong role
   if (user && !allowedRoles.includes(user.role)) {
     return <Navigate to={roleHomePaths[user.role]} replace />;
   }
 
   return <>{children}</>;
 };
 
 export default ProtectedRoute;