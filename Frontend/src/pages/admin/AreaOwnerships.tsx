import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAreaOwnershipsApi, type AreaOwnershipRow } from '@/api/admin-area-ownerships.api';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2 } from 'lucide-react';

const statusLabels: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Đã duyệt',
  inactive: 'Từ chối',
};

export const AreaOwnerships = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  const status = statusFilter === '__all__' ? undefined : statusFilter;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-area-ownerships', page, pageSize, statusFilter],
    queryFn: () => adminAreaOwnershipsApi.list({ page, pageSize, status }),
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => adminAreaOwnershipsApi.updateStatus(id, 'active'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-area-ownerships'] }),
  });
  const rejectMut = useMutation({
    mutationFn: (id: string) => adminAreaOwnershipsApi.updateStatus(id, 'inactive'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-area-ownerships'] }),
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  return (
    <>
      <PageHeader
        title="Duyệt đăng ký khu vực"
        description="Duyệt yêu cầu area owner đăng ký kinh doanh theo khu vực"
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách đăng ký</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="active">Đã duyệt</SelectItem>
              <SelectItem value="inactive">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isError && (
            <div className="text-destructive py-4">Lỗi tải dữ liệu. Kiểm tra đăng nhập admin và thử lại.</div>
          )}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && !isError && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Khu vực</TableHead>
                    <TableHead>Thành phố</TableHead>
                    <TableHead>Quốc gia</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-32">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r: AreaOwnershipRow) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>{r.fullName ?? '-'}</TableCell>
                      <TableCell>{r.areaName}</TableCell>
                      <TableCell>{r.cityName}</TableCell>
                      <TableCell>{r.countryName}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'active' ? 'default' : r.status === 'pending' ? 'secondary' : 'outline'}>
                          {statusLabels[r.status] ?? r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600"
                              onClick={() => approveMut.mutate(r.id)}
                              disabled={approveMut.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" /> Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => rejectMut.mutate(r.id)}
                              disabled={rejectMut.isPending}
                            >
                              <X className="h-4 w-4 mr-1" /> Từ chối
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    Trang {page} / {totalPages} (tổng {total})
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                      Trước
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default AreaOwnerships;
