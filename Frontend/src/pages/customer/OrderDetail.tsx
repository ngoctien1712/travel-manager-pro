import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorState from '@/components/ErrorState';
import { customerApi } from '@/api/customer.api';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundData, setRefundData] = useState({ amount: '', reason: '' });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await customerApi.getMyOrder(id!);
        setOrder(data);
        setRefundData({ 
          amount: (data?.total_amount ?? data?.totalAmount ?? 0).toString(), 
          reason: '' 
        });
        setError(null);
      } catch (err) {
        setError('Không tìm thấy đơn hàng');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!confirm('Xác nhận hủy đơn hàng này?')) return;
    try {
      await customerApi.cancelOrder(id!);
      alert('Đơn hàng đã bị hủy');
      navigate('/my-orders');
    } catch (error) {
      alert('Lỗi khi hủy đơn hàng');
    }
  };

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundData.amount || !refundData.reason) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    try {
      await customerApi.requestRefund(id!, Number(refundData.amount), refundData.reason);
      alert('Yêu cầu hoàn tiền đã được gửi');
      setShowRefundForm(false);
    } catch (error) {
      alert('Lỗi khi gửi yêu cầu hoàn tiền');
    }
  };

  if (error) return <ErrorState message={error} />;
  if (loading) return <LoadingSkeleton />;
  if (!order) return <ErrorState message="Không tìm thấy đơn hàng" />;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  return (
    <div className="container mx-auto py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        ← Quay lại
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold">{order.order_code || order.id_order}</h1>
                <p className="text-gray-600">
                  Ngày đặt: {new Date(order.create_at).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <span className={`px-4 py-2 rounded font-semibold ${statusColors[order.status] || 'bg-gray-100'}`}>
                {statusLabels[order.status] || order.status}
              </span>
            </div>

            <div className="border-t border-b py-6 mb-6">
              <h2 className="font-bold mb-4">Chi tiết dịch vụ</h2>
              <div className="space-y-4">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <div>
                        <p className="font-semibold">{item.title || `Dịch vụ ${idx + 1}`}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity || 1} × {((item.price || 0)).toLocaleString()}đ
                        </p>
                      </div>
                      <span className="font-semibold">
                        {((item.price || 0) * (item.quantity || 1)).toLocaleString()}đ
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">Không có thông tin dịch vụ</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded mb-6">
              <h2 className="font-bold mb-3">Thông tin thanh toán</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span>{order.total_amount?.toLocaleString() || 0}đ</span>
                </div>
                {order.payments && order.payments.length > 0 && (
                  <div className="flex justify-between">
                    <span>Trạng thái thanh toán:</span>
                    <span className="font-semibold">{order.payments[0].status}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">{order.total_amount?.toLocaleString() || 0}đ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {order.status === 'pending' && (
              <Button 
                variant="destructive"
                onClick={handleCancelOrder}
              >
                Hủy đơn hàng
              </Button>
            )}
            <Button 
              onClick={() => setShowRefundForm(!showRefundForm)}
            >
              {showRefundForm ? 'Hủy' : 'Yêu cầu hoàn tiền'}
            </Button>
          </div>
        </div>

        {/* Refund Form Sidebar */}
        <div className="lg:col-span-1">
          {showRefundForm && (
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="font-bold mb-4">Yêu cầu hoàn tiền</h2>
              <form onSubmit={handleRequestRefund} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Số tiền hoàn</label>
                  <Input
                    type="number"
                    value={refundData.amount}
                    onChange={(e) => setRefundData({...refundData, amount: e.target.value})}
                    placeholder="Nhập số tiền"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Lý do hoàn tiền</label>
                  <textarea
                    value={refundData.reason}
                    onChange={(e) => setRefundData({...refundData, reason: e.target.value})}
                    placeholder="Nhập lý do..."
                    className="w-full p-2 border rounded text-sm"
                    rows={4}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Gửi yêu cầu
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
