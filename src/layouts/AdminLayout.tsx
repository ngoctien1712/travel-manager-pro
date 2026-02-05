 import { useState } from 'react';
 import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
 import { useAuth } from '@/contexts/AuthContext';
 import {
   LayoutDashboard,
   Users,
   Building2,
   Map,
   ShoppingBag,
   Ticket,
   Menu,
   X,
   LogOut,
   ChevronDown,
   Bell,
   Search,
 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Avatar, AvatarFallback } from '@/components/ui/avatar';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { cn } from '@/lib/utils';
 
 const sidebarItems = [
   { icon: LayoutDashboard, label: 'Tổng quan', path: '/admin/dashboard' },
   { icon: Users, label: 'Người dùng', path: '/admin/users' },
   { icon: Building2, label: 'Nhà cung cấp', path: '/admin/providers' },
   { icon: Map, label: 'Dịch vụ', path: '/admin/services' },
   { icon: ShoppingBag, label: 'Đơn hàng', path: '/admin/orders' },
   { icon: Ticket, label: 'Voucher', path: '/admin/vouchers' },
 ];
 
 export const AdminLayout = () => {
   const [sidebarOpen, setSidebarOpen] = useState(true);
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const location = useLocation();
   const navigate = useNavigate();
   const { user, logout } = useAuth();
 
   const handleLogout = () => {
     logout();
     navigate('/login');
   };
 
   return (
     <div className="flex min-h-screen bg-background">
       {/* Mobile sidebar backdrop */}
       {mobileMenuOpen && (
         <div
           className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
           onClick={() => setMobileMenuOpen(false)}
         />
       )}
 
       {/* Sidebar */}
       <aside
         className={cn(
           'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 lg:relative',
           sidebarOpen ? 'w-64' : 'w-20',
           mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
         )}
       >
         {/* Logo */}
         <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
           <Link to="/admin/dashboard" className="flex items-center gap-2">
             <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-ocean">
               <Map className="h-5 w-5 text-primary-foreground" />
             </div>
             {sidebarOpen && (
               <span className="font-display text-lg font-semibold text-sidebar-foreground">
                 TravelAdmin
               </span>
             )}
           </Link>
           <Button
             variant="ghost"
             size="icon"
             className="lg:hidden"
             onClick={() => setMobileMenuOpen(false)}
           >
             <X className="h-5 w-5" />
           </Button>
         </div>
 
         {/* Navigation */}
         <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin">
           <ul className="space-y-1">
             {sidebarItems.map((item) => {
               const isActive = location.pathname.startsWith(item.path);
               return (
                 <li key={item.path}>
                   <Link
                     to={item.path}
                     className={cn(
                       'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                       isActive
                         ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                         : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                     )}
                   >
                     <item.icon className="h-5 w-5 shrink-0" />
                     {sidebarOpen && <span>{item.label}</span>}
                   </Link>
                 </li>
               );
             })}
           </ul>
         </nav>
 
         {/* Collapse toggle (desktop only) */}
         <div className="hidden lg:flex border-t border-sidebar-border p-4">
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="w-full justify-center"
           >
             <ChevronDown
               className={cn(
                 'h-4 w-4 transition-transform',
                 sidebarOpen ? 'rotate-90' : '-rotate-90'
               )}
             />
           </Button>
         </div>
       </aside>
 
       {/* Main content */}
       <div className="flex flex-1 flex-col">
         {/* Topbar */}
         <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
           <Button
             variant="ghost"
             size="icon"
             className="lg:hidden"
             onClick={() => setMobileMenuOpen(true)}
           >
             <Menu className="h-5 w-5" />
           </Button>
 
           {/* Search */}
           <div className="relative hidden flex-1 md:block md:max-w-sm">
             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
             <Input
               placeholder="Tìm kiếm..."
               className="pl-9 bg-muted/50"
             />
           </div>
 
           <div className="ml-auto flex items-center gap-3">
             {/* Notifications */}
             <Button variant="ghost" size="icon" className="relative">
               <Bell className="h-5 w-5" />
               <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                 3
               </span>
             </Button>
 
             {/* User menu */}
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="gap-2 px-2">
                   <Avatar className="h-8 w-8">
                     <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                       {user?.fullName?.charAt(0) || 'A'}
                     </AvatarFallback>
                   </Avatar>
                   <span className="hidden text-sm font-medium md:inline-block">
                     {user?.fullName}
                   </span>
                   <ChevronDown className="h-4 w-4 text-muted-foreground" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-48">
                 <DropdownMenuItem className="text-muted-foreground text-xs">
                   {user?.email}
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                   <LogOut className="mr-2 h-4 w-4" />
                   Đăng xuất
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           </div>
         </header>
 
         {/* Page content */}
         <main className="flex-1 overflow-auto p-4 lg:p-6">
           <Outlet />
         </main>
       </div>
     </div>
   );
 };
 
 export default AdminLayout;