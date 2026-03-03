-- Add Chat Rooms tracking to SQL for metadata, listing and easy indexing
-- This complements the Firebase Realtime Database storage (Shopee-style)

CREATE TABLE IF NOT EXISTS chat_rooms (
    id_room VARCHAR(255) PRIMARY KEY, -- Same as Firebase conversationId
    id_customer UUID NOT NULL REFERENCES users(id_user),
    id_provider UUID NOT NULL REFERENCES provider(id_provider),
    id_item UUID REFERENCES bookable_items(id_item),
    item_name VARCHAR(255),
    customer_name VARCHAR(255),
    last_message TEXT,
    last_sender_id UUID,
    status VARCHAR(50) DEFAULT 'active',
    is_active_for_customer BOOLEAN DEFAULT TRUE,
    is_active_for_provider BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- In case table already exists, add columns
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_active_for_customer BOOLEAN DEFAULT TRUE;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_active_for_provider BOOLEAN DEFAULT TRUE;

-- Indexes for lightning fast lookups in the Provider Dashboard
CREATE INDEX IF NOT EXISTS idx_chat_customer ON chat_rooms(id_customer);
CREATE INDEX IF NOT EXISTS idx_chat_provider ON chat_rooms(id_provider);
CREATE INDEX IF NOT EXISTS idx_chat_item ON chat_rooms(id_item);
