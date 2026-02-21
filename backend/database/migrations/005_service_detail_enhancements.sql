-- Service Detail Enhancements Migration
-- Adds description, status to bookable_items
-- Adds max_slots to tours
-- Adds Unique constraint to vehicle(id_item)

ALTER TABLE bookable_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE bookable_items ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

ALTER TABLE tours ADD COLUMN IF NOT EXISTS max_slots INTEGER DEFAULT 0;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_id_item_unique') THEN
        ALTER TABLE vehicle ADD CONSTRAINT vehicle_id_item_unique UNIQUE (id_item);
    END IF;
END $$;
