-- Migration to add Departure & Arrival Info to Vehicles
-- Run this in pgAdmin4 Query Tool

ALTER TABLE vehicle 
ADD COLUMN IF NOT EXISTS departure_time TIME,
ADD COLUMN IF NOT EXISTS departure_point TEXT,
ADD COLUMN IF NOT EXISTS arrival_time TIME,
ADD COLUMN IF NOT EXISTS arrival_point TEXT,
ADD COLUMN IF NOT EXISTS estimated_duration VARCHAR(50);
