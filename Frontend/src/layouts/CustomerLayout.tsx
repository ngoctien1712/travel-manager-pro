import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Map,
  Menu,
  X,
  User,
  LogOut,
  Package,
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
  { label: 'Khách sạn', path: '/hotels' },
  { label: 'Vé xe', path: '/bus-shuttle' },
  { label: 'Hoạt động', path: '/activities' },
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-200">
              <Map className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-gray-900">
              VietTravel
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2 hover:bg-gray-50 rounded-xl">
                    <Avatar className="h-8 w-8 ring-2 ring-gray-100">
                      <AvatarFallback className="bg-blue-600 text-white text-sm font-bold">
                        {user?.fullName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-bold text-gray-700 lg:inline-block">
                      {user?.fullName}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-none shadow-2xl">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-xl py-2 cursor-pointer">
                    <User className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="font-bold text-gray-700">Tài khoản</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-orders')} className="rounded-xl py-2 cursor-pointer">
                    <Package className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="font-bold text-gray-700">Đơn hàng</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/trip-planner')} className="rounded-xl py-2 cursor-pointer">
                    <Compass className="mr-3 h-4 w-4 text-gray-400" />
                    <span className="font-bold text-gray-700">Lập kế hoạch</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2 bg-gray-50" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl py-2 cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-bold">Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={() => navigate('/login')} variant="ghost" className="font-bold text-gray-600 hover:text-blue-600 rounded-xl">
                  Đăng nhập
                </Button>
                <Button onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200">
                  Đăng ký
                </Button>
              </div>
            )}

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-xl text-gray-500">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] rounded-l-[2rem] border-none shadow-2xl">
                <div className="flex flex-col h-full py-8">
                  <div className="flex items-center gap-2 mb-12 px-2">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                      <Map className="h-6 w-6 text-white" />
                    </div>
                    <span className="font-display text-2xl font-black text-gray-900">VietTravel</span>
                  </div>

                  <nav className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg font-bold py-4 px-4 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-between group"
                      >
                        {link.label}
                        <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <Compass className="h-4 w-4" />
                        </div>
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-auto space-y-4">
                    {!isAuthenticated && (
                      <Button className="w-full h-14 bg-blue-600 text-white font-bold rounded-2xl" onClick={() => navigate('/login')}>
                        Bắt đầu ngay
                      </Button>
                    )}
                  </div>
                </div>
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
      <footer className="bg-white border-t border-gray-50 pt-24 pb-12">
        <div className="container max-w-7xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
            <div className="md:col-span-4 space-y-8">
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-100">
                  <Map className="h-6 w-6 text-white" />
                </div>
                <span className="font-display text-2xl font-black tracking-tight text-gray-900">VietTravel</span>
              </Link>
              <p className="text-gray-500 font-medium leading-relaxed">
                Nâng tầm trải nghiệm du lịch Việt Nam với dịch vụ chuyên nghiệp, minh bạch và tận tâm. Khám phá vẻ đẹp di sản qua những hành trình được thiết kế riêng cho bạn.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                  <Compass size={18} />
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                  <Compass size={18} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Dịch vụ</h4>
              <ul className="space-y-4">
                <li><Link to="/activities" className="text-gray-600 font-bold hover:text-blue-600 transition-colors">Tour du lịch</Link></li>
                <li><Link to="/hotels" className="text-gray-600 font-bold hover:text-blue-600 transition-colors">Khách sạn</Link></li>
                <li><Link to="/activities" className="text-gray-600 font-bold hover:text-blue-600 transition-colors">Vé tham quan</Link></li>
                <li><Link to="/bus-shuttle" className="text-gray-600 font-bold hover:text-blue-600 transition-colors">Phương tiện</Link></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Hỗ trợ khách hàng</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-600 font-bold hover:text-blue-600 transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="text-gray-600 font-bold hover:text-blue-600 transition-colors">Chính sách bảo mật</a></li>
                <li><a href="#" className="text-gray-600 font-bold hover:text-blue-600 transition-colors">Điều khoản sử dụng</a></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Liên hệ</h4>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    < Compass size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Hotline 24/7</p>
                    <p className="text-sm font-black text-gray-900">1900 1234</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    < Compass size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Email</p>
                    <p className="text-sm font-black text-gray-900">support@viettravel.vn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.1em]">
              © 2024 VIETTRAVEL GLOBAL. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.1em]">
              <span className="cursor-pointer hover:text-gray-900 transition-colors">Privacy</span>
              <span className="cursor-pointer hover:text-gray-900 transition-colors">Terms</span>
              <span className="cursor-pointer hover:text-gray-900 transition-colors">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;