import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminProvidersApi } from '@/api/admin-providers.api';
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
    CardDescription
} from '@/components/ui/card';
import {
    CheckCircle,
    User,
    Briefcase,
    Eye,
    Loader2,
    Phone,
    Mail,
    Wallet,
    FileText,
    ExternalLink,
    ChevronRight,
    ChevronLeft
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
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const PendingBusinessApprovals = () => {
    const queryClient = useQueryClient();
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [activeImageIdx, setActiveImageIdx] = useState(0);

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'pending-business'],
        queryFn: () => adminProvidersApi.listPendingBusiness(),
    });

    const approveMutation = useMutation({
        mutationFn: (userId: string) => adminProvidersApi.approveAccount(userId),
        onSuccess: (res) => {
            toast.success(res.message || 'Đã duyệt tài khoản thành công');
            queryClient.invalidateQueries({ queryKey: ['admin', 'pending-business'] });
            setSelectedRequest(null);
        },
        onError: (err: any) => {
            toast.error(err.message || 'Lỗi khi duyệt tài khoản');
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const requests = data?.data || [];

    const handleOpenDetail = (req: any) => {
        setSelectedRequest(req);
        setActiveImageIdx(0);
    };

    return (
        <div className="space-y-6 container py-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Thẩm định Hồ sơ Đối tác</h1>
                    <p className="text-muted-foreground">Admin kiểm tra các văn bản pháp lý trước khi cấp quyền kinh doanh.</p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Yêu cầu chờ thẩm định ({requests.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[200px]">Người đại diện</TableHead>
                                        <TableHead>Tên doanh nghiệp</TableHead>
                                        <TableHead>Loại hình</TableHead>
                                        <TableHead>Ngày gửi</TableHead>
                                        <TableHead>Văn bản pháp lý</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-medium">Hiện tại không có hồ sơ nào cần thẩm định.</TableCell>
                                        </TableRow>
                                    ) : (
                                        requests.map((req: any) => (
                                            <TableRow key={req.id_user} className="hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-primary">{req.full_name}</span>
                                                        <span className="text-xs text-muted-foreground">{req.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium text-foreground">{req.business_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize bg-primary/5 text-primary border-primary/20">{req.service_type}</Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {new Date(req.created_at).toLocaleString('vi-VN')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <FileText className="h-4 w-4 text-blue-500" />
                                                        <span className="text-xs font-bold">{req.legal_documents?.length || 0} ảnh</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm" onClick={() => handleOpenDetail(req)}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Xem hồ sơ
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                                            <DialogHeader className="border-b pb-4">
                                                                <DialogTitle className="text-xl flex items-center gap-2">
                                                                    <Briefcase className="h-5 w-5 text-primary" />
                                                                    Chi tiết hồ sơ đối tác: {selectedRequest?.business_name}
                                                                </DialogTitle>
                                                                <DialogDescription>Kiểm tra kỹ các văn bản pháp lý (GPKD, MST) bên dưới.</DialogDescription>
                                                            </DialogHeader>

                                                            {selectedRequest && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                                                                    <div className="space-y-6">
                                                                        <section className="space-y-3">
                                                                            <h4 className="font-bold flex items-center gap-2 text-primary border-l-4 border-primary pl-2 uppercase text-xs">Thông tin quản trị</h4>
                                                                            <div className="grid grid-cols-1 gap-2 p-3 bg-muted/30 rounded-lg text-sm">
                                                                                <div className="flex justify-between"><span>Đại diện:</span> <span className="font-medium">{selectedRequest.full_name}</span></div>
                                                                                <div className="flex justify-between"><span>Email:</span> <span className="font-medium">{selectedRequest.email}</span></div>
                                                                                <div className="flex justify-between"><span>SĐT cá nhân:</span> <span className="font-medium">{selectedRequest.phone || 'N/A'}</span></div>
                                                                            </div>
                                                                        </section>

                                                                        <section className="space-y-3">
                                                                            <h4 className="font-bold flex items-center gap-2 text-primary border-l-4 border-primary pl-2 uppercase text-xs">Thông tin kinh doanh</h4>
                                                                            <div className="grid grid-cols-1 gap-2 p-3 bg-muted/30 rounded-lg text-sm">
                                                                                <div className="flex justify-between"><span>Loại hình:</span> <Badge className="capitalize">{selectedRequest.service_type}</Badge></div>
                                                                                <div className="flex justify-between"><span>Khu vực:</span> <span className="font-medium">{selectedRequest.area_name}, {selectedRequest.city_name}</span></div>
                                                                                <div className="flex justify-between"><span>SĐT Doanh nghiệp:</span> <span className="font-medium">{selectedRequest.business_phone || selectedRequest.phone}</span></div>
                                                                            </div>
                                                                        </section>

                                                                        <section className="space-y-3">
                                                                            <h4 className="font-bold flex items-center gap-2 text-primary border-l-4 border-primary pl-2 uppercase text-xs">Thanh toán (Bank)</h4>
                                                                            <div className="grid grid-cols-1 gap-2 p-3 border border-dashed rounded-lg text-sm">
                                                                                <div className="flex justify-between"><span>Ngân hàng:</span> <span className="font-medium">{selectedRequest.bank_name || 'N/A'}</span></div>
                                                                                <div className="flex justify-between"><span>Số tài khoản:</span> <span className="font-medium">{selectedRequest.bank_account_number || 'N/A'}</span></div>
                                                                                <div className="flex justify-between"><span>Chủ tài khoản:</span> <span className="font-bold text-blue-600">{selectedRequest.bank_account_name || 'N/A'}</span></div>
                                                                            </div>
                                                                        </section>
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                        <h4 className="font-bold flex items-center gap-2 text-primary border-l-4 border-primary pl-2 uppercase text-xs">Văn bản pháp lý ({selectedRequest.legal_documents?.length || 0})</h4>

                                                                        {selectedRequest.legal_documents && selectedRequest.legal_documents.length > 0 ? (
                                                                            <div className="space-y-3">
                                                                                <div className="relative group aspect-[4/3] rounded-xl overflow-hidden border-2 border-muted shadow-inner bg-black/5 flex items-center justify-center">
                                                                                    <img
                                                                                        src={`${API_BASE_URL}${selectedRequest.legal_documents[activeImageIdx]}`}
                                                                                        className="max-w-full max-h-full object-contain"
                                                                                        alt="Legal document"
                                                                                    />

                                                                                    {selectedRequest.legal_documents.length > 1 && (
                                                                                        <>
                                                                                            <Button
                                                                                                variant="secondary"
                                                                                                size="icon"
                                                                                                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-60 hover:opacity-100"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setActiveImageIdx(prev => (prev === 0 ? selectedRequest.legal_documents.length - 1 : prev - 1));
                                                                                                }}
                                                                                            >
                                                                                                <ChevronLeft className="h-5 w-5" />
                                                                                            </Button>
                                                                                            <Button
                                                                                                variant="secondary"
                                                                                                size="icon"
                                                                                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-60 hover:opacity-100"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setActiveImageIdx(prev => (prev === selectedRequest.legal_documents.length - 1 ? 0 : prev + 1));
                                                                                                }}
                                                                                            >
                                                                                                <ChevronRight className="h-5 w-5" />
                                                                                            </Button>
                                                                                        </>
                                                                                    )}

                                                                                    <a
                                                                                        href={`${API_BASE_URL}${selectedRequest.legal_documents[activeImageIdx]}`}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="absolute bottom-2 right-2 bg-white/80 p-1.5 rounded-lg hover:bg-white transition-colors"
                                                                                    >
                                                                                        <ExternalLink className="h-4 w-4 text-primary" />
                                                                                    </a>
                                                                                </div>

                                                                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                                                                                    {selectedRequest.legal_documents.map((img: string, i: number) => (
                                                                                        <div
                                                                                            key={i}
                                                                                            onClick={() => setActiveImageIdx(i)}
                                                                                            className={`h-16 w-16 shrink-0 rounded-md border-2 overflow-hidden cursor-pointer transition-all ${activeImageIdx === i ? 'border-primary ring-2 ring-primary/20' : 'border-transparent grayscale active:grayscale-0'}`}
                                                                                        >
                                                                                            <img src={`${API_BASE_URL}${img}`} className="w-full h-full object-cover" alt={`Doc ${i + 1}`} />
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="h-40 flex items-center justify-center bg-muted rounded-xl border-2 border-dashed">
                                                                                <p className="text-sm text-muted-foreground">Không có tệp đính kèm nào.</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <DialogFooter className="border-t pt-4">
                                                                <Button variant="ghost" onClick={() => setSelectedRequest(null)} className="h-11">Bỏ qua</Button>
                                                                <Button
                                                                    onClick={() => approveMutation.mutate(selectedRequest.id_user)}
                                                                    disabled={approveMutation.isPending || !selectedRequest}
                                                                    className="bg-green-600 hover:bg-green-700 h-11 px-8 font-bold"
                                                                >
                                                                    {approveMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                                                    XÁC NHẬN PHÊ DUYỆT TÀI KHOẢN
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
            </div>
        </div>
    );
};

export default PendingBusinessApprovals;
