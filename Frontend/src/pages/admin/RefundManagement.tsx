import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    CheckCircle,
    XCircle,
    Loader2,
    Eye,
    Receipt,
    Calendar,
    User,
    MessageSquare,
    AlertTriangle
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

export const RefundManagement = () => {
    const queryClient = useQueryClient();
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [adminNote, setAdminNote] = useState('');

    const { data: pendingData, isLoading: isPendingLoading } = useQuery({
        queryKey: ['admin', 'refund-requests', 'pending'],
        queryFn: () => adminApi.listRefundRequests('pending'),
    });

    const { data: historyData, isLoading: isHistoryLoading } = useQuery({
        queryKey: ['admin', 'refund-requests', 'history'],
        queryFn: () => adminApi.listRefundRequests('history'),
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, note }: { id: string; note: string }) => adminApi.approveRefund(id, note),
        onSuccess: (res) => {
            toast.success(res.message || 'Đã duyệt hoàn tiền thành công');
            queryClient.invalidateQueries({ queryKey: ['admin', 'refund-requests'] });
            setSelectedRequest(null);
            setAdminNote('');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Lỗi khi duyệt hoàn tiền');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, note }: { id: string; note: string }) => adminApi.rejectRefund(id, note),
        onSuccess: (res) => {
            toast.success(res.message || ' Đã từ chối yêu cầu hoàn tiền');
            queryClient.invalidateQueries({ queryKey: ['admin', 'refund-requests'] });
            setSelectedRequest(null);
            setAdminNote('');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Lỗi khi từ chối yêu cầu');
        }
    });

    if (isPendingLoading || isHistoryLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const pendingRequests = pendingData?.data || [];
    const historyRequests = historyData?.data || [];

    return (
        <div className="space-y-6 container py-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý Hoàn tiền</h1>
                    <p className="text-muted-foreground">Phê duyệt hoặc xem lại lịch sử các yêu cầu hoàn tiền.</p>
                </div>
            </div>

            <Tabs defaultValue="pending" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="pending">Chờ xử lý ({pendingRequests.length})</TabsTrigger>
                    <TabsTrigger value="history">Lịch sử hoàn tiền</TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                    <Card>
                        <CardHeader>
                            <CardTitle>Yêu cầu đang chờ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Mã đơn hàng</TableHead>
                                            <TableHead>Khách hàng</TableHead>
                                            <TableHead>Số tiền</TableHead>
                                            <TableHead>Ngày yêu cầu</TableHead>
                                            <TableHead>Lý do</TableHead>
                                            <TableHead className="text-right">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingRequests.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-medium">Hiện tại không có yêu cầu nào mới.</TableCell>
                                            </TableRow>
                                        ) : (
                                            pendingRequests.map((req: any) => (
                                                <TableRow key={req.id_refund_request} className="hover:bg-muted/30 transition-colors">
                                                    <TableCell className="font-bold text-primary">#{req.order_code}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">{req.full_name}</span>
                                                            <span className="text-xs text-muted-foreground">{req.email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-destructive">
                                                        {Number(req.amount).toLocaleString('vi-VN')} ₫
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {new Date(req.created_at).toLocaleString('vi-VN')}
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate italic text-muted-foreground">
                                                        "{req.reason}"
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    onClick={() => {
                                                                        setSelectedRequest(req);
                                                                        setAdminNote('');
                                                                    }}
                                                                >
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    Chi tiết
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-[500px]">
                                                                <DialogHeader>
                                                                    <DialogTitle className="flex items-center gap-2">
                                                                        <Receipt className="h-5 w-5 text-primary" />
                                                                        Xử lý hoàn tiền
                                                                    </DialogTitle>
                                                                </DialogHeader>

                                                                {selectedRequest && (
                                                                    <div className="space-y-4 py-4">
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div className="space-y-1">
                                                                                <span className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-1">
                                                                                    <User className="h-3 w-3" /> Khách hàng
                                                                                </span>
                                                                                <p className="font-medium">{selectedRequest.full_name}</p>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <span className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-1">
                                                                                    <Calendar className="h-3 w-3" /> Ngày yêu cầu
                                                                                </span>
                                                                                <p className="font-medium">{new Date(selectedRequest.created_at).toLocaleDateString('vi-VN')}</p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="p-3 bg-destructive/5 border border-destructive/10 rounded-lg text-center">
                                                                            <span className="text-xs text-destructive uppercase font-bold">Số tiền hoàn trả</span>
                                                                            <p className="text-2xl font-bold text-destructive">
                                                                                {Number(selectedRequest.amount).toLocaleString('vi-VN')} ₫
                                                                            </p>
                                                                        </div>

                                                                        <div className="space-y-1">
                                                                            <span className="text-xs text-muted-foreground uppercase font-bold">Lý do từ khách hàng</span>
                                                                            <p className="text-sm p-3 rounded-md bg-muted/50 italic border">
                                                                                "{selectedRequest.reason}"
                                                                            </p>
                                                                        </div>

                                                                        <div className="space-y-2">
                                                                            <span className="text-xs font-bold uppercase">Ghi chú của Admin (Gửi cho khách)</span>
                                                                            <Textarea 
                                                                                placeholder="Nhập ghi chú hỗ trợ hoặc lý do từ chối..."
                                                                                value={adminNote}
                                                                                onChange={(e) => setAdminNote(e.target.value)}
                                                                                className="min-h-[100px]"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <DialogFooter className="gap-2 sm:gap-0">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        className="text-destructive"
                                                                        onClick={() => rejectMutation.mutate({ id: selectedRequest.id_refund_request, note: adminNote })}
                                                                        disabled={!adminNote || rejectMutation.isPending || approveMutation.isPending}
                                                                    >
                                                                        Từ chối
                                                                    </Button>
                                                                    <Button 
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                        onClick={() => approveMutation.mutate({ id: selectedRequest.id_refund_request, note: adminNote })}
                                                                        disabled={approveMutation.isPending || rejectMutation.isPending}
                                                                    >
                                                                        Phê duyệt
                                                                    </Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lịch sử xử lý</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Mã đơn</TableHead>
                                            <TableHead>Khách hàng</TableHead>
                                            <TableHead>Số tiền</TableHead>
                                            <TableHead>Kết quả</TableHead>
                                            <TableHead>Ngày xử lý</TableHead>
                                            <TableHead>Ghi chú Admin</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {historyRequests.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Chưa có lịch sử hoàn tiền.</TableCell>
                                            </TableRow>
                                        ) : (
                                            historyRequests.map((req: any) => (
                                                <TableRow key={req.id_refund_request}>
                                                    <TableCell className="font-medium">#{req.order_code}</TableCell>
                                                    <TableCell>{req.full_name}</TableCell>
                                                    <TableCell className="font-bold">
                                                        {Number(req.amount).toLocaleString('vi-VN')} ₫
                                                    </TableCell>
                                                    <TableCell>
                                                        {req.status === 'approved' ? (
                                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Đã hoàn tiền</Badge>
                                                        ) : (
                                                            <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Từ chối</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {new Date(req.updated_at).toLocaleString('vi-VN')}
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate text-sm">
                                                        {req.admin_note || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default RefundManagement;
