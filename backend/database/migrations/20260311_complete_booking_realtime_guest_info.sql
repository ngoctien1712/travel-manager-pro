-- Consolidated Migration: Real-time Booking Updates and Guest Information Persistence
-- Date: 2026-03-11

-- 1. Add guest_info column to all order detail tables to store user-edited contact details
-- Use IF NOT EXISTS for safer execution across different environments
ALTER TABLE order_tour_detail ADD COLUMN IF NOT EXISTS guest_info JSONB;
ALTER TABLE order_ticket_detail ADD COLUMN IF NOT EXISTS guest_info JSONB;
ALTER TABLE order_accommodations_detail ADD COLUMN IF NOT EXISTS guest_info JSONB;
ALTER TABLE order_pos_vehicle_detail ADD COLUMN IF NOT EXISTS guest_info JSONB;

-- 2. Add indexes to improve order retrieval performance for these details
CREATE INDEX IF NOT EXISTS idx_order_tour_id_order ON order_tour_detail(id_order);
CREATE INDEX IF NOT EXISTS idx_order_ticket_id_order ON order_ticket_detail(id_order);
CREATE INDEX IF NOT EXISTS idx_order_acc_id_order ON order_accommodations_detail(id_order);
CREATE INDEX IF NOT EXISTS idx_order_veh_id_order ON order_pos_vehicle_detail(id_order);

-- Note: This migration supports real-time contact info synchronization 
-- from BookingPage to OrderDetail and ensures data persistence after payment.
