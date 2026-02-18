-- Baskets table for tracking purchased items grouped by session
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS baskets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  basket_number INTEGER NOT NULL,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, basket_number)
);

-- Add basket_id to session_items to track which basket purchased items belong to
ALTER TABLE session_items
ADD COLUMN IF NOT EXISTS basket_id UUID REFERENCES baskets(id) ON DELETE SET NULL;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_baskets_store_id ON baskets(store_id);
CREATE INDEX IF NOT EXISTS idx_baskets_session_id ON baskets(session_id);
CREATE INDEX IF NOT EXISTS idx_session_items_basket_id ON session_items(basket_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_baskets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER baskets_updated_at
  BEFORE UPDATE ON baskets
  FOR EACH ROW
  EXECUTE FUNCTION update_baskets_updated_at();

-- Function to get next basket number for a store
CREATE OR REPLACE FUNCTION get_next_basket_number(p_store_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(basket_number), 0) + 1
  INTO next_number
  FROM baskets
  WHERE store_id = p_store_id;

  RETURN next_number;
END;
$$ LANGUAGE plpgsql;
