import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, type UserProfile } from '@/api/user.api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Pencil, Lock } from 'lucide-react';

export const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getProfile(),
  });

  const updateMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      userApi.changePassword(currentPassword, newPassword),
    onSuccess: () => setChangePasswordOpen(false),
  });

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Thông tin cá nhân"
        description="Quản lý thông tin tài khoản của bạn"
      />

      <div className="grid gap-6 max-w-2xl">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Thông tin chung</CardTitle>
            <CardDescription>Email: {profile.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              profile={profile}
              onSave={(data) => updateMutation.mutate(data)}
              saving={updateMutation.isPending}
            />
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Bảo mật</CardTitle>
            <CardDescription>Đổi mật khẩu tài khoản</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setChangePasswordOpen(true)}>
              <Lock className="mr-2 h-4 w-4" />
              Đổi mật khẩu
            </Button>
          </CardContent>
        </Card>
      </div>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
        onSubmit={(current, newPw) => changePasswordMutation.mutate({ currentPassword: current, newPassword: newPw })}
        loading={changePasswordMutation.isPending}
        error={changePasswordMutation.error?.message}
      />
    </div>
  );
};

function ProfileForm({
  profile,
  onSave,
  saving,
}: {
  profile: UserProfile;
  onSave: (data: Parameters<typeof userApi.updateProfile>[0]) => void;
  saving: boolean;
}) {
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [travelStyle, setTravelStyle] = useState(profile.profile?.travel_style || '');
  const [businessName, setBusinessName] = useState(profile.profile?.business_name || '');
  const [department, setDepartment] = useState(profile.profile?.department || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profileData =
      profile.role === 'customer'
        ? { travel_style: travelStyle }
        : profile.role === 'owner'
          ? { business_name: businessName }
          : profile.role === 'admin'
            ? { department }
            : {};
    onSave({ fullName, phone, profile: profileData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Họ tên</Label>
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="phone">Số điện thoại</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {profile.role === 'customer' && (
        <div>
          <Label htmlFor="travelStyle">Phong cách du lịch</Label>
          <Input
            id="travelStyle"
            value={travelStyle}
            onChange={(e) => setTravelStyle(e.target.value)}
            placeholder="Adventure, Luxury, Cultural..."
          />
        </div>
      )}
      {profile.role === 'owner' && (
        <div>
          <Label htmlFor="businessName">Tên doanh nghiệp</Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>
      )}
      {profile.role === 'admin' && (
        <div>
          <Label htmlFor="department">Phòng ban</Label>
          <Input
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>
      )}
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Lưu thay đổi
      </Button>
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
  onSubmit: (currentPassword: string, newPassword: string) => void;
  loading: boolean;
  error?: string;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    onSubmit(currentPassword, newPassword);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu</DialogTitle>
          <DialogDescription>Nhập mật khẩu hiện tại và mật khẩu mới</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2 text-sm">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="current">Mật khẩu hiện tại</Label>
            <Input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="new">Mật khẩu mới</Label>
            <Input
              id="new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <Label htmlFor="confirm">Xác nhận mật khẩu mới</Label>
            <Input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading || newPassword !== confirmPassword}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đổi mật khẩu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Profile;
