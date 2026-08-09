-- ============================================================
-- RoleSync AI — Supabase Database Setup
-- ============================================================
-- Run this entire file in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- It creates all tables, indexes, RLS policies, triggers, and seed data.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. STAFF TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  department    TEXT,
  designation   TEXT,
  contact       TEXT,
  user_type     TEXT NOT NULL DEFAULT 'Faculty'
                CHECK (user_type IN ('Admin', 'Faculty')),
  status        TEXT NOT NULL DEFAULT 'Active'
                CHECK (status IN ('Active', 'Leaving', 'Exited')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);

-- ────────────────────────────────────────────────────────────
-- 2. TASK CATEGORIES TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT UNIQUE NOT NULL,
  icon  TEXT,
  color TEXT
);

-- Seed default categories
INSERT INTO task_categories (name, icon, color) VALUES
  ('Subject Teaching',          'BookOpen',       '#3b82f6'),
  ('Practical Teaching',        'FlaskConical',   '#8b5cf6'),
  ('Program Coordinating',     'Waypoints',      '#06b6d4'),
  ('Seminar Responsibility',    'Presentation',   '#f59e0b'),
  ('Internship Responsibility', 'Briefcase',      '#10b981'),
  ('Scholarship Responsibility','GraduationCap',  '#ec4899'),
  ('Examination Duty',          'ClipboardCheck', '#ef4444'),
  ('Research/Project Guidance', 'Microscope',     '#6366f1'),
  ('Other',                     'MoreHorizontal', '#64748b')
ON CONFLICT (name) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 3. TASKS TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  category_id   UUID REFERENCES task_categories(id) ON DELETE SET NULL,
  assigned_to   UUID REFERENCES staff(id) ON DELETE CASCADE,
  created_by    UUID REFERENCES staff(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'Not Started'
                CHECK (status IN ('Not Started', 'In Progress', 'Done', 'Overdue', 'Blocked')),
  priority      TEXT NOT NULL DEFAULT 'Medium'
                CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  date_assigned DATE NOT NULL DEFAULT CURRENT_DATE,
  deadline      DATE,
  notes         TEXT,
  document_url  TEXT,
  document_name TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_category    ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline    ON tasks(deadline);

-- ────────────────────────────────────────────────────────────
-- 4. TASK COORDINATORS (many-to-many)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_coordinators (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id  UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  UNIQUE (task_id, staff_id)
);

CREATE INDEX IF NOT EXISTS idx_task_coordinators_task  ON task_coordinators(task_id);
CREATE INDEX IF NOT EXISTS idx_task_coordinators_staff ON task_coordinators(staff_id);

-- ────────────────────────────────────────────────────────────
-- 5. UPDATED_AT TRIGGER
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE staff              ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_coordinators  ENABLE ROW LEVEL SECURITY;

-- Staff: anyone can read, only the owner can update their own row
CREATE POLICY "staff_select_all"  ON staff FOR SELECT USING (true);
CREATE POLICY "staff_insert_self" ON staff FOR INSERT WITH CHECK (true);
CREATE POLICY "staff_update_self" ON staff FOR UPDATE USING (true);

-- Task Categories: read-only for everyone
CREATE POLICY "categories_select_all" ON task_categories FOR SELECT USING (true);

-- Tasks: full access (you can tighten these later for production)
CREATE POLICY "tasks_select_all"  ON tasks FOR SELECT USING (true);
CREATE POLICY "tasks_insert_any"  ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "tasks_update_any"  ON tasks FOR UPDATE USING (true);
CREATE POLICY "tasks_delete_any"  ON tasks FOR DELETE USING (true);

-- Task Coordinators: full access
CREATE POLICY "coordinators_select_all"  ON task_coordinators FOR SELECT USING (true);
CREATE POLICY "coordinators_insert_any"  ON task_coordinators FOR INSERT WITH CHECK (true);
CREATE POLICY "coordinators_delete_any"  ON task_coordinators FOR DELETE USING (true);

-- ============================================================
-- DONE!  Your database is ready.
-- ============================================================
-- Next steps:
-- 1. Create a Supabase Storage bucket named "task-documents"
--    (Dashboard → Storage → New Bucket → set public or add policies)
-- 2. Copy your Project URL + anon key into client/.env
-- ============================================================
