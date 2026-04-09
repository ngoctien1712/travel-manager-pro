-- Script: Dọn dẹp dữ liệu để chuẩn bị bộ Test mới
-- Mục tiêu: Xóa Voucher, Dịch vụ (Tour, Xe, Hotel) và toàn bộ Đơn hàng

BEGIN;

-- 1. Xóa các bảng liên quan đến giao dịch và thanh toán
TRUNCATE TABLE 
    refunds, 
    refund_requests, 
    payments, 
    payroll_transactions,
    voucher_detail,
    order_tour_detail,
    order_accommodations_detail,
    order_pos_vehicle_detail,
    order_ticket_detail,
    "order"
RESTART IDENTITY CASCADE;

-- 2. Xóa các bảng liên quan đến Voucher
TRUNCATE TABLE 
    voucher 
RESTART IDENTITY CASCADE;

-- 3. Xóa các bảng liên quan đến Dịch vụ (Bookable Items)
-- Xóa bảng cha bookable_items sẽ tự động xử lý các bảng con nhờ CASCADE
TRUNCATE TABLE 
    item_media,
    item_tag,
    tours,
    tickets,
    accommodations_rooms,
    accommodations,
    positions,
    vehicle_trips,
    vehicle,
    bookable_items
RESTART IDENTITY CASCADE;

-- 4. Xóa dữ liệu tiện ích (Chat & Thông báo) - Optional nhưng nên làm sạch để đồng bộ
TRUNCATE TABLE 
    chat_rooms,
    notifications
RESTART IDENTITY CASCADE;

COMMIT;

-- Thông báo: Dữ liệu đã được làm sạch thành công.
-- Bạn có thể bắt đầu nạp bộ dữ liệu Tour, Xe, Khách sạn mới.
