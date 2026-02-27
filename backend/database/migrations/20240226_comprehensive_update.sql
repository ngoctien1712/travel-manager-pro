-- Migration: Comprehensive Update for Tours, Accommodations, and Vehicles
-- Date: 2026-02-26

-- ============ TOURS UPDATE ============
-- Add tour_type: private, group, daily
ALTER TABLE tours ADD COLUMN tour_type VARCHAR(20) DEFAULT 'group' CHECK (tour_type IN ('private', 'group', 'daily'));
ALTER TABLE tours ALTER COLUMN start_at DROP NOT NULL;
ALTER TABLE tours ALTER COLUMN end_at DROP NOT NULL;

-- ============ ACCOMMODATIONS UPDATE ============
-- Each room has its own images (JSONB array of URLs)
ALTER TABLE accommodations_rooms ADD COLUMN media JSONB DEFAULT '[]'::jsonb;
ALTER TABLE accommodations_rooms ADD COLUMN description TEXT;

-- ============ VEHICLE TRIPS & SEATING ============
-- Separate trips from vehicles to allow multiple departure dates/times
CREATE TABLE vehicle_trips (
  id_trip UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_vehicle UUID NOT NULL REFERENCES vehicle(id_vehicle) ON DELETE CASCADE,
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ,
  price_override DECIMAL(15, 2), -- Allow price variation per trip if needed
  status VARCHAR(20) DEFAULT 'active' -- active, cancelled, completed
);

-- Update order_pos_vehicle_detail to link to a specific trip
-- Step 1: Add id_trip column
ALTER TABLE order_pos_vehicle_detail ADD COLUMN id_trip UUID REFERENCES vehicle_trips(id_trip);

-- Step 2: Remove primary key and create a more flexible one (since users can book multiple seats on the same trip/order)
-- Existing PK: (id_order, id_position)
ALTER TABLE order_pos_vehicle_detail DROP CONSTRAINT order_pos_vehicle_detail_pkey;
ALTER TABLE order_pos_vehicle_detail ADD PRIMARY KEY (id_order, id_position, id_trip);

-- ============ PROVIDER UPDATE ============
-- Add more diverse info for providers
ALTER TABLE provider ADD COLUMN description TEXT;
ALTER TABLE provider ADD COLUMN address TEXT;
ALTER TABLE provider ADD COLUMN email VARCHAR(255);
ALTER TABLE provider ADD COLUMN website VARCHAR(255);
ALTER TABLE provider ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb;

-- ============ ORDER CONSTRAINTS ============
-- To track guest count vs available slots for GROUP tours
-- Add quantity to order_tour_detail (already exists: quantity, price)
-- We need to check availability based on id_item and date (for daily) or fixed slots (for group)

-- ============ BOOKING DATES ============
-- Add booking_date to order_tour_detail for DAILY tours
ALTER TABLE order_tour_detail ADD COLUMN booking_date DATE;

-- ============ SEARCH CONSTRAINTS ============
-- No database changes needed for search, just logic updates in controllers.

-- ============ SAMPLE DATA FOR TRIPS (Optional, for testing) ============
-- TRUNCATE vehicle_trips RESTART IDENTITY CASCADE;
