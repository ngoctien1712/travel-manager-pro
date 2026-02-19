# Hướng dẫn nạp lại Database (Schema mới)

Tôi đã điều chỉnh lại schema để:
1. **Loại bỏ bảng `area_owners`** và logic đăng ký khu vực phức tạp.
2. **Đơn giản hóa bảng `provider`**: Bây giờ người dùng (Owner) sẽ đăng ký trực tiếp nhà cung cấp gắn với một khu vực (`id_area`) và tài khoản của họ (`id_user`).
3. **Cập nhật Role**: Đổi tên `AREA_OWNER` thành `OWNER`.

## Cách nạp lại dữ liệu sạch 100%

Nếu bạn muốn xóa toàn bộ dữ liệu cũ và nạp lại theo cấu trúc mới, hãy thực hiện các bước sau trong công cụ quản lý DB (pgAdmin, DBeaver, psql):

### Bước 1: Xóa các bảng hiện tại (Reset)
Chạy đoạn code này để xóa sạch các bảng cũ (theo thứ tự tránh lỗi khóa ngoại):

```sql
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS voucher_detail CASCADE;
DROP TABLE IF EXISTS voucher CASCADE;
DROP TABLE IF EXISTS order_accommodations_detail CASCADE;
DROP TABLE IF EXISTS order_pos_vehicle_detail CASCADE;
DROP TABLE IF EXISTS order_tour_detail CASCADE;
DROP TABLE IF EXISTS "order" CASCADE;
DROP TABLE IF EXISTS trip_plans CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS vehicle CASCADE;
DROP TABLE IF EXISTS accommodations_rooms CASCADE;
DROP TABLE IF EXISTS accommodations CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS tours CASCADE;
DROP TABLE IF EXISTS item_tag CASCADE;
DROP TABLE IF EXISTS item_media CASCADE;
DROP TABLE IF EXISTS bookable_items CASCADE;
DROP TABLE IF EXISTS provider CASCADE;
DROP TABLE IF EXISTS area_owners CASCADE; -- Bảng cũ cần xóa
DROP TABLE IF EXISTS area_owner_profile CASCADE; -- Bảng cũ cần xóa
DROP TABLE IF EXISTS admin_profile CASCADE;
DROP TABLE IF EXISTS customer_profiles CASCADE;
DROP TABLE IF EXISTS role_detail CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS point_of_interest CASCADE;
DROP TABLE IF EXISTS area CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
```

### Bước 2: Nạp lại Schema
Mở file `backend/database/schema.sql` và chạy toàn bộ nội dung trong đó.

### Bước 3: Nạp dữ liệu mẫu (Seed)
1. Chạy file `backend/database/seed-admin.sql` để tạo tài khoản admin.
2. (Tùy chọn) Chạy các file seed khác nếu bạn có (ví dụ: geography data).

---

## Lưu ý về Code (Backend)
Vì chúng ta đã thay đổi cấu trúc bảng (bỏ `area_owners`), các API liên quan đến `owner` trong backend cần được điều chỉnh lại để:
- Khi tạo `provider`, không cần check bảng `area_owners` nữa.
- Các câu query JOIN cần bỏ bảng `area_owners`.

Tôi có thể giúp bạn điều chỉnh code Controller nếu bạn cần!
