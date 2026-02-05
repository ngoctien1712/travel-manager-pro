 import { useQuery } from '@tanstack/react-query';
 import { ownerApi } from '@/api/owner.api';
 import { PageHeader } from '@/components/PageHeader';
 import { StatCard, StatsGrid } from '@/components/StatsCards';
 import { StatsGridSkeleton } from '@/components/LoadingSkeleton';
 import { ShoppingBag, DollarSign, Star, Map } from 'lucide-react';
 import { formatCurrency } from '@/utils/format';
 
 export const OwnerDashboard = () => {
   const { data: stats, isLoading } = useQuery({
     queryKey: ['owner-dashboard'],
     queryFn: () => ownerApi.getDashboard(),
   });
 
   return (
     <div className="page-enter">
       <PageHeader
         title="Tổng quan"
         description="Xem tổng quan hoạt động kinh doanh của bạn"
       />
 
       {isLoading ? (
         <StatsGridSkeleton />
       ) : stats ? (
         <StatsGrid>
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
             title="Đánh giá trung bình"
             value={stats.averageRating.toFixed(1)}
             icon={<Star className="h-6 w-6" />}
           />
           <StatCard
             title="Dịch vụ"
             value={stats.totalServices}
             icon={<Map className="h-6 w-6" />}
           />
         </StatsGrid>
       ) : null}
     </div>
   );
 };
 
 export default OwnerDashboard;