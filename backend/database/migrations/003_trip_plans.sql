-- Migration 003: Trip plans for customers
-- Assumes uuid-ossp extension exists and base tables users, bookable_items already created

CREATE TABLE IF NOT EXISTS trip_plans (
  id_trip_plan UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_user UUID NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget DECIMAL(15,2),
  plan JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_plans_user ON trip_plans(id_user);

