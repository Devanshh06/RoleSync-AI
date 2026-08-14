-- ============================================================
-- RoleSync AI — Document Vault Tables
-- ============================================================
-- Run this in your Supabase SQL Editor AFTER supabase_setup.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. DOCUMENTS TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  file_url      TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  uploaded_by   UUID REFERENCES staff(id) ON DELETE SET NULL,
  target_scope  TEXT NOT NULL DEFAULT 'all'
                CHECK (target_scope IN ('all', 'specific')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- ────────────────────────────────────────────────────────────
-- 2. DOCUMENT TARGETS (for specific-scope documents)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_targets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  staff_id    UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  UNIQUE(document_id, staff_id)
);

CREATE INDEX IF NOT EXISTS idx_document_targets_doc   ON document_targets(document_id);
CREATE INDEX IF NOT EXISTS idx_document_targets_staff ON document_targets(staff_id);

-- ────────────────────────────────────────────────────────────
-- 3. HANDOVER REQUESTS TABLE (if not already created)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS handover_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id  UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  successor_id    UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'Pending'
                  CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(predecessor_id, successor_id)
);

CREATE INDEX IF NOT EXISTS idx_handover_predecessor ON handover_requests(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_handover_successor   ON handover_requests(successor_id);

-- ────────────────────────────────────────────────────────────
-- 4. RLS POLICIES (drop first to avoid conflicts)
-- ────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_targets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_requests ENABLE ROW LEVEL SECURITY;

-- Documents
DROP POLICY IF EXISTS "documents_select_all"  ON documents;
DROP POLICY IF EXISTS "documents_insert_any"  ON documents;
DROP POLICY IF EXISTS "documents_update_any"  ON documents;
DROP POLICY IF EXISTS "documents_delete_any"  ON documents;

CREATE POLICY "documents_select_all"  ON documents FOR SELECT USING (true);
CREATE POLICY "documents_insert_any"  ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "documents_update_any"  ON documents FOR UPDATE USING (true);
CREATE POLICY "documents_delete_any"  ON documents FOR DELETE USING (true);

-- Document targets
DROP POLICY IF EXISTS "doc_targets_select_all"  ON document_targets;
DROP POLICY IF EXISTS "doc_targets_insert_any"  ON document_targets;
DROP POLICY IF EXISTS "doc_targets_delete_any"  ON document_targets;

CREATE POLICY "doc_targets_select_all"  ON document_targets FOR SELECT USING (true);
CREATE POLICY "doc_targets_insert_any"  ON document_targets FOR INSERT WITH CHECK (true);
CREATE POLICY "doc_targets_delete_any"  ON document_targets FOR DELETE USING (true);

-- Handover requests
DROP POLICY IF EXISTS "handovers_select_all"  ON handover_requests;
DROP POLICY IF EXISTS "handovers_insert_any"  ON handover_requests;
DROP POLICY IF EXISTS "handovers_update_any"  ON handover_requests;
DROP POLICY IF EXISTS "handovers_delete_any"  ON handover_requests;

CREATE POLICY "handovers_select_all"  ON handover_requests FOR SELECT USING (true);
CREATE POLICY "handovers_insert_any"  ON handover_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "handovers_update_any"  ON handover_requests FOR UPDATE USING (true);
CREATE POLICY "handovers_delete_any"  ON handover_requests FOR DELETE USING (true);

-- ============================================================
-- DONE! Also create a Supabase Storage bucket named "vault-documents"
-- Set it to PUBLIC (Dashboard → Storage → New Bucket → toggle Public)
-- ============================================================
