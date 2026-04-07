import { useQuery } from '@tanstack/react-query';
import { ownerApi } from '@/api/owner.api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/utils/format';
import { Badge } from '@/components/ui/badge';
import { History, CreditCard, Landmark, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PayrollHistory = () => {
    const { data: history, isLoading } = useQuery({
        queryKey: ['owner-payroll-history'],
        queryFn: () => ownerApi.getPayrollHistory(),
    });

    return (
        <div className="page-enter space-y-8 p-6">
            <PageHeader
                title="Lịch sử nhận lương"
                description="Xem danh sách các đơn thanh toán doanh thu từ hệ thống"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Tổng thu nhập đã nhận</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-primary">
                            {formatCurrency(history?.data?.reduce((sum: number, h: any) => sum + Number(h.amount), 0) || 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Đợt thanh toán gần nhất</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">
                            {history?.data?.[0] ? formatCurrency(history.data[0].amount) : '---'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {history?.data?.[0] ? formatDate(history.data[0].created_at) : ''}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Số lệnh thanh toán</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{history?.data?.length || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="card-elevated">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Danh sách các đợt quyết toán
                    </CardTitle>
                    <CardDescription>Bảng chi tiết các lần Admin đã chuyển tiền doanh thu cho bạn.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ngày thực hiện</TableHead>
                                <TableHead>Nhà cung cấp</TableHead>
                                <TableHead>Số lượng đơn</TableHead>
                                <TableHead>Phương thức</TableHead>
                                <TableHead className="text-right">Số tiền nhận</TableHead>
                                <TableHead className="text-right">Mã giao dịch</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-8">Đang tải dữ liệu...</TableCell></TableRow>
                            ) : history?.data?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                                        Bạn chưa có giao dịch thanh toán nào từ hệ thống.
                                    </TableCell>
                                </TableRow>
                            ) : history?.data?.map((h: any) => (
                                <TableRow key={h.id_payroll} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {formatDate(h.created_at)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold">{h.provider_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{h.order_count} đơn hàng</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-[10px] leading-tight text-muted-foreground">
                                            <span className="font-bold flex items-center gap-1 text-foreground"><Landmark className="h-3 w-3" /> {h.metadata?.bankName}</span>
                                            <span>{h.metadata?.accountNumber}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-black text-green-600 text-lg">
                                        {formatCurrency(h.amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className="font-mono flex items-center gap-1 w-fit ml-auto">
                                            <FileText className="h-3 w-3" />
                                            {h.transaction_proof || 'AUTO_GEN'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

const Calendar = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

export default PayrollHistory;
