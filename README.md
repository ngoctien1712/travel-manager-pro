# 🚀 VietTravel - Giải Pháp Quản Lý Du Lịch Toàn Diện (Travel Management System)

[![React](https://img.shields.io/badge/Frontend-React%2018-blue?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20Express-green?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Cache%2FQueue-Redis%20%26%20BullMQ-red?logo=redis)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript)](https://www.typescriptlang.org/)

---

## 🌟 Tổng Quan Dự Án (Project Overview)

**VietTravel** không chỉ là một trang web đặt tour, mà là một **Hệ sinh thái quản lý du lịch** đa vai trò (Multi-role). Dự án được thiết kế để giải quyết bài toán kết nối giữa **Khách du lịch (Customer)**, **Chủ cơ sở dịch vụ (Area Owner)** và **Quản trị viên (Admin)** một cách mượt mà và an toàn.

Dự án tập trung vào trải nghiệm người dùng hiện đại, hiệu suất cao và khả năng mở rộng với sự kết hợp của AI và Interactive Maps.

---

## ✨ Các Tính Năng Trọng Tâm (Key Features)

### 👤 1. Cho Khách Hàng (Customer)
- **Lập kế hoạch du lịch thông minh (AI Trip Planning):** Tích hợp OpenAI để gợi ý lịch trình cá nhân hóa.
- **Bản đồ tương tác (Interactive Maps):** Tìm kiếm và xem địa điểm qua Leaflet & OpenStreetMap.
- **Đặt dịch vụ (Booking System):** Đặt Tour, Khách sạn, Vé xe với quy trình thanh toán minh bạch.
- **Hệ thống Chat:** Chat trực tiếp với chủ dịch vụ để nhận hỗ trợ thời gian thực.

### 🏨 2. Cho Chủ Cơ Sở (Area Owner)
- **Quản lý dịch vụ:** Đăng tải và cập nhật thông tin tour, phòng khách sạn, vé xe.
- **Dashboard quản lý đơn hàng:** Theo dõi doanh thu, trạng thái đặt chỗ (Pending, Paid, Failed).
- **Hệ thống Voucher:** Tự động điều chỉnh số lượng Voucher khi có đơn hàng mới hoặc hủy đơn.

### 🛡️ 3. Cho Quản Trị Viên (Admin)
- **Quản trị người dùng & Phân quyền (RBAC):** Kiểm soát truy cập dựa trên vai trò (Admin, Owner, Customer).
- **Quản trị địa lý:** Quản lý cơ sở dữ liệu quốc gia, tỉnh thành, khu vực một cách động.
- **Hệ thống giám sát:** Theo dõi sức khỏe hệ thống qua API Health Check.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### **Frontend**
- **Library:** `React 18` + `TypeScript` + `Vite` (Tốc độ build cực nhanh).
- **Styling:** `TailwindCSS` + `shadcn/ui` (Giao diện chuẩn hiện đại).
- **State Management:** `TanStack Query` (Xử lý caching và đồng bộ dữ liệu server).
- **Maps:** `Leaflet` & `React Leaflet`.

### **Backend**
- **Core:** `Node.js` (`Express.js`) viết bằng `TypeScript`.
- **Database:** `PostgreSQL` (Dữ liệu quan hệ chặt chẽ).
- **Queue & Worker:** `BullMQ` + `Redis` (Xử lý các tác vụ nền như kiểm tra trạng thái thanh toán, gửi mail).
- **Auth:** `JWT` (JSON Web Token) kết hợp với `bcryptjs` và xác thực `Google OAuth`.

---

## 📐 Kiến Trúc Hệ Thống (Architecture)

```mermaid
graph TD
    User((Customer/Owner/Admin)) -->|React + Vite| Frontend[Frontend - Client Side]
    Frontend -->|API Requests| Backend[Backend - Node.js/Express]
    Backend -->|Queries| DB[(PostgreSQL)]
    Backend -->|Message Queue| Redis[(Redis + BullMQ)]
    Redis -->|Process Job| Worker[Payment Worker]
    Worker -->|Update Status| DB
    Backend -->|AI Suggestions| OpenAI[OpenAI API]
    Frontend -->|Map Tiles| Leaflet[Leaflet + OSM]
```

---

## 🏗️ Highlights Kỹ Thuật (Technical Highlights)

### **1. Worker & Background Jobs**
Dự án sử dụng **BullMQ (Redis-based)** để xử lý các tác vụ bất đồng bộ.
- **Payment Worker:** Tự động roll-back số lượng Voucher và cập nhật trạng thái đơn hàng khi quá hạn thanh toán (timeout logic).
- **Concurrency:** Xử lý song song nhiều job để đảm bảo hệ thống không bị "nghẽn".

### **2. Database Schema**
Hệ thống được thiết kế với cơ sở dữ liệu quan hệ tối ưu, bao gồm các bảng: `users`, `orders`, `vouchers`, `geography`, `tour`, `accommodation`,... với các liên kết chặt chẽ đảm bảo tính toàn vẹn dữ liệu.

---

## 🚀 Hướng Dẫn Cài Đặt (Getting Started)

### **Yêu cầu (Prerequisites)**
- Node.js 18+
- PostgreSQL 14+
- Redis Server (Đang chạy tại cổng 6379)

### **Các bước thực hiện**

**1. Clone & Cài đặt dependencies**
```bash
git clone https://github.com/ngoctien1712/travel-manager-pro.git
cd travel-manager-pro
npm install
npm run install:all # Script tự động cài cho Frontend & Backend
```

**2. Thiết lập Database & Redis**
- Tạo database `travel_manager` trong PostgreSQL.
- Chạy file schema: `psql -U postgres -d travel_manager -f backend/database/schema.sql`
- Khởi động Redis server: `redis-server`

**3. Cấu hình Biến môi trường (.env)**
Tạo file `.env` tại thư mục `/backend`:
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/travel_manager
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_key_here
```

**4. Khởi chạy ứng dụng**
Tại thư mục gốc:
```bash
npm run dev
```
- **Frontend:** http://localhost:8080
- **Backend:** http://localhost:3000

---

## 🎯 Case Study: Technical Challenge
**Vấn đề:** Làm sao để cập nhật trạng thái đơn hàng và hoàn trả Voucher khi khách hàng không thanh toán đúng hạn mà không làm treo hệ thống chính?
**Giải pháp:** Tôi đã triển khai một **Payment Worker** sử dụng **BullMQ**. Khi một đơn hàng được tạo, một Job sẽ được đưa vào hàng đợi với độ trễ 15-30 phút. Worker sẽ kiểm tra trạng thái trong Redis trước khi truy vấn PostgreSQL, giúp giảm tải Database và đảm bảo độ chính xác tuyệt đối.

---

## 📬 Liên Hệ (Contact)
- **Họ tên:** [Tên của bạn]
- **Email:** [Email của bạn]
- **LinkedIn:** [Link LinkedIn của bạn]
- **Portfolio:** [Link Portfolio nếu có]

---
⭐ *Nếu bạn thấy dự án này thú vị, hãy tặng tôi 1 ngôi sao trên GitHub nhé!*
