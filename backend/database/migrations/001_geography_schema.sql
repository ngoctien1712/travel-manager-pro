-- Migration: Geography schema updates (countries name, cities coords, area status, POI poi_type JSONB)
-- Run after schema.sql on existing databases.

-- Countries: add name and optional name_vi
ALTER TABLE countries ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE countries ADD COLUMN IF NOT EXISTS name_vi VARCHAR(255);

-- Cities: optional name_vi and coordinates for crawl/UX
ALTER TABLE cities ADD COLUMN IF NOT EXISTS name_vi VARCHAR(255);
ALTER TABLE cities ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);
ALTER TABLE cities ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

-- Area: optional status for "active" areas shown to area owners
ALTER TABLE area ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Point of interest: change poi_type from VARCHAR to JSONB (preserve existing as category key if any)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'point_of_interest' AND column_name = 'poi_type' AND data_type = 'character varying'
  ) THEN
    ALTER TABLE point_of_interest ADD COLUMN IF NOT EXISTS poi_type_new JSONB;
    UPDATE point_of_interest SET poi_type_new = jsonb_build_object('poi_category', COALESCE(poi_type, 'attraction')) WHERE poi_type IS NOT NULL;
    UPDATE point_of_interest SET poi_type_new = '{}'::jsonb WHERE poi_type_new IS NULL;
    ALTER TABLE point_of_interest DROP COLUMN poi_type;
    ALTER TABLE point_of_interest RENAME COLUMN poi_type_new TO poi_type;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'point_of_interest' AND column_name = 'poi_type'
  ) THEN
    ALTER TABLE point_of_interest ADD COLUMN poi_type JSONB;
  END IF;
END $$;

-- Index for area status (owner listing)
CREATE INDEX IF NOT EXISTS idx_area_status ON area(status);
CREATE INDEX IF NOT EXISTS idx_area_city ON area(id_city);
CREATE INDEX IF NOT EXISTS idx_poi_area ON point_of_interest(id_area);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(id_country);
