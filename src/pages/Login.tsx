 import { useState } from 'react';
 import { useNavigate, useLocation } from 'react-router-dom';
 import { useAuth } from '@/contexts/AuthContext';
 import type { UserRole } from '@/types/dto';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Map, Shield, User, Building2, ArrowRight, Loader2 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 const roleOptions: { role: UserRole; title: string; description: string; icon: React.ReactNode; redirect: string }[] = [
   {
     role: 'admin',
     title: 'Quản trị viên',
     description: 'Quản lý toàn bộ hệ thống, người dùng, dịch vụ và đơn hàng',
     icon: <Shield className="h-6 w-6" />,
     redirect: '/admin/dashboard',
   },
   {
     role: 'customer',
     title: 'Khách hàng',
     description: 'Khám phá và đặt dịch vụ du lịch, quản lý đơn hàng',
     icon: <User className="h-6 w-6" />,
     redirect: '/',
   },
   {
     role: 'owner',
     title: 'Nhà cung cấp',
     description: 'Quản lý dịch vụ, đơn hàng và doanh thu của bạn',
     icon: <Building2 className="h-6 w-6" />,
     redirect: '/owner/dashboard',
   },
 ];
 
 export const Login = () => {
   const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
   const [loading, setLoading] = useState(false);
   const navigate = useNavigate();
   const location = useLocation();
   const { login } = useAuth();
 
   const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
 
   const handleLogin = async () => {
     if (!selectedRole) return;
     
     setLoading(true);
     // Simulate login delay
     await new Promise((resolve) => setTimeout(resolve, 500));
     
     login(selectedRole);
     
     // Redirect to appropriate page
     const roleOption = roleOptions.find((r) => r.role === selectedRole);
     const redirectTo = from || roleOption?.redirect || '/';
     navigate(redirectTo, { replace: true });
   };
 
   return (
     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-12">
       <div className="w-full max-w-lg">
         {/* Logo and Title */}
         <div className="text-center mb-8">
           <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-ocean mb-4">
             <Map className="h-7 w-7 text-primary-foreground" />
           </div>
           <h1 className="text-3xl font-display font-bold">VietTravel</h1>
           <p className="text-muted-foreground mt-2">Chọn vai trò để đăng nhập (Demo)</p>
         </div>
 
         {/* Role Selection */}
         <Card className="card-elevated">
           <CardHeader>
             <CardTitle>Chọn vai trò</CardTitle>
             <CardDescription>
               Đây là demo authentication. Chọn một vai trò để truy cập hệ thống.
             </CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             {roleOptions.map((option) => (
               <button
                 key={option.role}
                 onClick={() => setSelectedRole(option.role)}
                 className={cn(
                   'w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left',
                   selectedRole === option.role
                     ? 'border-primary bg-primary/5'
                     : 'border-border hover:border-primary/50 hover:bg-muted/50'
                 )}
               >
                 <div
                   className={cn(
                     'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
                     selectedRole === option.role
                       ? 'bg-primary text-primary-foreground'
                       : 'bg-muted text-muted-foreground'
                   )}
                 >
                   {option.icon}
                 </div>
                 <div className="flex-1 min-w-0">
                   <h3 className="font-semibold">{option.title}</h3>
                   <p className="text-sm text-muted-foreground mt-0.5">
                     {option.description}
                   </p>
                 </div>
               </button>
             ))}
 
             <Button
               onClick={handleLogin}
               disabled={!selectedRole || loading}
               className="w-full mt-6"
               size="lg"
             >
               {loading ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Đang đăng nhập...
                 </>
               ) : (
                 <>
                   Đăng nhập
                   <ArrowRight className="ml-2 h-4 w-4" />
                 </>
               )}
             </Button>
           </CardContent>
         </Card>
 
         <p className="text-center text-sm text-muted-foreground mt-6">
           Lưu ý: Đây là môi trường demo với dữ liệu giả lập
         </p>
       </div>
     </div>
   );
 };
 
 export default Login;