import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProvidersApi, type AdminProviderRow } from '@/api/admin-providers.api';
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

const Providers = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [statusFilter, setStatusFilter] = useState<string>('pending');

    const status = statusFilter === '__all__' ? undefined : statusFilter;

    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin-providers', page, pageSize, statusFilter],
        queryFn: () => adminProvidersApi.list({ page, pageSize, status }),
    });

    const approveMut = useMutation({
        mutationFn: (id: string) => adminProvidersApi.updateStatus(id, 'active'),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-providers'] }),
    });
    const rejectMut = useMutation({
        mutationFn: (id: string) => adminProvidersApi.updateStatus(id, 'inactive'),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-providers'] }),
    });

    const rows = data?.data ?? [];
    const total = data?.total ?? 0;
    const totalPages = data?.totalPages ?? 0;

    return (
        <>
            <PageHeader
                title="Duyệt nhà cung cấp"
                description="Duyệt yêu cầu đăng ký nhà cung cấp dịch vụ mới"
            />
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Danh sách nhà cung cấp</CardTitle>
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
                                        <TableHead>Thông tin</TableHead>
                                        <TableHead>Chủ sở hữu</TableHead>
                                        <TableHead>SĐT</TableHead>
                                        <TableHead>Khu vực</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead className="w-32">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Không tìm thấy nhà cung cấp nào
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {rows.map((r: AdminProviderRow) => (
                                        <TableRow key={r.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {r.image && (
                                                        <img
                                                            src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${r.image}`}
                                                            alt={r.name}
                                                            className="h-10 w-10 rounded-md object-cover"
                                                        />
                                                    )}
                                                    <div className="font-medium">{r.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>{r.ownerName}</div>
                                                <div className="text-xs text-muted-foreground">{r.ownerEmail}</div>
                                            </TableCell>
                                            <TableCell>{r.phone}</TableCell>
                                            <TableCell>
                                                {r.areaName} ({r.cityName})
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={r.status === 'active' ? 'default' : r.status === 'pending' ? 'secondary' : 'outline'}>
                                                    {statusLabels[r.status] ?? r.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {r.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                                            onClick={() => approveMut.mutate(r.id)}
                                                            disabled={approveMut.isPending}
                                                        >
                                                            <Check className="h-4 w-4 mr-1" /> Duyệt
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-destructive border-red-200 hover:bg-red-50"
                                                            onClick={() => rejectMut.mutate(r.id)}
                                                            disabled={rejectMut.isPending}
                                                        >
                                                            <X className="h-4 w-4 mr-1" /> Từ chối
                                                        </Button>
                                                    </div>
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

export default Providers;
