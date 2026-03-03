# Hướng dẫn Firebase CLI & Cấu hình Chat Realtime (Shopee-style)

Tài liệu này hướng dẫn chi tiết toàn bộ các bước thiết lập Firebase từ đầu đến khi chạy dự án. Hãy thực hiện theo trình tự này:

---

## 1. Cài đặt & Liên kết Dự án (Firebase CLI)

Thực hiện tại thư mục gốc của dự án (`travel-manager-pro`):

1. **Cài đặt CLI**:
   ```bash
   npm install -g firebase-tools
   ```
2. **Đăng nhập**:
   ```bash
   firebase login
   ```
3. **Liên kết thư mục với Project (Bắt buộc)**:
   ```bash
   firebase use --add
   ```
   *Chọn dự án `viettravel-chat` từ danh sách và đặt tên gợi nhớ (alias) bất kỳ.* ( nhập lại tên viettravel-chat)

4. **Triển khai phân quyền (Deploy Rules)**:
   ```bash
   firebase deploy --only database
   ```
   *Lệnh này sẽ đẩy file `database.rules.json` lên Firebase để bảo mật dữ liệu chat.*

---

## 2. Thiết lập Biến môi trường (.env)

Bạn cần lấy thông tin từ [Firebase Console](https://console.firebase.google.com/) dự án `viettravel-chat`.

### Frontend (.env)
Vào **Project Settings > General > Your apps > SDK setup > Chọn "Config"**.

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=viettravel-chat.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://viettravel-chat-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=viettravel-chat
VITE_FIREBASE_STORAGE_BUCKET=viettravel-chat.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Backend (.env)
Vào **Project Settings > Service accounts > Nhấn "Generate new private key"**.

```env
# URL của Realtime Database (Giống ở Frontend)
FIREBASE_DATABASE_URL=https://viettravel-chat-default-rtdb.asia-southeast1.firebasedatabase.app

# Nội dung JSON Service Account (Dán toàn bộ nội dung file .json vừa tải về TRÊN 1 DÒNG duy nhất)
FIREBASE_SERVICE_ACCOUNT='{"type": "service_account", "project_id": "viettravel-chat", ...}'
```

---

## 3. Cập nhật Cơ sở dữ liệu (PostgreSQL)

Hệ thống cần bảng `chat_rooms` để quản lý danh sách chat. Hãy chạy nội dung file SQL này vào Postgres:

👉 `backend/database/migrations/20240304_chat_system_complete.sql`

---

## 4. Cài đặt Thư viện & Chạy dự án (Bước cuối)

Mở 2 cửa sổ Terminal song song:

### Terminal 1 (Backend):
```bash
cd backend
npm install firebase-admin
npm run dev
```

### Terminal 2 (Frontend):
```bash
cd Frontend
npm install firebase
npm run dev
```

---

## 5. Kiểm tra vận hành
1. Đăng nhập vào Web với tài khoản **Khách hàng**.
2. Vào chi tiết một **Tour/Dịch vụ bất kỳ**.
3. Nhấn vào biểu tượng **Chat** ở góc dưới bên phải màn hình.
4. **Kết quả mong đợi**: Bạn sẽ thấy khung chat hiện lên với lời chào tự động: *"Nhà cung cấp dịch vụ [Tên Tour] có thể hỗ trợ gì cho bạn?"*. Giao diện sẽ hiển thị đầy đủ Thứ, Ngày, Giờ Realtime.

---
**Lưu ý**: Nếu bạn thay đổi file `database.rules.json` ở máy tính, hãy luôn nhớ chạy `firebase deploy --only database` để cập nhật lên Cloud.
