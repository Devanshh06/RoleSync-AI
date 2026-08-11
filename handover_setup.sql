-- ============================================================
-- RoleSync AI — Handover Setup
-- ============================================================
-- Run this in your Supabase SQL Editor to create the handover tables

CREATE TABLE IF NOT EXISTS handover_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  successor_id   UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(predecessor_id, successor_id)
);

CREATE INDEX IF NOT EXISTS idx_handover_pred ON handover_requests(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_handover_succ ON handover_requests(successor_id);

-- Drop trigger if exists to prevent errors on re-run
DROP TRIGGER IF EXISTS trigger_handover_updated_at ON handover_requests;
CREATE TRIGGER trigger_handover_updated_at
  BEFORE UPDATE ON handover_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE handover_requests ENABLE ROW LEVEL SECURITY;

-- Drop old policies to allow re-runs safely
DROP POLICY IF EXISTS "handover_select" ON handover_requests;
DROP POLICY IF EXISTS "handover_insert" ON handover_requests;
DROP POLICY IF EXISTS "handover_update" ON handover_requests;
DROP POLICY IF EXISTS "handover_delete" ON handover_requests;

-- Policies (Simplified for development: public read/write)
CREATE POLICY "handover_select" ON handover_requests FOR SELECT USING (true);
CREATE POLICY "handover_insert" ON handover_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "handover_update" ON handover_requests FOR UPDATE USING (true);
CREATE POLICY "handover_delete" ON handover_requests FOR DELETE USING (true);
