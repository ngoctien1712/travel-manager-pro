-- Migration 004: add created_at column to bookable_items to support ordering in customer home data

ALTER TABLE IF EXISTS bookable_items
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

