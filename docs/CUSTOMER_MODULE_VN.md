# Tài liệu Phát triển Mô-đun Khách hàng - Travel Manager Pro

Tài liệu này hướng dẫn chi tiết các tính năng mới được triển khai cho giao diện khách hàng, tập trung vào trải nghiệm người dùng, khả năng tìm kiếm chính xác và tối ưu hiệu suất.

## 1. Hệ thống Phân loại và Xếp hạng Trang chủ

### Mục tiêu
- Hiển thị dịch vụ theo danh mục để người dùng dễ dàng theo dõi.
- Ưu tiên các dịch vụ có chất lượng cao (dựa trên `star_rating`).

### Chi tiết triển khai
- **Backend:** Hàm `getHomeData` trong `customer.controller.ts` được nâng cấp để fetch top 10 dịch vụ cho từng loại (`tour`, `accommodation`, `vehicle`, `ticket`) dựa trên cột `star_rating`.
- **Frontend:** `Home.tsx` được thiết kế lại với 4 phần riêng biệt. Mỗi phần có tiêu đề, icon đặc trưng và nút "Xem tất cả" điều hướng đến trang chuyên biệt.
- **Dữ liệu:** Sử dụng `mapBackendServiceToService` để đồng nhất cấu trúc dữ liệu từ API cho các component hiển thị.

---

## 2. Tìm kiếm Khách sạn Theo Phân cấp Địa lý

### Mục tiêu
- Cung cấp giao diện tìm kiếm "Guided Search" (Tìm kiếm có hướng dẫn).
- Cho phép lọc chính xác đến cấp Phường/Xã.

### Chi tiết triển khai
- **Hệ thống Dropdown:** Sử dụng 3 cấp chọn lọc (Tỉnh/Thành -> Quận/Huyện -> Phường/Xã). Dữ liệu được fetch động thông qua `geographyApi`.
- **Logic Ràng buộc:** 
  - Chọn Tỉnh mới hiện Quận.
  - Chọn Quận mới hiện Phường.
  - Reset các cấp dưới khi cấp trên thay đổi.
- **API:** Endpoint `/customer/services` hỗ trợ các tham số `provinceId`, `districtId`, `wardId`.

---

## 3. Tìm kiếm và Đặt vé Xe khách

### Mục tiêu
- Tìm kiếm tuyến đường dựa trên điểm đi và điểm đến (Tỉnh).
- Hỗ trợ đổi chiều nhanh (Swap) và các tính năng đặc thù như khứ hồi.

### Chi tiết triển khai
- **Tìm kiếm Tuyến:** Thay vì nhập liệu văn bản tự do, người dùng chọn Tỉnh đi và Tỉnh đến từ danh sách chính thức để đảm bảo độ chính xác của dữ liệu.
- **Tính năng Swap:** Nút `Repeat` icon cho phép hoán đổi nhanh `From` và `To`.
- **Phòng chống Double-booking:** (Logic Backend) Hệ thống kiểm tra tính khả dụng của ghế dựa trên `id_trip` và trạng thái đặt chỗ trong bảng `order_items` trước khi cho phép thêm vào giỏ hàng.

---

## 4. Cơ sở Dữ liệu và Migrations

Các thay đổi chính trong schema:
- `bookable_items`: Thêm `star_rating` (FLOAT) để xếp hạng dịch vụ chung.
- `accommodations`: Thêm `phone_number`, `province_id`, `district_id`, `ward_id`, `specific_address`.
- `vehicle`: Thêm thông tin địa chỉ phân cấp cho cả điểm đi (`departure_*`) và điểm đến (`arrival_*`).
- `wards`: Bảng mới lưu trữ thông tin xã/phường liên kết với `area` (quận/huyện).

---

## 5. Hướng dẫn Tích hợp Tiếp theo

- **See More Navigation:** Các link "Xem tất cả" đã được trỏ đến các route tương ứng (`/hotels`, `/activities`, `/bus-shuttle`).
- **Giỏ hàng:** Cần tích hợp thêm logic kiểm tra trùng lịch (overlap) cho các dịch vụ xe khách khi người dùng thực hiện thanh toán.
- **Hình ảnh:** Luôn sử dụng helper `getImageUrl` để xử lý đường dẫn ảnh từ backend (hỗ trợ cả URL tuyệt đối và tương đối).

*Ngày cập nhật: 24/02/2026*
