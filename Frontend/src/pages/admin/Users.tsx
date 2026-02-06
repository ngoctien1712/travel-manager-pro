import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { adminUserApi, type AdminUser, type AdminUserDetail } from '@/api/admin-users.api';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorState } from '@/components/ErrorState';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

const roleLabels: Record<string, string> = {
  admin: 'Quản trị viên',
  customer: 'Khách hàng',
  owner: 'Nhà cung cấp',
};

const statusLabels: Record<string, string> = {
  active: 'Hoạt động',
  inactive: 'Không hoạt động',
  banned: 'Bị khóa',
  pending: 'Chờ xác thực',
};

export const AdminUsers = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('__all__');
  const [statusFilter, setStatusFilter] = useState<string>('__all__');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-users', page, pageSize, search, roleFilter, statusFilter],
    queryFn: () =>
      adminUserApi.listUsers({
        page,
        pageSize,
        search: search || undefined,
        role: roleFilter === '__all__' ? undefined : roleFilter,
        status: statusFilter === '__all__' ? undefined : statusFilter,
      }),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: userDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminUserApi.getUser(id!),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: (d: Parameters<typeof adminUserApi.createUser>[0]) => adminUserApi.createUser(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id: uid, data }: { id: string; data: Parameters<typeof adminUserApi.updateUser>[1] }) =>
      adminUserApi.updateUser(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user'] });
      if (id) navigate('/admin/users');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (uid: string) => adminUserApi.deleteUser(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteUser(null);
    },
  });

  const columns = [
    {
      key: 'email',
      header: 'Email',
      cell: (row: AdminUser) => <span className="font-medium">{row.email}</span>,
    },
    {
      key: 'fullName',
      header: 'Họ tên',
      cell: (row: AdminUser) => row.fullName || '-',
    },
    {
      key: 'role',
      header: 'Vai trò',
      cell: (row: AdminUser) => roleLabels[row.role] || row.role,
    },
    {
      key: 'status',
      header: 'Trạng thái',
      cell: (row: AdminUser) => {
        const v = row.status === 'active' ? 'success' : row.status === 'banned' ? 'error' : 'muted';
        return <StatusBadge label={statusLabels[row.status] || row.status} variant={v} />;
      },
    },
    {
      key: 'actions',
      header: 'Thao tác',
      cell: (row: AdminUser) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/users/${row.id}`)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteUser(row)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: 'role',
      label: 'Vai trò',
      options: [
        { label: 'Tất cả', value: '__all__' },
        { label: 'Quản trị viên', value: 'admin' },
        { label: 'Khách hàng', value: 'customer' },
        { label: 'Nhà cung cấp', value: 'owner' },
      ],
    },
    {
      key: 'status',
      label: 'Trạng thái',
      options: [
        { label: 'Tất cả', value: '__all__' },
        { label: 'Hoạt động', value: 'active' },
        { label: 'Chờ xác thực', value: 'pending' },
        { label: 'Không hoạt động', value: 'inactive' },
        { label: 'Bị khóa', value: 'banned' },
      ],
    },
  ];

  const filterValues = { role: roleFilter, status: statusFilter };
  const onFilterChange = (key: string, value: string) => {
    if (key === 'role') setRoleFilter(value);
    else if (key === 'status') setStatusFilter(value);
  };

  if (id) {
    if (loadingDetail || !userDetail) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    return (
      <UserDetailForm
        user={userDetail}
        onClose={() => navigate('/admin/users')}
        onSave={(data) => updateMutation.mutate({ id: id!, data })}
        saving={updateMutation.isPending}
      />
    );
  }

  return (
    <div className="page-enter min-h-[400px]">
      <PageHeader
        title="Quản lý người dùng"
        description="Quản lý tài khoản admin, customer và area_owner"
        breadcrumbs={[
          { label: 'Admin', path: '/admin/dashboard' },
          { label: 'Người dùng' },
        ]}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm người dùng
          </Button>
        }
      />

      <Card className="card-elevated min-h-[300px]">
        {isError ? (
          <div className="p-6">
            <ErrorState
              message={
                error instanceof Error
                  ? error.message
                  : typeof error === 'string'
                    ? error
                    : 'Không thể tải danh sách người dùng. Kiểm tra backend đang chạy (port 3000) và đã đăng nhập admin.'
              }
              onRetry={() => refetch()}
            />
          </div>
        ) : (
          <DataTable
            data={Array.isArray(data?.data) ? data.data : []}
            columns={columns}
            loading={isLoading}
            page={page}
            pageSize={pageSize}
            total={typeof data?.total === 'number' ? data.total : 0}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Tìm theo email, tên, SĐT..."
            filters={filters}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            emptyTitle="Chưa có người dùng"
            emptyDescription="Tạo người dùng mới hoặc kiểm tra bộ lọc"
          />
        )}
      </Card>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(d) => createMutation.mutate(d)}
        loading={createMutation.isPending}
        error={createMutation.error?.message}
      />

      <ConfirmDialog
        open={!!deleteUser}
        onOpenChange={(o) => !o && setDeleteUser(null)}
        title="Xóa người dùng"
        description={`Bạn có chắc muốn xóa ${deleteUser?.email}? Hành động này không thể hoàn tác.`}
        onConfirm={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
        loading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
};

function CreateUserDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
  error,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (d: Parameters<typeof adminUserApi.createUser>[0]) => void;
  loading: boolean;
  error?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [status, setStatus] = useState('active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password, fullName, phone, role, status });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm người dùng</DialogTitle>
          <DialogDescription>Điền thông tin để tạo tài khoản mới</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2 text-sm">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Mật khẩu (để trống = Password123!)</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="fullName">Họ tên</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Vai trò</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="customer">Khách hàng</SelectItem>
                <SelectItem value="owner">Nhà cung cấp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Trạng thái</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
                <SelectItem value="banned">Bị khóa</SelectItem>
                <SelectItem value="pending">Chờ xác thực</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserDetailForm({
  user,
  onClose,
  onSave,
  saving,
}: {
  user: AdminUserDetail;
  onClose: () => void;
  onSave: (data: Parameters<typeof adminUserApi.updateUser>[1]) => void;
  saving: boolean;
}) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [status, setStatus] = useState(user.status);
  const [role, setRole] = useState(user.role);
  const [travelStyle, setTravelStyle] = useState(user.profile?.travel_style || '');
  const [businessName, setBusinessName] = useState(user.profile?.business_name || '');
  const [department, setDepartment] = useState(user.profile?.department || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profile =
      role === 'customer'
        ? { travel_style: travelStyle }
        : role === 'owner'
          ? { business_name: businessName }
          : { department };
    onSave({ fullName, phone, status, role, profile });
  };

  return (
    <div className="page-enter">
      <PageHeader
        title="Chi tiết người dùng"
        breadcrumbs={[
          { label: 'Admin', path: '/admin/dashboard' },
          { label: 'Người dùng', path: '/admin/users' },
          { label: user.email },
        ]}
        actions={
          <Button variant="outline" onClick={onClose}>
            Quay lại
          </Button>
        }
      />
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Chỉnh sửa</CardTitle>
          <CardDescription>Email: {user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="fullName">Họ tên</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="banned">Bị khóa</SelectItem>
                  <SelectItem value="pending">Chờ xác thực</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vai trò</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="customer">Khách hàng</SelectItem>
                  <SelectItem value="owner">Nhà cung cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === 'customer' && (
              <div>
                <Label>Phong cách du lịch</Label>
                <Input value={travelStyle} onChange={(e) => setTravelStyle(e.target.value)} placeholder="Adventure, Luxury..." />
              </div>
            )}
            {role === 'owner' && (
              <div>
                <Label>Tên doanh nghiệp</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
            )}
            {role === 'admin' && (
              <div>
                <Label>Phòng ban</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
            )}
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminUsers;
