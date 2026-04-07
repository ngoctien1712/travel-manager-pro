-- Migration: Enhanced Refund System
-- Date: 2026-04-07

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
