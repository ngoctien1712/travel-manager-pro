-- Migration to enhance Hotel/Accommodation information
-- Run this in pgAdmin4 Query Tool

ALTER TABLE accommodations 
ADD COLUMN IF NOT EXISTS hotel_type VARCHAR(100), -- Resort, Villa, Homestay, Hotel...
ADD COLUMN IF NOT EXISTS star_rating DECIMAL(2, 1),
ADD COLUMN IF NOT EXISTS checkin_time TIME DEFAULT '14:00',
ADD COLUMN IF NOT EXISTS checkout_time TIME DEFAULT '12:00',
ADD COLUMN IF NOT EXISTS policies JSONB,
ADD COLUMN IF NOT EXISTS attribute JSONB;
