-- VietTravel - PostgreSQL Schema
-- Based on ERD for Travel Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ GEOGRAPHY ============
CREATE TABLE countries (
  id_country UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(255),
  name_vi VARCHAR(255)
);

CREATE TABLE cities (
  id_city UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_country UUID NOT NULL REFERENCES countries(id_country),
  name VARCHAR(255) NOT NULL,
  name_vi VARCHAR(255),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7)
);

CREATE TABLE area (
  id_area UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_city UUID NOT NULL REFERENCES cities(id_city),
  name VARCHAR(255) NOT NULL,
  attribute JSONB,
  status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE point_of_interest (
  id_poi UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_area UUID NOT NULL REFERENCES area(id_area),
  name VARCHAR(255) NOT NULL,
  poi_type JSONB
);

CREATE INDEX idx_area_status ON area(status);
CREATE INDEX idx_area_city ON area(id_city);
CREATE INDEX idx_poi_area ON point_of_interest(id_area);
CREATE INDEX idx_cities_country ON cities(id_country);

-- ============ USERS & ROLES ============
CREATE TABLE users (
  id_user UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  full_name VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, inactive, banned
  email_verified_at TIMESTAMPTZ,
  verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
  id_role UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE -- ADMIN, CUSTOMER, AREA_OWNER
);

CREATE TABLE role_detail (
  id_role UUID NOT NULL REFERENCES roles(id_role) ON DELETE CASCADE,
  id_user UUID NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
  PRIMARY KEY (id_role, id_user)
);

CREATE TABLE customer_profiles (
  id_user UUID PRIMARY KEY REFERENCES users(id_user) ON DELETE CASCADE,
  date DATE,
  travel_style VARCHAR(255)
);

CREATE TABLE admin_profile (
  id_user UUID PRIMARY KEY REFERENCES users(id_user) ON DELETE CASCADE,
  department VARCHAR(255)
);

CREATE TABLE provider (
  id_provider UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_user UUID NOT NULL REFERENCES users(id_user),
  id_area UUID NOT NULL REFERENCES area(id_area),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  image TEXT,
  status VARCHAR(20) DEFAULT 'pending' -- pending, active, inactive
);

-- ============ BOOKABLE ITEMS ============
CREATE TABLE bookable_items (
  id_item UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_provider UUID REFERENCES provider(id_provider),
  id_area UUID REFERENCES area(id_area),
  item_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  attribute JSONB,
  price DECIMAL(15, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE item_media (
  id_media UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50),
  url TEXT NOT NULL,
  id_item UUID NOT NULL REFERENCES bookable_items(id_item) ON DELETE CASCADE
);

CREATE TABLE item_tag (
  tag VARCHAR(100) NOT NULL,
  id_item UUID NOT NULL REFERENCES bookable_items(id_item) ON DELETE CASCADE,
  PRIMARY KEY (tag, id_item)
);

-- ============ SPECIFIC ITEM TYPES ============
CREATE TABLE tours (
  id_item UUID PRIMARY KEY REFERENCES bookable_items(id_item) ON DELETE CASCADE,
  guide_language VARCHAR(50),
  attribute JSONB,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  price DECIMAL(15, 2)
);

CREATE TABLE tickets (
  ticket_kind VARCHAR(100) NOT NULL,
  id_item UUID PRIMARY KEY REFERENCES bookable_items(id_item) ON DELETE CASCADE
);

CREATE TABLE accommodations (
  address TEXT,
  id_item UUID PRIMARY KEY REFERENCES bookable_items(id_item) ON DELETE CASCADE
);

CREATE TABLE accommodations_rooms (
  id_room UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_item UUID NOT NULL REFERENCES accommodations(id_item) ON DELETE CASCADE,
  name_room VARCHAR(255),
  max_guest INTEGER,
  attribute JSONB,
  price DECIMAL(15, 2)
);

CREATE TABLE vehicle (
  id_vehicle UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_item UUID NOT NULL REFERENCES bookable_items(id_item) ON DELETE CASCADE,
  code_vehicle VARCHAR(100),
  max_guest INTEGER,
  attribute JSONB
);

CREATE TABLE positions (
  id_position UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_position VARCHAR(100),
  price DECIMAL(15, 2),
  id_vehicle UUID NOT NULL REFERENCES vehicle(id_vehicle) ON DELETE CASCADE
);

CREATE TABLE trip_plans (
  id_trip_plan UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_user UUID REFERENCES users(id_user),
  destination TEXT,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15, 2),
  plan JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ORDERS ============
CREATE TABLE "order" (
  id_order UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(50),
  order_code VARCHAR(100) UNIQUE,
  total_amount DECIMAL(15, 2),
  currency VARCHAR(10) DEFAULT 'VND',
  create_at TIMESTAMPTZ DEFAULT NOW(),
  order_type VARCHAR(50),
  id_user UUID REFERENCES users(id_user)
);

CREATE TABLE order_tour_detail (
  id_item UUID NOT NULL REFERENCES bookable_items(id_item),
  id_order UUID NOT NULL REFERENCES "order"(id_order),
  quantity INTEGER,
  price DECIMAL(15, 2),
  PRIMARY KEY (id_item, id_order)
);

CREATE TABLE order_pos_vehicle_detail (
  id_order UUID NOT NULL REFERENCES "order"(id_order),
  id_position UUID NOT NULL REFERENCES positions(id_position),
  "from" TIMESTAMPTZ,
  "to" TIMESTAMPTZ,
  price DECIMAL(15, 2),
  PRIMARY KEY (id_order, id_position)
);

CREATE TABLE order_accommodations_detail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_order UUID NOT NULL REFERENCES "order"(id_order),
  id_room UUID NOT NULL REFERENCES accommodations_rooms(id_room),
  start_date DATE,
  end_date DATE,
  quantity INTEGER,
  price DECIMAL(15, 2)
);

-- ============ VOUCHERS ============
CREATE TABLE voucher (
  id_voucher UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_item UUID REFERENCES bookable_items(id_item),
  quantity INTEGER,
  total_price DECIMAL(15, 2),
  quantity_pay INTEGER,
  "from" TIMESTAMPTZ,
  "to" TIMESTAMPTZ,
  sale DECIMAL(5, 2)
);

CREATE TABLE voucher_detail (
  id_voucher UUID NOT NULL REFERENCES voucher(id_voucher),
  id_order UUID NOT NULL REFERENCES "order"(id_order),
  PRIMARY KEY (id_voucher, id_order)
);

-- ============ PAYMENTS ============
CREATE TABLE payments (
  id_pay UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_order UUID REFERENCES "order"(id_order),
  status VARCHAR(50),
  amount DECIMAL(15, 2),
  paid_at TIMESTAMPTZ,
  method VARCHAR(50)
);

CREATE TABLE refunds (
  id_refund UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(15, 2),
  status VARCHAR(50),
  reason_code VARCHAR(50),
  create_at TIMESTAMPTZ DEFAULT NOW(),
  id_pay UUID REFERENCES payments(id_pay)
);

-- ============ INDEXES ============
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_role_detail_user ON role_detail(id_user);
CREATE INDEX idx_order_user ON "order"(id_user);
CREATE INDEX idx_order_status ON "order"(status);
CREATE INDEX idx_bookable_items_provider ON bookable_items(id_provider);
CREATE INDEX idx_bookable_items_type ON bookable_items(item_type);

-- ============ SEED ROLES ============
INSERT INTO roles (code) VALUES ('ADMIN'), ('CUSTOMER'), ('OWNER')
ON CONFLICT (code) DO NOTHING;
