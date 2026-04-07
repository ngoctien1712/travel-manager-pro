import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Map,
  Image,
  ShoppingBag,
  User,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Bell,
  MapPin,
  Building2,
  Tag,
  MessageSquare,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NotificationCenter } from '@/components/NotificationCenter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/owner/dashboard' },
  { icon: Building2, label: 'Nhà cung cấp', path: '/owner/providers' },
  { icon: Map, label: 'Dịch vụ của tôi', path: '/owner/services' },
  { icon: Tag, label: 'Voucher', path: '/owner/vouchers' },
  { icon: ShoppingBag, label: 'Đơn hàng', path: '/owner/orders' },
  { icon: Wallet, label: 'Lịch sử nhận lương', path: '/owner/payroll' },
  { icon: MessageSquare, label: 'Tin nhắn', path: '/owner/messages' },
  { icon: User, label: 'Hồ sơ', path: '/owner/profile' },
];

export const OwnerLayout = () => {
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
          <Link to="/owner/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className={cn("h-9 w-9 object-contain transition-all", sidebarOpen ? "mr-2" : "mx-auto")} />
            {sidebarOpen && (
              <span className="font-display text-lg font-semibold text-sidebar-foreground">
                Trip Mana Pro
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

        {/* Collapse toggle */}
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

          <div className="ml-auto flex items-center gap-3">
            {/* Notifications */}
            <NotificationCenter />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                      {user?.fullName?.charAt(0) || 'O'}
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
                <DropdownMenuItem onClick={() => navigate('/owner/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Hồ sơ doanh nghiệp
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

export default OwnerLayout;