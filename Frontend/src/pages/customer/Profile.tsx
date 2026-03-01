import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/api/customer.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Lock, User, Mail, Phone, Save, MapPin, Camera, CalendarDays, Activity, ArrowRight, Shield, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function CustomerProfile() {
  const queryClient = useQueryClient();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: () => customerApi.getProfile(),
  });

  const updateMutation = useMutation({
    mutationFn: customerApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
      alert('Cập nhật thông tin thành công!');
    },
    onError: (error: any) => {
      alert(error.message || 'Lỗi khi cập nhật thông tin');
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      customerApi.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      setChangePasswordOpen(false);
      alert('Đổi mật khẩu thành công!');
    },
    onError: (error: any) => {
      alert(error.message || 'Lỗi khi đổi mật khẩu');
    }
  });

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="relative flex flex-col items-center gap-4">
          <div className="h-20 w-20 rounded-full border-t-4 border-blue-600 border-r-4 border-r-transparent animate-spin"></div>
          <div className="absolute top-6 left-1/2 -translate-x-1/2">
            <User className="h-8 w-8 text-blue-600/50" />
          </div>
          <p className="text-slate-500 font-medium animate-pulse">Đang tải hồ sơ của bạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 font-sans">
      {/* Premium Header Background */}
      <div className="w-full h-[280px] bg-slate-900 relative overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 via-indigo-800 to-purple-900 opacity-90"></div>
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full mix-blend-screen filter blur-[80px] translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/30 rounded-full mix-blend-screen filter blur-[60px] -translate-x-1/3 translate-y-1/3"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10 w-full">
          <div className="max-w-6xl mx-auto -translate-y-4">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-sm">Cài đặt tài khoản</h1>
            <p className="text-blue-100/90 mt-3 text-lg max-w-xl font-medium drop-shadow-sm">Quản lý thông tin cá nhân và tùy chỉnh các thiết lập bảo mật của bạn.</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 -mt-16 relative z-20 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          {/* Left Sidebar Profile Card */}
          <div className="lg:col-span-4 space-y-6 lg:space-y-8">
            <Card className="border-none shadow-2xl shadow-blue-900/5 rounded-[2rem] overflow-hidden bg-white/95 backdrop-blur-xl">
              <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-50/50 w-full relative">
                <Button size="icon" variant="ghost" className="absolute top-4 right-4 bg-white/60 hover:bg-white text-slate-700 rounded-2xl h-10 w-10 transition-all shadow-sm">
                  <Camera size={18} />
                </Button>
              </div>
              <CardContent className="px-8 pb-8 pt-0 flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 md:h-40 md:w-40 border-[6px] border-white shadow-xl -mt-20 mb-5 group ring-4 ring-slate-50 relative overflow-hidden bg-white transition-transform hover:scale-105 duration-300">
                  <AvatarFallback className="text-5xl font-black bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    {profile.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3 truncate w-full tracking-tight">{profile.fullName || 'Người dùng'}</h2>
                <Badge variant="secondary" className="mb-8 px-4 py-2 font-bold tracking-wider text-xs uppercase rounded-xl flex items-center gap-2 shadow-sm bg-emerald-100/80 text-emerald-700 hover:bg-emerald-200 border-none ring-1 ring-emerald-200">
                  <User size={14} strokeWidth={2.5} />
                  Khách hàng
                </Badge>

                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100/50 transition-colors hover:bg-blue-50/50 group">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-blue-500 group-hover:scale-110 transition-transform"><Mail size={18} /></div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Thư điện tử</p>
                      <p className="text-sm font-semibold text-slate-700 truncate">{profile.email}</p>
                    </div>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100/50 transition-colors hover:bg-emerald-50/50 group">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-500 group-hover:scale-110 transition-transform"><Phone size={18} /></div>
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Điện thoại</p>
                        <p className="text-sm font-semibold text-slate-700 truncate">{profile.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>

            {/* Quick Stats/Info Card */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white">
              <CardHeader className="pb-4 px-6 pt-6 bg-slate-50/50">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Activity size={18} />
                  </div>
                  Thông tin tài khoản
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between py-3 font-medium text-slate-600 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <CalendarDays size={18} className="text-slate-400" />
                    <span>Tham gia từ</span>
                  </div>
                  <strong className="text-slate-800">2024</strong>
                </div>
                <div className="flex items-center justify-between py-3 font-medium text-slate-600 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-slate-400" />
                    <span>Định danh</span>
                  </div>
                  <strong className="text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md text-sm">
                    <ShieldCheck size={14} /> Đã xác thực
                  </strong>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">

            <Card className="border-none shadow-2xl shadow-blue-900/5 rounded-[2rem] overflow-hidden bg-white">
              <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              <CardHeader className="px-8 pt-10 pb-6 border-b border-slate-50">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl ring-4 ring-blue-50/50 shadow-inner">
                    <User size={28} strokeWidth={2} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Chi tiết hồ sơ</CardTitle>
                    <CardDescription className="text-base text-slate-500 font-medium mt-1">
                      Cập nhật thông tin định danh và thông tin liên hệ của bạn.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 md:p-10">
                <ProfileForm
                  profile={profile}
                  onSave={(data) => updateMutation.mutate(data)}
                  saving={updateMutation.isPending}
                />
              </CardContent>
            </Card>

            <Card className="border border-slate-100 shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white hover:border-blue-100 transition-colors">
              <CardContent className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                  <div className="flex items-start gap-6">
                    <div className="p-5 bg-slate-50 text-slate-700 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-slate-200"></div>
                      <Lock size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Bảo mật tài khoản</h4>
                      <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed max-w-sm">
                        Đổi mật khẩu định kỳ giúp tài khoản của bạn an toàn hơn trước các rủi ro.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setChangePasswordOpen(true)}
                    className="shrink-0 rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white px-8 py-7 font-bold transition-all shadow-sm group w-full md:w-auto text-base"
                  >
                    Đổi mật khẩu
                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
        onSubmit={(oldPw, newPw) => changePasswordMutation.mutate({ oldPassword: oldPw, newPassword: newPw })}
        loading={changePasswordMutation.isPending}
        error={changePasswordMutation.error?.message}
      />
    </div>
  );
}

