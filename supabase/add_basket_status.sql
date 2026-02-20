-- Migration: Add status field to baskets table
-- Run this in the Supabase SQL Editor

ALTER TABLE baskets
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'abandoned', 'transferred')),
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Backfill any existing rows (already covered by DEFAULT, but explicit is safer)
UPDATE baskets SET status = 'active' WHERE status IS NULL;

-- Index for filtering active baskets
CREATE INDEX IF NOT EXISTS idx_baskets_status ON baskets(store_id, status);
