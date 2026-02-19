import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { customerApi } from '@/api/customer.api';

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const result = await customerApi.listMyOrders();
        setOrders(result.items);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = filter 
    ? orders.filter(o => o.status === filter)
    : orders;

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Đơn hàng của tôi</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between items-center">
        <div className="flex-1">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả đơn</SelectItem>
              <SelectItem value="pending">Chờ xác nhận</SelectItem>
              <SelectItem value="confirmed">Đã xác nhận</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => navigate('/services')}>
          Tiếp tục mua sắm
        </Button>
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState title="Không có đơn hàng nào" />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id_order} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{order.order_code || order.id_order}</h3>
                  <p className="text-sm text-gray-600">
                    Ngày đặt: {new Date(order.create_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {_getStatusLabel(order.status)}
                </span>
              </div>

              <div className="border-t border-b py-4 mb-4">
                {order.items && order.items.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.title || `Dịch vụ ${idx + 1}`}</span>
                        <span className="text-gray-600">{item.quantity || 1}x</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Không có chi tiết dịch vụ</p>
                )}
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Tổng cộng:</span>
                <span className="text-xl font-bold text-blue-600">
                  {order.total_amount?.toLocaleString() || 0}đ
                </span>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/my-orders/${order.id_order}`)}
                  className="flex-1"
                >
                  Xem chi tiết
                </Button>
                {order.status === 'pending' && (
                  <Button 
                    variant="destructive"
                    onClick={() => alert('Tính năng hủy đơn đang phát triển')}
                    className="flex-1"
                  >
                    Hủy đơn
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function _getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };
  return labels[status] || status;
}
