-- Migration 002: Customer orders, cart, payments transactions, refunds requests
-- Assumes uuid-ossp extension exists

CREATE TABLE IF NOT EXISTS cart (
  id_cart UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_user UUID NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_item (
  id_cart_item UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_cart UUID NOT NULL REFERENCES cart(id_cart) ON DELETE CASCADE,
  id_item UUID NOT NULL REFERENCES bookable_items(id_item) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(15,2),
  attribute JSONB,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id_history UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_order UUID NOT NULL REFERENCES "order"(id_order) ON DELETE CASCADE,
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id_tx UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_order UUID REFERENCES "order"(id_order),
  id_pay UUID REFERENCES payments(id_pay),
  provider_tx_id VARCHAR(255),
  status VARCHAR(50),
  method VARCHAR(50),
  amount DECIMAL(15,2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refund_requests (
  id_request UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_order UUID NOT NULL REFERENCES "order"(id_order) ON DELETE CASCADE,
  id_user UUID REFERENCES users(id_user),
  amount DECIMAL(15,2),
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  id_refund UUID REFERENCES refunds(id_refund)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(id_user);
CREATE INDEX IF NOT EXISTS idx_cart_item_cart ON cart_item(id_cart);
CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_status_history(id_order);
CREATE INDEX IF NOT EXISTS idx_payment_tx_order ON payment_transactions(id_order);
CREATE INDEX IF NOT EXISTS idx_refund_request_order ON refund_requests(id_order);
