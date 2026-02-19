-- Fix for role mismatch and missing area_owner_profile table

-- 1. Sync role codes: Rename 'OWNER' to 'AREA_OWNER'
UPDATE roles SET code = 'AREA_OWNER' WHERE code = 'OWNER';

-- Ensure AREA_OWNER exists if it wasn't there
INSERT INTO roles (code) 
SELECT 'AREA_OWNER' 
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'AREA_OWNER')
ON CONFLICT (code) DO NOTHING;

-- 2. Create area_owner_profile table if not exists
CREATE TABLE IF NOT EXISTS area_owner_profile (
  id_user UUID PRIMARY KEY REFERENCES users(id_user) ON DELETE CASCADE,
  business_name VARCHAR(255) DEFAULT ''
);

-- 3. (Optional) Fix existing users who might have been created but lack role/profile
-- This is tricky without knowing which ones were intended to be owners, 
-- but if they have no role_detail and they were created recently, they might be the ones.
-- However, the user said they edited the DB manually, so they might have fixed some.
