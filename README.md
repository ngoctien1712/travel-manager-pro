# VietTravel - Hệ thống quản lý du lịch

Ứng dụng quản lý du lịch với 3 quyền: Admin, Customer, Area Owner.

## Cấu trúc dự án

```
travel-manager-pro/
├── Frontend/        # React + Vite + TypeScript (giao diện người dùng)
├── backend/         # Node.js + Express + PostgreSQL (API)
├── package.json     # Root - scripts để chạy cả frontend & backend
└── README.md
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, shadcn/ui, TailwindCSS, TanStack Query
- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Auth**: JWT, bcrypt

## Yêu cầu

- Node.js 18+
- PostgreSQL 14+
- npm hoặc bun

## Hướng dẫn chạy dự án

### Bước 1: Cài đặt dependencies

```bash
# Từ thư mục gốc travel-manager-pro
npm install

cd Frontend
npm install

cd ../backend
npm install
cd ..
```

### Bước 2: Thiết lập PostgreSQL

1. Đảm bảo PostgreSQL đã cài đặt và chạy trên máy.

2. Tạo database:

```bash
psql -U postgres -c "CREATE DATABASE travel_manager;"
```

3. Chạy schema (tạo bảng):

```bash
psql -U postgres -d travel_manager -f backend/database/schema.sql
```

### Bước 3: Cấu hình Backend

1. Tạo file `backend/.env` (copy từ `backend/.env.example` hoặc tạo mới):

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/travel_manager
JWT_SECRET=travel-manager-jwt-secret-key-2024
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:8080
```

2. Thay `YOUR_PASSWORD` bằng mật khẩu PostgreSQL của bạn.

### Bước 4: Tạo tài khoản admin mặc định (tùy chọn)

```bash
cd backend
npm run db:seed-admin
cd ..
```

Tài khoản: **admin@travel.vn** / **Admin123!**

### Bước 5: Chạy ứng dụng

Từ thư mục gốc `travel-manager-pro`:

```bash
npm run dev
```

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000

Hoặc chạy riêng từng phần:
- Chỉ Frontend: `npm run dev:frontend`
- Chỉ Backend: `npm run dev:backend`

### Lưu ý

- Backend cần chạy để đăng nhập thực tế (email/password). Nếu chỉ chạy Frontend, màn hình đăng nhập sẽ báo lỗi khi gọi API.
- Frontend proxy `/api` sang Backend (localhost:3000) khi chạy dev.

## Module User

### Chức năng đã triển khai

1. **Đăng nhập / Đăng xuất**
   - Đăng nhập bằng email và mật khẩu
   - JWT authentication
   - Đăng xuất xóa token

2. **Quên mật khẩu**
   - Gửi link đặt lại mật khẩu qua email (hoặc trả về link trong môi trường dev)
   - Đặt lại mật khẩu qua token

3. **Xác thực tài khoản**
   - Verify email qua link `/verify-account?token=...`

4. **Đăng ký**
   - Tạo tài khoản mới với vai trò: admin, customer, owner

5. **Quản lý thông tin theo vai trò**
   - **Admin**: department (phòng ban)
   - **Customer**: travel_style (phong cách du lịch)
   - **Area Owner**: business_name (tên doanh nghiệp)

6. **Admin quản lý người dùng**
   - Danh sách người dùng (lọc theo role, status)
   - Tạo / Sửa / Xóa người dùng
   - Cập nhật thông tin profile theo vai trò

### API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/auth/login | Đăng nhập |
| POST | /api/auth/register | Đăng ký |
| POST | /api/auth/forgot-password | Quên mật khẩu |
| POST | /api/auth/reset-password | Đặt lại mật khẩu |
| POST | /api/auth/verify-account | Xác thực tài khoản |
| GET | /api/users/profile | Lấy thông tin profile (auth) |
| PATCH | /api/users/profile | Cập nhật profile (auth) |
| GET | /api/admin/users | Danh sách người dùng (admin) |
| POST | /api/admin/users | Tạo người dùng (admin) |
| PATCH | /api/admin/users/:id | Cập nhật người dùng (admin) |
| DELETE | /api/admin/users/:id | Xóa người dùng (admin) |

## Giao diện

Các giao diện mới (ForgotPassword, ResetPassword, VerifyAccount, Register, Profile, Admin Users) đều tuân theo:
- Form và màu sắc của giao diện hiện có (theme ocean blue)
- Card elevated, gradient-ocean, các component shadcn/ui