function ProfileForm({
  profile,
  onSave,
  saving,
}: {
  profile: any;
  onSave: (data: { fullName: string; phone: string; travel_style: string | string[]; date?: string }) => void;
  saving: boolean;
}) {
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [phone, setPhone] = useState(profile.phone || '');

  const initialTravelStyles = profile.profile?.travel_style
    ? (Array.isArray(profile.profile.travel_style) ? profile.profile.travel_style : [profile.profile.travel_style])
    : [];
  const [travelStyle, setTravelStyle] = useState<string[]>(initialTravelStyles);

  const initialDate = profile.profile?.date
    ? new Date(profile.profile.date).toISOString().slice(0, 10)
    : '';
  const [date, setDate] = useState<string>(initialDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ fullName, phone, travel_style: travelStyle, date: date || undefined });
  };

  const inputClass = "rounded-2xl py-6 px-5 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-800 shadow-sm text-base";
  const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2 ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
        <div className="space-y-2 group">
          <Label htmlFor="fullName" className={labelClass}>
            <User size={14} className="group-focus-within:text-blue-600 transition-colors" /> Họ và tên
          </Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            placeholder="Nhập họ và tên đầy đủ"
          />
        </div>
        <div className="space-y-2 group">
          <Label htmlFor="phone" className={labelClass}>
            <Phone size={14} className="group-focus-within:text-blue-600 transition-colors" /> Số điện thoại
          </Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="Nhập số điện thoại liên hệ"
          />
        </div>

        <div className="space-y-2 group">
          <Label htmlFor="date" className={labelClass}>
            <User size={14} className="group-focus-within:text-blue-600 transition-colors" /> Ngày tháng năm sinh
          </Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2 md:col-span-2 group">
          <Label className={labelClass}>
            <MapPin size={14} className="group-focus-within:text-blue-600 transition-colors" /> Sở thích du lịch (Có thể chọn nhiều)
          </Label>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'adventure', label: '🏔️ Phiêu lưu' },
              { id: 'culture', label: '🏛️ Văn hóa' },
              { id: 'relax', label: '⛱️ Thư giãn' },
              { id: 'family', label: '👨‍👩‍👧‍👦 Du lịch gia đình' },
              { id: 'extreme', label: '🪂 Thể thao mạo hiểm' },
            ].map(style => {
              const isSelected = travelStyle.includes(style.id);
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => {
                    setTravelStyle(prev =>
                      prev.includes(style.id)
                        ? prev.filter(s => s !== style.id)
                        : [...prev, style.id]
                    );
                  }}
                  className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all border shadow-sm flex items-center gap-2 ${isSelected
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                >
                  {style.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium ml-1 mt-2 flex items-center gap-1.5"><Activity size={12} /> Điều này giúp gợi ý các dịch vụ phù hợp</p>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100 flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          className="rounded-2xl px-12 py-7 font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {saving ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Save className="mr-3 h-6 w-6" />}
          {saving ? "Đang lưu..." : "Lưu thay đổi hồ sơ"}
        </Button>
      </div>
    </form>
  );
}

function ChangePasswordDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
  error,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (oldPassword: string, newPassword: string) => void;
  loading: boolean;
  error?: string;
}) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }
    onSubmit(oldPassword, newPassword);
  };

  const inputClass = "rounded-2xl py-6 px-4 bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all text-base";
  const labelClass = "text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] border-none shadow-2xl shadow-blue-900/20 rounded-[2rem] p-0 overflow-hidden">
        <div className="bg-gradient-to-tr from-slate-900 via-blue-900 to-indigo-900 p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full mix-blend-overlay filter blur-[40px] translate-x-1/2 -translate-y-1/2"></div>
          <DialogHeader className="relative z-10 text-left">
            <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-md shadow-inner">
              <Lock size={28} className="text-blue-100" />
            </div>
            <DialogTitle className="text-3xl font-black text-white tracking-tight">Thay đổi mật khẩu</DialogTitle>
            <DialogDescription className="text-blue-100/90 mt-2 text-base font-medium">
              Vui lòng nhập mật khẩu hiện tại để xác thực và tạo mật khẩu mới an toàn hơn.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6 bg-white">
          {error && (
            <div className="rounded-2xl bg-red-50 text-red-600 px-5 py-4 text-sm font-semibold border border-red-100 flex items-center gap-3">
              <Shield size={20} className="shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="old" className={labelClass}>Mật khẩu hiện tại</Label>
            <Input
              id="old"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className={inputClass}
              placeholder="Nhập mật khẩu cũ..."
              required
            />
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="new" className={labelClass}>Mật khẩu mới</Label>
            <Input
              id="new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="Tối thiểu 6 ký tự"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className={labelClass}>Xác nhận mật khẩu</Label>
            <Input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="Nhập lại mật khẩu mới"
              required
              minLength={6}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl py-7 font-bold sm:flex-1 border-slate-200 text-slate-600 hover:bg-slate-50 text-base"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={loading || newPassword !== confirmPassword || !newPassword}
              className="rounded-2xl py-7 font-bold sm:flex-1 bg-slate-900 hover:bg-black shadow-xl shadow-slate-900/20 text-white transition-all hover:scale-[1.02] active:scale-[0.98] text-base"
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Xác nhận đổi
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
