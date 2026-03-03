-- Migration: Voucher Enhancements
-- Date: 2024-03-03
-- Mô tả: Thêm các cột phục vụ tính năng voucher theo giá, theo số lượng và theo thời gian.

-- 1. Thêm các cột thông tin cơ bản
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Thêm các cột phân loại và định mức
-- voucher_type: 'quantity' (số lượng), 'price' (giá trị đơn), 'time' (thời gian)
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS voucher_type VARCHAR(20) DEFAULT 'price'; 

-- discount_type: 'percentage' (%) hoặc 'fixed_amount' (số tiền mặt)
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'percentage'; 
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS discount_value DECIMAL(15, 2);

-- Điều kiện áp dụng
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS min_order_value DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 0;
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS max_discount_amount DECIMAL(15, 2);

-- 3. Quản lý chủ sở hữu và trạng thái
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS id_provider UUID REFERENCES provider(id_provider);
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'; -- 'active', 'inactive', 'expired'
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS quality INTEGER;
ALTER TABLE voucher ADD COLUMN IF NOT EXISTS quantity_pay INTEGER DEFAULT 0;

-- 4. Đồng bộ dữ liệu cũ (nếu có)
-- Chuyển 'sale' cũ sang 'discount_value' mới
UPDATE voucher SET discount_value = sale WHERE discount_value IS NULL AND sale IS NOT NULL;
-- Chuyển 'total_price' cũ (ngưỡng áp dụng cũ) sang 'min_order_value'
UPDATE voucher SET min_order_value = total_price WHERE min_order_value = 0 AND total_price > 0;
-- Đồng bộ quality và quantity
UPDATE voucher SET quality = quantity WHERE quality IS NULL AND quantity IS NOT NULL;
UPDATE voucher SET quantity = quality WHERE quantity IS NULL AND quality IS NOT NULL;

-- 5. Ràng buộc và Index
-- Đảm bảo mã voucher là duy nhất
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voucher_code_key') THEN
        ALTER TABLE voucher ADD CONSTRAINT voucher_code_key UNIQUE (code);
    END IF;
END $$;

-- Tăng tốc độ tìm kiếm
CREATE INDEX IF NOT EXISTS idx_voucher_code ON voucher(code);
CREATE INDEX IF NOT EXISTS idx_voucher_provider ON voucher(id_provider);
CREATE INDEX IF NOT EXISTS idx_voucher_type ON voucher(voucher_type);
CREATE INDEX IF NOT EXISTS idx_voucher_status ON voucher(status);

-- 6. Cập nhật bảng Order để lưu thông tin voucher
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS id_voucher UUID REFERENCES voucher(id_voucher);
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- 7. Đảm bảo bảng voucher_detail tồn tại (theo ERD)
CREATE TABLE IF NOT EXISTS voucher_detail (
    id_voucher UUID REFERENCES voucher(id_voucher),
    id_order UUID REFERENCES "order"(id_order),
    PRIMARY KEY (id_voucher, id_order)
);

 
