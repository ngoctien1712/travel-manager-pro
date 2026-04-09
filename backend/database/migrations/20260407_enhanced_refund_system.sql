-- Migration: Enhanced Refund System
-- Date: 2026-04-07
-- Description: Adds refund request tracking, constraints, and audit trails.

-- 1. Create or Update refund_requests table
CREATE TABLE IF NOT EXISTS refund_requests (
    id_refund_request UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_order UUID NOT NULL REFERENCES "order"(id_order) ON DELETE CASCADE,
    id_user UUID NOT NULL REFERENCES users(id_user),
    amount DECIMAL(15, 2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    admin_note TEXT,
    id_admin UUID REFERENCES users(id_user),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add id_refund_request to refunds table for traceability
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='refunds' AND column_name='id_refund_request') THEN
        ALTER TABLE refunds ADD COLUMN id_refund_request UUID REFERENCES refund_requests(id_refund_request);
    END IF;
END $$;

-- 3. Add index for performance
CREATE INDEX IF NOT EXISTS idx_refund_requests_order ON refund_requests(id_order);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);

-- 4. Ensure payment_expires_at exists in order table (for booking timeout)
ALTER TABLE "order" 
ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMPTZ;

-- 5. Ensure OTP columns exist in users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;

-- 6. Add paid_at to order table for 24h refund policy check
ALTER TABLE "order"
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- 7. Soft Delete support for bookable_items
-- We use status = 'deleted' to hide items from UI while preserving history for orders/reports.
-- This prevents foreign key constraint errors when deleting products that have been booked.
COMMENT ON COLUMN bookable_items.status IS 'Status of the item: active, inactive, pending, or deleted (soft delete)';

-- 8. Create order_status_history table if missing
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_order UUID NOT NULL REFERENCES "order"(id_order) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    changed_by UUID REFERENCES users(id_user),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

