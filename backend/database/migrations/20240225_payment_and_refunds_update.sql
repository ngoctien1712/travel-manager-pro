-- Migration to standardize orders and remove cart
-- Path: ./backend/database/migrations/20240225_payment_and_refunds_update.sql

-- 1. Remove Cart tables (as requested: "xóa bỏ giỏ hàng")
DROP TABLE IF EXISTS cart_item;
DROP TABLE IF EXISTS cart;

-- 2. Create Order Ticket Detail (missing in original schema)
CREATE TABLE IF NOT EXISTS order_ticket_detail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_order UUID NOT NULL REFERENCES "order"(id_order) ON DELETE CASCADE,
  id_item UUID NOT NULL REFERENCES bookable_items(id_item),
  visit_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(15, 2) NOT NULL,
  guest_info JSONB -- To store names/IDs if needed
);

-- 3. Standardize order_tour_detail
-- Adding specific booking date for tours if they are flexible, or just quantity
ALTER TABLE order_tour_detail ADD COLUMN IF NOT EXISTS guest_info JSONB;
ALTER TABLE order_tour_detail ADD COLUMN IF NOT EXISTS booking_date DATE;

-- 4. Enhance order table for Momo tracking
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(255);

-- 5. Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_ticket_order ON order_ticket_detail(id_order);
CREATE INDEX IF NOT EXISTS idx_order_tour_order ON order_tour_detail(id_order);
CREATE INDEX IF NOT EXISTS idx_order_acc_order ON order_accommodations_detail(id_order);
CREATE INDEX IF NOT EXISTS idx_order_veh_order ON order_pos_vehicle_detail(id_order);
