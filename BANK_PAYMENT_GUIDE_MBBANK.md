# Hướng dẫn Tích hợp Webhook Ngân hàng MBBank (Sepay/Casso)

Hệ thống đã được cập nhật để sử dụng tài khoản **MBBank (0383227692 - HUYNH NGOC TIEN)**. Dưới đây là cách để bạn tự động hóa việc xác nhận đơn hàng khi tiền về.

## 1. Cơ chế hoạt động (Webhook Flow)
Vì ngân hàng không cho phép cá nhân gọi API trực tiếp, bạn cần sử dụng **Sepay.vn** (hoặc Casso.vn):
1.  Khách quét mã QR (VietQR) và điền nội dung là mã đơn hàng (VD: `ORD-ABC123`).
2.  Tiền về app MBBank trên điện thoại của bạn.
3.  App Sepay trên điện thoại đọc thông báo biến động số dư.
4.  Sepay gửi dữ liệu chuyển khoản (Webhook) về Server của bạn.
5.  Server đối soát mã đơn hàng và số tiền $\rightarrow$ Tự động chuyển đơn hàng sang **"Đã xác nhận"**.

## 2. Các bước thiết lập trên Sepay (QUAN TRỌNG)

1.  **URL Webhook**: Bạn phải có một đường dẫn công khai. Sử dụng **ngrok** để chạy: `ngrok http 3000`.
2.  Coppy link ngrok (Ví dụ: `https://abcd-123.ngrok-free.app`) và dán vào mục Webhook trên Dashboard Sepay:
    *   **Link**: `https://abcd-123.ngrok-free.app/api/customer/webhook/project`
    *   **Phương thức**: `POST`
    *   **Kiểu dữ liệu**: `JSON`

## 3. Cấu trúc nội dung đơn hàng
Để hệ thống nhận biết được đơn hàng, nội dung chuyển khoản **PHẢI CHỨA** mã đơn hàng của hệ thống.
*   Hệ thống VietQR tôi đã cài đặt sẽ **tự động** điền nội dung này khi khách quét mã.
*   Mã đơn hàng có định dạng: `ORD-XXXXXXXX` (8 ký tự ngẫu nhiên).

## 4. Kiểm tra (Demo không cần tiền thật)
Nếu bạn chưa thiết lập được Sepay nhưng muốn trình diễn tính năng này cho giáo viên:
1.  Vào trang **Chi tiết đơn hàng** trên website.
2.  Kéo xuống dưới cùng sẽ thấy nút: **"Mô phỏng: Server nhận được tiền từ Ngân hàng"**.
3.  Khi nhấn nút này, Frontend sẽ gửi một "giả lập" dữ liệu Webhook y hệt như Sepay gửi tới.
4.  Bạn sẽ thấy trạng thái đơn hàng nhảy từ "Chờ xác nhận" sang "Đã xác nhận" ngay lập tức mà không cần reload trang.

---
**Thông tin cấu hình hiện tại:**
- **Ngân hàng**: MBBank
- **Số tài khoản**: 0383227692
- **Chủ tài khoản**: HUYNH NGOC TIEN
- **Endpoint Webhook**: `/api/customer/webhook/project`
