import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ErrorState from '@/components/ErrorState';
import { customerApi } from '@/api/customer.api';
import { httpClient } from '@/api/http';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, CheckCircle2, Clock, MapPin,
  Sparkles, Users, Phone, ShieldCheck, CreditCard,
  Download, Printer, Receipt, Info, Calendar, ExternalLink
} from 'lucide-react';

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
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container max-w-5xl px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/my-orders')} className="font-bold gap-2">
            <ChevronLeft size={18} /> Quay lại danh sách
          </Button>
          <h1 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Chi tiết hóa đơn</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="container max-w-5xl px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Status Banner */}
            <Card className={`p-8 rounded-[2.5rem] border-none shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden ${order.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'bg-white'}`}>
              {order.status === 'confirmed' && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />}
              <div className="flex items-center gap-6 relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-500 ${order.status === 'confirmed' ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}>
                  {order.status === 'confirmed' ? <CheckCircle2 size={32} /> : <Clock size={32} />}
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${order.status === 'confirmed' ? 'text-white/70' : 'text-gray-400'}`}>Trạng thái đơn hàng</p>
                  <h2 className="text-2xl font-black tracking-tight">{statusLabels[order.status] || order.status}</h2>
                </div>
              </div>
              <div className="text-center md:text-right relative z-10">
                <div className="flex flex-col md:items-end gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 backdrop-blur-sm">
                    <Receipt size={12} className={order.status === 'confirmed' ? 'text-white' : 'text-blue-500'} />
                    <span className="font-black text-xs">#{order.order_code || order.id_order.slice(0, 8)}</span>
                  </div>
                  <p className={`text-[9px] font-bold uppercase tracking-widest ${order.status === 'confirmed' ? 'text-white/50' : 'text-gray-300'}`}>Ngày đặt: {new Date(order.create_at).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            </Card>

            {/* Service & Detailed Invoice Information */}
            <Card className="p-10 rounded-[2.5rem] border-none shadow-xl space-y-12 bg-white relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Chi tiết dịch vụ</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-xl font-black text-[10px] uppercase tracking-widest border-gray-100 gap-2">
                    <Printer size={14} /> In hóa đơn
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest border-gray-100 gap-2">
                    <Download size={14} /> Tải PDF
                  </Button>
                </div>
              </div>

              {order.details && (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div>
                        <h4 className="font-black text-3xl text-gray-900 leading-tight mb-3">{order.details.title || 'Dịch vụ đã đặt'}</h4>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-blue-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-md shadow-blue-100">{order.order_type}</Badge>
                          <Badge variant="outline" className="border-gray-100 text-gray-400 font-black text-[9px] uppercase tracking-widest px-3 py-1">Xác nhận tức thì</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {order.order_type === 'accommodation' && (
                          <div className="flex gap-4">
                            <div className="p-5 rounded-3xl bg-gray-50 flex-1 border border-gray-100 transition-colors hover:bg-white hover:shadow-lg duration-500">
                              <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Nhận phòng</p>
                              <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-blue-500" />
                                <p className="font-black text-gray-900">{new Date(order.details.start_date || order.details.checkin_date).toLocaleDateString('vi-VN')}</p>
                              </div>
                            </div>
                            <div className="p-5 rounded-3xl bg-gray-50 flex-1 border border-gray-100 transition-colors hover:bg-white hover:shadow-lg duration-500">
                              <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Trả phòng</p>
                              <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-blue-500" />
                                <p className="font-black text-gray-900">{new Date(order.details.end_date || order.details.checkout_date).toLocaleDateString('vi-VN')}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {(order.order_type === 'tour' || order.order_type === 'ticket') && (
                          <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100">
                            <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Ngày thực hiện</p>
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-blue-500" />
                              <p className="font-black text-gray-900">{new Date(order.details.booking_date || order.details.visit_date).toLocaleDateString('vi-VN')}</p>
                            </div>
                          </div>
                        )}
                        {order.order_type === 'vehicle' && (
                          <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100 space-y-3">
                            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Thông tin vận chuyển</p>
                            <div className="flex justify-between items-center font-black text-gray-900">
                              <span>Ghế: {Array.isArray(order.details.seats) ? order.details.seats.join(', ') : order.details.seats}</span>
                              <Badge variant="outline" className="text-[10px]">{order.details.quantity} ghế</Badge>
                            </div>
                          </div>
                        )}

                        <div className="p-6 rounded-3xl bg-blue-50/50 border border-blue-100 flex items-center justify-between group transition-all duration-500">
                          <div>
                            <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Hành khách / Số lượng</p>
                            <p className="font-black text-blue-900 text-lg">
                              {order.details.quantity} {order.order_type === 'accommodation' ? 'phòng' : (order.order_type === 'vehicle' ? 'Ghế' : 'khách')}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-12">
                            <Users size={24} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-8 rounded-[2.5rem] bg-gray-900 text-white space-y-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/20 transition-all duration-700" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Tóm tắt thanh toán</p>
                        <div className="space-y-4 relative z-10">
                          <div className="flex justify-between text-sm">
                            <span className="opacity-50 font-bold uppercase tracking-widest text-[10px]">Đơn giá</span>
                            <span className="font-bold">{(Number(order.total_amount) / (Number(order.details.quantity) || 1)).toLocaleString()}đ</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="opacity-50 font-bold uppercase tracking-widest text-[10px]">Số lượng</span>
                            <span className="font-bold">x{order.details.quantity}</span>
                          </div>
                          <div className="pt-6 border-t border-white/10 flex flex-col items-end gap-1">
                            <span className="font-black text-[10px] uppercase tracking-[0.3em] text-blue-400">Tổng thanh toán</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-black text-white tracking-tighter">{Number(order.total_amount).toLocaleString()}</span>
                              <span className="font-black text-blue-400 text-sm italic">VNĐ</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 animate-pulse">
                        <ShieldCheck size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Giao dịch được bảo vệ bởi VietTravel Trust</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info Card */}
                  <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 space-y-6">
                    <div className="flex items-center gap-3">
                      <Info size={18} className="text-gray-400" />
                      <h5 className="font-black text-xs uppercase tracking-widest text-gray-500">Thông tin hành khách liên hệ</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Họ và tên</p>
                        <p className="font-black text-gray-900">{order.details.guest_info?.fullName || order.details.travelerInfo?.fullName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Số điện thoại</p>
                        <p className="font-black text-gray-900">{order.details.guest_info?.phone || order.details.travelerInfo?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Email</p>
                        <p className="font-black text-gray-900">{order.details.guest_info?.email || order.details.travelerInfo?.email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Payment Section (Keep your existing MBBank logic but styled better) */}
            {order.status === 'pending' && (
              <Card className="p-10 rounded-[2.5rem] border-none shadow-sm bg-blue-50/50 border border-blue-100 space-y-8">
                <div className="flex flex-col md:flex-row gap-10 items-center">
                  <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-blue-200/50 flex flex-col items-center gap-4 group">
                    <div className="relative">
                      <img
                        src={`https://img.vietqr.io/image/MB-0383227692-compact2.png?amount=${order.total_amount ? Math.floor(order.total_amount) : 0}&addInfo=${order.order_code}&accountName=HUYNH%20NGOC%20TIEN`}
                        alt="MBBank QR Code"
                        className="w-48 h-48 object-contain transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 border-2 border-blue-100 rounded-2xl -m-2 opacity-50" />
                    </div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Quét để thanh toán ngay</p>
                  </div>

                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight mb-2">Thanh toán chuyển khoản</h3>
                      <p className="text-sm font-medium text-blue-700/70">Vui lòng chuyển đúng số tiền và nội dung để hệ thống tự động xác nhận trong 1-3 phút.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-5 rounded-2xl bg-white border border-blue-100 flex justify-between items-center group cursor-pointer hover:border-blue-400 transition-all">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Ngân hàng & Số tài khoản</p>
                          <p className="font-black text-gray-900">MBBANK - 0383227692</p>
                        </div>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-blue-600">
                          <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-1 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                        </Button>
                      </div>
                      <div className="p-5 rounded-2xl bg-white border border-blue-100 flex justify-between items-center group cursor-pointer hover:border-blue-400 transition-all">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Nội dung chuyển khoản</p>
                          <p className="font-black text-blue-600 text-lg uppercase">{order.order_code}</p>
                        </div>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-blue-600">
                          <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-1 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                        </Button>
                      </div>
                    </div>

                    {/* DEMO BUTTON */}
                    <div className="pt-4">
                      <Button
                        onClick={handleSimulateSuccess}
                        className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-200 transition-all active:scale-[0.98]"
                      >
                        GIẢ LẬP THANH TOÁN THÀNH CÔNG
                      </Button>
                      <p className="text-center mt-3 text-[9px] font-black text-blue-400 uppercase">Dành cho mục đích đồ án và kiểm thử</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {order.status === 'confirmed' && (
              <Card className="p-12 rounded-[2.5rem] bg-emerald-500 text-white text-center space-y-6 shadow-2xl shadow-emerald-200">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">Thanh toán hoàn tất!</h3>
                  <p className="text-emerald-100 font-medium">Hệ thống đã xác nhận giao dịch của bạn. Chúc bạn có một hành trình tuyệt vời!</p>
                </div>
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <Button onClick={() => navigate('/my-orders')} className="bg-white text-emerald-600 hover:bg-emerald-50 rounded-2xl h-12 px-8 font-black">QUẢN LÝ ĐƠN HÀNG</Button>
                  <Button variant="outline" onClick={() => window.print()} className="border-white/30 text-white hover:bg-white/10 rounded-2xl h-12 px-8 font-black">IN VÉ / HÓA ĐƠN</Button>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-8 rounded-[2rem] border-none shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="font-black text-gray-900 uppercase tracking-tight">Hỗ trợ khách hàng</h4>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-500 font-medium leading-relaxed">Nếu bạn gặp bất kỳ vấn đề nào trong quá trình thanh toán, vui lòng liên hệ hotline để được hỗ trợ tức thì.</p>
                <a href="tel:19001234" className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-orange-50 transition-all border border-transparent hover:border-orange-100">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-orange-500">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Hotline 24/7</p>
                    <p className="font-black text-gray-900">1900 1234</p>
                  </div>
                </a>
              </div>

              <div className="pt-4 border-t border-gray-50 space-y-3">
                {order.status === 'pending' && (
                  <Button
                    variant="ghost"
                    onClick={handleCancelOrder}
                    className="w-full text-red-400 hover:text-red-500 hover:bg-red-50 font-black text-[10px] uppercase tracking-widest h-12"
                  >
                    Hủy đơn hàng này
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowRefundForm(!showRefundForm)}
                  className="w-full border-gray-100 font-black text-[10px] uppercase tracking-widest h-12 rounded-xl"
                >
                  Yêu cầu hoàn tiền
                </Button>
              </div>
            </Card>

            {showRefundForm && (
              <Card className="p-8 rounded-[2rem] border-none shadow-sm space-y-6 animate-in slide-in-from-right-10 duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                    <CreditCard size={20} />
                  </div>
                  <h4 className="font-black text-gray-900 uppercase tracking-tight">Yêu cầu hoàn tiền</h4>
                </div>
                <form onSubmit={handleRequestRefund} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Số tiền (VNĐ)</label>
                    <Input
                      type="number"
                      value={refundData.amount}
                      className="h-12 bg-gray-50 border-none rounded-xl font-bold"
                      onChange={(e) => setRefundData({ ...refundData, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Lý do hoàn tiền</label>
                    <textarea
                      value={refundData.reason}
                      className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold text-sm"
                      rows={4}
                      onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                      placeholder="Vui lòng cung cấp lý do chi tiết..."
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 bg-gray-900 text-white font-black rounded-xl">GỬI YÊU CẦU</Button>
                </form>
              </Card>
            )}

            {/* Sidebar Promo */}
            <div className="rounded-[2.5rem] overflow-hidden relative h-64 group shadow-xl bg-gradient-to-br from-indigo-600 to-blue-700 border-none">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
              <div className="relative z-10 p-8 h-full flex flex-col justify-between text-white">
                <div>
                  <Badge className="bg-white/20 text-white border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 mb-3">Chương trình đối tác</Badge>
                  <h3 className="text-xl font-black leading-tight uppercase tracking-tighter">Mời bạn bè <br /> Nhận quà khủng</h3>
                </div>
                <p className="text-[10px] font-medium opacity-70">Nhận ngay voucher 200k cho mỗi người bạn đặt chỗ thành công.</p>
                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-black text-[10px] uppercase tracking-widest h-10">LẤY MÃ GIỚI THIỆU</Button>
              </div>
            </div>

            {/* Travel Tips Widget */}
            <Card className="p-8 rounded-[2rem] border-none shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <Info size={18} />
                </div>
                <h4 className="font-black text-gray-900 uppercase tracking-tight">Kinh nghiệm du lịch</h4>
              </div>
              <ul className="space-y-4">
                {[
                  "Nên đến sớm 30 phút trước giờ khởi hành.",
                  "Mang theo CCCD/Hộ chiếu bản gốc để check-in.",
                  "Lưu vé điện tử vào điện thoại để dùng offline."
                ].map((tip, i) => (
                  <li key={i} className="flex gap-3 text-xs font-medium text-gray-500">
                    <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        {/* Recommended experiences - TO FILL BOTTOM SPACE */}
        <div className="mt-24 space-y-12">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <Sparkles className="text-blue-600" /> CÓ THỂ BẠN SẼ THÍCH
              </h3>
              <p className="text-gray-400 font-medium">Gợi ý những trải nghiệm tuyệt vời khác tại {order.details.city_name || 'khu vực này'}</p>
            </div>
            <Button variant="ghost" className="text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-50">Xem thêm</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { title: "Tour Bà Nà Hills 1 Ngày", price: "1,250,000", img: "https://images.unsplash.com/photo-1559592413-7ece35b49c2d?w=400" },
              { title: "Vé Ký Ức Hội An", price: "600,000", img: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400" },
              { title: "Show diễn Tinh Hoa Việt Nam", price: "300,000", img: "https://images.unsplash.com/photo-1509030450996-939a2c47605e?w=400" },
              { title: "Vé Sun World Fansipan Legend", price: "850,000", img: "https://images.unsplash.com/photo-1589394815804-964ed7be2eb5?w=400" }
            ].map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
                  <img src={item.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.title} />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 backdrop-blur text-blue-600 border-none font-black text-[8px] uppercase px-2 py-0.5">Phổ biến</Badge>
                  </div>
                </div>
                <h4 className="font-black text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{item.title}</h4>
                <p className="text-blue-600 font-black text-sm">{item.price}đ</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

  );
}
