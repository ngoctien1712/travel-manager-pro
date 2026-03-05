# Hướng dẫn nâng cấp hệ thống xử lý tác vụ ngầm với Redis & BullMQ

Chào bạn, là một Senior Developer, tôi khuyên bạn nên sử dụng **Redis** và **BullMQ** thay cho cơ chế Polling (quét database định kỳ) khi hệ thống bắt đầu có lượng truy cập lớn. Polling tốn tài nguyên CPU và bộ nhớ của cả Backend lẫn Database vì nó phải thực hiện truy vấn liên tục ngay cả khi không có đơn hàng nào cần xử lý.

Dưới đây là lộ trình triển khai chuyên nghiệp:

## 1. Tại sao chọn Redis & BullMQ?
- **Tiết kiệm tài nguyên**: Backend chỉ hoạt động khi Redis thông báo có Task đến hạn.
- **Độ tin cậy**: Nếu server crash, các Task trong Redis vẫn được bảo toàn.
- **Khả năng mở rộng**: Bạn có thể chạy nhiều Worker trên nhiều server khác nhau.
- **Tránh Memory Leak**: BullMQ quản lý bộ nhớ cực tốt, không bị "phình" như các vòng lặp `setInterval`.

## 2. Cài đặt Redis (Phần mềm thứ 3)
Cách tốt nhất và nhanh nhất là sử dụng **Docker**. Điều này giúp máy tính của bạn sạch sẽ, không cần cài đặt trực tiếp vào Windows.

**Bước 1: Tạo file `docker-compose.yml` tại thư mục gốc của dự án:**
```yaml
version: '3.8'
services:
  redis:
    image: redis:alpine
    container_name: travel-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: always

volumes:
  redis_data:
```

**Bước 2: Chạy lệnh sau trong Terminal:**
```powershell
docker-compose up -d
```
*Lúc này Redis sẽ chạy ngầm tại port 6379 mà không chiếm dụng tài nguyên hệ thống khi không dùng đến.*

## 3. Cấu hình Code (Senior Pattern)

Tôi đã chuẩn bị sẵn mã nguồn cho bạn tại [backend/src/queues/order.queue.ts](file:///d:/IT/JS/travel-manager-pro/backend/src/queues/order.queue.ts) (trước đó chúng ta đã gỡ bỏ, bạn có thể tạo lại như sau):

```typescript
import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import pool from '../config/db.js';

// Cấu hình kết nối Redis chuyên nghiệp
const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null, // Bắt buộc cho BullMQ
});

export const orderQueue = new Queue('order-timeout', { connection });

// Worker xử lý logic khi Task đến hạn
export const orderWorker = new Worker('order-timeout', async (job) => {
    const { orderId } = job.data;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            'SELECT status, id_voucher FROM "order" WHERE id_order = $1 FOR UPDATE', 
            [orderId]
        );
        
        if (rows[0]?.status === 'pending') {
            // Chuyển sang failed và hoàn Voucher
            await client.query('UPDATE "order" SET status = \'failed\' WHERE id_order = $1', [orderId]);
            if (rows[0].id_voucher) {
                await client.query(
                    'UPDATE voucher SET quantity = quantity + 1, quantity_pay = quantity_pay - 1 WHERE id_voucher = $1',
                    [rows[0].id_voucher]
                );
            }
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err; // BullMQ sẽ tự động Retry nếu lỗi
    } finally {
        client.release();
    }
}, { connection });
```

## 4. Cách sử dụng trong Controller
Khi khách đặt hàng, thay vì đợi 15 phút để quét, bạn "đặt lịch" ngay lập tức:

```typescript
// Trong CustomerController.createBooking
await orderQueue.add(
    `timeout-${idOrder}`, 
    { orderId: idOrder }, 
    { delay: 15 * 60 * 1000 } // Đúng 15 phút sau Task này sẽ "nổ"
);
```

## 5. Kết luận
Sử dụng công nghệ đúng chỗ (như Redis cho Queue) là dấu hiệu của một Senior. Nó tách biệt logic "Quản lý thời gian" ra khỏi "Quản lý dữ liệu", giúp code của bạn sạch và hiệu quả hơn gấp nhiều lần.

> [!TIP]
> Bạn nên cài thêm công cụ **Redis Insight** để quan sát các Task đang nằm trong hàng đợi một cách trực quan.
