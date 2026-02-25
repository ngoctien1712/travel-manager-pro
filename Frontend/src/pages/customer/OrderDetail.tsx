import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorState from '@/components/ErrorState';
import { customerApi } from '@/api/customer.api';
import { httpClient } from '@/api/http';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundData, setRefundData] = useState({ amount: '', reason: '' });

  useEffect(() => {
    const fetchOrder = async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
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
        if (showLoading) setLoading(false);
      }
    };

    if (id) fetchOrder();

    // Polling if pending
    let interval: any;
    if (id && order?.status === 'pending') {
      interval = setInterval(() => {
        fetchOrder(false); // background refresh
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id, order?.status]);

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
  const handleMomoPayment = async () => {
    try {
      setLoading(true);
      const res = await customerApi.initMomoPayment(id!);
      if (res.payUrl) {
        window.location.href = res.payUrl;
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi khi thanh toán qua Momo');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSuccess = async () => {
    try {
      setLoading(true);
      await httpClient.post('/customer/webhook/project', {
        order_code: order.order_code,
        amount: order.total_amount,
        transaction_id: 'TRANS_' + Math.random().toString(36).substring(7).toUpperCase()
      });
      alert('Demo Thành Công: Hệ thống đã nhận được tiền và xác nhận đơn hàng!');
      window.location.reload();
    } catch (err) {
      alert('Lỗi giả lập');
    } finally {
      setLoading(false);
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
                {order.details ? (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{order.details.title || 'Dịch vụ đã đặt'}</p>
                      <div className="text-sm text-gray-600 mt-2 space-y-1">
                        {order.order_type === 'tour' && (
                          <>
                            <p>Ngày khởi hành: {new Date(order.details.booking_date).toLocaleDateString('vi-VN')}</p>
                            <p>Số lượng: {order.details.quantity} khách</p>
                          </>
                        )}
                        {order.order_type === 'accommodation' && (
                          <>
                            <p>Phòng: {order.details.name_room}</p>
                            <p>Thời gian: {new Date(order.details.start_date).toLocaleDateString('vi-VN')} - {new Date(order.details.end_date).toLocaleDateString('vi-VN')}</p>
                            <p>Số lượng: {order.details.quantity} phòng</p>
                          </>
                        )}
                        {order.order_type === 'vehicle' && (
                          <>
                            <p>Chuyến: {order.details.code_vehicle}</p>
                            <p>Vị trí ghế: {order.details.code_position}</p>
                            <p>Thời gian: {order.details.from}</p>
                          </>
                        )}
                        {order.order_type === 'ticket' && (
                          <>
                            <p>Ngày tham quan: {new Date(order.details.visit_date).toLocaleDateString('vi-VN')}</p>
                            <p>Số lượng: {order.details.quantity} vé</p>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="font-black text-xl text-blue-600">
                      {order.total_amount?.toLocaleString() || 0}đ
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-600">Đang tải chi tiết...</p>
                )}
              </div>
            </div>

            {order.status === 'confirmed' && (
              <div className="bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-[2rem] p-8 mb-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-emerald-900 mb-2 uppercase tracking-tighter">Thanh toán thành công!</h3>
                <p className="text-emerald-700 font-medium mb-6">
                  Cảm ơn bạn! Giao dịch đã được hệ thống xác nhận tự động. <br />
                  Thông tin dịch vụ đã sẵn sàng để bạn trải nghiệm.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    onClick={() => navigate('/my-orders')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 font-bold"
                  >
                    XEM DANH SÁCH ĐƠN HÀNG
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-100/50 rounded-xl px-8 font-bold"
                  >
                    IN HÓA ĐƠN
                  </Button>
                </div>
              </div>
            )}

            {(order.status === 'pending' && (order.payment_method === 'momo' || order.payment_method === 'bank')) && (
              <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-[2rem] p-8 mb-6">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  {/* QR Code Section */}
                  <div className="bg-white p-4 rounded-3xl shadow-xl shadow-blue-100/50 flex flex-col items-center gap-3 shrink-0">
                    <img
                      src={`https://img.vietqr.io/image/MB-0383227692-compact2.png?amount=${order.total_amount ? Math.floor(order.total_amount) : 0}&addInfo=${order.order_code}&accountName=HUYNH%20NGOC%20TIEN`}
                      alt="MBBank QR Code"
                      className="w-48 h-48 object-contain"
                    />
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Quét để thanh toán</p>
                  </div>

                  {/* Instructions Section */}
                  <div className="flex-1">
                    <h3 className="font-black text-blue-900 mb-4 flex items-center gap-2 uppercase tracking-[0.2em] text-xs">
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" /> Hướng dẫn chuyển khoản QR
                    </h3>
                    <div className="space-y-4 text-sm text-blue-800 font-medium">
                      <div className="p-4 rounded-2xl bg-white/50 border border-blue-100">
                        <p className="text-[10px] text-blue-400 uppercase font-black mb-1">Ngân hàng / Số tài khoản</p>
                        <p className="font-black text-lg">MBBank - 0383227692</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Chủ TK: HUYNH NGOC TIEN</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/50 border border-blue-100">
                        <p className="text-[10px] text-blue-400 uppercase font-black mb-1">Nội dung chuyển khoản</p>
                        <p className="font-black text-lg text-blue-600">{order.order_code}</p>
                      </div>
                      <div className="pt-4">
                        <Button
                          onClick={handleMomoPayment}
                          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-100/50 flex items-center justify-center gap-2 group transition-all"
                        >
                          MỞ APP NGÂN HÀNG ĐỂ QUÉT MÃ
                          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                            <img src="https://vietqr.net/portal-v2/images/img/logo-vietqr.png" className="w-8 h-4 object-contain" alt="vietqr" />
                          </div>
                        </Button>
                      </div>
                      <p className="text-[10px] text-blue-500 italic leading-relaxed">
                        * Mở app MBBank hoặc bất kỳ ứng dụng Ngân hàng nào, chọn quét mã QR để thanh toán nhanh.
                        Tiền sẽ được cộng trực tiếp vào dịch vụ sau khi giao dịch thành công.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Demo Zone */}
                <div className="mt-8 pt-6 border-t border-blue-100 flex flex-col items-center gap-2">
                  <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest">Khu vực Demo (Dành cho đồ án)</p>
                  <Button
                    variant="outline"
                    onClick={handleSimulateSuccess}
                    className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-600 border-blue-100 rounded-full h-8 px-6 bg-transparent"
                  >
                    Mô phỏng: Server nhận được tiền từ Momo
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-6 rounded-2xl mb-6">
              <h2 className="font-bold mb-4">Thông tin thanh toán</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Phương thức:</span>
                  <span className="font-bold uppercase">{order.payment_method || 'momo'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className={`font-bold ${order.payments?.[0]?.status === 'paid' ? 'text-emerald-600' : 'text-yellow-600'}`}>
                    {order.payments?.[0]?.status || 'Chưa thanh toán'}
                  </span>
                </div>
                <div className="border-t border-gray-200 my-3 pt-3 flex justify-between font-black text-lg">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-blue-600">
                    {order.total_amount ? Number(order.total_amount).toLocaleString('vi-VN') : 0}đ
                  </span>
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
                    onChange={(e) => setRefundData({ ...refundData, amount: e.target.value })}
                    placeholder="Nhập số tiền"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Lý do hoàn tiền</label>
                  <textarea
                    value={refundData.reason}
                    onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
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
