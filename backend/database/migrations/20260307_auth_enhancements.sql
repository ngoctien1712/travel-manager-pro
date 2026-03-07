-- Migration: Authentication Enhancements (OAuth2 & Refresh Tokens)
-- Date: 2026-03-07

-- 1. Add OAuth2 support to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';

-- 2. Create Refresh Tokens table
CREATE TABLE IF NOT EXISTS user_refresh_tokens (
    id_token UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_user UUID NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON user_refresh_tokens(id_user);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON user_refresh_tokens(token);

-- 3. Ensure AREA_OWNER role exists (should be there based on schema.sql)
INSERT INTO roles (code) VALUES ('AREA_OWNER') ON CONFLICT (code) DO NOTHING;

-- 4. If area_owner_profile is needed and missing (based on auth.controller.ts)
CREATE TABLE IF NOT EXISTS area_owner_profile (
    id_user UUID PRIMARY KEY REFERENCES users(id_user) ON DELETE CASCADE,
    business_name VARCHAR(255),
    identity_card VARCHAR(50),
    business_license TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
