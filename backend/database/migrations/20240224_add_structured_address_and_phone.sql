-- Migration to add structured address and phone information
-- Run this in pgAdmin4 Query Tool

-- Global star rating for all items
ALTER TABLE bookable_items
ADD COLUMN IF NOT EXISTS star_rating DECIMAL(2, 1) DEFAULT 0.0;

-- Added Wards table
CREATE TABLE IF NOT EXISTS wards (
  id_ward UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_area UUID NOT NULL REFERENCES area(id_area) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  attribute JSONB
);

CREATE INDEX IF NOT EXISTS idx_wards_area ON wards(id_area);

-- Accommodations enhancements
ALTER TABLE accommodations 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS province_id UUID,
ADD COLUMN IF NOT EXISTS district_id UUID,
ADD COLUMN IF NOT EXISTS ward_id UUID,
ADD COLUMN IF NOT EXISTS specific_address TEXT;

-- Vehicle enhancements
ALTER TABLE vehicle
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS departure_province_id UUID,
ADD COLUMN IF NOT EXISTS departure_district_id UUID,
ADD COLUMN IF NOT EXISTS departure_ward_id UUID,
ADD COLUMN IF NOT EXISTS arrival_province_id UUID,
ADD COLUMN IF NOT EXISTS arrival_district_id UUID,
ADD COLUMN IF NOT EXISTS arrival_ward_id UUID;
