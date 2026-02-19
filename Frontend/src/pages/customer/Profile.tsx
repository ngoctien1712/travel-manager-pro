import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { customerApi } from '@/api/customer.api';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    travel_style: '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profile = await customerApi.getProfile();
        setUser(profile);
        setFormData({
          fullName: profile.fullName || '',
          phone: profile.phone || '',
          email: profile.email || '',
          travel_style: profile.profile?.travel_style || '',
        });
      } catch (error) {
        console.error('Lỗi khi lấy thông tin cá nhân:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await customerApi.updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        travel_style: formData.travel_style,
      });
      setUser({ ...user, ...formData });
      setEditing(false);
      alert('Cập nhật thông tin thành công');
    } catch (error) {
      alert('Lỗi khi cập nhật thông tin');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Mật khẩu mới không trùng khớp');
      return;
    }
    try {
      await customerApi.changePassword(passwordData.oldPassword, passwordData.newPassword);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      alert('Đổi mật khẩu thành công');
    } catch (error) {
      alert('Lỗi khi đổi mật khẩu');
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Thông tin cá nhân</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <h2 className="text-xl font-bold text-center mb-1">{user?.fullName || 'Khách hàng'}</h2>
            <p className="text-sm text-gray-600 text-center mb-4">{user?.email}</p>
            <Button 
              onClick={() => setEditing(true)}
              variant="outline"
              className="w-full"
            >
              Chỉnh sửa thông tin
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {!editing ? (
            /* View Mode */
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Thông tin tài khoản</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Họ và tên</label>
                  <p className="font-semibold">{formData.fullName || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <p className="font-semibold">{formData.email || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Số điện thoại</label>
                    <p className="font-semibold">{formData.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Sở thích du lịch</label>
                    <p className="font-semibold">{formData.travel_style || 'Chưa cập nhật'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Bảo mật</h2>
                <Button 
                  onClick={() => setShowPasswordForm(true)}
                  variant="outline"
                >
                  Đổi mật khẩu
                </Button>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-6">Chỉnh sửa thông tin</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">Họ và tên</label>
                  <Input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Nhập email"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Số điện thoại</label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Sở thích du lịch</label>
                  <Select value={formData.travel_style} onValueChange={(val) => setFormData({...formData, travel_style: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sở thích du lịch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adventure">Phiêu lưu</SelectItem>
                      <SelectItem value="culture">Văn hóa</SelectItem>
                      <SelectItem value="relax">Thư giãn</SelectItem>
                      <SelectItem value="family">Du lịch gia đình</SelectItem>
                      <SelectItem value="extreme">Thể thao mạo hiểm</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600 mt-1">Điều này giúp gợi ý có các dịch vụ phù hợp</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveProfile}
                    className="flex-1"
                  >
                    Lưu thay đổi
                  </Button>
                  <Button 
                    onClick={() => setEditing(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Password Change Form */}
          {showPasswordForm && (
            <div className="bg-white rounded-lg shadow p-6 mt-6 border-2 border-blue-200">
              <h2 className="text-xl font-bold mb-6">Đổi mật khẩu</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-1">Mật khẩu hiện tại</label>
                  <Input
                    name="oldPassword"
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Mật khẩu mới</label>
                  <Input
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Xác nhận mật khẩu</label>
                  <Input
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Xác nhận mật khẩu mới"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleChangePassword}
                    className="flex-1"
                  >
                    Đổi mật khẩu
                  </Button>
                  <Button 
                    onClick={() => setShowPasswordForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
