 import { useQuery } from '@tanstack/react-query';
 import { adminApi } from '@/api/admin.api';
 import { PageHeader } from '@/components/PageHeader';
 import { StatCard, StatsGrid } from '@/components/StatsCards';
 import { StatsGridSkeleton } from '@/components/LoadingSkeleton';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { ShoppingBag, DollarSign, Users, Map } from 'lucide-react';
 import { formatCurrency } from '@/utils/format';
 import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
 
 export const AdminDashboard = () => {
   const { data: stats, isLoading } = useQuery({
     queryKey: ['admin-dashboard'],
     queryFn: () => adminApi.getDashboardStats(),
   });
 
   return (
     <div className="page-enter">
       <PageHeader
         title="Tổng quan"
         description="Xem tổng quan hoạt động của hệ thống"
       />
 
       {isLoading ? (
         <StatsGridSkeleton />
       ) : stats ? (
         <>
           <StatsGrid className="mb-6">
             <StatCard
               title="Tổng đơn hàng"
               value={stats.totalOrders}
               icon={<ShoppingBag className="h-6 w-6" />}
               change={stats.ordersChange}
               changeLabel="so với tháng trước"
             />
             <StatCard
               title="Doanh thu"
               value={formatCurrency(stats.totalRevenue)}
               icon={<DollarSign className="h-6 w-6" />}
               change={stats.revenueChange}
               changeLabel="so với tháng trước"
             />
             <StatCard
               title="Khách hàng"
               value={stats.totalCustomers}
               icon={<Users className="h-6 w-6" />}
             />
             <StatCard
               title="Dịch vụ"
               value={stats.totalServices}
               icon={<Map className="h-6 w-6" />}
             />
           </StatsGrid>
 
           <Card className="card-elevated">
             <CardHeader>
               <CardTitle>Doanh thu theo tháng</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={stats.revenueChart}>
                     <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                     <XAxis dataKey="date" className="text-xs" />
                     <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} className="text-xs" />
                     <Tooltip formatter={(v: number) => formatCurrency(v)} />
                     <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
             </CardContent>
           </Card>
         </>
       ) : null}
     </div>
   );
 };
 
 export default AdminDashboard;