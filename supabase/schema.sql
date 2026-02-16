-- Primark Changing Room Tracker Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stores table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_code VARCHAR(10) UNIQUE NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  member_code VARCHAR(10) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  pin_code VARCHAR(4) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('team_member', 'manager', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Changing room sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  tag_barcode VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'exiting', 'complete', 'flagged')),
  total_items_in INTEGER DEFAULT 0,
  total_items_out INTEGER DEFAULT 0,
  items_purchased INTEGER DEFAULT 0,
  items_restocked INTEGER DEFAULT 0,
  items_lost INTEGER DEFAULT 0,
  entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exit_start_time TIMESTAMP WITH TIME ZONE,
  exit_complete_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session items table
CREATE TABLE session_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  item_barcode VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'in_room' CHECK (status IN ('in_room', 'purchased', 'restocked', 'lost')),
  scanned_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Back of house inventory table
CREATE TABLE back_of_house (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  item_barcode VARCHAR(50) NOT NULL,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'awaiting_return' CHECK (status IN ('awaiting_return', 'returned')),
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  returned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shrinkage log table
CREATE TABLE shrinkage_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  item_barcode VARCHAR(50) NOT NULL,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'lost' CHECK (status IN ('lost', 'recovered')),
  lost_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recovered_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_items_updated_at BEFORE UPDATE ON session_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_back_of_house_updated_at BEFORE UPDATE ON back_of_house
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shrinkage_log_updated_at BEFORE UPDATE ON shrinkage_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
