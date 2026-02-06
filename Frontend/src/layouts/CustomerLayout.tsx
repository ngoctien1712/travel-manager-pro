 import { useState } from 'react';
 import { Outlet, Link, useNavigate } from 'react-router-dom';
 import { useAuth } from '@/contexts/AuthContext';
 import {
   Map,
   Menu,
   X,
   ShoppingCart,
   User,
   LogOut,
   Package,
   Heart,
   Compass,
   ChevronDown,
 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Avatar, AvatarFallback } from '@/components/ui/avatar';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import {
   Sheet,
   SheetContent,
   SheetTrigger,
 } from '@/components/ui/sheet';
 
 const navLinks = [
   { label: 'Trang chủ', path: '/' },
   { label: 'Dịch vụ', path: '/services' },
   { label: 'Lập kế hoạch', path: '/trip-planner' },
 ];
 
 export const CustomerLayout = () => {
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const navigate = useNavigate();
   const { user, isAuthenticated, logout } = useAuth();
 
   const handleLogout = () => {
     logout();
     navigate('/login');
   };
 
   return (
     <div className="flex min-h-screen flex-col bg-background">
       {/* Header */}
       <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
         <div className="container flex h-16 items-center justify-between">
           {/* Logo */}
           <Link to="/" className="flex items-center gap-2">
             <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-ocean">
               <Map className="h-5 w-5 text-primary-foreground" />
             </div>
             <span className="font-display text-xl font-semibold">
               VietTravel
             </span>
           </Link>
 
           {/* Desktop Navigation */}
           <nav className="hidden md:flex items-center gap-6">
             {navLinks.map((link) => (
               <Link
                 key={link.path}
                 to={link.path}
                 className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
               >
                 {link.label}
               </Link>
             ))}
           </nav>
 
           {/* Right side actions */}
           <div className="flex items-center gap-2">
             {/* Cart */}
             <Button
               variant="ghost"
               size="icon"
               onClick={() => navigate('/cart')}
               className="relative"
             >
               <ShoppingCart className="h-5 w-5" />
               <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                 2
               </span>
             </Button>
 
             {isAuthenticated ? (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="gap-2 px-2">
                     <Avatar className="h-8 w-8">
                       <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                         {user?.fullName?.charAt(0) || 'U'}
                       </AvatarFallback>
                     </Avatar>
                     <span className="hidden text-sm font-medium lg:inline-block">
                       {user?.fullName}
                     </span>
                     <ChevronDown className="h-4 w-4 text-muted-foreground" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-48">
                   <DropdownMenuItem onClick={() => navigate('/profile')}>
                     <User className="mr-2 h-4 w-4" />
                     Tài khoản
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/my-orders')}>
                     <Package className="mr-2 h-4 w-4" />
                     Đơn hàng
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/trip-planner')}>
                     <Compass className="mr-2 h-4 w-4" />
                     Lập kế hoạch
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                     <LogOut className="mr-2 h-4 w-4" />
                     Đăng xuất
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             ) : (
               <Button onClick={() => navigate('/login')} size="sm" className="hidden md:inline-flex">
                 Đăng nhập
               </Button>
             )}
 
             {/* Mobile menu */}
             <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
               <SheetTrigger asChild>
                 <Button variant="ghost" size="icon" className="md:hidden">
                   <Menu className="h-5 w-5" />
                 </Button>
               </SheetTrigger>
               <SheetContent side="right" className="w-[280px]">
                 <nav className="flex flex-col gap-4 mt-8">
                   {navLinks.map((link) => (
                     <Link
                       key={link.path}
                       to={link.path}
                       onClick={() => setMobileMenuOpen(false)}
                       className="text-lg font-medium py-2"
                     >
                       {link.label}
                     </Link>
                   ))}
                   {!isAuthenticated && (
                     <Button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
                       Đăng nhập
                     </Button>
                   )}
                 </nav>
               </SheetContent>
             </Sheet>
           </div>
         </div>
       </header>
 
       {/* Main content */}
       <main className="flex-1">
         <Outlet />
       </main>
 
       {/* Footer */}
       <footer className="border-t bg-muted/30">
         <div className="container py-12">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             <div className="col-span-2 md:col-span-1">
               <Link to="/" className="flex items-center gap-2 mb-4">
                 <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-ocean">
                   <Map className="h-5 w-5 text-primary-foreground" />
                 </div>
                 <span className="font-display text-lg font-semibold">VietTravel</span>
               </Link>
               <p className="text-sm text-muted-foreground">
                 Khám phá Việt Nam với những trải nghiệm tuyệt vời nhất.
               </p>
             </div>
             <div>
               <h4 className="font-semibold mb-3">Dịch vụ</h4>
               <ul className="space-y-2 text-sm text-muted-foreground">
                 <li><Link to="/services?type=tour" className="hover:text-foreground">Tour du lịch</Link></li>
                 <li><Link to="/services?type=hotel" className="hover:text-foreground">Khách sạn</Link></li>
                 <li><Link to="/services?type=ticket" className="hover:text-foreground">Vé tham quan</Link></li>
                 <li><Link to="/services?type=experience" className="hover:text-foreground">Trải nghiệm</Link></li>
               </ul>
             </div>
             <div>
               <h4 className="font-semibold mb-3">Hỗ trợ</h4>
               <ul className="space-y-2 text-sm text-muted-foreground">
                 <li><a href="#" className="hover:text-foreground">Liên hệ</a></li>
                 <li><a href="#" className="hover:text-foreground">Câu hỏi thường gặp</a></li>
                 <li><a href="#" className="hover:text-foreground">Chính sách hoàn tiền</a></li>
               </ul>
             </div>
             <div>
               <h4 className="font-semibold mb-3">Liên hệ</h4>
               <ul className="space-y-2 text-sm text-muted-foreground">
                 <li>📞 1900 1234</li>
                 <li>📧 support@viettravel.vn</li>
                 <li>📍 Hà Nội, Việt Nam</li>
               </ul>
             </div>
           </div>
           <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
             © 2024 VietTravel. Tất cả quyền được bảo lưu.
           </div>
         </div>
       </footer>
     </div>
   );
 };
 
 export default CustomerLayout;