-- ============================================================
-- RoleSync AI — Supabase Database Updates
-- ============================================================
-- Run this script in your Supabase SQL Editor to add support
-- for the Links feature in the Document Vault.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. LINKS TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  url           TEXT NOT NULL,
  description   TEXT,
  uploaded_by   UUID REFERENCES staff(id) ON DELETE SET NULL,
  target_scope  TEXT NOT NULL DEFAULT 'all'
                CHECK (target_scope IN ('all', 'specific')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by uploader
CREATE INDEX IF NOT EXISTS idx_links_uploaded_by ON links(uploaded_by);

-- ────────────────────────────────────────────────────────────
-- 2. LINK TARGETS TABLE (For specific staff visibility)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS link_targets (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id   UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  staff_id  UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  UNIQUE (link_id, staff_id)
);

CREATE INDEX IF NOT EXISTS idx_link_targets_link ON link_targets(link_id);
CREATE INDEX IF NOT EXISTS idx_link_targets_staff ON link_targets(staff_id);

-- ────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_targets ENABLE ROW LEVEL SECURITY;

-- Links: full access for simplicity in this MVP (can tighten later)
CREATE POLICY "links_select_all"  ON links FOR SELECT USING (true);
CREATE POLICY "links_insert_any"  ON links FOR INSERT WITH CHECK (true);
CREATE POLICY "links_delete_any"  ON links FOR DELETE USING (true);

-- Link Targets: full access
CREATE POLICY "link_targets_select_all"  ON link_targets FOR SELECT USING (true);
CREATE POLICY "link_targets_insert_any"  ON link_targets FOR INSERT WITH CHECK (true);
CREATE POLICY "link_targets_delete_any"  ON link_targets FOR DELETE USING (true);

-- ────────────────────────────────────────────────────────────
-- 4. NOTIFICATIONS TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  message       TEXT,
  type          TEXT NOT NULL DEFAULT 'info' 
                CHECK (type IN ('info', 'task', 'handover', 'document')),
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own"  ON notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert_any"  ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_own"  ON notifications FOR UPDATE USING (true);
CREATE POLICY "notifications_delete_own"  ON notifications FOR DELETE USING (true);
