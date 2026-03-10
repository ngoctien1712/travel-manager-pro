# Hướng dẫn Thiết lập Chức năng Lập kế hoạch Du lịch AI

Tài liệu này hướng dẫn các bước cài đặt thư viện và chuẩn bị cơ sở dữ liệu để chạy tính năng lập kế hoạch du lịch thông minh.

## 1. Yêu cầu API Key
Bạn cần bổ sung các API Key sau vào file `backend/.env`:
- `OPENAI_API_KEY`: Dùng để AI tạo lịch trình.
- `OPENROUTE_SERVICE_KEY`: Dùng để lấy dữ liệu bản đồ và địa điểm (Lấy tại [openrouteservice.org](https://openrouteservice.org/)).

## 2. Cài đặt Thư viện (Dependencies)

### Backend
Mở terminal tại thư mục `backend/` và chạy lệnh:
```bash
npm install bullmq ioredis
```

### Frontend
Mở terminal tại thư mục `Frontend/` và chạy lệnh:
```bash
npm install react-leaflet@4.2.1 leaflet@1.9.4 --save --legacy-peer-deps
npm install --save-dev @types/leaflet
```
*Lưu ý: Không cài `@types/react-leaflet`.*

---

## 3. Cập nhật Cơ sở dữ liệu (SQL)
Chạy các file SQL theo đúng thứ tự dưới đây để chuẩn bị dữ liệu:

1. **Cập nhật Địa lý (Tỉnh/Thành/Phường/Xã)**:
   Chạy file: `backend/database/migrations/20240309_update_geography_v3.sql`

2. **Cấu trúc tọa độ cho POI**:
   Chạy file: `backend/database/migrations/20240310_add_poi_coords.sql`

3. **Dữ liệu mẫu địa danh (Seed Data)**:
   Chạy file: `backend/database/POI_Seed_Data.sql`

---

## 4. Khởi động Chức năng
Sau khi cài đặt xong, bạn có thể chạy ứng dụng:
- **Backend**: `cd backend && npm run dev`
- **Frontend**: `cd Frontend && npm run dev`

*Lưu ý: Đảm bảo Redis Server đã được bật trên máy của bạn trước khi chạy Backend.*
